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
  FileText,
  Briefcase,
  MessageCircle,
  Plane,
  Heart,
  Users,
  ChevronUp,
  Menu,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGeminiLive } from '../../hooks/useGeminiLive';

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
  { label: 'Job Interview', category: 'Career', icon: Briefcase, prompt: 'Tell me about yourself and your professional strengths.' },
  { label: 'Career', category: 'General', icon: MessageCircle, prompt: 'What are your career goals for the future?' },
  { label: 'Travel & Flying', category: 'Travel', icon: Plane, prompt: 'Where is your dream travel destination and why?' },
  { label: 'Dating', category: 'Lifestyle', icon: Heart, prompt: 'What traits do you look for in a partner?' },
  { label: 'Social Skills', category: 'Social', icon: Users, prompt: 'How do you easily start a conversation with a new friend?' },
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
          originalText: "👋 Welcome to Maraki AI Live Voice Coach! Tap 'Speak' to talk directly with your AI tutor.",
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
  const [selectedTopic, setSelectedTopic] = useState<string>('Job Interview');

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
          originalText: "👋 Welcome to a new live call session! Tap 'Speak' to talk.",
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

  const getStatusText = () => {
    switch (liveStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'listening':
        return "I'm listening...";
      case 'speaking':
        return 'Maraki AI is speaking...';
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Tap to start speaking';
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[#7CBD00] text-white font-bold text-sm hover:bg-[#6FA800] active:scale-98 transition-all shadow-md shadow-[#7CBD00]/25"
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
                        ? "bg-[#7CBD00]/10 border-[#7CBD00]/30 text-[#7CBD00] shadow-xs"
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
                  Maraki AI Live v3.2
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative z-10 bg-white">

        {/* Top Header Bar */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-gray-50 shrink-0">
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

          {/* Top Right LIVE Pill Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 bg-white text-[11px] font-bold text-[#7CBD00] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#7CBD00] animate-pulse" />
            <span>LIVE</span>
          </div>
        </header>

        {/* Suggested Topics Pill Carousel */}
        <div className="px-4 py-3 flex gap-2.5 overflow-x-auto no-scrollbar shrink-0 justify-center border-b border-gray-50">
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
                    ? 'bg-[#7CBD00] border-[#7CBD00] text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-[#7CBD00]/60'
                )}
              >
                <IconComponent className={cn('w-4 h-4', isSelected ? 'text-white' : 'text-gray-500')} />
                <span>{topic.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Stage Avatar & Status Container */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">

          {/* Live Error Notification */}
          {liveError && (
            <div className="absolute top-4 inset-x-4 max-w-md mx-auto bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-2xl text-xs flex justify-between items-center shadow-md z-30 animate-fadeIn">
              <span>⚠️ {liveError}</span>
              <button onClick={() => setLiveError(null)} className="font-bold underline ml-2">Dismiss</button>
            </div>
          )}

          {/* Arched Capsule Border Outer Container */}
          <div className={cn(
            "w-64 h-72 rounded-t-full rounded-b-[60px] flex flex-col items-center justify-center p-6 bg-white relative transition-all duration-300",
            isCallActive ? "border-2 border-[#7CBD00]/40 shadow-sm" : "border border-gray-150"
          )}>

            {/* Concentric Rings Surround */}
            <div className="relative flex items-center justify-center mb-6">
              {/* Outer Ring 2 */}
              <div className={cn(
                "w-48 h-48 rounded-full absolute transition-all",
                isCallActive ? "border-2 border-[#7CBD00]/30 animate-pulse" : "border border-gray-150"
              )} />

              {/* Outer Ring 1 */}
              <div className={cn(
                "w-36 h-36 rounded-full absolute transition-all",
                isCallActive ? "border-2 border-[#7CBD00]/60" : "border border-gray-200"
              )} />

              {/* Center Logo Circle */}
              <div className={cn(
                "w-24 h-24 rounded-full bg-white flex items-center justify-center z-10 shadow-xs transition-all",
                isCallActive ? "border-2 border-[#7CBD00]" : "border border-gray-200"
              )}>
                <MALogo className="w-12 h-12" />
              </div>
            </div>

            {/* Avatar Title & Subtitle */}
            <h3 className="font-extrabold text-xl text-gray-900 tracking-tight leading-none mb-1">Maraki AI</h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">LIVE COACH</span>
          </div>

          {/* Status Display Text */}
          <h2 className="text-xl font-bold text-gray-900 tracking-tight mt-6 mb-3 text-center">
            {getStatusText()}
          </h2>

          {/* Live Call Duration Timer */}
          {isCallActive && (
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#7CBD00]/10 text-[#7CBD00] font-mono text-xs font-bold mb-2">
              <span>{formatTimer(callDuration)}</span>
            </div>
          )}

          {/* Dynamic Equalizer Waveform Indicator */}
          <div className="h-8 flex items-center justify-center gap-1 px-4 mt-1">
            {isCallActive ? (
              Array.from({ length: 12 }).map((_, i) => (
                <motion.span
                  key={i}
                  animate={
                    liveStatus === 'speaking' || liveStatus === 'listening'
                      ? { height: ['8px', `${Math.floor(Math.random() * 24) + 8}px`, '8px'] }
                      : { height: '8px' }
                  }
                  transition={{
                    repeat: Infinity,
                    duration: 0.4 + (i % 4) * 0.1,
                    ease: 'easeInOut',
                  }}
                  className="w-1.5 rounded-full bg-[#7CBD00]"
                />
              ))
            ) : (
              // Idle state faint green dots
              Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-[#7CBD00]/30" />
              ))
            )}
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
              className="absolute inset-x-0 bottom-24 top-20 bg-white border-t border-gray-200 z-30 flex flex-col shadow-2xl rounded-t-[32px] overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#7CBD00]" />
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Call Control Panel (Floating Glass Panel) */}
        <div className="p-4 md:p-6 shrink-0 z-40">
          <div className="max-w-xl mx-auto bg-white border border-gray-200 shadow-xl rounded-full px-6 md:px-8 py-3 flex items-center justify-between">

            {/* 1. Mute Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center transition-all border',
                  isMuted
                    ? 'border-[#FC4A01] bg-[#FC4A01] text-white shadow-xs'
                    : 'border-gray-200 bg-white text-black hover:border-[#FC4A01]/60'
                )}
                aria-label="Mute microphone"
              >
                {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-black stroke-[2.2]" />}
              </button>
              <span className="text-[11px] font-semibold text-gray-700">Mute</span>
            </div>

            {/* 2. Speaker Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center transition-all border',
                  isSpeakerOn
                    ? 'border-[#FC4A01] bg-[#FC4A01] text-white shadow-xs'
                    : 'border-gray-200 bg-white text-black'
                )}
                aria-label="Toggle speaker"
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-black stroke-[2.2]" />}
              </button>
              <span className="text-[11px] font-semibold text-gray-700">Speaker</span>
            </div>

            {/* 3. Center Primary Button (Speak / Stop) */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={toggleLiveCall}
                className={cn(
                  'w-14 h-14 rounded-full text-white flex items-center justify-center shadow-md transition-all active:scale-95 hover:scale-105',
                  isCallActive
                    ? 'bg-[#FC4A01] hover:bg-[#E64200] shadow-[#FC4A01]/40 animate-pulse'
                    : 'bg-black hover:bg-gray-800 shadow-gray-900/20'
                )}
                aria-label="Start or stop call"
              >
                {isCallActive ? <PhoneOff className="w-6 h-6 text-white stroke-[2.2]" /> : <Mic className="w-6 h-6 text-white stroke-[2.2]" />}
              </button>
              <span className={cn('text-[11px] font-bold', isCallActive ? 'text-[#FC4A01]' : 'text-black')}>
                {isCallActive ? 'Stop' : 'Speak'}
              </span>
            </div>

            {/* 4. Text (Transcript) Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center transition-all border',
                  isTranscriptOpen
                    ? 'bg-[#FC4A01] text-white border-[#FC4A01]'
                    : 'border-gray-200 bg-white text-black hover:border-[#FC4A01]/60'
                )}
                aria-label="Toggle transcript"
              >
                {isTranscriptOpen ? <ChevronUp className="w-5 h-5 text-white" /> : <FileText className="w-5 h-5 text-black stroke-[2.2]" />}
              </button>
              <span className="text-[11px] font-semibold text-gray-700">Text</span>
            </div>

            {/* 5. End Call Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={toggleLiveCall}
                disabled={!isCallActive}
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center transition-all border',
                  isCallActive
                    ? 'border-[#FC4A01] bg-[#FC4A01] text-white shadow-xs cursor-pointer'
                    : 'border-gray-200 bg-white text-black opacity-60 cursor-not-allowed'
                )}
                aria-label="End conversation"
              >
                <PhoneOff className={cn('w-5 h-5', isCallActive ? 'text-white' : 'text-black stroke-[2.2]')} />
              </button>
              <span className="text-[11px] font-semibold text-gray-700">End</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
