import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, Clock } from 'lucide-react-native';
import { LearningPath, Course } from '../types';
import { useRouter } from 'expo-router';

interface LearningPathVisualizerProps {
  path: LearningPath;
  courses: Course[];
  courseStats?: any[];
}

const COLORS = [
  '#f59e0b', // Orange/Amber
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#10b981', // Emerald
];

export const LearningPathVisualizer: React.FC<LearningPathVisualizerProps> = ({ path, courses, courseStats }) => {
  const router = useRouter();
  
  // Resolve course objects from IDs
  const pathCourses = path.course_ids
    .map(id => courses.find(c => c.id === id))
    .filter((c): c is Course => !!c);

  if (pathCourses.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.pathHeader}>
        <Text style={styles.pathTitle}>{path.title}</Text>
        <Text style={styles.pathDescription}>{path.description}</Text>
      </View>

      <View style={styles.stepsContainer}>
        {pathCourses.map((course, index) => {
          const isLeft = index % 2 === 0;
          const color = COLORS[index % COLORS.length];
          const stat = courseStats?.find(s => s.course_id === course.id);
          
          return (
            <TouchableOpacity
              key={course.id}
              style={[
                styles.stepRow,
                isLeft ? styles.stepRowLeft : styles.stepRowRight
              ]}
              onPress={() => router.push(`/course/${course.id}`)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.stepContainer,
                isLeft ? styles.stepContainerLeft : styles.stepContainerRight
              ]}>
                
                {/* Number Circle */}
                <View style={[
                  styles.numberCircle,
                  { backgroundColor: '#fff', borderColor: color },
                  isLeft ? styles.numberCircleLeft : styles.numberCircleRight
                ]}>
                    <View style={[styles.numberCircleInner, { backgroundColor: color }]}>
                        <Text style={styles.numberText}>{index + 1}</Text>
                    </View>
                </View>

                {/* Pill Bar */}
                <View style={[
                  styles.pillBar,
                  { backgroundColor: color },
                  isLeft ? styles.pillBarLeft : styles.pillBarRight
                ]}>
                    <View style={styles.pillContent}>
                      <Text style={styles.courseTitle} numberOfLines={1}>
                        {course.title}
                      </Text>
                      {stat && (
                        <View style={[
                          styles.statsFooter,
                          isLeft ? { flexDirection: 'row' } : { flexDirection: 'row-reverse' }
                        ]}>
                          <Text style={styles.moduleCountText}>
                            {stat.completed_modules}/{stat.total_modules} modules completed
                          </Text>
                          <View style={[
                            styles.statusTag,
                            stat.is_completed ? styles.completedTag : styles.inProgressTag
                          ]}>
                            {stat.is_completed ? (
                              <CheckCircle size={12} color="#fff" />
                            ) : (
                              <Clock size={12} color="#fff" />
                            )}
                            <Text style={styles.statusTagText}>
                              {stat.is_completed ? 'Completed' : 'In Progress'}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                </View>

              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  pathHeader: {
    marginBottom: 24,
  },
  pathTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  pathDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  stepsContainer: {
    gap: 20,
  },
  stepRow: {
    width: '100%',
  },
  stepRowLeft: {
    alignItems: 'flex-start',
  },
  stepRowRight: {
    alignItems: 'flex-end',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '85%',
    position: 'relative',
    height: 80,
  },
  stepContainerLeft: {
    flexDirection: 'row',
  },
  stepContainerRight: {
    flexDirection: 'row-reverse',
  },
  numberCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  numberCircleInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberCircleLeft: {
    marginRight: -25,
  },
  numberCircleRight: {
    marginLeft: -25,
  },
  numberText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  pillBar: {
    flex: 1,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    paddingHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  pillBarLeft: {
    paddingLeft: 45,
  },
  pillBarRight: {
    paddingRight: 45,
    alignItems: 'flex-end',
  },
  pillContent: {
    flex: 1,
    justifyContent: 'center',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  statsFooter: {
    alignItems: 'center',
    gap: 12,
  },
  moduleCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  completedTag: {
    backgroundColor: '#16a34a',
  },
  inProgressTag: {
    backgroundColor: '#f59e0b',
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
  },
});
