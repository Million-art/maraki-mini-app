import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      return Promise.reject(new Error('Unable to connect to server. Please check your internet connection and try again.'));
    }
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }
    
    if (error.response?.status === 403) {
      return Promise.reject(new Error('Access denied. You do not have permission to perform this action.'));
    }
    
    if (error.response?.status === 404) {
      return Promise.reject(new Error('The requested resource was not found.'));
    }
    
    if (error.response?.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }
    
    // Add timeout handling
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please try again.'));
    }
    
    // Return the original error message from the server if available
    const serverMessage = error.response?.data?.message || error.message;
    return Promise.reject(new Error(serverMessage || 'An unexpected error occurred. Please try again.'));
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Student Materials
  STUDENT_MATERIALS: '/api/student/materials',
  STUDENT_MATERIAL_BY_ID: (id: string) => `/api/student/materials/${id}`,
  STUDENT_MATERIAL_VIEW: (id: string) => `/api/student/materials/${id}/view`,
  
  // Student Quizzes
  STUDENT_QUIZZES: '/api/student/quizzes',
  STUDENT_QUIZ_BY_ID: (id: string) => `/api/student/quizzes/${id}`,
  STUDENT_QUIZ_ATTEMPT: (id: string) => `/api/student/quizzes/${id}/attempt`,
  
  // Student Profile
  STUDENT_BY_TELEGRAM_ID: (telegramId: number) => `/api/students/${telegramId}`,
  STUDENT_USAGE: (telegramId: number) => `/api/student/usage/${telegramId}`,
  STUDENT_USAGE_INCREMENT: (telegramId: number) => `/api/student/usage/${telegramId}/increment`,
  COACHING_PROFILE: (telegramId: string) => `/api/student/${telegramId}/coaching-profile`,
  
  // Payment Verification
  VERIFY_BANK_PAYMENT: '/api/student/verify-payment',
  
  // AI Endpoints
  CHAT_COMPLETION: '/api/gemini/chat',
  CHAT_COMPLETION_STREAM: '/api/gemini/chat-stream',
  EPHEMERAL_TOKEN: '/api/gemini/ephemeral-token',
  SAVE_VOICE_SESSION: '/api/gemini/save-voice-session',
  GEMINI_CHAT: '/api/gemini/chat',
  STUDENTS: '/api/student/usage',
  
  // Health
  HEALTH: '/health',
} as const;

// Generic API methods
export class ApiService {
  static async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  }

  static async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  }

  static async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  }

  static async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  }

  static async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  }
}

export default apiClient;
