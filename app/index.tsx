import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { LoadingSpinner } from '../src/components/LoadingSpinner';
import { app } from '../src/services/firebaseConfig';

const checkFirebase = () => {
  try {
    if (app) {
      console.log('🔥 Firebase initialized successfully:', app.name);
    } else {
      console.error('❌ Firebase failed to initialize');
    }
  } catch (error) {
    console.error('❌ Firebase connection error:', error);
  }
};

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    checkFirebase();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading]);

  return (
    <View style={styles.container}>
      <LoadingSpinner fullScreen message="Starting LMS..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});
