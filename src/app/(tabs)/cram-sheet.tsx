import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { studyStore } from '../../services/course-study-store';
import {
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Sparkles,
  Upload,
  FileText,
} from 'lucide-react-native';
import { SAMPLE_CRAM_DECKS } from '../../constants/sample-cram-decks';
import { CramCard, CramDeck } from '../../constants/cram-types';
import { CardStack } from '../../components/cram-sheet/card-stack';
import { DeckModal } from '../../components/cram-sheet/deck-modal';
import { generateCramDeckFromDocument } from '../../services/cram-ai-service';

export default function CramSheetScreen() {
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

  // Active decks initialized from studyStore
  const allDecks = studyStore.getAllCramDecks();
  const initialDeck = courseCode ? (studyStore.getCramDeckForCourse(courseCode) || allDecks[0]) : allDecks[0];

  const [decks, setDecks] = useState<CramDeck[]>(allDecks);
  const [activeDeck, setActiveDeck] = useState<CramDeck>(initialDeck);
  const [deckModalVisible, setDeckModalVisible] = useState(false);

  // Deck session cards
  const [sessionCards, setSessionCards] = useState<CramCard[]>(initialDeck.cards);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Helper to generate and activate a deck from base64 or multiple docs
  const generateAndActivateDeck = async (
    docsInput: { base64: string; mimeType: string; fileName?: string }[] | string,
    mimeType: string,
    docName: string,
    cCode?: string,
    cTitle?: string
  ) => {
    try {
      setGeneratingFileName(docName || 'Course Document');
      setIsGenerating(true);

      const generatedDeck = await generateCramDeckFromDocument(
        docsInput,
        mimeType,
        docName || 'Uploaded Notes'
      );

      if (cCode) {
        generatedDeck.courseCode = cCode;
      }
      if (cTitle) {
        generatedDeck.title = cTitle;
      }

      studyStore.saveCustomCramDeck(generatedDeck);
      setDecks((prev) => [generatedDeck, ...prev.filter((d) => d.id !== generatedDeck.id)]);
      handleSelectDeck(generatedDeck);
      setIsGenerating(false);

      Alert.alert(
        'Deck Ready! 🎓',
        `Successfully generated ${generatedDeck.cardCount} high-yield memory flashcards from ${docName}.`
      );
    } catch (err: any) {
      setIsGenerating(false);
      Alert.alert('Generation Notice', err?.message || 'Could not extract flashcards from document. Please verify network and retry.');
    }
  };

  // Auto-switch deck or auto-generate from library course document
  useEffect(() => {
    // Case A: Load existing created deck
    if (params.loadExisting === 'true' || (courseCode && studyStore.hasCramDeck(courseCode) && params.autoStart !== 'generate')) {
      const matched = studyStore.getCramDeckForCourse(courseCode);
      if (matched && matched.id !== activeDeck.id) {
        setActiveDeck(matched);
        setSessionCards(matched.cards);
        setCurrentIndex(0);
        setMemorizedCards([]);
        setReviewCards([]);
        setActionHistory([]);
        return;
      }
    }

    // Case B: Auto-start creation directly from library course document without re-uploading
    if (params.autoStart === 'generate' && (params.materialId || courseCode)) {
      const payload = studyStore.getMaterialDocumentPayload(params.materialId || courseCode);
      if (payload && payload.base64) {
        generateAndActivateDeck(
          payload.base64,
          payload.mimeType,
          params.documentTitle || payload.fileName,
          courseCode,
          courseTitle
        );
      } else {
        Alert.alert('Notice', 'Could not locate course document data in the library.');
      }
    }
  }, [courseCode, params.loadExisting, params.autoStart]);

  // Tracking outcomes
  const [memorizedCards, setMemorizedCards] = useState<CramCard[]>([]);
  const [reviewCards, setReviewCards] = useState<CramCard[]>([]);
  const [actionHistory, setActionHistory] = useState<{
    card: CramCard;
    action: 'memorized' | 'review';
  }[]>([]);

  // Document Upload & AI Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingFileName, setGeneratingFileName] = useState('');

  const isSessionComplete = currentIndex >= sessionCards.length && sessionCards.length > 0;
  const currentCard = sessionCards[currentIndex];

  // Switch deck
  const handleSelectDeck = (deck: CramDeck) => {
    setActiveDeck(deck);
    setSessionCards(deck.cards);
    setCurrentIndex(0);
    setMemorizedCards([]);
    setReviewCards([]);
    setActionHistory([]);
  };

  // Swiped right / Memorized
  const handleSwipeRight = useCallback(() => {
    if (currentIndex >= sessionCards.length) return;
    const card = sessionCards[currentIndex];

    setMemorizedCards((prev) => [...prev, card]);
    setActionHistory((prev) => [...prev, { card, action: 'memorized' }]);
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, sessionCards]);

  // Swiped left / Review Again
  const handleSwipeLeft = useCallback(() => {
    if (currentIndex >= sessionCards.length) return;
    const card = sessionCards[currentIndex];

    setReviewCards((prev) => [...prev, card]);
    setActionHistory((prev) => [...prev, { card, action: 'review' }]);
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, sessionCards]);

  // Navigate back to previous card to review again
  const handlePreviousCard = () => {
    if (currentIndex === 0) return;

    if (actionHistory.length > 0) {
      const last = actionHistory[actionHistory.length - 1];
      setActionHistory((prev) => prev.slice(0, prev.length - 1));

      if (last.action === 'memorized') {
        setMemorizedCards((prev) => prev.filter((c) => c.id !== last.card.id));
      } else {
        setReviewCards((prev) => prev.filter((c) => c.id !== last.card.id));
      }
    }

    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  // Restart entire active deck
  const handleRestartDeck = () => {
    setSessionCards(activeDeck.cards);
    setCurrentIndex(0);
    setMemorizedCards([]);
    setReviewCards([]);
    setActionHistory([]);
  };

  // Re-cram only cards marked for review
  const handleRecramReviewCards = () => {
    if (reviewCards.length === 0) return;
    setSessionCards([...reviewCards]);
    setCurrentIndex(0);
    setMemorizedCards([]);
    setReviewCards([]);
    setActionHistory([]);
  };

  // Pick document and generate flashcards via Synapse
  const handlePickAndGenerateDocument = async () => {
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
        courseCode ||
        result.assets[0].name?.match(/^[A-Z]{2,4}\s*\d{3}/i)?.[0]?.toUpperCase() ||
        'CRAM 301';

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

        // Guard against massive individual payloads (>15MB base64 on mobile)
        if (cleanBase64.length > 15 * 1024 * 1024) {
          Alert.alert(
            'Document Too Large',
            'One of your documents exceeds the 10MB mobile processing limit. For fast generation and the highest yield, please upload a syllabus, lecture slide deck, or chapter summary.'
          );
          return;
        }

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
          courseTitle: courseTitle || file.name?.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') || 'Flashcard Handout',
          documentTitle: file.name || `Lecture_Notes_${i + 1}.pdf`,
          type: mimeType === 'text/plain' ? 'NOTES' : 'PDF',
          pages: 18,
          uploadedAt: 'Just now',
          tag: 'Cram Deck',
          fileUri: file.uri,
          fileBase64: cleanBase64,
          mimeType,
        });
      }

      if (docPayloads.length === 0) {
        Alert.alert('Read Error', 'Could not read any of the selected files. Please retry.');
        return;
      }

      await generateAndActivateDeck(docPayloads, docPayloads[0].mimeType, result.assets[0].name || 'Uploaded Notes', effectiveCode, courseTitle);
    } catch (err: any) {
      Alert.alert('Generation Notice', err.message || 'Could not extract flashcards from document. Please verify network and retry.');
    }
  };

  const progress = sessionCards.length > 0
    ? Math.min(100, Math.round((currentIndex / sessionCards.length) * 100))
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-[#001524]" edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#001524" />

      {/* Header Bar */}
      <Animated.View entering={FadeInDown.duration(450).springify()} className="bg-[#001524] px-5 pt-3 pb-5 border-b border-[#001524]/20 shadow-md">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            {/* Back to Home Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.back()}
              className="w-8 h-8 rounded-full bg-white/10 border border-white/15 items-center justify-center mr-0.5"
            >
              <ChevronLeft size={16} color="#ffa200" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Deck Switcher Pill */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDeckModalVisible(true)}
              className="rounded-full bg-[#ffa200]/15 px-3 py-1.5 border border-[#ffa200]/30 flex-row items-center gap-1.5"
            >
              <Layers size={12} color="#ffa200" />
              <Text className="text-xs font-bold text-[#ffa200] tracking-wide">
                {activeDeck.courseCode} Deck
              </Text>
              <ChevronDown size={12} color="#ffa200" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-2">
            {/* Upload Document Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickAndGenerateDocument}
              className="flex-row items-center gap-1 bg-[#ffa200] px-2.5 py-1.5 rounded-full shadow-sm"
            >
              <Upload size={11} color="#001524" strokeWidth={2.5} />
              <Text className="text-[11px] font-bold text-[#001524]">
                Upload
              </Text>
            </TouchableOpacity>

            {/* Card Counter */}
            <View className="flex-row items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-full border border-white/10">
              <Sparkles size={11} color="#38bdf8" />
              <Text className="text-[10px] font-bold text-white">
                {isSessionComplete
                  ? 'Finished'
                  : `${Math.min(currentIndex + 1, sessionCards.length)}/${sessionCards.length}`}
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-2xl font-extrabold tracking-[-0.03em] text-[#ffffff]">
          Cram Sheets
        </Text>
        <Text className="text-xs text-[#e1e5ea]/80 mt-1">
          Master core concepts, memory anchors, and exam pitfalls.
        </Text>
      </Animated.View>

      {/* Scrollable Container */}
      <ScrollView
        className="flex-1 bg-[#f1f3f5] px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar & Indicators */}
        <Animated.View entering={BounceIn.delay(100).duration(500)} className="mb-4">
          <View className="flex-row items-center justify-between mb-1.5 px-0.5">
            <Text className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
              {isSessionComplete ? 'Mastery Review' : 'Deck Progress'}
            </Text>
            <Text className="text-[10px] font-bold text-[#003c66]">
              {progress}%
            </Text>
          </View>

          <View className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
            <View
              className="h-full bg-[#003c66] rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </Animated.View>

        {/* Interactive Card Stack or Session Summary */}
        <Animated.View entering={FadeInUp.delay(200).duration(500).springify().damping(10)}>
          <CardStack
            cards={sessionCards}
            currentIndex={currentIndex}
            totalDeckCards={sessionCards.length}
            deckTitle={activeDeck.title}
            courseCode={activeDeck.courseCode}
            memorizedCards={memorizedCards}
            reviewCards={reviewCards}
            isSessionComplete={isSessionComplete}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            onRestartDeck={handleRestartDeck}
            onRecramReviewCards={handleRecramReviewCards}
            onChangeDeck={() => setDeckModalVisible(true)}
          />
        </Animated.View>

        {/* Quick Action Control Bar (Visible during study session) */}
        {!isSessionComplete && currentCard && (
          <View className="mt-5">
            <View className="flex-row items-center justify-between gap-3">
              {/* Previous Card Button (Review previous card) */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={currentIndex === 0}
                onPress={handlePreviousCard}
                style={{ opacity: currentIndex === 0 ? 0.45 : 1 }}
                className="flex-1 py-3.5 px-3 rounded-2xl bg-white border border-gray-200 flex-row items-center justify-center gap-1.5 shadow-sm"
              >
                <ChevronLeft size={16} color={currentIndex === 0 ? '#94a3b8' : '#001524'} strokeWidth={2.5} />
                <Text
                  className="text-xs font-bold"
                  style={{ color: currentIndex === 0 ? '#94a3b8' : '#001524' }}
                >
                  Previous Card
                </Text>
              </TouchableOpacity>

              {/* Memorized Button (Advance to next card) */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSwipeRight}
                className="flex-1 py-3.5 px-3 rounded-2xl bg-emerald-600 border border-emerald-700 flex-row items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 size={16} color="#ffffff" strokeWidth={2.2} />
                <Text className="text-xs font-bold text-white">
                  Memorized
                </Text>
              </TouchableOpacity>
            </View>

            {/* Gesture Cue Text */}
            <Text className="text-center text-[11px] font-medium text-[#8995a9] mt-3">
              👈 Swipe left to review • Swipe right if memorized 👉 • Tap to flip
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Deck Selector Modal */}
      <DeckModal
        visible={deckModalVisible}
        decks={decks}
        selectedDeckId={activeDeck.id}
        onSelectDeck={handleSelectDeck}
        onClose={() => setDeckModalVisible(false)}
        onOpenUploadPrompt={handlePickAndGenerateDocument}
      />

      {/* Loading Modal during Document AI Generation */}
      <Modal visible={isGenerating} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/75 items-center justify-center px-6">
          <View className="bg-[#001524] p-6 rounded-3xl items-center border border-white/15 max-w-sm w-full shadow-2xl">
            <View className="w-14 h-14 rounded-2xl bg-[#ffa200]/20 items-center justify-center mb-4 border border-[#ffa200]/30">
              <FileText size={24} color="#ffa200" />
            </View>
            <ActivityIndicator size="large" color="#ffa200" className="mb-4" />
            <Text className="text-base font-bold text-white text-center mb-1">
              Extracting High-Yield Cram Deck
            </Text>
            <Text className="text-xs text-white/70 text-center mb-3">
              {generatingFileName}
            </Text>
            <View className="bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 w-full">
              <Text className="text-[11px] text-[#ffa200] text-center font-medium leading-4">
                Synthesizing 12–15 high-yield concepts for 70%+ exam syllabus coverage...
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
