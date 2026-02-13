export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  profile: {
    bio?: string;
    avatar?: string;
  };
  interests: string[];
  created_at: string;
}

export interface Session {
  id: string;
  course_id: string;
  module_id: string;
  name: string;
  duration_minutes: number;
  content_type: 'pdf' | 'article' | 'video' | 'audio' | 'quiz' | 'other';
  content_url?: string;
  content_text?: string;
  quiz_id?: string;
  is_document_available: boolean;
  created_at: string;
}

export interface Module {
  id: string;
  title: string;
  content_type: 'video' | 'document' | 'text';
  content_url?: string;
  content_text?: string;
  duration_minutes: number;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  modules: Module[];
  thumbnail?: string;
  created_by: string;
  created_at: string;
  is_published: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  course_ids: string[];
  target_interests: string[];
  created_by: string;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  course_id: string;
  module_id: string;
  completed: boolean;
  time_spent: number;
  completed_at?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer?: number;
  points: number;
}

export interface Quiz {
  id: string;
  course_id: string;
  module_id?: string;
  title: string;
  questions: QuizQuestion[];
  passing_score: number;
  time_limit_minutes: number;
  created_by: string;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  answers: Record<string, number>;
  score: number;
  passed: boolean;
  completed_at: string;
}

export interface Discussion {
  id: string;
  course_id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  replies: Reply[];
  created_at: string;
}

export interface Reply {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

export interface ExpertQuestion {
  id: string;
  course_id: string;
  question: string;
  asked_by: string;
  asked_by_name: string;
  answered_by?: string;
  answered_by_name?: string;
  answer?: string;
  status: 'pending' | 'answered';
  created_at: string;
  answered_at?: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  user_name: string;
  course_id?: string;
  course_title?: string;
  learning_path_id?: string;
  learning_path_title?: string;
  certificate_type: 'course' | 'learning_path';
  issued_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  notification_type: string;
  read: boolean;
  created_at: string;
}
