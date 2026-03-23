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
import { ArrowLeft, CheckCircle2, Circle, BookOpen, Clock } from 'lucide-react-native';
import { useCourseStore } from '../../../src/store/courseStore';
import { LoadingSpinner } from '../../../src/components/LoadingSpinner';

export default function StudentProgressScreen() {
    const router = useRouter();
    const { uid, cid, uname, ctitle } = useLocalSearchParams<{
        uid: string;
        cid: string;
        uname: string;
        ctitle: string
    }>();

    const { fetchStudentProgress } = useCourseStore();
    const [progress, setProgress] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadProgress = async () => {
        setIsLoading(true);
        try {
            const data = await fetchStudentProgress(uid!, cid!);
            setProgress(data);
        } catch (error) {
            console.error('Error loading student progress:', error);
            Alert.alert('Error', 'Failed to load progress data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (uid && cid) loadProgress();
    }, [uid, cid]);

    const renderSessionItem = (session: any) => (
        <View style={styles.sessionItem} key={session.id}>
            <View style={styles.sessionIcon}>
                {session.completed ? (
                    <CheckCircle2 size={20} color="#22c55e" />
                ) : (
                    <Circle size={20} color="#cbd5e1" />
                )}
            </View>
            <View style={styles.sessionInfo}>
                <Text style={[
                    styles.sessionName,
                    session.completed && styles.sessionCompletedText
                ]}>
                    {session.name}
                </Text>
            </View>
        </View>
    );

    const renderModuleItem = ({ item }: { item: any }) => (
        <View style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
                <BookOpen size={20} color="#6366f1" />
                <Text style={styles.moduleTitle}>{item.title}</Text>
            </View>
            <View style={styles.sessionList}>
                {item.sessions.map(renderSessionItem)}
            </View>
        </View>
    );

    if (isLoading) {
        return <LoadingSpinner message="Loading progress..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#1e293b" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Student Progress</Text>
                    <Text style={styles.subtitle}>{decodeURIComponent(uname || '')}</Text>
                </View>
            </View>

            <View style={styles.courseBadge}>
                <Text style={styles.courseBadgeLabel}>Course:</Text>
                <Text style={styles.courseBadgeValue}>{decodeURIComponent(ctitle || '')}</Text>
            </View>

            <FlatList
                data={progress}
                keyExtractor={(item) => item.id}
                renderItem={renderModuleItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Clock size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No progress data found</Text>
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
    courseBadge: {
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
        gap: 8,
    },
    courseBadgeLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    courseBadgeValue: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '700',
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    moduleCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    moduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    moduleTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    sessionList: {
        gap: 12,
    },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sessionIcon: {
        width: 24,
        alignItems: 'center',
    },
    sessionInfo: {
        flex: 1,
    },
    sessionName: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '500',
    },
    sessionCompletedText: {
        color: '#22c55e',
        fontWeight: '600',
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
