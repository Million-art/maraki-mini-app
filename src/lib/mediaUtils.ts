import { GeminiLiveClient } from './geminiLiveClient';

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
  private sampleRate: number = 16000;

  constructor(client: GeminiLiveClient) {
    this.client = client;
  }

  public async start(deviceId?: string): Promise<boolean> {
    if (this.isStreaming) return true;

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

      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtx({ sampleRate: this.sampleRate });

        await this.audioContext.audioWorklet.addModule('/audio-processors/capture.worklet.js');

        this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-capture-processor');

        this.audioWorkletNode.port.onmessage = (event) => {
          if (!this.isStreaming) return;
          if (event.data.type === 'audio') {
            const inputData: Float32Array = event.data.data;
            const pcm16Data = this.convertToPCM16(inputData);
            const base64Audio = this.arrayBufferToBase64(pcm16Data);
            if (this.client.connected) {
              this.client.sendAudioChunk(base64Audio);
            }
          }
        };
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
 * Audio Player - Queue and play 24kHz PCM audio chunks returned from Gemini Live API
 */
export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private sampleRate: number = 24000;
  private onEndedCallback: (() => void) | null = null;

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
    source.connect(this.audioContext.destination);

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
