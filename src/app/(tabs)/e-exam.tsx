import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { studyStore, PastQuestionTraining } from '../../services/course-study-store';
import {
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Upload,
  FileText,
  Sparkles,
  Target,
  BarChart3,
  ChevronLeft,
  ShieldCheck,
  BookOpen,
} from 'lucide-react-native';

interface ExamQuestion {
  id: string | number;
  topic?: string;
  question: string;
  options: string[] | { id?: string; text?: string; correct?: boolean }[];
  correctAnswer: string;
  explanation?: string;
}

interface UserAnswerRecord {
  questionIndex: number;
  selectedOptionId: string;
  selectedOptionText: string;
  isCorrect: boolean;
  correctAnswerId: string;
  correctAnswerText: string;
}

function decodeBase64Utf8(base64: string): string {
  try {
    if (typeof atob === 'function') {
      return decodeURIComponent(escape(atob(base64)));
    }
  } catch (e) {
    try {
      if (typeof atob === 'function') return atob(base64);
    } catch {}
  }
  return base64;
}

function parseQuestionsFromResponse(rawText: string): ExamQuestion[] {
  let cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(cleaned);
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.questions)
        ? parsed.questions
        : [];
    if (list.length > 0) return list;
  } catch (e) {
    // direct parse failed, attempt repair
  }

  // Attempt 1: Salvage completed array items up to last '}'
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace !== -1) {
    const candidate = cleaned.slice(0, lastBrace + 1);
    const firstBracket = candidate.indexOf('[');
    if (firstBracket !== -1) {
      try {
        const repaired = JSON.parse(candidate.slice(firstBracket) + ']');
        if (Array.isArray(repaired) && repaired.length > 0) {
          return repaired;
        }
      } catch (err) {}
    }

    // Attempt 2: If wrapped in an object like { "questions": [...] }
    const firstBrace = candidate.indexOf('{');
    if (firstBrace !== -1) {
      try {
        const repairedObj = JSON.parse(candidate.slice(firstBrace) + ']}');
        if (Array.isArray(repairedObj?.questions) && repairedObj.questions.length > 0) {
          return repairedObj.questions;
        }
      } catch (err) {}
    }
  }

  // Attempt 3: Regex match individual question objects
  try {
    const objectRegex = /\{[^{}]*"question"\s*:[^{}]*"options"\s*:\s*\[[^{}]*\][^{}]*\}/gs;
    const matches = cleaned.match(objectRegex);
    if (matches && matches.length > 0) {
      const salvaged: any[] = [];
      for (const m of matches) {
        try {
          salvaged.push(JSON.parse(m));
        } catch {}
      }
      if (salvaged.length > 0) return salvaged;
    }
  } catch (err) {}

  return [];
}

// Multi-model waterfall list prioritized by speed and server availability
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

async function fetchBatchOfQuestions(
  apiKey: string,
  docsInput: { base64: string; mimeType: string; fileName?: string }[] | string,
  mimeType: string,
  count: number,
  startId: number,
  topicFocus: string,
  isInitialBatch: boolean = false,
  pastTraining?: PastQuestionTraining | null
): Promise<ExamQuestion[]> {
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

  // 60s timeout to allow large PDFs and mobile network uploads sufficient headroom
  const perModelTimeoutMs = 60000;
  let lastErrorMessage = '';

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
          fileName: 'Course Document',
        },
      ];

  const totalPayloadKb = Math.round(
    docList.reduce((acc, d) => acc + d.base64.length, 0) / 1024
  );

  for (const model of modelQueue) {
    const t0 = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), perModelTimeoutMs);

    try {
      console.log(`[NeuralCore] Requesting ${count} questions (${totalPayloadKb} KB docs) using ${model}...`);

      const promptParts: any[] = [];
      if (pastTraining) {
        promptParts.push({
          text: `Act as a strict, high-yield university examination professor.
You are provided with:
1. The official course syllabus/materials document.
2. Departmental past examination questions (${pastTraining.fileName}).

YOUR MISSION - AI FORMAT TRAINING SPECIFICATION:
- You must carefully cross-reference the past examination questions with the course syllabus document.
- RECURRING EXAM TOPICS: For concepts and questions that appear in BOTH the past questions and the course syllabus, REPEAT these past question concepts but ALTER their specific phrasing, scenarios, numerical values, or option order (do NOT copy word-for-word, but preserve the exact cognitive difficulty, question format, and distractor style).
- SYLLABUS GAPS: For key course topics present in the syllabus but NOT covered in the past questions, GENERATE new objective questions that fill these curriculum gaps while STRICTLY ADOPTING the exact examination format, tone, and distractor style demonstrated in the past questions.
- Professor Examination Style: ${pastTraining.coverageAnalysis?.styleProfile || 'Rigorous scenario questions with challenging distractors'}.

Generate exactly ${count} multiple-choice objective CBT questions focusing on: ${topicFocus}.
Assign question IDs consecutively starting from ${startId} up to ${startId + count - 1}.

CRITICAL FORMAT RULES:
1. Every question must be a multiple-choice question with exactly 4 options.
2. Return ONLY a single raw JSON array of ${count} objects (no markdown, no extra commentary).
3. Each question object must strictly have:
   - "id": integer from ${startId} to ${startId + count - 1}
   - "topic": concise topic name
   - "question": clear objective question text
   - "options": array of exactly 4 choices (e.g. ["Option A", "Option B", "Option C", "Option D"])
   - "correctAnswer": the correct option text or letter ('A', 'B', 'C', or 'D')
   - "explanation": concise 1-sentence explanation of the correct choice.
4. Keep question text, options, and explanations concise and single-sentence so they generate instantly.`,
        });
      } else {
        promptParts.push({
          text: `Act as a strict, high-yield examination board professor. Analyze the attached document and generate exactly ${count} multiple-choice objective CBT questions focusing on: ${topicFocus}.
Assign question IDs consecutively starting from ${startId} up to ${startId + count - 1}.

CRITICAL FORMAT RULES:
1. Every question must be a multiple-choice question with exactly 4 options.
2. Return ONLY a single raw JSON array of ${count} objects (no markdown, no extra commentary).
3. Each question object must strictly have:
   - "id": integer from ${startId} to ${startId + count - 1}
   - "topic": concise topic name
   - "question": clear objective question text
   - "options": array of exactly 4 choices (e.g. ["Option A", "Option B", "Option C", "Option D"])
   - "correctAnswer": the correct option text or letter ('A', 'B', 'C', or 'D')
   - "explanation": concise 1-sentence explanation of the correct choice.
4. Keep question text, options, and explanations concise and single-sentence so they generate instantly.`,
        });
      }

      for (const d of docList) {
        if (d.mimeType === 'text/plain') {
          promptParts.push({
            text: `COURSE SYLLABUS / LECTURE NOTES DOCUMENT CONTENT (${d.fileName}):\n${decodeBase64Utf8(d.base64)}`,
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

      if (pastTraining?.fileBase64) {
        if (pastTraining.mimeType === 'text/plain') {
          promptParts.push({
            text: `PAST QUESTIONS EXCERPTS:\n${decodeBase64Utf8(pastTraining.fileBase64)}`,
          });
        } else {
          promptParts.push({
            inlineData: {
              mimeType: pastTraining.mimeType || 'application/pdf',
              data: pastTraining.fileBase64,
            },
          });
        }
      } else if (pastTraining?.textContent) {
        promptParts.push({
          text: `PAST QUESTIONS EXCERPTS:\n${pastTraining.textContent}`,
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            generationConfig: {
              responseMimeType: 'application/json',
              maxOutputTokens: count <= 5 ? 2048 : 8192,
              temperature: 0.2,
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
        const err = await response.json().catch(() => ({}));
        lastErrorMessage = err.error?.message || `HTTP ${response.status}`;
        console.warn(`[NeuralCore] ${model} returned ${response.status} in ${elapsed}s: ${lastErrorMessage}, falling over...`);
        if (response.status === 503 || response.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        continue;
      }

      const data = await response.json();
      const apiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!apiText) {
        console.warn(`[NeuralCore] ${model} returned empty text, falling over...`);
        continue;
      }

      const parsed = parseQuestionsFromResponse(apiText);
      if (parsed.length > 0) {
        console.log(`[NeuralCore] Successfully generated ${parsed.length} questions via ${model} in ${elapsed}s!`);
        // Cache this successful model for rapid subsequent batches
        cachedPreferredModel = model;
        return parsed;
      } else {
        console.warn(`[NeuralCore] ${model} JSON parse yielded 0 valid questions, falling over...`);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastErrorMessage = err?.message || 'Network timeout';
      console.warn(`[NeuralCore] ${model} exception: ${lastErrorMessage}, falling over...`);
      // Continue to next model in waterfall
    }
  }

  // Surface accurate, informative diagnosis if all models failed
  if (lastErrorMessage) {
    const lower = lastErrorMessage.toLowerCase();
    if (lower.includes('network request failed') || lower.includes('network') || lower.includes('timeout') || lower.includes('abort')) {
      throw new Error('Network connection timeout. Please ensure your device has a stable internet connection and try again.');
    }
    if (lower.includes('unregistered') || lower.includes('api key') || lower.includes('403')) {
      throw new Error('API key authentication failed (HTTP 403). Please verify your Synapse API key in .env.');
    }
    if (lower.includes('base64') || lower.includes('400') || lower.includes('invalid argument')) {
      throw new Error(`Document format error: ${lastErrorMessage.slice(0, 120)}`);
    }
    if (lower.includes('demand') || lower.includes('503')) {
      throw new Error('Synapse is currently experiencing peak demand. Please retry in a few moments.');
    }
    throw new Error(`Synapse Proctoring error: ${lastErrorMessage.slice(0, 120)}`);
  }

  throw new Error(
    'Synapse is currently experiencing peak demand. Please retry in a few moments.'
  );
}

export default function EExamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    courseCode?: string;
    courseTitle?: string;
    documentTitle?: string;
    materialId?: string;
    format?: '40(test)' | '60(exam)';
    loadExisting?: string;
    autoStart?: string;
  }>();
  const courseCode = params.courseCode;
  const courseTitle = params.courseTitle;

  const [activeMode, setActiveMode] = useState<'haptic' | 'normal'>('haptic');
  const [questionFormat, setQuestionFormat] = useState<'40(test)' | '60(exam)'>(
    params.format || '40(test)'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[] | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswerRecord>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Past questions format calibration state from studyStore
  const [pastTraining, setPastTraining] = useState<PastQuestionTraining | null>(() =>
    courseCode ? studyStore.getPastQuestions(courseCode, 'cbt') : null
  );

  useEffect(() => {
    if (!courseCode) {
      setPastTraining(null);
      return;
    }
    const effectiveCode = courseCode.toUpperCase().trim();
    setPastTraining(studyStore.getPastQuestions(effectiveCode, 'cbt'));
    const unsub = studyStore.subscribe(() => {
      setPastTraining(studyStore.getPastQuestions(effectiveCode, 'cbt'));
    });
    return unsub;
  }, [courseCode]);

  // Real CBT Examination Countdown Timer
  const targetDuration = questionFormat === '40(test)' ? 30 * 60 : 40 * 60;
  const [timeLeft, setTimeLeft] = useState(1800);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    if (!isTimerRunning || isCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimerRunning(false);
          setIsCompleted(true);
          setTimeSpent(targetDuration);

          if (courseCode) {
            const currentSaved = studyStore.getCbtExam(courseCode);
            if (currentSaved) {
              studyStore.saveCbtExam(courseCode, {
                ...currentSaved,
                isCompleted: true,
                userAnswers,
              });
            }
          }

          Alert.alert('Time Up! ⏱️', 'Your CBT exam time has expired. Your responses have been automatically submitted for grading.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, isCompleted, targetDuration, courseCode, userAnswers]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDurationReadable = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const targetCount = questionFormat === '40(test)' ? 40 : 60;

  const [isBackgroundStreaming, setIsBackgroundStreaming] = useState(false);

  // Centralized generation executor
  const startExamGeneration = async (
    docsInput: { base64: string; mimeType: string; fileName?: string }[] | string,
    mimeType: string,
    formatToUse: '40(test)' | '60(exam)',
    targetCourseCode?: string,
    targetCourseTitle?: string,
    targetDocTitle?: string
  ) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
      if (!apiKey) {
        Alert.alert(
          'Configuration Required',
          'The Synapse API key is not configured. Please ensure your API key is configured in your .env file.'
        );
        return;
      }

      setIsGenerating(true);
      setQuestionFormat(formatToUse);

      const effectiveTargetCount = formatToUse === '40(test)' ? 40 : 60;
      const effectiveDuration = formatToUse === '40(test)' ? 30 * 60 : 40 * 60;
      const effectiveCode = (targetCourseCode || courseCode || '').toUpperCase().trim();
      const currentTraining = effectiveCode ? studyStore.getPastQuestions(effectiveCode, 'cbt') : null;
      setPastTraining(currentTraining);

      // 1. Instantly generate starter batch of 5 questions (~3.5-5 seconds)
      const starterCount = 5;
      const initialBatch = await fetchBatchOfQuestions(
        apiKey,
        docsInput,
        mimeType,
        starterCount,
        1,
        'Foundational definitions, introductory concepts, and primary principles',
        true,
        currentTraining
      );

      const validInitial = initialBatch.filter(
        (q: any) => q && Array.isArray(q.options) && q.options.length >= 2
      );

      if (validInitial.length === 0) {
        Alert.alert('Notice', 'No objective CBT questions could be generated from this document. Please try a clearer document or syllabus.');
        setIsGenerating(false);
        return;
      }

      const indexedInitial = validInitial.map((q, idx) => ({ ...q, id: idx + 1 }));

      // 2. Instant Start! Enter exam room immediately in ~5 seconds
      setExamQuestions(indexedInitial);
      setCurrentQIndex(0);
      setSelectedOption(null);
      setShowExplanation(false);
      setUserAnswers({});
      setIsCompleted(false);

      setTimeLeft(effectiveDuration);
      setTimeSpent(0);
      setIsTimerRunning(true);
      setIsGenerating(false);

      // Save initial exam state into studyStore so it's recorded
      studyStore.saveCbtExam(effectiveCode, {
        courseCode: effectiveCode,
        courseTitle: targetCourseTitle || courseTitle,
        format: formatToUse,
        questions: indexedInitial,
        durationSeconds: effectiveDuration,
        createdAt: Date.now(),
      });

      // Helper function to append newly arriving batches directly into the active pool
      const appendBatchToPool = (newBatch: ExamQuestion[]) => {
        const valid = newBatch.filter((q: any) => q && Array.isArray(q.options) && q.options.length >= 2);
        if (valid.length === 0) return;

        setExamQuestions((prev) => {
          const current = prev || [];
          const existingTexts = new Set(current.map((q) => q.question.toLowerCase().trim()));
          const uniqueNew = valid.filter((q) => !existingTexts.has(q.question.toLowerCase().trim()));
          if (uniqueNew.length === 0) return current;

          const merged = [...current, ...uniqueNew].map((q, idx) => ({ ...q, id: idx + 1 }));
          studyStore.saveCbtExam(effectiveCode, {
            courseCode: effectiveCode,
            courseTitle: targetCourseTitle || courseTitle,
            format: formatToUse,
            questions: merged,
            durationSeconds: effectiveDuration,
            createdAt: Date.now(),
          });
          return merged;
        });
      };

      // 3. Progressive Background Streaming of remaining questions
      const remainingTarget = effectiveTargetCount - indexedInitial.length;
      if (remainingTarget > 0) {
        setIsBackgroundStreaming(true);

        (async () => {
          try {
            if (formatToUse === '40(test)') {
              const batch1Promise = fetchBatchOfQuestions(
                apiKey,
                docsInput,
                mimeType,
                18,
                6,
                'Applied analytical concepts, procedural problems, and core relationships',
                false,
                currentTraining
              ).then((b1) => appendBatchToPool(b1)).catch((e) => console.warn('Batch 1 warning:', e));

              const batch2Promise = fetchBatchOfQuestions(
                apiKey,
                docsInput,
                mimeType,
                17,
                24,
                'Advanced synthesis, practical scenarios, and high-yield edge cases',
                false,
                currentTraining
              ).then((b2) => appendBatchToPool(b2)).catch((e) => console.warn('Batch 2 warning:', e));

              await Promise.allSettled([batch1Promise, batch2Promise]);
            } else {
              const batch1Promise = fetchBatchOfQuestions(
                apiKey,
                docsInput,
                mimeType,
                28,
                6,
                'Applied analysis, intermediate scenarios, and practical principles',
                false,
                currentTraining
              ).then((b1) => appendBatchToPool(b1)).catch((e) => console.warn('Exam Batch 1 warning:', e));

              const batch2Promise = fetchBatchOfQuestions(
                apiKey,
                docsInput,
                mimeType,
                27,
                34,
                'Comprehensive theory, complex synthesis, and exam-level edge cases',
                false,
                currentTraining
              ).then((b2) => appendBatchToPool(b2)).catch((e) => console.warn('Exam Batch 2 warning:', e));

              await Promise.allSettled([batch1Promise, batch2Promise]);
            }
          } catch (streamErr) {
            console.warn('Progressive streaming background fetch error:', streamErr);
          } finally {
            setIsBackgroundStreaming(false);
          }
        })();
      }
    } catch (error: any) {
      Alert.alert('Notice', error?.message || 'An unexpected error occurred while initializing exam questions.');
      setIsGenerating(false);
    }
  };

  // Auto-load last created exam OR auto-start generation from library course document
  useEffect(() => {
    // Case A: Load existing created exam
    if (params.loadExisting === 'true' || (courseCode && studyStore.hasCbtExam(courseCode) && params.autoStart !== 'generate')) {
      const savedExam = studyStore.getCbtExam(courseCode);
      if (savedExam && savedExam.questions && savedExam.questions.length > 0) {
        setQuestionFormat(savedExam.format);
        setExamQuestions(savedExam.questions);
        setCurrentQIndex(0);
        setSelectedOption(null);
        setShowExplanation(false);
        setUserAnswers(savedExam.userAnswers || {});
        setIsCompleted(Boolean(savedExam.isCompleted));
        const dur = savedExam.durationSeconds || (savedExam.format === '40(test)' ? 30 * 60 : 40 * 60);
        setTimeLeft(dur);
        setTimeSpent(0);
        setIsTimerRunning(!savedExam.isCompleted);
        return;
      }
    }

    // Case B: Auto-start creation directly from library course document without re-uploading
    if (params.autoStart === 'generate' && (params.materialId || courseCode)) {
      const payload = studyStore.getMaterialDocumentPayload(params.materialId || courseCode);
      if (payload && payload.base64) {
        const fmt = params.format || '40(test)';
        startExamGeneration(
          payload.base64,
          payload.mimeType,
          fmt,
          courseCode,
          courseTitle,
          params.documentTitle || payload.fileName
        );
      } else {
        Alert.alert('Notice', 'Could not locate course document data in the library.');
      }
    }
  }, [courseCode, params.loadExisting, params.autoStart, params.format]);

  const generateExamFromDocument = async () => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
      if (!apiKey) {
        Alert.alert(
          'Configuration Required',
          'The Synapse API key is not configured. Please ensure your API key is configured in your .env file.'
        );
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        multiple: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const docPayloads: { base64: string; mimeType: string; fileName: string }[] = [];
      const effectiveCode = courseCode || result.assets[0].name?.match(/^[A-Z]{2,4}\s*\d{3}/i)?.[0]?.toUpperCase() || 'CBT 301';

      for (let i = 0; i < result.assets.length; i++) {
        const file = result.assets[i];
        let rawData = '';
        try {
          rawData = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (readErr: any) {
          console.error('File read error:', readErr);
          continue;
        }

        if (!rawData || rawData.length === 0) continue;

        const cleanBase64 = rawData.replace(/(\r\n|\n|\r)/gm, '');
        const mimeType = file.mimeType || (file.name?.toLowerCase().endsWith('.txt') ? 'text/plain' : 'application/pdf');

        docPayloads.push({
          base64: cleanBase64,
          mimeType,
          fileName: file.name || `Document ${i + 1}`,
        });

        // Auto-register uploaded document into Study Library!
        studyStore.addOrUpdateMaterial({
          id: `mat-${Date.now()}-${i}`,
          courseCode: effectiveCode,
          courseTitle: courseTitle || file.name?.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') || 'Uploaded Course Document',
          documentTitle: file.name || `Syllabus_${i + 1}.pdf`,
          type: mimeType === 'text/plain' ? 'NOTES' : 'PDF',
          pages: 24,
          uploadedAt: 'Just now',
          tag: 'Exam Material',
          fileUri: file.uri,
          fileBase64: cleanBase64,
          mimeType,
        });
      }

      if (docPayloads.length === 0) {
        Alert.alert('Read Error', 'Could not read any of the selected documents. Please choose valid documents.');
        return;
      }

      await startExamGeneration(docPayloads, docPayloads[0].mimeType, questionFormat, effectiveCode, courseTitle, result.assets[0].name);
    } catch (err: any) {
      Alert.alert('Notice', err?.message || 'Could not process document.');
    }
  };

  const currentQ = examQuestions ? (examQuestions[currentQIndex] || examQuestions[0]) : null;

  // Normalize options for current question
  const normalizedOptions = Array.isArray(currentQ?.options)
    ? currentQ.options.map((option: any, index: number) => {
      const letter = String.fromCharCode(65 + index);
      if (typeof option === 'string') {
        const cleanOpt = option.trim();
        const isCorrect =
          cleanOpt === currentQ.correctAnswer ||
          letter === currentQ.correctAnswer ||
          currentQ.correctAnswer?.toLowerCase() === letter.toLowerCase() ||
          currentQ.correctAnswer?.toLowerCase() === cleanOpt.toLowerCase() ||
          cleanOpt.startsWith(`${letter}.`) ||
          cleanOpt.startsWith(`${letter})`);
        return { id: letter, text: cleanOpt, correct: isCorrect };
      }
      return {
        id: option.id || letter,
        text: option.text || String(option),
        correct: Boolean(
          option.correct ??
          (option.id === currentQ.correctAnswer || option.text === currentQ.correctAnswer)
        ),
      };
    })
    : [];

  const handleOptionPress = (optionId: string) => {
    setSelectedOption(optionId);

    const chosenOpt = normalizedOptions.find((o) => o.id === optionId);
    const correctOpt = normalizedOptions.find((o) => o.correct);
    const isCorrect = Boolean(chosenOpt?.correct);

    setUserAnswers((prev) => ({
      ...prev,
      [currentQIndex]: {
        questionIndex: currentQIndex,
        selectedOptionId: optionId,
        selectedOptionText: chosenOpt?.text || '',
        isCorrect,
        correctAnswerId: correctOpt?.id || '',
        correctAnswerText: correctOpt?.text || currentQ?.correctAnswer || '',
      },
    }));

    if (activeMode === 'haptic') {
      setShowExplanation(true);
    }
  };

  const totalQuestions = examQuestions?.length || 0;
  const isLastQuestion = Boolean(
    examQuestions &&
    currentQIndex === examQuestions.length - 1 &&
    (!isBackgroundStreaming || totalQuestions >= targetCount)
  );

  const handleNextQuestion = () => {
    if (!examQuestions || examQuestions.length === 0) return;

    if (isLastQuestion) {
      // Complete exam and show score screen!
      setIsTimerRunning(false);
      setTimeSpent(targetDuration - timeLeft);
      setIsCompleted(true);
      if (courseCode) {
        const currentSaved = studyStore.getCbtExam(courseCode);
        if (currentSaved) {
          studyStore.saveCbtExam(courseCode, {
            ...currentSaved,
            isCompleted: true,
            userAnswers,
          });
        }
      }
    } else if (currentQIndex < examQuestions.length - 1) {
      const nextIndex = currentQIndex + 1;
      setCurrentQIndex(nextIndex);
      const existingAnswer = userAnswers[nextIndex];
      setSelectedOption(existingAnswer ? existingAnswer.selectedOptionId : null);
      setShowExplanation(activeMode === 'haptic' && Boolean(existingAnswer));
    }
  };

  const handleRetakeExam = () => {
    setIsBackgroundStreaming(false);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setUserAnswers({});
    setIsCompleted(false);
    const duration = questionFormat === '40(test)' ? 30 * 60 : 40 * 60;
    setTimeLeft(duration);
    setTimeSpent(0);
    setIsTimerRunning(true);
  };

  const handleResetAll = () => {
    setIsBackgroundStreaming(false);
    setExamQuestions(null);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setUserAnswers({});
    setIsCompleted(false);
    setIsTimerRunning(false);
    setTimeLeft(questionFormat === '40(test)' ? 30 * 60 : 40 * 60);
    setTimeSpent(0);
  };

  // Performance calculations for Results Screen
  const correctCount = Object.values(userAnswers).filter((a) => a.isCorrect).length;
  const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  let gradeBadgeColor = '#059669'; // emerald
  let gradeVerdict = 'Outstanding Mastery! 🎯';
  let gradeMessage = 'You demonstrated strong comprehension of these core concepts.';

  if (scorePercentage < 50) {
    gradeBadgeColor = '#e11d48'; // rose
    gradeVerdict = 'High-Yield Review Needed 📚';
    gradeMessage = 'Re-read the document summaries to reinforce weaker concept areas.';
  } else if (scorePercentage < 75) {
    gradeBadgeColor = '#d97706'; // amber
    gradeVerdict = 'Solid Performance ⚡';
    gradeMessage = 'Good foundation! Review the missed questions below to lock in mastery.';
  }

  return (
    <SafeAreaView key="e-exam-safe-area" className="flex-1 bg-[#001524]" edges={['top', 'left', 'right']}>
      {/* State 1: Dark Loading Screen */}
      {isGenerating ? (
        <View key="generating-state" className="flex-1 bg-[#001524] items-center justify-center">
          <View className="items-center px-6">
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#0095ff" />
            </View>
            <Text className="text-lg font-bold text-white tracking-tight mb-2 text-center">
              Launching CBT Exam in ~5s...
            </Text>
            <Text className="text-xs text-white/60 text-center max-w-xs leading-5">
              Synapse is rapidly generating your starter questions. The full {targetCount}-question CBT simulation will stream progressively in the background.
            </Text>
          </View>
        </View>
      ) : !examQuestions ? (
        /* State 2: Upload Course Material Screen */
        <View key="upload-state" className="flex-1 bg-[#001524]">
          {/* Header */}
          <Animated.View entering={FadeIn.duration(450)} style={styles.header}>
            <View className="flex-row items-center justify-between mb-2">
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                }}
              >
                <ChevronLeft size={16} color="#ffffff" />
                <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '600' }}>Back</Text>
              </TouchableOpacity>

              <View className="flex-row items-center gap-2">
                <View className="rounded-md bg-[#ffa200]/20 px-2 py-0.5 border border-[#ffa200]/30">
                  <Text className="text-[9px] font-bold text-[#ffa200] uppercase tracking-wider">
                    CBT Simulator
                  </Text>
                </View>
                <Text className="text-xs text-white/60">Objective Examination</Text>
              </View>
            </View>
            <Text className="text-2xl font-bold tracking-[-0.04em] text-white">
              E-Exam Simulator
            </Text>
            <Text className="text-xs text-white/75 mt-1">
              Generate realistic multiple-choice objective exams from your syllabus or slides.
            </Text>
          </Animated.View>

          {/* Centered Upload Body with AI Trainer Suggestion */}
          <ScrollView
            className="flex-1 bg-[#f0f2f4]"
            contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* AI Trainer Suggestion or Active Calibration Banner */}
            {pastTraining ? (
              <Animated.View
                entering={ZoomIn.duration(450).springify().damping(15)}
                style={{
                  backgroundColor: '#002040',
                  borderColor: 'rgba(0, 149, 255, 0.4)',
                  borderWidth: 1,
                }}
                className="w-full rounded-2xl p-4 mb-4 shadow-md"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-6 h-6 rounded-full bg-[#0095ff]/20 items-center justify-center border border-[#0095ff]/40">
                      <ShieldCheck size={13} color="#0095ff" />
                    </View>
                    <Text className="text-white font-bold text-xs">
                      AI Format Calibrated 🎯
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/ai-trainer',
                        params: { courseCode: courseCode || '', mode: 'cbt' },
                      })
                    }
                    className="flex-row items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15"
                  >
                    <Text className="text-[11px] font-semibold text-[#89b4fa]">View AI Trainer</Text>
                    <ArrowRight size={11} color="#89b4fa" />
                  </TouchableOpacity>
                </View>

                <Text className="text-xs font-semibold text-white/90 mb-1">
                  Calibrated via {pastTraining.fileName}
                </Text>
                <Text className="text-[11px] text-white/70 leading-4 mb-2.5">
                  Generated questions will repeat recurring past questions with reformatted phrasing, and generate the rest in your professor's exact format ({pastTraining.coverageAnalysis?.syllabusCoveragePercent || 75}% syllabus match).
                </Text>

                <View className="flex-row flex-wrap gap-1.5">
                  <View className="bg-white/10 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] text-white/80 font-medium">Reformat Recurring</Text>
                  </View>
                  <View className="bg-white/10 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] text-white/80 font-medium">Fill Syllabus Gaps</Text>
                  </View>
                  <View className="bg-white/10 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] text-white/80 font-medium">Exam Distractors</Text>
                  </View>
                </View>
              </Animated.View>
            ) : (
              <Animated.View
                entering={ZoomIn.duration(450).springify().damping(15)}
                style={{
                  backgroundColor: '#00253e',
                  borderColor: 'rgba(255, 162, 0, 0.35)',
                  borderWidth: 1,
                }}
                className="w-full rounded-2xl p-4 mb-4 shadow-md"
              >
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center gap-1.5">
                    <Sparkles size={14} color="#ffa200" />
                    <Text className="text-[#ffa200] font-bold text-xs uppercase tracking-wider">
                      AI Format Training
                    </Text>
                  </View>
                  <View className="rounded-md bg-[#ffa200]/15 px-2 py-0.5 border border-[#ffa200]/25">
                    <Text className="text-[9px] font-bold text-[#ffa200]">Recommended</Text>
                  </View>
                </View>

                <Text className="text-white font-bold text-xs mb-1">
                  Want questions tailored to your professor's past exams?
                </Text>
                <Text className="text-[11px] text-white/70 leading-4 mb-3">
                  Upload departmental past questions in the AI Trainer to calibrate question difficulty, reformat recurring concepts, and fill syllabus gaps.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/ai-trainer',
                      params: { courseCode: courseCode || '', mode: 'cbt' },
                    })
                  }
                  className="w-full bg-[#ffa200]/20 border border-[#ffa200]/40 rounded-xl py-2.5 px-3 flex-row items-center justify-center gap-2"
                >
                  <Sparkles size={13} color="#ffa200" />
                  <Text className="text-[#ffa200] text-xs font-bold">
                    Train CBT Format in AI Trainer ➔
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            <Animated.View entering={FadeIn.delay(120).duration(500)} style={styles.uploadCard}>
              <View className="w-20 h-20 rounded-2xl bg-[#003c66]/10 items-center justify-center mb-4 border border-[#003c66]/20">
                <FileText size={38} color="#003c66" />
              </View>

              <Text className="text-xl font-bold text-[#0f1c24] text-center mb-1">
                Upload Course Material
              </Text>
              <Text className="text-xs text-[#8995a9] text-center leading-5 mb-5">
                Upload your lecture notes, syllabus, or course pack (.pdf, .txt) to generate targeted CBT questions.
              </Text>

              {/* Format Selector: 40(test) or 60(exam) */}
              <View className="w-full mb-5">
                <Text className="text-[11px] font-bold text-[#003c66] uppercase tracking-wider mb-2 text-center">
                  Select Question Format
                </Text>
                <View style={styles.formatToggleContainer}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setQuestionFormat('40(test)')}
                    style={[
                      styles.formatOptionButton,
                      questionFormat === '40(test)' && styles.formatOptionActive,
                    ]}
                  >
                    <Target
                      size={15}
                      color={questionFormat === '40(test)' ? '#ffffff' : '#003c66'}
                    />
                    <Text
                      style={{
                        color: questionFormat === '40(test)' ? '#ffffff' : '#003c66',
                        fontWeight: '700',
                        fontSize: 13,
                      }}
                    >
                      40(test)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setQuestionFormat('60(exam)')}
                    style={[
                      styles.formatOptionButton,
                      questionFormat === '60(exam)' && styles.formatOptionActive,
                    ]}
                  >
                    <Zap
                      size={15}
                      color={questionFormat === '60(exam)' ? '#ffffff' : '#003c66'}
                    />
                    <Text
                      style={{
                        color: questionFormat === '60(exam)' ? '#ffffff' : '#003c66',
                        fontWeight: '700',
                        fontSize: 13,
                      }}
                    >
                      60(exam)
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-[10px] text-[#8995a9] text-center mt-2 font-medium">
                  {questionFormat === '40(test)'
                    ? '40 objective questions (Standard Test format)'
                    : '60 objective questions (Comprehensive Mock Exam)'}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={generateExamFromDocument}
                style={styles.primaryButton}
              >
                <Upload size={18} color="#ffffff" />
                <Text className="text-white font-bold text-sm tracking-wide">
                  Generate {questionFormat}
                </Text>
              </TouchableOpacity>

              <View className="flex-row items-center gap-1.5 mt-5">
                <Sparkles size={13} color="#ffa200" />
                <Text className="text-[11px] font-semibold text-[#8995a9]">
                  Synapse Proctoring
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </View>
      ) : isCompleted ? (
        /* State 4: Score & Performance Results Screen */
        <View key="results-state" className="flex-1 bg-[#001524]">
          {/* Header */}
          <View style={styles.header}>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <ChevronLeft size={14} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '600' }}>Back</Text>
                </TouchableOpacity>

                <View className="rounded-md bg-[#059669]/20 px-2 py-0.5 border border-[#059669]/30">
                  <Text className="text-[9px] font-bold text-[#059669] uppercase tracking-wider">
                    {questionFormat} Completed
                  </Text>
                </View>
                <Text className="text-xs text-white/60">Performance Report</Text>
              </View>
              <TouchableOpacity
                onPress={handleResetAll}
                activeOpacity={0.7}
                className="flex-row items-center gap-1 bg-white/10 px-2 py-1 rounded-md border border-white/20"
              >
                <Upload size={11} color="#ffffff" />
                <Text className="text-[10px] font-semibold text-white">New Doc</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-2xl font-bold tracking-[-0.04em] text-white">
              CBT Exam Results
            </Text>
            <Text className="text-xs text-white/75 mt-1">
              Review your accuracy, answer breakdown, and high-yield explanations.
            </Text>
          </View>

          {/* Results Scroll Body */}
          <ScrollView
            className="flex-1 bg-[#f0f2f4] px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Score Hero Card */}
            <View style={styles.scoreHeroCard}>
              <View className="items-center mb-3">
                <View style={styles.scoreCircle}>
                  <Text className="text-3xl font-extrabold text-[#003c66]">
                    {scorePercentage}%
                  </Text>
                  <Text className="text-[10px] font-bold text-[#8995a9] tracking-wider uppercase">
                    Accuracy
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: `${gradeBadgeColor}15`,
                    borderColor: `${gradeBadgeColor}40`,
                    borderWidth: 1,
                  }}
                  className="rounded-full px-3.5 py-1 mb-2 mt-3"
                >
                  <Text style={{ color: gradeBadgeColor }} className="text-xs font-bold">
                    {gradeVerdict}
                  </Text>
                </View>

                <Text className="text-xs text-[#8995a9] text-center max-w-[280px] leading-5">
                  {gradeMessage}
                </Text>
              </View>

              {/* Stat Badges Row */}
              <View className="flex-row items-center justify-around border-t border-[#e1e5ea] pt-4 mt-2">
                <View className="items-center">
                  <Text className="text-lg font-bold text-emerald-600">{correctCount}</Text>
                  <Text className="text-[10px] font-semibold text-[#8995a9] uppercase">Correct</Text>
                </View>
                <View className="h-7 w-[1px] bg-[#e1e5ea]" />
                <View className="items-center">
                  <Text className="text-lg font-bold text-rose-600">
                    {totalQuestions - correctCount}
                  </Text>
                  <Text className="text-[10px] font-semibold text-[#8995a9] uppercase">Incorrect</Text>
                </View>
                <View className="h-7 w-[1px] bg-[#e1e5ea]" />
                <View className="items-center">
                  <Text className="text-sm font-bold text-[#003c66] mt-1">
                    {formatDurationReadable(timeSpent)}
                  </Text>
                  <Text className="text-[10px] font-semibold text-[#8995a9] uppercase">Time Used</Text>
                </View>
                <View className="h-7 w-[1px] bg-[#e1e5ea]" />
                <View className="items-center">
                  <Text className="text-sm font-bold text-[#003c66] mt-1">{questionFormat}</Text>
                  <Text className="text-[10px] font-semibold text-[#8995a9] uppercase">Format</Text>
                </View>
              </View>
            </View>

            {/* Actions: Retake & Upload New */}
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleRetakeExam}
                style={[styles.primaryButton, { flex: 1, paddingVertical: 14 }]}
              >
                <RotateCcw size={15} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Retake Exam</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleResetAll}
                style={[
                  styles.primaryButton,
                  {
                    flex: 1,
                    paddingVertical: 14,
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#003c66',
                    shadowOpacity: 0.05,
                  },
                ]}
              >
                <Upload size={15} color="#003c66" />
                <Text className="text-xs font-bold text-[#003c66]">New Document</Text>
              </TouchableOpacity>
            </View>

            {/* Detailed Question Review Section */}
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-xs font-bold uppercase tracking-wider text-[#003c66]">
                Question Analysis & Review
              </Text>
              <Text className="text-[10px] font-semibold text-[#8995a9]">
                {correctCount}/{totalQuestions} Answered Correctly
              </Text>
            </View>

            {examQuestions.map((q, idx) => {
              const answer = userAnswers[idx];
              const isUserCorrect = Boolean(answer?.isCorrect);

              return (
                <View key={idx} style={styles.reviewCard}>
                  {/* Card Header */}
                  <View className="flex-row items-center justify-between mb-2.5">
                    <View className="flex-row items-center gap-2">
                      <View className="rounded-md bg-[#001524]/5 px-2 py-0.5">
                        <Text className="text-[9px] font-bold text-[#003c66]">Q{idx + 1}</Text>
                      </View>
                      <Text className="text-[10px] font-semibold text-[#8995a9]">
                        {q.topic || 'Objective Question'}
                      </Text>
                    </View>

                    <View
                      style={{
                        backgroundColor: isUserCorrect ? 'rgba(5, 150, 105, 0.1)' : 'rgba(225, 29, 72, 0.1)',
                      }}
                      className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
                    >
                      {isUserCorrect ? (
                        <>
                          <CheckCircle2 size={12} color="#059669" />
                          <Text className="text-[10px] font-bold text-emerald-700">Correct</Text>
                        </>
                      ) : (
                        <>
                          <XCircle size={12} color="#e11d48" />
                          <Text className="text-[10px] font-bold text-rose-700">Incorrect</Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Question Text */}
                  <Text className="text-xs font-bold text-[#0f1c24] leading-5 mb-3">
                    {q.question}
                  </Text>

                  {/* Answers Display */}
                  <View className="rounded-lg bg-[#f0f2f4] p-3 mb-3 gap-2">
                    <View className="flex-row items-start gap-2">
                      <Text className="text-[10px] font-bold text-[#8995a9] w-20">Your Choice:</Text>
                      <Text
                        style={{ color: isUserCorrect ? '#059669' : '#e11d48' }}
                        className="flex-1 text-[11px] font-semibold leading-4"
                      >
                        {answer ? `${answer.selectedOptionId}. ${answer.selectedOptionText}` : 'Not Answered'}
                      </Text>
                    </View>

                    {!isUserCorrect && (
                      <View className="flex-row items-start gap-2">
                        <Text className="text-[10px] font-bold text-[#059669] w-20">Correct Answer:</Text>
                        <Text className="flex-1 text-[11px] font-bold text-[#059669] leading-4">
                          {q.correctAnswer}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Explanation */}
                  {q.explanation && (
                    <View style={styles.explanationBox}>
                      <View className="flex-row items-center gap-1 mb-1">
                        <Zap size={11} color="#003c66" />
                        <Text className="text-[9px] font-bold text-[#003c66] uppercase tracking-wider">
                          High-Yield Rationale
                        </Text>
                      </View>
                      <Text className="text-[11px] leading-4 text-[#0f1c24] font-medium">
                        {q.explanation}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        /* State 3: Active CBT Exam Simulator Screen */
        <View key="exam-state" className="flex-1 bg-[#001524]">
          {/* Streamlined Minimalist CBT Header */}
          <View style={styles.examHeaderMinimal}>
            <View className="flex-row items-center justify-between">
              {/* Left: Question Counter & Subtle Sync Badge */}
              <View className="flex-row items-center gap-2">
                <View className="rounded-md bg-white/10 px-2.5 py-1">
                  <Text className="text-xs font-bold text-white tracking-wide">
                    {courseCode ? `${courseCode} · ` : ''}Q{currentQIndex + 1} OF {examQuestions?.length || targetCount}
                  </Text>
                </View>
                {pastTraining && (
                  <View className="flex-row items-center gap-1 bg-[#0095ff]/15 border border-[#0095ff]/30 px-2 py-0.5 rounded-full">
                    <Sparkles size={9} color="#0095ff" />
                    <Text className="text-[10px] font-semibold text-[#0095ff]">Format Trained</Text>
                  </View>
                )}
                {isBackgroundStreaming && (
                  <View className="flex-row items-center gap-1.5 bg-[#0095ff]/15 border border-[#0095ff]/30 px-2 py-0.5 rounded-full">
                    <ActivityIndicator size={8} color="#0095ff" />
                    <Text className="text-[10px] font-semibold text-[#0095ff]">
                      Syncing ({examQuestions?.length || 0}/{targetCount})
                    </Text>
                  </View>
                )}
              </View>

              {/* Right: Countdown Timer Badge & Exit Action */}
              <View className="flex-row items-center gap-2">
                <View
                  style={{
                    backgroundColor: timeLeft <= 300 ? 'rgba(225, 29, 72, 0.25)' : 'rgba(255, 162, 0, 0.15)',
                    borderColor: timeLeft <= 300 ? 'rgba(225, 29, 72, 0.6)' : 'rgba(255, 162, 0, 0.4)',
                    borderWidth: 1,
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Clock size={12} color={timeLeft <= 300 ? '#f43f5e' : '#ffa200'} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: timeLeft <= 300 ? '#f43f5e' : '#ffffff',
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {formatTime(timeLeft)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Exit Exam?',
                      'Are you sure you want to end this exam session? Current progress will be reset.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Exit Exam', style: 'destructive', onPress: handleResetAll },
                      ]
                    );
                  }}
                  activeOpacity={0.7}
                  className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15"
                >
                  <Text className="text-[11px] font-semibold text-white/80">Exit</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sleek, thin 2px Progress Line */}
            <View className="w-full h-1 bg-white/10 rounded-full mt-2.5 overflow-hidden">
              <View
                style={{
                  width: `${Math.min(100, ((currentQIndex + 1) / targetCount) * 100)}%`,
                  backgroundColor: '#ffa200',
                  height: '100%',
                  borderRadius: 999,
                }}
              />
            </View>
          </View>

          {/* Main Content Body */}
          <ScrollView
            className="flex-1 bg-[#f0f2f4] px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Mode Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setActiveMode('haptic');
                  setShowExplanation(Boolean(selectedOption));
                }}
                style={[
                  styles.toggleButton,
                  { backgroundColor: activeMode === 'haptic' ? '#003c66' : 'transparent' },
                ]}
              >
                <Zap size={14} color={activeMode === 'haptic' ? '#ffffff' : '#8995a9'} />
                <Text
                  className="text-xs font-bold"
                  style={{ color: activeMode === 'haptic' ? '#ffffff' : '#8995a9' }}
                >
                  Haptic Feedback
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setActiveMode('normal');
                  setShowExplanation(false);
                }}
                style={[
                  styles.toggleButton,
                  { backgroundColor: activeMode === 'normal' ? '#003c66' : 'transparent' },
                ]}
              >
                <Clock size={14} color={activeMode === 'normal' ? '#ffffff' : '#8995a9'} />
                <Text
                  className="text-xs font-bold"
                  style={{ color: activeMode === 'normal' ? '#ffffff' : '#8995a9' }}
                >
                  Strict CBT Mode
                </Text>
              </TouchableOpacity>
            </View>

            {/* Question Card */}
            <View style={styles.questionCard}>
              <View className="flex-row items-center justify-between mb-3">
                <View className="self-start rounded-md bg-[#001524]/5 px-2 py-1">
                  <Text className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8995a9]">
                    {currentQ?.topic || 'QUESTION'}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <BarChart3 size={13} color="#8995a9" />
                  <Text className="text-[10px] text-[#8995a9] font-semibold">
                    CBT Multiple Choice
                  </Text>
                </View>
              </View>

              <Text className="text-base font-bold text-[#0f1c24] leading-6 mb-1">
                {currentQ?.question}
              </Text>
            </View>

            {/* Options List */}
            {normalizedOptions.length > 0 && (
              <View className="flex-col gap-3 mb-5">
                {normalizedOptions.map((option: { id: string; text: string; correct: boolean }) => {
                  const isSelected = selectedOption === option.id;
                  const isHapticFeedback = activeMode === 'haptic' && selectedOption !== null;
                  const isCorrectOption = option.correct;

                  let optionCardExtraStyle: ViewStyle | null = null;
                  let badgeExtraStyle: ViewStyle | null = null;
                  let textColor = '#0f1c24';
                  let badgeTextColor = '#003c66';

                  if (isSelected) {
                    optionCardExtraStyle = styles.optionSelected;
                    badgeExtraStyle = styles.badgeSelected;
                    badgeTextColor = '#ffffff';
                  }

                  if (isHapticFeedback) {
                    if (isCorrectOption) {
                      optionCardExtraStyle = styles.optionCorrect;
                      badgeExtraStyle = styles.badgeCorrect;
                      textColor = '#065f46';
                      badgeTextColor = '#ffffff';
                    } else if (isSelected && !isCorrectOption) {
                      optionCardExtraStyle = styles.optionWrong;
                      badgeExtraStyle = styles.badgeWrong;
                      textColor = '#9f1239';
                      badgeTextColor = '#ffffff';
                    }
                  }

                  return (
                    <TouchableOpacity
                      key={option.id}
                      activeOpacity={0.8}
                      onPress={() => handleOptionPress(option.id)}
                      style={[styles.optionBase, optionCardExtraStyle]}
                    >
                      <View style={[styles.badgeBase, badgeExtraStyle]}>
                        <Text
                          className="text-xs font-bold"
                          style={{ color: badgeTextColor }}
                        >
                          {option.id}
                        </Text>
                      </View>
                      <Text
                        className="flex-1 text-xs leading-5 font-semibold"
                        style={{ color: textColor }}
                      >
                        {option.text}
                      </Text>
                      {isHapticFeedback && isCorrectOption && (
                        <View className="ml-2">
                          <CheckCircle2 size={18} color="#059669" />
                        </View>
                      )}
                      {isHapticFeedback && isSelected && !isCorrectOption && (
                        <View className="ml-2">
                          <XCircle size={18} color="#e11d48" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Instant Explanation / Answer Box (Haptic Mode Only) */}
            {activeMode === 'haptic' && showExplanation && (currentQ?.explanation || currentQ?.correctAnswer) && (
              <View style={styles.explanationBox}>
                <View className="flex-row items-center gap-1.5 mb-1.5">
                  <Zap size={14} color="#003c66" />
                  <Text className="text-xs font-bold text-[#003c66] uppercase tracking-wider">
                    Instant AI Haptic Explanation
                  </Text>
                </View>
                <Text className="text-xs leading-5 text-[#0f1c24] font-medium">
                  {currentQ?.explanation || `Correct Answer: ${currentQ?.correctAnswer}`}
                </Text>
              </View>
            )}

            {/* Action Button: Next Question or Finish Exam */}
            {selectedOption && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleNextQuestion}
                disabled={currentQIndex === examQuestions.length - 1 && isBackgroundStreaming}
                style={[
                  styles.primaryButton,
                  isLastQuestion && { backgroundColor: '#059669' },
                  currentQIndex === examQuestions.length - 1 && isBackgroundStreaming && { opacity: 0.8 },
                ]}
              >
                {currentQIndex === examQuestions.length - 1 && isBackgroundStreaming ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-xs font-bold text-white">
                      Streaming next questions...
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text className="text-xs font-bold text-white">
                      {isLastQuestion ? 'Finish Exam & View Score' : 'Next Question'}
                    </Text>
                    <ArrowRight size={16} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#001524',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  examHeaderMinimal: {
    backgroundColor: '#001524',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  loadingBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 60, 102, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 149, 255, 0.3)',
    shadowColor: '#0095ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  uploadCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  formatToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 21, 36, 0.05)',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5ea',
  },
  formatOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 9,
  },
  formatOptionActive: {
    backgroundColor: '#003c66',
    shadowColor: '#003c66',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  scoreHeroCard: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e5ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  scoreCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(0, 60, 102, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#003c66',
  },
  reviewCard: {
    borderRadius: 14,
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e1e5ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#003c66',
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#003c66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  toggleContainer: {
    marginBottom: 18,
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 5,
    borderWidth: 1,
    borderColor: '#e1e5ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  questionCard: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  optionBase: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  optionSelected: {
    backgroundColor: 'rgba(0, 60, 102, 0.05)',
    borderColor: '#003c66',
  },
  optionCorrect: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  optionWrong: {
    backgroundColor: '#fff1f2',
    borderColor: '#f43f5e',
  },
  badgeBase: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0, 21, 36, 0.06)',
  },
  badgeSelected: {
    backgroundColor: '#003c66',
  },
  badgeCorrect: {
    backgroundColor: '#059669',
  },
  badgeWrong: {
    backgroundColor: '#e11d48',
  },
  explanationBox: {
    borderRadius: 10,
    backgroundColor: 'rgba(0, 60, 102, 0.07)',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 60, 102, 0.18)',
    marginBottom: 16,
  },
});
