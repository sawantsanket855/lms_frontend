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
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react-native';
import { useCourseStore } from '../../src/store/courseStore';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';

export default function QuizEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { courses, fetchCourses, createQuiz } = useCourseStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [passingScore, setPassingScore] = useState('70');
  const [timeLimit, setTimeLimit] = useState('30');
  const [questions, setQuestions] = useState<any[]>([
    {
      id: '1',
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      points: 1,
    },
  ]);

  useEffect(() => {
    const load = async () => {
      await fetchCourses();
      setIsLoading(false);
    };
    load();
  }, []);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        question: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        points: 1,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) {
      Alert.alert('Error', 'Quiz must have at least one question');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === questionIndex
          ? {
            ...q,
            options: q.options.map((opt: string, j: number) =>
              j === optionIndex ? value : opt
            ),
          }
          : q
      )
    );
  };

  const handleSave = async () => {
    if (!selectedCourseId) {
      Alert.alert('Error', 'Please select a course');
      return;
    }
    if (!title) {
      Alert.alert('Error', 'Please enter a quiz title');
      return;
    }

    const emptyQuestion = questions.find((q) => !q.question);
    if (emptyQuestion) {
      Alert.alert('Error', 'All questions must have text');
      return;
    }

    const emptyOption = questions.find((q) =>
      q.options.some((opt: string) => !opt)
    );
    if (emptyOption) {
      Alert.alert('Error', 'All options must be filled');
      return;
    }

    setIsSaving(true);
    try {
      await createQuiz({
        course_id: selectedCourseId,
        title,
        passing_score: parseInt(passingScore),
        time_limit_minutes: parseInt(timeLimit),
        questions: questions.map((q) => ({
          ...q,
          id: undefined, // Let backend generate ID
        })),
      });
      Alert.alert('Success', 'Quiz created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create quiz');
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
          <Text style={styles.headerTitle}>Create Quiz</Text>
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
            <Text style={styles.sectionTitle}>Quiz Details</Text>

            <Text style={styles.label}>Course</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.courseList}
            >
              {courses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    styles.courseChip,
                    selectedCourseId === course.id && styles.courseChipSelected,
                  ]}
                  onPress={() => setSelectedCourseId(course.id)}
                >
                  <Text
                    style={[
                      styles.courseChipText,
                      selectedCourseId === course.id && styles.courseChipTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {course.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Quiz Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Module 1 Assessment"
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Passing Score (%)</Text>
                <TextInput
                  style={styles.input}
                  value={passingScore}
                  onChangeText={setPassingScore}
                  placeholder="70"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Time Limit (min)</Text>
                <TextInput
                  style={styles.input}
                  value={timeLimit}
                  onChangeText={setTimeLimit}
                  placeholder="30"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          {/* Questions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Questions</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddQuestion}>
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {questions.map((question, qIndex) => (
              <View key={qIndex} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>Question {qIndex + 1}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveQuestion(qIndex)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[styles.input, styles.questionInput]}
                  value={question.question}
                  onChangeText={(text) => updateQuestion(qIndex, 'question', text)}
                  placeholder="Enter question"
                  placeholderTextColor="#94a3b8"
                  multiline
                />

                <Text style={styles.optionsLabel}>Options (tap to mark correct)</Text>
                {question.options.map((option: string, oIndex: number) => (
                  <TouchableOpacity
                    key={oIndex}
                    style={[
                      styles.optionRow,
                      question.correct_answer === oIndex && styles.correctOption,
                    ]}
                    onPress={() => updateQuestion(qIndex, 'correct_answer', oIndex)}
                  >
                    <View
                      style={[
                        styles.optionRadio,
                        question.correct_answer === oIndex && styles.optionRadioSelected,
                      ]}
                    >
                      {question.correct_answer === oIndex && (
                        <Check size={14} color="#fff" />
                      )}
                    </View>
                    <TextInput
                      style={styles.optionInput}
                      value={option}
                      onChangeText={(text) => updateOption(qIndex, oIndex, text)}
                      placeholder={`Option ${oIndex + 1}`}
                      placeholderTextColor="#94a3b8"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ))}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
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
  courseList: {
    maxHeight: 50,
  },
  courseChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    maxWidth: 200,
  },
  courseChipSelected: {
    backgroundColor: '#6366f1',
  },
  courseChipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  courseChipTextSelected: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  optionsLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  correctOption: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  optionInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    padding: 0,
  },
});
