import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';
import { studyStore } from '../../services/course-study-store';
import {
  ChevronLeft,
  Sparkles,
  Send,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  GraduationCap,
} from 'lucide-react-native';
import { AnimatedPressable } from '../../components/common/animated-pressable';

interface TutorMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  hint?: string;
  isQuestion?: boolean;
  step?: number;
}

const INITIAL_MESSAGES: TutorMessage[] = [
  {
    id: 'msg-1',
    sender: 'ai',
    text: `Hello! I'm your Socratic AI Tutor. Rather than simply giving you answers, I'll guide you step-by-step to master any challenging concept so you can defend it under high exam pressure.

What topic or exam concept would you like to master today? (e.g., "Deadlock Avoidance", "B-Trees", "TCP Congestion Control", or "Contract Consideration")`,
    step: 1,
  },
];

const QUICK_TOPICS = [
  'Deadlock Avoidance & Bankers Algo',
  'Process vs Thread Memory',
  'Normalization up to BCNF',
  'Paging vs Segmentation',
];

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
];

export default function AITutorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    courseCode?: string;
    courseTitle?: string;
    documentTitle?: string;
  }>();
  const courseCode = params.courseCode;
  const courseTitle = params.courseTitle;

  const tutorContext = studyStore.getTutorContextForCourse(courseCode, courseTitle);

  const initialMsg: TutorMessage = {
    id: 'msg-1',
    sender: 'ai',
    text: tutorContext.greeting,
    step: 1,
  };

  const savedSession = courseCode ? studyStore.getTutorSession(courseCode) : null;
  const [messages, setMessages] = useState<TutorMessage[]>(() => {
    if (savedSession && savedSession.messages.length > 0) {
      return savedSession.messages;
    }
    return [initialMsg];
  });
  const [quickTopics, setQuickTopics] = useState<string[]>(tutorContext.topics);
  const [inputText, setInputText] = useState('');
  const [currentStep, setCurrentStep] = useState<number>(() => savedSession?.currentStep || 1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-restore session when courseCode changes
  useEffect(() => {
    if (courseCode) {
      const existing = studyStore.getTutorSession(courseCode);
      if (existing && existing.messages.length > 0) {
        setMessages(existing.messages);
        setCurrentStep(existing.currentStep);
      } else {
        const freshContext = studyStore.getTutorContextForCourse(courseCode, courseTitle);
        const freshMsg: TutorMessage = {
          id: 'msg-1',
          sender: 'ai',
          text: freshContext.greeting,
          step: 1,
        };
        setMessages([freshMsg]);
        setQuickTopics(freshContext.topics);
        setCurrentStep(1);
      }
    }
  }, [courseCode, courseTitle]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: TutorMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (courseCode) {
      studyStore.saveTutorSession(courseCode, newMessages, currentStep);
    }

    setInputText('');
    setActiveHint(null);
    setIsLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Synapse API key is not configured.');
      }

      // Build conversational history for Synapse
      const conversationHistory = newMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      // Build system prompt strictly enforcing Socratic guided learning
      const systemInstruction = `You are an expert university professor and Socratic guided tutor specializing in ${courseCode || 'Computer Science & Engineering'}: ${courseTitle || 'Curriculum'}.
Your mission is to guide the student to master exam concepts through active recall and progressive step-by-step reasoning.

STRICT SOCRATIC RULES:
1. NEVER blurt out the direct answer or write long essay dumps.
2. Break the concept down into 4 progressive checkpoints:
   - Step 1: Intuitive Mental Model (analogy from everyday life).
   - Step 2: Core Mechanism / Probing Question (test if they grasp the rule).
   - Step 3: Edge Case / Exam Trap (challenge them with a tricky scenario).
   - Step 4: Full Mastery Defense (congratulate them on derivation).
3. Always ask exactly ONE targeted, thought-provoking question at the end of your response to check their understanding.
4. Keep your responses under 100 words so the dialogue stays rapid, mobile-friendly, and engaging.
5. If the student answers partially or incorrectly, acknowledge what they got right, provide a gentle hint, and ask a simpler stepping-stone question.
6. Return your response in JSON format with two keys:
   - "response": Your Socratic response text (including your check-in question).
   - "hint": A subtle optional 1-sentence clue the student can reveal if stuck.
   - "step": integer from 1 to 4 representing their current mastery step.`;

      let rawOutput: string | null = null;
      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.4,
                  maxOutputTokens: 1024,
                },
                contents: [
                  {
                    parts: [
                      { text: systemInstruction },
                      ...conversationHistory.flatMap((c) => c.parts),
                    ],
                  },
                ],
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              rawOutput = text;
              break;
            }
          }
        } catch (mErr) {
          console.warn(`[AITutor] ${model} error:`, mErr);
        }
      }

      if (!rawOutput) {
        throw new Error('All candidate AI endpoints failed to respond.');
      }

      if (rawOutput) {
        try {
          const parsed = JSON.parse(rawOutput);
          const nextStep = parsed.step || Math.min(4, currentStep + 1);
          const aiMsg: TutorMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: parsed.response || rawOutput,
            hint: parsed.hint || undefined,
            step: nextStep,
            isQuestion: true,
          };
          if (parsed.step) {
            setCurrentStep(parsed.step);
          }
          const updatedWithAi = [...newMessages, aiMsg];
          setMessages(updatedWithAi);
          if (courseCode) {
            studyStore.saveTutorSession(courseCode, updatedWithAi, nextStep);
          }
        } catch {
          const nextStep = Math.min(4, currentStep + 1);
          const aiMsg: TutorMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: rawOutput,
            step: nextStep,
          };
          const updatedWithAi = [...newMessages, aiMsg];
          setMessages(updatedWithAi);
          if (courseCode) {
            studyStore.saveTutorSession(courseCode, updatedWithAi, nextStep);
          }
        }
      }
    } catch (err: any) {
      const fallbackMsg: TutorMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `Great thought! Let's examine: how does this concept apply when system resources become constrained? Take a guess at the first condition.`,
        hint: 'Think about mutual exclusion or hold-and-wait.',
        step: currentStep,
      };
      const updatedWithFallback = [...newMessages, fallbackMsg];
      setMessages(updatedWithFallback);
      if (courseCode) {
        studyStore.saveTutorSession(courseCode, updatedWithFallback, currentStep);
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#001524]" edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#001524" />

      {/* Header with Back button and Mastery Progress */}
      <Animated.View entering={FadeInDown.duration(400).springify()} className="bg-[#001524] px-4 pt-2 pb-3 border-b border-white/10 shadow-md">
        <View className="flex-row items-center justify-between">
          <AnimatedPressable
            onPress={() => router.back()}
            className="flex-row items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full border border-white/15"
          >
            <ChevronLeft size={16} color="#ffa200" strokeWidth={2.5} />
            <Text className="text-xs font-bold text-white">Back</Text>
          </AnimatedPressable>

          <View className="flex-row items-center gap-1.5 bg-[#ffa200]/20 border border-[#ffa200]/30 px-3 py-1 rounded-full">
            <Sparkles size={13} color="#ffa200" />
            <Text className="text-xs font-bold text-[#ffa200]">
              {courseCode ? `${courseCode} Tutor` : 'Guided Learning'}
            </Text>
          </View>

          <View className="bg-white/10 px-3 py-1 rounded-full border border-white/10">
            <Text className="text-[11px] font-bold text-white">
              Step {currentStep}/4
            </Text>
          </View>
        </View>

        {/* 4-Step Mastery Visual Track */}
        <View className="flex-row items-center gap-1.5 mt-3 px-1">
          {[1, 2, 3, 4].map((step) => {
            const isCompleted = step < currentStep;
            const isCurrent = step === currentStep;
            return (
              <View
                key={step}
                className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{
                  backgroundColor: isCompleted
                    ? '#10b981'
                    : isCurrent
                      ? '#ffa200'
                      : 'rgba(255, 255, 255, 0.15)',
                }}
              />
            );
          })}
        </View>
      </Animated.View>

      {/* Chat Dialogue Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-[#f1f3f5]"
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <Animated.View
                key={msg.id}
                entering={FadeInUp.duration(350).springify().damping(14)}
                className={`mb-3.5 max-w-[86%] ${
                  isUser ? 'self-end' : 'self-start'
                }`}
              >
                {!isUser && (
                  <View className="flex-row items-center gap-1.5 mb-1 pl-1">
                    <GraduationCap size={12} color="#003c66" />
                    <Text className="text-[10px] font-bold text-[#003c66] uppercase tracking-wider">
                      Socratic Tutor
                    </Text>
                  </View>
                )}

                <View
                  className={`p-4 rounded-2xl shadow-xs ${
                    isUser
                      ? 'bg-[#001524] rounded-tr-none'
                      : 'bg-white rounded-tl-none border border-black/5'
                  }`}
                >
                  <Text
                    className={`text-sm leading-6 ${
                      isUser ? 'text-white font-medium' : 'text-[#0f1c24]'
                    }`}
                  >
                    {msg.text}
                  </Text>

                  {/* Optional Interactive Clue / Hint */}
                  {!isUser && msg.hint && (
                    <View className="mt-3 pt-3 border-t border-gray-100">
                      {activeHint === msg.id ? (
                        <View className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                          <View className="flex-row items-center gap-1 mb-0.5">
                            <Lightbulb size={12} color="#d97706" />
                            <Text className="text-[10px] font-bold text-amber-800 uppercase">
                              Nudge Clue
                            </Text>
                          </View>
                          <Text className="text-xs text-amber-900 leading-5">
                            {msg.hint}
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setActiveHint(msg.id)}
                          className="flex-row items-center gap-1"
                        >
                          <HelpCircle size={12} color="#f59e0b" />
                          <Text className="text-xs font-semibold text-amber-700">
                            Need a clue? Tap here
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </Animated.View>
            );
          })}

          {isLoading && (
            <View className="self-start bg-white rounded-2xl rounded-tl-none p-4 border border-black/5 shadow-xs mb-3 flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#ffa200" />
              <Text className="text-xs text-gray-500 font-medium">
                Evaluating your intuition & preparing the next step...
              </Text>
            </View>
          )}

          {/* Quick Suggested Topics (When at beginning) */}
          {messages.length === 1 && (
            <View className="mt-4">
              <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                Suggested Exam Topics
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {quickTopics.map((topic) => (
                  <TouchableOpacity
                    key={topic}
                    activeOpacity={0.8}
                    onPress={() => handleSendMessage(`Let's master ${topic}`)}
                    className="bg-white border border-gray-200 px-3.5 py-2 rounded-xl"
                  >
                    <Text className="text-xs font-semibold text-[#003c66]">
                      {topic}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View className="bg-white px-4 py-3 border-t border-gray-200 flex-row items-center gap-2.5">
          <TextInput
            className="flex-1 bg-[#f8fafc] border border-gray-200 rounded-2xl px-4 py-3 text-sm text-[#0f1c24]"
            placeholder="Answer in your own words..."
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={() => handleSendMessage()}
          />

          <AnimatedPressable
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className={`w-11 h-11 rounded-2xl items-center justify-center ${
              inputText.trim() && !isLoading ? 'bg-[#001524]' : 'bg-gray-200'
            }`}
          >
            <Send
              size={18}
              color={inputText.trim() && !isLoading ? '#ffa200' : '#94a3b8'}
            />
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
