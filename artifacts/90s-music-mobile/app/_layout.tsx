import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Redirect, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { PlayerProvider } from '@/context/PlayerContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: 'Back' }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding/[step]" />
      <Stack.Screen name="login" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="artist/[artist]" options={{ presentation: 'card' }} />
      <Stack.Screen name="mix/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="search" options={{ presentation: 'card' }} />
      <Stack.Screen name="now-playing" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

function AuthGate() {
  const { user, isLoading, pendingVerificationEmail } = useAuth();
  const segments = useSegments();
  const route = String(segments[0] || "");
  const publicRoute = route === 'login' || route === 'sign-up' || (route === 'otp' && Boolean(pendingVerificationEmail)) || route === 'forgot-password' || route === 'splash' || route === 'onboarding';
  if (isLoading) return null;
  if (!user && !publicRoute) return <Redirect href="/login" />;
  if (user && (route === 'login' || route === 'sign-up' || route === 'otp')) return <Redirect href="/(tabs)" />;
  return <RootLayoutNav />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PlayerProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider><AuthGate /></KeyboardProvider>
              </GestureHandlerRootView>
            </PlayerProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
