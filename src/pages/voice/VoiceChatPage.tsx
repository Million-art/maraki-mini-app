import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowLeft,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  PhoneOff,
  Mic,
  MicOff,
  MessageCircle,
  Plane,
  Heart,
  Users,
  ChevronUp,
  Menu,
  CheckCircle2,
  MessageSquare,
  Send,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGeminiLive } from '../../hooks/useGeminiLive';
import ChatInput from '../../components/ChatInput';

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
function MALogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center font-black tracking-tighter text-xl leading-none select-none", className)}>
      <span className="text-[#7CBD00]">M</span>
      <span className="text-[#FF5500] -ml-1">A</span>
    </div>
  );
}

const TOPICS = [
  { label: 'Career', category: 'General', icon: MessageCircle, prompt: 'What are your career goals for the future?' },
  { label: 'Travel & Flying', category: 'Travel', icon: Plane, prompt: 'Where is your dream travel destination and why?' },
  { label: 'Dating', category: 'Lifestyle', icon: Heart, prompt: 'What traits do you look for in a partner?' },
  { label: 'Social', category: 'Social', icon: Users, prompt: 'How do you easily start a conversation with a new friend?' },
];

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
    return [{
      id: initialId,
      title: 'Practice Session 1',
      createdTime: Date.now(),
      messages: [
        {
          id: '1',
          sender: 'ai',
          originalText: "👋 Welcome to Maraki AI Live Voice Coach! Tap the green mic button to start speaking.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]
    }];
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
  const [selectedTopic, setSelectedTopic] = useState<string>('Dating');
  const [textInputValue, setTextInputValue] = useState('');

  // Audio Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // Gemini Live API States
  const [liveStatus, setLiveStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error'>('disconnected');
  const [liveError, setLiveError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const liveServiceRef = useRef<GeminiLiveService | null>(null);
  const durationTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { playText: speakText, stopAudio, playingMessageId, connect } = useGeminiLive();

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

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
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

  // Call duration timer effect
  useEffect(() => {
    if (liveStatus !== 'disconnected' && liveStatus !== 'error') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      setCallDuration(0);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [liveStatus]);

  // Clean up Live Session on unmount
  useEffect(() => {
    return () => {
      liveServiceRef.current?.endSession();
    };
  }, []);

  // Toggle Live AI Call Session
  const toggleLiveCall = () => {
    if (liveStatus !== 'disconnected' && liveStatus !== 'error') {
      liveServiceRef.current?.endSession();
      setLiveStatus('disconnected');
      return;
    }

    setLiveError(null);
    const service = new GeminiLiveService(telegramId, {
      onStatusChange: (status) => {
        setLiveStatus(status);
      },
      onTranscriptReceived: (sender, text) => {
        if (!text || !text.trim()) return;

        const newMsg: Message = {
          id: Date.now().toString(),
          sender,
          originalText: text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setThreads(prevThreads => prevThreads.map(t => {
          if (t.id === activeThreadId) {
            return {
              ...t,
              messages: [...t.messages, newMsg]
            };
          }
          return t;
        }));
      },
      onError: (err) => {
        setLiveError(err);
      },
    });

    liveServiceRef.current = service;
    service.startSession();
  };

  const handleSendTextMessage = () => {
    if (!textInputValue.trim()) return;

    const userText = textInputValue.trim();
    setTextInputValue('');

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      originalText: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setThreads(prevThreads => prevThreads.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          messages: [...t.messages, newMsg]
        };
      }
      return t;
    }));

    if (liveServiceRef.current && isCallActive) {
      liveServiceRef.current.sendTextMessage(userText);
    } else {
      toggleLiveCall();
      setTimeout(() => {
        liveServiceRef.current?.sendTextMessage(userText);
      }, 1000);
    }

    setTimeout(() => {
      scrollToBottom();
    }, 100);
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
          originalText: "👋 Welcome to a new live call session! Tap the mic button to speak.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newId);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (threads.length <= 1) {
      alert('You must keep at least one practice session.');
      return;
    }
    const filtered = threads.filter(t => t.id !== id);
    setThreads(filtered);
    if (activeThreadId === id) {
      setActiveThreadId(filtered[0].id);
    }
  };

  const isCallActive = liveStatus !== 'disconnected' && liveStatus !== 'error';

  // Get current mascot image based on live state
  const getMascotAsset = () => {
    switch (liveStatus) {
      case 'connecting':
        return thinkingMascot;
      case 'listening':
        return listeningMascot;
      case 'speaking':
        return speakingMascot;
      case 'connected':
      default:
        return connectedMascot;
    }
  };

  const getStatusTitle = () => {
    switch (liveStatus) {
      case 'connecting':
        return 'Thinking...';
      case 'listening':
        return 'Listening...';
      case 'speaking':
        return 'Speaking...';
      case 'connected':
      default:
        return 'Connected';
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
                      "group flex items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer border",
                      thread.id === activeThreadId
                        ? "bg-[#FC4A01]/10 border-[#FC4A01]/30 text-[#FC4A01] shadow-xs"
                        : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900"
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
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  Maraki AI Live v3.5
                </p>
              </div>
            </motion.aside>
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
              <h1 className="font-extrabold text-base text-gray-900 leading-tight">Maraki AI Live</h1>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">VOICE COACH</span>
            </div>
          </div>
        </header>

        {/* Suggested Topics Pill Carousel */}
        <div className="px-4 py-3 flex gap-2.5 overflow-x-auto no-scrollbar shrink-0 justify-center">
          {TOPICS.map((topic, idx) => {
            const IconComponent = topic.icon;
            const isSelected = selectedTopic === topic.label;
            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedTopic(topic.label);
                  if (liveServiceRef.current && isCallActive) {
                    liveServiceRef.current.sendTextMessage(`Let's practice the topic: ${topic.label}`);
                  }
                }}
                className={cn(
                  'whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all border shrink-0 shadow-2xs active:scale-95',
                  isSelected
                    ? 'bg-[#FF5500] border-[#FF5500] text-white shadow-sm shadow-[#FF5500]/25'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                <IconComponent className={cn('w-4 h-4', isSelected ? 'text-white' : 'text-gray-500')} />
                <span>{topic.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Stage Mascot Avatar & Status Stage */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">

          {/* Live Error Notification */}
          {liveError && (
            <div className="absolute top-4 inset-x-4 max-w-md mx-auto bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-2xl text-xs flex justify-between items-center shadow-md z-30 animate-fadeIn">
              <span>⚠️ {liveError}</span>
              <button onClick={() => setLiveError(null)} className="font-bold underline ml-2">Dismiss</button>
            </div>
          )}

          {/* Mascot Stage Art Container */}
          <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 my-auto">

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

              {/* Connected State Green Checkmark Badge */}
              {(!isCallActive || liveStatus === 'connected') && (
                <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#22C55E] text-white flex items-center justify-center shadow-lg border-2 border-white animate-scaleIn">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-white stroke-[2.5]" />
                </div>
              )}
            </motion.div>
          </div>

          {/* Status Display Text */}
          <div className="text-center space-y-1 mt-2 sm:mt-4 mb-1 sm:mb-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#22C55E] tracking-tight">
              {getStatusTitle()}
            </h2>
            {(!isCallActive || liveStatus === 'connected') && (
              <p className="text-xs text-gray-500 font-semibold">Maraki AI is ready to talk with you</p>
            )}
          </div>

          {/* Equalizer Visualizer per Status */}
          <div className="h-6 flex items-center justify-center gap-1 my-1">
            {liveStatus === 'connecting' ? (
              // Thinking State 3 Pulsing Green Dots
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-bounce" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-bounce [animation-delay:0.15s]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-bounce [animation-delay:0.3s]" />
              </div>
            ) : liveStatus === 'speaking' || liveStatus === 'listening' ? (
              // Live Speaking / Listening Bouncing Waveform
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
              // Connected Idle static green dots
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
                {/* Voice Call Mode Toggle Button */}
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
            <div className="max-w-md mx-auto bg-white border border-gray-100 shadow-[0_10px_35px_rgba(0,0,0,0.06)] rounded-full px-6 py-3.5 flex items-center justify-between">

            {/* 1. Mute Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all border',
                  isMuted
                    ? 'border-red-500/40 bg-red-50 text-red-500'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                )}
                aria-label="Mute microphone"
              >
                {isMuted ? <Mic className="w-5 h-5 text-red-500" /> : <MicOff className="w-5 h-5 text-gray-700 stroke-[2.2]" />}
              </button>
              <span className="text-[11px] font-semibold text-gray-500">Mute</span>
            </div>

            {/* 2. Speaker Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all border border-gray-200 bg-white',
                  isSpeakerOn ? 'text-[#FF5500]' : 'text-gray-400'
                )}
                aria-label="Toggle speaker"
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5 text-[#FF5500]" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
              </button>
              <span className="text-[11px] font-semibold text-gray-500">Speaker</span>
            </div>

            {/* 3. Center Mic Call Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={toggleLiveCall}
                className={cn(
                  'w-16 h-16 rounded-full text-white flex items-center justify-center shadow-lg transition-all active:scale-95 hover:scale-105 border-4 border-emerald-100 ring-2 ring-emerald-500/20',
                  isCallActive
                    ? 'bg-[#16A34A] shadow-green-600/30 animate-pulse'
                    : 'bg-[#16A34A] shadow-green-600/30'
                )}
                aria-label="Start or end voice call"
              >
                <Mic className="w-7 h-7 text-white stroke-[2.5]" />
              </button>
            </div>

            {/* 4. Text (Transcript) Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all border border-gray-200 bg-white text-gray-700',
                  isTranscriptOpen && 'border-[#16A34A] text-[#16A34A]'
                )}
                aria-label="Toggle transcript"
              >
                {isTranscriptOpen ? <ChevronUp className="w-5 h-5 text-[#16A34A]" /> : <MessageSquare className="w-5 h-5 text-gray-700 stroke-[2.2]" />}
              </button>
              <span className="text-[11px] font-semibold text-gray-500">Text</span>
            </div>

            {/* 5. End Call Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={toggleLiveCall}
                disabled={!isCallActive}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95',
                  isCallActive
                    ? 'bg-[#FF3B30] text-white shadow-red-500/25 hover:bg-[#E03126] cursor-pointer'
                    : 'bg-[#FF3B30]/60 text-white cursor-not-allowed opacity-60'
                )}
                aria-label="End conversation"
              >
                <PhoneOff className="w-5 h-5 text-white" />
              </button>
              <span className="text-[11px] font-semibold text-gray-500">End</span>
            </div>

          </div>
        </div>
        )}

      </div>
    </div>
  );
}
