// Core types for the mini-app (student-focused)

export interface Material {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'image' | 'document' | 'link' | 'presentation';
  url?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  category?: string;
  tags?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  durationMinutes: number;
  passingScorePercentage: number;
  maxAttempts: number;
  isActive: boolean;
  isRandomized: boolean;
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  totalQuestions: number;
  totalPoints: number;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  explanation?: string;
  questionType: 'multiple-choice' | 'true-false' | 'text';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  orderIndex: number;
  timeLimitSeconds?: number;
  options: QuizQuestionOption[];
  totalAttempts?: number;
  correctAttempts?: number;
  successRate?: number;
}

export interface QuizQuestionOption {
  id: string;
  optionText: string;
  orderIndex: number;
  isCorrect?: boolean; // Only shown after submission
  selectionCount?: number; // For analytics
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt?: string;
  completedAt?: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  totalPoints: number;
  earnedPoints: number;
  isPassed: boolean;
  timeSpentSeconds?: number;
  questionAttempts: QuizAnswer[];
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: string | boolean;
  isCorrect: boolean;
  points: number;
}

export interface Student {
  id: string;
  telegramId: number;
  firstName?: string;
  lastName?: string;
  level: string;
  isPremium: boolean;
  isMarakiPremium: boolean;
  subscriptionTier: string;
  subscriptionExpiresAt?: string;
  referralCount: number;
}

export interface UsageInfo {
  hasAccess: boolean;
  remaining: number;
  tier: string;
  currentUsage?: number;
  reason?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Filter types
export interface MaterialFilters {
  category?: string;
  type?: string;
  difficulty?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface QuizFilters {
  category?: string;
  difficulty?: string;
  search?: string;
}
