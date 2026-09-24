import { ApiService, API_ENDPOINTS } from '../config/api';
import { GeminiLiveClient, type LiveResponse, MultimodalLiveResponseType } from '../lib/geminiLiveClient';
import { defaultGeminiTools } from '../lib/geminiTools';
import {
  AudioStreamer,
  AudioPlayer,
  VideoStreamer,
  ScreenCapture,
  type VideoStreamOptions,
  type ScreenCaptureOptions,
} from '../lib/mediaUtils';
import { UsageQueue } from '../utils/usageQueue.util';

export interface LiveSessionHandlers {
  onStatusChange?: (status: 'connecting' | 'connected' | 'speaking' | 'listening' | 'thinking' | 'error' | 'disconnected') => void;
  onTranscriptReceived?: (sender: 'user' | 'ai', text: string, isFinal?: boolean) => void;
  onError?: (errMessage: string) => void;
  systemInstruction?: string;
}

export class GeminiLiveService {
  private client: GeminiLiveClient | null = null;
  private streamer: AudioStreamer | null = null;
  private player: AudioPlayer | null = null;
  private videoStreamer: VideoStreamer | null = null;
  private screenCapture: ScreenCapture | null = null;
  private telegramId: number = 0;
  private sessionStartTime: number = 0;
  private isConnected: boolean = false;
  private isDestroyed: boolean = false;
  private handlers: LiveSessionHandlers = {};

  constructor(telegramId: number, handlers: LiveSessionHandlers) {
    this.telegramId = telegramId;
    this.handlers = handlers;
    this.player = new AudioPlayer();
    this.player.onEnded(() => {
      this.streamer?.setAiSpeaking(false);
      if (this.isConnected && !this.isDestroyed) {
        this.handlers.onStatusChange?.('listening');
      }
    });
  }

  async startSession(micDeviceId?: string): Promise<void> {
    if (this.isConnected || this.isDestroyed) return;
    this.handlers.onStatusChange?.('connecting');

    try {
      // Replay any pending offline usage first
      try {
        await UsageQueue.syncPendingUsage();
      } catch (e) {
        // non-blocking
      }

      if (this.isDestroyed) {
        this.handleDisconnect();
        return;
      }

      // 1. Fetch Ephemeral Token from NestJS backend endpoint
      const tokenRes: any = await ApiService.post(API_ENDPOINTS.EPHEMERAL_TOKEN);
      const token = tokenRes?.token || tokenRes?.name || '';

      if (this.isDestroyed) {
        this.handleDisconnect();
        return;
      }

      if (!token) {
        throw new Error('No valid ephemeral token received from server.');
      }

      // The coaching orchestrator builds a rich, personalized instruction.
      // If provided, use it exclusively. Fall back to a baseline only if not available.
      const baselineFallback = "You are Maraki, a warm and expert English speaking coach. Lead the session with a clear lesson goal. If the user makes a grammar mistake, correct it naturally and ask them to try again. Keep your responses short during live voice   2 to 3 sentences max.";

      const combinedInstruction = this.handlers.systemInstruction
        ? `${this.handlers.systemInstruction}\n\n## Patience & Natural Flow Rules\n- NEVER interrupt the learner while they are speaking or taking a natural pause to think. Wait until they finish their complete thought.\n- NO INFINITE CORRECTION LOOPS. Do NOT force the learner to repeat phrases or corrections over and over. If you offer a correction or suggestion once, IMMEDIATELY move on to a new conversation thought.\n- DO NOT repeatedly say "You can say...". Have a natural, friendly two-way conversation.\n- SILENCE IS NORMAL: Never say 'no speech' or complain about silence. Wait patiently.`
        : baselineFallback;

      if (this.isDestroyed) {
        this.handleDisconnect();
        return;
      }

      // 2. Initialize GeminiLiveClient with message callbacks and custom tools
      this.client = new GeminiLiveClient({
        tools: defaultGeminiTools,
        systemInstruction: combinedInstruction,
        onStatusChange: (status) => {
          if (this.isDestroyed) {
            this.handleDisconnect();
            return;
          }
          if (status === 'connected') {
            this.isConnected = true;
            this.sessionStartTime = Date.now();
            this.handlers.onStatusChange?.('connected');
            this.startMicStreaming(micDeviceId);
          } else if (status === 'disconnected') {
            this.handleDisconnect();
          } else if (status === 'error') {
            this.handlers.onStatusChange?.('error');
          }
        },
        onResponse: (responses: LiveResponse[]) => {
          if (this.isDestroyed || !this.isConnected || !this.client) {
            this.player?.destroy();
            return;
          }
          this.handleServerResponses(responses);
        },
        onError: (err) => {
          if (this.isDestroyed) return;
          this.handlers.onError?.(err);
        },
      });

      // 3. Connect client WebSocket to Gemini Live API
      await this.client.connect(token);

      if (this.isDestroyed) {
        this.handleDisconnect();
      }
    } catch (err: any) {
      if (this.isDestroyed) return;
      const msg = err?.message || 'Failed to start Live AI Call';
      this.handlers.onError?.(msg);
      this.handlers.onStatusChange?.('error');
      this.handleDisconnect();
    }
  }

  private handleServerResponses(responses: LiveResponse[]) {
    if (this.isDestroyed || !this.isConnected || !this.client) {
      this.player?.destroy();
      return;
    }

    for (const res of responses) {
      if (!this.isConnected || !this.client) {
        this.player?.stop();
        return;
      }
      switch (res.type) {
        case MultimodalLiveResponseType.SETUP_COMPLETE:
          // Live session established — immediately prompt the coach to deliver its opening greeting
          console.log('[Gemini Live] Setup complete received. Triggering opening greeting from coach.');
          this.streamer?.setAiSpeaking(true);
          this.client.sendTextMessage("Start the conversation now by greeting me warmly as instructed.");
          break;

        case MultimodalLiveResponseType.AUDIO:
          if (res.data) {
            this.streamer?.setAiSpeaking(true);
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
          this.streamer?.setAiSpeaking(false);
          this.handlers.onStatusChange?.('listening');
          break;

        case MultimodalLiveResponseType.TURN_COMPLETE:
          // AudioPlayer onEnded will return status to 'listening' and unmute streamer
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

  public async startMicStreaming(micDeviceId?: string): Promise<void> {
    if (!this.client) return;
    try {
      if (!this.streamer) {
        this.streamer = new AudioStreamer(this.client);
        this.streamer.onVoiceActivity = () => {
          this.player?.stop();
          this.handlers.onStatusChange?.('thinking');
        };
      }
      await this.streamer.start(micDeviceId);
      this.handlers.onStatusChange?.('listening');
    } catch (err: any) {
      console.warn('Microphone not found or unavailable, continuing in text-only chat mode:', err);
      this.handlers.onStatusChange?.('connected');
    }
  }

  public setMuted(muted: boolean): void {
    if (this.streamer) {
      this.streamer.setMuted(muted);
    }
  }

  public async startCamera(options: VideoStreamOptions = {}): Promise<HTMLVideoElement | null> {
    if (!this.client || !this.client.connected) {
      throw new Error('Gemini Live session is not connected.');
    }
    if (!this.videoStreamer) {
      this.videoStreamer = new VideoStreamer(this.client);
    }
    return await this.videoStreamer.start(options);
  }

  public stopCamera(): void {
    if (this.videoStreamer) {
      this.videoStreamer.stop();
      this.videoStreamer = null;
    }
  }

  public async startScreenShare(options: ScreenCaptureOptions = {}): Promise<HTMLVideoElement | null> {
    if (!this.client || !this.client.connected) {
      throw new Error('Gemini Live session is not connected.');
    }
    if (!this.screenCapture) {
      this.screenCapture = new ScreenCapture(this.client);
    }
    return await this.screenCapture.start(options);
  }

  public stopScreenShare(): void {
    if (this.screenCapture) {
      this.screenCapture.stop();
      this.screenCapture = null;
    }
  }

  sendTextMessage(text: string): void {
    if (this.client && this.isConnected) {
      this.client.sendTextMessage(text);
    }
  }

  endSession(): void {
    this.isDestroyed = true;
    this.handleDisconnect();
  }

  private handleDisconnect(): void {
    this.isDestroyed = true;
    this.isConnected = false;

    const durationSeconds = this.sessionStartTime > 0 ? (Date.now() - this.sessionStartTime) / 1000 : 0;
    this.sessionStartTime = 0;

    if (this.streamer) {
      try { this.streamer.destroy(); } catch (e) {}
      this.streamer = null;
    }

    if (this.player) {
      try { this.player.destroy(); } catch (e) {}
      this.player = null;
    }

    this.stopCamera();
    this.stopScreenShare();

    const clientToClose = this.client;
    this.client = null;

    if (clientToClose) {
      try {
        clientToClose.disconnect();
      } catch (e) {}
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
