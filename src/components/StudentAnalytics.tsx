import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useCourseStore } from '../store/courseStore';
import { BookOpen, CheckCircle, Clock, Award, Activity, Flame, ChevronDown, ChevronUp } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface Props {
  userId: string;
  scrollEnabled?: boolean;
}

export const StudentAnalytics: React.FC<Props> = ({ userId, scrollEnabled = true }) => {
  const { fetchStudentAnalytics } = useCourseStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [userId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetchStudentAnalytics(userId);
      setData(res);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading Analytics...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No data available.</Text>
      </View>
    );
  }

  const { course_progress, session_progress, quiz_analytics, activity, learning_paths } = data;

  const ContentWrapper = scrollEnabled ? ScrollView : View;
  const wrapperProps = scrollEnabled 
    ? { style: styles.container, contentContainerStyle: styles.content }
    : { style: styles.nestedContainer };

  return (
    <ContentWrapper {...wrapperProps}>
      
      {/* Activity & Streak */}
      <View style={styles.row}>
        <View style={[styles.statCard, { flex: 1, marginRight: 8, backgroundColor: '#fff7ed', borderColor: '#ffedd5' }]}>
          <Flame size={24} color="#f97316" />
          <Text style={styles.statValue}>{activity.current_streak} days</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        <View style={[styles.statCard, { flex: 1, marginLeft: 8, backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }]}>
          <Activity size={24} color="#22c55e" />
          <Text style={styles.statValue}>{activity.total_active_days}</Text>
          <Text style={styles.statLabel}>Total Active Days</Text>
        </View>
      </View>

      {/* Course Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Course Overview</Text>
        <View style={styles.row}>
          <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.statValue}>{course_progress.stats.total_assigned}</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>
          <View style={[styles.statCard, { flex: 1, marginHorizontal: 4 }]}>
            <Text style={styles.statValue}>{course_progress.stats.total_started}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.statValue}>{course_progress.stats.total_completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
        
        {course_progress.courses.length > 0 && (
          <View style={styles.cardList}>
            {course_progress.courses.map((c: any) => (
              <View key={c.id} style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle} numberOfLines={1}>{c.title}</Text>
                  <Text style={styles.progressPercent}>{c.progress_percentage}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(100, c.progress_percentage)}%`, backgroundColor: c.is_completed ? '#22c55e' : '#6366f1' }]} />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Session Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session Progress</Text>
        <View style={styles.row}>
          <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
            <CheckCircle size={24} color="#10b981" />
            <Text style={styles.statValue}>{session_progress.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
            <Clock size={24} color="#f59e0b" />
            <Text style={styles.statValue}>{session_progress.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </View>

      {/* Quiz Analytics */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quiz Analytics</Text>
          <View style={styles.quizSummary}>
            <Text style={styles.quizSummaryText}>{quiz_analytics.passed} / {quiz_analytics.attempted} Passed</Text>
          </View>
        </View>
        
        {quiz_analytics.attempts.length === 0 ? (
          <Text style={styles.emptyText}>No quizzes attempted yet.</Text>
        ) : (
          quiz_analytics.attempts.map((q: any) => (
            <View key={q.id} style={styles.quizCard}>
              <TouchableOpacity 
                style={styles.quizHeader} 
                onPress={() => setExpandedQuiz(expandedQuiz === q.id ? null : q.id)}
              >
                <View style={styles.quizInfo}>
                  <Text style={styles.quizTitle}>{q.title}</Text>
                  <Text style={styles.quizDate}>{new Date(q.date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.quizScoreRow}>
                  <Text style={[styles.quizScore, { color: q.passed ? '#16a34a' : '#ef4444' }]}>
                    Score: {q.score}%
                  </Text>
                  {expandedQuiz === q.id ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
                </View>
              </TouchableOpacity>
              
              {expandedQuiz === q.id && (
                <View style={styles.quizDetails}>
                  {q.details.map((d: any, idx: number) => (
                    <View key={idx} style={styles.questionItem}>
                      <Text style={styles.questionText}>{idx + 1}. {d.question}</Text>
                      <View style={styles.answerRow}>
                        <Text style={styles.answerLabel}>Selected:</Text>
                        <Text style={[styles.answerValue, { color: d.is_correct ? '#16a34a' : '#ef4444' }]}>
                          Option {d.selected_answer !== null ? d.selected_answer + 1 : 'None'}
                        </Text>
                      </View>
                      {!d.is_correct && (
                        <View style={styles.answerRow}>
                          <Text style={styles.answerLabel}>Correct:</Text>
                          <Text style={[styles.answerValue, { color: '#16a34a' }]}>
                            Option {d.correct_answer !== null ? d.correct_answer + 1 : 'None'}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Learning Paths */}
      {learning_paths.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Paths</Text>
          {learning_paths.map((lp: any) => (
            <View key={lp.id} style={styles.pathCard}>
              <Award size={20} color="#6366f1" />
              <View style={styles.pathInfo}>
                <Text style={styles.pathTitle}>{lp.title}</Text>
                <Text style={[styles.pathStatus, { color: lp.is_completed ? '#16a34a' : '#f59e0b' }]}>
                  {lp.is_completed ? 'Completed' : 'In Progress'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ContentWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  nestedContainer: {
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  quizSummary: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quizSummaryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  cardList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  quizCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  quizDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  quizScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quizScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  quizDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  questionItem: {
    marginBottom: 12,
  },
  questionText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  answerRow: {
    flexDirection: 'row',
    marginLeft: 12,
    marginTop: 2,
  },
  answerLabel: {
    fontSize: 13,
    color: '#64748b',
    width: 60,
  },
  answerValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  pathCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  pathInfo: {
    marginLeft: 12,
  },
  pathTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  pathStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    fontStyle: 'italic',
  }
});
