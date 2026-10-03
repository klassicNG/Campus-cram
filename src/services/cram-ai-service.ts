import { CramCard, CramDeck } from '../constants/cram-types';

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
];

// Adaptive session memory: tracks the currently reliable model to bypass congested endpoints
let cachedPreferredModel: string | null = null;

function decodeBase64Utf8(base64: string): string {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = '';
    let buffer = 0;
    let bits = 0;
    const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
    for (let i = 0; i < clean.length; i++) {
      const c = clean.charAt(i);
      if (c === '=') break;
      const val = chars.indexOf(c);
      if (val === -1) continue;
      buffer = (buffer << 6) | val;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        str += String.fromCharCode((buffer >> bits) & 0xff);
      }
    }
    return decodeURIComponent(escape(str));
  } catch (e) {
    try {
      return atob(base64);
    } catch {
      return '';
    }
  }
}

function cleanAndParseCards(rawText: string): CramCard[] {
  let cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // 1. Direct JSON parse
  try {
    const parsed = JSON.parse(cleaned);
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.cards)
        ? parsed.cards
        : [];
    if (list.length > 0) {
      return normalizeCards(list);
    }
  } catch (err) {}

  // 2. Bracket slice repair
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      const candidate = cleaned.slice(firstBracket, lastBracket + 1);
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeCards(parsed);
      }
    } catch (err) {}
  }

  // 3. Salvage up to last '}'
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBracket !== -1 && lastBrace !== -1 && lastBrace > firstBracket) {
    try {
      const repaired = JSON.parse(cleaned.slice(firstBracket, lastBrace + 1) + ']');
      if (Array.isArray(repaired) && repaired.length > 0) {
        return normalizeCards(repaired);
      }
    } catch (err) {}
  }

  return [];
}

function normalizeCards(rawList: any[]): CramCard[] {
  return rawList
    .filter((item) => item && typeof item === 'object' && (item.concept || item.topic))
    .map((item, idx) => ({
      id: `custom-card-${idx + 1}-${Date.now()}`,
      course: item.course || 'COURSE',
      topic: String(item.topic || 'CORE TOPIC').toUpperCase(),
      difficulty: (['High Yield', 'Exam Must-Know', 'Crucial Formula'].includes(item.difficulty)
        ? item.difficulty
        : 'High Yield') as CramCard['difficulty'],
      concept: String(item.concept || 'Key Concept'),
      recallPrompt: String(item.recallPrompt || item.question || 'Explain this principle and how to apply it.'),
      mnemonic: {
        hook: String(item.mnemonic?.hook || 'Key Recall Anchor'),
        explanation: String(item.mnemonic?.explanation || 'Associate this core term with its direct definition.'),
      },
      plainIntuition: String(item.plainIntuition || item.intuition || 'A direct plain-English summary of the concept.'),
      breakdown: Array.isArray(item.breakdown)
        ? item.breakdown.map((b: any) => `• ${String(b).replace(/^[•\-\*\s]+/, '')}`)
        : ['• Core rule and execution flow.', '• Primary trade-off to keep in mind.'],
      examTrap: String(item.examTrap || 'Watch out for boundary conditions and standard edge cases.'),
      formulaOrCode: item.formulaOrCode ? String(item.formulaOrCode) : undefined,
    }));
}

export async function generateCramDeckFromDocument(
  docsInput: { base64: string; mimeType: string; fileName?: string }[] | string,
  mimeType: string,
  fileName: string
): Promise<CramDeck> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Synapse API key is not configured. Please check your .env file.');
  }

  const prompt = `Act as an elite university examination board professor and chief examiner.
Analyze this academic course material and extract 12 to 15 HIGH-YIELD flashcard concepts designed to guarantee a student achieves at least 70% (Grade A/B) mastery on this exam.

Syllabus Coverage Strategy:
- Cover ALL major modules/sections found in this document (do not concentrate on only Chapter 1).
- Include the 4 core exam question types:
  1. Foundational Axioms & Definitions (What professors test in compulsory Question 1)
  2. Step-by-Step Mechanisms, Algorithms & Formulas (Applied problem-solving)
  3. "Distinguish Between X and Y" (Comparative analysis & trade-offs)
  4. Common Exam Pitfalls & Calculation Boundary Traps (Where students lose marks)

For each concept, provide:
1. "concept": Concise title of the concept
2. "topic": Broad subject topic or module name (e.g. "CONCURRENCY", "CONTRACT FORMATION", "NORMALIZATION")
3. "difficulty": Choose from "High Yield", "Exam Must-Know", or "Crucial Formula"
4. "recallPrompt": A targeted test-yourself challenge question to answer mentally before flipping
5. "mnemonic": An object with:
   - "hook": An acronym, rhyme, or punchy memory anchor
   - "explanation": 1 sentence explaining how to remember it
6. "plainIntuition": 1 concise sentence explaining the concept in everyday plain English (Feynman technique)
7. "breakdown": Array of 2 to 3 concise high-impact bullet points (max 15 words each)
8. "examTrap": 1 common exam pitfall, trick question, or edge-case professors love to test
9. "formulaOrCode": Optional concise formula, expression, or code snippet if relevant

CRITICAL RULES:
- Keep all explanations punchy and concise so output generates rapidly without truncation.
- Return ONLY a raw JSON array of objects with these keys. No markdown code blocks, no backticks, no introductory text.`;

  const docList: { base64: string; mimeType: string; fileName: string }[] = Array.isArray(docsInput)
    ? docsInput.map((d, idx) => ({
        base64: d.base64,
        mimeType: d.mimeType || 'application/pdf',
        fileName: d.fileName || `Document ${idx + 1}`,
      }))
    : [
        {
          base64: docsInput,
          mimeType: mimeType || 'application/pdf',
          fileName: fileName || 'Course Document',
        },
      ];

  const promptParts: any[] = [{ text: prompt }];

  for (const d of docList) {
    if (d.mimeType === 'text/plain') {
      promptParts.push({
        text: `ACADEMIC COURSE MATERIAL (${d.fileName}):\n${decodeBase64Utf8(d.base64)}`,
      });
    } else {
      promptParts.push({
        inlineData: {
          mimeType: d.mimeType,
          data: d.base64,
        },
      });
    }
  }

  // Determine model search order: try cached working model first, then the rest
  const modelQueue: string[] = [];
  if (cachedPreferredModel && CANDIDATE_MODELS.includes(cachedPreferredModel)) {
    modelQueue.push(cachedPreferredModel);
  }
  for (const m of CANDIDATE_MODELS) {
    if (!modelQueue.includes(m)) {
      modelQueue.push(m);
    }
  }

  // 90s per model timeout to give large PDFs sufficient mobile upload & ingestion headroom
  const perModelTimeoutMs = 90000;
  let lastError = '';

  const totalPayloadKb = Math.round(
    docList.reduce((acc, d) => acc + d.base64.length, 0) / 1024
  );

  for (const model of modelQueue) {
    const t0 = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), perModelTimeoutMs);

    try {
      console.log(`[CramAI] Extracting 12-15 cram cards (${totalPayloadKb} KB docs) using ${model}...`);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
              maxOutputTokens: 8192,
            },
            contents: [
              {
                parts: promptParts,
              },
            ],
          }),
        }
      );

      clearTimeout(timeoutId);
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        lastError = errJson.error?.message || `HTTP ${response.status}`;
        console.warn(`[CramAI] ${model} returned ${response.status} in ${elapsed}s: ${lastError}, falling over...`);
        if (response.status === 503 || response.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        continue;
      }

      const resData = await response.json();
      const responseText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        console.warn(`[CramAI] ${model} returned empty response, falling over...`);
        continue;
      }

      const cards = cleanAndParseCards(responseText);
      if (cards.length > 0) {
        cachedPreferredModel = model;
        console.log(`[CramAI] Successfully extracted ${cards.length} cards using ${model} in ${elapsed}s`);

        // Derive course code from filename or cards
        const cleanedTitle = fileName.replace(/\.[^/.]+$/, '').trim();
        const courseCodeMatch = cleanedTitle.match(/([A-Z]{2,4}\s*\d{3})/i);
        const courseCode = courseCodeMatch ? courseCodeMatch[0].toUpperCase() : 'UPLOAD';

        // Update cards to reflect the course code
        const finalCards = cards.map((c) => ({ ...c, course: courseCode }));

        return {
          id: `deck-${Date.now()}`,
          title: cleanedTitle,
          courseCode,
          description: `AI-extracted high-yield cram cards from ${fileName}.`,
          cardCount: finalCards.length,
          estimatedMinutes: Math.max(5, Math.round(finalCards.length * 1.2)),
          category: 'Uploaded Material',
          cards: finalCards,
        };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        lastError = 'Request timed out while analyzing large document. Please try a shorter module or syllabus handout.';
      } else {
        lastError = err?.message || 'Network timeout';
      }
      console.warn(`[CramAI] Model ${model} failed: ${lastError}`);
    }
  }

  throw new Error(`Could not generate cram deck from document: ${lastError || 'Please verify document readability.'}`);
}
