import { ApiService, API_ENDPOINTS } from './api';
import { AudioRecorder, AudioPlayer } from '../utils/audioStream.util';
import { UsageQueue } from '../utils/usageQueue.util';

export interface LiveSessionHandlers {
  onStatusChange?: (status: 'connecting' | 'connected' | 'speaking' | 'listening' | 'error' | 'disconnected') => void;
  onTranscriptReceived?: (sender: 'user' | 'ai', text: string, isFinal?: boolean) => void;
  onError?: (errMessage: string) => void;
}

export class GeminiLiveService {
  private ws: WebSocket | null = null;
  private recorder: AudioRecorder | null = null;
  private player: AudioPlayer | null = null;
  private telegramId: number = 0;
  private sessionStartTime: number = 0;
  private isConnected: boolean = false;
  private handlers: LiveSessionHandlers = {};

  constructor(telegramId: number, handlers: LiveSessionHandlers) {
    this.telegramId = telegramId;
    this.handlers = handlers;
    this.player = new AudioPlayer();
  }

  async startSession(): Promise<void> {
    if (this.isConnected) return;
    this.handlers.onStatusChange?.('connecting');

    try {
      // Replay any pending offline usage first
      await UsageQueue.syncPendingUsage();

      // 1. Fetch Ephemeral Token from NestJS backend
      const tokenData: any = await ApiService.post(API_ENDPOINTS.LIVE_TOKEN, {
        telegramId: this.telegramId,
      });

      const apiKey = tokenData?.token;
      if (!apiKey) {
        throw new Error('Failed to obtain Live Ephemeral Token from server');
      }

      // 2. Open WebSocket connection to Gemini 3.1 Flash Live API
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(apiKey)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.sessionStartTime = Date.now();
        this.handlers.onStatusChange?.('connected');

        // 3. Send setup handshake message
        const setupMessage = {
          setup: {
            model: 'models/gemini-3.1-flash-live-preview',
            generationConfig: {
              responseModalities: ['AUDIO'],
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Aoede', // Friendly encouraging female tutor voice
                  },
                },
              },
            },
            systemInstruction: {
              parts: [
                {
                  text: 'You are Maraki AI, an encouraging English voice conversation tutor for Ethiopian students. Speak naturally, ask engaging questions, keep responses concise (1-2 sentences), and help improve their spoken English.',
                },
              ],
            },
          },
        };

        this.ws?.send(JSON.stringify(setupMessage));

        // 4. Start recording user mic audio and stream 16kHz PCM chunks
        this.startMicRecording();
      };

      this.ws.onmessage = async (event) => {
        try {
          let data: any;
          if (event.data instanceof Blob) {
            const text = await event.data.text();
            data = JSON.parse(text);
          } else {
            data = JSON.parse(event.data);
          }

          const serverContent = data?.serverContent;
          if (!serverContent) return;

          // Check for user interruption (barge-in event)
          if (serverContent?.interrupted) {
            this.player?.clearQueue();
            this.handlers.onStatusChange?.('listening');
          }

          // Handle input audio transcript (user speech)
          if (serverContent?.inputAudioTranscription?.text) {
            this.handlers.onTranscriptReceived?.('user', serverContent.inputAudioTranscription.text);
          }

          // Handle output audio transcript (AI speech)
          if (serverContent?.outputAudioTranscription?.text) {
            this.handlers.onTranscriptReceived?.('ai', serverContent.outputAudioTranscription.text);
          }

          // Handle AI audio output chunks (24kHz PCM)
          const parts = serverContent?.modelTurn?.parts || [];
          for (const part of parts) {
            if (part?.inlineData?.data) {
              this.handlers.onStatusChange?.('speaking');
              this.player?.playBase64Pcm(part.inlineData.data);
            }
          }

          if (serverContent?.turnComplete) {
            this.handlers.onStatusChange?.('listening');
          }
        } catch (e) {
          console.warn('[Gemini Live WS Message Error]:', (e as Error).message);
        }
      };

      this.ws.onerror = (e) => {
        console.error('[Gemini Live WS Error]:', e);
        this.handlers.onError?.('Live connection error. Reconnecting...');
        this.handlers.onStatusChange?.('error');
      };

      this.ws.onclose = () => {
        this.handleDisconnect();
      };
    } catch (err: any) {
      const msg = err?.message || 'Failed to start Live AI Call';
      this.handlers.onError?.(msg);
      this.handlers.onStatusChange?.('error');
      this.handleDisconnect();
    }
  }

  private async startMicRecording(): Promise<void> {
    try {
      this.recorder = new AudioRecorder((base64Pcm) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const realtimeInput = {
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: 'audio/pcm;rate=16000',
                  data: base64Pcm,
                },
              ],
            },
          };
          this.ws.send(JSON.stringify(realtimeInput));
        }
      });
      await this.recorder.start();
    } catch (err) {
      this.handlers.onError?.('Microphone access denied or unsupported.');
    }
  }

  endSession(): void {
    if (!this.isConnected) return;
    this.handleDisconnect();
  }

  private handleDisconnect(): void {
    if (!this.isConnected) return;
    this.isConnected = false;

    // Calculate session duration in seconds
    const durationSeconds = this.sessionStartTime > 0 ? (Date.now() - this.sessionStartTime) / 1000 : 0;

    // Clean up WebAudio nodes
    this.recorder?.stop();
    this.recorder = null;
    this.player?.stop();
    this.player = null;

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.handlers.onStatusChange?.('disconnected');

    // Sync usage quota safely (with Beacon / LocalStorage Queue backup)
    if (durationSeconds > 0) {
      UsageQueue.enqueue(this.telegramId, durationSeconds);
      UsageQueue.sendBeaconSync(this.telegramId, durationSeconds);
    }
  }
}
