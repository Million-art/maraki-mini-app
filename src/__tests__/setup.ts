// Global test setup — mock Web Audio API and browser globals not available in jsdom

// ── AudioContext mock ──────────────────────────────────────────────────────────
class MockAudioBufferSourceNode {
  buffer: any = null;
  onended: (() => void) | null = null;

  connect(_dest: any) {}
  start(_when?: number) {}
  stop() { this.onended?.(); }
}

class MockAudioBuffer {
  numberOfChannels: number;
  length: number;
  sampleRate: number;

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
  }
  get duration() {
    return this.length / this.sampleRate;
  }
  getChannelData(_channel: number) {
    return new Float32Array(this.length);
  }
}

class MockScriptProcessorNode {
  onaudioprocess: ((e: any) => void) | null = null;
  connect(_dest: any) {}
  disconnect() {}
}

class MockMediaStreamSourceNode {
  connect(_dest: any) {}
  disconnect() {}
}

class MockAudioContext {
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  sampleRate: number;
  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined),
  };

  constructor(options?: { sampleRate?: number }) {
    this.sampleRate = options?.sampleRate ?? 44100;
  }

  createMediaStreamSource(_stream: MediaStream): MockMediaStreamSourceNode {
    return new MockMediaStreamSourceNode();
  }

  createScriptProcessor(
    _bufferSize: number,
    _inputChannels: number,
    _outputChannels: number,
  ): MockScriptProcessorNode {
    return new MockScriptProcessorNode();
  }

  createBufferSource(): MockAudioBufferSourceNode {
    return new MockAudioBufferSourceNode();
  }

  createBuffer(
    channels: number,
    length: number,
    sampleRate: number,
  ): MockAudioBuffer {
    return new MockAudioBuffer(channels, length, sampleRate);
  }

  resume() { this.state = 'running'; }
  suspend() { this.state = 'suspended'; }
  close() {}
}

class MockAudioWorkletNode {
  port = { onmessage: null as any };
  connect() {}
  disconnect() {}
}

(global as any).AudioContext = MockAudioContext;
(global as any).webkitAudioContext = MockAudioContext;
(global as any).AudioWorkletNode = MockAudioWorkletNode;

// ── navigator.mediaDevices.getUserMedia mock ───────────────────────────────────
const mockTrack = { stop: vi.fn() };
const mockMediaStream = { getTracks: () => [mockTrack] } as unknown as MediaStream;

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
  },
  writable: true,
});

// ── window.btoa / atob ────────────────────────────────────────────────────────
if (typeof window.btoa === 'undefined') {
  window.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
  window.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}

// ── navigator.sendBeacon mock ─────────────────────────────────────────────────
Object.defineProperty(global.navigator, 'sendBeacon', {
  value: vi.fn().mockReturnValue(true),
  writable: true,
});

// ── localStorage mock ─────────────────────────────────────────────────────────
const localStorageStore: Record<string, string> = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: (key: string) => localStorageStore[key] ?? null,
    setItem: (key: string, value: string) => { localStorageStore[key] = value; },
    removeItem: (key: string) => { delete localStorageStore[key]; },
    clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); },
  },
  writable: true,
});
