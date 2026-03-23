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
import { ArrowLeft, User, Check, Plus, ShieldAlert } from 'lucide-react-native';
import { useCourseStore } from '../../../src/store/courseStore';
import { LoadingSpinner } from '../../../src/components/LoadingSpinner';

export default function CourseUsersAssignmentScreen() {
    const router = useRouter();
    const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
    const { fetchCourseUsers, assignUserToCourse, unassignUserFromCourse } = useCourseStore();

    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const data = await fetchCourseUsers(id!);
            setUsers(data);
        } catch (error) {
            console.error('Error loading course users:', error);
            Alert.alert('Error', 'Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) loadUsers();
    }, [id]);

    const toggleAssignment = async (user: any) => {
        try {
            if (user.is_assigned) {
                Alert.alert(
                    'Remove Access',
                    `Are you sure you want to remove access to "${title}" for ${user.name}?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: async () => {
                                await unassignUserFromCourse(id!, user.id);
                                loadUsers();
                            }
                        }
                    ]
                );
            } else {
                await assignUserToCourse(id!, user.id);
                loadUsers();
            }
        } catch (error) {
            console.error('Error toggling assignment:', error);
            Alert.alert('Error', 'Failed to update assignment');
        }
    };

    const renderUserItem = ({ item }: { item: any }) => (
        <View style={styles.userCard}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            <TouchableOpacity
                style={[
                    styles.assignButton,
                    item.is_assigned ? styles.unassignButton : styles.assignButtonActive
                ]}
                onPress={() => toggleAssignment(item)}
            >
                {item.is_assigned ? (
                    <>
                        <Check size={16} color="#22c55e" />
                        <Text style={styles.unassignButtonText}>Assigned</Text>
                    </>
                ) : (
                    <>
                        <Plus size={16} color="#fff" />
                        <Text style={styles.assignButtonText}>Assign</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );

    if (isLoading) {
        return <LoadingSpinner message="Loading users..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#1e293b" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Manage Students</Text>
                    {title ? <Text style={styles.subtitle}>{title}</Text> : null}
                </View>
            </View>

            <View style={styles.warningBox}>
                <ShieldAlert size={20} color="#f59e0b" />
                <Text style={styles.warningText}>
                    Toggling assignment here will grant or revoke access for individual users to this specific course.
                </Text>
            </View>

            <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={renderUserItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <User size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No users available</Text>
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
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 14,
        color: '#6366f1',
        fontWeight: '600',
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fffbeb',
        padding: 12,
        margin: 16,
        borderRadius: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: '#fef3c7',
    },
    warningText: {
        flex: 1,
        fontSize: 12,
        color: '#92400e',
        lineHeight: 18,
    },
    listContent: {
        padding: 16,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#eef2ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6366f1',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
        color: '#64748b',
    },
    assignButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
        minWidth: 90,
        justifyContent: 'center',
    },
    assignButtonActive: {
        backgroundColor: '#6366f1',
    },
    assignButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    unassignButton: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#dcfce7',
    },
    unassignButtonText: {
        color: '#16a34a',
        fontSize: 13,
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
