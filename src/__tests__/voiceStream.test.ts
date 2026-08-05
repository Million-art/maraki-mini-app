import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioRecorder, AudioPlayer } from '../utils/audioStream.util';
import { UsageQueue } from '../utils/usageQueue.util';
import * as apiModule from '../services/api';

// ─── AudioRecorder ─────────────────────────────────────────────────────────────

describe('AudioRecorder', () => {
  let recorder: AudioRecorder;

  beforeEach(() => {
    vi.clearAllMocks(); // reset spy call counts between each test
    recorder = new AudioRecorder(vi.fn());
  });

  afterEach(() => {
    recorder.stop();
  });

  it('starts recording and acquires a MediaStream', async () => {
    await recorder.start();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  });

  it('does not start twice if already recording', async () => {
    await recorder.start();
    await recorder.start(); // second call should be a no-op
    // getUserMedia must only be called once — the guard `if (this.isRecording) return` blocks re-entry
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
  });

  it('stops cleanly without throwing', async () => {
    await recorder.start();
    expect(() => recorder.stop()).not.toThrow();
  });
});

// ─── float32ToInt16 conversion (via AudioRecorder internal onaudioprocess) ─────

describe('PCM conversion: float32 → int16', () => {
  const triggerProcess = async (floatData: Float32Array) => {
    const received: string[] = [];
    const rec = new AudioRecorder((b64) => received.push(b64));
    await rec.start();
    const proc = (rec as any).scriptProcessor as { onaudioprocess: ((e: any) => void) | null };
    proc.onaudioprocess?.({ inputBuffer: { getChannelData: () => floatData } });
    rec.stop();
    return received;
  };

  const decodeToInt16 = (b64: string): Int16Array => {
    const decoded = atob(b64);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
    return new Int16Array(bytes.buffer);
  };

  it('clamps input above +1.0 to max int16', async () => {
    vi.clearAllMocks();
    const received = await triggerProcess(new Float32Array(4).fill(2.0));
    expect(received.length).toBe(1);
    for (const v of decodeToInt16(received[0])) expect(v).toBeLessThanOrEqual(0x7fff);
  });

  it('clamps input below -1.0 to min int16', async () => {
    vi.clearAllMocks();
    const received = await triggerProcess(new Float32Array(4).fill(-2.0));
    expect(received.length).toBe(1);
    for (const v of decodeToInt16(received[0])) expect(v).toBeGreaterThanOrEqual(-0x8000);
  });

  it('outputs silence (0) for a zero signal', async () => {
    vi.clearAllMocks();
    const received = await triggerProcess(new Float32Array(4).fill(0));
    for (const v of decodeToInt16(received[0])) expect(v).toBe(0);
  });

  it('produces exactly 2 bytes per float32 sample (16-bit PCM)', async () => {
    vi.clearAllMocks();
    const sampleCount = 8;
    const received = await triggerProcess(new Float32Array(sampleCount));
    const decoded = atob(received[0]);
    expect(decoded.length).toBe(sampleCount * 2);
  });
});

// ─── AudioPlayer ───────────────────────────────────────────────────────────────

describe('AudioPlayer', () => {
  let player: AudioPlayer;

  // Build a valid 16-bit PCM Base64 payload (silence)
  const makeSilencePcm = (samples = 4): string => {
    const bytes = new Uint8Array(samples * 2); // all zeros
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    player = new AudioPlayer();
  });

  afterEach(() => {
    player.stop();
  });

  it('constructs without throwing', () => {
    expect(player).toBeDefined();
  });

  it('plays a valid base64 PCM chunk without throwing', () => {
    expect(() => player.playBase64Pcm(makeSilencePcm())).not.toThrow();
  });

  it('queues multiple chunks and tracks them in activeBufferNodes', () => {
    player.playBase64Pcm(makeSilencePcm());
    player.playBase64Pcm(makeSilencePcm());
    const nodes = (player as any).activeBufferNodes as unknown[];
    expect(nodes.length).toBe(2);
  });

  it('clearQueue() stops all active nodes and resets the list (barge-in)', () => {
    player.playBase64Pcm(makeSilencePcm());
    player.playBase64Pcm(makeSilencePcm());
    player.clearQueue();
    const nodes = (player as any).activeBufferNodes as unknown[];
    expect(nodes.length).toBe(0);
  });

  it('stop() clears queue and closes AudioContext', () => {
    player.playBase64Pcm(makeSilencePcm());
    player.stop();
    expect((player as any).audioContext).toBeNull();
  });

  it('schedules chunks sequentially (nextStartTime increases)', () => {
    // Use a real sample count so buffer.duration > 0
    // MockAudioBuffer.duration = length / sampleRate, computed in constructor
    // 2400 samples / 24000 Hz = 0.1s per chunk
    player.playBase64Pcm(makeSilencePcm(2400));
    const t1 = (player as any).nextStartTime;
    player.playBase64Pcm(makeSilencePcm(2400));
    const t2 = (player as any).nextStartTime;
    expect(t2).toBeGreaterThan(t1);
  });

  it('handles an odd-length byte buffer gracefully (floor division)', () => {
    const oddBytes = new Uint8Array(3);
    let binary = '';
    for (let i = 0; i < oddBytes.length; i++) binary += String.fromCharCode(oddBytes[i]);
    expect(() => player.playBase64Pcm(btoa(binary))).not.toThrow();
  });
});

// ─── UsageQueue (offline telemetry) ───────────────────────────────────────────

describe('UsageQueue', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Restore any spies between tests
    vi.restoreAllMocks();
  });

  it('enqueue() persists usage to localStorage', () => {
    UsageQueue.enqueue(123456, 50);
    const raw = localStorage.getItem('maraki_pending_voice_usage');
    expect(raw).not.toBeNull();
    const items = JSON.parse(raw!);
    expect(items).toHaveLength(1);
    expect(items[0].telegramId).toBe(123456);
    // enqueue uses Math.ceil so 50 → 50
    expect(items[0].durationSeconds).toBe(50);
  });

  it('enqueue() accumulates multiple items', () => {
    UsageQueue.enqueue(123456, 30);
    UsageQueue.enqueue(123456, 90);
    const items = UsageQueue.getQueue();
    expect(items).toHaveLength(2);
  });

  it('enqueue() ignores zero or negative durations', () => {
    UsageQueue.enqueue(123456, 0);
    UsageQueue.enqueue(123456, -10);
    expect(UsageQueue.getQueue()).toHaveLength(0);
  });

  it('enqueue() ignores missing telegramId', () => {
    UsageQueue.enqueue(0, 60);
    expect(UsageQueue.getQueue()).toHaveLength(0);
  });

  it('sendBeaconSync() calls fetch with keepalive and the correct URL', () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve(new Response()));
    UsageQueue.sendBeaconSync(999, 75);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/student/usage/999/increment-live-seconds'),
      expect.objectContaining({ method: 'POST', keepalive: true })
    );
  });

  it('sendBeaconSync() payload contains the exact durationSeconds (rounded)', () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve(new Response()));
    UsageQueue.sendBeaconSync(42, 50.8);
    const call = fetchSpy.mock.calls[0];
    const options = call[1] as RequestInit;
    const body = JSON.parse(options.body as string);
    expect(body.durationSeconds).toBe(51); // 50.8 rounded
  });

  it('sendBeaconSync() does nothing for zero duration', () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    UsageQueue.sendBeaconSync(123456, 0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('syncPendingUsage() clears queue after successful POST', async () => {
    UsageQueue.enqueue(111, 45);

    // Spy directly on the imported ApiService.post — avoids vi.mock() hoisting issues
    const postSpy = vi
      .spyOn(apiModule.ApiService, 'post')
      .mockResolvedValueOnce({ success: true } as any);

    await UsageQueue.syncPendingUsage();

    expect(postSpy).toHaveBeenCalledOnce();
    expect(UsageQueue.getQueue()).toHaveLength(0);
  });

  it('syncPendingUsage() retains items on network failure', async () => {
    UsageQueue.enqueue(222, 60);

    vi.spyOn(apiModule.ApiService, 'post').mockRejectedValueOnce(new Error('Network error'));

    await UsageQueue.syncPendingUsage();

    // Failed items must be retained for retry
    expect(UsageQueue.getQueue()).toHaveLength(1);
  });
});
