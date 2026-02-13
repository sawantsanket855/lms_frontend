import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Check,
  X,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react-native';
import { useCourseStore } from '../../src/store/courseStore';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { Quiz, QuizQuestion } from '../../src/types';

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { fetchQuiz, submitQuiz } = useCourseStore();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const quizData = await fetchQuiz(id!);
        setQuiz(quizData);
        setTimeRemaining(quizData.time_limit_minutes * 60);
      } catch (error) {
        console.error('Error loading quiz:', error);
        Alert.alert('Error', 'Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadQuiz();
    }
  }, [id]);

  useEffect(() => {
    if (!isSubmitted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSubmitted, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    const unanswered = quiz.questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0 && !isSubmitted) {
      Alert.alert(
        'Incomplete Quiz',
        `You have ${unanswered.length} unanswered question(s). Submit anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: doSubmit },
        ]
      );
    } else {
      doSubmit();
    }
  };

  const doSubmit = async () => {
    try {
      const resultData = await submitQuiz(id!, answers);
      setResult(resultData);
      setIsSubmitted(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit quiz');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading quiz..." />;
  }

  if (!quiz) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <AlertCircle size={48} color="#ef4444" />
          <Text style={styles.errorText}>Quiz not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isSubmitted && result) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View
            style={[
              styles.resultBadge,
              result.passed ? styles.resultBadgePassed : styles.resultBadgeFailed,
            ]}
          >
            {result.passed ? (
              <CheckCircle size={64} color="#22c55e" />
            ) : (
              <XCircle size={64} color="#ef4444" />
            )}
          </View>
          <Text style={styles.resultTitle}>
            {result.passed ? 'Congratulations!' : 'Keep Practicing'}
          </Text>
          <Text style={styles.resultScore}>{result.score}%</Text>
          <Text style={styles.resultText}>
            You answered {result.correct_answers} out of {result.total_questions} questions
            correctly
          </Text>
          <Text style={styles.resultStatus}>
            {result.passed ? 'You passed!' : `Passing score: ${quiz.passing_score}%`}
          </Text>

          <View style={styles.resultDetails}>
            {quiz.questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const resultItem = result.results.find(
                (r: any) => r.question_id === question.id
              );
              const isCorrect = resultItem?.correct;

              return (
                <View key={question.id} style={styles.resultItem}>
                  <View
                    style={[
                      styles.resultItemIcon,
                      isCorrect ? styles.resultItemCorrect : styles.resultItemWrong,
                    ]}
                  >
                    {isCorrect ? (
                      <Check size={16} color="#fff" />
                    ) : (
                      <X size={16} color="#fff" />
                    )}
                  </View>
                  <View style={styles.resultItemContent}>
                    <Text style={styles.resultItemQuestion}>
                      {index + 1}. {question.question}
                    </Text>
                    <Text style={styles.resultItemAnswer}>
                      Your answer: {question.options[userAnswer] || 'Not answered'}
                    </Text>
                    {!isCorrect && (
                      <Text style={styles.resultItemCorrectAnswer}>
                        Correct: {question.options[resultItem?.correct_answer]}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.timer}>
          <Clock
            size={18}
            color={timeRemaining < 60 ? '#ef4444' : '#64748b'}
          />
          <Text
            style={[
              styles.timerText,
              timeRemaining < 60 && styles.timerWarning,
            ]}
          >
            {formatTime(timeRemaining)}
          </Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {quiz.questions.length}
        </Text>
      </View>

      {/* Question */}
      <ScrollView style={styles.content}>
        <Text style={styles.questionTitle}>{quiz.title}</Text>
        <Text style={styles.questionText}>{question.question}</Text>

        {/* Options */}
        <View style={styles.options}>
          {question.options.map((option, index) => {
            const isSelected = answers[question.id] === index;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  isSelected && styles.optionSelected,
                ]}
                onPress={() => handleAnswerSelect(question.id, index)}
              >
                <View
                  style={[
                    styles.optionCircle,
                    isSelected && styles.optionCircleSelected,
                  ]}
                >
                  {isSelected && <View style={styles.optionDot} />}
                </View>
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentQuestion === 0 && styles.navButtonDisabled,
          ]}
          onPress={() => setCurrentQuestion((prev) => prev - 1)}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft
            size={20}
            color={currentQuestion === 0 ? '#cbd5e1' : '#6366f1'}
          />
          <Text
            style={[
              styles.navButtonText,
              currentQuestion === 0 && styles.navButtonTextDisabled,
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        {currentQuestion < quiz.questions.length - 1 ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => setCurrentQuestion((prev) => prev + 1)}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Quiz</Text>
          </TouchableOpacity>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  timerWarning: {
    color: '#ef4444',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: '#64748b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionTitle: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 28,
    marginBottom: 24,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  optionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  optionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionCircleSelected: {
    borderColor: '#6366f1',
  },
  optionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#6366f1',
    fontWeight: '500',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  navButtonTextDisabled: {
    color: '#cbd5e1',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  resultContainer: {
    padding: 24,
    alignItems: 'center',
  },
  resultBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resultBadgePassed: {
    backgroundColor: '#dcfce7',
  },
  resultBadgeFailed: {
    backgroundColor: '#fee2e2',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 48,
    fontWeight: '800',
    color: '#6366f1',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 24,
  },
  resultDetails: {
    width: '100%',
    marginBottom: 24,
  },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  resultItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultItemCorrect: {
    backgroundColor: '#22c55e',
  },
  resultItemWrong: {
    backgroundColor: '#ef4444',
  },
  resultItemContent: {
    flex: 1,
  },
  resultItemQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  resultItemAnswer: {
    fontSize: 13,
    color: '#64748b',
  },
  resultItemCorrectAnswer: {
    fontSize: 13,
    color: '#22c55e',
    marginTop: 4,
  },
  doneButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
});
