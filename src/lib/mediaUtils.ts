import { GeminiLiveClient } from './geminiLiveClient';

export interface VideoStreamOptions {
  fps?: number;
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  quality?: number;
  deviceId?: string;
}

export interface ScreenCaptureOptions {
  fps?: number;
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Base Video Capture - Shared functionality for video/screen capture
 */
export class BaseVideoCapture {
  protected client: GeminiLiveClient;
  protected video: HTMLVideoElement | null = null;
  protected canvas: HTMLCanvasElement | null = null;
  protected ctx: CanvasRenderingContext2D | null = null;
  protected mediaStream: MediaStream | null = null;
  public isStreaming: boolean = false;
  protected captureInterval: any = null;
  protected fps: number = 1; // Default 1 frame per second
  protected quality: number = 0.8; // Default JPEG quality

  constructor(geminiClient: GeminiLiveClient) {
    this.client = geminiClient;
  }

  /**
   * Initialize canvas and video elements
   */
  protected initializeElements(width: number, height: number) {
    this.video = document.createElement('video');
    this.video.srcObject = this.mediaStream;
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.muted = true;

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * Wait for video metadata to be loaded and start playing
   */
  protected async waitForVideoReady(): Promise<void> {
    if (!this.video) return;
    await new Promise<void>((resolve) => {
      if (this.video) {
        this.video.onloadedmetadata = () => resolve();
      } else {
        resolve();
      }
    });
    await this.video.play();
  }

  /**
   * Start capturing and sending frames
   */
  protected startCapturing() {
    const captureFrame = () => {
      if (!this.isStreaming || !this.ctx || !this.video || !this.canvas) return;

      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

      this.canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result?.split(',')[1];
            if (this.client && this.client.connected && base64) {
              this.client.sendImageMessage(base64, 'image/jpeg');
            }
          };
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        this.quality,
      );
    };

    this.captureInterval = setInterval(captureFrame, 1000 / this.fps);
  }

  /**
   * Stop capturing
   */
  public stop() {
    this.isStreaming = false;

    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }

    this.canvas = null;
    this.ctx = null;
  }

  /**
   * Take a single snapshot
   */
  public takeSnapshot(): string {
    if (!this.video || !this.canvas || !this.ctx) {
      throw new Error('Video element not initialized');
    }

    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    return this.canvas.toDataURL('image/jpeg', this.quality);
  }

  /**
   * Get the video element for UI preview
   */
  public getVideoElement(): HTMLVideoElement | null {
    return this.video;
  }
}

/**
 * Video Streamer - Captures and streams camera video to Gemini Live
 */
export class VideoStreamer extends BaseVideoCapture {
  public async start(options: VideoStreamOptions = {}): Promise<HTMLVideoElement> {
    try {
      const { fps = 1, width = 640, height = 480, facingMode = 'user', quality = 0.8, deviceId = null } = options;

      this.fps = fps;
      this.quality = quality;

      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: width },
        height: { ideal: height },
      };

      if (deviceId) {
        videoConstraints.deviceId = { exact: deviceId };
      } else {
        videoConstraints.facingMode = facingMode;
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
      });

      this.initializeElements(width, height);
      await this.waitForVideoReady();

      this.isStreaming = true;
      this.startCapturing();

      console.log('📹 Camera streaming started at', fps, 'fps');
      return this.video!;
    } catch (error) {
      console.error('Failed to start camera streaming:', error);
      throw error;
    }
  }

  public override stop() {
    super.stop();
    console.log('🛑 Camera streaming stopped');
  }
}

/**
 * Screen Capture - Captures and streams screen/window to Gemini Live
 */
export class ScreenCapture extends BaseVideoCapture {
  public async start(options: ScreenCaptureOptions = {}): Promise<HTMLVideoElement> {
    try {
      const { fps = 1, width = 1280, height = 720, quality = 0.7 } = options;

      this.fps = fps;
      this.quality = quality;

      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      });

      this.initializeElements(width, height);
      await this.waitForVideoReady();

      this.isStreaming = true;
      this.startCapturing();

      const videoTrack = this.mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log('User stopped screen sharing');
          this.stop();
        };
      }

      console.log('🖥️ Screen capture started at', fps, 'fps');
      return this.video!;
    } catch (error) {
      console.error('Failed to start screen capture:', error);
      throw error;
    }
  }

  public override stop() {
    super.stop();
    console.log('🛑 Screen capture stopped');
  }
}

/**
 * Audio Streamer - Captures microphone audio at 16kHz PCM and streams to Gemini Live Client
 */
export class AudioStreamer {
  private client: GeminiLiveClient;
  private audioContext: AudioContext | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private mediaStream: MediaStream | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  public isStreaming: boolean = false;
  public onVoiceActivity?: () => void;
  private lastVADTime: number = 0;
  private sampleRate: number = 16000;

  constructor(client: GeminiLiveClient) {
    this.client = client;
  }

  public async start(deviceId?: string): Promise<boolean> {
    if (this.isStreaming) return true;

    try {
      try {
        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        };
        if (deviceId) {
          audioConstraints.deviceId = { exact: deviceId };
        }
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
        });
      } catch (constraintErr) {
        console.warn('Constrained getUserMedia failed, retrying with fallback { audio: true }...', constraintErr);
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtx({ sampleRate: this.sampleRate });

        try {
          await this.audioContext.audioWorklet.addModule('/audio-processors/capture.worklet.js');
          this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-capture-processor');

          this.audioWorkletNode.port.onmessage = (event) => {
            if (!this.isStreaming) return;
            if (event.data.type === 'audio') {
              const inputData: Float32Array = event.data.data;
              
              let sumSq = 0;
              // Sample a subset of the array for performance & silence gating
              for (let i = 0; i < inputData.length; i += 4) {
                sumSq += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sumSq / (inputData.length / 4));

              if (this.onVoiceActivity) {
                // Simple RMS threshold for voice activity detection
                if (rms > 0.03) {
                  const now = Date.now();
                  // Debounce thinking state updates to once every 500ms
                  if (now - this.lastVADTime > 500) {
                    this.onVoiceActivity();
                    this.lastVADTime = now;
                  }
                }
              }

              // SILENCE GATE VAD: If audio volume is below speech threshold (rms < 0.015), skip sending PCM audio chunks to save API costs
              if (rms < 0.015) {
                return;
              }

              const pcm16Data = this.convertToPCM16(inputData);
              const base64Audio = this.arrayBufferToBase64(pcm16Data);
              if (this.client.connected) {
                this.client.sendAudioChunk(base64Audio);
              }
            }
          };
        } catch (workletErr) {
          console.warn('Audio worklet not loaded, using fallback audio capture:', workletErr);
        }
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.audioSource = this.audioContext.createMediaStreamSource(this.mediaStream);
      if (this.audioWorkletNode) {
        this.audioSource.connect(this.audioWorkletNode);
      }

      this.isStreaming = true;
      return true;
    } catch (err) {
      console.error('Failed to start microphone audio streamer:', err);
      throw err;
    }
  }

  public stop() {
    this.isStreaming = false;

    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
    }

    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  public destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  public setMuted(muted: boolean) {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }


  private convertToPCM16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * Audio Player - Queue and play 24kHz PCM audio responses from Gemini Live API
 */
export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private sampleRate: number = 24000;
  private onEndedCallback: (() => void) | null = null;
  private volume: number = 1.0;

  constructor() {
    this.initContext();
  }

  private initContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: this.sampleRate });
    }
  }

  public onEnded(callback: () => void) {
    this.onEndedCallback = callback;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Play base64 encoded PCM 24kHz 16-bit audio chunk
   */
  public playChunk(base64Audio: string) {
    this.initContext();
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const arrayBuffer = this.base64ToArrayBuffer(base64Audio);
    const float32Data = this.pcm16ToFloat32(arrayBuffer);

    const audioBuffer = this.audioContext.createBuffer(1, float32Data.length, this.sampleRate);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;

    if (this.volume !== 1.0) {
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = this.volume;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
    } else {
      source.connect(this.audioContext.destination);
    }

    const currentTime = this.audioContext.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;

    this.activeSources.push(source);

    source.onended = () => {
      const idx = this.activeSources.indexOf(source);
      if (idx !== -1) {
        this.activeSources.splice(idx, 1);
      }
      if (this.activeSources.length === 0) {
        this.onEndedCallback?.();
      }
    };
  }

  /**
   * Clear queued audio immediately (e.g. user barge-in / interruption)
   */
  public stop() {
    this.activeSources.forEach((src) => {
      try {
        src.stop();
      } catch (e) {
        // ignore already stopped
      }
    });
    this.activeSources = [];
    if (this.audioContext) {
      this.nextStartTime = this.audioContext.currentTime;
    }
  }

  public destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private pcm16ToFloat32(buffer: ArrayBuffer): Float32Array {
    const validLength = Math.floor(buffer.byteLength / 2) * 2;
    const int16Array = new Int16Array(buffer, 0, validLength / 2);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768;
    }
    return float32Array;
  }
}
