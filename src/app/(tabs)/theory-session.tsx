import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import Animated, { SlideInDown, SlideInUp, FadeInLeft, FadeInRight, FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { studyStore, PastQuestionTraining } from '../../services/course-study-store';
import {
  FileText,
  Camera,
  Upload,
  Sparkles,
  Focus,
  RefreshCcw,
  X,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  School,
  GraduationCap,
  Play,
  FileCheck2,
  ShieldCheck,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react-native';
import {
  FUTMINNA_SAMPLE_EXAM,
  TheoryExamPaper,
  QuestionGradingResult,
} from '../../constants/sample-theory-exams';

// Resilient multi-pool model waterfall prioritized for speed, high capacity, and demand failover
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

function normalizeTheoryExamQuestions(paper: TheoryExamPaper): TheoryExamPaper {
  if (!paper || !Array.isArray(paper.questions)) return paper;

  const normalizedQuestions = paper.questions.map((q, qIdx) => {
    const qNum = q.questionNumber || qIdx + 1;
    let subs = Array.isArray(q.subQuestions) ? [...q.subQuestions] : [];

    if (subs.length === 0) {
      subs = [
        {
          id: `${qNum}a`,
          label: '(a)',
          prompt: `Critically define and explain the foundational architecture, theoretical definitions, and core principles of ${q.topic || 'this subject'}.`,
          marks: 6,
          rubricKeyPoints: [
            'Rigorous theoretical definitions and accurate technical terminology',
            'Clear conceptual explanation of underlying mechanics',
            'Contextual relationship to the core course curriculum',
          ],
          modelAnswerSnippet: 'Fundamental definitions and system concepts rigorously explained using standard academic terminology.',
        },
        {
          id: `${qNum}b`,
          label: '(b)',
          prompt: `Provide the mathematical derivation, algorithmic proof, or step-by-step analytical formulations for ${q.topic || 'the system mechanism'}.`,
          marks: 8,
          rubricKeyPoints: [
            'Formal mathematical or algorithmic formulation and notation',
            'Systematic step-by-step proof without omitted transitions',
            'Identification of boundary conditions, base cases, and invariants',
          ],
          modelAnswerSnippet: 'Step-by-step mathematical proof or algorithmic derivation detailing intermediate states and boundary invariants.',
        },
        {
          id: `${qNum}c`,
          label: '(c)',
          prompt: `Critically analyze the performance trade-offs, real-world constraints, and practical optimizations of ${q.topic || 'these approaches'} with an illustrative example.`,
          marks: 6,
          rubricKeyPoints: [
            'Technical trade-off analysis comparing alternative strategies',
            'Concrete real-world example, counter-example, or architectural diagram',
            'Critical reflection on bottlenecks and practical optimizations',
          ],
          modelAnswerSnippet: 'Comprehensive comparative analysis highlighting practical constraints, trade-offs, and optimization strategies.',
        },
      ];
    } else if (subs.length === 1) {
      const baseMarks = q.totalMarks || 20;
      const m1 = 6;
      const m2 = 8;
      const m3 = 6;
      subs = [
        {
          ...subs[0],
          id: `${qNum}a`,
          label: '(a)',
          marks: m1,
        },
        {
          id: `${qNum}b`,
          label: '(b)',
          prompt: `Provide the mathematical derivation, algorithmic pseudocode, or analytical proof illustrating the mechanics of ${q.topic}.`,
          marks: m2,
          rubricKeyPoints: [
            'Accurate notation and derivation steps',
            'Formal algorithmic pseudocode or recurrence steps',
            'Boundary checks and invariant validations',
          ],
          modelAnswerSnippet: 'Formal derivation and algorithmic steps clearly presented with correct notation.',
        },
        {
          id: `${qNum}c`,
          label: '(c)',
          prompt: `Critically evaluate the performance trade-offs, practical constraints, and real-world optimizations for ${q.topic}.`,
          marks: m3,
          rubricKeyPoints: [
            'Detailed comparative analysis of trade-offs',
            'Concrete real-world scenario or illustrative diagram',
            'Practical implementation considerations',
          ],
          modelAnswerSnippet: 'Comparative trade-offs and practical evaluation clearly supported with concrete examples.',
        },
      ];
    } else if (subs.length === 2) {
      subs = [
        {
          ...subs[0],
          id: `${qNum}a`,
          label: '(a)',
          marks: 6,
        },
        {
          ...subs[1],
          id: `${qNum}b`,
          label: '(b)',
          marks: 8,
        },
        {
          id: `${qNum}c`,
          label: '(c)',
          prompt: `Critically evaluate the practical trade-offs, real-world constraints, and system optimizations related to ${q.topic}. Include illustrative examples.`,
          marks: 6,
          rubricKeyPoints: [
            'In-depth comparative analysis and trade-offs',
            'Efficiency bottlenecks and optimization heuristics',
            'Concrete real-world application or illustrative case study',
          ],
          modelAnswerSnippet: 'Systematic analysis of trade-offs, efficiency bottlenecks, and realistic optimizations.',
        },
      ];
    } else {
      const labels = ['(a)', '(b)', '(c)'];
      const markSplits = [6, 8, 6];
      subs = subs.slice(0, 3).map((sq, sIdx) => ({
        ...sq,
        id: `${qNum}${['a', 'b', 'c'][sIdx]}`,
        label: labels[sIdx],
        marks: sq.marks || markSplits[sIdx],
      }));
    }

    // Ensure sum of marks equals exactly 20
    const sumMarks = subs.reduce((acc, curr) => acc + (curr.marks || 0), 0);
    if (sumMarks !== 20) {
      subs[0].marks = 6;
      subs[1].marks = 8;
      subs[2].marks = 6;
    }

    return {
      ...q,
      id: q.id || qNum,
      questionNumber: qNum,
      totalMarks: 20,
      subQuestions: subs,
    };
  });

  return {
    ...paper,
    questions: normalizedQuestions,
  };
}

function cleanAndParseTheoryExam(rawText: string): TheoryExamPaper | null {
  let cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // 1. Direct JSON parse
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      return normalizeTheoryExamQuestions(parsed as TheoryExamPaper);
    }
  } catch (e) {}

  // 2. Bracket repair for questions array
  try {
    const questionsIndex = cleaned.indexOf('"questions"');
    if (questionsIndex !== -1) {
      const firstBracket = cleaned.indexOf('[', questionsIndex);
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBracket !== -1 && lastBrace !== -1) {
        const candidate = cleaned.slice(0, lastBrace + 1) + ']}';
        const parsed = JSON.parse(candidate);
        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return normalizeTheoryExamQuestions(parsed as TheoryExamPaper);
        }
      }
    }
  } catch (e) {}

  // 3. Salvage individual question objects with subQuestions
  try {
    const qMatches = cleaned.match(/\{\s*"id"\s*:[^}]+"subQuestions"\s*:\s*\[[\s\S]*?\]\s*\}/g);
    if (qMatches && qMatches.length > 0) {
      const questions: any[] = [];
      for (const qStr of qMatches) {
        try {
          questions.push(JSON.parse(qStr));
        } catch {}
      }
      if (questions.length > 0) {
        const rawPaper: TheoryExamPaper = {
          id: `custom-exam-${Date.now()}`,
          institution: 'UNIVERSITY EXAMINATION BOARD',
          facultyOrSchool: 'Faculty of Sciences & Academic Studies',
          department: 'Department of Examinations',
          academicSession: '2024/2025 Session',
          semester: 'First Semester Examination',
          courseCode: 'THEORY',
          courseTitle: 'Comprehensive Theory Examination',
          creditUnits: 3,
          timeAllowedMinutes: 120,
          instructions: 'Answer any FOUR (4) questions. All questions carry equal marks (20 Marks each). Write neatly on paper.',
          questions,
        };
        return normalizeTheoryExamQuestions(rawPaper);
      }
    }
  } catch (e) {}

  return null;
}

export default function TheorySessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    courseCode?: string;
    courseTitle?: string;
    documentTitle?: string;
    materialId?: string;
    loadExisting?: string;
    autoStart?: string;
  }>();
  const courseCode = params.courseCode;
  const courseTitle = params.courseTitle;

  // Screen mode: 'lobby' | 'exam' | 'scanner'
  const [viewMode, setViewMode] = useState<'lobby' | 'exam' | 'scanner'>('lobby');

  // Active examination data
  const [activeExam, setActiveExam] = useState<TheoryExamPaper>(FUTMINNA_SAMPLE_EXAM);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);

  // Examination countdown timer (defaults to 120 minutes)
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(120 * 60);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  // Custom Syllabus / Document Synthesis state
  const [isSynthesizingExam, setIsSynthesizingExam] = useState<boolean>(false);
  const [customUniversityName, setCustomUniversityName] = useState<string>('');
  const [customCourseCode, setCustomCourseCode] = useState<string>('');

  // Past questions format calibration state from studyStore
  const [pastTheoryTraining, setPastTheoryTraining] = useState<PastQuestionTraining | null>(() =>
    courseCode ? studyStore.getPastQuestions(courseCode, 'theory') : null
  );

  useEffect(() => {
    const code = (courseCode || customCourseCode || '').toUpperCase().trim();
    if (!code) {
      setPastTheoryTraining(null);
      return;
    }
    setPastTheoryTraining(studyStore.getPastQuestions(code, 'theory'));
    const unsub = studyStore.subscribe(() => {
      setPastTheoryTraining(studyStore.getPastQuestions(code, 'theory'));
    });
    return unsub;
  }, [courseCode, customCourseCode]);

  // Scanner & camera state
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [capturedImageMimeType, setCapturedImageMimeType] = useState<string>('image/jpeg');
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [gradingProgressText, setGradingProgressText] = useState<string>('');

  // Graded Submissions Map: questionId -> QuestionGradingResult
  const [submissions, setSubmissions] = useState<Record<number, QuestionGradingResult>>({});
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  // Synthesize exam paper from base64 document
  const synthesizeExamFromCleanBase64 = async (
    docsInput: { base64: string; mimeType: string; fileName?: string }[] | string,
    mimeTypeOverride?: string,
    cCode?: string,
    cTitle?: string,
    instNameOverride?: string
  ) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
      if (!apiKey) {
        Alert.alert(
          'Configuration Required',
          'The Synapse API key is not configured. Please check your .env file.'
        );
        return;
      }

      setIsSynthesizingExam(true);

      const instName = instNameOverride || customUniversityName.trim() || 'UNIVERSITY EXAMINATION BOARD';
      const targetCode = (cCode || customCourseCode.trim() || courseCode || '').toUpperCase().trim();
      const theoryTraining = targetCode ? studyStore.getPastQuestions(targetCode, 'theory') : null;

      let prompt = '';
      if (theoryTraining) {
        prompt = `Act as an official University Examination Board committee for ${instName}.
You are provided with:
1. The official course lecture notes/syllabus document.
2. Authentic university past examination paper (${theoryTraining.fileName}).

YOUR MISSION - AI FORMAT TRAINING SPECIFICATION:
- Carefully cross-reference the university past exam paper with the course syllabus document.
- RECURRING UNIVERSITY EXAM CONCEPTS: For core topics appearing in both the past exam paper and the course syllabus, REPEAT these past question concepts but ALTER their specific theoretical framing, proof angle, system constraints, or numerical values. Do NOT copy verbatim, but preserve the exact depth, multi-part sub-question structure (e.g. (a) 6 marks, (b) 8 marks, (c) 6 marks), and rigorous marking rubric.
- SYLLABUS GAPS: For key topics in the syllabus NOT covered in the past exam paper, GENERATE new multi-part theory questions that fill these curriculum gaps while STRICTLY ADOPTING the exact university style, mark allocations, and marking rubric rigor demonstrated in the past paper.
- Calibrated Professor Style: ${theoryTraining.coverageAnalysis?.styleProfile || 'Rigorous multi-part theoretical proofs, system comparisons, and mathematical derivations with strict mark rubrics'}.

REQUIREMENTS:
1. Create exactly 6 multi-part theory questions (Questions 1, 2, 3, 4, 5, 6).
2. Each question carries exactly 20 marks total and MUST ALWAYS HAVE EXACTLY THREE (3) SUB-QUESTIONS: (a), (b), and (c). Every question must strictly include all three parts (a), (b), and (c).
3. For each sub-question, provide:
   - "id": e.g. "1a", "1b", "1c"
   - "label": strictly "(a)", "(b)", or "(c)"
   - "prompt": clear theoretical/mathematical/analytical essay question prompt
   - "marks": integer marks (e.g. 6 for (a), 8 for (b), 6 for (c) summing to 20 for that question)
   - "rubricKeyPoints": array of 3-4 bullet points indicating what examiners look for
   - "modelAnswerSnippet": 1-2 sentence core model solution outline.
4. Output STRICTLY a valid JSON object matching this schema (no markdown, no backticks):
{
  "id": "custom-exam-${Date.now()}",
  "institution": "${instName}",
  "facultyOrSchool": "Faculty of Sciences & Academic Studies",
  "department": "Department of Academic Studies",
  "academicSession": "2024/2025 Academic Session",
  "semester": "First Semester Examination",
  "courseCode": "${targetCode || 'THEORY'}",
  "courseTitle": "${cTitle || 'Comprehensive Theory Examination'}",
  "creditUnits": 3,
  "timeAllowedMinutes": 120,
  "instructions": "Answer any FOUR (4) questions. All questions carry equal marks (20 Marks each). Write neatly on paper.",
  "isSampleCaseStudy": false,
  "questions": [ ...6 question objects with "id", "questionNumber" (1 to 6), "topic", "totalMarks": 20, "instructions", "subQuestions" containing exactly 3 items: (a), (b), and (c) ]
}`;
      } else {
        prompt = `Act as an official University Examination Board committee for ${instName}.
Analyze the attached course document and synthesize an authentic, rigorous university theory examination paper for ${targetCode || 'the course'}.

REQUIREMENTS:
1. Create exactly 6 multi-part theory questions (Questions 1, 2, 3, 4, 5, 6).
2. Each question carries exactly 20 marks total and MUST ALWAYS HAVE EXACTLY THREE (3) SUB-QUESTIONS: (a), (b), and (c). Every question must strictly include all three parts (a), (b), and (c).
3. For each sub-question, provide:
   - "id": e.g. "1a", "1b", "1c"
   - "label": strictly "(a)", "(b)", or "(c)"
   - "prompt": clear theoretical/mathematical/analytical essay question prompt
   - "marks": integer marks (e.g. 6 for (a), 8 for (b), 6 for (c) summing to 20 for that question)
   - "rubricKeyPoints": array of 3-4 bullet points indicating what examiners look for
   - "modelAnswerSnippet": 1-2 sentence core model solution outline.
4. Output STRICTLY a valid JSON object matching this schema (no markdown, no backticks):
{
  "id": "custom-exam-${Date.now()}",
  "institution": "${instName}",
  "facultyOrSchool": "Faculty of Sciences & Academic Studies",
  "department": "Department of Academic Studies",
  "academicSession": "2024/2025 Academic Session",
  "semester": "First Semester Examination",
  "courseCode": "${targetCode || 'THEORY'}",
  "courseTitle": "${cTitle || 'Comprehensive Theory Examination'}",
  "creditUnits": 3,
  "timeAllowedMinutes": 120,
  "instructions": "Answer any FOUR (4) questions. All questions carry equal marks (20 Marks each). Write neatly on paper.",
  "isSampleCaseStudy": false,
  "questions": [ ...6 question objects with "id", "questionNumber" (1 to 6), "topic", "totalMarks": 20, "instructions", "subQuestions" containing exactly 3 items: (a), (b), and (c) ]
}`;
      }

      const promptParts: any[] = [{ text: prompt }];

      const docList: { base64: string; mimeType: string; fileName: string }[] = Array.isArray(docsInput)
        ? docsInput.map((d, idx) => ({
            base64: d.base64,
            mimeType: d.mimeType || 'application/pdf',
            fileName: d.fileName || `Document ${idx + 1}`,
          }))
        : [
            {
              base64: docsInput,
              mimeType: mimeTypeOverride || 'application/pdf',
              fileName: 'Course Document',
            },
          ];

      for (const d of docList) {
        if (d.mimeType === 'text/plain') {
          promptParts.push({
            text: `COURSE LECTURE NOTES / SYLLABUS CONTENT (${d.fileName}):\n${decodeBase64Utf8(d.base64)}`,
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

      if (theoryTraining?.fileBase64) {
        if (theoryTraining.mimeType === 'text/plain') {
          promptParts.push({
            text: `UNIVERSITY PAST EXAM PAPER SAMPLES:\n${decodeBase64Utf8(theoryTraining.fileBase64)}`,
          });
        } else {
          promptParts.push({
            inlineData: {
              mimeType: theoryTraining.mimeType || 'application/pdf',
              data: theoryTraining.fileBase64,
            },
          });
        }
      } else if (theoryTraining?.textContent) {
        promptParts.push({
          text: `UNIVERSITY PAST EXAM PAPER SAMPLES:\n${theoryTraining.textContent}`,
        });
      }

      let generatedExam: TheoryExamPaper | null = null;
      let lastApiError = '';

      const modelQueue: string[] = [];
      if (cachedPreferredModel && CANDIDATE_MODELS.includes(cachedPreferredModel)) {
        modelQueue.push(cachedPreferredModel);
      }
      for (const m of CANDIDATE_MODELS) {
        if (!modelQueue.includes(m)) {
          modelQueue.push(m);
        }
      }

      for (const model of modelQueue) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
          console.log(`[TheoryEngine] Attempting exam synthesis with ${model}...`);
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                generationConfig: {
                  responseMimeType: 'application/json',
                  maxOutputTokens: 8192,
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

          if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            lastApiError = errJson?.error?.message || `HTTP ${response.status}`;
            console.warn(`[TheoryEngine] ${model} returned ${response.status}: ${lastApiError}`);
            if (response.status === 503 || response.status === 429) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            continue;
          }

          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = cleanAndParseTheoryExam(text);
            if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
              generatedExam = parsed;
              cachedPreferredModel = model;
              break;
            }
          }
        } catch (modelErr: any) {
          clearTimeout(timeoutId);
          console.warn(`[TheoryEngine] Model ${model} failed:`, modelErr);
          lastApiError = modelErr?.message || 'Network timeout or connection error.';
        }
      }

      if (generatedExam) {
        setActiveExam(generatedExam);
        setSelectedQuestionIndex(0);
        setTimeRemainingSeconds(generatedExam.timeAllowedMinutes * 60);
        setIsTimerActive(true);
        setSubmissions({});
        setViewMode('exam');

        // Save generated theory paper to studyStore
        const saveKey = targetCode || 'THEORY';
        studyStore.saveCustomTheoryPaper(saveKey, generatedExam);
        Alert.alert('Examination Ready! 🎓', `Synthesized ${generatedExam.questions.length} university-grade questions from your syllabus.`);
      } else {
        const isCapacity =
          lastApiError.includes('demand') ||
          lastApiError.includes('temporary') ||
          lastApiError.includes('503') ||
          lastApiError.includes('429');
        Alert.alert(
          'Notice',
          isCapacity
            ? 'Synapse is currently experiencing heavy network traffic. Please try again in a moment.'
            : lastApiError
            ? `Could not synthesize questions: ${lastApiError}. Please ensure the file contains readable lecture or syllabus text.`
            : 'Could not synthesize questions from the document. Please ensure the file contains readable lecture or syllabus text.'
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'An unexpected error occurred.');
    } finally {
      setIsSynthesizingExam(false);
    }
  };

  // Auto-bind to course theory exam paper OR auto-start from stored library document
  useEffect(() => {
    // Case A: Load existing created theory exam
    if (params.loadExisting === 'true' || (courseCode && studyStore.hasTheoryExam(courseCode) && params.autoStart !== 'generate')) {
      const paper = studyStore.getTheoryPaperForCourse(courseCode);
      if (paper) {
        setActiveExam(paper);
        setSelectedQuestionIndex(0);
        setTimeRemainingSeconds(paper.timeAllowedMinutes * 60);
        setViewMode('exam');
        setIsTimerActive(true);
        return;
      }
    }

    // Case B: Auto-start creation directly from library course document without re-uploading
    if (params.autoStart === 'generate' && (params.materialId || courseCode)) {
      const payload = studyStore.getMaterialDocumentPayload(params.materialId || courseCode);
      if (payload && payload.base64) {
        synthesizeExamFromCleanBase64(
          payload.base64,
          payload.mimeType,
          courseCode,
          courseTitle
        );
      } else {
        Alert.alert('Notice', 'Could not locate course document data in the library.');
      }
    }
  }, [courseCode, params.loadExisting, params.autoStart]);

  // Timer countdown hook
  useEffect(() => {
    if (!isTimerActive || viewMode === 'lobby') return;

    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerActive(false);
          Alert.alert(
            'Exam Time Expired ⏱️',
            'The allotted examination period has ended. Submit your handwritten answer sheets for professor evaluation.'
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, viewMode]);

  const formatTimer = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Launch Preloaded Case Study (FUTMINNA)
  const handleLaunchFutminnaExam = () => {
    setActiveExam(FUTMINNA_SAMPLE_EXAM);
    setSelectedQuestionIndex(0);
    setTimeRemainingSeconds(FUTMINNA_SAMPLE_EXAM.timeAllowedMinutes * 60);
    setIsTimerActive(true);
    setSubmissions({});
    setViewMode('exam');
  };

  // 2. Synthesize Exam from Custom Course Document (Any University Worldwide)
  const handleUploadCourseDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        multiple: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const docPayloads: { base64: string; mimeType: string; fileName: string }[] = [];
      const effectiveCode =
        customCourseCode.trim().toUpperCase() ||
        courseCode ||
        result.assets[0].name?.match(/^[A-Z]{2,4}\s*\d{3}/i)?.[0]?.toUpperCase() ||
        'ACAD 301';

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

        const cleanBase64 = rawData.replace(/(\r\n|\n|\r)/gm, '');
        const mimeType = file.mimeType || (file.name?.toLowerCase().endsWith('.txt') ? 'text/plain' : 'application/pdf');

        docPayloads.push({
          base64: cleanBase64,
          mimeType,
          fileName: file.name || `Document ${i + 1}`,
        });

        // Auto-register uploaded document into Library
        studyStore.addOrUpdateMaterial({
          id: `mat-${Date.now()}-${i}`,
          courseCode: effectiveCode,
          courseTitle: courseTitle || file.name?.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') || 'Theory Course Material',
          documentTitle: file.name || `Theory_Document_${i + 1}.pdf`,
          type: mimeType === 'text/plain' ? 'NOTES' : 'PDF',
          pages: 20,
          uploadedAt: 'Just now',
          tag: 'Theory Syllabus',
          fileUri: file.uri,
          fileBase64: cleanBase64,
          mimeType,
        });
      }

      if (docPayloads.length === 0) {
        Alert.alert('Read Error', 'Could not read any of the selected files. Please retry.');
        return;
      }

      await synthesizeExamFromCleanBase64(docPayloads, undefined, effectiveCode, courseTitle);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'An unexpected error occurred.');
    }
  };

  // 3. Camera capture trigger
  const handleCapturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      let base64 = photo?.base64;
      if (!base64 && photo?.uri) {
        try {
          base64 = await FileSystem.readAsStringAsync(photo.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (readErr) {
          console.error('Failed to read captured photo URI as base64:', readErr);
        }
      }

      if (base64) {
        const cleanBase64 = base64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '').trim();
        setCapturedImage(cleanBase64);
        setCapturedImageUri(photo?.uri || null);
        setCapturedImageMimeType('image/jpeg');
      } else {
        Alert.alert('Camera Error', 'Could not read captured image. Please try again.');
      }
    } catch (e) {
      console.error('Failed to capture handwritten photo:', e);
      Alert.alert('Camera Error', 'Could not capture photo. Please check camera permissions and lighting.');
    }
  };

  // 4. Upload handwritten answer sheet from Photo Gallery
  const handlePickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      let base64 = asset.base64;
      if (!base64 && asset.uri) {
        try {
          base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (readErr) {
          console.error('Failed to read gallery image URI as base64:', readErr);
        }
      }

      if (!base64) {
        Alert.alert('Gallery Error', 'Could not read image data from gallery. Please select a different image.');
        return;
      }

      const cleanBase64 = base64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '').trim();
      const mimeType = asset.mimeType || (asset.uri?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');

      setCapturedImage(cleanBase64);
      setCapturedImageUri(asset.uri);
      setCapturedImageMimeType(mimeType);
      setViewMode('scanner');
    } catch (err: any) {
      console.error('Gallery image pick error:', err);
      Alert.alert('Gallery Error', err?.message || 'Failed to open image gallery.');
    }
  };

  // 5. Submit Captured Answer to Multimodal Synapse Engine
  const handleSubmitForGrading = async () => {
    if (!capturedImage || !activeExam) return;

    const currentQ = activeExam.questions[selectedQuestionIndex];
    if (!currentQ) return;

    setIsGrading(true);
    setGradingProgressText('Performing OCR & Optical Analysis on Handwriting...');

    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    if (!apiKey) {
      Alert.alert('API Key Missing', 'Please configure your Synapse API key in .env.');
      setIsGrading(false);
      return;
    }

    try {
      // Ensure clean raw base64 string without data URI scheme or line breaks
      const cleanBase64 = capturedImage
        .replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '')
        .replace(/(\r\n|\n|\r)/gm, '')
        .trim();

      const mimeType = capturedImageMimeType || 'image/jpeg';

      const subQDetails = currentQ.subQuestions
        .map(
          (sq) =>
            `Sub-question ${sq.label} [${sq.marks} Marks]:\nPrompt: ${sq.prompt}\nExpected Marking Criteria:\n${sq.rubricKeyPoints.map((k) => `- ${k}`).join('\n')}`
        )
        .join('\n\n');

      const evaluationPrompt = `You are a strict, experienced university examination board professor evaluating handwritten theory exam answers for:
Institution: ${activeExam.institution}
Course: ${activeExam.courseCode} - ${activeExam.courseTitle}
Question ${currentQ.questionNumber} [Total: ${currentQ.totalMarks} Marks]:
Topic: ${currentQ.topic}

SUB-QUESTIONS & MARKING SCHEME RUBRIC:
${subQDetails}

TASK:
1. Examine and transcribe the student's handwritten answer sheet captured in the image. Identify mathematical derivations, formulas, definitions, diagrams, algorithm steps, and written arguments.
2. If the image is blank, illegible, or contains no answer to Question ${currentQ.questionNumber}, award 0 marks and explain clearly in overallFeedback.
3. Grade the answer strictly and fairly according to the rubric, up to ${currentQ.totalMarks} marks total. Award partial marks for partially correct derivations, correct steps, or good explanations.
4. Provide constructive examiner remarks with criteria scores, strengths, and specific omissions/deductions.
5. Return STRICTLY a valid JSON object matching this schema (do not wrap in markdown or backticks):
{
  "questionId": ${currentQ.id},
  "marksAwarded": number (e.g. 15.5 or integer between 0 and ${currentQ.totalMarks}),
  "totalPossibleMarks": ${currentQ.totalMarks},
  "overallFeedback": "Detailed, specific assessment of the student's handwritten work.",
  "criteria": [
    { "title": "Conceptual Clarity & Definitions", "score": number, "maxScore": number, "comment": "Comment on concept grasp" },
    { "title": "Mathematical Derivations / Algorithms", "score": number, "maxScore": number, "comment": "Comment on accuracy of proof/steps" },
    { "title": "Structure & Illustrative Examples", "score": number, "maxScore": number, "comment": "Comment on completeness and presentation" }
  ],
  "strengths": [
    "Specific accurate points or formulas from student's work"
  ],
  "omissionsOrDeficiencies": [
    "Specific omissions, mistakes, or areas to improve"
  ],
  "modelSolutionComparison": "Brief comparison with the standard university model solution."
}`;

      setGradingProgressText('Evaluating answer against university rubric...');

      let gradingResult: QuestionGradingResult | null = null;
      let lastError = '';

      const modelQueue: string[] = [];
      if (cachedPreferredModel && CANDIDATE_MODELS.includes(cachedPreferredModel)) {
        modelQueue.push(cachedPreferredModel);
      }
      for (const m of CANDIDATE_MODELS) {
        if (!modelQueue.includes(m)) {
          modelQueue.push(m);
        }
      }

      for (const model of modelQueue) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        try {
          console.log(`[TheoryEngine] Attempting grading with ${model}...`);
          setGradingProgressText(`Professor AI evaluating answer (${model})...`);

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.15,
                  maxOutputTokens: 4096,
                },
                contents: [
                  {
                    parts: [
                      { text: evaluationPrompt },
                      { inlineData: { mimeType, data: cleanBase64 } },
                    ],
                  },
                ],
              }),
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            const errMessage = errJson?.error?.message || `HTTP ${response.status}`;
            console.warn(`[TheoryEngine] ${model} returned ${response.status}: ${errMessage}`);
            lastError = errMessage;
            if (response.status === 503 || response.status === 429) {
              await new Promise((r) => setTimeout(r, 1000));
            }
            continue;
          }

          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            const parsed = JSON.parse(cleaned);
            if (parsed && (typeof parsed.marksAwarded === 'number' || typeof parsed.totalPossibleMarks === 'number')) {
              const marks = typeof parsed.marksAwarded === 'number' ? parsed.marksAwarded : 0;
              gradingResult = {
                questionId: currentQ.id,
                marksAwarded: Math.min(Math.max(marks, 0), currentQ.totalMarks),
                totalPossibleMarks: currentQ.totalMarks,
                overallFeedback: parsed.overallFeedback || 'Evaluated handwritten solution against university marking rubric.',
                criteria: Array.isArray(parsed.criteria) && parsed.criteria.length > 0 ? parsed.criteria : [
                  { title: 'Conceptual Clarity & Definitions', score: Math.round(marks * 0.3), maxScore: Math.round(currentQ.totalMarks * 0.3), comment: 'Assessed from handwritten response.' },
                  { title: 'Mathematical Derivations / Algorithms', score: Math.round(marks * 0.4), maxScore: Math.round(currentQ.totalMarks * 0.4), comment: 'Assessed from handwritten response.' },
                  { title: 'Structure & Illustrative Examples', score: Math.round(marks * 0.3), maxScore: Math.round(currentQ.totalMarks * 0.3), comment: 'Assessed from handwritten response.' },
                ],
                strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ['Submitted handwritten solution for evaluation.'],
                omissionsOrDeficiencies: Array.isArray(parsed.omissionsOrDeficiencies) && parsed.omissionsOrDeficiencies.length > 0 ? parsed.omissionsOrDeficiencies : ['Review model solution for missing technical details.'],
                modelSolutionComparison: parsed.modelSolutionComparison || 'Compared against university standard answer scheme.',
                gradedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                capturedImageBase64: cleanBase64,
              };
              cachedPreferredModel = model;
              break;
            }
          }
        } catch (mErr: any) {
          clearTimeout(timeoutId);
          console.warn(`[TheoryEngine] Model ${model} error:`, mErr);
          lastError = mErr?.message || 'Network timeout or connection error.';
        }
      }

      if (!gradingResult) {
        Alert.alert(
          'Grading Notice',
          lastError
            ? `Could not complete AI grading: ${lastError}. Please check your connection and ensure the image clearly shows handwritten work.`
            : 'Could not complete AI grading on the submitted image. Please ensure the image clearly shows handwritten work.'
        );
        return;
      }

      setSubmissions((prev) => ({
        ...prev,
        [currentQ.id]: gradingResult!,
      }));

      // Return to Exam Hall and open feedback sheet
      setCapturedImage(null);
      setCapturedImageUri(null);
      setViewMode('exam');
      setShowFeedbackModal(true);
    } catch (error: any) {
      Alert.alert('Grading Error', error?.message || 'Failed to complete AI grading.');
    } finally {
      setIsGrading(false);
      setGradingProgressText('');
    }
  };

  // Exit Exam Hall
  const handleExitExamHall = () => {
    Alert.alert('Exit Examination Hall?', 'Are you sure you want to leave the exam hall? Your current progress will be preserved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Exit Hall',
        style: 'destructive',
        onPress: () => {
          setIsTimerActive(false);
          setViewMode('lobby');
        },
      },
    ]);
  };

  // =========================================================================
  // VIEW 1: LOBBY & SHOWCASE
  // =========================================================================
  if (viewMode === 'lobby') {
    return (
      <SafeAreaView className="flex-1 bg-[#001524]" edges={['top', 'left', 'right']}>
        <ScrollView
          className="flex-1 bg-[#001524] px-5 pt-3"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <Animated.View entering={SlideInDown.duration(450).springify()} className="flex-col gap-1.5 mb-5">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.7}
                className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/15"
              >
                <ChevronLeft size={16} color="#ffffff" />
                <Text className="text-white text-xs font-semibold">Back</Text>
              </TouchableOpacity>

              <View className="flex-row items-center gap-2">
                <View className="rounded-full bg-[#0095ff]/20 px-2.5 py-1 border border-[#0095ff]/30 flex-row items-center gap-1.5">
                  <View className="w-2 h-2 rounded-full bg-[#0095ff]" />
                  <Text className="text-[10px] font-bold text-[#0095ff] uppercase tracking-wider">
                    Theory Session Hub
                  </Text>
                </View>
                <View className="flex-row items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                  <Sparkles size={12} color="#ffa200" />
                  <Text className="text-[10px] font-bold text-white">Synapse</Text>
                </View>
              </View>
            </View>

            <Text className="text-2xl font-bold tracking-[-0.04em] text-white mt-1">
              Theory Session
            </Text>
            <Text className="text-xs text-[#e1e5ea]/75 leading-5">
              Turn course materials into university theory examinations. Write solutions on paper and scan to receive strict professor grading.
            </Text>
          </Animated.View>

          {/* AI Trainer Past Papers Banner: Calibrated or Suggestion */}
          {pastTheoryTraining ? (
            <Animated.View
              entering={FadeInLeft.duration(500).springify().damping(14)}
              style={{
                backgroundColor: '#002040',
                borderColor: 'rgba(0, 149, 255, 0.4)',
                borderWidth: 1,
              }}
              className="rounded-2xl p-4 shadow-xl mb-5"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <View className="w-6 h-6 rounded-full bg-[#0095ff]/20 items-center justify-center border border-[#0095ff]/40">
                    <ShieldCheck size={13} color="#0095ff" />
                  </View>
                  <Text className="text-white font-bold text-xs">
                    University Paper Format Calibrated 🏛️
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/ai-trainer',
                      params: {
                        courseCode: courseCode || customCourseCode || '',
                        mode: 'theory',
                      },
                    })
                  }
                  className="flex-row items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15"
                >
                  <Text className="text-[11px] font-semibold text-[#89b4fa]">View AI Trainer</Text>
                  <ArrowRight size={11} color="#89b4fa" />
                </TouchableOpacity>
              </View>

              <Text className="text-xs font-semibold text-white/90 mb-1">
                Calibrated via {pastTheoryTraining.fileName}
              </Text>
              <Text className="text-[11px] text-white/70 leading-4 mb-2.5">
                Synthesized theory questions will replicate multi-part sub-question structures ((a), (b), (c)) with authentic mark allocations, repeating recurring past concepts with new angles, and filling syllabus gaps ({pastTheoryTraining.coverageAnalysis?.syllabusCoveragePercent || 80}% syllabus match).
              </Text>

              <View className="flex-row flex-wrap gap-1.5">
                <View className="bg-white/10 px-2 py-0.5 rounded-md">
                  <Text className="text-[10px] text-white/80 font-medium">Reformat Recurring Proofs</Text>
                </View>
                <View className="bg-white/10 px-2 py-0.5 rounded-md">
                  <Text className="text-[10px] text-white/80 font-medium">Fill Syllabus Gaps</Text>
                </View>
                <View className="bg-white/10 px-2 py-0.5 rounded-md">
                  <Text className="text-[10px] text-white/80 font-medium">Strict Mark Rubric</Text>
                </View>
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeInLeft.duration(500).springify().damping(14)}
              style={{
                backgroundColor: '#00253e',
                borderColor: 'rgba(255, 162, 0, 0.35)',
                borderWidth: 1,
              }}
              className="rounded-2xl p-4 shadow-xl mb-5"
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
                Want essay questions and mark rubrics formatted like your university exams?
              </Text>
              <Text className="text-[11px] text-white/70 leading-4 mb-3">
                Upload past university exam papers in the AI Trainer. The AI will learn your department's question patterns, reformat recurring questions, and generate the rest in the professor's exact format.
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/ai-trainer',
                    params: {
                      courseCode: courseCode || customCourseCode || '',
                      mode: 'theory',
                    },
                  })
                }
                className="w-full bg-[#ffa200]/20 border border-[#ffa200]/40 rounded-xl py-2.5 px-3 flex-row items-center justify-center gap-2"
              >
                <Sparkles size={13} color="#ffa200" />
                <Text className="text-[#ffa200] text-xs font-bold">
                  Train Theory Format in AI Trainer ➔
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* FEATURED CASE STUDY CARD: FUTMINNA */}
          <Animated.View
            entering={FadeInUp.delay(180).duration(500).springify().damping(12)}
            style={{
              backgroundColor: '#002040',
              borderColor: 'rgba(0, 149, 255, 0.4)',
              borderWidth: 1,
            }}
            className="rounded-2xl p-5 shadow-xl mb-6 relative overflow-hidden"
          >
            <View className="flex-row items-start justify-between gap-3 mb-3">
              <View className="rounded-lg bg-[#0095ff]/20 px-2.5 py-1 border border-[#0095ff]/30 self-start">
                <Text className="text-[9px] font-bold text-[#0095ff] uppercase tracking-widest">
                  Featured Case Study Exam
                </Text>
              </View>
              <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                <School size={16} color="#ffa200" />
              </View>
            </View>

            <Text className="text-white font-extrabold text-lg tracking-tight mb-1">
              Federal University of Technology, Minna
            </Text>
            <Text className="text-[#89b4fa] text-xs font-semibold mb-2">
              SICT · CSC 311: Design and Analysis of Algorithms
            </Text>

            <Text className="text-[#c5d1de] text-xs leading-5 mb-4 font-normal">
              Authentic Nigerian university exam paper. Features 4 comprehensive questions on Divide & Conquer, Dynamic Programming, and Shortest Paths with official mark rubrics.
            </Text>

            {/* Quick Specs */}
            <View className="flex-row items-center gap-4 py-2.5 px-3 rounded-xl bg-black/40 border border-white/10 mb-4">
              <View className="flex-row items-center gap-1.5">
                <Clock size={13} color="#ffa200" />
                <Text className="text-white text-[11px] font-semibold">2 Hours</Text>
              </View>
              <View className="h-3 w-px bg-white/20" />
              <View className="flex-row items-center gap-1.5">
                <FileText size={13} color="#0095ff" />
                <Text className="text-white text-[11px] font-semibold">4 Questions</Text>
              </View>
              <View className="h-3 w-px bg-white/20" />
              <View className="flex-row items-center gap-1.5">
                <Award size={13} color="#00d26a" />
                <Text className="text-white text-[11px] font-semibold">20 Marks Each</Text>
              </View>
            </View>

            {/* Launch Button */}
            <TouchableOpacity
              onPress={handleLaunchFutminnaExam}
              activeOpacity={0.85}
              style={{ backgroundColor: '#0095ff' }}
              className="w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2"
            >
              <Play size={16} color="#ffffff" fill="#ffffff" />
              <Text className="text-white font-bold text-sm tracking-wide">
                Start FUTMINNA Exam Paper
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* UNIVERSAL GENERATOR: ANY UNIVERSITY */}
          <View className="rounded-2xl bg-white/5 border border-white/15 p-5 shadow-lg mb-6">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-7 h-7 rounded-lg bg-[#ffa200]/20 items-center justify-center border border-[#ffa200]/30">
                <GraduationCap size={15} color="#ffa200" />
              </View>
              <Text className="text-white font-bold text-base">
                Universal Course Exam Generator
              </Text>
            </View>

            <Text className="text-[#a6b5c5] text-xs leading-5 mb-4">
              Build a realistic theory paper for <Text className="text-white font-semibold">any institution worldwide</Text> (Unilag, OAU, ABU, UI, Covenant, or international). Upload your syllabus or lecture notes to synthesize questions and rubrics.
            </Text>

            {/* School & Course Inputs */}
            <View className="flex-col gap-2.5 mb-4">
              <View>
                <Text className="text-[10px] text-[#8995a9] font-bold uppercase mb-1">
                  Institution Name (Optional)
                </Text>
                <TextInput
                  value={customUniversityName}
                  onChangeText={setCustomUniversityName}
                  placeholder="e.g. University of Lagos (UNILAG)"
                  placeholderTextColor="#5a6878"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs"
                />
              </View>

              <View>
                <Text className="text-[10px] text-[#8995a9] font-bold uppercase mb-1">
                  Course Code & Title
                </Text>
                <TextInput
                  value={customCourseCode}
                  onChangeText={setCustomCourseCode}
                  placeholder="e.g. CSC 301: Systems Programming"
                  placeholderTextColor="#5a6878"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs"
                />
              </View>
            </View>

            {/* Upload Button */}
            <TouchableOpacity
              onPress={handleUploadCourseDocument}
              disabled={isSynthesizingExam}
              activeOpacity={0.85}
              className="w-full bg-white/10 py-3.5 rounded-xl border border-white/20 flex-row items-center justify-center gap-2"
            >
              {isSynthesizingExam ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-white font-bold text-xs">
                    Synthesizing University Paper...
                  </Text>
                </>
              ) : (
                <>
                  <Upload size={16} color="#e1e5ea" strokeWidth={2} />
                  <Text className="text-white font-semibold text-xs">
                    Upload Course Syllabus or Notes (PDF/TXT)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE EXAMINATION HALL
  // =========================================================================
  const currentQuestion = activeExam.questions[selectedQuestionIndex] || activeExam.questions[0];
  const currentSubmission = submissions[currentQuestion.id];
  const answeredCount = Object.keys(submissions).length;

  if (viewMode === 'exam') {
    return (
      <SafeAreaView className="flex-1 bg-[#001524]" edges={['top', 'left', 'right']}>
        {/* Top Control Bar */}
        <View className="bg-[#001524] px-5 py-3 border-b border-white/10 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleExitExamHall}
            activeOpacity={0.7}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/15 flex-row items-center gap-1.5"
          >
            <X size={14} color="#e1e5ea" />
            <Text className="text-white text-[11px] font-semibold">Exit Hall</Text>
          </TouchableOpacity>

          {/* Countdown Timer */}
          <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/15">
            <Clock size={13} color={timeRemainingSeconds < 600 ? '#ff4d4d' : '#ffa200'} />
            <Text
              className={`font-mono text-xs font-bold ${
                timeRemainingSeconds < 600 ? 'text-[#ff4d4d]' : 'text-white'
              }`}
            >
              {formatTimer(timeRemainingSeconds)}
            </Text>
          </View>

          {/* Progress */}
          <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-[#0095ff]/15 border border-[#0095ff]/30">
            <FileCheck2 size={13} color="#0095ff" />
            <Text className="text-[#0095ff] text-[11px] font-bold">
              {answeredCount}/4 Answered
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 bg-[#001524] px-5 pt-3"
          contentContainerStyle={{ paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Institutional Header Card */}
          <View className="rounded-xl bg-white/5 border border-white/15 p-4 mb-4">
            <Text className="text-[#ffa200] font-extrabold text-[11px] uppercase tracking-widest text-center" numberOfLines={2}>
              {activeExam.institution}
            </Text>
            <Text className="text-white font-bold text-sm text-center mt-0.5" numberOfLines={2}>
              {activeExam.facultyOrSchool}
            </Text>
            <Text className="text-[#8995a9] text-[11px] text-center" numberOfLines={2}>
              {activeExam.department} · {activeExam.semester} ({activeExam.academicSession})
            </Text>

            <View className="h-px bg-white/10 my-2.5" />

            {/* Course Details Row - Robust Flex Wrapping */}
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 pr-2">
                <Text className="text-white font-bold text-xs" numberOfLines={1}>
                  {activeExam.courseCode}
                </Text>
                <Text
                  className="text-[#89b4fa] text-[11px] font-medium leading-4 mt-0.5"
                  numberOfLines={3}
                  ellipsizeMode="tail"
                >
                  {activeExam.courseTitle}
                </Text>
              </View>

              <View className="items-end shrink-0 pl-2">
                <View className="rounded-md bg-white/5 px-2 py-0.5 border border-white/10 mb-1">
                  <Text className="text-white text-[10px] font-bold">
                    {activeExam.creditUnits} Credit Units
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Clock size={10} color="#ffa200" />
                  <Text className="text-[#ffa200] text-[10px] font-semibold">
                    {activeExam.timeAllowedMinutes} Mins Allowed
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-2.5 rounded-lg bg-black/30 p-2 border border-white/5">
              <Text className="text-[#c5d1de] text-[10px] leading-4 italic text-center">
                Instructions: {activeExam.instructions}
              </Text>
            </View>

            {pastTheoryTraining && (
              <View className="flex-row items-center justify-center gap-1.5 mt-2 bg-[#0095ff]/15 border border-[#0095ff]/30 py-1 px-2.5 rounded-lg self-center">
                <ShieldCheck size={11} color="#0095ff" />
                <Text className="text-[#0095ff] text-[10px] font-bold">
                  Format Calibrated to {pastTheoryTraining.fileName}
                </Text>
              </View>
            )}
          </View>

          {/* Question Selector Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          >
            {activeExam.questions.map((q, idx) => {
              const isSelected = selectedQuestionIndex === idx;
              const isGraded = Boolean(submissions[q.id]);
              return (
                <TouchableOpacity
                  key={q.id}
                  onPress={() => setSelectedQuestionIndex(idx)}
                  activeOpacity={0.8}
                  style={{
                    minWidth: 54,
                    backgroundColor: isSelected
                      ? '#0095ff'
                      : isGraded
                      ? 'rgba(0, 210, 106, 0.15)'
                      : 'rgba(255, 255, 255, 0.05)',
                    borderColor: isSelected
                      ? '#0095ff'
                      : isGraded
                      ? 'rgba(0, 210, 106, 0.4)'
                      : 'rgba(255, 255, 255, 0.1)',
                  }}
                  className="py-2.5 px-3 rounded-xl border items-center justify-center flex-col gap-0.5"
                >
                  <Text
                    style={{
                      color: isSelected ? '#ffffff' : isGraded ? '#00d26a' : '#8995a9',
                    }}
                    className="text-xs font-bold"
                  >
                    Q{q.questionNumber}
                  </Text>
                  <Text
                    style={{
                      color: isSelected ? 'rgba(255,255,255,0.85)' : isGraded ? '#00d26a' : 'rgba(137,149,169,0.7)',
                    }}
                    className="text-[9px] font-medium"
                  >
                    {isGraded ? `${submissions[q.id].marksAwarded}/${q.totalMarks}` : `${q.totalMarks}M`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Question Detail Card */}
          <Animated.View
            entering={FadeInLeft.duration(450).springify().damping(13)}
            className="rounded-2xl bg-white/10 border border-white/20 p-5 shadow-xl mb-4"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <View className="rounded-md bg-[#0095ff]/20 px-2 py-0.5 border border-[#0095ff]/30">
                  <Text className="text-[10px] font-bold text-[#0095ff] uppercase">
                    QUESTION {currentQuestion.questionNumber}
                  </Text>
                </View>
                <Text className="text-xs text-[#8995a9] font-medium">[{currentQuestion.totalMarks} Marks Total]</Text>
              </View>

              {currentSubmission ? (
                <View className="flex-row items-center gap-1 rounded-full bg-[#00d26a]/20 px-2.5 py-0.5 border border-[#00d26a]/40">
                  <CheckCircle2 size={12} color="#00d26a" />
                  <Text className="text-[10px] font-bold text-[#00d26a]">
                    Graded: {currentSubmission.marksAwarded}/{currentQuestion.totalMarks}
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5">
                  <AlertCircle size={12} color="#ffa200" />
                  <Text className="text-[10px] font-medium text-[#ffa200]">Unsubmitted</Text>
                </View>
              )}
            </View>

            <Text className="text-white font-bold text-base mb-3 leading-snug">
              {currentQuestion.topic}
            </Text>

            {/* Sub-questions list */}
            <View className="flex-col gap-3 mb-2">
              {currentQuestion.subQuestions.map((sq) => (
                <View key={sq.id} className="rounded-xl bg-black/30 p-3.5 border border-white/10">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-[#0095ff] font-bold text-xs">
                      Part {sq.label}
                    </Text>
                    <Text className="text-[#ffa200] font-bold text-xs">
                      [{sq.marks} Marks]
                    </Text>
                  </View>
                  <Text className="text-[#e1e5ea] text-xs leading-5 font-normal mb-2">
                    {sq.prompt}
                  </Text>

                  {/* Marking Points Snippet */}
                  <View className="rounded-lg bg-white/5 p-2 border border-white/5">
                    <Text className="text-[#8995a9] text-[10px] font-bold uppercase mb-1">
                      Marking Rubric Focus:
                    </Text>
                    {sq.rubricKeyPoints.map((point, pIdx) => (
                      <Text key={pIdx} className="text-[#a6b5c5] text-[10px] leading-4">
                        • {point}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Action Panel: Scan Handwritten Sheet OR Upload from Gallery OR View Feedback */}
          <Animated.View
            entering={SlideInUp.delay(200).duration(450).springify().damping(12)}
            className="flex-col gap-2.5"
          >
            <TouchableOpacity
              onPress={() => {
                setCapturedImage(null);
                setCapturedImageUri(null);
                setViewMode('scanner');
              }}
              activeOpacity={0.85}
              style={{ backgroundColor: '#0095ff' }}
              className="w-full py-4 rounded-xl flex-row items-center justify-center gap-2.5 shadow-lg shadow-[#0095ff]/40"
            >
              <Camera size={18} color="#ffffff" strokeWidth={2} />
              <Text className="text-white font-bold text-sm tracking-wide">
                {currentSubmission ? 'Rescan Answer Sheet (Camera)' : 'Scan Handwritten Answer Sheet'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePickImageFromGallery}
              activeOpacity={0.85}
              className="w-full py-3.5 rounded-xl bg-white/10 border border-white/20 flex-row items-center justify-center gap-2.5"
            >
              <ImageIcon size={18} color="#0095ff" strokeWidth={2} />
              <Text className="text-white font-semibold text-xs tracking-wide">
                Upload from Gallery
              </Text>
            </TouchableOpacity>

            {currentSubmission && (
              <TouchableOpacity
                onPress={() => setShowFeedbackModal(true)}
                activeOpacity={0.85}
                className="w-full bg-[#ffa200]/20 border border-[#ffa200]/40 py-3 rounded-xl flex-row items-center justify-center gap-2"
              >
                <Award size={16} color="#ffa200" />
                <Text className="text-white font-semibold text-xs">
                  View Examiner Grade & Feedback ({currentSubmission.marksAwarded}/{currentQuestion.totalMarks})
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>

        {/* FEEDBACK SHEET OVERLAY */}
        {showFeedbackModal && currentSubmission && (
          <View className="absolute inset-0 bg-black/85 items-center justify-center p-4 z-50">
            <Animated.View
              entering={ZoomIn.duration(350).springify().damping(15)}
              className="w-full max-w-md max-h-[85%] bg-[#001c38] border border-white/25 rounded-3xl p-5 shadow-2xl flex-col"
            >
              {/* Modal Top Bar */}
              <View className="flex-row items-center justify-between border-b border-white/10 pb-3 mb-3">
                <View className="flex-row items-center gap-2.5">
                  <View className="w-9 h-9 rounded-full bg-[#ffa200]/20 border border-[#ffa200]/40 items-center justify-center">
                    <Award size={20} color="#ffa200" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-base">
                      Examiner Grade Sheet
                    </Text>
                    <Text className="text-[10px] text-[#0095ff] font-semibold">
                      Question {currentQuestion.questionNumber} Assessment
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setShowFeedbackModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 items-center justify-center"
                >
                  <X size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 pr-1" showsVerticalScrollIndicator={true}>
                {/* Big Score Callout */}
                <View className="rounded-2xl bg-white/5 border border-white/15 p-4 items-center mb-4">
                  <Text className="text-[#8995a9] text-[10px] uppercase tracking-widest font-bold mb-1">
                    Marks Awarded
                  </Text>
                  <View className="flex-row items-baseline gap-1">
                    <Text className="text-white font-extrabold text-4xl">
                      {currentSubmission.marksAwarded}
                    </Text>
                    <Text className="text-[#8995a9] font-bold text-lg">
                      / {currentSubmission.totalPossibleMarks}
                    </Text>
                  </View>
                  <Text className="text-[#00d26a] text-xs font-semibold mt-1">
                    {(
                      (currentSubmission.marksAwarded / currentSubmission.totalPossibleMarks) *
                      100
                    ).toFixed(0)}
                    % University Standard
                  </Text>
                </View>

                {/* Overall Examiner Feedback */}
                <View className="mb-4">
                  <Text className="text-[#ffa200] font-bold text-xs uppercase tracking-wider mb-1.5">
                    Overall Examiner Remarks
                  </Text>
                  <Text className="text-[#e1e5ea] text-xs leading-5 bg-black/30 p-3 rounded-xl border border-white/10">
                    {currentSubmission.overallFeedback}
                  </Text>
                </View>

                {/* Criteria Breakdown */}
                {currentSubmission.criteria && currentSubmission.criteria.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-white font-bold text-xs mb-2">
                      Grading Criteria Breakdown
                    </Text>
                    <View className="flex-col gap-2">
                      {currentSubmission.criteria.map((c, cIdx) => (
                        <View key={cIdx} className="rounded-xl bg-white/5 p-2.5 border border-white/10">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-[#c5d1de] font-semibold text-xs">{c.title}</Text>
                            <Text className="text-[#0095ff] font-bold text-xs">
                              {c.score}/{c.maxScore}
                            </Text>
                          </View>
                          <Text className="text-[#8995a9] text-[10px] leading-4">{c.comment}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Strengths & Deficiencies */}
                <View className="flex-col gap-3 mb-4">
                  {currentSubmission.strengths?.length > 0 && (
                    <View>
                      <Text className="text-[#00d26a] font-bold text-[11px] mb-1">
                        Key Points Rewarded:
                      </Text>
                      {currentSubmission.strengths.map((s, sIdx) => (
                        <Text key={sIdx} className="text-[#c5d1de] text-[11px] leading-4 mb-0.5">
                          ✓ {s}
                        </Text>
                      ))}
                    </View>
                  )}

                  {currentSubmission.omissionsOrDeficiencies?.length > 0 && (
                    <View>
                      <Text className="text-[#ff9999] font-bold text-[11px] mb-1">
                        Points Missed / Deductions:
                      </Text>
                      {currentSubmission.omissionsOrDeficiencies.map((d, dIdx) => (
                        <Text key={dIdx} className="text-[#c5d1de] text-[11px] leading-4 mb-0.5">
                          ✗ {d}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>

                {/* Model Outline Comparison */}
                {currentSubmission.modelSolutionComparison && (
                  <View className="mb-2">
                    <Text className="text-[#89b4fa] font-bold text-[11px] mb-1">
                      Model Solution Benchmark:
                    </Text>
                    <Text className="text-[#a6b5c5] text-[10px] leading-4 bg-black/30 p-2.5 rounded-lg border border-white/5">
                      {currentSubmission.modelSolutionComparison}
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setShowFeedbackModal(false)}
                className="w-full bg-[#0095ff] py-3 rounded-xl mt-3 items-center justify-center shadow-md"
              >
                <Text className="text-white font-bold text-xs tracking-wide">
                  Return to Question Paper
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // =========================================================================
  // VIEW 3: INTEGRATED CAMERA SCANNER VIEW (Full Screen)
  // =========================================================================
  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'left', 'right', 'bottom']}>
      <View className="flex-1 bg-black justify-between p-4 relative">
        {/* Top Header */}
        <View className="flex-row items-center justify-between z-20">
          <TouchableOpacity
            onPress={() => {
              setCapturedImage(null);
              setViewMode('exam');
            }}
            disabled={isGrading}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10"
          >
            <ChevronLeft size={16} color="#ffffff" />
            <Text className="text-white text-xs font-semibold">Back to Exam</Text>
          </TouchableOpacity>

          <View className="items-end">
            <Text className="text-white font-bold text-xs">
              Question {currentQuestion.questionNumber} Answer Sheet
            </Text>
            <Text className="text-[#8995a9] text-[10px]">
              Align paper within guides
            </Text>
          </View>
        </View>

        {/* Viewfinder Frame */}
        <View className="flex-1 my-3 rounded-2xl overflow-hidden relative items-center justify-center bg-[#090d13] border border-dashed border-white/20">
          {!permission?.granted ? (
            <View className="items-center justify-center p-6">
              <Camera size={36} color="#0095ff" strokeWidth={1.5} />
              <Text className="text-white font-bold text-base text-center mt-3 mb-1">
                Camera Access Needed
              </Text>
              <Text className="text-[#8995a9] text-xs text-center mb-4 leading-4 max-w-[240px]">
                Campus Cram requires camera access to capture and grade your handwritten examination sheets.
              </Text>
              <View className="flex-col gap-2 w-full max-w-[220px]">
                <TouchableOpacity
                  onPress={requestPermission}
                  className="bg-[#0095ff] py-2.5 rounded-full items-center justify-center"
                >
                  <Text className="text-white font-bold text-xs">Grant Camera Access</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePickImageFromGallery}
                  activeOpacity={0.8}
                  className="bg-white/10 border border-white/20 py-2 rounded-full items-center justify-center flex-row gap-1.5"
                >
                  <ImageIcon size={13} color="#ffffff" />
                  <Text className="text-white font-semibold text-xs">Upload from Gallery Instead</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : !capturedImage ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing="back"
            />
          ) : (
            <Image
              source={{ uri: capturedImageUri || `data:${capturedImageMimeType || 'image/jpeg'};base64,${capturedImage}` }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="contain"
            />
          )}

          {/* Perspective Target Guides */}
          <View className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-[#0095ff] rounded-tl-xl pointer-events-none" />
          <View className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-[#0095ff] rounded-tr-xl pointer-events-none" />
          <View className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-[#0095ff] rounded-bl-xl pointer-events-none" />
          <View className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-[#0095ff] rounded-br-xl pointer-events-none" />

          {!capturedImage && permission?.granted && (
            <View className="items-center justify-center pointer-events-none">
              <Focus size={36} color="#0095ff" strokeWidth={1.2} />
              <Text className="text-white text-xs font-medium mt-2 bg-black/60 px-3 py-1 rounded-full">
                Position Handwritten Paper
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Actions - elevated safely above floating bottom tab bar */}
        <View
          style={{ paddingBottom: Platform.OS === 'ios' ? 104 : 96 }}
          className="flex-col gap-2.5 z-20"
        >
          {isGrading ? (
            <View className="py-4 bg-[#0095ff]/30 rounded-xl items-center justify-center flex-row gap-2 border border-[#0095ff]/40">
              <ActivityIndicator size="small" color="#ffffff" />
              <Text className="text-white font-bold text-xs tracking-wide">
                {gradingProgressText || 'Professor AI Evaluating Answer...'}
              </Text>
            </View>
          ) : capturedImage ? (
            <>
              <TouchableOpacity
                onPress={handleSubmitForGrading}
                activeOpacity={0.85}
                className="w-full bg-[#0095ff] py-4 rounded-xl flex-row items-center justify-center gap-2 shadow-lg shadow-[#0095ff]/50"
              >
                <Sparkles size={18} color="#ffffff" />
                <Text className="text-white font-bold text-sm">
                  Submit for University AI Grading
                </Text>
              </TouchableOpacity>

              <View className="flex-row items-center gap-2.5">
                <TouchableOpacity
                  onPress={() => {
                    setCapturedImage(null);
                    setCapturedImageUri(null);
                  }}
                  activeOpacity={0.8}
                  className="flex-1 bg-white/10 py-3 rounded-xl flex-row items-center justify-center gap-2 border border-white/20"
                >
                  <RefreshCcw size={15} color="#ffffff" />
                  <Text className="text-white font-semibold text-xs">
                    Retake Photo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePickImageFromGallery}
                  activeOpacity={0.8}
                  className="flex-1 bg-white/10 py-3 rounded-xl flex-row items-center justify-center gap-2 border border-white/20"
                >
                  <ImageIcon size={15} color="#0095ff" />
                  <Text className="text-white font-semibold text-xs">
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View className="flex-row items-center gap-2.5">
              <TouchableOpacity
                onPress={handlePickImageFromGallery}
                activeOpacity={0.85}
                className="bg-white/10 border border-white/20 py-4 px-4 rounded-xl flex-row items-center justify-center gap-2"
              >
                <ImageIcon size={20} color="#0095ff" strokeWidth={2} />
                <Text className="text-white font-semibold text-xs">Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCapturePhoto}
                disabled={!permission?.granted}
                activeOpacity={0.85}
                style={{ backgroundColor: '#0095ff' }}
                className={`flex-1 py-4 rounded-xl flex-row items-center justify-center gap-2 shadow-lg shadow-[#0095ff]/50 ${
                  !permission?.granted ? 'opacity-50' : ''
                }`}
              >
                <Camera size={20} color="#ffffff" strokeWidth={2} />
                <Text className="text-white font-bold text-sm">
                  Capture Paper
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
