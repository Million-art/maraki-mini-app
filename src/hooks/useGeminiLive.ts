import { useRef, useState, useEffect, useCallback } from 'react';
import { GeminiLiveClient, MultimodalLiveResponseType } from '../lib/geminiLiveClient';
import { AudioPlayer } from '../lib/mediaUtils';
import { ApiService, API_ENDPOINTS } from '../config/api';

export function useGeminiLive() {
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  useEffect(() => {
    const player = new AudioPlayer();
    audioPlayerRef.current = player;
    player.onEnded(() => {
      setPlayingMessageId(null);
    });

    return () => {
      audioPlayerRef.current?.stop();
      clientRef.current?.disconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    if (clientRef.current?.connected) return;

    try {
      let token = '';
      try {
        const res: any = await ApiService.post(API_ENDPOINTS.EPHEMERAL_TOKEN);
        token = res?.token || res?.name || '';
      } catch (err) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          console.warn('No backend token or VITE_GEMINI_API_KEY available.');
          return;
        }
        token = apiKey;
      }

      const client = new GeminiLiveClient({
        onStatusChange: (status) => {
          setIsConnected(status === 'connected');
        },
        onResponse: (responses) => {
          for (const res of responses) {
            if (res.type === MultimodalLiveResponseType.AUDIO && res.data) {
              audioPlayerRef.current?.playChunk(res.data);
            }
          }
        },
      });

      clientRef.current = client;
      await client.connect(token);
    } catch (err) {
      console.error('Failed to connect useGeminiLive:', err);
    }
  }, []);

  const stopAudio = useCallback(() => {
    audioPlayerRef.current?.stop();
    setPlayingMessageId(null);
    clientRef.current?.interrupt();
  }, []);

  const playText = useCallback(
    async (text: string, messageId: string) => {
      if (!isConnected || !clientRef.current?.connected) {
        await connect();
      }

      stopAudio();
      setPlayingMessageId(messageId);

      const sendMsg = () => {
        clientRef.current?.sendTextMessage(
          `Please read the following text exactly as written, without adding any commentary or extra words:\n\n${text}`
        );
      };

      if (clientRef.current?.connected) {
        sendMsg();
      } else {
        const interval = setInterval(() => {
          if (clientRef.current?.connected) {
            clearInterval(interval);
            sendMsg();
          }
        }, 100);
      }
    },
    [isConnected, connect, stopAudio]
  );

  return { playText, stopAudio, playingMessageId, isConnected, connect };
}
