import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Book, Layers, Clock, CheckCircle } from 'lucide-react-native';
import { Course } from '../types';
import { getMediaUrl } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface CourseCardProps {
  course: Course;
  onPress: () => void;
  progress?: number;
  isCompleted?: boolean;
  showStatus?: boolean;
  totalModules?: number;
  completedModules?: number;
}

const difficultyColors: Record<string, string> = {
  beginner: '#22c55e',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

export const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  onPress, 
  progress, 
  isCompleted, 
  showStatus,
  totalModules,
  completedModules
}) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isLocked = !isAdmin && !course.is_assigned;

  const thumbnailUri = course.thumbnail_id
    ? getMediaUrl(course.thumbnail_id)
    : course.thumbnail;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
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
        {isCompleted && (
          <View style={styles.completedBadge}>
            <CheckCircle size={12} color="#fff" />
            <Text style={styles.completedBadgeText}>Completed</Text>
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
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: isCompleted ? '#16a34a' : '#22c55e' }]} />
            </View>
            <Text style={[styles.progressText, isCompleted && styles.progressTextCompleted]}>
              {totalModules !== undefined ? `${completedModules || 0}/${totalModules} Modules` : (isCompleted ? '100%' : `${Math.round(progress)}%`)}
            </Text>
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
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  progressTextCompleted: {
    color: '#16a34a',
    fontWeight: '700',
  },
  completedBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  completedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardLocked: {
    opacity: 0.8,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(241, 245, 249, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});
