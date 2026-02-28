import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Users,
  Book,
  Clipboard,
  Award,
  PlusCircle,
  Map,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useCourseStore } from '../../src/store/courseStore';
import { CourseCard } from '../../src/components/CourseCard';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import api from '../../src/services/api';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { courses, learningPaths, fetchCourses, fetchLearningPaths } = useCourseStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);

  const loadData = async () => {
    try {
      await fetchCourses();
      await fetchLearningPaths();
      const [analyticsRes, usersRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users'),
      ]);
      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading admin panel..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.title}>Admin Panel</Text>
        </View>

        {/* Quick Stats */}
        {analytics && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#eef2ff' }]}>
                <Users size={24} color="#6366f1" />
              </View>
              <Text style={styles.statNumber}>{analytics.users.total}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                <Book size={24} color="#22c55e" />
              </View>
              <Text style={styles.statNumber}>{analytics.courses.total}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                <Clipboard size={24} color="#f59e0b" />
              </View>
              <Text style={styles.statNumber}>{analytics.quizzes.total}</Text>
              <Text style={styles.statLabel}>Quizzes</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#fce7f3' }]}>
                <Award size={24} color="#ec4899" />
              </View>
              <Text style={styles.statNumber}>{analytics.certificates}</Text>
              <Text style={styles.statLabel}>Certificates</Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/admin/course-editor')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#eef2ff' }]}>
                <PlusCircle size={28} color="#6366f1" />
              </View>
              <Text style={styles.actionText}>Create Course</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/admin/quiz-editor')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                <Clipboard size={28} color="#22c55e" />
              </View>
              <Text style={styles.actionText}>Create Quiz</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/admin/learning-path-editor')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                <Map size={28} color="#f59e0b" />
              </View>
              <Text style={styles.actionText}>Create Path</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Courses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Courses ({courses.length})</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {courses.length > 5 && (
                <TouchableOpacity onPress={() => setShowAllCourses(!showAllCourses)}>
                  <Text style={{ color: '#6366f1', fontWeight: '600' }}>
                    {showAllCourses ? 'Show Less' : 'Show More'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => router.push('/admin/course-editor')}>
                <Plus size={24} color="#6366f1" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.gridContainer}>
            {courses.slice(0, showAllCourses ? undefined : 6).map((course) => (
              <View key={course.id} style={styles.gridItem}>
                <CourseCard
                  course={course}
                  onPress={() => router.push(`/admin/course-editor?id=${course.id}`)}
                  showStatus={true}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Learning Paths */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Learning Paths ({learningPaths.length})</Text>
            <TouchableOpacity onPress={() => router.push('/admin/learning-path-editor')}>
              <Plus size={24} color="#6366f1" />
            </TouchableOpacity>
          </View>
          {learningPaths.slice(0, 5).map((path) => (
            <TouchableOpacity
              key={path.id}
              style={styles.listItem}
              onPress={() => router.push(`/admin/learning-path-editor?id=${path.id}`)}
            >
              <View style={styles.listItemIcon}>
                <Map size={20} color="#f59e0b" />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{path.title}</Text>
                <Text style={styles.listItemMeta}>
                  {path.course_ids.length} courses
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Users */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Users</Text>
          {users.slice(0, 5).map((u) => (
            <View key={u.id} style={styles.listItem}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {u.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{u.name}</Text>
                <Text style={styles.listItemMeta}>{u.email}</Text>
              </View>
              <View
                style={[
                  styles.roleBadge,
                  u.role === 'admin' ? styles.adminBadge : styles.studentBadge,
                ]}
              >
                <Text
                  style={[
                    styles.roleText,
                    u.role === 'admin' ? styles.adminText : styles.studentText,
                  ]}
                >
                  {u.role}
                </Text>
              </View>
            </View>
          ))}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
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
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  listItemMeta: {
    fontSize: 13,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  publishedBadge: {
    backgroundColor: '#dcfce7',
  },
  draftBadge: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  publishedText: {
    color: '#22c55e',
  },
  draftText: {
    color: '#f59e0b',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: '#eef2ff',
  },
  studentBadge: {
    backgroundColor: '#f1f5f9',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  adminText: {
    color: '#6366f1',
  },
  studentText: {
    color: '#64748b',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridItem: {
    width: '33.33%',
    padding: 6,
  },
});
