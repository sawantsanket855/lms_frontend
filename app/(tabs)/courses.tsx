import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, XCircle } from 'lucide-react-native';
import { useCourseStore } from '../../src/store/courseStore';
import { CourseCard } from '../../src/components/CourseCard';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function CoursesScreen() {
  const router = useRouter();
  const { courses, fetchCourses, isLoading } = useCourseStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSearch = () => {
    fetchCourses({
      search: searchQuery || undefined,
      difficulty: selectedDifficulty !== 'All' ? selectedDifficulty.toLowerCase() : undefined,
    });
  };

  useEffect(() => {
    handleSearch();
  }, [selectedDifficulty]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCourses();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Courses</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              fetchCourses();
            }}>
              <XCircle size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Difficulty Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {DIFFICULTIES.map((difficulty) => (
          <TouchableOpacity
            key={difficulty}
            style={[
              styles.filterChip,
              selectedDifficulty === difficulty && styles.filterChipSelected,
            ]}
            onPress={() => setSelectedDifficulty(difficulty)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedDifficulty === difficulty && styles.filterChipTextSelected,
              ]}
            >
              {difficulty}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>


      {/* Course List */}
      <ScrollView
        style={styles.courseList}
        contentContainerStyle={styles.courseListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : courses.length > 0 ? (
          courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => router.push(`/course/${course.id}`)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Search size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No courses found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or filters
            </Text>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  filterContainer: {
    maxHeight: 48,
    marginBottom: 8,
  },
  categoryContainer: {
    maxHeight: 40,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  courseList: {
    flex: 1,
  },
  courseListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
  },
});
