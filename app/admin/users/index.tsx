import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Search,
    ChevronLeft,
    ChevronRight,
    User,
    Plus
} from 'lucide-react-native';
import { useCourseStore } from '../../../src/store/courseStore';
import { LoadingSpinner } from '../../../src/components/LoadingSpinner';

export default function UserManagementScreen() {
    const router = useRouter();
    const { fetchAdminUsers } = useCourseStore();

    const [users, setUsers] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    const loadUsers = useCallback(async (p = 1, s = '') => {
        setIsLoading(true);
        try {
            // Updated fetchAdminUsers call to filter by role 'student'
            const data = await fetchAdminUsers(p, 10, s, 'student'); // Assuming fetchAdminUsers now takes (page, limit, search, role)

            setUsers(data.users);
            setPages(data.pages);
            setTotal(data.total);
            setPage(p);
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setIsLoading(false);
            setIsSearching(false);
        }
    }, [fetchAdminUsers]);

    useFocusEffect(
        useCallback(() => {
            loadUsers(1, '');
        }, [loadUsers])
    );

    const handleSearch = () => {
        setIsSearching(true);
        loadUsers(1, search);
    };

    const renderUserItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => router.push(`/admin/users/assign?id=${item.id}&name=${encodeURIComponent(item.name)}`)}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            <View style={[styles.roleBadge, item.role === 'admin' ? styles.adminBadge : styles.studentBadge]}>
                <Text style={[styles.roleText, item.role === 'admin' ? styles.adminText : styles.studentText]}>
                    {item.role || 'student'}
                </Text>
            </View>
            <View style={styles.assignAction}>
                <ChevronRight size={18} color="#6366f1" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Manage Students</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/admin/users/create')}
                >
                    <Plus size={24} color="#6366f1" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Search size={20} color="#94a3b8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or email..."
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={handleSearch}
                    />
                    {isSearching && <ActivityIndicator size="small" color="#6366f1" />}
                </View>
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
            </View>

            {isLoading && page === 1 ? (
                <LoadingSpinner message="Fetching users..." />
            ) : (
                <>
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item.id}
                        renderItem={renderUserItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <User size={48} color="#cbd5e1" />
                                <Text style={styles.emptyText}>No users found</Text>
                            </View>
                        }
                    />

                    {/* Pagination */}
                    {pages > 1 && (
                        <View style={styles.pagination}>
                            <TouchableOpacity
                                style={[styles.pageButton, page === 1 && styles.disabledButton]}
                                disabled={page === 1}
                                onPress={() => loadUsers(page - 1, search)}
                            >
                                <ChevronLeft size={20} color={page === 1 ? "#cbd5e1" : "#1e293b"} />
                            </TouchableOpacity>

                            <Text style={styles.pageInfo}>{`Page ${page} of ${pages}`}</Text>

                            <TouchableOpacity
                                style={[styles.pageButton, page === pages && styles.disabledButton]}
                                disabled={page === pages}
                                onPress={() => loadUsers(page + 1, search)}
                            >
                                <ChevronRight size={20} color={page === pages ? "#cbd5e1" : "#1e293b"} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.footer}>
                        <Text style={styles.totalText}>Total {total} users</Text>
                    </View>
                </>
            )}
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 12,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eef2ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        gap: 12,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 15,
        color: '#1e293b',
    },
    searchButton: {
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: '600',
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
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
    },
    adminBadge: {
        backgroundColor: '#eef2ff',
    },
    studentBadge: {
        backgroundColor: '#f1f5f9',
    },
    roleText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    adminText: {
        color: '#6366f1',
    },
    studentText: {
        color: '#64748b',
    },
    assignAction: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    assignActionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6366f1',
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
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        gap: 20,
    },
    pageButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    pageInfo: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 8,
        backgroundColor: '#fff',
    },
    totalText: {
        fontSize: 12,
        color: '#94a3b8',
    },
});
