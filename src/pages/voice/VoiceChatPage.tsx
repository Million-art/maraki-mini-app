import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowLeft,
  Plus,
  Trash2,
  PhoneOff,
  Mic,
  Phone,
  MicOff,
  MessageCircle,
  Plane,
  Heart,
  Users,
  Menu,
  MessageSquare,
  Send,
  Settings,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGeminiLive } from '../../hooks/useGeminiLive';
import ChatInput from '../../components/ChatInput';
import { ApiService, API_ENDPOINTS } from '../../config/api';

import connectedMascot from '../../assets/connected.png';
import listeningMascot from '../../assets/listening.png';
import speakingMascot from '../../assets/speaking.png';
import thinkingMascot from '../../assets/thinking.png';

declare global {
  interface Window {
    Telegram?: { WebApp?: { initDataUnsafe?: { user?: { id?: number } } } };
  }
}
import { GeminiLiveService } from '../../services/geminiLive.service';
import ChatMessages from '../../components/ChatMessages';

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

// Stylized MA Logo (Green M, Orange A)
function MALogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center font-black tracking-tighter text-xl leading-none select-none',
        className,
      )}
    >
      <span className="text-[#7CBD00]">M</span>
      <span className="text-[#FF5500] -ml-1">A</span>
    </div>
  );
}

export default function VoiceChatPage() {
  useOutletContext<{ isDarkMode: boolean }>();

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

  const [activeThreadId, setActiveThreadId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('maraki_active_thread_id');
      if (saved) return saved;
    } catch (e) {
      console.error(e);
    }
    return threads[0]?.id || '';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);

  // Audio Controls & Devices
  const [isMuted, setIsMuted] = useState(false);
  // Audio Controls & Devices
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');

  // Gemini Live API States
  const [liveStatus, setLiveStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'thinking' | 'error'
  >('disconnected');
  const [liveError, setLiveError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const liveServiceRef = useRef<GeminiLiveService | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { playText: speakText, stopAudio, playingMessageId, connect } = useGeminiLive();

  // Load available microphones
  useEffect(() => {
    async function loadDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioDevices(devices.filter((d) => d.kind === 'audioinput'));
      } catch (err) {
        console.error('Failed to enumerate media devices:', err);
      }
    }
    loadDevices();
  }, []);

  // Connect automatically on mount if possible
  useEffect(() => {
    connect();
  }, [connect]);

  const handleSpeakClick = (text: string, messageId: string) => {
    if (playingMessageId === messageId) {
      stopAudio();
    } else {
      speakText(text, messageId);
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const messages = activeThread?.messages || [];
  const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 123456789;

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

  // Reset timer when call ends
  useEffect(() => {
    if (liveStatus === 'disconnected' || liveStatus === 'error') {
      // Save Voice Session to backend if it was a real call
      if (callDuration > 0 && telegramId) {
        const activeThread = threads.find(t => t.id === activeThreadId);
        if (activeThread && activeThread.messages.length > 0) {
          ApiService.post(API_ENDPOINTS.SAVE_VOICE_SESSION, {
            telegramId: telegramId.toString(),
            durationSeconds: callDuration,
            messages: activeThread.messages,
          }).catch(err => console.error("Failed to save voice session:", err));
        }
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

  // Toggle Live AI Call Session
  const toggleLiveCall = async () => {
    if (liveStatus !== 'disconnected' && liveStatus !== 'error') {
      liveServiceRef.current?.endSession();
      setLiveStatus('disconnected');
      return;
    }

    setLiveError(null);
    setLiveStatus('connecting'); // Show connecting state immediately while fetching profile

    let systemInstruction = undefined;
    if (telegramId) {
      try {
        const profileRes: any = await ApiService.get(API_ENDPOINTS.COACHING_PROFILE(telegramId.toString()));
        console.log('🚀 RAW PROFILE FETCH RESPONSE:', profileRes);
        
        if (profileRes?.systemInstruction) {
          systemInstruction = profileRes.systemInstruction;
        } else if (profileRes?.data?.systemInstruction) {
          systemInstruction = profileRes.data.systemInstruction;
        }

        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        if (systemInstruction && (tgUser as any)?.first_name) {
          systemInstruction = systemInstruction.replace('the user', (tgUser as any).first_name);
        }
        
        console.log('🎯 EXTRACTED SYSTEM INSTRUCTION:', systemInstruction);
      } catch (err) {
        console.warn('Failed to fetch coaching profile, using default prompt', err);
      }
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
      },
    });

    liveServiceRef.current = service;
    service.startSession(selectedMicId || undefined);
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
      console.error('Real-time Stream Error:', err);
      setLiveError(err?.message || 'Chat stream connection error.');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNewSession = () => {
    const newId = Date.now().toString();
    const newThread: ChatThread = {
      id: newId,
      title: `Session ${threads.length + 1}`,
      createdTime: Date.now(),
      messages: [
        {
          id: '1',
          sender: 'ai',
          originalText: '👋 Welcome to a new live call session! Tap the mic button to speak.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (threads.length <= 1) {
      alert('You must keep at least one practice session.');
      return;
    }
    const filtered = threads.filter((t) => t.id !== id);
    setThreads(filtered);
    if (activeThreadId === id) {
      setActiveThreadId(filtered[0].id);
    }
  };

  const isCallActive = liveStatus !== 'disconnected' && liveStatus !== 'error';

  const getMascotAsset = () => {
    switch (liveStatus) {
      case 'thinking':
        return thinkingMascot;
      case 'listening':
        return listeningMascot;
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
        return 'Ready';
    }
  };

  return (
    <div className="flex h-full bg-white text-gray-900 font-sans select-none overflow-hidden w-full relative">
      {/* Session Drawer Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 240 }}
              className="fixed inset-y-0 left-0 w-80 bg-white border-r border-gray-200 flex flex-col z-50 h-full shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-700 hover:text-black hover:bg-gray-100 font-bold text-xs transition-all border border-gray-200"
                >
                  <ArrowLeft className="w-4 h-4 text-black" />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-xs">
                    <MALogo className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm text-gray-900 leading-none">Maraki AI</h2>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <button
                  onClick={handleNewSession}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[#FC4A01] text-white font-bold text-sm hover:bg-[#E64200] active:scale-98 transition-all shadow-md shadow-[#FC4A01]/25"
                >
                  <Plus className="h-4 w-4" /> New Practice Session
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-1.5 pb-4">
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => {
                      setActiveThreadId(thread.id);
                      setIsSidebarOpen(false);
                    }}
                    className={cn(
                      'group flex items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer border',
                      thread.id === activeThreadId
                        ? 'bg-[#FC4A01]/10 border-[#FC4A01]/30 text-[#FC4A01] shadow-xs'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                    )}
                  >
                    <span className="truncate flex-1 pr-2">{thread.title}</span>
                    <button
                      aria-label={`Delete ${thread.title}`}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-gray-100 transition-all"
                      onClick={(e) => handleDeleteSession(thread.id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </nav>

              <div className="p-4 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Maraki AI</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md bg-white rounded-3xl p-6 z-50 shadow-2xl border border-gray-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-700" />
                  <h3 className="font-extrabold text-base text-gray-900">Audio & Video Settings</h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Microphone Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Microphone</label>
                <select
                  value={selectedMicId}
                  onChange={(e) => setSelectedMicId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FC4A01] bg-gray-50"
                >
                  <option value="">Default Microphone</option>
                  {audioDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label || `Microphone (${dev.deviceId.slice(0, 8)})`}
                    </option>
                  ))}
                </select>
              </div>


              <div className="pt-2">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#FC4A01] text-white font-bold text-sm hover:bg-[#E64200] transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative z-10 bg-white">
        {/* Top Header Bar */}
        <header className="px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-xs">
              <MALogo className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-gray-900 leading-tight">Maraki AI</h1>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                VOICE & VIDEO COACH
              </span>
            </div>
          </div>

          {/* Settings gear button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            title="Audio & Video Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </header>


        {/* Center Stage Mascot Avatar & Video Preview Stage */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          {/* Live Error Notification */}
          {liveError && (
            <div className="absolute top-4 inset-x-4 max-w-md mx-auto bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-2xl text-xs flex justify-between items-center shadow-md z-30 animate-fadeIn">
              <span>⚠️ {liveError}</span>
              <button onClick={() => setLiveError(null)} className="font-bold underline ml-2">
                Dismiss
              </button>
            </div>
          )}

          {/* Mascot Stage */}
          <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 my-auto transition-all">
            {/* Speaking Background Wave Effect */}
            {liveStatus === 'speaking' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.95, 1.15, 0.95] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[#22C55E]/20 via-[#10B981]/30 to-[#22C55E]/20 blur-2xl pointer-events-none"
              />
            )}

            {/* Listening Background Glow Effect */}
            {liveStatus === 'listening' && (
              <motion.div
                animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.95, 1.1, 0.95] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-[#7CBD00]/25 blur-2xl pointer-events-none"
              />
            )}

            {/* Connected State Background Circle */}
            {(!isCallActive || liveStatus === 'connected') && (
              <div className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full bg-[#7CBD00]/10 blur-xl pointer-events-none" />
            )}

            {/* Main Mascot Image */}
            <motion.div
              key={liveStatus}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 flex items-center justify-center"
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
            {(!isCallActive || liveStatus === 'connected') && (
              <p className="text-xs text-gray-500 font-semibold">Maraki AI is ready to talk with you</p>
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
          <div className="text-gray-400 font-mono text-xs font-bold tracking-wider mt-1">
            {formatTimer(callDuration)}
          </div>
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
              <div className="flex flex-col items-center gap-1 w-14">
                <button
                  onClick={() => toggleLiveCall()}
                  className={cn(
                    'w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg transition-all active:scale-95 hover:scale-105 border-4',
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

              {/* 2. Mute Button Placeholder/Container (Now in Center) */}
              <div className="flex flex-col items-center gap-1 w-14">
                {isCallActive && (
                  <>
                    <button
                      onClick={() => {
                        const newMutedState = !isMuted;
                        setIsMuted(newMutedState);
                        if (liveServiceRef.current) {
                          liveServiceRef.current.setMuted(newMutedState);
                        }
                      }}
                      className={cn(
                        'w-11 h-11 rounded-full flex items-center justify-center transition-all border animate-fadeIn',
                        isMuted
                          ? 'border-red-500/40 bg-red-50 text-red-500'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                      )}
                      aria-label="Mute microphone"
                    >
                      {isMuted ? (
                        <MicOff className="w-5 h-5 text-red-500" />
                      ) : (
                        <Mic className="w-5 h-5 text-gray-700 stroke-[2.2]" />
                      )}
                    </button>
                    <span className="text-[10px] font-semibold text-gray-500 animate-fadeIn">Mute</span>
                  </>
                )}
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
