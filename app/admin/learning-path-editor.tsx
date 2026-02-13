import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Book } from 'lucide-react-native';
import { useCourseStore } from '../../src/store/courseStore';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';

const INTERESTS = [
  'Programming',
  'Data Science',
  'Web Development',
  'Mobile Development',
  'Design',
  'Business',
  'Marketing',
  'Finance',
  'Leadership',
  'Communication',
];

export default function LearningPathEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { courses, fetchCourses, createLearningPath } = useCourseStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [targetInterests, setTargetInterests] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      await fetchCourses();
      setIsLoading(false);
    };
    load();
  }, []);

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleInterest = (interest: string) => {
    setTargetInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    if (!title) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!description) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (selectedCourses.length === 0) {
      Alert.alert('Error', 'Please select at least one course');
      return;
    }

    setIsSaving(true);
    try {
      await createLearningPath({
        title,
        description,
        course_ids: selectedCourses,
        target_interests: targetInterests,
      });
      Alert.alert('Success', 'Learning path created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create learning path');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Learning Path</Text>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Path Details</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Full-Stack Developer Path"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what students will learn..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Target Interests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Audience</Text>
            <Text style={styles.sectionSubtitle}>
              Select interests to auto-recommend this path
            </Text>
            <View style={styles.interestsGrid}>
              {INTERESTS.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestChip,
                    targetInterests.includes(interest) && styles.interestChipSelected,
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text
                    style={[
                      styles.interestText,
                      targetInterests.includes(interest) && styles.interestTextSelected,
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Course Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Courses in Path</Text>
            <Text style={styles.sectionSubtitle}>
              Select and order courses ({selectedCourses.length} selected)
            </Text>

            {courses.length > 0 ? (
              courses.map((course) => {
                const isSelected = selectedCourses.includes(course.id);
                const orderIndex = selectedCourses.indexOf(course.id);

                return (
                  <TouchableOpacity
                    key={course.id}
                    style={[
                      styles.courseItem,
                      isSelected && styles.courseItemSelected,
                    ]}
                    onPress={() => toggleCourse(course.id)}
                  >
                    <View
                      style={[
                        styles.courseCheckbox,
                        isSelected && styles.courseCheckboxSelected,
                      ]}
                    >
                      {isSelected ? (
                        <Text style={styles.orderNumber}>{orderIndex + 1}</Text>
                      ) : null}
                    </View>
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle}>{course.title}</Text>
                      <Text style={styles.courseMeta}>
                        {course.modules.length} modules · {course.difficulty}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyCourses}>
                <Book size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No courses available</Text>
                <Text style={styles.emptySubtext}>Create courses first</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  interestChipSelected: {
    backgroundColor: '#6366f1',
  },
  interestText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  interestTextSelected: {
    color: '#fff',
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  courseItemSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  courseCheckbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseCheckboxSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  orderNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  courseMeta: {
    fontSize: 13,
    color: '#64748b',
  },
  emptyCourses: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
});
