import { Stack } from 'expo-router';
import { TopAppBar } from '../../src/components/TopAppBar';

export default function AdminLayout() {
  return (
    <>
      <TopAppBar />
      <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Admin Panel',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="course-editor"
        options={{
          title: 'Course Editor',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="quiz-editor"
        options={{
          title: 'Quiz Editor',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="learning-path-editor"
        options={{
          title: 'Learning Path Editor',
          headerShown: false,
        }}
      />
    </Stack>
    </>
  );
}
