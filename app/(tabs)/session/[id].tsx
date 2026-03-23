import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Platform,
    Image,
    Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AlertCircle,
    ArrowLeft,
    Clock,
    FileSearch,
    ChevronLeft,
    CheckCircle,
    ChevronRight
} from 'lucide-react-native';
import { useCourseStore } from '../../../src/store/courseStore';
import api, { getMediaUrl } from '../../../src/services/api';
import { LoadingSpinner } from '../../../src/components/LoadingSpinner';

export default function SessionReaderScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { quizzes, fetchQuizzes } = useCourseStore();
    const [session, setSession] = useState<any>(null);
    const [allSessions, setAllSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isContentReady, setIsContentReady] = useState(false);
    const [lastPosition, setLastPosition] = useState(0);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [hasAttemptedResume, setHasAttemptedResume] = useState(false);
    const [maxTimeReached, setMaxTimeReached] = useState(0);
    const [timeSpentElapsed, setTimeSpentElapsed] = useState(0);
    const maxTimeRef = React.useRef(0);

    // Keep ref in sync
    useEffect(() => {
        maxTimeRef.current = maxTimeReached;
    }, [maxTimeReached]);

    // Resolve media URI
    const contentUri = session?.media_id
        ? getMediaUrl(session.media_id)
        : session?.content_url;

    const imageUri = session?.media_id
        ? getMediaUrl(session.media_id)
        : (session?.image_url || session?.content_url);

    // Video Player Setup
    const player = useVideoPlayer(contentUri, (player) => {
        player.loop = false;
        // player.play(); // Optional: Auto-play
    });

    useEffect(() => {
        const readyListener = player.addListener('statusChange', (payload) => {
            if (payload.status === 'readyToPlay') {
                setIsContentReady(true);
            }
        });

        const timeListener = player.addListener('timeUpdate', (event) => {
            const current = event.currentTime;
            const max = maxTimeRef.current;
            
            // Only restrict if session not completed and we have already handled resume/start-over
            if (!isCompleted && hasAttemptedResume) {
                if (current > max + 2) {
                    // Forward jump jump detected beyond watched area
                    player.currentTime = max;
                } else if (current > max) {
                    // Normal playback or small forward jump - update highest watched point
                    setMaxTimeReached(current);
                }
                // Backward seeking (current <= max) is implicitly allowed
            }
        });

        return () => {
            readyListener.remove();
            timeListener.remove();
        };
    }, [player, isCompleted, hasAttemptedResume]); // maxTimeReached removed from dependencies

    useEffect(() => {
        const loadSession = async () => {
            try {
                // Fetch session details
                const response = await api.get(`/sessions/${id}`);
                const sessionData = response.data;
                setSession(sessionData);

                // Fetch all sessions in the module
                const moduleSessions = await api.get(
                    `/courses/${sessionData.course_id}/modules/${sessionData.module_id}/sessions`
                );
                setAllSessions(moduleSessions.data);

                // Check if already completed
                const progressRes = await api.get(`/sessions/${id}/progress`);
                if (progressRes.data?.completed) {
                    setIsCompleted(true);
                    setTimeRemaining(0);
                } else {
                    // Set timer to the full session duration
                    setTimeRemaining(sessionData.duration_minutes * 60); // Convert to seconds
                    
                    if (progressRes.data?.last_position_seconds > 0 || progressRes.data?.time_taken_seconds > 0 || progressRes.data?.highest_position_seconds > 0) {
                        setLastPosition(progressRes.data.last_position_seconds || 0);
                        setMaxTimeReached(progressRes.data.highest_position_seconds || 0);
                        setTimeSpentElapsed(progressRes.data.time_taken_seconds || 0);
                        setShowResumeModal(true);
                    } else {
                        // No progress to resume, allow seeking up to current (0)
                        setHasAttemptedResume(true);
                    }
                }

                // Redirect if it's a quiz session created directly? (Legacy support)
                if (sessionData.content_type === 'quiz' && sessionData.quiz_id) {
                    router.replace(`/quiz/${sessionData.quiz_id}`);
                    return;
                }

                await fetchQuizzes(sessionData.course_id);

                // For articles, plain text, and web-based PDF (object tag doesn't have reliable onload)
                if (sessionData.content_type === 'article' || !sessionData.content_type || (sessionData.content_type === 'pdf' && Platform.OS === 'web')) {
                    setIsContentReady(true);
                }
            } catch (error) {
                console.error('Error loading session:', error);
                Alert.alert('Error', 'Failed to load session');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            loadSession();
        }
    }, [id]);

    // Track actual time spent
    useEffect(() => {
        if (!isCompleted && isContentReady && !showResumeModal) {
            const timer = setInterval(() => {
                setTimeSpentElapsed((prev) => prev + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isCompleted, isContentReady, showResumeModal]);

    // Timer countdown logic synced with video if applicable
    useEffect(() => {
        if (timeRemaining > 0 && !isCompleted && isContentReady && !showResumeModal) {
            const timer = setInterval(() => {
                if (session?.content_type === 'video' && player) {
                    // Respect remaining time of video
                    const remaining = Math.max(0, player.duration - player.currentTime);
                    setTimeRemaining(Math.floor(remaining));
                } else {
                    setTimeRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
                }
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [timeRemaining, isCompleted, isContentReady, showResumeModal, session, player]);

    const handleCompleteSession = async (forceComplete = true) => {
        if (forceComplete && timeRemaining > 0 && !isCompleted) {
            return; // Button should be disabled
        }

        try {
            await api.post(`/sessions/${id}/complete`, { 
                time_taken_seconds: timeSpentElapsed,
                last_position_seconds: session?.content_type === 'video' ? Math.floor(player.currentTime) : 0,
                highest_position_seconds: session?.content_type === 'video' ? Math.floor(maxTimeReached) : 0,
                completed: forceComplete 
            });
            
            if (forceComplete) {
                setIsCompleted(true);
                setTimeRemaining(0);

                // Refresh progress in store
                const { fetchDashboard, fetchCourseProgress, fetchSessions } = useCourseStore.getState();
                await fetchDashboard();
                await fetchCourseProgress(session.course_id);
                await fetchSessions(session.course_id, session.module_id);

                Alert.alert('Success', 'Session completed!');
            }
        } catch (error) {
            console.error('Error updating session progress:', error);
            if (forceComplete) Alert.alert('Error', 'Failed to complete session');
        }
    };

    // Auto-save progress every 15 seconds
    useEffect(() => {
        if (!isCompleted && isContentReady && !showResumeModal) {
            const interval = setInterval(() => {
                handleCompleteSession(false);
            }, 15000);
            return () => clearInterval(interval);
        }
    }, [isCompleted, isContentReady, showResumeModal, timeSpentElapsed]);

    const handleResume = () => {
        if (session?.content_type === 'video' && lastPosition > 0) {
            player.currentTime = lastPosition;
            setMaxTimeReached(lastPosition);
        }
        setShowResumeModal(false);
        setHasAttemptedResume(true);
    };

    const handleStartOver = () => {
        setTimeSpentElapsed(0);
        setLastPosition(0);
        if (session?.content_type === 'video') {
            player.currentTime = 0;
            // Note: maxTimeReached is KEPT to allow forward seeking up to previously watched point
        }
        setShowResumeModal(false);
        setHasAttemptedResume(true);
    };

    const getCurrentSessionIndex = () => {
        return allSessions.findIndex((s) => s.id === id);
    };

    const handlePrevious = () => {
        const currentIndex = getCurrentSessionIndex();
        if (currentIndex > 0) {
            const prevSession = allSessions[currentIndex - 1];
            router.replace(`/session/${prevSession.id}`);
        }
    };

    const handleNext = () => {
        const currentIndex = getCurrentSessionIndex();
        if (currentIndex < allSessions.length - 1) {
            const nextSession = allSessions[currentIndex + 1];
            router.replace(`/session/${nextSession.id}`);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return <LoadingSpinner fullScreen message="Loading session..." />;
    }

    if (!session) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorState}>
                    <AlertCircle size={48} color="#ef4444" />
                    <Text style={styles.errorText}>Session not found</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const currentIndex = getCurrentSessionIndex();
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < allSessions.length - 1;
    const canComplete = timeRemaining === 0 || isCompleted;

    const sessionQuiz = quizzes.find((q) => q.session_id === id);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {session.name}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Resume Modal */}
            <Modal
                transparent={true}
                visible={showResumeModal}
                animationType="fade"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Resume Session?</Text>
                        <Text style={styles.modalText}>
                            You have previous progress. Would you like to resume from where you left off?
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.secondaryButton]} 
                                onPress={handleStartOver}
                            >
                                <Text style={styles.secondaryButtonText}>Start Over</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.primaryButton]} 
                                onPress={handleResume}
                            >
                                <Text style={styles.primaryButtonText}>Resume</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>


            {/* Content Area */}
            {session.content_type === 'video' || session.content_type === 'audio' ? (
                <View style={styles.videoContainer}>
                    <View style={styles.pdfHeader}>
                        <Text style={styles.sessionTitle}>{session.name}</Text>
                        <View style={styles.meta}>
                            <Clock size={16} color="#64748b" />
                            <Text style={styles.metaText}>
                                {session.duration_minutes} min {session.content_type === 'video' ? 'watch' : 'listen'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.videoWrapper}>
                        <VideoView
                            style={styles.video}
                            player={player}
                            allowsFullscreen
                            allowsPictureInPicture
                        />
                    </View>
                </View>
            ) : session.content_type === 'pdf' || (session.content_type === 'article' && session.content_url?.endsWith('.pdf')) ? (
                <View style={styles.pdfContainer}>
                    <View style={styles.pdfHeader}>
                        <Text style={styles.sessionTitle}>{session.name}</Text>
                        <View style={styles.meta}>
                            <Clock size={16} color="#64748b" />
                            <Text style={styles.metaText}>
                                {session.duration_minutes} min read
                            </Text>
                            <Text style={styles.metaDivider}>•</Text>
                            <FileSearch size={16} color="#64748b" />
                            <Text style={styles.metaText}>PDF Document</Text>
                        </View>
                    </View>
                    {Platform.OS === 'web' ? (
                        <object
                            data={contentUri}
                            type="application/pdf"
                            style={{ flex: 1, border: 'none', height: '100%', width: '100%' }}
                            // @ts-ignore
                            title="PDF Viewer"
                        >
                            <Text style={{ padding: 20, textAlign: 'center' }}>Unable to display PDF. Please check your browser settings or download the file.</Text>
                        </object>
                    ) : (
                        <WebView
                            source={{
                                uri: Platform.OS === 'android'
                                    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(contentUri)}`
                                    : contentUri
                            }}
                            style={styles.webview}
                            startInLoadingState={true}
                            renderLoading={() => <LoadingSpinner message="Loading PDF..." />}
                            onLoad={() => setIsContentReady(true)}
                        />
                    )}
                </View>
            ) : session.content_type === 'image' || (session.image_url) ? (
                <View style={styles.imageContainer}>
                    <View style={styles.pdfHeader}>
                        <Text style={styles.sessionTitle}>{session.name}</Text>
                        <View style={styles.meta}>
                            <Clock size={16} color="#64748b" />
                            <Text style={styles.metaText}>
                                {session.duration_minutes} min view
                            </Text>
                        </View>
                    </View>
                    <ScrollView contentContainerStyle={styles.imageWrapper}>
                        <Image
                            source={{ uri: imageUri }}
                            style={styles.contentImage}
                            resizeMode="contain"
                            onLoad={() => setIsContentReady(true)}
                        />
                    </ScrollView>
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.articleContainer}>
                        <Text style={styles.sessionTitle}>{session.name}</Text>

                        <View style={styles.meta}>
                            <Clock size={16} color="#64748b" />
                            <Text style={styles.metaText}>
                                {session.duration_minutes} min read
                            </Text>
                        </View>

                        {session.content_text ? (
                            <Text style={styles.articleText}>{session.content_text}</Text>
                        ) : session.content_url ? (
                            <Text style={styles.articleText}>
                                File available: {session.content_url}
                            </Text>
                        ) : (
                            <View style={styles.emptyContent}>
                                <FileSearch size={48} color="#cbd5e1" />
                                <Text style={styles.emptyText}>No content available</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            )}

            {/* Navigation Footer */}
            <View style={styles.footer}>
                <View style={{ flex: 1 }} />

                <TouchableOpacity
                    style={[
                        styles.completeButton,
                        !canComplete && styles.completeButtonDisabled,
                    ]}
                    onPress={() => handleCompleteSession(true)}
                    disabled={!canComplete}
                >
                    {!canComplete && (
                        <View style={styles.timerOverlay}>
                            <Clock size={18} color="#fff" />
                            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                        </View>
                    )}
                    {canComplete && (
                        <>
                            <CheckCircle size={20} color="#fff" />
                            <Text style={styles.completeButtonText}>
                                {isCompleted ? 'Completed' : 'Complete Session'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {sessionQuiz && (
                    <TouchableOpacity
                        style={[
                            styles.completeButton,
                            { backgroundColor: '#8b5cf6' },
                            !isCompleted && styles.completeButtonDisabled,
                        ]}
                        onPress={() => router.push(`/quiz/${sessionQuiz.id}?session_id=${id}`)}
                        disabled={!isCompleted}
                    >
                        <FileSearch size={20} color="#fff" />
                        <Text style={styles.completeButtonText}>
                            {isCompleted ? 'Take Quiz' : 'Complete Session First'}
                        </Text>
                    </TouchableOpacity>
                )}

                <View style={{ flex: 1 }} />
            </View>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        color: '#1e293b',
        textAlign: 'center',
        marginHorizontal: 8,
    },
    content: {
        flex: 1,
    },
    articleContainer: {
        backgroundColor: '#fff',
        padding: 24,
        minHeight: '100%',
    },
    sessionTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 12,
        lineHeight: 36,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 24,
    },
    metaText: {
        fontSize: 14,
        color: '#64748b',
    },
    articleText: {
        fontSize: 16,
        color: '#334155',
        lineHeight: 28,
    },
    emptyContent: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        gap: 12,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    navButtonDisabled: {
        opacity: 0.4,
    },
    navButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6366f1',
    },
    navButtonTextDisabled: {
        color: '#cbd5e1',
    },
    completeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#22c55e',
        borderRadius: 12,
        paddingVertical: 14,
        position: 'relative',
    },
    completeButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    timerOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timerText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    errorState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        fontSize: 18,
        color: '#64748b',
        marginTop: 12,
    },
    backButton: {
        marginTop: 20,
        backgroundColor: '#6366f1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    pdfContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    pdfHeader: {
        padding: 24,
        paddingBottom: 12,
        backgroundColor: '#fff',
    },
    metaDivider: {
        fontSize: 14,
        color: '#cbd5e1',
        marginHorizontal: 8,
    },
    webview: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    videoContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    videoWrapper: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    imageContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    imageWrapper: {
        padding: 16,
        alignItems: 'center',
    },
    contentImage: {
        width: '100%',
        height: 400, // Fixed height or aspect ratio preferred in RN
        borderRadius: 12,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
    },
    modalText: {
        fontSize: 16,
        color: '#4b5563',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#6366f1',
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#f3f4f6',
    },
    secondaryButtonText: {
        color: '#4b5563',
        fontWeight: '600',
    }
});
