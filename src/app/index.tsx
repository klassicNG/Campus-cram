import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Shield, ArrowRight, Command, Sparkles } from 'lucide-react-native';
import { AcademicSetupModal } from '../components/common/academic-setup-modal';
import { studyStore } from '../services/course-study-store';

export default function LoginScreen() {
  const router = useRouter();
  const [setupModalVisible, setSetupModalVisible] = useState(false);

  const handleStartApp = () => {
    const profile = studyStore.getStudentProfile();
    if (!profile || !profile.hasCompletedOnboarding) {
      setSetupModalVisible(true);
    } else {
      router.push('/(tabs)/home');
    }
  };

  return (
    <View className="flex-1 bg-[#09090B] justify-between relative overflow-hidden">
      {/* Soft dark radial ambient glow */}
      <View className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      <View className="absolute top-1/2 -right-32 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

      <SafeAreaView className="flex-1 justify-between px-7 pt-8 pb-8 z-10">
        {/* Top Brand Bar */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          className="flex-row items-center justify-between"
        >
          <View className="flex-row items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
            <Command size={14} color="#a1a1aa" />
            <Text className="text-zinc-300 font-medium text-xs tracking-wider uppercase">
              Campus-Cram
            </Text>
          </View>

          <View className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full">
            <Text className="text-zinc-400 text-[11px] font-medium">v1.0 Android</Text>
          </View>
        </Animated.View>

        {/* Hero Section */}
        <View className="my-auto">
          <Animated.View
            entering={FadeInUp.delay(100).duration(600)}
            className="items-center mb-10"
          >
            <View className="w-20 h-20 rounded-full bg-white/5 border border-white/10 items-center justify-center mb-6 shadow-lg">
              <Command size={32} color="#f4f4f5" strokeWidth={1.5} />
            </View>

            <Text className="text-zinc-100 text-4xl font-semibold tracking-tight text-center mb-3">
              Campus-Cram
            </Text>
            <Text className="text-zinc-400 text-sm text-center max-w-[290px] leading-6 font-normal">
              High-yield academic intelligence, optimized for modern student cram sessions.
            </Text>
          </Animated.View>

          {/* Refined Frosted Glass Auth Card */}
          <Animated.View
            entering={FadeIn.delay(200).duration(600)}
            className="rounded-3xl overflow-hidden border border-white/10"
          >
            <BlurView intensity={20} tint="dark" className="p-7 bg-white/5">
              <Text className="text-zinc-100 font-medium text-base mb-1 text-center">
                Sign In
              </Text>
              <Text className="text-zinc-400 text-xs mb-7 text-center">
                Authenticate with your student Supabase account
              </Text>

              {/* Primary CTA - Soft off-white with dark text */}
              <TouchableOpacity
                onPress={handleStartApp}
                activeOpacity={0.85}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 3,
                }}
                className="w-full bg-zinc-100 py-4 px-6 rounded-full flex-row items-center justify-center space-x-3 mb-3"
              >
                <Shield size={16} color="#09090b" strokeWidth={2} />
                <Text className="text-zinc-950 font-semibold text-sm">
                  Sign in with Supabase
                </Text>
              </TouchableOpacity>

              {/* Secondary CTA - Glassmorphic Pill */}
              <TouchableOpacity
                onPress={handleStartApp}
                activeOpacity={0.85}
                className="w-full bg-white/5 border border-white/10 py-3.5 px-6 rounded-full flex-row items-center justify-center space-x-2"
              >
                <Text className="text-zinc-300 font-medium text-xs">
                  Enter App Demo
                </Text>
                <ArrowRight size={14} color="#a1a1aa" />
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        </View>

        {/* Footer */}
        <Animated.View
          entering={FadeIn.delay(300).duration(600)}
          className="items-center"
        >
          <Text className="text-zinc-500 text-[11px] font-medium tracking-wide">
            Campus-Cram Architecture & Supabase RLS
          </Text>
        </Animated.View>
      </SafeAreaView>

      {/* Interactive Academic Onboarding & Personalization Wizard */}
      <AcademicSetupModal
        visible={setupModalVisible}
        canDismiss={true}
        onClose={() => setSetupModalVisible(false)}
        onSuccess={(_profile) => {
          setSetupModalVisible(false);
          router.push('/(tabs)/home');
        }}
      />
    </View>
  );
}
