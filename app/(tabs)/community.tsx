import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  MessageSquare,
  HelpCircle,
  MessageCircle,
  Send,
  CheckCircle,
  X
} from 'lucide-react-native';
import { useCourseStore } from '../../src/store/courseStore';
import { useAuthStore } from '../../src/store/authStore';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { Discussion, ExpertQuestion } from '../../src/types';

export default function CommunityScreen() {
  const { user } = useAuthStore();
  const {
    discussions,
    expertQuestions,
    courses,
    fetchDiscussions,
    fetchExpertQuestions,
    fetchCourses,
    createDiscussion,
    addReply,
    askQuestion,
    answerQuestion,
  } = useCourseStore();
  const [activeTab, setActiveTab] = useState<'discussions' | 'questions'>('discussions');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const loadData = async () => {
    try {
      await Promise.all([
        fetchDiscussions(),
        fetchExpertQuestions(),
        fetchCourses(),
      ]);
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateNew = async () => {
    if (!newContent.trim()) {
      Alert.alert('Error', 'Please enter content');
      return;
    }

    try {
      if (activeTab === 'discussions') {
        if (!newTitle.trim()) {
          Alert.alert('Error', 'Please enter a title');
          return;
        }
        await createDiscussion(selectedCourseId || courses[0]?.id || '', newTitle, newContent);
      } else {
        await askQuestion(selectedCourseId || courses[0]?.id || '', newContent);
      }
      setShowNewModal(false);
      setNewTitle('');
      setNewContent('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleReply = async (discussionId: string) => {
    if (!replyContent.trim()) return;
    try {
      await addReply(discussionId, replyContent);
      setReplyContent('');
      setExpandedItem(null);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAnswer = async (questionId: string) => {
    if (!replyContent.trim()) return;
    try {
      await answerQuestion(questionId, replyContent);
      setReplyContent('');
      setExpandedItem(null);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading community..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => setShowNewModal(true)}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discussions' && styles.tabActive]}
          onPress={() => setActiveTab('discussions')}
        >
          <MessageSquare
            size={20}
            color={activeTab === 'discussions' ? '#6366f1' : '#64748b'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'discussions' && styles.tabTextActive,
            ]}
          >
            Discussions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'questions' && styles.tabActive]}
          onPress={() => setActiveTab('questions')}
        >
          <HelpCircle
            size={20}
            color={activeTab === 'questions' ? '#6366f1' : '#64748b'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'questions' && styles.tabTextActive,
            ]}
          >
            Expert Q&A
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'discussions' ? (
          discussions.length > 0 ? (
            discussions.map((discussion) => (
              <View key={discussion.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {discussion.author_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardMeta}>
                    <Text style={styles.authorName}>{discussion.author_name}</Text>
                    <Text style={styles.timestamp}>
                      {new Date(discussion.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardTitle}>{discussion.title}</Text>
                <Text style={styles.cardContent}>{discussion.content}</Text>
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.replyButton}
                    onPress={() =>
                      setExpandedItem(
                        expandedItem === discussion.id ? null : discussion.id
                      )
                    }
                  >
                    <MessageCircle size={16} color="#6366f1" />
                    <Text style={styles.replyButtonText}>
                      {discussion.replies?.length || 0} Replies
                    </Text>
                  </TouchableOpacity>
                </View>

                {expandedItem === discussion.id && (
                  <View style={styles.repliesSection}>
                    {discussion.replies?.map((reply) => (
                      <View key={reply.id} style={styles.reply}>
                        <Text style={styles.replyAuthor}>{reply.author_name}</Text>
                        <Text style={styles.replyContent}>{reply.content}</Text>
                      </View>
                    ))}
                    <View style={styles.replyInput}>
                      <TextInput
                        style={styles.replyTextInput}
                        placeholder="Write a reply..."
                        placeholderTextColor="#94a3b8"
                        value={replyContent}
                        onChangeText={setReplyContent}
                        multiline
                      />
                      <TouchableOpacity
                        style={styles.sendButton}
                        onPress={() => handleReply(discussion.id)}
                      >
                        <Send size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MessageSquare size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No discussions yet</Text>
              <Text style={styles.emptyText}>Start a discussion to engage with others</Text>
            </View>
          )
        ) : expertQuestions.length > 0 ? (
          expertQuestions.map((question) => (
            <View key={question.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {question.asked_by_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.authorName}>{question.asked_by_name}</Text>
                  <Text style={styles.timestamp}>
                    {new Date(question.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    question.status === 'answered'
                      ? styles.statusAnswered
                      : styles.statusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      question.status === 'answered'
                        ? styles.statusTextAnswered
                        : styles.statusTextPending,
                    ]}
                  >
                    {question.status === 'answered' ? 'Answered' : 'Pending'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardContent}>{question.question}</Text>

              {question.answer && (
                <View style={styles.answerSection}>
                  <View style={styles.answerHeader}>
                    <CheckCircle size={16} color="#22c55e" />
                    <Text style={styles.answeredBy}>
                      Answered by {question.answered_by_name}
                    </Text>
                  </View>
                  <Text style={styles.answerContent}>{question.answer}</Text>
                </View>
              )}

              {user?.role === 'admin' && question.status === 'pending' && (
                <TouchableOpacity
                  style={styles.answerButton}
                  onPress={() =>
                    setExpandedItem(
                      expandedItem === question.id ? null : question.id
                    )
                  }
                >
                  <Text style={styles.answerButtonText}>Answer Question</Text>
                </TouchableOpacity>
              )}

              {expandedItem === question.id && user?.role === 'admin' && (
                <View style={styles.replyInput}>
                  <TextInput
                    style={styles.replyTextInput}
                    placeholder="Write your answer..."
                    placeholderTextColor="#94a3b8"
                    value={replyContent}
                    onChangeText={setReplyContent}
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={() => handleAnswer(question.id)}
                  >
                    <Send size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <HelpCircle size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No questions yet</Text>
            <Text style={styles.emptyText}>Ask an expert for help</Text>
          </View>
        )}
      </ScrollView>

      {/* New Discussion/Question Modal */}
      <Modal visible={showNewModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeTab === 'discussions' ? 'New Discussion' : 'Ask a Question'}
              </Text>
              <TouchableOpacity onPress={() => setShowNewModal(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {activeTab === 'discussions' && (
              <TextInput
                style={styles.modalInput}
                placeholder="Discussion title"
                placeholderTextColor="#94a3b8"
                value={newTitle}
                onChangeText={setNewTitle}
              />
            )}

            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder={
                activeTab === 'discussions'
                  ? 'What would you like to discuss?'
                  : 'What would you like to ask?'
              }
              placeholderTextColor="#94a3b8"
              value={newContent}
              onChangeText={setNewContent}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleCreateNew}>
              <Text style={styles.submitButtonText}>
                {activeTab === 'discussions' ? 'Post Discussion' : 'Submit Question'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  newButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  tabActive: {
    backgroundColor: '#eef2ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#6366f1',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  timestamp: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAnswered: {
    backgroundColor: '#dcfce7',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextAnswered: {
    color: '#22c55e',
  },
  statusTextPending: {
    color: '#f59e0b',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyButtonText: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '500',
  },
  repliesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  reply: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  replyAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  replyContent: {
    fontSize: 13,
    color: '#64748b',
  },
  replyInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  replyTextInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1e293b',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerSection: {
    marginTop: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  answeredBy: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22c55e',
  },
  answerContent: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  answerButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 8,
  },
  answerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 12,
  },
  modalTextarea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
