import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import { Home, BookOpen, TrendingUp, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ffa200',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.45)',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 20,
          right: 20,
          height: 64,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(0, 21, 36, 0.92)',
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.4,
          shadowRadius: 24,
          paddingBottom: 8,
          paddingTop: 8,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <BlurView
            intensity={35}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
          letterSpacing: 0.2,
        },
      }}
    >
      {/* 4 Core Primary Tabs */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Home size={20} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color }) => (
            <BookOpen size={20} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => (
            <TrendingUp size={20} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <User size={20} color={color} strokeWidth={2} />
          ),
        }}
      />

      {/* Hidden Study Tool Routes (Open Full Screen from Home Study Toolkit) */}
      <Tabs.Screen
        name="e-exam"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="theory-session"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="cram-sheet"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="ai-tutor"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="ai-trainer"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}
