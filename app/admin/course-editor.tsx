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
  Modal,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  PlayCircle,
  Headphones,
  FileText,
  HelpCircle,
  Globe,
  XCircle,
  FolderOpen,
  CloudUpload,
  Info,
  Edit,
} from 'lucide-react-native';
import { useCourseStore } from '../../src/store/courseStore';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import api from '../../src/services/api';
import { uploadFileToFirebase } from '../../src/services/storage';

const CATEGORIES = [
  'Programming',
  'Data Science',
  'Web Development',
  'Mobile Development',
  'Design',
  'Business',
  'Marketing',
  'Finance',
];

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export default function CourseEditor() {
  const { id: rawId } = useLocalSearchParams<{ id?: string }>();
  const id = rawId === 'undefined' ? undefined : rawId;
  const router = useRouter();
  const {
    fetchCourse,
    createCourse,
    updateCourse,
    publishCourse,
    addModule,
    updateModule,
    deleteModule,
    sessions,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    quizzes,
    fetchQuizzes,
    createQuiz,
  } = useCourseStore();

  const [isLoading, setIsLoading] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState('beginner');
  const [tags, setTags] = useState('');
  const [modules, setModules] = useState<any[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [courseId, setCourseId] = useState<string | null>(id || null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);

  // Session state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isEditingSession, setIsEditingSession] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [sessionDuration, setSessionDuration] = useState('');
  const [sessionType, setSessionType] = useState('video');
  const [sessionFile, setSessionFile] = useState<any>(null);
  const [sessionText, setSessionText] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');

  useEffect(() => {
    if (id && id !== 'undefined') {
      loadCourse();
      fetchQuizzes(id);
    }
  }, [id]);

  const loadCourse = async (cid?: string) => {
    const targetId = cid || courseId || id;
    if (!targetId || targetId === 'undefined') return;

    setIsLoading(true);
    try {
      const course = await fetchCourse(targetId);
      setTitle(course.title);
      setDescription(course.description);
      setCategory(course.category);
      setDifficulty(course.difficulty);
      setTags(course.tags.join(', '));
      setModules(course.modules);
      setIsPublished(course.is_published);
    } catch (error) {
      Alert.alert('Error', 'Failed to load course');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }

    setIsSaving(true);
    try {
      const courseData = {
        title,
        description,
        category,
        difficulty,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        is_published: isPublished,
      };

      if (courseId) {
        await updateCourse(courseId, courseData as any);
        Alert.alert('Success', 'Course updated successfully');
      } else {
        const newCourse = await createCourse(courseData as any);
        setCourseId(newCourse.id);
        router.setParams({ id: newCourse.id });
        loadCourse(newCourse.id);
        Alert.alert('Success', 'Course created successfully');
      }
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Failed to save course';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };


  const toggleModuleSelection = (moduleId: string) => {
    if (expandedModule === moduleId) {
      setExpandedModule(null);
    } else {
      setExpandedModule(moduleId);
      fetchSessions(courseId!, moduleId);
    }
  };

  const getMockDownloadLink = (file: any) => {
    // This function provides a static dummy link for the document
    return `/api/mock-downloads/${file.name.replace(/\s+/g, '_')}`;
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: sessionType === 'pdf' ? 'application/pdf' :
          sessionType === 'audio' ? 'audio/*' :
            sessionType === 'video' ? 'video/*' : '*/*',
      });

      if (!result.canceled) {
        setSessionFile(result.assets[0]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleCreateQuiz = async () => {
    if (!newQuizTitle.trim()) {
      Alert.alert('Error', 'Please enter a quiz title');
      return;
    }

    try {
      const quiz = await createQuiz({
        title: newQuizTitle,
        course_id: courseId!,
        questions: [],
      });
      setSelectedQuizId(quiz.id);
      setIsCreatingQuiz(false);
      setNewQuizTitle('');
      Alert.alert('Success', 'Quiz created and selected');
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Failed to create quiz';
      Alert.alert('Error', msg);
    }
  };

  const handleCreateSession = async () => {
    if (!sessionName.trim() || !sessionDuration.trim()) {
      Alert.alert('Error', 'Please fill in name and duration');
      return;
    }

    if (sessionType === 'quiz' && !selectedQuizId) {
      Alert.alert('Error', 'Please select a quiz');
      return;
    }

    setIsAddingSession(true);
    try {
      let contentUrl = '';
      let isDoc = false;

      if (sessionFile) {
        // Upload to Firebase Storage
        contentUrl = await uploadFileToFirebase(sessionFile.uri, sessionFile.name);
        isDoc = true;
      }

      const formData = new FormData();
      formData.append('course_id', courseId!);
      formData.append('module_id', expandedModule!);
      formData.append('name', sessionName);
      formData.append('duration_minutes', sessionDuration);
      formData.append('content_type', sessionType);
      formData.append('is_document_available', String(isDoc));

      if (contentUrl) {
        formData.append('content_url', contentUrl);
      }
      if (sessionText) {
        formData.append('content_text', sessionText);
      }
      if (sessionType === 'quiz' && selectedQuizId) {
        formData.append('quiz_id', selectedQuizId);
      }

      if (isEditingSession && currentSessionId) {
        await updateSession(currentSessionId, formData);
        Alert.alert('Success', 'Session updated successfully');
      } else {
        await createSession(formData);
        Alert.alert('Success', 'Session added successfully');
      }

      setShowSessionModal(false);
      resetSessionForm();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || error.message || 'Failed to save session';
      Alert.alert('Error', msg);
    } finally {
      setIsAddingSession(false);
    }
  };


  const resetSessionForm = () => {
    setSessionName('');
    setSessionDuration('');
    setSessionType('video');
    setSessionFile(null);
    setSessionText('');
    setIsEditingSession(false);
    setSessionText('');
    setSelectedQuizId(null);
    setIsCreatingQuiz(false);
    setNewQuizTitle('');
    setIsEditingSession(false);
    setCurrentSessionId(null);
  };

  const handleEditSession = (session: any) => {
    setSessionName(session.name);
    setSessionDuration(String(session.duration_minutes));
    setSessionType(session.content_type);
    setSessionText(session.content_text || '');
    // Note: Can't pre-fill file input, user has to re-select if they want to change it
    setIsEditingSession(true);
    setCurrentSessionId(session.id);
    setShowSessionModal(true);
  };

  const handleDeleteSession = (sessionId: string, moduleId: string) => {
    Alert.alert('Delete Session', 'Are you sure you want to delete this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSession(sessionId, courseId!, moduleId);
          } catch (error: any) {
            const msg = error.response?.data?.detail || error.message || 'Failed to delete session';
            Alert.alert('Error', msg);
          }
        },
      },
    ]);
  };

  const getModuleStats = (moduleId: string) => {
    // Priority 1: Check modules state for pre-calculated stats from backend
    const moduleObj = modules.find(m => m.id === moduleId);

    // Priority 2: If we have sessions loaded in local state, use those (catches new/unsaved changes)
    const moduleSessions = sessions[moduleId];

    if (moduleSessions && moduleSessions.length > 0) {
      const count = moduleSessions.length;
      const time = moduleSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
      return { count, time };
    }

    // Fallback to backend-provided stats if local sessions aren't loaded yet
    if (moduleObj && (moduleObj as any).session_count !== undefined) {
      return {
        count: (moduleObj as any).session_count,
        time: (moduleObj as any).total_duration || 0
      };
    }

    return { count: 0, time: 0 };
  };

  const handleAddModule = () => {
    if (!courseId) {
      Alert.alert('Error', 'Please save the course first');
      return;
    }
    setModuleTitle('');
    setIsEditingModule(false);
    setCurrentModuleId(null);
    setShowModuleModal(true);
  };

  const handleEditModule = (module: any) => {
    setModuleTitle(module.title);
    setIsEditingModule(true);
    setCurrentModuleId(module.id);
    setShowModuleModal(true);
  };

  const handleConfirmAddModule = async () => {
    if (!moduleTitle.trim()) {
      Alert.alert('Error', 'Please enter a module title');
      return;
    }

    try {
      if (isEditingModule && currentModuleId) {
        await updateModule(courseId!, currentModuleId, {
          title: moduleTitle,
          content_type: 'text',
          content_text: 'Module content goes here...',
          duration_minutes: 10,
        });
      } else {
        await addModule(courseId!, {
          title: moduleTitle,
          content_type: 'text',
          content_text: 'Module content goes here...',
          duration_minutes: 10,
        });
      }
      setShowModuleModal(false);
      setModuleTitle('');
      setIsEditingModule(false);
      setCurrentModuleId(null);
      loadCourse(courseId!);
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Failed to save module';
      Alert.alert('Error', msg);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    Alert.alert('Delete Module', 'Are you sure you want to delete this module?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteModule(courseId!, moduleId);
            loadCourse(courseId!);
          } catch (error: any) {
            const msg = error.response?.data?.detail || error.message || 'Failed to delete module';
            Alert.alert('Error', msg);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading course..." />;
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
          <Text style={styles.headerTitle}>
            {courseId ? 'Edit Course' : 'New Course'}
          </Text>
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
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Course title"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Course description"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipContainer}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    category === cat && styles.chipSelected,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === cat && styles.chipTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.difficultyContainer}>
              {DIFFICULTIES.map((diff) => (
                <TouchableOpacity
                  key={diff}
                  style={[
                    styles.difficultyOption,
                    difficulty === diff && styles.difficultySelected,
                  ]}
                  onPress={() => setDifficulty(diff)}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      difficulty === diff && styles.difficultyTextSelected,
                    ]}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Tags (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder="e.g., python, beginner, coding"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Course Status</Text>
            <View style={styles.difficultyContainer}>
              {[
                { label: 'Draft', value: false },
                { label: 'Published', value: true },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.difficultyOption,
                    isPublished === opt.value && styles.difficultySelected,
                  ]}
                  onPress={() => setIsPublished(opt.value)}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      isPublished === opt.value && styles.difficultyTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Modules */}
          {courseId && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Modules</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddModule}>
                  <Plus size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {modules.length > 0 ? (
                modules.map((module, index) => {
                  const stats = getModuleStats(module.id);
                  const isExpanded = expandedModule === module.id;
                  return (
                    <View key={module.id} style={styles.moduleCard}>
                      <TouchableOpacity
                        style={styles.moduleHeaderRow}
                        onPress={() => toggleModuleSelection(module.id)}
                      >
                        <View style={styles.moduleNumber}>
                          <Text style={styles.moduleNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.moduleInfo}>
                          <Text style={styles.moduleTitle}>{module.title}</Text>
                          <Text style={styles.moduleMeta}>
                            {stats.count} Sessions · {stats.time} min
                          </Text>
                        </View>
                        <View style={styles.moduleActions}>
                          <TouchableOpacity
                            style={styles.deleteIconButton}
                            onPress={() => handleEditModule(module)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Edit size={18} color="#6366f1" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteIconButton}
                            onPress={() => handleDeleteModule(module.id)}
                          >
                            <Trash2 size={18} color="#ef4444" />
                          </TouchableOpacity>
                          {isExpanded ? (
                            <ChevronUp size={20} color="#64748b" />
                          ) : (
                            <ChevronDown size={20} color="#64748b" />
                          )}
                        </View>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.sessionsContainer}>
                          <View style={styles.sessionsHeader}>
                            <Text style={styles.sessionsTitle}>Module Sessions</Text>
                            <TouchableOpacity
                              style={styles.addSessionButton}
                              onPress={() => setShowSessionModal(true)}
                            >
                              <Plus size={16} color="#6366f1" />
                              <Text style={styles.addSessionButtonText}>Add Session</Text>
                            </TouchableOpacity>
                          </View>

                          {(sessions[module.id] || []).length > 0 ? (
                            sessions[module.id].map((session: any) => (
                              <View key={session.id} style={styles.sessionItem}>
                                {session.content_type === 'video' ? (
                                  <PlayCircle size={18} color="#6366f1" />
                                ) : session.content_type === 'audio' ? (
                                  <Headphones size={18} color="#6366f1" />
                                ) : session.content_type === 'pdf' ? (
                                  <FileText size={18} color="#6366f1" />
                                ) : session.content_type === 'quiz' ? (
                                  <HelpCircle size={18} color="#6366f1" />
                                ) : (
                                  <Globe size={18} color="#6366f1" />
                                )}
                                <View style={styles.sessionInfo}>
                                  <Text style={styles.sessionName}>{session.name}</Text>
                                  <Text style={styles.sessionMeta}>
                                    {session.content_type} · {session.duration_minutes} min
                                    {session.is_document_available && ' · File available'}
                                  </Text>
                                </View>
                                <View style={styles.sessionActionRow}>
                                  <TouchableOpacity
                                    onPress={() => handleEditSession(session)}
                                    style={styles.actionIcon}
                                  >
                                    <Edit size={18} color="#6366f1" />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => handleDeleteSession(session.id, module.id)}
                                    style={styles.actionIcon}
                                  >
                                    <XCircle size={18} color="#94a3b8" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ))
                          ) : (
                            <Text style={styles.noSessions}>No sessions yet</Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyModules}>
                  <FolderOpen size={40} color="#cbd5e1" />
                  <Text style={styles.emptyText}>No modules yet</Text>
                </View>
              )}
            </View>
          )}

          {/* Publish */}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add Module Modal */}
      <Modal
        visible={showModuleModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditingModule ? 'Edit Module' : 'Add Module'}</Text>
            <Text style={styles.modalLabel}>Module Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter module title"
              placeholderTextColor="#94a3b8"
              value={moduleTitle}
              onChangeText={setModuleTitle}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowModuleModal(false);
                  setModuleTitle('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleConfirmAddModule}
              >
                <Text style={styles.modalButtonText}>{isEditingModule ? 'Update' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Session Modal */}
      <Modal
        visible={showSessionModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Session</Text>

              <Text style={styles.modalLabel}>Session Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter session name"
                value={sessionName}
                onChangeText={setSessionName}
              />

              <Text style={styles.modalLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 15"
                value={sessionDuration}
                onChangeText={setSessionDuration}
                keyboardType="numeric"
              />

              <Text style={styles.modalLabel}>Content Type</Text>
              <View style={styles.typeSwitcher}>
                {['video', 'audio', 'pdf', 'article', 'quiz', 'other'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeOption, sessionType === type && styles.typeSelected]}
                    onPress={() => {
                      setSessionType(type);
                      setSessionFile(null);
                    }}
                  >
                    <Text style={[styles.typeText, sessionType === type && styles.typeTextSelected]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {['video', 'audio', 'pdf', 'other'].includes(sessionType) && (
                <View style={styles.uploadSection}>
                  <TouchableOpacity style={styles.uploadButton} onPress={handlePickFile}>
                    <CloudUpload size={24} color="#6366f1" />
                    <Text style={styles.uploadButtonText}>
                      {sessionFile ? sessionFile.name : `Upload ${sessionType}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {sessionType === 'article' && (
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  placeholder="Enter article text..."
                  multiline
                  value={sessionText}
                  onChangeText={setSessionText}
                />
              )}

              {sessionType === 'quiz' && (
                <View style={styles.quizSection}>
                  <Text style={styles.label}>Select Quiz</Text>

                  {quizzes.length > 0 ? (
                    <ScrollView style={styles.quizList} nestedScrollEnabled>
                      {quizzes.map((quiz) => (
                        <TouchableOpacity
                          key={quiz.id}
                          style={[
                            styles.quizOption,
                            selectedQuizId === quiz.id && styles.quizOptionSelected,
                          ]}
                          onPress={() => setSelectedQuizId(quiz.id)}
                        >
                          <Text
                            style={[
                              styles.quizOptionText,
                              selectedQuizId === quiz.id && styles.quizOptionTextSelected,
                            ]}
                          >
                            {quiz.title}
                          </Text>
                          {selectedQuizId === quiz.id && (
                            <View style={styles.selectedDot} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.noQuizzesText}>No quizzes available.</Text>
                  )}

                  <TouchableOpacity
                    style={styles.createNewQuizButton}
                    onPress={() => setIsCreatingQuiz(!isCreatingQuiz)}
                  >
                    <Plus size={16} color="#6366f1" />
                    <Text style={styles.createNewQuizText}>
                      {isCreatingQuiz ? 'Cancel Creation' : 'Create New Quiz'}
                    </Text>
                  </TouchableOpacity>

                  {isCreatingQuiz && (
                    <View style={styles.newQuizForm}>
                      <TextInput
                        style={styles.newQuizInput}
                        placeholder="New Quiz Title"
                        value={newQuizTitle}
                        onChangeText={setNewQuizTitle}
                      />
                      <TouchableOpacity
                        style={styles.createQuizConfirmButton}
                        onPress={handleCreateQuiz}
                      >
                        <Text style={styles.createQuizConfirmText}>Create</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => {
                    setShowSessionModal(false);
                    resetSessionForm();
                  }}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButtonConfirm, isAddingSession && styles.saveButtonDisabled]}
                  onPress={handleCreateSession}
                  disabled={isAddingSession}
                >
                  <Text style={styles.modalButtonText}>
                    {isAddingSession ? 'Saving...' : (isEditingSession ? 'Update Session' : 'Add Session')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView >
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
  chipContainer: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#6366f1',
  },
  chipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyOption: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  difficultySelected: {
    backgroundColor: '#6366f1',
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  difficultyTextSelected: {
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  moduleNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  moduleNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  moduleMeta: {
    fontSize: 13,
    color: '#64748b',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyModules: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  publishedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
  },
  publishedText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalButtonCancel: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalButtonCancelText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  moduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderBottomColor: '#e2e8f0',
    overflow: 'hidden',
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  moduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteIconButton: {
    padding: 4,
  },
  sessionsContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  sessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  addSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addSessionButtonText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sessionActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    padding: 6,
  },
  sessionRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sessionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  sessionMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  noSessions: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13,
    paddingVertical: 8,
  },
  modalScrollContent: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
  },
  typeSwitcher: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  typeSelected: {
    backgroundColor: '#6366f1',
  },
  typeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  typeTextSelected: {
    color: '#fff',
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    marginTop: 12,
  },
  quizSection: {
    width: '100%',
    marginBottom: 20,
  },
  quizList: {
    maxHeight: 150,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  quizOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  quizOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  quizOptionText: {
    fontSize: 14,
    color: '#475569',
  },
  quizOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  noQuizzesText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  createNewQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  createNewQuizText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  newQuizForm: {
    marginTop: 12,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  newQuizInput: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  createQuizConfirmButton: {
    backgroundColor: '#6366f1',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  createQuizConfirmText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
