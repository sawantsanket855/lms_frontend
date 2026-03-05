import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  Book,
  Check,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  PlayCircle,
  Headphones,
  FileText,
  HelpCircle,
  Layout,
  ChevronRight,
  Folder,
  ClipboardList,
  MessageSquare,
  MessageCircle,
} from 'lucide-react-native';
import { useCourseStore } from '../../src/store/courseStore';
import { useAuthStore } from '../../src/store/authStore';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { Course, Module } from '../../src/types';

const difficultyColors: Record<string, string> = {
  beginner: '#22c55e',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchCourse, fetchCourseProgress, updateProgress, fetchQuizzes, fetchSessions, quizzes, sessions } = useCourseStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const courseData = await fetchCourse(id!);
        setCourse(courseData);
        const progressData = await fetchCourseProgress(id!);
        setProgress(progressData);
        await fetchQuizzes(id);
      } catch (error) {
        console.error('Error loading course:', error);
        Alert.alert('Error', 'Failed to load course');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  const handleModuleComplete = async (moduleId: string) => {
    try {
      await updateProgress(id!, moduleId, true, 10);
      const progressData = await fetchCourseProgress(id!);
      setProgress(progressData);
      Alert.alert('Success', 'Module completed!');
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const isModuleCompleted = (moduleId: string) => {
    return progress?.module_progress?.some(
      (p: any) => p.module_id === moduleId && p.completed
    );
  };

  const toggleModuleExpansion = async (moduleId: string) => {
    if (expandedModule === moduleId) {
      setExpandedModule(null);
    } else {
      setExpandedModule(moduleId);
      // Fetch sessions if not already loaded
      if (!sessions[moduleId]) {
        try {
          await fetchSessions(id!, moduleId);
        } catch (error) {
          console.error('Error fetching sessions:', error);
        }
      }
    }
  };

  const getModuleStats = (module: any) => {
    if (module.session_count !== undefined) {
      return { count: module.session_count, time: module.total_duration || 0 };
    }
    const moduleSessions = sessions[module.id] || [];
    if (moduleSessions.length > 0) {
      const count = moduleSessions.length;
      const time = moduleSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
      return { count, time };
    }
    return { count: 0, time: 0 };
  };

  const courseQuizzes = quizzes.filter((q) => q.course_id === id);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading course..." />;
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <AlertCircle size={48} color="#ef4444" />
          <Text style={styles.errorText}>Course not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {course.title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Course Banner */}
        <View style={styles.banner}>
          {course.thumbnail ? (
            <Image
              source={{ uri: course.thumbnail }}
              style={styles.bannerImage}
            />
          ) : (
            <View style={styles.bannerIcon}>
              <Book size={48} color="#6366f1" />
            </View>
          )}
        </View>

        {/* Course Info */}
        <View style={styles.infoSection}>
          <View style={styles.badges}>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: difficultyColors[course.difficulty] },
              ]}
            >
              <Text style={styles.badgeText}>
                {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
              </Text>
            </View>
          </View>

          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseDescription}>{course.description}</Text>

          {/* Tags */}
          {course.tags.length > 0 && (
            <View style={styles.tags}>
              {course.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Progress */}
          {progress && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Your Progress</Text>
                <Text style={styles.progressPercent}>
                  {Math.round(progress.progress_percentage || 0)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress.progress_percentage || 0}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {progress.completed_sessions} of {progress.total_sessions} sessions completed
              </Text>
            </View>
          )}
        </View>

        {/* Modules */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>Course Content</Text>
          <Text style={styles.moduleCount}>
            {course.modules.length} modules
          </Text>

          {course.modules.length > 0 ? (
            course.modules.map((module, index) => {
              const completed = isModuleCompleted(module.id);
              const isExpanded = expandedModule === module.id;

              return (
                <View key={module.id} style={styles.moduleCard}>
                  <TouchableOpacity
                    style={styles.moduleHeader}
                    onPress={() => toggleModuleExpansion(module.id)}
                  >
                    <View style={styles.moduleInfo}>
                      <View
                        style={[
                          styles.moduleNumber,
                          completed && styles.moduleNumberCompleted,
                        ]}
                      >
                        {completed ? (
                          <Check size={16} color="#fff" />
                        ) : (
                          <Text style={styles.moduleNumberText}>{index + 1}</Text>
                        )}
                      </View>
                      <View style={styles.moduleDetails}>
                        <Text style={styles.moduleTitle}>{module.title}</Text>
                        <View style={styles.moduleMeta}>
                          <Text style={styles.moduleMetaText}>
                            {(() => {
                              const stats = getModuleStats(module);
                              return `${stats.count} Sessions · ${stats.time} min`;
                            })()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {isExpanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.moduleContent}>
                      {(sessions[module.id] || []).length > 0 ? (
                        sessions[module.id].map((session: any) => (
                          <React.Fragment key={session.id}>
                            <TouchableOpacity
                              style={[
                                styles.sessionItem,
                                session.completed && styles.sessionItemCompleted
                              ]}
                              onPress={() => router.push(`/session/${session.id}`)}
                            >
                              {session.completed ? (
                                <CheckCircle size={18} color="#22c55e" />
                              ) : session.content_type === 'video' ? (
                                <PlayCircle size={18} color="#6366f1" />
                              ) : session.content_type === 'audio' ? (
                                <Headphones size={18} color="#6366f1" />
                              ) : session.content_type === 'pdf' ? (
                                <FileText size={18} color="#6366f1" />
                              ) : session.content_type === 'quiz' ? (
                                <HelpCircle size={18} color="#6366f1" />
                              ) : (
                                <Layout size={18} color="#6366f1" />
                              )}
                              <View style={styles.sessionInfo}>
                                <Text style={styles.sessionName}>{session.name}</Text>
                                <Text style={styles.sessionMeta}>
                                  {session.content_type} · {session.duration_minutes} min
                                  {session.is_document_available && ' · File available'}
                                </Text>
                              </View>
                              <ChevronRight size={18} color="#cbd5e1" />
                            </TouchableOpacity>

                            {/* Show associated quiz if any */}
                            {quizzes.filter(q => q.session_id === session.id).map(quiz => (
                              <TouchableOpacity
                                key={quiz.id}
                                style={styles.quizItem}
                                onPress={() => router.push(`/quiz/${quiz.id}`)}
                              >
                                <HelpCircle size={16} color="#8b5cf6" />
                                <View style={styles.sessionInfo}>
                                  <Text style={styles.quizName}>{quiz.title}</Text>
                                  <Text style={styles.sessionMeta}>Quiz · {quiz.questions?.length || 0} questions</Text>
                                </View>
                                <ChevronRight size={16} color="#cbd5e1" />
                              </TouchableOpacity>
                            ))}
                          </React.Fragment>
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
              <Folder size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>No modules added yet</Text>
            </View>
          )}
        </View>

        {/* Assessments Section */}
        {courseQuizzes.length > 0 && (
          <View style={styles.modulesSection}>
            <Text style={styles.sectionTitle}>Assessments</Text>
            <Text style={styles.moduleCount}>{courseQuizzes.length} quizzes available</Text>

            <View style={styles.quizList}>
              {courseQuizzes.map((quiz) => (
                <TouchableOpacity
                  key={quiz.id}
                  style={styles.quizCard}
                  onPress={() => router.push(`/quiz/${quiz.id}`)}
                >
                  <View style={styles.quizCardHeader}>
                    <View style={styles.quizIconFull}>
                      <ClipboardList size={24} color="#8b5cf6" />
                    </View>
                    <View style={styles.quizCardInfo}>
                      <Text style={styles.quizCardTitle}>{quiz.title}</Text>
                      <Text style={styles.quizCardMeta}>
                        {quiz.questions?.length || 0} Questions · {quiz.time_limit_minutes || 30} mins
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#cbd5e1" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Community Section */}
        <View style={styles.communitySection}>
          <Text style={styles.sectionTitle}>Community</Text>
          <TouchableOpacity
            style={styles.communityCard}
            onPress={() => router.push('/(tabs)/community')}
          >
            <MessageSquare size={24} color="#6366f1" />
            <Text style={styles.communityText}>Join Discussion Forum</Text>
            <ChevronRight size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.communityCard}
            onPress={() => router.push('/(tabs)/community')}
          >
            <MessageCircle size={24} color="#f59e0b" />
            <Text style={styles.communityText}>Ask an Expert</Text>
            <ChevronRight size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  banner: {
    height: 160,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  progressSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#64748b',
  },
  modulesSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  moduleCount: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  moduleCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  moduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moduleNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  moduleNumberCompleted: {
    backgroundColor: '#22c55e',
  },
  moduleNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  moduleDetails: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  moduleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moduleMetaText: {
    fontSize: 12,
    color: '#64748b',
  },
  moduleContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  contentText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
    borderRadius: 8,
  },
  sessionItemCompleted: {
    backgroundColor: '#f0fdf4', // light green
  },
  quizItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginLeft: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
    backgroundColor: '#fafafa',
    borderLeftWidth: 2,
    borderLeftColor: '#8b5cf6',
  },
  quizName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1e293b',
  },
  quizList: {
    marginTop: 12,
    gap: 12,
  },
  quizCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  quizCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quizIconFull: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizCardInfo: {
    flex: 1,
  },
  quizCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  quizCardMeta: {
    fontSize: 13,
    color: '#64748b',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  sessionMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  communitySection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 24,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  communityText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 12,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noSessions: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyModules: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#94a3b8',
  },
});
