import { useState, useEffect, useRef, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  PhoneOff,
  Mic,
  Phone,
  MicOff,
  MessageSquare,
  Send,
  Disc,
  Crown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { retrieveLaunchParams, postEvent, on } from '@tma.js/sdk';
import { buildSessionInstruction } from '../../services/coachingOrchestrator';
import { useGeminiLive } from '../../hooks/useGeminiLive';
import ChatInput from '../../components/ChatInput';
import { ApiService, API_ENDPOINTS } from '../../config/api';
import { GeminiLiveService } from '../../services/geminiLive.service';
import ChatMessages from '../../components/ChatMessages';

import connectedMascot from '../../assets/connected.gif';
import speakingMascot from '../../assets/speaking.png';
import thinkingMascot from '../../assets/thinking.gif';

declare global { interface Window { Telegram?: any } }

interface Message {
  id: string;
  sender: 'user' | 'ai';
  originalText: string;
  correctedText?: string;
  grammarMistake?: {
    type: string;
    explanation: string;
    nativeAlternative: string;
  };
  timestamp: string;
}

interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  createdTime: number;
}



function FloatingParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map(() => ({
      size: Math.random() * 5 + 3, // 3px to 8px
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      y: [0, -(Math.random() * 60 + 20), 0],
      x: [0, Math.random() * 50 - 25, 0],
      opacity: [0, Math.random() * 0.5 + 0.3, 0],
      scale: [0.8, 1.5, 0.8],
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-visible">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-[#7CBD00] blur-[1px]"
          style={{ width: p.size, height: p.size, top: p.top, left: p.left }}
          animate={{ y: p.y, x: p.x, opacity: p.opacity, scale: p.scale }}
          transition={{ duration: p.duration, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        />
      ))}
    </div>
  );
}

export default function VoiceChatPage() {
  useOutletContext<{ isDarkMode: boolean }>();

  let tgUser: any = null;
  try {
    const launchParams = retrieveLaunchParams();
    tgUser = (launchParams.initData as any)?.user || launchParams.tgWebAppData?.user;
  } catch (e) {
    console.warn("App is running outside of Telegram");
  }

  // Load threads from local storage
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    try {
      const saved = localStorage.getItem('maraki_chat_threads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load threads:', e);
    }

    const initialId = Date.now().toString();
    return [
      {
        id: initialId,
        title: 'Practice Session 1',
        createdTime: Date.now(),
        messages: [
          {
            id: '1',
            sender: 'ai',
            originalText:
              '👋 Welcome to Maraki AI Live Voice Coach! Tap the green mic button to start speaking.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      },
    ];
  });

  const [activeThreadId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('maraki_active_thread_id');
      if (saved) return saved;
    } catch (e) {
      console.error(e);
    }
    return threads[0]?.id || '';
  });

  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);

  // Audio Controls
  const [isMuted, setIsMuted] = useState(false);

  // Gemini Live API States
  const [liveStatus, setLiveStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'thinking' | 'error'
  >('disconnected');
  const [liveError, setLiveError] = useState<string | null>(null);
  const [sessionTopic, setSessionTopic] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(false);
  const liveServiceRef = useRef<GeminiLiveService | null>(null);
  // Keep a ref to threads so effects always read the latest value without stale closures
  const threadsRef = useRef(threads);
  useEffect(() => { threadsRef.current = threads; }, [threads]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { playText: speakText, stopAudio, playingMessageId } = useGeminiLive();

  // Load available microphones
  useEffect(() => {
    async function loadDevices() {
      try {
        await navigator.mediaDevices.enumerateDevices();
      } catch (err) {
        console.error('Failed to enumerate media devices:', err);
      }
    }
    loadDevices();
  }, []);


  const handleSpeakClick = (text: string, messageId: string) => {
    if (playingMessageId === messageId) {
      stopAudio();
    } else {
      speakText(text, messageId);
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const messages = activeThread?.messages || [];

  const telegramId = tgUser?.id || 123456789;

  // Fetch premium status once the Telegram user ID is known
  useEffect(() => {
    if (!telegramId) return;
    ApiService.get<any>(API_ENDPOINTS.STUDENT_BY_TELEGRAM_ID(telegramId))
      .then((data) => {
        const premium = data?.isMarakiPremium || data?.data?.isMarakiPremium || false;
        setIsPremiumUser(premium);
      })
      .catch(() => setIsPremiumUser(false));
  }, [telegramId]);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('maraki_chat_threads', JSON.stringify(threads));
      if (activeThreadId) {
        localStorage.setItem('maraki_active_thread_id', activeThreadId);
      }
    } catch (e) {
      console.error('Failed to save threads:', e);
    }
  }, [threads, activeThreadId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isTranscriptOpen) {
      scrollToBottom();
    }
  }, [messages, liveStatus, isTranscriptOpen]);

  const isFullyConnected = liveStatus === 'listening' || liveStatus === 'speaking' || liveStatus === 'thinking';

  // Listen for Grammar Mistakes reported by Gemini Tools
  useEffect(() => {
    const handleGrammarMistake = (e: any) => {
      const data = e.detail;

      setThreads((prevThreads) =>
        prevThreads.map((t) => {
          if (t.id === activeThreadId) {
            // Find the last user message to update
            const messages = [...t.messages];
            const lastUserMsgIndex = [...messages].reverse().findIndex(m => m.sender === 'user');

            if (lastUserMsgIndex !== -1) {
              const actualIndex = messages.length - 1 - lastUserMsgIndex;
              messages[actualIndex] = {
                ...messages[actualIndex],
                originalText: data.originalText,
                correctedText: data.correctedText,
                grammarMistake: {
                  type: data.mistakeType,
                  explanation: data.explanation,
                  nativeAlternative: data.nativeAlternative,
                }
              };
            } else {
              // Fallback if no user message exists yet
              messages.push({
                id: Date.now().toString(),
                sender: 'user',
                originalText: data.originalText,
                correctedText: data.correctedText,
                grammarMistake: {
                  type: data.mistakeType,
                  explanation: data.explanation,
                  nativeAlternative: data.nativeAlternative,
                },
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              });
            }

            return {
              ...t,
              messages,
            };
          }
          return t;
        }),
      );
      setTimeout(() => scrollToBottom(), 50);
    };

    window.addEventListener('maraki_grammar_mistake', handleGrammarMistake);
    return () => window.removeEventListener('maraki_grammar_mistake', handleGrammarMistake);
  }, [activeThreadId]);

  // Call duration timer effect
  useEffect(() => {
    let timer: any;
    if (isFullyConnected) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isFullyConnected]);

  // Save session and reset timer when a call ends for any reason
  const callDurationRef = useRef(callDuration);
  useEffect(() => { callDurationRef.current = callDuration; }, [callDuration]);

  useEffect(() => {
    if (liveStatus === 'disconnected' || liveStatus === 'error') {
      const duration = callDurationRef.current;
      // Use threadsRef to get the freshest message data, not the stale closure
      const latestThread = threadsRef.current.find(t => t.id === activeThreadId);
      if (duration > 0 && telegramId && latestThread && latestThread.messages.length > 0) {
        ApiService.post(API_ENDPOINTS.SAVE_VOICE_SESSION, {
          telegramId: telegramId.toString(),
          durationSeconds: duration,
          messages: latestThread.messages,
        })
          .then(() => console.log('[Session] Summary saved successfully.'))
          .catch(err => console.error('[Session] Failed to save voice session summary:', err));
      }
      setCallDuration(0);
    }
  }, [liveStatus]);

  // Phone ringing effect while connecting
  useEffect(() => {
    let ringInterval: any;
    let ringCtx: AudioContext | null = null;

    if (liveStatus === 'connecting') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      ringCtx = new AudioCtx();

      const playBeep = () => {
        if (!ringCtx || ringCtx.state === 'closed') return;
        const osc = ringCtx.createOscillator();
        const gain = ringCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 425; // Standard phone ring frequency

        gain.gain.setValueAtTime(0, ringCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ringCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, ringCtx.currentTime + 1.0);
        gain.gain.linearRampToValueAtTime(0, ringCtx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ringCtx.destination);

        osc.start(ringCtx.currentTime);
        osc.stop(ringCtx.currentTime + 1.2);
      };

      // Play immediately, then every 3 seconds
      playBeep();
      ringInterval = setInterval(playBeep, 3000);
    }

    return () => {
      if (ringInterval) clearInterval(ringInterval);
      if (ringCtx && ringCtx.state !== 'closed') {
        ringCtx.close().catch(() => { });
      }
    };
  }, [liveStatus]);

  // Clean up Live Session on unmount
  useEffect(() => {
    return () => {
      liveServiceRef.current?.endSession();
    };
  }, []);

  // 5-Minute Freemium Limit Enforcer (skipped for premium users)
  useEffect(() => {
    const isCallActive = liveStatus !== 'disconnected' && liveStatus !== 'error';
    if (callDuration >= 300 && isCallActive && !isPremiumUser) {
      // 1. End the call immediately
      liveServiceRef.current?.endSession();
      setLiveStatus('disconnected');

      // 2. Open the Telegram upgrade popup
      try {
        postEvent('web_app_open_popup', {
          title: 'Free Preview Ended',
          message: 'You have reached your 5-minute limit. Upgrade to Premium to continue your practice session!',
          buttons: [
            { id: 'upgrade', type: 'default', text: 'Upgrade to Premium' },
            { id: 'close', type: 'cancel' }
          ]
        });
      } catch (err) {
        console.error('Failed to open popup', err);
      }
    }
  }, [callDuration, liveStatus, isPremiumUser]);

  // Handle Popup Close Events
  useEffect(() => {
    try {
      const off = on('popup_closed', (payload) => {
        if (payload?.button_id === 'upgrade') {
          const botUsername = import.meta.env.VITE_BOT_USERNAME || 'marakiai_bot';
          
          // Use internal deep link payload: /resolve?domain=bot_username&start=pay
          const deepLinkPath = `/${botUsername}?start=pay`;
          
          // Open the bot link and close the Mini App
          postEvent('web_app_open_tg_link', { path_full: deepLinkPath });
          postEvent('web_app_close');
        }
      });
      return () => {
        off();
      };
    } catch (err) {
      // Will fail in local dev environment outside Telegram
    }
  }, []);

  // Toggle Live AI Call Session
  const toggleLiveCall = async () => {
    if (liveStatus !== 'disconnected' && liveStatus !== 'error') {
      // End the session — the liveStatus useEffect will handle saving the summary
      liveServiceRef.current?.endSession();
      setLiveStatus('disconnected');
      return;
    }

    setLiveError(null);
    setLiveStatus('connecting'); // Show connecting state immediately

    let systemInstruction: string | undefined = undefined;
    try {
      const userName = tgUser?.firstName || tgUser?.first_name || tgUser?.username || 'there';
      const { systemInstruction: instruction, lesson } = await buildSessionInstruction(
        telegramId,
        userName,
      );
      systemInstruction = instruction;
      setSessionTopic(lesson.topic);
      console.log(`[Orchestrator] Today's lesson: ${lesson.topic} (${lesson.level})`);
    } catch (err) {
      console.warn('[Orchestrator] Failed to build session instruction, using default.', err);
    }

    const service = new GeminiLiveService(telegramId, {
      systemInstruction,
      onStatusChange: (status) => {
        setLiveStatus(status);
      },
      onTranscriptReceived: (sender, text) => {
        if (!text || !text.trim()) return;
        setIsAiTyping(false);

        setThreads((prevThreads) =>
          prevThreads.map((t) => {
            if (t.id === activeThreadId) {
              const lastMsg = t.messages[t.messages.length - 1];

              // If the last message is from the same sender, append to it
              if (lastMsg && lastMsg.sender === sender) {
                const updatedMsg = { ...lastMsg, originalText: lastMsg.originalText + text };
                return {
                  ...t,
                  messages: [...t.messages.slice(0, -1), updatedMsg],
                };
              }

              // Otherwise, create a brand new message bubble
              const newMsg: Message = {
                id: Date.now().toString(),
                sender,
                originalText: text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };

              return {
                ...t,
                messages: [...t.messages, newMsg],
              };
            }
            return t;
          }),
        );
        setTimeout(() => scrollToBottom(), 50);
      },
      onError: (err) => {
        setIsAiTyping(false);
        setLiveError(err);
        // Auto-report production error to Backend & Admin Telegram
        ApiService.post(API_ENDPOINTS.LOG_ERROR, {
          telegramId: telegramId?.toString(),
          name: tgUser?.firstName || tgUser?.first_name || 'Student',
          error: err,
          context: 'VoiceChatPage (Gemini Live)',
        }).catch(() => {});
      },
    });

    liveServiceRef.current = service;
    service.startSession(undefined);
  };

  const handleSendTextMessage = async () => {
    if (!textInputValue.trim()) return;

    const userText = textInputValue.trim();
    setTextInputValue('');

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      originalText: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentHistory = activeThread?.messages || [];

    setThreads((prevThreads) =>
      prevThreads.map((t) => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            messages: [...t.messages, userMsg],
          };
        }
        return t;
      }),
    );
    setIsAiTyping(true);
    setTimeout(() => scrollToBottom(), 50);

    if (liveServiceRef.current && isCallActive) {
      liveServiceRef.current.sendTextMessage(userText);
      setIsAiTyping(false);
      return;
    }

    const aiMsgId = (Date.now() + 1).toString();
    let accumulatedText = '';
    let isMessageAdded = false;

    try {
      let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }

      const response = await fetch(`${baseUrl}${API_ENDPOINTS.CHAT_COMPLETION_STREAM}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: currentHistory,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to connect to real-time chat stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);
              if (data.error) {
                console.error('Server Stream Error:', data.error);
                setLiveError(data.error);
                setIsAiTyping(false);
                break;
              }
              if (data.done) {
                setIsAiTyping(false);
                break;
              }
              if (data.text) {
                setIsAiTyping(false);
                accumulatedText += data.text;

                setThreads((prevThreads) =>
                  prevThreads.map((t) => {
                    if (t.id === activeThreadId) {
                      if (!isMessageAdded) {
                        isMessageAdded = true;
                        const aiMsg: Message = {
                          id: aiMsgId,
                          sender: 'ai',
                          originalText: accumulatedText,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        };
                        return { ...t, messages: [...t.messages, aiMsg] };
                      } else {
                        return {
                          ...t,
                          messages: t.messages.map((m) =>
                            m.id === aiMsgId ? { ...m, originalText: accumulatedText } : m,
                          ),
                        };
                      }
                    }
                    return t;
                  }),
                );
                scrollToBottom();
              }
            } catch (e) {
              // ignore partial parse errors
            }
          }
        }
      }
      setIsAiTyping(false);
    } catch (err: any) {
      setIsAiTyping(false);
      const errMsg = err?.message || 'Chat stream connection error.';
      console.error('Real-time Stream Error:', err);
      setLiveError(errMsg);
      ApiService.post(API_ENDPOINTS.LOG_ERROR, {
        telegramId: telegramId?.toString(),
        name: tgUser?.firstName || tgUser?.first_name || 'Student',
        error: errMsg,
        context: 'VoiceChatPage (Stream)',
      }).catch(() => {});
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCallActive = liveStatus !== 'disconnected' && liveStatus !== 'error';

  const getMascotAsset = () => {
    switch (liveStatus) {
      case 'thinking':
      case 'listening':
        return thinkingMascot;
      case 'speaking':
        return speakingMascot;
      case 'connecting':
      case 'connected':
      default:
        return connectedMascot;
    }
  };

  const getStatusTitle = () => {
    switch (liveStatus) {
      case 'thinking':
        return 'Thinking...';
      case 'listening':
        return 'Listening...';
      case 'speaking':
        return 'Speaking...';
      case 'connecting':
        return 'Calling...';
      case 'connected':
        return 'Connected';
      case 'disconnected':
      default:
        return '😊 Ready to practice?';
    }
  };

  return (
    <div className="flex h-full bg-white text-gray-900 font-sans select-none overflow-hidden w-full relative">
      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative z-10 bg-white">
        {/* Top Header Bar */}
        <header className="px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-extrabold text-base text-gray-900 leading-tight flex items-center gap-2">
                Maraki AI
                {isPremiumUser ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded text-[9px] font-bold text-white shadow-sm">
                    <Crown className="w-3 h-3 text-white" strokeWidth={3} />
                    <span>PREMIUM</span>
                  </div>
                ) : (
                  <div className="flex items-center px-2 py-0.5 bg-gray-100 rounded border border-gray-200 text-[9px] font-bold text-gray-400">
                    FREEMIUM
                  </div>
                )}
              </h1>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">
                VOICE COACH
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tgUser && (
              <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50/80 rounded-full border border-gray-100 shadow-xs animate-fadeIn">
                <span className="text-xs font-bold text-gray-700 max-w-[100px] truncate pl-1">
                  {tgUser.firstName || tgUser.first_name || tgUser.username || 'User'}
                </span>
                {(tgUser.photoUrl || tgUser.photo_url) ? (
                  <img src={tgUser.photoUrl || tgUser.photo_url} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E] font-bold text-xs">
                    {(tgUser.firstName || tgUser.first_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>


        {/* Center Stage Mascot Avatar & Video Preview Stage */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          {/* Live Error Notification */}
          {liveError && (
            <div className="absolute top-4 inset-x-4 max-w-md mx-auto bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-xs shadow-lg z-30 animate-fadeIn flex justify-between items-center">
              <span className="font-semibold text-[11px] leading-snug">{liveError}</span>
              <button onClick={() => setLiveError(null)} className="text-amber-600 font-extrabold text-sm ml-2 px-1">
                ✕
              </button>
            </div>
          )}

          {/* Mascot Stage */}
          <div className="relative flex items-center justify-center w-[16rem] h-[16rem] sm:w-[20rem] sm:h-[20rem] md:w-[24rem] md:h-[24rem] transition-all">
            {/* 1. Speaking State: Expands dynamically with speech */}
            {liveStatus === 'speaking' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0.3, 0.8, 0.4, 0.9, 0.3], scale: [0.95, 1.2, 1.05, 1.25, 0.95] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[#22C55E]/30 via-[#10B981]/40 to-[#22C55E]/30 blur-[32px] pointer-events-none"
              />
            )}

            {/* 2. Thinking State: Purple/Orange Pulse */}
            {liveStatus === 'thinking' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.95, 1.1, 0.95], rotate: [0, 90, 180] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 via-orange-400/20 to-purple-500/20 blur-2xl pointer-events-none"
              />
            )}

            {/* 3. Listening State: Fast energetic pulse simulating mic input */}
            {liveStatus === 'listening' && (
              <motion.div
                animate={{ opacity: [0.3, 0.8, 0.2, 0.6, 0.3], scale: [0.98, 1.15, 1.0, 1.1, 0.98] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-[#7CBD00]/30 blur-2xl pointer-events-none"
              />
            )}

            {/* 4. Idle / Connected State: Soft breathing green glow */}
            {(!isCallActive || liveStatus === 'connected' || liveStatus === 'connecting') && (
              <motion.div
                animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute w-80 h-80 sm:w-96 sm:h-96 md:w-[28rem] md:h-[28rem] rounded-full bg-[#7CBD00]/10 blur-[24px] pointer-events-none"
              />
            )}

            {/* Subtle Floating Particles */}
            <FloatingParticles />

            {/* Main Mascot Image */}
            <motion.div
              key={liveStatus}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-[16rem] h-[16rem] sm:w-[20rem] sm:h-[20rem] md:w-[24rem] md:h-[24rem] flex items-center justify-center"
            >
              <img
                src={getMascotAsset()}
                alt="Maraki AI Mascot"
                className="w-full h-full object-contain drop-shadow-xl select-none"
              />
            </motion.div>
          </div>

          {/* Status Display Text */}
          <div className="text-center space-y-1 mt-2 sm:mt-4 mb-1 sm:mb-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#22C55E] tracking-tight">{getStatusTitle()}</h2>
            {liveStatus === 'connecting' && (
              <p className="text-xs text-gray-500 font-semibold animate-pulse">Preparing your session...</p>
            )}
            {liveStatus !== 'connecting' && (!isCallActive || liveStatus === 'connected') && (
              <p className="text-xs text-gray-500 font-semibold">
                {!isCallActive
                  ? "Tap Call and let's improve your English together."
                  : "Maraki AI is ready to talk with you"}
              </p>
            )}
            {/* Today's lesson badge — shown when session is active */}
            {isCallActive && sessionTopic && liveStatus !== 'connecting' && (
              <div className="inline-flex items-center gap-1.5 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-full px-3 py-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wide">
                  Today: {sessionTopic}
                </span>
              </div>
            )}
          </div>

          {/* Equalizer Visualizer per Status */}
          <div className="h-6 flex items-center justify-center gap-1 my-1">
            {liveStatus === 'connecting' ? (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-bounce" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-bounce [animation-delay:0.15s]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-bounce [animation-delay:0.3s]" />
              </div>
            ) : liveStatus === 'speaking' || liveStatus === 'listening' ? (
              Array.from({ length: 14 }).map((_, i) => (
                <motion.span
                  key={i}
                  animate={{ height: ['6px', `${Math.floor(Math.random() * 22) + 8}px`, '6px'] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.4 + (i % 4) * 0.1,
                    ease: 'easeInOut',
                  }}
                  className="w-1.5 rounded-full bg-[#22C55E]"
                />
              ))
            ) : (
              Array.from({ length: 12 }).map((_, i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-[#22C55E]/40" />
              ))
            )}
          </div>

          {/* Live Call Duration Timer */}
          {isCallActive && (
            <div className="text-gray-400 font-mono text-xs font-bold tracking-wider mt-1">
              {formatTimer(callDuration)}
            </div>
          )}
        </div>

        {/* Sliding Transcript Drawer Sheet */}
        <AnimatePresence>
          {isTranscriptOpen && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="absolute inset-x-0 bottom-0 top-16 bg-white border-t border-gray-200 z-30 flex flex-col shadow-2xl rounded-t-[32px] overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#22C55E]" />
                  <h3 className="font-bold text-sm text-gray-900">Live Transcript History</h3>
                </div>
                <button
                  onClick={() => setIsTranscriptOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                <ChatMessages
                  messages={messages}
                  onSpeak={handleSpeakClick}
                  playingMessageId={playingMessageId}
                  isTyping={isAiTyping}
                />
                <div ref={messagesEndRef} />
              </div>

              {/* Text Input Footer for Direct Chatting */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendTextMessage();
                }}
                className="p-3 pb-8 sm:pb-6 border-t border-gray-100 bg-white flex items-center gap-2 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setIsTranscriptOpen(false)}
                  className="w-11 h-11 rounded-full border border-gray-200 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center shadow-xs active:scale-95 transition-all shrink-0"
                  title="Switch to Voice Mode"
                  aria-label="Switch to Voice Mode"
                >
                  <Mic className="w-5 h-5 text-[#22C55E]" />
                </button>

                <div className="flex-1">
                  <ChatInput
                    value={textInputValue}
                    onChange={(e) => setTextInputValue(e.target.value)}
                    placeholder="Type your message to Maraki AI..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={!textInputValue.trim()}
                  className="w-11 h-11 rounded-full bg-[#FF5500] hover:bg-[#E64D00] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
                  aria-label="Send text message"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Call Control Panel (Only visible in Voice mode) */}
        {!isTranscriptOpen && (
          <div className="px-4 pt-2 pb-14 sm:pb-10 md:pb-8 shrink-0 z-40 mb-4">
            <div className="max-w-md mx-auto bg-white border border-gray-100 shadow-[0_10px_35px_rgba(0,0,0,0.06)] rounded-full px-8 py-3.5 flex items-center justify-between">
              {/* 1. Center Call / End Button (Now on Left) */}
              <div className="flex flex-col items-center gap-1 w-14 relative">
                {!isCallActive && (
                  <div className="absolute top-0 w-14 h-14 rounded-full bg-[#16A34A] animate-ping opacity-40 pointer-events-none" />
                )}
                <button
                  onClick={() => toggleLiveCall()}
                  className={cn(
                    'w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg transition-all active:scale-95 hover:scale-105 border-4 relative z-10',
                    isCallActive
                      ? 'bg-[#FF3B30] border-red-100 shadow-red-500/30 ring-2 ring-red-500/20'
                      : 'bg-[#16A34A] border-emerald-100 shadow-green-600/30 ring-2 ring-emerald-500/20'
                  )}
                  aria-label={isCallActive ? "End voice call" : "Start voice call"}
                >
                  {isCallActive ? (
                    <PhoneOff className="w-6 h-6 text-white stroke-[2.5]" />
                  ) : (
                    <Phone className="w-6 h-6 text-white stroke-[2.5] fill-current" />
                  )}
                </button>
                <span className="text-[10px] font-semibold text-gray-500 animate-fadeIn">
                  {isCallActive ? 'End Call' : 'Call'}
                </span>
              </div>

              {/* 1.5. Record Button */}
              <div className="flex flex-col items-center gap-1 w-14">
                <button
                  disabled={!isCallActive}
                  onClick={() => setIsRecording(!isRecording)}
                  className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center transition-all border animate-fadeIn',
                    !isCallActive ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50' : '',
                    isCallActive && isRecording
                      ? 'border-red-500/40 bg-red-50 text-red-500 animate-pulse'
                      : isCallActive && !isRecording
                        ? 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        : 'text-gray-400',
                  )}
                  aria-label="Record conversation"
                >
                  <Disc className={cn("w-5 h-5", !isCallActive ? "text-gray-400" : isRecording ? "text-red-500" : "text-gray-700")} />
                </button>
                <span className={cn(
                  "text-[10px] font-semibold animate-fadeIn",
                  !isCallActive ? "text-gray-300" : "text-gray-500"
                )}>Record</span>
              </div>

              {/* 2. Mute Button Placeholder/Container (Now in Center) */}
              <div className="flex flex-col items-center gap-1 w-14">
                <>
                  <button
                    disabled={!isCallActive}
                    onClick={() => {
                      const newMutedState = !isMuted;
                      setIsMuted(newMutedState);
                      if (liveServiceRef.current) {
                        liveServiceRef.current.setMuted(newMutedState);
                      }
                    }}
                    className={cn(
                      'w-11 h-11 rounded-full flex items-center justify-center transition-all border animate-fadeIn',
                      !isCallActive ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50' : '',
                      isCallActive && isMuted
                        ? 'border-red-500/40 bg-red-50 text-red-500'
                        : isCallActive && !isMuted
                          ? 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          : 'text-gray-400',
                    )}
                    aria-label="Mute microphone"
                  >
                    {isMuted && isCallActive ? (
                      <MicOff className="w-5 h-5 text-red-500" />
                    ) : (
                      <Mic className={cn("w-5 h-5 stroke-[2.2]", !isCallActive ? "text-gray-400" : "text-gray-700")} />
                    )}
                  </button>
                  <span className={cn(
                    "text-[10px] font-semibold animate-fadeIn",
                    !isCallActive ? "text-gray-300" : "text-gray-500"
                  )}>Mute</span>
                </>
              </div>

              {/* 3. Text / Chat Mode Toggle Button */}
              <div className="flex flex-col items-center gap-1 w-14">
                <button
                  onClick={() => setIsTranscriptOpen(true)}
                  className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg transition-all active:scale-95 hover:scale-105 border-4 bg-[#FF5500] border-orange-100 shadow-orange-500/30 ring-2 ring-orange-500/20"
                  aria-label="Toggle text mode"
                  title="Toggle Text Mode"
                >
                  <MessageSquare className="w-6 h-6 text-white stroke-[2.5] fill-current" />
                </button>
                <span className="text-[10px] font-semibold text-gray-500 animate-fadeIn">Chat</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
