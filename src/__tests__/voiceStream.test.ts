import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioStreamer, AudioPlayer } from '../lib/mediaUtils';
import { UsageQueue } from '../utils/usageQueue.util';
import * as apiModule from '../services/api';

// ─── AudioStreamer ─────────────────────────────────────────────────────────────

describe('AudioStreamer', () => {
  let streamer: AudioStreamer;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      connected: true,
      sendAudioChunk: vi.fn(),
    };
    streamer = new AudioStreamer(mockClient);
  });

  afterEach(() => {
    streamer.stop();
  });

  it('starts streaming and acquires a MediaStream', async () => {
    await streamer.start();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    expect(streamer.isStreaming).toBe(true);
  });

  it('does not start twice if already streaming', async () => {
    await streamer.start();
    await streamer.start();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
  });

  it('stops cleanly without throwing', async () => {
    await streamer.start();
    expect(() => streamer.stop()).not.toThrow();
    expect(streamer.isStreaming).toBe(false);
  });
});

// ─── AudioPlayer ───────────────────────────────────────────────────────────────

describe('AudioPlayer', () => {
  let player: AudioPlayer;

  const makeSilencePcm = (samples = 4): string => {
    const bytes = new Uint8Array(samples * 2);
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
    expect(() => player.playChunk(makeSilencePcm())).not.toThrow();
  });

  it('queues multiple chunks and tracks them in activeSources', () => {
    player.playChunk(makeSilencePcm());
    player.playChunk(makeSilencePcm());
    const sources = (player as any).activeSources as unknown[];
    expect(sources.length).toBe(2);
  });

  it('stop() clears queued nodes (barge-in)', () => {
    player.playChunk(makeSilencePcm());
    player.playChunk(makeSilencePcm());
    player.stop();
    const sources = (player as any).activeSources as unknown[];
    expect(sources.length).toBe(0);
  });

  it('schedules chunks sequentially (nextStartTime increases)', () => {
    player.playChunk(makeSilencePcm(2400));
    const t1 = (player as any).nextStartTime;
    player.playChunk(makeSilencePcm(2400));
    const t2 = (player as any).nextStartTime;
    expect(t2).toBeGreaterThan(t1);
  });

  it('handles an odd-length byte buffer gracefully', () => {
    const oddBytes = new Uint8Array(3);
    let binary = '';
    for (let i = 0; i < oddBytes.length; i++) binary += String.fromCharCode(oddBytes[i]);
    expect(() => player.playChunk(btoa(binary))).not.toThrow();
  });
});

// ─── UsageQueue (offline telemetry) ───────────────────────────────────────────

describe('UsageQueue', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('enqueue() persists usage to localStorage', () => {
    UsageQueue.enqueue(123456, 50);
    const raw = localStorage.getItem('maraki_pending_voice_usage');
    expect(raw).not.toBeNull();
    const items = JSON.parse(raw!);
    expect(items).toHaveLength(1);
    expect(items[0].telegramId).toBe(123456);
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
    expect(body.durationSeconds).toBe(51);
  });

  it('sendBeaconSync() does nothing for zero duration', () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    UsageQueue.sendBeaconSync(123456, 0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('syncPendingUsage() clears queue after successful POST', async () => {
    UsageQueue.enqueue(111, 45);

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

    expect(UsageQueue.getQueue()).toHaveLength(1);
  });
});
