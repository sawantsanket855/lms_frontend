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
import { ArrowLeft, Book, Check, Plus, ShieldAlert, Snowflake, Trash2, Eye, Sun, Lock, Unlock, Award, Trophy, CheckCircle, X, ChevronRight, Download } from 'lucide-react-native';
import { useCourseStore } from '../../../src/store/courseStore';
import { LoadingSpinner } from '../../../src/components/LoadingSpinner';
import { Modal, ScrollView, ActivityIndicator, Image, TextInput as RNTextInput } from 'react-native';
import { CertificatePreview, generateCertificateHTML } from '../../../src/components/CertificatePreview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getMediaUrl } from '../../../src/services/api';
import { toTitleCase } from '../../../src/utils/format';
import { StudentAnalytics } from '../../../src/components/StudentAnalytics';

export default function CourseAssignmentScreen() {
    const router = useRouter();
    const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
    const {
        fetchUserCourses,
        assignCourse,
        unassignCourse,
        updateCourseAccessStatus,
        learningPaths,
        fetchLearningPaths,
        assignLearningPath,
        userCourses,
        userLearningPaths,
        updatePathAccessStatus,
        unassignLearningPath,
        certificateTemplates,
        fetchCertificateTemplates,
        issuedCertificates,
        fetchUserCertificates,
        issueCertificate
    } = useCourseStore();

    const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'paths'>('overview');
    const [isLoading, setIsLoading] = useState(true);

    // Certificate Issuance State
    const [showCertModal, setShowCertModal] = useState(false);
    const [certStep, setCertStep] = useState<'selection' | 'preview'>('selection');
    const [targetItem, setTargetItem] = useState<any>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [isIssuing, setIsIssuing] = useState(false);

    const [editData, setEditData] = useState<Record<string, string>>({});

    const loadData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchUserCourses(id!),
                fetchLearningPaths(),
                fetchCertificateTemplates(),
                fetchUserCertificates(id!)
            ]);
        } catch (error) {
            console.error('Error loading assignment data:', error);
            Alert.alert('Error', 'Failed to load assignment options');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const handleAssignPath = async (path: any) => {
        try {
            await assignLearningPath(id!, path.id);
            Alert.alert('Success', `Associated all courses from "${path.title}" to the user.`);
            loadData();
        } catch (error) {
            console.error('Error assigning path:', error);
            Alert.alert('Error', 'Failed to assign learning path');
        }
    };

    const toggleAssignment = async (course: any) => {
        try {
            if (course.is_assigned) {
                Alert.alert(
                    'Delete Access?',
                    `Warning: This will PERMANENTLY remove all progress data for "${course.title}". If reassigned later, the student will start from the beginning.`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Delete Everything',
                            style: 'destructive',
                            onPress: async () => {
                                await unassignCourse(id!, course.id);
                                loadData();
                            }
                        }
                    ]
                );
            } else {
                await assignCourse(id!, course.id);
                loadData();
            }
        } catch (error) {
            console.error('Error toggling assignment:', error);
            Alert.alert('Error', 'Failed to update assignment');
        }
    };

    const toggleCourseBlock = async (course: any) => {
        const newStatus = course.access_status === 'frozen' || course.access_status === 'blocked' ? 'active' : 'blocked';
        try {
            await updateCourseAccessStatus(id!, course.id, newStatus);
            loadData();
        } catch (error) {
            console.error('Error toggling course block:', error);
            Alert.alert('Error', 'Failed to update course access');
        }
    };

    const togglePathBlock = async (path: any) => {
        const newStatus = path.access_status === 'blocked' ? 'active' : 'blocked';
        try {
            await updatePathAccessStatus(id!, path.id, newStatus);
            loadData();
        } catch (error) {
            console.error('Error toggling path block:', error);
            Alert.alert('Error', 'Failed to update path access');
        }
    };

    const unassignPath = async (path: any) => {
        Alert.alert(
            'Unassign Path',
            `Are you sure you want to unassign the learning path "${path.title}"? This will only remove the path association, courses already assigned will remain.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unassign',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await unassignLearningPath(id!, path.id);
                            loadData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to unassign path');
                        }
                    }
                }
            ]
        );
    };

    const renderCourseItem = ({ item }: { item: any }) => (
        <View style={styles.courseCard}>
            <View style={styles.courseInfo}>
                <View style={styles.titleRow}>
                    <Text style={styles.courseTitle}>{item.title}</Text>
                    {item.is_assigned && (item.access_status === 'frozen' || item.access_status === 'blocked') && (
                        <View style={styles.frozenBadge}>
                            <Lock size={12} color="#6366f1" />
                            <Text style={styles.frozenBadgeText}>Blocked</Text>
                        </View>
                    )}
                    {item.is_assigned && item.is_completed && (
                        <View style={[styles.frozenBadge, { backgroundColor: '#dcfce7' }]}>
                            <CheckCircle size={12} color="#16a34a" />
                            <Text style={[styles.frozenBadgeText, { color: '#16a34a' }]}>Completed</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.courseDifficulty}>{item.difficulty}</Text>

                {item.is_assigned && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => router.push(`/admin/users/progress?uid=${id}&cid=${item.id}&uname=${encodeURIComponent(name || '')}&ctitle=${encodeURIComponent(item.title)}`)}
                        >
                            <Eye size={16} color="#64748b" />
                            <Text style={styles.actionBtnText}>Progress</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => toggleCourseBlock(item)}
                        >
                            {item.access_status === 'frozen' || item.access_status === 'blocked' ? (
                                <>
                                    <Unlock size={16} color="#eab308" />
                                    <Text style={styles.actionBtnText}>Unblock</Text>
                                </>
                            ) : (
                                <>
                                    <Lock size={16} color="#6366f1" />
                                    <Text style={styles.actionBtnText}>Block</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Certificates are now only for paths */}
                    </View>
                )}
            </View>

            {!item.is_assigned && (
                <TouchableOpacity
                    style={[styles.assignButton, styles.assignButtonActive]}
                    onPress={() => toggleAssignment(item)}
                >
                    <Plus size={16} color="#fff" />
                    <Text style={styles.assignButtonText}>Assign</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderPathItem = ({ item }: { item: any }) => {
        const pathCourseIds = Array.isArray(item.course_ids) ? item.course_ids : JSON.parse(item.course_ids || '[]');

        return (
            <View style={styles.courseCard}>
                <View style={styles.courseInfo}>
                    <View style={styles.titleRow}>
                        <Text style={styles.courseTitle}>{item.title}</Text>
                        {item.is_assigned && (
                            <View style={[styles.frozenBadge, { backgroundColor: item.access_status === 'blocked' ? '#fee2e2' : '#dcfce7' }]}>
                                {item.access_status === 'blocked' ? (
                                    <Lock size={12} color="#ef4444" />
                                ) : (
                                    <Check size={12} color="#16a34a" />
                                )}
                                <Text style={[styles.frozenBadgeText, { color: item.access_status === 'blocked' ? '#ef4444' : '#16a34a' }]}>
                                    {item.access_status === 'blocked' ? 'Blocked' : 'Assigned'}
                                </Text>
                            </View>
                        )}
                        {item.is_assigned && item.is_completed && (
                            <View style={[styles.frozenBadge, { backgroundColor: '#dcfce7', marginLeft: 8 }]}>
                                <Trophy size={12} color="#16a34a" />
                                <Text style={[styles.frozenBadgeText, { color: '#16a34a' }]}>Completed</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.courseDifficulty}>{pathCourseIds.length} courses</Text>

                    {item.is_assigned && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => router.push(`/admin/learning-paths/progress?uid=${id}&pid=${item.id}&uname=${encodeURIComponent(name || '')}&ptitle=${encodeURIComponent(item.title)}`)}
                            >
                                <Eye size={16} color="#64748b" />
                                <Text style={styles.actionBtnText}>Progress</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => togglePathBlock(item)}
                            >
                                {item.access_status === 'blocked' ? (
                                    <>
                                        <Unlock size={16} color="#eab308" />
                                        <Text style={styles.actionBtnText}>Unblock</Text>
                                    </>
                                ) : (
                                    <>
                                        <Lock size={16} color="#6366f1" />
                                        <Text style={styles.actionBtnText}>Block</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => handleCertClick(item)}
                            >
                                <Award size={16} color={hasCertificate(item.id) ? "#6366f1" : "#10b981"} />
                                <Text style={[styles.actionBtnText, { color: hasCertificate(item.id) ? "#6366f1" : "#10b981" }]}>
                                    {hasCertificate(item.id) ? 'View Cert' : 'Cert'}
                                </Text>
                            </TouchableOpacity>

                        </View>
                    )}
                </View>

                {!item.is_assigned && (
                    <TouchableOpacity
                        style={[styles.assignButton, { backgroundColor: '#10b981' }]}
                        onPress={() => handleAssignPath(item)}
                    >
                        <Plus size={16} color="#fff" />
                        <Text style={styles.assignButtonText}>Assign Path</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const hasCertificate = (itemId: string) => {
        return issuedCertificates.some(c => c.path_id === itemId);
    };

    const handleCertClick = (item: any) => {
        const existingCert = issuedCertificates.find(c => c.path_id === item.id);
        if (existingCert) {
            router.push(`/certificates/view?id=${existingCert.id}` as any);
        } else {
            const isCompleted = !!item.is_completed;
            if (!isCompleted) {
                Alert.alert('Not Completed', `Please wait until the user completes this learning path before issuing a certificate.`);
                return;
            }
            setTargetItem(item);
            setCertStep('selection');
            setSelectedTemplateId(null);
            setEditData({}); // Will be populated when template is selected
            setShowCertModal(true);
        }
    };

    const handleSelectTemplate = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = certificateTemplates.find(t => t.id === templateId);
        if (template && template.placeholders) {
            const initialData: Record<string, string> = {};
            template.placeholders.forEach((p: any) => {
                const key = p.id || p.type;
                if (p.type === 'student_name') initialData[key] = name || '';
                else if (p.type === 'course_title') initialData[key] = targetItem?.title || '';
                else if (p.type === 'date') initialData[key] = new Date().toLocaleDateString();
                else initialData[key] = p.label || '';
            });
            setEditData(initialData);
        }
    };


    const handleIssueCert = async () => {
        if (!selectedTemplateId || !targetItem) return;

        setIsIssuing(true);
        try {
            const template = certificateTemplates.find(t => t.id === selectedTemplateId);
            if (!template) throw new Error('Template not found');

            // The editData object already contains all necessary placeholder values

            await issueCertificate({
                user_id: id,
                template_id: selectedTemplateId,
                path_id: targetItem.id,
                course_id: null,
                placeholder_data: editData
            });

            Alert.alert('Success', 'Certificate issued successfully!');
            setShowCertModal(false);
            fetchUserCertificates(id!);
        } catch (error) {
            console.error('Error issuing certificate:', error);
            Alert.alert('Error', 'Failed to issue certificate');
        } finally {
            setIsIssuing(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner message="Loading..." />;
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>User Entitlements</Text>
                        {name ? <Text style={styles.subtitle}>{toTitleCase(name)}</Text> : null}
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
                        onPress={() => setActiveTab('overview')}
                    >
                        <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'courses' && styles.activeTab]}
                        onPress={() => setActiveTab('courses')}
                    >
                        <Text style={[styles.tabText, activeTab === 'courses' && styles.activeTabText]}>Individual Courses</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'paths' && styles.activeTab]}
                        onPress={() => setActiveTab('paths')}
                    >
                        <Text style={[styles.tabText, activeTab === 'paths' && styles.activeTabText]}>Learning Paths</Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'overview' ? (
                    <StudentAnalytics userId={id as string} />
                ) : (
                    <>
                        <View style={styles.warningBox}>
                            <ShieldAlert size={20} color="#f59e0b" />
                            <Text style={styles.warningText}>
                                {activeTab === 'courses'
                                    ? "Regular users can only access courses that are explicitly assigned to them."
                                    : "Assigning a path will automatically grant access to all courses contained within that path."}
                            </Text>
                        </View>

                        <FlatList
                            data={activeTab === 'courses' ? userCourses : userLearningPaths}
                            keyExtractor={(item) => item.id}
                            renderItem={activeTab === 'courses' ? renderCourseItem : renderPathItem}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Book size={48} color="#cbd5e1" />
                                    <Text style={styles.emptyText}>No {activeTab} available</Text>
                                </View>
                            }
                        />
                    </>
                )}
            </SafeAreaView>

            {/* Certificate Issuance Modal */}
            <Modal
                visible={showCertModal}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowCertModal(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowCertModal(false)}>
                            <X size={24} color="#1e293b" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            {certStep === 'selection' ? 'Select Template' : 'Certificate Preview'}
                        </Text>
                        <TouchableOpacity
                            style={[styles.saveButton, (certStep === 'selection' && !selectedTemplateId) && styles.saveButtonDisabled]}
                            onPress={() => certStep === 'selection' ? setCertStep('preview') : handleIssueCert()}
                            disabled={isIssuing || (certStep === 'selection' && !selectedTemplateId)}
                        >
                            {isIssuing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    {certStep === 'selection' ? 'Next' : 'Issue'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {certStep === 'selection' ? (
                            <View>
                                <Text style={styles.modalLabel}>Choose a design for the certificate</Text>
                                {certificateTemplates.map(template => (
                                    <TouchableOpacity
                                        key={template.id}
                                        style={[
                                            styles.templateItem,
                                            selectedTemplateId === template.id && styles.templateItemActive
                                        ]}
                                        onPress={() => handleSelectTemplate(template.id)}
                                    >
                                        <Award size={24} color={selectedTemplateId === template.id ? "#6366f1" : "#94a3b8"} />
                                        <Text style={[
                                            styles.templateItemText,
                                            selectedTemplateId === template.id && styles.templateItemTextActive
                                        ]}>
                                            {template.name}
                                        </Text>
                                        {selectedTemplateId === template.id && <CheckCircle size={20} color="#6366f1" />}
                                    </TouchableOpacity>
                                ))}
                                {certificateTemplates.length === 0 && (
                                    <View style={styles.emptyState}>
                                        <Award size={48} color="#cbd5e1" />
                                        <Text style={styles.emptyText}>No templates found. Create one in Admin to Templates</Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View>
                                <Text style={styles.modalLabel}>Review accuracy before issuing</Text>
                                {selectedTemplateId && (
                                    <CertificatePreview
                                        backgroundMediaId={certificateTemplates.find(t => t.id === selectedTemplateId)?.background_media_id ?? ''}
                                        placeholders={certificateTemplates.find(t => t.id === selectedTemplateId)?.placeholders || []}
                                        data={editData}
                                    />
                                )}
                                <View style={styles.previewInfo}>
                                    <View style={styles.editHeaderRow}>
                                        <Text style={styles.previewInfoTitle}>Recipient Details</Text>
                                    </View>
                                    
                                    {certificateTemplates.find(t => t.id === selectedTemplateId)?.placeholders?.map((p: any, idx: number) => (
                                        <View key={p.id || idx} style={styles.editField}>
                                            <Text style={styles.editLabel}>{p.label || p.type}</Text>
                                            <RNTextInput
                                                style={styles.editInput}
                                                value={editData[p.id || p.type] || ''}
                                                onChangeText={(v) => setEditData(prev => ({ ...prev, [p.id || p.type]: v }))}
                                            />
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </View>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: {
        marginRight: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    activeTab: {
        backgroundColor: '#6366f1',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    activeTabText: {
        color: '#fff',
    },
    listContent: {
        padding: 16,
    },
    courseCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    courseInfo: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    courseTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginRight: 8,
        marginBottom: 4,
    },
    courseDifficulty: {
        fontSize: 12,
        color: '#94a3b8',
        textTransform: 'capitalize',
        marginBottom: 8,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 4,
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    assignButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366f1',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    assignButtonActive: {
        backgroundColor: '#6366f1',
    },
    assignButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    frozenBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 4,
        marginBottom: 4,
    },
    frozenBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
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
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    modalLabel: {
        fontSize: 15,
        color: '#64748b',
        marginBottom: 20,
        textAlign: 'center',
    },
    saveButton: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#cbd5e1',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    templateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 12,
    },
    templateItemActive: {
        borderColor: '#6366f1',
        backgroundColor: '#eef2ff',
    },
    templateItemText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#475569',
    },
    templateItemTextActive: {
        color: '#6366f1',
    },
    previewInfo: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    previewInfoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    previewInfoText: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 4,
    },
    editHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    pdfButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10b981',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    pdfButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    editField: {
        marginBottom: 12,
    },
    editLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 4,
    },
    editInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 8,
        fontSize: 14,
        color: '#1e293b',
    }
});
