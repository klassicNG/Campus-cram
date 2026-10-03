import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  BookOpen,
  FileText,
  Upload,
  Layers,
  Sparkles,
  Zap,
  FolderOpen,
  CheckCircle2,
  X,
  Play,
} from 'lucide-react-native';
import { AnimatedPressable } from '../../components/common/animated-pressable';
import Animated, { FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';
import { studyStore, CourseMaterial } from '../../services/course-study-store';

export default function LibraryScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [materials, setMaterials] = useState<CourseMaterial[]>(() => studyStore.getAllMaterials());

  // CBT Exam Format Selection Modal State
  const [cbtModalVisible, setCbtModalVisible] = useState(false);
  const [selectedMaterialForCbt, setSelectedMaterialForCbt] = useState<CourseMaterial | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'40(test)' | '60(exam)'>('40(test)');

  // Real-time synchronization with studyStore updates across tabs
  useEffect(() => {
    setMaterials(studyStore.getAllMaterials());
    const unsubscribe = studyStore.subscribe(() => {
      setMaterials(studyStore.getAllMaterials());
    });
    return unsubscribe;
  }, []);

  const uniqueCourseCodes = Array.from(new Set(materials.map((m) => m.courseCode)));
  const filters = ['ALL', ...uniqueCourseCodes];

  const filteredMaterials = selectedFilter === 'ALL'
    ? materials
    : materials.filter((m) => m.courseCode === selectedFilter);

  const handleUploadNew = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        let addedCount = 0;
        const now = Date.now();

        for (let i = 0; i < result.assets.length; i++) {
          const file = result.assets[i];
          let fileBase64 = '';
          try {
            const raw = await FileSystem.readAsStringAsync(file.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            fileBase64 = raw.replace(/(\r\n|\n|\r)/gm, '');
          } catch (readErr) {
            console.warn('Could not read base64 for uploaded document:', readErr);
          }

          const guessedCode =
            file.name?.match(/^[A-Z]{2,4}\s*\d{3}/i)?.[0]?.toUpperCase() || 'UPLOAD';

          const newMat: CourseMaterial = {
            id: `mat-${now}-${i}`,
            courseCode: guessedCode,
            courseTitle: file.name?.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') || 'Uploaded Course Notes',
            documentTitle: file.name || 'Lecture_Notes.pdf',
            type: file.name?.toLowerCase().endsWith('.txt') ? 'NOTES' : 'PDF',
            pages: 24,
            uploadedAt: 'Just now',
            tag: 'New Upload',
            fileUri: file.uri,
            fileBase64,
            mimeType: file.mimeType || (file.name?.toLowerCase().endsWith('.txt') ? 'text/plain' : 'application/pdf'),
          };

          studyStore.addOrUpdateMaterial(newMat);
          addedCount++;
        }

        if (addedCount === 1) {
          Alert.alert(
            'Document Added! 📚',
            `${result.assets[0].name} is now stored in your library. You can generate CBT Exams, Theory Papers, or Cram Decks from it without re-uploading.`
          );
        } else {
          Alert.alert(
            'Documents Added! 📚',
            `${addedCount} documents are now stored in your library. You can generate CBT Exams, Theory Papers, or Cram Decks from them without re-uploading.`
          );
        }
      }
    } catch (err) {
      Alert.alert('Notice', 'Could not open document picker.');
    }
  };

  // 1. CBT Exam Press: Load last created exam OR prompt for Test vs Exam
  const handleCbtExamPress = (mat: CourseMaterial) => {
    if (studyStore.hasCbtExam(mat.courseCode)) {
      router.push({
        pathname: '/(tabs)/e-exam',
        params: {
          courseCode: mat.courseCode,
          courseTitle: mat.courseTitle,
          documentTitle: mat.documentTitle,
          materialId: mat.id,
          loadExisting: 'true',
        },
      });
    } else {
      setSelectedMaterialForCbt(mat);
      setSelectedFormat('40(test)');
      setCbtModalVisible(true);
    }
  };

  const handleConfirmStartCbt = () => {
    if (!selectedMaterialForCbt) return;
    setCbtModalVisible(false);

    router.push({
      pathname: '/(tabs)/e-exam',
      params: {
        courseCode: selectedMaterialForCbt.courseCode,
        courseTitle: selectedMaterialForCbt.courseTitle,
        documentTitle: selectedMaterialForCbt.documentTitle,
        materialId: selectedMaterialForCbt.id,
        format: selectedFormat,
        autoStart: 'generate',
      },
    });
  };

  // 2. Theory Exam Press: Load existing paper OR synthesize from document
  const handleTheoryExamPress = (mat: CourseMaterial) => {
    if (studyStore.hasTheoryExam(mat.courseCode)) {
      router.push({
        pathname: '/(tabs)/theory-session',
        params: {
          courseCode: mat.courseCode,
          courseTitle: mat.courseTitle,
          documentTitle: mat.documentTitle,
          materialId: mat.id,
          loadExisting: 'true',
        },
      });
    } else {
      router.push({
        pathname: '/(tabs)/theory-session',
        params: {
          courseCode: mat.courseCode,
          courseTitle: mat.courseTitle,
          documentTitle: mat.documentTitle,
          materialId: mat.id,
          autoStart: 'generate',
        },
      });
    }
  };

  // 3. Cram Sheet Press: Load existing deck OR synthesize from document
  const handleCramSheetPress = (mat: CourseMaterial) => {
    if (studyStore.hasCramDeck(mat.courseCode)) {
      router.push({
        pathname: '/(tabs)/cram-sheet',
        params: {
          courseCode: mat.courseCode,
          courseTitle: mat.courseTitle,
          documentTitle: mat.documentTitle,
          materialId: mat.id,
          loadExisting: 'true',
        },
      });
    } else {
      router.push({
        pathname: '/(tabs)/cram-sheet',
        params: {
          courseCode: mat.courseCode,
          courseTitle: mat.courseTitle,
          documentTitle: mat.documentTitle,
          materialId: mat.id,
          autoStart: 'generate',
        },
      });
    }
  };

  // 4. AI Tutor Press: Open Socratic session for this course
  const handleAiTutorPress = (mat: CourseMaterial) => {
    router.push({
      pathname: '/(tabs)/ai-tutor' as any,
      params: {
        courseCode: mat.courseCode,
        courseTitle: mat.courseTitle,
        documentTitle: mat.documentTitle,
        materialId: mat.id,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#001524]" edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#001524" />

      {/* Header Bar */}
      <Animated.View entering={FadeInDown.duration(450).springify()} className="bg-[#001524] px-5 pt-3 pb-5 border-b border-[#001524]/20 shadow-md">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-xl bg-[#ffa200]/20 border border-[#ffa200]/30 items-center justify-center">
              <BookOpen size={16} color="#ffa200" />
            </View>
            <View>
              <Text className="text-xs font-bold uppercase tracking-wider text-[#ffa200]">
                Study Library
              </Text>
              <Text className="text-[10px] text-white/60">
                {materials.length} stored documents & handouts
              </Text>
            </View>
          </View>

          {/* Quick Upload Button */}
          <AnimatedPressable
            onPress={handleUploadNew}
            className="flex-row items-center gap-1.5 bg-[#ffa200] px-3.5 py-1.5 rounded-full shadow-sm"
          >
            <Upload size={12} color="#001524" strokeWidth={2.5} />
            <Text className="text-xs font-bold text-[#001524]">
              Upload
            </Text>
          </AnimatedPressable>
        </View>

        <Text className="text-2xl font-extrabold tracking-[-0.03em] text-[#ffffff] mt-2">
          Course Materials
        </Text>
        <Text className="text-xs text-[#e1e5ea]/80 mt-1">
          Launch Cram Sheets, Socratic AI Tutoring, or CBT simulations from your documents.
        </Text>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row mt-4 -mx-1"
        >
          {filters.map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.8}
                onPress={() => setSelectedFilter(filter)}
                className={`mx-1 px-3.5 py-1.5 rounded-full border ${
                  isSelected
                    ? 'bg-[#ffa200] border-[#ffa200]'
                    : 'bg-white/10 border-white/15'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    isSelected ? 'text-[#001524]' : 'text-white/80'
                  }`}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Main Material List */}
      <ScrollView
        className="flex-1 bg-[#f1f3f5] px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredMaterials.map((mat, i) => {
          const hasCbt = studyStore.hasCbtExam(mat.courseCode);
          const hasTheory = studyStore.hasTheoryExam(mat.courseCode);
          const hasCram = studyStore.hasCramDeck(mat.courseCode);
          const hasTutor = studyStore.hasTutorSession(mat.courseCode);

          return (
            <Animated.View
              key={mat.id}
              entering={FadeInUp.delay(80 + i * 50).duration(450)}
              className="bg-white rounded-2xl p-4 mb-3.5 border border-black/5 shadow-xs"
            >
              {/* Top Bar: Type Badge, Course Code, Tag */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <View className="bg-[#001524]/5 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-bold text-[#003c66]">
                      {mat.courseCode}
                    </Text>
                  </View>
                  <View className="bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Text className="text-[9px] font-bold text-amber-700 uppercase">
                      {mat.type}
                    </Text>
                  </View>
                </View>

                <Text className="text-[10px] text-gray-400">
                  {mat.uploadedAt}
                </Text>
              </View>

              {/* Document Details */}
              <Text className="text-base font-bold text-[#0f1c24] mb-1 tracking-tight">
                {mat.courseTitle}
              </Text>
              <View className="flex-row items-center gap-1.5 mb-3.5">
                <FileText size={12} color="#8995a9" />
                <Text className="text-[11px] text-[#8995a9] font-mono flex-1" numberOfLines={1}>
                  {mat.documentTitle}
                </Text>
                {mat.pages && (
                  <Text className="text-[10px] text-gray-400">
                    {mat.pages} pages
                  </Text>
                )}
              </View>

              {/* Quick Launch Actions: 2x2 Grid (Cram Sheet, AI Tutor, CBT Exam, Theory Exam) */}
              <View className="flex-col gap-2 pt-3 border-t border-gray-100">
                {/* Row 1: Cram Sheet & AI Tutor */}
                <View className="flex-row items-center gap-2">
                  <AnimatedPressable
                    onPress={() => handleCramSheetPress(mat)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#001524]/5 flex-row items-center justify-center gap-1.5 border border-black/5"
                  >
                    <Layers size={13} color="#003c66" />
                    <Text className="text-[11px] font-bold text-[#003c66]">
                      Cram Sheet
                    </Text>
                    {hasCram && (
                      <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" />
                    )}
                  </AnimatedPressable>

                  <AnimatedPressable
                    onPress={() => handleAiTutorPress(mat)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-50 flex-row items-center justify-center gap-1.5 border border-amber-200"
                  >
                    <Sparkles size={13} color="#d97706" />
                    <Text className="text-[11px] font-bold text-amber-800">
                      AI Tutor
                    </Text>
                    {hasTutor && (
                      <View className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-0.5" />
                    )}
                  </AnimatedPressable>
                </View>

                {/* Row 2: CBT Exam & Theory Exam */}
                <View className="flex-row items-center gap-2">
                  <AnimatedPressable
                    onPress={() => handleCbtExamPress(mat)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 flex-row items-center justify-center gap-1.5 border border-emerald-200"
                  >
                    <Zap size={13} color="#059669" />
                    <Text className="text-[11px] font-bold text-emerald-800">
                      CBT Exam
                    </Text>
                    {hasCbt ? (
                      <View className="flex-row items-center gap-1 bg-emerald-200/60 px-1.5 py-0.5 rounded-md">
                        <CheckCircle2 size={10} color="#059669" />
                        <Text className="text-[9px] font-bold text-emerald-800">Ready</Text>
                      </View>
                    ) : (
                      <View className="bg-emerald-100 px-1.5 py-0.5 rounded-md">
                        <Text className="text-[9px] font-bold text-emerald-700">New</Text>
                      </View>
                    )}
                  </AnimatedPressable>

                  <AnimatedPressable
                    onPress={() => handleTheoryExamPress(mat)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-blue-50 flex-row items-center justify-center gap-1.5 border border-blue-200"
                  >
                    <FileText size={13} color="#0070f3" />
                    <Text className="text-[11px] font-bold text-blue-800">
                      Theory Exam
                    </Text>
                    {hasTheory ? (
                      <View className="flex-row items-center gap-1 bg-blue-200/60 px-1.5 py-0.5 rounded-md">
                        <CheckCircle2 size={10} color="#0070f3" />
                        <Text className="text-[9px] font-bold text-blue-800">Ready</Text>
                      </View>
                    ) : (
                      <View className="bg-blue-100 px-1.5 py-0.5 rounded-md">
                        <Text className="text-[9px] font-bold text-blue-700">New</Text>
                      </View>
                    )}
                  </AnimatedPressable>
                </View>
              </View>
            </Animated.View>
          );
        })}

        {filteredMaterials.length === 0 && (
          <View className="items-center justify-center py-16">
            <FolderOpen size={40} color="#cbd5e1" />
            <Text className="text-sm font-bold text-gray-400 mt-2">
              No materials found for this course
            </Text>
            <TouchableOpacity
              onPress={handleUploadNew}
              className="mt-3 px-4 py-2 bg-[#ffa200] rounded-full"
            >
              <Text className="text-xs font-bold text-[#001524]">
                Upload Course Notes
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* CBT Exam Format Selection Modal (Shown when CBT Exam hasn't been created yet) */}
      <Modal
        visible={cbtModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCbtModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end sm:justify-center p-4">
          <View className="bg-white rounded-3xl p-5 shadow-2xl border border-gray-100">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <View className="flex-row items-center gap-2.5">
                <View className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 items-center justify-center">
                  <Zap size={20} color="#059669" />
                </View>
                <View>
                  <Text className="text-base font-extrabold text-[#001524]">
                    Create CBT Simulation
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {selectedMaterialForCbt?.courseCode}: {selectedMaterialForCbt?.courseTitle}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setCbtModalVisible(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Document Context Banner */}
            <View className="mt-3.5 p-3 rounded-2xl bg-[#001524]/5 flex-row items-center gap-2 border border-black/5">
              <FileText size={16} color="#003c66" />
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Generating From Course Document
                </Text>
                <Text className="text-xs font-semibold text-[#003c66]" numberOfLines={1}>
                  {selectedMaterialForCbt?.documentTitle}
                </Text>
              </View>
            </View>

            <Text className="text-xs font-bold text-gray-700 mt-4 mb-2 uppercase tracking-wider">
              Select Examination Format
            </Text>

            {/* Option 1: Test Mode (40 questions, 30 min) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedFormat('40(test)')}
              className={`p-4 rounded-2xl border mb-3 flex-row items-center justify-between ${
                selectedFormat === '40(test)'
                  ? 'bg-amber-500/10 border-[#ffa200]'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <View className="flex-1 pr-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-sm font-extrabold text-[#001524]">
                    Test Format (40 Questions)
                  </Text>
                  <View className="bg-amber-500/20 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-extrabold text-amber-800">
                      30 Mins
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-600">
                  Ideal for midterms, progressive mastery check, and continuous assessment.
                </Text>
              </View>
              <View
                className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                  selectedFormat === '40(test)'
                    ? 'border-[#ffa200] bg-[#ffa200]'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {selectedFormat === '40(test)' && (
                  <View className="w-2.5 h-2.5 rounded-full bg-[#001524]" />
                )}
              </View>
            </TouchableOpacity>

            {/* Option 2: Exam Mode (60 questions, 40 min) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedFormat('60(exam)')}
              className={`p-4 rounded-2xl border mb-4 flex-row items-center justify-between ${
                selectedFormat === '60(exam)'
                  ? 'bg-emerald-500/10 border-emerald-600'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <View className="flex-1 pr-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-sm font-extrabold text-[#001524]">
                    Exam Format (60 Questions)
                  </Text>
                  <View className="bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-extrabold text-emerald-800">
                      40 Mins
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-600">
                  Full semester examination covering edge cases, comprehensive synthesis, and deep rigor.
                </Text>
              </View>
              <View
                className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                  selectedFormat === '60(exam)'
                    ? 'border-emerald-600 bg-emerald-600'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {selectedFormat === '60(exam)' && (
                  <View className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </View>
            </TouchableOpacity>

            {/* Modal Actions */}
            <View className="flex-row items-center gap-2 pt-2">
              <TouchableOpacity
                onPress={() => setCbtModalVisible(false)}
                className="flex-1 py-3.5 rounded-2xl bg-gray-100 items-center justify-center"
              >
                <Text className="text-xs font-bold text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmStartCbt}
                className="flex-2 py-3.5 px-6 rounded-2xl bg-[#ffa200] flex-row items-center justify-center gap-2 shadow-md"
              >
                <Play size={14} color="#001524" fill="#001524" />
                <Text className="text-xs font-extrabold text-[#001524] tracking-tight">
                  Generate & Start Exam
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

