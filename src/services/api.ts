import { ApiService, API_ENDPOINTS } from '../config/api';
import type { 
  Material, 
  Quiz, 
  QuizAttempt, 
  QuizAnswer, 
  Student, 
  UsageInfo, 
  MaterialFilters,
  PaginatedResponse 
} from '../types';

export const materialsApi = {
  // Get all active materials with filtering
  getAll: async (params?: MaterialFilters): Promise<PaginatedResponse<Material>> => {
    return ApiService.get<PaginatedResponse<Material>>(API_ENDPOINTS.STUDENT_MATERIALS, { params });
  },

  // Get material by ID
  getById: async (id: string): Promise<Material> => {
    return ApiService.get<Material>(API_ENDPOINTS.STUDENT_MATERIAL_BY_ID(id));
  },


  // View material (increments view count)
  view: async (id: string): Promise<void> => {
    await ApiService.post<void>(API_ENDPOINTS.STUDENT_MATERIAL_VIEW(id));
  },
};

export const quizzesApi = {
  // Get all active quizzes
  getAll: async (): Promise<Quiz[]> => {
    return ApiService.get<Quiz[]>(API_ENDPOINTS.STUDENT_QUIZZES);
  },

  // Get quiz by ID
  getById: async (id: string): Promise<Quiz> => {
    return ApiService.get<Quiz>(API_ENDPOINTS.STUDENT_QUIZ_BY_ID(id));
  },

  // Submit quiz attempt
  submitAttempt: async (quizId: string, telegramId: number, answers: QuizAnswer[]): Promise<QuizAttempt> => {
    return ApiService.post<QuizAttempt>(API_ENDPOINTS.STUDENT_QUIZ_ATTEMPT(quizId), { 
      telegramId, 
      answers 
    });
  },

  // Get user's quiz attempts (this would need to be implemented in the backend)
  getAttempts: async (_quizId?: string): Promise<QuizAttempt[]> => {
    // This endpoint would need to be implemented in the backend
    // For now, return empty array
    return [];
  },
};

export const studentApi = {
  // Get student by Telegram ID
  getByTelegramId: async (telegramId: number): Promise<Student> => {
    return ApiService.get<Student>(API_ENDPOINTS.STUDENT_BY_TELEGRAM_ID(telegramId));
  },

  // Check usage limit for a feature
  checkUsageLimit: async (telegramId: number, feature: string): Promise<UsageInfo> => {
    return ApiService.get<UsageInfo>(API_ENDPOINTS.STUDENT_USAGE(telegramId), {
      params: { feature }
    });
  },

  // Increment usage for a feature
  incrementUsage: async (telegramId: number, feature: string): Promise<{ success: boolean; message: string }> => {
    return ApiService.post<{ success: boolean; message: string }>(API_ENDPOINTS.STUDENT_USAGE_INCREMENT(telegramId), {
      feature
    });
  },
};

