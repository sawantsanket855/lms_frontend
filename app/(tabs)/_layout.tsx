import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Book, BarChart2, Users, User } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { TopAppBar } from '../../src/components/TopAppBar';

export default function TabLayout() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      <TopAppBar />
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e2e8f0',
          paddingTop: 8,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'My Courses',
          tabBarIcon: ({ color, size }) => (
            <Book size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <BarChart2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="course/[id]"
        options={{
          href: null,
          title: 'Course',
        }}
      />
      <Tabs.Screen
        name="session/[id]"
        options={{
          href: null,
          title: 'Session',
        }}
      />
      <Tabs.Screen
        name="quiz/[id]"
        options={{
          href: null,
          title: 'Quiz',
        }}
      />
      <Tabs.Screen
        name="learning-path/[id]"
        options={{
          href: null,
          title: 'Learning Path',
        }}
      />
    </Tabs>
    </>
  );
}

