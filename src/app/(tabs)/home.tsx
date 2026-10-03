import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import {
  BarChart3,
  FileText,
  Layers3,
  Play,
  ScanLine,
  Sparkles,
  Target,
  Zap,
  Flame,
  MoreHorizontal,
  GraduationCap,
  ChevronRight,
  BookOpen,
  Award,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  ZoomIn,
} from 'react-native-reanimated';
import { AnimatedPressable } from '../../components/common/animated-pressable';
import { AcademicSetupModal } from '../../components/common/academic-setup-modal';
import { studyStore, StudentProfile } from '../../services/course-study-store';

const tools = [
  { label: 'E-Exam Simulator', detail: 'Train under timed pressure', icon: Zap, tone: 'bg-[#ffda99]/45', iconColor: '#ff6a00', route: '/(tabs)/e-exam' },
  { label: 'Theory Session', detail: 'Written exams & AI grading', icon: FileText, tone: 'bg-[#ffc499]/40', iconColor: '#ff6a00', route: '/(tabs)/theory-session' },
  { label: 'Cram Sheets', detail: '70%+ high-yield anchors', icon: Layers3, tone: 'bg-[#ffda99]/45', iconColor: '#ff6a00', route: '/(tabs)/cram-sheet' },
  { label: 'AI Guided Tutor', detail: 'Socratic step-by-step guidance', icon: GraduationCap, tone: 'bg-amber-100', iconColor: '#d97706', route: '/(tabs)/ai-tutor' },
  { label: 'AI Trainer', detail: 'Calibrate past exam papers & styles', icon: Sparkles, tone: 'bg-[#e1e5ea]', iconColor: '#003c66', route: '/(tabs)/ai-trainer' },
];

export function CampusCramApp() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(studyStore.getStudentProfile());
  const [enrolledCourses, setEnrolledCourses] = useState(studyStore.getEnrolledCourses());
  const [setupModalVisible, setSetupModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = studyStore.subscribe(() => {
      setProfile(studyStore.getStudentProfile());
      setEnrolledCourses(studyStore.getEnrolledCourses());
    });
    return unsubscribe;
  }, []);

  const studentName = profile?.fullName ? profile.fullName.trim().split(' ')[0] : 'Scholar';
  const universityShort = profile?.university
    ? profile.university.includes('(')
      ? profile.university.split('(')[1].replace(')', '')
      : profile.university.slice(0, 18)
    : 'Campus Sprint';
  const targetGpa = profile?.targetGpa || '4.85';
  const primaryCourse = enrolledCourses[0] || {
    code: 'CSC 301',
    title: 'Operating Systems & Concurrency',
  };

  return (
    <SafeAreaView className="flex-1 bg-[#001524]" edges={['top', 'left', 'right']}>
      <View className="flex-1 bg-[#e1e5ea] relative">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Background Header */}
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop',
            }}
            className="relative min-h-[285px] overflow-hidden px-5 pb-20 pt-10"
            resizeMode="cover"
          >
            {/* Gradient Overlay fading to #001524 at bottom */}
            <LinearGradient
              colors={['rgba(0, 21, 36, 0.4)', 'rgba(0, 21, 36, 0.95)', '#001524']}
              locations={[0, 0.65, 1]}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Top Bar with Brand & Setup Action - FadeInDown */}
            <Animated.View
              entering={FadeInDown.duration(450).springify().damping(14)}
              className="flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2.5">
                <View className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffa200]/20 border border-[#ffa200]/30 shadow-md">
                  <Flame size={18} color="#ffa200" fill="#ffa200" />
                </View>
                <View className="flex-col">
                  <Text className="text-sm font-bold uppercase tracking-wider text-[#ffa200]">
                    Campus-Cram
                  </Text>
                  <Text className="text-[10px] text-[#e1e5ea]/80 font-medium">
                    {universityShort}
                  </Text>
                </View>
              </View>

              {/* Profile / Edit Setup Action */}
              <TouchableOpacity
                onPress={() => setSetupModalVisible(true)}
                activeOpacity={0.8}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20"
              >
                <Sparkles size={12} color="#ffa200" />
                <Text className="text-[11px] font-bold text-white">
                  {profile ? 'Edit Profile' : 'Setup Profile'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Personalized Profile Greeting Banner - FadeInDown delay */}
            <Animated.View
              entering={FadeInDown.delay(120).duration(550).springify().damping(12)}
              className="mt-7 flex-col gap-1"
            >
              <View className="flex-row items-center gap-2 mb-1">
                <View className="bg-[#ffa200]/20 border border-[#ffa200]/30 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-[#ffa200]">
                    Target GPA: {targetGpa}
                  </Text>
                </View>
                <View className="bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-emerald-300">
                    {profile?.academicLevel || '300 Level'}
                  </Text>
                </View>
              </View>

              <Text className="text-2xl sm:text-3xl font-bold tracking-tight text-[#ffffff]">
                Welcome back, {studentName}
              </Text>
              <Text className="text-xs text-[#e1e5ea]/80 max-w-[300px] leading-5">
                {profile?.department || 'Computer Science & Engineering'} • {enrolledCourses.length} Enrolled Courses
              </Text>
            </Animated.View>
          </ImageBackground>

          {/* Main Content Body - Cascading Entrance Animations */}
          <View className="relative -mt-12 flex-1 flex-col gap-4 px-4">
            {/* Next E-Exam Priority Card - FadeInUp delay 220ms */}
            <Animated.View
              entering={FadeInUp.delay(220).duration(600).springify().damping(11)}
              className="rounded-2xl bg-[#ffffff] p-4 shadow-sm border border-black/5"
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-col gap-1.5 flex-1">
                  <View className="self-start rounded-lg bg-[#001524]/5 px-2 py-0.5">
                    <Text className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8995a9]">
                      Next Timed Exam
                    </Text>
                  </View>
                  <Text className="text-[19px] font-bold tracking-[-0.03em] text-[#0f1c24]">
                    {primaryCourse.code}: {primaryCourse.title}
                  </Text>
                  <Text className="text-xs leading-4 text-[#8995a9]">
                    Calibrated from syllabus objectives & exam past questions.
                  </Text>
                </View>
                <View className="flex w-9 h-9 shrink-0 items-center justify-center rounded-xl bg-[#001524]/5">
                  <Target size={20} color="#003c66" />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/e-exam')}
                className="mt-3.5 flex-row w-full items-center justify-between rounded-xl bg-[#003c66] px-4 py-3.5 shadow-md shadow-[#003c66]/25"
              >
                <Text className="text-xs font-bold text-[#ffffff]">
                  Launch E-Exam Session
                </Text>
                <View className="flex w-7 h-7 items-center justify-center rounded-lg bg-white/15">
                  <Play size={14} color="#ffffff" fill="#ffffff" />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Consistency & Mastery Modules - FadeInUp delay 320ms */}
            <Animated.View
              entering={FadeInUp.delay(320).duration(550).springify().damping(12)}
              className="flex-row gap-3"
            >
              {/* Module 1: Study Consistency */}
              <View className="flex-1 min-h-[155px] flex-col justify-between rounded-2xl bg-[#ffffff] p-4 shadow-sm border border-black/5">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex w-9 h-9 items-center justify-center rounded-full bg-[#001524]/5">
                    <BarChart3 size={16} color="#ffa200" strokeWidth={2.5} />
                  </View>
                  <Text className="text-xl font-bold text-[#0f1c24]">84%</Text>
                </View>

                <View className="flex-row h-10 items-end gap-1.5 px-1">
                  {[30, 48, 36, 62, 44, 76, 68].map((height, index) => (
                    <View
                      key={index}
                      className={`w-2.5 rounded-t-sm ${index > 4 ? 'bg-[#ffa200]' : 'bg-[#ffc499]'}`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </View>

                <View className="flex-row items-end justify-between gap-1">
                  <View className="flex-col">
                    <Text className="text-[11px] font-bold text-[#0f1c24]">
                      Consistency
                    </Text>
                    <Text className="text-[10px] text-[#8995a9]">7-day sprint</Text>
                  </View>
                  <ChevronRight size={14} color="#8995a9" />
                </View>
              </View>

              {/* Module 2: Course Mastery */}
              <View className="flex-1 min-h-[155px] flex-col justify-between rounded-2xl bg-[#ffffff] p-4 shadow-sm border border-black/5">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex w-9 h-9 items-center justify-center rounded-full bg-[#001524]/5">
                    <Target size={16} color="#ff6a00" strokeWidth={2.5} />
                  </View>
                  <Text className="text-xl font-bold text-[#0f1c24]">76%</Text>
                </View>

                <View className="flex items-center justify-center py-1">
                  <View className="relative w-12 h-12 items-center justify-center">
                    <Svg width={48} height={48} viewBox="0 0 48 48">
                      <Circle
                        cx="24"
                        cy="24"
                        r="18"
                        stroke="#003c66"
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray="80 113.1"
                        strokeDashoffset="0"
                      />
                      <Circle
                        cx="24"
                        cy="24"
                        r="18"
                        stroke="#ffa200"
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray="20 113.1"
                        strokeDashoffset="-80"
                      />
                      <Circle
                        cx="24"
                        cy="24"
                        r="18"
                        stroke="#e1e5ea"
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray="13 113.1"
                        strokeDashoffset="-100"
                      />
                    </Svg>
                    <View className="absolute inset-0 items-center justify-center">
                      <Text className="text-[9px] font-bold text-[#0f1c24]">
                        {enrolledCourses.length} courses
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row items-end justify-between gap-1">
                  <View className="flex-col">
                    <Text className="text-[11px] font-bold text-[#0f1c24]">
                      Exam Readiness
                    </Text>
                    <Text className="text-[10px] text-[#8995a9]">Active deck</Text>
                  </View>
                  <ChevronRight size={14} color="#8995a9" />
                </View>
              </View>
            </Animated.View>

            {/* Enrolled Courses Deck - FadeInUp delay 420ms */}
            <Animated.View
              entering={FadeInUp.delay(420).duration(550).springify().damping(12)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-black/5"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-sm font-bold text-[#0f1c24]">
                    My Semester Curriculum
                  </Text>
                  <Text className="text-[11px] text-[#8995a9]">
                    {enrolledCourses.length} courses configured
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setSetupModalVisible(true)}
                  className="flex-row items-center gap-1 bg-[#001524]/5 px-2.5 py-1 rounded-full"
                >
                  <Text className="text-[10px] font-bold text-[#003c66]">
                    Manage Courses
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="gap-2">
                {enrolledCourses.map((c, i) => (
                  <Animated.View
                    key={c.code + i}
                    entering={FadeInRight.delay(450 + i * 50).duration(400)}
                    className="flex-row items-center justify-between p-2.5 rounded-xl bg-[#f8fafc] border border-slate-100"
                  >
                    <View className="flex-row items-center gap-2.5 flex-1">
                      <View className="w-8 h-8 rounded-lg bg-[#003c66]/10 items-center justify-center">
                        <BookOpen size={14} color="#003c66" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-[#0f1c24]">
                          {c.code}
                        </Text>
                        <Text className="text-[11px] text-[#64748b] truncate" numberOfLines={1}>
                          {c.title}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push('/(tabs)/e-exam')}
                      className="px-2.5 py-1 rounded-lg bg-[#ffa200]/15 border border-[#ffa200]/30"
                    >
                      <Text className="text-[10px] font-bold text-[#b45309]">
                        Practice
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* Study Toolkit Section - Staggered FadeInUp */}
            <Animated.View
              entering={FadeInUp.delay(520).duration(550).springify().damping(12)}
              className="mt-1"
            >
              <View className="mb-3 flex-row items-center justify-between px-1">
                <View>
                  <Text className="text-sm font-bold text-[#0f1c24]">Study Toolkit</Text>
                  <Text className="mt-0.5 text-[11px] text-[#8995a9]">
                    High-yield AI accelerators for exam preparation.
                  </Text>
                </View>
                <ScanLine size={16} color="#ff6a00" />
              </View>

              <View className="flex-row flex-wrap gap-2.5">
                {tools.map((tool, idx) => {
                  const Icon = tool.icon;
                  return (
                    <AnimatedPressable
                      key={tool.label}
                      onPress={() => {
                        if (tool.route) {
                          router.push(tool.route as any);
                        }
                      }}
                      className="flex-1 min-w-[46%] min-h-[110px] flex-col justify-between rounded-2xl bg-[#ffffff] p-4 shadow-sm border border-black/5"
                    >
                      <View
                        className={`flex w-10 h-10 items-center justify-center rounded-2xl ${tool.tone}`}
                      >
                        <Icon size={18} color={tool.iconColor} strokeWidth={2.2} />
                      </View>
                      <View className="flex-col mt-2">
                        <Text className="text-xs font-bold leading-4 text-[#0f1c24]">
                          {tool.label}
                        </Text>
                        <Text className="mt-0.5 text-[9px] text-[#8995a9] font-medium">
                          {tool.detail}
                        </Text>
                      </View>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </Animated.View>
          </View>
        </ScrollView>

        {/* Academic Setup & Profile Customization Modal */}
        <AcademicSetupModal
          visible={setupModalVisible}
          canDismiss={true}
          onClose={() => setSetupModalVisible(false)}
          onSuccess={(newProfile) => {
            setSetupModalVisible(false);
            setProfile(newProfile);
            setEnrolledCourses(newProfile.enrolledCourses);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

export default CampusCramApp;
