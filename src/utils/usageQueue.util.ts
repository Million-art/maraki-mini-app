import { ApiService, API_ENDPOINTS } from '../services/api';

const QUEUE_KEY = 'maraki_pending_voice_usage';

export interface UsageItem {
  telegramId: number;
  durationSeconds: number;
  timestamp: number;
}

export const UsageQueue = {
  getQueue(): UsageItem[] {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  enqueue(telegramId: number, durationSeconds: number): void {
    if (!telegramId || durationSeconds <= 0) return;
    const queue = this.getQueue();
    queue.push({
      telegramId,
      durationSeconds: Math.ceil(durationSeconds),
      timestamp: Date.now(),
    });
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch {}
  },

  async syncPendingUsage(): Promise<void> {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    const remaining: UsageItem[] = [];

    for (const item of queue) {
      try {
        await ApiService.post(`${API_ENDPOINTS.STUDENTS}/${item.telegramId}/increment-live-seconds`, {
          durationSeconds: item.durationSeconds,
        });
      } catch (err) {
        remaining.push(item);
      }
    }

    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    } catch {}
  },

  sendBeaconSync(telegramId: number, durationSeconds: number): void {
    if (!telegramId || durationSeconds <= 0) return;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    // Use keepalive fetch instead of sendBeacon for better CORS/JSON support
    const url = `${baseUrl}/api/student/usage/${telegramId}/increment-live-seconds`;
    const payload = JSON.stringify({ durationSeconds: Math.round(durationSeconds) });

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // If the fetch fails asynchronously (e.g. network error), enqueue it for offline retry
      this.enqueue(telegramId, durationSeconds);
    });
  },
};
