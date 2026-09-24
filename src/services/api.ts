import { ApiService, API_ENDPOINTS } from '../config/api';
export { ApiService, API_ENDPOINTS };
import type { 
  Student, 
  UsageInfo, 
} from '../types';


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

export const paymentApi = {
  verifyBankPayment: async (data: { telegramId: number; referenceNumber: string; bank?: string; tier?: string }) => {
    return ApiService.post<{ success: boolean; message: string; result?: any }>(API_ENDPOINTS.VERIFY_BANK_PAYMENT, data);
  },
};


