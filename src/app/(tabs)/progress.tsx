import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Flame,
  ArrowRight,
  BrainCircuit,
  Layers,
  Sparkles,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  ZoomIn,
} from 'react-native-reanimated';
import { AnimatedPressable } from '../../components/common/animated-pressable';
import { studyStore, StudentProfile, EnrolledCourse } from '../../services/course-study-store';

export default function ProgressScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(studyStore.getStudentProfile());
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>(studyStore.getEnrolledCourses());

  useEffect(() => {
    const unsub = studyStore.subscribe(() => {
      setProfile(studyStore.getStudentProfile());
      setEnrolledCourses(studyStore.getEnrolledCourses());
    });
    return unsub;
  }, []);

  const targetGpa = profile?.targetGpa || '4.85';
  const avgReadiness = 78;

  return (
    <SafeAreaView className="flex-1 bg-[#001524]" edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#001524" />

      {/* Header - FadeInDown */}
      <Animated.View
        entering={FadeInDown.duration(450).springify()}
        className="bg-[#001524] px-5 pt-3 pb-5 border-b border-[#001524]/20 shadow-md"
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-xl bg-[#ffa200]/20 border border-[#ffa200]/30 items-center justify-center">
              <TrendingUp size={16} color="#ffa200" />
            </View>
            <View>
              <Text className="text-xs font-bold uppercase tracking-wider text-[#ffa200]">
                Exam Readiness
              </Text>
              <Text className="text-[10px] text-white/60">
                {profile?.university ? profile.university.slice(0, 24) : 'Live Diagnostic Tracking'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1.5 bg-[#ffa200]/20 border border-[#ffa200]/30 px-3 py-1 rounded-full">
            <Flame size={13} color="#ffa200" fill="#ffa200" />
            <Text className="text-xs font-bold text-[#ffa200]">
              5 Day Streak
            </Text>
          </View>
        </View>

        <Text className="text-2xl font-extrabold tracking-[-0.03em] text-[#ffffff] mt-2">
          Mastery Analytics
        </Text>
        <Text className="text-xs text-[#e1e5ea]/80 mt-1">
          Predictive performance and curriculum readiness across your semester courses.
        </Text>
      </Animated.View>

      {/* Content */}
      <ScrollView
        className="flex-1 bg-[#f1f3f5] px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Readiness Card - FadeInUp */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(500).springify()}
          className="bg-[#001524] rounded-3xl p-5 mb-4 shadow-lg border border-white/10"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-[10px] font-bold text-[#ffa200] uppercase tracking-wider">
                Overall Semester Readiness
              </Text>
              <Text className="text-3xl font-black text-white mt-0.5">
                {avgReadiness}% Exam Ready
              </Text>
            </View>
            <View className="w-14 h-14 rounded-2xl bg-[#ffa200]/20 border border-[#ffa200]/30 items-center justify-center">
              <Award size={28} color="#ffa200" />
            </View>
          </View>

          {/* Progress Bar */}
          <View className="w-full h-2 bg-white/15 rounded-full overflow-hidden mb-3">
            <View
              className="h-full bg-[#ffa200] rounded-full"
              style={{ width: `${avgReadiness}%` }}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-white/70">
              Target Track: {targetGpa} GPA (First Class)
            </Text>
            <Text className="text-xs font-bold text-emerald-400">
              On Pace
            </Text>
          </View>
        </Animated.View>

        {/* Dynamic Course Heatmap Cards - Staggered FadeInRight */}
        <View className="mb-2">
          <Text className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2.5 px-0.5">
            Course Performance Breakdown ({enrolledCourses.length})
          </Text>

          {enrolledCourses.map((course, idx) => {
            const readiness = course.masteryPercentage || (75 + (idx % 3) * 7);
            const isHigh = readiness >= 80;

            return (
              <Animated.View
                key={course.code + idx}
                entering={FadeInRight.delay(160 + idx * 60).duration(450)}
                className="bg-white rounded-2xl p-4 mb-3 border border-black/5 shadow-xs"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center gap-2 mb-0.5">
                      <View className="bg-[#001524]/5 px-2 py-0.5 rounded-md">
                        <Text className="text-xs font-black text-[#003c66]">
                          {course.code}
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-0.5 rounded-md ${
                          isHigh
                            ? 'bg-emerald-50 border border-emerald-200'
                            : 'bg-amber-50 border border-amber-200'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            isHigh ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {isHigh ? 'A (Exam Ready)' : 'B+ (Needs Sprint)'}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs font-bold text-[#0f1c24] mt-0.5 truncate" numberOfLines={1}>
                      {course.title}
                    </Text>
                  </View>

                  <Text className="text-2xl font-black text-[#0f1c24]">
                    {readiness}%
                  </Text>
                </View>

                {/* Progress bar */}
                <View className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <View
                    className={`h-full rounded-full ${
                      isHigh ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${readiness}%` }}
                  />
                </View>

                {/* Action button */}
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/e-exam')}
                  activeOpacity={0.8}
                  className="flex-row items-center justify-between py-2 px-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <View className="flex-row items-center gap-1.5">
                    <Sparkles size={12} color="#003c66" />
                    <Text className="text-xs font-bold text-[#003c66]">
                      Drill Weak Points in CBT
                    </Text>
                  </View>
                  <ArrowRight size={13} color="#003c66" />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Exam Readiness Advisory - FadeInUp */}
        <Animated.View
          entering={FadeInUp.delay(360).duration(500)}
          className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 mb-6"
        >
          <View className="flex-row items-center gap-2 mb-1.5">
            <CheckCircle2 size={16} color="#059669" />
            <Text className="text-xs font-bold text-emerald-800">
              Exam Hall Strategy: High Yield Active
            </Text>
          </View>
          <Text className="text-xs text-emerald-700 leading-5">
            You've achieved solid concept coverage across {enrolledCourses.length} courses. Run a timed 60-question CBT mock to lock in pacing.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
