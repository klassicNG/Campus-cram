import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import {
  ChevronLeft,
  Sparkles,
  Zap,
  FileText,
  Upload,
  Trash2,
  Play,
  ShieldCheck,
  Layers,
  RotateCw,
} from 'lucide-react-native';
import {
  studyStore,
  PastQuestionTraining,
  CourseMaterial,
  CoverageAnalysis,
} from '../../services/course-study-store';

export default function AITrainerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    courseCode?: string;
    mode?: 'cbt' | 'theory';
  }>();

  // Mode: 'cbt' vs 'theory'
  const [activeMode, setActiveMode] = useState<'cbt' | 'theory'>(
    params.mode === 'theory' ? 'theory' : 'cbt'
  );

  const [materials, setMaterials] = useState<CourseMaterial[]>(() => studyStore.getAllMaterials());
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(
    params.courseCode || materials[0]?.courseCode || 'CSC 301'
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pastQuestionsList, setPastQuestionsList] = useState<PastQuestionTraining[]>(() =>
    studyStore.getAllPastQuestions()
  );

  // Subscribe to store updates
  useEffect(() => {
    const unsub = studyStore.subscribe(() => {
      setMaterials(studyStore.getAllMaterials());
      setPastQuestionsList(studyStore.getAllPastQuestions());
    });
    return unsub;
  }, []);

  // Safe initial parameter sync that does NOT override manual user clicks later
  const initialParamsHandled = useRef(false);
  useEffect(() => {
    if (!initialParamsHandled.current) {
      initialParamsHandled.current = true;
      if (params.courseCode) {
        setSelectedCourseCode(params.courseCode.toUpperCase().trim());
      }
      if (params.mode === 'cbt' || params.mode === 'theory') {
        setActiveMode(params.mode);
      }
    }
  }, [params.courseCode, params.mode]);

  const selectedMaterial = studyStore.getMaterial(selectedCourseCode);
  const currentTraining = studyStore.getPastQuestions(selectedCourseCode, activeMode);

  // Upload past question and train format (supports multi-document upload)
  const handleUploadPastQuestion = async () => {
    try {
      console.log('[AITrainer] Opening DocumentPicker for past questions...');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('[AITrainer] Document picker was canceled.');
        return;
      }

      setIsAnalyzing(true);

      const combinedNames: string[] = [];
      const base64List: string[] = [];
      let primaryMime = 'application/pdf';

      for (let i = 0; i < result.assets.length; i++) {
        const file = result.assets[i];
        combinedNames.push(file.name || `Past_Paper_${i + 1}.pdf`);
        const mime = file.mimeType || (file.name?.toLowerCase().endsWith('.txt') ? 'text/plain' : 'application/pdf');
        if (i === 0) primaryMime = mime;

        try {
          const raw = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const clean = raw.replace(/(\r\n|\n|\r)/gm, '');
          if (clean) base64List.push(clean);
        } catch (err) {
          console.warn('[AITrainer] Error reading file as base64:', err);
        }
      }

      const displayFileName = combinedNames.length === 1 
        ? combinedNames[0] 
        : `${combinedNames.length} Past Question Papers (${combinedNames.join(', ')})`;

      // Analyze syllabus alignment & gap extraction
      const textToAnalyze = combinedNames.join(' ') + ' ' + (base64List[0]?.slice(0, 1000) || '');
      const analysis: CoverageAnalysis = studyStore.analyzeSyllabusCoverage(
        textToAnalyze,
        selectedCourseCode,
        activeMode
      );

      const training: PastQuestionTraining = {
        id: `pq-${selectedCourseCode.toLowerCase()}-${activeMode}-${Date.now()}`,
        courseCode: selectedCourseCode,
        courseTitle: selectedMaterial?.courseTitle,
        targetMode: activeMode,
        fileName: displayFileName,
        fileUri: result.assets[0].uri,
        fileBase64: base64List[0] || '',
        mimeType: primaryMime,
        uploadedAt: 'Just now',
        coverageAnalysis: analysis,
      };

      studyStore.savePastQuestions(training);
      setPastQuestionsList(studyStore.getAllPastQuestions());
      setIsAnalyzing(false);

      Alert.alert(
        'Format Training Calibrated! 🎯',
        `The AI Trainer has analyzed ${displayFileName} against your ${selectedCourseCode} syllabus (${analysis.syllabusCoveragePercent}% coverage). Recurring questions will be reformatted, and syllabus gaps will be filled in the professor's exact style.`
      );
    } catch (err: any) {
      setIsAnalyzing(false);
      Alert.alert('Notice', err?.message || 'Could not process past question document.');
    }
  };

  const handleDeleteTraining = () => {
    Alert.alert(
      'Remove Format Training?',
      `Are you sure you want to remove the ${activeMode.toUpperCase()} past questions training for ${selectedCourseCode}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            console.log('[AITrainer] Deleting past questions for:', selectedCourseCode, activeMode);
            studyStore.deletePastQuestions(selectedCourseCode, activeMode);
            setPastQuestionsList(studyStore.getAllPastQuestions());
          },
        },
      ]
    );
  };

  const handleLaunchTrainedExam = () => {
    console.log('[AITrainer] Launching exam for:', selectedCourseCode, activeMode);
    if (activeMode === 'cbt') {
      router.push({
        pathname: '/(tabs)/e-exam',
        params: {
          courseCode: selectedCourseCode,
          courseTitle: selectedMaterial?.courseTitle,
          documentTitle: selectedMaterial?.documentTitle,
          materialId: selectedMaterial?.id,
          format: '40(test)',
          autoStart: 'generate',
        },
      });
    } else {
      router.push({
        pathname: '/(tabs)/theory-session',
        params: {
          courseCode: selectedCourseCode,
          courseTitle: selectedMaterial?.courseTitle,
          documentTitle: selectedMaterial?.documentTitle,
          materialId: selectedMaterial?.id,
          autoStart: 'generate',
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#001524" />

      {/* Header Bar */}
      <Animated.View entering={FadeInDown.duration(450).springify()} style={styles.headerBar}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={16} color="#ffa200" strokeWidth={2.5} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.trainerBadge}>
            <Sparkles size={13} color="#ffa200" />
            <Text style={styles.trainerBadgeText}>AI Format Trainer</Text>
          </View>
        </View>

        <Text style={styles.headerTitle}>Train Question Formats</Text>
        <Text style={styles.headerSubtitle}>
          Upload past university exam papers to calibrate our proctors on your professor's exact testing style, recurring questions, and distractor models.
        </Text>

        {/* Mode Toggle: CBT vs Theory */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              console.log('[AITrainer] Set activeMode: cbt');
              setActiveMode('cbt');
            }}
            style={[
              styles.modeButton,
              activeMode === 'cbt' && styles.modeButtonActive,
            ]}
          >
            <Zap size={14} color={activeMode === 'cbt' ? '#001524' : '#ffffff'} />
            <Text
              style={[
                styles.modeButtonText,
                activeMode === 'cbt' && styles.modeButtonTextActive,
              ]}
            >
              CBT Past Questions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              console.log('[AITrainer] Set activeMode: theory');
              setActiveMode('theory');
            }}
            style={[
              styles.modeButton,
              activeMode === 'theory' && styles.modeButtonActive,
            ]}
          >
            <FileText size={14} color={activeMode === 'theory' ? '#001524' : '#ffffff'} />
            <Text
              style={[
                styles.modeButtonText,
                activeMode === 'theory' && styles.modeButtonTextActive,
              ]}
            >
              Theory Past Papers
            </Text>
          </TouchableOpacity>
        </View>

        {/* Course Selector Carousel */}
        <Text style={styles.carouselLabel}>Select Target Course</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
        >
          {materials.map((mat) => {
            const isSelected = selectedCourseCode === mat.courseCode;
            const hasTraining = studyStore.hasPastQuestions(mat.courseCode, activeMode);

            return (
              <TouchableOpacity
                key={mat.id}
                activeOpacity={0.75}
                onPress={() => {
                  console.log('[AITrainer] Course selected:', mat.courseCode);
                  setSelectedCourseCode(mat.courseCode);
                }}
                style={[
                  styles.courseChip,
                  isSelected && styles.courseChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.courseChipText,
                    isSelected && styles.courseChipTextSelected,
                  ]}
                >
                  {mat.courseCode}
                </Text>
                {hasTraining && <View style={styles.trainedDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Course Context Banner */}
        <Animated.View entering={FadeInUp.delay(100).duration(450)} style={styles.courseContextCard}>
          <View style={styles.courseContextRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.contextSubLabel}>Active Training Target</Text>
              <Text style={styles.contextMainLabel}>
                {selectedCourseCode}: {selectedMaterial?.courseTitle || 'Curriculum Course'}
              </Text>
            </View>
            <View style={styles.contextModePill}>
              <Text style={styles.contextModePillText}>
                {activeMode === 'cbt' ? 'Objective CBT' : 'University Theory'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* State A: Course is ALREADY Trained on Past Questions */}
        {currentTraining ? (
          <Animated.View entering={ZoomIn.delay(180).duration(500).springify().damping(14)} style={styles.trainedCard}>
            {/* Training Status Badge */}
            <View style={styles.statusRow}>
              <View style={styles.statusInfoGroup}>
                <View style={styles.statusIconWrap}>
                  <ShieldCheck size={18} color="#059669" />
                </View>
                <View>
                  <Text style={styles.statusHeading}>Format Model Calibrated</Text>
                  <Text style={styles.statusSub}>Uploaded {currentTraining.uploadedAt}</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleDeleteTraining}
                style={styles.deleteButton}
              >
                <Trash2 size={14} color="#e11d48" />
              </TouchableOpacity>
            </View>

            {/* Document Details */}
            <View style={styles.docRow}>
              <FileText size={16} color="#003c66" />
              <Text style={styles.docNameText} numberOfLines={1}>
                {currentTraining.fileName}
              </Text>
            </View>

            {/* Syllabus Alignment Breakdown */}
            {currentTraining.coverageAnalysis && (
              <View style={{ marginBottom: 16 }}>
                <View style={styles.coverageLabelRow}>
                  <Text style={styles.coverageLabelText}>Syllabus Coverage & Alignment</Text>
                  <Text style={styles.coveragePercentText}>
                    {currentTraining.coverageAnalysis.syllabusCoveragePercent}% Matched
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${currentTraining.coverageAnalysis.syllabusCoveragePercent}%` },
                    ]}
                  />
                </View>

                {/* Reformatted Topics List */}
                <View style={styles.reformatBox}>
                  <View style={styles.boxTitleRow}>
                    <RotateCw size={12} color="#059669" />
                    <Text style={styles.boxTitleTextGreen}>
                      Reformatted Recurring Topics (From Past Questions):
                    </Text>
                  </View>
                  <Text style={styles.boxSubTextGreen}>
                    The AI repeats these concepts while altering phrasing, parameters, and distractor traps.
                  </Text>
                  {currentTraining.coverageAnalysis.coveredTopics.map((topic, i) => (
                    <View key={i} style={styles.topicBulletRow}>
                      <View style={styles.greenBullet} />
                      <Text style={styles.topicBulletTextGreen}>{topic}</Text>
                    </View>
                  ))}
                </View>

                {/* Gap-Filling Topics List */}
                {currentTraining.coverageAnalysis.gapTopics.length > 0 && (
                  <View style={styles.gapBox}>
                    <View style={styles.boxTitleRow}>
                      <Layers size={12} color="#d97706" />
                      <Text style={styles.boxTitleTextAmber}>
                        Synthesized Gap Topics (Syllabus Coverage):
                      </Text>
                    </View>
                    <Text style={styles.boxSubTextAmber}>
                      Missing syllabus areas synthesized in the professor's exact testing format & style.
                    </Text>
                    {currentTraining.coverageAnalysis.gapTopics.map((topic, i) => (
                      <View key={i} style={styles.topicBulletRow}>
                        <View style={styles.amberBullet} />
                        <Text style={styles.topicBulletTextAmber}>{topic}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Extracted Style Profile */}
                <View style={styles.styleSignatureBox}>
                  <Text style={styles.styleSignatureLabel}>Extracted Professor Style Signature</Text>
                  <Text style={styles.styleSignatureText}>
                    {currentTraining.coverageAnalysis.styleProfile}
                  </Text>
                </View>
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleLaunchTrainedExam}
                style={styles.primaryActionButton}
              >
                <Play size={14} color="#001524" fill="#001524" />
                <Text style={styles.primaryActionText}>
                  {activeMode === 'cbt' ? 'Launch Trained CBT Exam' : 'Launch Trained Theory Exam'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleUploadPastQuestion}
                style={styles.secondaryActionButton}
              >
                <Upload size={13} color="#64748b" />
                <Text style={styles.secondaryActionText}>
                  Upload New Past Questions to Retrain
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          /* State B: Course is NOT Yet Trained on Past Questions */
          <Animated.View entering={FadeInUp.delay(180).duration(500).springify().damping(14)} style={styles.untrainedCard}>
            <View style={styles.uploadIconCircle}>
              <Upload size={24} color="#d97706" />
            </View>

            <Text style={styles.untrainedTitle}>
              Upload {activeMode === 'cbt' ? 'CBT Past Questions' : 'Theory Past Papers'}
            </Text>
            <Text style={styles.untrainedSub}>
              Upload past departmental exam archives for{' '}
              <Text style={{ fontWeight: '800', color: '#001524' }}>{selectedCourseCode}</Text>. The
              AI Trainer will extract your professor's formatting, distractor tricks, and recurring topics.
            </Text>

            {isAnalyzing ? (
              <View style={styles.analyzingBox}>
                <ActivityIndicator size="large" color="#ffa200" />
                <Text style={styles.analyzingText}>
                  Analyzing Syllabus Alignment & Question Styles...
                </Text>
                <Text style={styles.analyzingSub}>
                  Cross-referencing past questions with course syllabus
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleUploadPastQuestion}
                style={styles.uploadMainButton}
              >
                <Upload size={16} color="#001524" strokeWidth={2.5} />
                <Text style={styles.uploadMainButtonText}>
                  Select Past Question Document (PDF / Text)
                </Text>
              </TouchableOpacity>
            )}

            {/* How It Works Explainer Card */}
            <View style={styles.explainerCard}>
              <Text style={styles.explainerHeader}>How Format Training Operates</Text>
              <View style={{ gap: 10 }}>
                <View style={styles.stepRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>
                    <Text style={{ fontWeight: 'bold' }}>Recurring Questions:</Text> Questions
                    present in the past papers are repeated with fresh phrasing and alternative
                    scenarios.
                  </Text>
                </View>
                <View style={styles.stepRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>
                    <Text style={{ fontWeight: 'bold' }}>Syllabus Gaps:</Text> Missing syllabus areas
                    are generated to match the exact format, depth, and tone of the past questions.
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* All Calibrated Courses List */}
        <View style={{ marginTop: 8 }}>
          <Text style={styles.allFormatsHeading}>
            All Calibrated Course Formats ({pastQuestionsList.length})
          </Text>

          {pastQuestionsList.map((item) => (
            <View key={item.id} style={styles.calibratedItemCard}>
              <View style={styles.calibratedItemLeft}>
                <View
                  style={[
                    styles.calibratedIconWrap,
                    { backgroundColor: item.targetMode === 'cbt' ? '#ecfdf5' : '#eff6ff' },
                  ]}
                >
                  {item.targetMode === 'cbt' ? (
                    <Zap size={15} color="#059669" />
                  ) : (
                    <FileText size={15} color="#0070f3" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.calibratedItemCodeRow}>
                    <Text style={styles.calibratedCourseText}>{item.courseCode}</Text>
                    <View style={styles.calibratedModeTag}>
                      <Text style={styles.calibratedModeTagText}>{item.targetMode}</Text>
                    </View>
                  </View>
                  <Text style={styles.calibratedFileText} numberOfLines={1}>
                    {item.fileName}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  console.log('[AITrainer] Inspect item:', item.courseCode, item.targetMode);
                  setSelectedCourseCode(item.courseCode);
                  setActiveMode(item.targetMode);
                }}
                style={styles.inspectButton}
              >
                <Text style={styles.inspectButtonText}>Inspect</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#001524',
  },
  headerBar: {
    backgroundColor: '#001524',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  trainerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 162, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 162, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  trainerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffa200',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(225, 229, 234, 0.8)',
    marginTop: 4,
    lineHeight: 18,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 4,
    borderRadius: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#ffa200',
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modeButtonTextActive: {
    color: '#001524',
  },
  carouselLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
  },
  carouselContent: {
    paddingHorizontal: 2,
    gap: 8,
  },
  courseChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courseChipSelected: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  courseChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  courseChipTextSelected: {
    color: '#001524',
  },
  trainedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  mainScroll: {
    flex: 1,
    backgroundColor: '#f1f3f5',
  },
  mainScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
  },
  courseContextCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  courseContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contextSubLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contextMainLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#001524',
    marginTop: 2,
  },
  contextModePill: {
    backgroundColor: 'rgba(0, 21, 36, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  contextModePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#003c66',
    textTransform: 'uppercase',
  },
  trainedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  statusInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065f46',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  docNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#001524',
    flex: 1,
  },
  coverageLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  coverageLabelText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#001524',
  },
  coveragePercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffa200',
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffa200',
    borderRadius: 999,
  },
  reformatBox: {
    backgroundColor: 'rgba(236, 253, 245, 0.7)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 10,
  },
  boxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  boxTitleTextGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: '#064e3b',
  },
  boxSubTextGreen: {
    fontSize: 10,
    color: '#047857',
    marginBottom: 6,
    lineHeight: 14,
  },
  topicBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  greenBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#059669',
  },
  topicBulletTextGreen: {
    fontSize: 11,
    fontWeight: '600',
    color: '#022c22',
    flex: 1,
  },
  gapBox: {
    backgroundColor: 'rgba(254, 243, 199, 0.7)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 10,
  },
  boxTitleTextAmber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78350f',
  },
  boxSubTextAmber: {
    fontSize: 10,
    color: '#92400e',
    marginBottom: 6,
    lineHeight: 14,
  },
  amberBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#d97706',
  },
  topicBulletTextAmber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#451a03',
    flex: 1,
  },
  styleSignatureBox: {
    backgroundColor: 'rgba(0, 21, 36, 0.04)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  styleSignatureLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  styleSignatureText: {
    fontSize: 11,
    color: '#003c66',
    fontWeight: '600',
    lineHeight: 16,
  },
  actionsContainer: {
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  primaryActionButton: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#ffa200',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#001524',
  },
  secondaryActionButton: {
    width: '100%',
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  untrainedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 16,
    alignItems: 'center',
  },
  uploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 162, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 162, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  untrainedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#001524',
    textAlign: 'center',
    marginBottom: 4,
  },
  untrainedSub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  analyzingBox: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  analyzingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#001524',
    marginTop: 10,
  },
  analyzingSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  uploadMainButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#ffa200',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadMainButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#001524',
  },
  explainerCard: {
    width: '100%',
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 21, 36, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  explainerHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepNumberBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 162, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#001524',
  },
  stepText: {
    fontSize: 10,
    color: '#334155',
    flex: 1,
    lineHeight: 15,
  },
  allFormatsHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#001524',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  calibratedItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calibratedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  calibratedIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calibratedItemCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calibratedCourseText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#001524',
  },
  calibratedModeTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  calibratedModeTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  calibratedFileText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  inspectButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'rgba(0, 21, 36, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  inspectButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#003c66',
  },
});
