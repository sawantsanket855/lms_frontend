import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Circle, Book, Clock, ChevronRight, Lock } from 'lucide-react-native';
import { useCourseStore } from '../../../src/store/courseStore';
import { LoadingSpinner } from '../../../src/components/LoadingSpinner';

export default function PathProgressScreen() {
    const router = useRouter();
    const { uid, pid, uname, ptitle } = useLocalSearchParams<{
        uid: string;
        pid: string;
        uname: string;
        ptitle: string
    }>();

    const { fetchPathProgress } = useCourseStore();
    const [progress, setProgress] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadProgress = async () => {
        setIsLoading(true);
        try {
            const data = await fetchPathProgress(uid!, pid!);
            setProgress(data);
        } catch (error) {
            console.error('Error loading path progress:', error);
            Alert.alert('Error', 'Failed to load progress data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (uid && pid) loadProgress();
    }, [uid, pid]);

    const renderCourseItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.courseCard}
            onPress={() => item.access_status !== 'not_assigned' && router.push(`/admin/users/progress?uid=${uid}&cid=${item.id}&uname=${encodeURIComponent(uname || '')}&ctitle=${encodeURIComponent(item.title)}`)}
        >
            <View style={styles.courseHeader}>
                <View style={styles.titleRow}>
                    <Text style={styles.courseTitle}>{item.title}</Text>
                    {item.is_completed && (
                        <View style={styles.completedBadge}>
                            <CheckCircle2 size={12} color="#16a34a" />
                            <Text style={styles.completedBadgeText}>Completed</Text>
                        </View>
                    )}
                    {item.access_status === 'blocked' && (
                        <View style={styles.blockedBadge}>
                            <Lock size={12} color="#ef4444" />
                            <Text style={styles.blockedBadgeText}>Blocked</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.courseDifficulty}>{item.difficulty}</Text>
            </View>

            <View style={styles.progressSection}>
                <View style={styles.progressInfo}>
                    <Text style={styles.progressText}>
                        {item.completed_sessions} / {item.total_sessions} modules completed
                    </Text>
                    <Text style={styles.percentageText}>
                        {item.total_sessions > 0 ? Math.round((item.completed_sessions / item.total_sessions) * 100) : 0}%
                    </Text>
                </View>
                <View style={styles.progressBarBg}>
                    <View 
                        style={[
                            styles.progressBarFill, 
                            { width: `${item.total_sessions > 0 ? (item.completed_sessions / item.total_sessions) * 100 : 0}%` },
                            item.is_completed && { backgroundColor: '#22c55e' }
                        ]} 
                    />
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    {item.access_status === 'not_assigned' ? 'Not Individually Assigned' : 'View Detailed Progress'}
                </Text>
                <ChevronRight size={16} color="#94a3b8" />
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return <LoadingSpinner message="Loading path progress..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#1e293b" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>Path Progress</Text>
                    <Text style={styles.subtitle}>{decodeURIComponent(uname || '')}</Text>
                </View>
            </View>

            <View style={styles.pathBadge}>
                <Book size={20} color="#6366f1" />
                <View style={{ flex: 1 }}>
                    <Text style={styles.pathLabel}>Learning Path:</Text>
                    <Text style={styles.pathValue}>{decodeURIComponent(ptitle || '')}</Text>
                </View>
            </View>

            <FlatList
                data={progress}
                keyExtractor={(item) => item.id}
                renderItem={renderCourseItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Clock size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No courses in this path</Text>
                    </View>
                }
            />
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 14,
        color: '#6366f1',
        fontWeight: '600',
    },
    pathBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 12,
    },
    pathLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    pathValue: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '700',
    },
    listContent: {
        padding: 16,
    },
    courseCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    courseHeader: {
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
    },
    courseTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        flexShrink: 1,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    completedBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#16a34a',
    },
    blockedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fee2e2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    blockedBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ef4444',
    },
    courseDifficulty: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    progressSection: {
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '500',
    },
    percentageText: {
        fontSize: 12,
        color: '#6366f1',
        fontWeight: '700',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#e2e8f0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#6366f1',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 8,
    },
    footerText: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: '#94a3b8',
    },
});
