import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Download, Share2, Award, Calendar, User, BookOpen } from 'lucide-react-native';
import { useCourseStore } from '../../src/store/courseStore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getMediaUrl } from '../../src/services/api';
import { Image, Platform } from 'react-native';

export default function CertificateViewScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { fetchCertificateById } = useCourseStore();
    const [certificate, setCertificate] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadCertificate();
        }
    }, [id]);

    const loadCertificate = async () => {
        setIsLoading(true);
        try {
            const data = await fetchCertificateById(id!);
            setCertificate(data);
        } catch (error) {
            console.error('Error loading certificate:', error);
            Alert.alert('Error', 'Failed to load certificate details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadImage = async () => {
        if (!certificate || !certificate.image_media_id) return;
        
        const imageUrl = getMediaUrl(certificate.image_media_id);
        
        if (Platform.OS === 'web') {
            try {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `certificate_${id}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Web download error:', error);
                // Fallback: just open in new tab
                window.open(imageUrl, '_blank');
            }
            return;
        }

        try {
            // For mobile, we use the legacy API as suggested by the error message if possible,
            // or just use the current one with a silencer if it still works but warns.
            // The user's error says "import the legacy API from 'expo-file-system/legacy'".
            
            let legacyFS: any;
            try {
                legacyFS = require('expo-file-system/legacy');
            } catch {
                legacyFS = FileSystem;
            }

            const fileUri = (legacyFS.documentDirectory || (FileSystem as any).documentDirectory) + `certificate_${id}.png`;
            const downloadResult = await legacyFS.downloadAsync(
                imageUrl,
                fileUri
            );
            
            if (downloadResult.status === 200) {
                await Sharing.shareAsync(downloadResult.uri);
            } else {
                Alert.alert('Error', 'Failed to download certificate image');
            }
        } catch (error) {
            console.error('Error downloading image:', error);
            Alert.alert('Error', 'An error occurred while downloading the certificate');
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Fetching your certificate...</Text>
            </View>
        );
    }

    if (!certificate) {
        return (
            <View style={styles.errorContainer}>
                <Award size={64} color="#cbd5e1" />
                <Text style={styles.errorText}>Certificate not found</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <ArrowLeft size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Certificate of Completion</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Share2 size={22} color="#1e293b" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Certificate Display */}
                <View style={styles.certificateWrapper}>
                    {certificate.image_media_id ? (
                        <Image 
                            source={{ uri: getMediaUrl(certificate.image_media_id) }}
                            style={styles.certificateImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <Text style={styles.infoText}>Image generation pending...</Text>
                    )}
                </View>

                {/* Details Card */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <User size={20} color="#6366f1" />
                        <View style={styles.detailTextContainer}>
                            <Text style={styles.detailLabel}>Recipient</Text>
                            <Text style={styles.detailValue}>{certificate.placeholder_data.student_name}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <BookOpen size={20} color="#6366f1" />
                        <View style={styles.detailTextContainer}>
                            <Text style={styles.detailLabel}>Course/Path</Text>
                            <Text style={styles.detailValue}>{certificate.placeholder_data.course_title}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Calendar size={20} color="#6366f1" />
                        <View style={styles.detailTextContainer}>
                            <Text style={styles.detailLabel}>Issued On</Text>
                            <Text style={styles.detailValue}>
                                {new Date(certificate.issued_at).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadImage}>
                    <Download size={20} color="#fff" />
                    <Text style={styles.downloadButtonText}>Download Image</Text>
                </TouchableOpacity>

                <Text style={styles.infoText}>
                    This is a verified digital certificate. You can share the URL or certificate ID with employers or on social media.
                </Text>
                <Text style={styles.certId}>ID: {certificate.id}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#475569',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    headerRight: {
        flexDirection: 'row',
    },
    iconButton: {
        padding: 4,
    },
    scrollContent: {
        padding: 16,
        alignItems: 'center',
    },
    certificateWrapper: {
        width: '100%',
        aspectRatio: 1.414,
        marginVertical: 20,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    certificateImage: {
        width: '100%',
        height: '100%',
    },
    detailsCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 16,
    },
    detailTextContainer: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '700',
        marginTop: 2,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366f1',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 10,
        marginBottom: 20,
    },
    downloadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoText: {
        fontSize: 13,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    certId: {
        fontSize: 11,
        color: '#cbd5e1',
        fontFamily: 'monospace',
    },
    backButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#6366f1',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});
