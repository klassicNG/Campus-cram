import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  GraduationCap,
  Target,
  Calendar,
  Settings,
  Bell,
  HardDrive,
  ShieldCheck,
  LogOut,
  Sparkles,
  ChevronRight,
  BookOpen,
  Edit3,
  Layers,
} from 'lucide-react-native';
import Animated, {
  SlideInDown,
  FadeInUp,
  FadeInRight,
} from 'react-native-reanimated';
import { AcademicSetupModal } from '../../components/common/academic-setup-modal';
import { studyStore, StudentProfile } from '../../services/course-study-store';

export default function ProfileScreen() {
  const [guidedLearningActive, setGuidedLearningActive] = useState(true);
  const [examReminders, setExamReminders] = useState(true);
  const [setupModalVisible, setSetupModalVisible] = useState(false);

  const [profile, setProfile] = useState<StudentProfile | null>(studyStore.getStudentProfile());
  const [enrolledCourses, setEnrolledCourses] = useState(studyStore.getEnrolledCourses());

  useEffect(() => {
    const unsubscribe = studyStore.subscribe(() => {
      setProfile(studyStore.getStudentProfile());
      setEnrolledCourses(studyStore.getEnrolledCourses());
    });
    return unsubscribe;
  }, []);

  const initials = profile?.avatarInitials || (profile?.fullName ? profile.fullName.slice(0, 2).toUpperCase() : 'CC');
  const displayName = profile?.fullName || 'Student Scholar';
  const university = profile?.university || 'University of Study';
  const department = profile?.department || 'Department of Science';
  const level = profile?.academicLevel || '300 Level';
  const targetGpa = profile?.targetGpa || '4.85';

  const handleResetProfile = () => {
    Alert.alert(
      'Reset Academic Profile',
      'Are you sure you want to clear your saved profile and reconfigure your curriculum from scratch?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset & Re-enter',
          style: 'destructive',
          onPress: () => {
            studyStore.resetStudentProfile();
            setSetupModalVisible(true);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#001524]" edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#001524" />

      {/* Header Bar - SlideInDown */}
      <Animated.View
        entering={SlideInDown.duration(450).springify().damping(12)}
        className="bg-[#001524] px-5 pt-3 pb-6 border-b border-[#001524]/20 shadow-md"
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-[#ffa200]">
            Student Academic Profile
          </Text>
          <View className="flex-row items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
            <ShieldCheck size={12} color="#38bdf8" />
            <Text className="text-[10px] font-bold text-white">
              Verified Student
            </Text>
          </View>
        </View>

        {/* Profile Card */}
        <View className="flex-row items-center gap-3.5">
          <View className="w-16 h-16 rounded-2xl bg-[#ffa200] items-center justify-center shadow-lg border-2 border-white/20">
            <Text className="text-2xl font-black text-[#001524]">
              {initials}
            </Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-white tracking-tight">
                {displayName}
              </Text>
              <TouchableOpacity
                onPress={() => setSetupModalVisible(true)}
                className="p-1 rounded-lg bg-white/10"
              >
                <Edit3 size={14} color="#ffa200" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-white/70 mt-0.5" numberOfLines={1}>
              {department} • {level}
            </Text>
            <Text className="text-[10px] text-white/50 mt-0.5" numberOfLines={1}>
              {university}
            </Text>

            <View className="flex-row items-center gap-2 mt-2">
              <View className="bg-[#ffa200]/20 border border-[#ffa200]/30 px-2.5 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-[#ffa200]">
                  Target GPA: {targetGpa}
                </Text>
              </View>
              <View className="bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-emerald-300">
                  First Class Track
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Settings & Options */}
      <ScrollView
        className="flex-1 bg-[#f1f3f5] px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Enrolled Courses Section - FadeInUp */}
        <Animated.View
          entering={FadeInUp.delay(120).duration(500).springify()}
          className="bg-white rounded-2xl p-4 mb-4 border border-black/5 shadow-xs"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                Configured Curriculum ({enrolledCourses.length})
              </Text>
              <Text className="text-[10px] text-gray-400">
                Personalized active courses
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setSetupModalVisible(true)}
              className="flex-row items-center gap-1 bg-[#ffa200]/15 px-2.5 py-1 rounded-full border border-[#ffa200]/30"
            >
              <Sparkles size={11} color="#b45309" />
              <Text className="text-[10px] font-bold text-[#b45309]">
                Edit Courses
              </Text>
            </TouchableOpacity>
          </View>

          <View className="gap-2">
            {enrolledCourses.map((c, i) => (
              <Animated.View
                key={c.code + i}
                entering={FadeInRight.delay(180 + i * 50).duration(400)}
                className="flex-row items-center justify-between p-2.5 rounded-xl bg-[#f8fafc] border border-slate-100"
              >
                <View className="flex-row items-center gap-2.5 flex-1">
                  <View className="w-8 h-8 rounded-lg bg-[#003c66]/10 items-center justify-center">
                    <Layers size={14} color="#003c66" />
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

                <View className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <Text className="text-[10px] font-bold text-emerald-700">
                    Active
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Academic Focus & Deadlines */}
        <Animated.View
          entering={FadeInUp.delay(220).duration(500).springify()}
          className="bg-white rounded-2xl p-4 mb-4 border border-black/5 shadow-xs"
        >
          <Text className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-3">
            Academic Focus & Deadlines
          </Text>

          <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-xl bg-[#001524]/5 items-center justify-center">
                <Calendar size={16} color="#003c66" />
              </View>
              <View>
                <Text className="text-xs font-bold text-[#0f1c24]">
                  {enrolledCourses[0]?.code || 'CSC 301'} Midterm Sprint
                </Text>
                <Text className="text-[10px] text-gray-400">
                  Target: 95%+ Mastery
                </Text>
              </View>
            </View>
            <View className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              <Text className="text-[10px] font-bold text-amber-700">Priority</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-xl bg-[#001524]/5 items-center justify-center">
                <Target size={16} color="#003c66" />
              </View>
              <View>
                <Text className="text-xs font-bold text-[#0f1c24]">
                  {enrolledCourses[1]?.code || 'SEN 301'} Architecture Viva
                </Text>
                <Text className="text-[10px] text-gray-400">
                  AI Calibrated Sessions
                </Text>
              </View>
            </View>
            <View className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <Text className="text-[10px] font-bold text-emerald-700">Ready</Text>
            </View>
          </View>
        </Animated.View>

        {/* Study Preferences */}
        <Animated.View
          entering={FadeInUp.delay(320).duration(500)}
          className="bg-white rounded-2xl p-4 mb-4 border border-black/5 shadow-xs"
        >
          <Text className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">
            Study Preferences
          </Text>

          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <View className="flex-row items-center gap-3">
              <Sparkles size={18} color="#003c66" />
              <View>
                <Text className="text-xs font-bold text-[#0f1c24]">
                  AI Socratic Guidance
                </Text>
                <Text className="text-[10px] text-gray-400">
                  Step-by-step reasoning rather than direct answers
                </Text>
              </View>
            </View>
            <Switch
              value={guidedLearningActive}
              onValueChange={setGuidedLearningActive}
              trackColor={{ false: '#e2e8f0', true: '#ffa200' }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center gap-3">
              <Bell size={18} color="#003c66" />
              <View>
                <Text className="text-xs font-bold text-[#0f1c24]">
                  Exam Hall Reminders
                </Text>
                <Text className="text-[10px] text-gray-400">
                  Daily high-yield cram prompts
                </Text>
              </View>
            </View>
            <Switch
              value={examReminders}
              onValueChange={setExamReminders}
              trackColor={{ false: '#e2e8f0', true: '#ffa200' }}
              thumbColor="#ffffff"
            />
          </View>
        </Animated.View>

        {/* Profile Configuration Actions */}
        <Animated.View
          entering={FadeInUp.delay(420).duration(500)}
          className="gap-2.5 mb-6"
        >
          <TouchableOpacity
            onPress={() => setSetupModalVisible(true)}
            activeOpacity={0.85}
            className="w-full bg-[#003c66] py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
          >
            <Edit3 size={16} color="#ffffff" />
            <Text className="text-white font-bold text-xs">
              Edit Academic Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResetProfile}
            activeOpacity={0.85}
            className="w-full bg-white border border-rose-200 py-3 rounded-xl flex-row items-center justify-center gap-2"
          >
            <LogOut size={16} color="#e11d48" />
            <Text className="text-rose-600 font-bold text-xs">
              Reset Profile & Reconfigure
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
    </SafeAreaView>
  );
}
