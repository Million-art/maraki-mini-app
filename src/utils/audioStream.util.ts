/**
 * AudioRecorder & AudioPlayer Utilities for Gemini 3.1 Flash Live API
 *
 * Gemini Live API Spec:
 * Input Audio: 16kHz 16-bit Mono PCM (Little-Endian)
 * Output Audio: 24kHz 16-bit Mono PCM (Little-Endian)
 */

export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private onAudioChunk: ((base64Pcm: string) => void) | null = null;
  private isRecording = false;

  constructor(onAudioChunk: (base64Pcm: string) => void) {
    this.onAudioChunk = onAudioChunk;
  }

  async start(): Promise<void> {
    if (this.isRecording) return;

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass({ sampleRate: 16000 });
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);

    // 4096 buffer size at 16kHz ≈ 256ms chunk size
    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = this.float32ToInt16(inputData);
      const base64 = this.arrayBufferToBase64(pcm16.buffer);
      if (this.onAudioChunk) {
        this.onAudioChunk(base64);
      }
    };

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);
    this.isRecording = true;
  }

  stop(): void {
    this.isRecording = false;
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private float32ToInt16(buffer: Float32Array): Int16Array {
    const int16Array = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  private arrayBufferToBase64(buffer: ArrayBufferLike): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private activeBufferNodes: AudioBufferSourceNode[] = [];

  constructor() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass({ sampleRate: 24000 });
  }

  playBase64Pcm(base64Pcm: string): void {
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const binaryString = window.atob(base64Pcm);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / (int16[i] < 0 ? 32768 : 32767);
    }

    const buffer = this.audioContext.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    const currentTime = this.audioContext.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }

    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    this.activeBufferNodes.push(source);

    source.onended = () => {
      const idx = this.activeBufferNodes.indexOf(source);
      if (idx !== -1) {
        this.activeBufferNodes.splice(idx, 1);
      }
    };
  }

  // Flushes pending audio queue immediately on user interruption (Barge-in)
  clearQueue(): void {
    for (const node of this.activeBufferNodes) {
      try {
        node.stop();
      } catch {}
    }
    this.activeBufferNodes = [];
    if (this.audioContext) {
      this.nextStartTime = this.audioContext.currentTime;
    }
  }

  stop(): void {
    this.clearQueue();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
