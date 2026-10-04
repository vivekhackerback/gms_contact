import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { localDb } from '../db/localDb';
import { syncService } from '../services/syncService';

export default function RootLayout() {
  useEffect(() => {
    // Initialize offline DB and check connectivity on launch
    localDb.init();
    syncService.checkServer();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#0F172A',
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#F8FAFC' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="contact/new"
          options={{
            title: 'Add New Contact',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="contact/[id]"
          options={{
            title: 'Contact Details',
          }}
        />
        <Stack.Screen
          name="contact/edit/[id]"
          options={{
            title: 'Edit Contact',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
