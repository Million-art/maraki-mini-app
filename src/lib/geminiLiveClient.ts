/**
 * Gemini Live API WebSocket Client for TypeScript / React Vite
 * Supports Ephemeral Tokens, Audio/Video Streaming, and Tool Calls.
 * Based on google-gemini/gemini-live-api-examples
 */

export const MultimodalLiveResponseType = {
  TEXT: 'TEXT',
  AUDIO: 'AUDIO',
  SETUP_COMPLETE: 'SETUP COMPLETE',
  INTERRUPTED: 'INTERRUPTED',
  TURN_COMPLETE: 'TURN COMPLETE',
  TOOL_CALL: 'TOOL_CALL',
  ERROR: 'ERROR',
  INPUT_TRANSCRIPTION: 'INPUT_TRANSCRIPTION',
  OUTPUT_TRANSCRIPTION: 'OUTPUT_TRANSCRIPTION',
} as const;

export type ResponseType = typeof MultimodalLiveResponseType[keyof typeof MultimodalLiveResponseType];

export interface LiveResponse {
  type: ResponseType;
  data?: any;
  endOfTurn?: boolean;
}

export interface GeminiLiveOptions {
  onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error') => void;
  onResponse?: (responses: LiveResponse[]) => void;
  onError?: (error: string) => void;
  systemInstruction?: string;
  voiceName?: string;
}

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  public connected: boolean = false;
  private options: GeminiLiveOptions;

  constructor(options: GeminiLiveOptions = {}) {
    this.options = options;
  }

  /**
   * Connect to Gemini Live WebSocket API using an Ephemeral Token or API key
   */
  public async connect(ephemeralToken: string, host = 'generativelanguage.googleapis.com'): Promise<boolean> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return true;
    }

    this.options.onStatusChange?.('connecting');

    const isApiKey = ephemeralToken.startsWith('AIzaSy');
    const wsUrl = isApiKey
      ? `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${ephemeralToken}`
      : `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${ephemeralToken}`;

    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(wsUrl);
        this.ws = ws;

        ws.onopen = () => {
          this.connected = true;
          this.options.onStatusChange?.('connected');
          this.sendSetupMessage();
          resolve(true);
        };

        ws.onclose = (evt) => {
          this.connected = false;
          this.ws = null;
          if (evt.code !== 1000 && evt.code !== 1005) {
            const reason = evt.reason ? `: ${evt.reason}` : '';
            this.options.onError?.(`Live call connection closed by server (Code ${evt.code}${reason})`);
          }
          this.options.onStatusChange?.('disconnected');
        };

        ws.onerror = (_err) => {
          this.connected = false;
          const errMsg = 'Gemini Live WebSocket Connection Error';
          this.options.onError?.(errMsg);
          this.options.onStatusChange?.('error');
          reject(new Error(errMsg));
        };

        ws.onmessage = async (event) => {
          let dataStr = event.data;
          if (dataStr instanceof Blob) {
            dataStr = await dataStr.text();
          } else if (dataStr instanceof ArrayBuffer) {
            dataStr = new TextDecoder().decode(dataStr);
          }

          try {
            const data = JSON.parse(dataStr);
            const responses = this.parseResponseMessages(data);
            if (responses.length > 0) {
              this.options.onResponse?.(responses);
            }
          } catch (parseErr) {
            console.error('Failed to parse server message:', parseErr, dataStr);
          }
        };
      } catch (err: any) {
        this.options.onError?.(err.message || 'Failed to initialize WebSocket');
        this.options.onStatusChange?.('error');
        reject(err);
      }
    });
  }

  /**
   * Sends initial setup configuration to Gemini Live server
   */
  private sendSetupMessage() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const setupMsg = {
      setup: {
        model: 'models/gemini-2.0-flash-exp',
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.options.voiceName || 'Aoede',
              },
            },
          },
        },
        systemInstruction: {
          parts: [
            {
              text:
                this.options.systemInstruction ||
                'You are Maraki AI, an encouraging and patient English conversation tutor. Speak clearly and give friendly audio guidance.',
            },
          ],
        },
      },
    };

    this.ws.send(JSON.stringify(setupMsg));
  }

  /**
   * Send 16kHz PCM audio chunk to Gemini
   */
  public sendAudioChunk(base64PcmAudio: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const pcmMsg = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'audio/pcm;rate=16000',
            data: base64PcmAudio,
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(pcmMsg));
  }

  /**
   * Send text prompt or user message
   */
  public sendTextMessage(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const textMsg = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        turnComplete: true,
      },
    };

    this.ws.send(JSON.stringify(textMsg));
  }

  /**
   * Interrupt current model turn playback
   */
  public interrupt() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const interruptMsg = {
      clientContent: {
        turnComplete: true,
      },
    };

    this.ws.send(JSON.stringify(interruptMsg));
  }

  /**
   * Send tool response
   */
  public sendToolResponse(functionResponses: Array<{ name: string; response: object; id?: string }>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const toolMsg = {
      toolResponse: {
        functionResponses,
      },
    };

    this.ws.send(JSON.stringify(toolMsg));
  }

  /**
   * Close WebSocket connection
   */
  public disconnect() {
    const ws = this.ws;
    this.ws = null;
    this.connected = false;
    if (ws) {
      ws.onclose = null;
      ws.onerror = null;
      try {
        ws.close();
      } catch (e) {}
    }
    this.options.onStatusChange?.('disconnected');
  }

  /**
   * Parse Gemini Live server response messages
   */
  private parseResponseMessages(data: any): LiveResponse[] {
    const responses: LiveResponse[] = [];
    const serverContent = data?.serverContent;
    const parts = serverContent?.modelTurn?.parts;

    try {
      if (data?.setupComplete) {
        responses.push({ type: MultimodalLiveResponseType.SETUP_COMPLETE, endOfTurn: false });
        return responses;
      }

      if (data?.toolCall) {
        responses.push({ type: MultimodalLiveResponseType.TOOL_CALL, data: data.toolCall, endOfTurn: false });
        return responses;
      }

      if (parts?.length) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            responses.push({ type: MultimodalLiveResponseType.AUDIO, data: part.inlineData.data, endOfTurn: false });
          } else if (part.text) {
            responses.push({ type: MultimodalLiveResponseType.TEXT, data: part.text, endOfTurn: false });
          }
        }
      }

      if (serverContent?.inputTranscription) {
        responses.push({
          type: MultimodalLiveResponseType.INPUT_TRANSCRIPTION,
          data: {
            text: serverContent.inputTranscription.text || '',
            finished: serverContent.inputTranscription.finished || false,
          },
          endOfTurn: false,
        });
      }

      if (serverContent?.outputTranscription) {
        responses.push({
          type: MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION,
          data: {
            text: serverContent.outputTranscription.text || '',
            finished: serverContent.outputTranscription.finished || false,
          },
          endOfTurn: false,
        });
      }

      if (serverContent?.interrupted) {
        responses.push({ type: MultimodalLiveResponseType.INTERRUPTED, endOfTurn: false });
      }

      if (serverContent?.turnComplete) {
        responses.push({ type: MultimodalLiveResponseType.TURN_COMPLETE, endOfTurn: true });
      }
    } catch (err) {
      console.error('Error parsing response data:', err, data);
    }

    return responses;
  }
}
