import { ApiService, API_ENDPOINTS } from '../config/api';
import { GeminiLiveClient, type LiveResponse, MultimodalLiveResponseType } from '../lib/geminiLiveClient';
import { AudioStreamer, AudioPlayer } from '../lib/mediaUtils';
import { UsageQueue } from '../utils/usageQueue.util';

export interface LiveSessionHandlers {
  onStatusChange?: (status: 'connecting' | 'connected' | 'speaking' | 'listening' | 'error' | 'disconnected') => void;
  onTranscriptReceived?: (sender: 'user' | 'ai', text: string, isFinal?: boolean) => void;
  onError?: (errMessage: string) => void;
}

export class GeminiLiveService {
  private client: GeminiLiveClient | null = null;
  private streamer: AudioStreamer | null = null;
  private player: AudioPlayer | null = null;
  private telegramId: number = 0;
  private sessionStartTime: number = 0;
  private isConnected: boolean = false;
  private handlers: LiveSessionHandlers = {};

  constructor(telegramId: number, handlers: LiveSessionHandlers) {
    this.telegramId = telegramId;
    this.handlers = handlers;
    this.player = new AudioPlayer();
    this.player.onEnded(() => {
      if (this.isConnected) {
        this.handlers.onStatusChange?.('listening');
      }
    });
  }

  async startSession(): Promise<void> {
    if (this.isConnected) return;
    this.handlers.onStatusChange?.('connecting');

    try {
      // Replay any pending offline usage first
      try {
        await UsageQueue.syncPendingUsage();
      } catch (e) {
        // non-blocking
      }

      // 1. Fetch Ephemeral Token from NestJS backend endpoint
      const tokenRes: any = await ApiService.post(API_ENDPOINTS.EPHEMERAL_TOKEN);
      const token = tokenRes?.token || tokenRes?.name || '';

      if (!token) {
        throw new Error('No valid ephemeral token received from server.');
      }

      // 2. Initialize GeminiLiveClient with message callbacks
      this.client = new GeminiLiveClient({
        onStatusChange: (status) => {
          if (status === 'connected') {
            this.isConnected = true;
            this.sessionStartTime = Date.now();
            this.handlers.onStatusChange?.('connected');
            this.startMicStreaming();
          } else if (status === 'disconnected') {
            this.handleDisconnect();
          } else if (status === 'error') {
            this.handlers.onStatusChange?.('error');
          }
        },
        onResponse: (responses: LiveResponse[]) => {
          this.handleServerResponses(responses);
        },
        onError: (err) => {
          this.handlers.onError?.(err);
        },
      });

      // 3. Connect client WebSocket to Gemini Live API
      await this.client.connect(token);
    } catch (err: any) {
      const msg = err?.message || 'Failed to start Live AI Call';
      this.handlers.onError?.(msg);
      this.handlers.onStatusChange?.('error');
      this.handleDisconnect();
    }
  }

  private handleServerResponses(responses: LiveResponse[]) {
    for (const res of responses) {
      switch (res.type) {
        case MultimodalLiveResponseType.AUDIO:
          if (res.data) {
            this.handlers.onStatusChange?.('speaking');
            this.player?.playChunk(res.data);
          }
          break;

        case MultimodalLiveResponseType.INPUT_TRANSCRIPTION:
          if (res.data?.text) {
            this.handlers.onTranscriptReceived?.('user', res.data.text);
          }
          break;

        case MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION:
          if (res.data?.text) {
            this.handlers.onTranscriptReceived?.('ai', res.data.text);
          }
          break;

        case MultimodalLiveResponseType.INTERRUPTED:
          this.player?.stop();
          this.handlers.onStatusChange?.('listening');
          break;

        case MultimodalLiveResponseType.TURN_COMPLETE:
          // finished turn
          break;

        case MultimodalLiveResponseType.TEXT:
          if (res.data) {
            this.handlers.onTranscriptReceived?.('ai', res.data);
          }
          break;

        case MultimodalLiveResponseType.TOOL_CALL:
          console.log('Received Gemini Live Tool Call:', res.data);
          break;
      }
    }
  }

  private async startMicStreaming(): Promise<void> {
    if (!this.client) return;
    try {
      this.streamer = new AudioStreamer(this.client);
      await this.streamer.start();
      this.handlers.onStatusChange?.('listening');
    } catch (err: any) {
      if (err?.name === 'NotFoundError' || err?.message?.includes('NotFoundError')) {
        this.handlers.onError?.('No microphone input device was found. Please connect a microphone or headset.');
      } else if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        this.handlers.onError?.('Microphone permission was denied. Please allow microphone access in your browser settings.');
      } else {
        this.handlers.onError?.(err?.message || 'Microphone access denied or unsupported.');
      }
    }
  }

  sendTextMessage(text: string): void {
    if (this.client && this.isConnected) {
      this.client.sendTextMessage(text);
    }
  }

  endSession(): void {
    if (!this.isConnected && !this.client) return;
    this.handleDisconnect();
  }

  private handleDisconnect(): void {
    if (!this.isConnected && !this.client) return;
    this.isConnected = false;

    const durationSeconds = this.sessionStartTime > 0 ? (Date.now() - this.sessionStartTime) / 1000 : 0;

    this.streamer?.stop();
    this.streamer = null;
    this.player?.stop();
    this.player = null;

    const clientToClose = this.client;
    this.client = null;

    if (clientToClose) {
      clientToClose.disconnect();
    }

    this.handlers.onStatusChange?.('disconnected');

    if (durationSeconds > 0) {
      try {
        UsageQueue.enqueue(this.telegramId, durationSeconds);
        UsageQueue.sendBeaconSync(this.telegramId, durationSeconds);
      } catch (e) {
        // offline queue fallback
      }
    }
  }
}
