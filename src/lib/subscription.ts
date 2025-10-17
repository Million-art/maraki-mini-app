// Placeholder subscription service
export interface UsageSummary {
  subscription_tier: 'free' | 'pro';
  usage: {
    text_chat: { used: number; limit: number };
    voice_input: { used: number; limit: number };
    quiz_access: { used: number; limit: number };
    material_access: { used: number; limit: number };
  };
  last_reset: string;
}

export const subscriptionService = {
  getUsageSummary: async (_telegramId: number): Promise<UsageSummary> => {
    // Placeholder implementation
    return {
      subscription_tier: 'free',
      usage: {
        text_chat: { used: 5, limit: 10 },
        voice_input: { used: 2, limit: 5 },
        quiz_access: { used: 8, limit: 20 },
        material_access: { used: 3, limit: 10 },
      },
      last_reset: new Date().toISOString(),
    };
  },
  
  checkUsageLimit: async (_telegramId: number, _feature: string): Promise<UsageSummary> => {
    // Placeholder implementation
    return {
      subscription_tier: 'free',
      usage: {
        text_chat: { used: 0, limit: 10 },
        voice_input: { used: 0, limit: 5 },
        quiz_access: { used: 0, limit: 20 },
        material_access: { used: 0, limit: 10 },
      },
      last_reset: new Date().toISOString(),
    };
  },
  
  incrementUsage: async (_telegramId: number, _feature: string): Promise<void> => {
    // Placeholder implementation
  }
};
