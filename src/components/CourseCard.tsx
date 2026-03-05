import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Book, Layers, Clock } from 'lucide-react-native';
import { Course } from '../types';
import { getMediaUrl } from '../services/api';

interface CourseCardProps {
  course: Course;
  onPress: () => void;
  progress?: number;
  showStatus?: boolean;
}

const difficultyColors: Record<string, string> = {
  beginner: '#22c55e',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

export const CourseCard: React.FC<CourseCardProps> = ({ course, onPress, progress, showStatus }) => {
  const thumbnailUri = course.thumbnail_id
    ? getMediaUrl(course.thumbnail_id)
    : course.thumbnail;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.thumbnail}>
        {thumbnailUri ? (
          <Image source={{ uri: thumbnailUri }} style={styles.thumbnailImage} />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Book size={32} color="#94a3b8" />
          </View>
        )}
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: difficultyColors[course.difficulty] || '#6366f1' },
          ]}
        >
          <Text style={styles.difficultyText}>
            {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
          </Text>
        </View>
        {showStatus && (
          <View style={[
            styles.statusBadge,
            course.is_published ? styles.publishedBadge : styles.draftBadge,
          ]}>
            <Text style={[
              styles.statusText,
              course.is_published ? styles.publishedStatusText : styles.draftStatusText,
            ]}>
              {course.is_published ? 'Live' : 'Draft'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {course.description}
        </Text>
        <View style={styles.statContainer}>
          <View style={styles.stat}>
            <Layers size={14} color="#64748b" />
            <Text style={styles.statText}>{course.module_count || course.modules?.length || 0} modules</Text>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.stat}>
            <Clock size={14} color="#64748b" />
            <Text style={styles.statText}>{course.total_duration || 0} min</Text>
          </View>
        </View>
        {progress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  thumbnail: {
    height: 180,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderThumbnail: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  publishedBadge: {
    backgroundColor: '#dcfce7',
  },
  draftBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  publishedStatusText: {
    color: '#16a34a',
  },
  draftStatusText: {
    color: '#dc2626',
  },
  content: {
    padding: 12,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
  },
  description: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 12,
  },
  footer: {
    marginTop: 'auto',
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statSeparator: {
    width: 1,
    height: 12,
    backgroundColor: '#e2e8f0',
  },
  statText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: 60,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
});
