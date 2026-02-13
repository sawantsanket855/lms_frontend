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
import { Book, CheckCircle, Clock, Award, Eye } from 'lucide-react-native';
import { useCourseStore } from '../../src/store/courseStore';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';

export default function ProgressScreen() {
  const router = useRouter();
  const { fetchDashboard, fetchCertificates, certificates } = useCourseStore();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchDashboard();
      setDashboardData(data);
      await fetchCertificates();
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading progress..." />;
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
          <Text style={styles.title}>My Progress</Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#eef2ff' }]}>
              <Book size={24} color="#6366f1" />
            </View>
            <Text style={styles.statNumber}>
              {dashboardData?.total_courses_enrolled || 0}
            </Text>
            <Text style={styles.statLabel}>Courses Enrolled</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
              <CheckCircle size={24} color="#22c55e" />
            </View>
            <Text style={styles.statNumber}>
              {dashboardData?.total_modules_completed || 0}
            </Text>
            <Text style={styles.statLabel}>Sessions Done</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <Clock size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statNumber}>
              {Math.round((dashboardData?.total_time_spent_minutes || 0) / 60)}h
            </Text>
            <Text style={styles.statLabel}>Learning Time</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fce7f3' }]}>
              <Award size={24} color="#ec4899" />
            </View>
            <Text style={styles.statNumber}>
              {dashboardData?.certificates_earned || 0}
            </Text>
            <Text style={styles.statLabel}>Certificates</Text>
          </View>
        </View>

        {/* Course Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course Progress</Text>
          {dashboardData?.course_stats?.length > 0 ? (
            dashboardData.course_stats.map((stat: any) => (
              <TouchableOpacity
                key={stat.course_id}
                style={styles.progressCard}
                onPress={() => router.push(`/course/${stat.course_id}`)}
              >
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>{stat.course_title}</Text>
                  <Text style={styles.progressPercent}>
                    {Math.round(stat.progress_percentage)}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${stat.progress_percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressModules}>
                  {stat.completed_sessions} of {stat.total_sessions} sessions completed
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Book size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No courses started</Text>
              <Text style={styles.emptyText}>
                Start learning to track your progress
              </Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => router.push('/(tabs)/courses')}
              >
                <Text style={styles.exploreButtonText}>Explore Courses</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Certificates */}
        {certificates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certificates Earned</Text>
            {certificates.map((cert) => (
              <View key={cert.id} style={styles.certificateCard}>
                <View style={styles.certificateIcon}>
                  <Award size={32} color="#f59e0b" />
                </View>
                <View style={styles.certificateInfo}>
                  <Text style={styles.certificateTitle}>
                    {cert.course_title || cert.learning_path_title}
                  </Text>
                  <Text style={styles.certificateDate}>
                    Earned on {new Date(cert.issued_at).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity style={styles.viewButton}>
                  <Eye size={20} color="#6366f1" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressModules: {
    fontSize: 13,
    color: '#64748b',
  },
  certificateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  certificateIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  certificateInfo: {
    flex: 1,
  },
  certificateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  certificateDate: {
    fontSize: 13,
    color: '#64748b',
  },
  viewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  exploreButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
