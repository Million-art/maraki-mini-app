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
    const url = `/api/student/usage/${telegramId}/increment-live-seconds`;
    const payload = JSON.stringify({ durationSeconds: Math.round(durationSeconds) });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      this.enqueue(telegramId, durationSeconds);
    }
  },
};
