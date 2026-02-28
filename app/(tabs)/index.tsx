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
  Settings,
  Bell,
  Book,
  CheckCircle,
  Award,
  Map
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useCourseStore } from '../../src/store/courseStore';
import { CourseCard } from '../../src/components/CourseCard';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { LearningPath, Course } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { courses, fetchCourses, fetchRecommendedPaths, fetchNotifications, notifications, isLoading } = useCourseStore();
  const [recommendedPaths, setRecommendedPaths] = useState<LearningPath[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const loadData = async () => {
    try {
      await fetchCourses();
      await fetchNotifications();
      const paths = await fetchRecommendedPaths();
      setRecommendedPaths(paths);

      const dashboard = await useCourseStore.getState().fetchDashboard();
      setDashboardData(dashboard);
    } catch (error) {
      console.error('Error loading home data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const isAdmin = user?.role === 'admin';

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
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Learner'}</Text>
          </View>
          <View style={styles.headerActions}>
            {isAdmin && (
              <TouchableOpacity
                style={styles.adminButton}
                onPress={() => router.push('/admin')}
              >
                <Settings size={22} color="#6366f1" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={24} color="#1e293b" />
              {unreadNotifications > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        {dashboardData && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Book size={24} color="#6366f1" />
              <Text style={styles.statNumber}>{dashboardData.total_courses_enrolled}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.statCard}>
              <CheckCircle size={24} color="#22c55e" />
              <Text style={styles.statNumber}>{dashboardData.total_modules_completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Award size={24} color="#f59e0b" />
              <Text style={styles.statNumber}>{dashboardData.certificates_earned}</Text>
              <Text style={styles.statLabel}>Certificates</Text>
            </View>
          </View>
        )}

        {/* Continue Learning */}
        {dashboardData?.course_stats?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue Learning</Text>
            </View>
            {dashboardData.course_stats.slice(0, 2).map((stat: any) => (
              <TouchableOpacity
                key={stat.course_id}
                style={styles.continueCard}
                onPress={() => router.push(`/course/${stat.course_id}`)}
              >
                <View style={styles.continueInfo}>
                  <Text style={styles.continueTitle}>{stat.course_title}</Text>
                  <Text style={styles.continueProgress}>
                    {stat.completed_modules} / {stat.total_modules} modules
                  </Text>
                </View>
                <View style={styles.continueProgressBar}>
                  <View
                    style={[
                      styles.continueProgressFill,
                      { width: `${stat.progress_percentage}%` },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recommended Learning Paths */}
        {recommendedPaths.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended Paths</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recommendedPaths.map((path) => (
                <TouchableOpacity key={path.id} style={styles.pathCard}>
                  <View style={styles.pathIcon}>
                    <Map size={28} color="#6366f1" />
                  </View>
                  <Text style={styles.pathTitle}>{path.title}</Text>
                  <Text style={styles.pathDescription} numberOfLines={2}>
                    {path.description}
                  </Text>
                  <Text style={styles.pathCourses}>
                    {path.course_ids.length} courses
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Courses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Courses</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/courses')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <LoadingSpinner />
          ) : courses.length > 0 ? (
            <View style={styles.gridContainer}>
              {courses.slice(0, 6).map((course) => (
                <View key={course.id} style={styles.gridItem}>
                  <CourseCard
                    course={course}
                    onPress={() => router.push(`/course/${course.id}`)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Book size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No courses available yet</Text>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => router.push('/admin')}
                >
                  <Text style={styles.createButtonText}>Create First Course</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#64748b',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  seeAll: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  continueCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  continueInfo: {
    marginBottom: 12,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  continueProgress: {
    fontSize: 13,
    color: '#64748b',
  },
  continueProgressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  continueProgressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  pathCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
  },
  pathIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pathTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  pathDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 8,
  },
  pathCourses: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
  },
  createButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
