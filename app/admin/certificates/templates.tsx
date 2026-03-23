import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    Image,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, CloudUpload, Award, X, Settings2, Trash, MousePointer2, CheckCircle2 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useCourseStore } from '../../../src/store/courseStore';
import { LoadingSpinner } from '../../../src/components/LoadingSpinner';
import { uploadFile } from '../../../src/services/storage';
import { getMediaUrl } from '../../../src/services/api';

const PLACEHOLDER_TYPES = [
    { label: 'Student Name', value: 'student_name' },
    { label: 'Course Title', value: 'course_title' },
    { label: 'Completion Date', value: 'date' },
    { label: 'Other', value: 'other' },
];

export default function CertificateTemplatesScreen() {
    const router = useRouter();
    const { 
        certificateTemplates, 
        fetchCertificateTemplates, 
        createCertificateTemplate, 
        deleteCertificateTemplate,
        isLoading: storeLoading 
    } = useCourseStore();

    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [imageFile, setImageFile] = useState<any>(null);
    const [placeholders, setPlaceholders] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [selectedPlaceholderIndex, setSelectedPlaceholderIndex] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            await fetchCertificateTemplates();
        } catch (error) {
            console.error('Error loading templates:', error);
            Alert.alert('Error', 'Failed to load certificate templates');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePickImage = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'image/*',
            });

            if (!result.canceled) {
                setImageFile(result.assets[0]);
            }
        } catch (err) {
            console.error('Error picking image:', err);
        }
    };

    const handleAddPlaceholder = () => {
        const newIndex = placeholders.length;
        const newId = `p_${Math.random().toString(36).substr(2, 9)}`;
        setPlaceholders([
            ...placeholders,
            { id: newId, type: 'student_name', x: 50, y: 50, fontSize: 24, label: 'Student Name' }
        ]);
        setSelectedPlaceholderIndex(newIndex);
    };

    const updatePlaceholder = (index: number, updates: any) => {
        const newPlaceholders = [...placeholders];
        newPlaceholders[index] = { ...newPlaceholders[index], ...updates };
        setPlaceholders(newPlaceholders);
    };

    const removePlaceholder = (index: number) => {
        setPlaceholders(placeholders.filter((_, i) => i !== index));
        if (selectedPlaceholderIndex === index) {
            setSelectedPlaceholderIndex(null);
        } else if (selectedPlaceholderIndex !== null && selectedPlaceholderIndex > index) {
            setSelectedPlaceholderIndex(selectedPlaceholderIndex - 1);
        }
    };

    const previewLayoutRef = React.useRef<{width: number, height: number} | null>(null);

    const handleSave = async () => {
        if (!name || (!imageFile && !editingTemplate)) {
            Alert.alert('Error', 'Please provide a name and background image');
            return;
        }

        setIsSaving(true);
        try {
            let backgroundMediaId = editingTemplate?.background_media_id;
            
            if (imageFile) {
                backgroundMediaId = await uploadFile(imageFile.uri, imageFile.name, imageFile.file);
            }
            
            const templateData = {
                name,
                background_media_id: backgroundMediaId,
                placeholders: placeholders
            };

            if (editingTemplate) {
                await useCourseStore.getState().updateCertificateTemplate(editingTemplate.id, templateData);
                Alert.alert('Success', 'Certificate template updated');
            } else {
                await createCertificateTemplate(templateData);
                Alert.alert('Success', 'Certificate template created');
            }

            setShowModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error saving template:', error);
            Alert.alert('Error', 'Failed to save template');
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setName('');
        setImageFile(null);
        setPlaceholders([]);
        setEditingTemplate(null);
        setSelectedPlaceholderIndex(null);
    };

    const handleEdit = (template: any) => {
        setEditingTemplate(template);
        setName(template.name);
        setPlaceholders(template.placeholders || []);
        setImageFile(null); // Reset image file, will use background_media_id if not changed
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Template',
            'Are you sure you want to delete this template?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCertificateTemplate(id);
                            Alert.alert('Success', 'Template deleted');
                        } catch (error: any) {
                            console.error('Error deleting template:', error);
                            const message = error.response?.data?.detail || 'Failed to delete template';
                            Alert.alert('Error', message);
                        }
                    }
                }
            ]
        );
    };

    const renderTemplateItem = ({ item }: { item: any }) => (
        <View style={styles.templateCard}>
            <View style={styles.templateHeader}>
                <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{item.name}</Text>
                    <Text style={styles.templateMeta}>
                        {item.placeholders?.length || 0} placeholders · Created {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <View style={styles.templateActions}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionIcon}>
                        <Settings2 size={20} color="#6366f1" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionIcon}>
                        <Trash2 size={20} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
            
            {item.background_media_id && (
                <View style={styles.previewContainer}>
                    <Image 
                        source={{ uri: getMediaUrl(item.background_media_id) }} 
                        style={styles.previewImage}
                        resizeMode="contain"
                    />
                    <View style={styles.previewOverlay}>
                        <Text style={styles.previewText}>Template Preview</Text>
                    </View>
                </View>
            )}
        </View>
    );

    if (isLoading && !showModal) {
        return <LoadingSpinner message="Loading templates..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Certificate Templates</Text>
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => setShowModal(true)}
                >
                    <Plus size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={certificateTemplates}
                keyExtractor={(item) => item.id}
                renderItem={renderTemplateItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Award size={64} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No templates created yet</Text>
                        <TouchableOpacity 
                            style={styles.emptyButton}
                            onPress={() => setShowModal(true)}
                        >
                            <Text style={styles.emptyButtonText}>Create First Template</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Create Template Modal */}
            <Modal
                visible={showModal}
                animationType="slide"
                transparent={false}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowModal(false)}>
                            <X size={24} color="#1e293b" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            {editingTemplate ? 'Edit Template' : 'New Template'}
                        </Text>
                        <TouchableOpacity 
                            style={[styles.saveButton, (isSaving || !name || !imageFile) && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={isSaving || !name || (!imageFile && !editingTemplate)}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <View style={styles.formSection}>
                            <Text style={styles.label}>Template Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g., Professional Course Certificate"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>

                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.label}>Visual Designer</Text>
                                {selectedPlaceholderIndex !== null && (
                                    <View style={styles.activeBadge}>
                                        <MousePointer2 size={12} color="#6366f1" />
                                        <Text style={styles.activeBadgeText}>
                                            Positioning: {placeholders[selectedPlaceholderIndex]?.label || 'Item'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            
                            {(imageFile || editingTemplate) ? (
                                <View style={styles.visualEditorContainer}>
                                    <TouchableOpacity 
                                        activeOpacity={1}
                                        style={styles.visualEditorPreview}
                                        onPress={(e) => {
                                            if (selectedPlaceholderIndex === null) return;
                                            // Get coordinates relative to the preview box
                                            // Note: In a real production app, we'd use a more robust measurement
                                            // but for this implementation, we'll use a standard approach
                                            const { locationX, locationY } = e.nativeEvent;
                                            // We need to know the layout dimensions. 
                                            // Since we use aspectRatio, we can calculate or use a ref.
                                        }}
                                        onLayout={(e) => {
                                            // Store dimensions for coordinate calc
                                            const { width, height } = e.nativeEvent.layout;
                                            previewLayoutRef.current = { width, height };
                                        }}
                                        onPressIn={(e) => {
                                            if (selectedPlaceholderIndex === null) return;
                                            const { locationX, locationY } = e.nativeEvent;
                                            const layout = previewLayoutRef.current;
                                            if (layout) {
                                                const xPct = Math.round((locationX / layout.width) * 100);
                                                const yPct = Math.round((locationY / layout.height) * 100);
                                                updatePlaceholder(selectedPlaceholderIndex, { 
                                                    x: Math.max(0, Math.min(100, xPct)), 
                                                    y: Math.max(0, Math.min(100, yPct)) 
                                                });
                                            }
                                        }}
                                    >
                                        <Image 
                                            source={{ uri: imageFile ? imageFile.uri : getMediaUrl(editingTemplate.background_media_id) }} 
                                            style={styles.visualEditorImage}
                                            resizeMode="contain"
                                        />
                                        <View style={StyleSheet.absoluteFill} pointerEvents="none">
                                            {placeholders.map((p, idx) => (
                                                <View 
                                                    key={idx}
                                                    style={[
                                                        styles.visualPlaceholder,
                                                        { 
                                                            left: `${p.x}%`, 
                                                            top: `${p.y}%`,
                                                            borderColor: selectedPlaceholderIndex === idx ? '#6366f1' : '#94a3b8',
                                                            backgroundColor: selectedPlaceholderIndex === idx ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.5)',
                                                            zIndex: selectedPlaceholderIndex === idx ? 10 : 1
                                                        }
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.visualPlaceholderText,
                                                        { color: selectedPlaceholderIndex === idx ? '#6366f1' : '#64748b' }
                                                    ]}>
                                                        {p.label}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </TouchableOpacity>
                                    <Text style={styles.helperText}>
                                        {selectedPlaceholderIndex !== null 
                                            ? "Tap anywhere on the image to position the selected placeholder."
                                            : "Select a placeholder below to adjust its position visually."}
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.noImagePlaceholder}>
                                    <CloudUpload size={48} color="#cbd5e1" />
                                    <Text style={styles.noImageText}>Upload a background to use the Visual Designer</Text>
                                </View>
                            )}

                            <TouchableOpacity 
                                style={styles.uploadBoxSmall}
                                onPress={handlePickImage}
                            >
                                <CloudUpload size={20} color="#6366f1" />
                                <Text style={styles.uploadTextSmall}>
                                    {imageFile || editingTemplate ? 'Change Background' : 'Upload Background'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.label}>Placeholders</Text>
                                <TouchableOpacity 
                                    style={styles.addPlaceholderBtn}
                                    onPress={handleAddPlaceholder}
                                >
                                    <Plus size={16} color="#6366f1" />
                                    <Text style={styles.addPlaceholderText}>Add</Text>
                                </TouchableOpacity>
                            </View>

                            {placeholders.length === 0 ? (
                                <Text style={styles.placeholderEmpty}>No placeholders added. These are mapped values like Student Name.</Text>
                            ) : (
                                placeholders.map((p, index) => (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={[
                                            styles.placeholderItem,
                                            selectedPlaceholderIndex === index && styles.placeholderItemActive
                                        ]}
                                        onPress={() => setSelectedPlaceholderIndex(index)}
                                    >
                                        <View style={styles.placeholderHeader}>
                                            <View style={styles.placeholderTitleRow}>
                                                <Settings2 size={16} color={selectedPlaceholderIndex === index ? "#6366f1" : "#64748b"} />
                                                <Text style={[
                                                    styles.placeholderItemTitle,
                                                    selectedPlaceholderIndex === index && styles.placeholderItemTitleActive
                                                ]}>
                                                    {p.label}
                                                </Text>
                                            </View>
                                            <View style={styles.placeholderActions}>
                                                {selectedPlaceholderIndex === index && (
                                                    <View style={styles.selectedIndicator}>
                                                        <CheckCircle2 size={14} color="#6366f1" />
                                                        <Text style={styles.selectedIndicatorText}>Active</Text>
                                                    </View>
                                                )}
                                                <TouchableOpacity onPress={() => removePlaceholder(index)} style={styles.removeBtn}>
                                                    <Trash size={16} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.placeholderRow}>
                                            <View style={styles.pickerWrapper}>
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                                                    {PLACEHOLDER_TYPES.map(type => (
                                                        <TouchableOpacity 
                                                            key={type.value}
                                                            style={[styles.typeOption, p.type === type.value && styles.typeOptionActive]}
                                                            onPress={() => updatePlaceholder(index, { type: type.value, label: type.label })}
                                                        >
                                                            <Text style={[styles.typeOptionText, p.type === type.value && styles.typeOptionTextActive]}>
                                                                {type.label}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        </View>

                                        {p.type === 'other' && (
                                            <View style={styles.labelEditRow}>
                                                <Text style={styles.coordLabel}>Field Label</Text>
                                                <TextInput
                                                    style={styles.labelInput}
                                                    value={p.label}
                                                    onChangeText={(v) => updatePlaceholder(index, { label: v })}
                                                    placeholder="e.g., Registration Number"
                                                    placeholderTextColor="#94a3b8"
                                                />
                                            </View>
                                        )}
                                        
                                        <View style={styles.coordGrid}>
                                            <View style={styles.coordCol}>
                                                <Text style={styles.coordLabel}>X Pos %</Text>
                                                <TextInput
                                                    style={styles.coordInput}
                                                    value={String(p.x)}
                                                    onChangeText={(v) => updatePlaceholder(index, { x: parseInt(v) || 0 })}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                            <View style={styles.coordCol}>
                                                <Text style={styles.coordLabel}>Y Pos %</Text>
                                                <TextInput
                                                    style={styles.coordInput}
                                                    value={String(p.y)}
                                                    onChangeText={(v) => updatePlaceholder(index, { y: parseInt(v) || 0 })}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                            <View style={styles.coordCol}>
                                                <Text style={styles.coordLabel}>Size</Text>
                                                <TextInput
                                                    style={styles.coordInput}
                                                    value={String(p.fontSize)}
                                                    onChangeText={(v) => updatePlaceholder(index, { fontSize: parseInt(v) || 0 })}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                        
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </SafeAreaView>
            </Modal>
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    addButton: {
        backgroundColor: '#6366f1',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: 16,
    },
    templateCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    templateActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionIcon: {
        padding: 4,
    },
    templateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    templateInfo: {
        flex: 1,
    },
    templateName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    templateMeta: {
        fontSize: 12,
        color: '#64748b',
    },
    previewContainer: {
        height: 150,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    previewOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 4,
        alignItems: 'center',
    },
    previewText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
    },
    emptyButton: {
        marginTop: 20,
        backgroundColor: '#6366f1',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: '600',
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
    modalContent: {
        flex: 1,
        padding: 20,
    },
    formSection: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#1e293b',
    },
    uploadBox: {
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    uploadText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#6366f1',
    },
    uploadSubtext: {
        marginTop: 4,
        fontSize: 12,
        color: '#94a3b8',
    },
    imageSelected: {
        alignItems: 'center',
        width: '100%',
    },
    imagePreview: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        marginBottom: 12,
    },
    imageName: {
        fontSize: 12,
        color: '#475569',
        marginBottom: 4,
    },
    changeText: {
        fontSize: 12,
        color: '#6366f1',
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addPlaceholderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 4,
    },
    addPlaceholderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6366f1',
    },
    placeholderEmpty: {
        fontSize: 13,
        color: '#94a3b8',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 12,
    },
    placeholderItem: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    placeholderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    placeholderRow: {
        flex: 1,
        marginHorizontal: 8,
    },
    pickerWrapper: {
        flexDirection: 'row',
    },
    typeOption: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
        marginRight: 8,
    },
    typeOptionActive: {
        backgroundColor: '#6366f1',
    },
    typeOptionText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#475569',
    },
    typeOptionTextActive: {
        color: '#fff',
    },
    coordGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    coordCol: {
        flex: 1,
    },
    coordLabel: {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 4,
    },
    coordInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 6,
        fontSize: 12,
        textAlign: 'center',
    },
    visualEditorContainer: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 8,
        marginBottom: 12,
    },
    visualEditorPreview: {
        width: '100%',
        aspectRatio: 1.414,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
        position: 'relative',
    },
    visualEditorImage: {
        width: '100%',
        height: '100%',
    },
    visualPlaceholder: {
        position: 'absolute',
        borderWidth: 1.5,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        transform: [{ translateX: -30 }, { translateY: -10 }], // Approximate center
    },
    visualPlaceholderText: {
        fontSize: 8,
        fontWeight: 'bold',
    },
    helperText: {
        fontSize: 11,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
    noImagePlaceholder: {
        height: 150,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    noImageText: {
        marginTop: 8,
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
    uploadBoxSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        backgroundColor: '#eef2ff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#c7d2fe',
    },
    uploadTextSmall: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6366f1',
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eef2ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    activeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6366f1',
    },
    placeholderItemActive: {
        borderColor: '#6366f1',
        backgroundColor: '#f5f7ff',
        borderWidth: 1.5,
    },
    placeholderTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    placeholderItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    placeholderItemTitleActive: {
        color: '#6366f1',
    },
    placeholderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    selectedIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    selectedIndicatorText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6366f1',
    },
    removeBtn: {
        padding: 4,
    },
    labelEditRow: {
        marginTop: 8,
        paddingHorizontal: 8,
    },
    labelInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 8,
        fontSize: 13,
        color: '#1e293b',
    }
});
