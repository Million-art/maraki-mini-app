/**
 * Maraki Audio Recorder Utility
 * Captures Gemini Live 24kHz PCM chunks and converts them to standard WAV format.
 */

export class AudioRecordingSession {
  private pcmChunks: ArrayBuffer[] = [];
  private isRecording: boolean = false;
  private startTime: number = 0;
  private duration: number = 0;
  private sampleRate: number = 24000;

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
  }

  public start() {
    this.pcmChunks = [];
    this.isRecording = true;
    this.startTime = Date.now();
    this.duration = 0;
  }

  public addBase64Chunk(base64: string) {
    if (!this.isRecording || !base64) return;
    try {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      this.pcmChunks.push(bytes.buffer);
    } catch (e) {
      console.warn('[AudioRecorder] Failed to decode audio chunk:', e);
    }
  }

  public stop(): { blob: Blob; url: string; durationSeconds: number } | null {
    if (!this.isRecording && this.pcmChunks.length === 0) return null;
    this.isRecording = false;
    this.duration = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

    if (this.pcmChunks.length === 0) {
      return null;
    }

    const blob = this.createWavBlob();
    const url = URL.createObjectURL(blob);

    return {
      blob,
      url,
      durationSeconds: this.duration,
    };
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public getDurationSeconds(): number {
    if (!this.isRecording) return this.duration;
    return Math.max(0, Math.round((Date.now() - this.startTime) / 1000));
  }

  private createWavBlob(): Blob {
    const totalLength = this.pcmChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
    const buffer = new ArrayBuffer(44 + totalLength);
    const view = new DataView(buffer);

    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = this.sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);

    // "RIFF"
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + totalLength, true);
    this.writeString(view, 8, 'WAVE');

    // "fmt "
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // PCM Format = 1
    view.setUint16(22, numChannels, true);
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // "data"
    this.writeString(view, 36, 'data');
    view.setUint32(40, totalLength, true);

    // Copy audio bytes
    let offset = 44;
    for (const chunk of this.pcmChunks) {
      const uint8View = new Uint8Array(chunk);
      new Uint8Array(buffer, offset, chunk.byteLength).set(uint8View);
      offset += chunk.byteLength;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
