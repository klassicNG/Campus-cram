import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
]);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={styles.outerBackground}>
          <StatusBar style="light" />
          <View style={styles.mobileContainer}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#09090B' },
                animation: 'slide_from_right',
                animationDuration: 280,
                gestureEnabled: true,
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </View>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  outerBackground: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileContainer: {
    width: '100%',
    maxWidth: 440,
    height: '100%',
    backgroundColor: '#09090B',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 50,
    elevation: 10,
  },
});
