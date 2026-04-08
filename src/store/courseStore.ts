import { create } from 'zustand';
import api from '../services/api';
import { Course, LearningPath, UserProgress, Quiz, Discussion, ExpertQuestion, Certificate, Notification, Session, CertificateTemplate } from '../types';

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  learningPaths: LearningPath[];
  userProgress: UserProgress[];
  quizzes: Quiz[];
  discussions: Discussion[];
  expertQuestions: ExpertQuestion[];
  certificates: Certificate[];
  notifications: Notification[];
  sessions: Record<string, Session[]>; // module_id -> sessions
  certificateTemplates: CertificateTemplate[];
  issuedCertificates: any[];
  userCourses: any[];
  userLearningPaths: any[];
  isLoading: boolean;

  // Course actions
  fetchCourses: (filters?: { difficulty?: string; search?: string }) => Promise<void>;
  fetchCourse: (id: string) => Promise<Course>;
  createCourse: (data: FormData) => Promise<Course>;
  updateCourse: (id: string, data: FormData) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  publishCourse: (id: string) => Promise<void>;

  // Module actions
  addModule: (courseId: string, module: any) => Promise<void>;
  updateModule: (courseId: string, moduleId: string, module: any) => Promise<void>;
  deleteModule: (courseId: string, moduleId: string) => Promise<void>;
  reorderModules: (courseId: string, moduleIds: string[]) => Promise<void>;

  // Session actions
  fetchSessions: (courseId: string, moduleId: string) => Promise<void>;
  createSession: (formData: FormData) => Promise<void>;
  updateSession: (sessionId: string, formData: FormData) => Promise<void>;
  deleteSession: (sessionId: string, courseId: string, moduleId: string) => Promise<void>;
  reorderSessions: (courseId: string, moduleId: string, sessionIds: string[]) => Promise<void>;

  // Learning path actions
  fetchLearningPaths: () => Promise<void>;
  fetchRecommendedPaths: () => Promise<LearningPath[]>;
  createLearningPath: (data: Partial<LearningPath>) => Promise<LearningPath>;
  updateLearningPath: (id: string, data: Partial<LearningPath>) => Promise<LearningPath>;
  deleteLearningPath: (id: string) => Promise<void>;

  // Progress actions
  fetchProgress: () => Promise<void>;
  updateProgress: (courseId: string, moduleId: string, completed: boolean, timeSpent?: number) => Promise<void>;
  fetchCourseProgress: (courseId: string) => Promise<any>;
  fetchDashboard: () => Promise<any>;

  // Quiz actions
  fetchQuizzes: (courseId?: string) => Promise<void>;
  fetchQuiz: (id: string) => Promise<Quiz>;
  createQuiz: (data: Partial<Quiz>) => Promise<Quiz>;
  updateQuiz: (id: string, data: Partial<Quiz>) => Promise<Quiz>;
  deleteQuiz: (id: string) => Promise<void>;
  submitQuiz: (quizId: string, answers: Record<string, number>, sessionId?: string) => Promise<any>;
  fetchQuizResult: (quizId: string, sessionId?: string) => Promise<any>;

  // Discussion actions
  fetchDiscussions: (courseId?: string) => Promise<void>;
  createDiscussion: (courseId: string, title: string, content: string) => Promise<Discussion>;
  addReply: (discussionId: string, content: string, courseId?: string) => Promise<void>;

  // Expert Q&A actions
  fetchExpertQuestions: (courseId?: string) => Promise<void>;
  askQuestion: (courseId: string, question: string) => Promise<ExpertQuestion>;
  answerQuestion: (questionId: string, answer: string, courseId?: string) => Promise<void>;

  // Certificate actions
  fetchCertificates: () => Promise<void>;
  fetchCertificateTemplates: () => Promise<void>;
  createCertificateTemplate: (data: Partial<CertificateTemplate>) => Promise<CertificateTemplate>;
  updateCertificateTemplate: (id: string, data: Partial<CertificateTemplate>) => Promise<CertificateTemplate>;
  deleteCertificateTemplate: (id: string) => Promise<void>;

  // Issuance actions
  fetchUserCertificates: (uid: string) => Promise<void>;
  issueCertificate: (data: any) => Promise<void>;
  fetchCertificateById: (id: string) => Promise<any>;

  // Notification actions
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;

  // Admin User management
  fetchAdminUsers: (page?: number, limit?: number, search?: string, role?: string) => Promise<any>;
  fetchUserCourses: (userId: string) => Promise<void>;
  assignCourse: (userId: string, courseId: string) => Promise<void>;
  assignLearningPath: (userId: string, pathId: string) => Promise<void>;
  unassignLearningPath: (userId: string, pathId: string) => Promise<void>;
  unassignCourse: (userId: string, courseId: string) => Promise<void>;
  fetchCourseUsers: (courseId: string) => Promise<any[]>;
  assignUserToCourse: (courseId: string, userId: string) => Promise<void>;
  unassignUserFromCourse: (courseId: string, userId: string) => Promise<void>;
  updateCourseAccessStatus: (userId: string, courseId: string, status: 'active' | 'frozen' | 'blocked') => Promise<void>;
  updatePathAccessStatus: (userId: string, pathId: string, status: 'active' | 'blocked') => Promise<void>;
  fetchStudentProgress: (userId: string, courseId: string) => Promise<any[]>;
  fetchPathProgress: (userId: string, pathId: string) => Promise<any[]>;
  fetchStudentAnalytics: (userId: string) => Promise<any>;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  currentCourse: null,
  learningPaths: [],
  userProgress: [],
  quizzes: [],
  discussions: [],
  expertQuestions: [],
  certificates: [],
  notifications: [],
  sessions: {},
  certificateTemplates: [],
  issuedCertificates: [],
  userCourses: [],
  userLearningPaths: [],
  isLoading: false,

  fetchCourses: async (filters) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.search) params.append('search', filters.search);

      const response = await api.get(`/courses?${params.toString()}`);
      set({ courses: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchCourse: async (id: string) => {
    const response = await api.get(`/courses/${id}`);
    set({ currentCourse: response.data });
    return response.data;
  },

  createCourse: async (formData) => {
    const response = await api.post('/courses', formData);
    const newCourse = { ...response.data, modules: response.data.modules || [] };
    set((state) => ({ courses: [...state.courses, newCourse] }));
    return newCourse;
  },

  updateCourse: async (id, formData) => {
    const response = await api.put(`/courses/${id}`, formData);
    const updatedCourse = { ...response.data, modules: response.data.modules || [] };
    set((state) => ({
      courses: state.courses.map((c) => (c.id === id ? updatedCourse : c)),
      currentCourse: updatedCourse,
    }));
    return updatedCourse;
  },

  deleteCourse: async (id) => {
    await api.delete(`/courses/${id}`);
    set((state) => ({
      courses: state.courses.filter((c) => c.id !== id),
    }));
  },

  publishCourse: async (id) => {
    await api.put(`/courses/${id}/publish`);
    set((state) => ({
      courses: state.courses.map((c) =>
        c.id === id ? { ...c, is_published: true } : c
      ),
    }));
  },

  addModule: async (courseId, module) => {
    const response = await api.post(`/courses/${courseId}/modules`, module);
    set({ currentCourse: response.data });
  },

  updateModule: async (courseId, moduleId, module) => {
    const response = await api.put(`/courses/${courseId}/modules/${moduleId}`, module);
    set({ currentCourse: response.data });
  },

  deleteModule: async (courseId, moduleId) => {
    await api.delete(`/courses/${courseId}/modules/${moduleId}`);
    const course = await get().fetchCourse(courseId);
    set({ currentCourse: course });
  },

  fetchSessions: async (courseId, moduleId) => {
    const response = await api.get(`/courses/${courseId}/modules/${moduleId}/sessions`);
    set((state) => ({
      sessions: {
        ...state.sessions,
        [moduleId]: response.data,
      },
    }));
  },

  createSession: async (formData) => {
    // Note: Don't set Content-Type header manually for FormData, 
    // Axios/Fetch will handle it and add the necessary boundary.
    const response = await api.post('/sessions', formData);
    const newSession = response.data;

    // Use the returned session data to refresh the correct module's sessions
    if (newSession && newSession.course_id && newSession.module_id) {
      await get().fetchSessions(newSession.course_id, newSession.module_id);
    }
  },

  updateSession: async (sessionId, formData) => {
    const response = await api.put(`/sessions/${sessionId}`, formData);
    const updatedSession = response.data;
    if (updatedSession && updatedSession.course_id && updatedSession.module_id) {
      await get().fetchSessions(updatedSession.course_id, updatedSession.module_id);
    }
  },

  deleteSession: async (sessionId, courseId, moduleId) => {
    await api.delete(`/sessions/${sessionId}`);
    await get().fetchSessions(courseId, moduleId);
  },

  fetchLearningPaths: async () => {
    const response = await api.get('/learning-paths');
    set({ learningPaths: response.data });
  },

  fetchRecommendedPaths: async () => {
    const response = await api.get('/learning-paths/recommended');
    return response.data;
  },

  createLearningPath: async (data) => {
    const response = await api.post('/learning-paths', data);
    set((state) => ({ learningPaths: [...state.learningPaths, response.data] }));
    return response.data;
  },

  updateLearningPath: async (id, data) => {
    const response = await api.put(`/learning-paths/${id}`, data);
    set((state) => ({
      learningPaths: state.learningPaths.map((lp) => (lp.id === id ? response.data : lp)),
    }));
    return response.data;
  },

  deleteLearningPath: async (id) => {
    await api.delete(`/learning-paths/${id}`);
    set((state) => ({
      learningPaths: state.learningPaths.filter((lp) => lp.id !== id),
    }));
  },

  reorderModules: async (courseId, moduleIds) => {
    const response = await api.put(`/courses/${courseId}/modules/reorder`, { ids: moduleIds });
    set({ currentCourse: response.data });
  },

  reorderSessions: async (courseId, moduleId, sessionIds) => {
    await api.put(`/courses/${courseId}/modules/${moduleId}/sessions/reorder`, { ids: sessionIds });
    await get().fetchSessions(courseId, moduleId);
  },

  fetchProgress: async () => {
    const response = await api.get('/progress');
    set({ userProgress: response.data });
  },

  updateProgress: async (courseId, moduleId, completed, timeSpent = 0) => {
    await api.post('/progress', {
      course_id: courseId,
      module_id: moduleId,
      completed,
      time_spent: timeSpent,
    });
    await get().fetchProgress();
  },

  fetchCourseProgress: async (courseId: string) => {
    const response = await api.get(`/progress/course/${courseId}`);
    return response.data;
  },

  fetchDashboard: async () => {
    const response = await api.get('/progress/dashboard/v2');
    return response.data;
  },

  fetchQuizzes: async (courseId) => {
    const params = courseId ? `?course_id=${courseId}` : '';
    const response = await api.get(`/quizzes${params}`);
    set({ quizzes: response.data });
  },

  fetchQuiz: async (id) => {
    const response = await api.get(`/quizzes/${id}`);
    return response.data;
  },

  createQuiz: async (data) => {
    const response = await api.post('/quizzes', data);
    set((state) => ({ quizzes: [...state.quizzes, response.data] }));
    return response.data;
  },

  updateQuiz: async (id, data) => {
    const response = await api.put(`/quizzes/${id}`, data);
    const updatedQuiz = response.data;
    set((state) => ({
      quizzes: state.quizzes.map((q) => (q.id === id ? updatedQuiz : q)),
    }));
    return updatedQuiz;
  },

  deleteQuiz: async (id) => {
    await api.delete(`/quizzes/${id}`);
    set((state) => ({
      quizzes: state.quizzes.filter((q) => q.id !== id),
    }));
  },

  submitQuiz: async (quizId, answers, sessionId) => {
    const payload = sessionId ? { ...answers, session_id: sessionId } : answers;
    const response = await api.post(`/quizzes/${quizId}/submit`, {
      quiz_id: quizId,
      answers: payload,
    });
    return response.data;
  },

  fetchQuizResult: async (quizId, sessionId) => {
    const params = sessionId ? `?session_id=${sessionId}` : '';
    const response = await api.get(`/quizzes/${quizId}/result${params}`);
    return response.data;
  },

  fetchCompletedQuizzes: async (courseId?: string) => {
    const params = courseId ? `?course_id=${courseId}` : '';
    const response = await api.get(`/quizzes/completed${params}`);
    return response.data.completed_quiz_ids || [];
  },

  fetchDiscussions: async (courseId) => {
    const params = courseId ? `?course_id=${courseId}` : '';
    const response = await api.get(`/discussions${params}`);
    set({ discussions: response.data });
  },

  createDiscussion: async (courseId, title, content) => {
    const response = await api.post('/discussions', {
      course_id: courseId,
      title,
      content,
    });
    set((state) => ({ discussions: [response.data, ...state.discussions] }));
    return response.data;
  },

  addReply: async (discussionId, content, courseId) => {
    await api.post(`/discussions/${discussionId}/reply`, { content });
    await get().fetchDiscussions(courseId);
  },

  fetchExpertQuestions: async (courseId) => {
    const params = courseId ? `?course_id=${courseId}` : '';
    const response = await api.get(`/expert-questions${params}`);
    set({ expertQuestions: response.data });
  },

  askQuestion: async (courseId, question) => {
    const response = await api.post('/expert-questions', {
      course_id: courseId,
      question,
    });
    set((state) => ({ expertQuestions: [response.data, ...state.expertQuestions] }));
    return response.data;
  },

  answerQuestion: async (questionId, answer, courseId) => {
    await api.post(`/expert-questions/${questionId}/answer`, { answer });
    await get().fetchExpertQuestions(courseId);
  },

  fetchCertificates: async () => {
    const response = await api.get('/certificates');
    set({ certificates: response.data });
  },

  fetchCertificateTemplates: async () => {
    const response = await api.get('/admin/certificate-templates');
    set({ certificateTemplates: response.data });
  },

  createCertificateTemplate: async (data) => {
    const response = await api.post('/admin/certificate-templates', data);
    set((state) => ({ 
      certificateTemplates: [response.data, ...state.certificateTemplates] 
    }));
    return response.data;
  },

  deleteCertificateTemplate: async (id) => {
    await api.delete(`/admin/certificate-templates/${id}`);
    set((state) => ({
      certificateTemplates: state.certificateTemplates.filter((t) => t.id !== id),
    }));
  },

  updateCertificateTemplate: async (id, data) => {
    const response = await api.put(`/admin/certificate-templates/${id}`, data);
    set((state) => ({
      certificateTemplates: state.certificateTemplates.map((t) =>
        t.id === id ? response.data : t
      ),
    }));
    return response.data;
  },

  fetchUserCertificates: async (uid) => {
    const response = await api.get(`/admin/users/${uid}/certificates`);
    set({ issuedCertificates: response.data });
  },

  issueCertificate: async (data) => {
    const response = await api.post('/admin/certificates/issue', data);
    set((state) => ({
      issuedCertificates: [response.data, ...state.issuedCertificates]
    }));
  },

  fetchCertificateById: async (id: string) => {
    const response = await api.get(`/certificates/${id}`);
    return response.data;
  },

  fetchNotifications: async () => {
    const response = await api.get('/notifications');
    set({ notifications: response.data });
  },

  markNotificationRead: async (id) => {
    await api.put(`/notifications/${id}/read`);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllRead: async () => {
    await api.put('/notifications/read-all');
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  fetchAdminUsers: async (page = 1, limit = 10, search = '', role = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  },

  fetchUserCourses: async (userId: string) => {
    const response = await api.get(`/admin/users/${userId}/courses`);
    set({ 
      userCourses: response.data.courses, 
      userLearningPaths: response.data.learning_paths 
    });
  },

  assignCourse: async (userId: string, courseId: string) => {
    await api.post(`/admin/users/${userId}/courses`, { course_id: courseId });
  },

  assignLearningPath: async (userId, pathId) => {
    await api.post(`/admin/users/${userId}/learning-paths`, { path_id: pathId });
  },

  unassignLearningPath: async (userId, pathId) => {
    await api.delete(`/admin/users/${userId}/learning-paths/${pathId}`);
  },

  unassignCourse: async (userId: string, courseId: string) => {
    await api.delete(`/admin/users/${userId}/courses/${courseId}`);
  },

  fetchCourseUsers: async (courseId: string) => {
    const response = await api.get(`/admin/courses/${courseId}/users`);
    return response.data;
  },

  assignUserToCourse: async (courseId: string, userId: string) => {
    await api.post(`/admin/courses/${courseId}/users`, { user_id: userId });
  },

  unassignUserFromCourse: async (courseId, userId) => {
    await api.delete(`/admin/users/${userId}/courses/${courseId}`);
  },

  updateCourseAccessStatus: async (userId, courseId, status) => {
    await api.post(`/admin/users/${userId}/courses/${courseId}/status`, { status });
  },

  updatePathAccessStatus: async (userId, pathId, status) => {
    await api.post(`/admin/users/${userId}/learning-paths/${pathId}/status`, { status });
  },

  fetchStudentProgress: async (userId, courseId) => {
    const response = await api.get(`/admin/users/${userId}/courses/${courseId}/progress`);
    return response.data;
  },

  fetchPathProgress: async (userId, pathId) => {
    const response = await api.get(`/admin/users/${userId}/learning-paths/${pathId}/progress`);
    return response.data;
  },

  fetchStudentAnalytics: async (userId) => {
    const response = await api.get(`/admin/student/${userId}/analytics`);
    return response.data;
  },
}));
