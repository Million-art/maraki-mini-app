import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  PhoneOff,
  Mic,
  MicOff,
  FileText,
  Calendar,
  Briefcase,
  Plane,
  Smile,
  ChevronUp,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGeminiLive } from '../../hooks/useGeminiLive';

declare global {
  interface Window {
    Telegram?: { WebApp?: { initDataUnsafe?: { user?: { id?: number } } } };
  }
}
import { GeminiLiveService } from '../../services/geminiLive.service';
import Header from '../../components/Header';
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

const TOPICS = [
  { label: 'Daily Routine', category: 'General', icon: Calendar, prompt: 'Tell me about what you usually do in the morning!' },
  { label: 'Job Interview', category: 'Career', icon: Briefcase, prompt: 'Tell me about yourself and your professional strengths.' },
  { label: 'Travel & Flying', category: 'Travel', icon: Plane, prompt: 'Where is your dream travel destination and why?' },
  { label: 'Hobbies & Sports', category: 'Social', icon: Smile, prompt: 'What do you love doing in your free time?' },
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
          originalText: "👋 Welcome to Maraki AI Live Voice Call! Tap the glowing orange microphone to start speaking.",
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
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Audio Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // Gemini 3.1 Flash Live API States
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
          originalText: "👋 Welcome to a new live call session! Tap the orange mic button to speak.",
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

  // Derive call state text and styling
  const isCallActive = liveStatus !== 'disconnected' && liveStatus !== 'error';
  const getStatusText = () => {
    switch (liveStatus) {
      case 'connecting':
        return 'Connecting to Maraki AI...';
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
    <div className="flex h-full bg-gradient-to-b from-orange-50/50 via-background to-orange-100/30 text-foreground font-sans select-none overflow-hidden w-full relative">

      {/* Session Drawer Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 240 }}
              className="fixed md:static inset-y-0 left-0 w-72 bg-card border-r border-border flex flex-col z-50 h-full shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange flex items-center justify-center text-white shadow-md shadow-orange/30">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <span className="font-extrabold text-lg uppercase tracking-wider text-foreground">Maraki AI</span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <button
                  onClick={handleNewSession}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-orange text-white font-bold text-sm hover:bg-orange/90 active:scale-98 transition-all shadow-lg shadow-orange/25"
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
                        ? "bg-orange/10 border-orange/30 text-orange shadow-sm"
                        : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <span className="truncate flex-1 pr-2">{thread.title}</span>
                    <button
                      aria-label={`Delete ${thread.title}`}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-muted-foreground hover:text-red-600 hover:bg-muted transition-all"
                      onClick={(e) => handleDeleteSession(thread.id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </nav>

              <div className="p-4 border-t border-border text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  Maraki Live Call v3.0
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative z-10">

        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

        {/* Suggested Topics Carousel */}
        <div className="px-4 py-2.5 flex gap-2.5 overflow-x-auto no-scrollbar shrink-0 bg-white/50 dark:bg-card/50 backdrop-blur-md border-b border-border/40 justify-center">
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
                  'whitespace-nowrap px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-2 transition-all border shrink-0 shadow-sm active:scale-95',
                  isSelected
                    ? 'bg-orange border-orange text-white shadow-md shadow-orange/25'
                    : 'bg-orange/10 border-orange/20 text-foreground hover:bg-orange/20'
                )}
              >
                <span className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center transition-colors',
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-orange/15 text-orange'
                )}>
                  <IconComponent className="w-3.5 h-3.5 stroke-[2.2]" />
                </span>
                <span className="text-xs font-bold">{topic.label}</span>
                <span className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                  isSelected ? 'bg-white/20 text-white' : 'bg-orange/15 text-orange font-bold'
                )}>
                  {topic.category}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hero Call Stage Container */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">

          {/* Live Error Notification */}
          {liveError && (
            <div className="absolute top-4 inset-x-4 max-w-md mx-auto bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-2xl text-xs flex justify-between items-center backdrop-blur-md shadow-lg z-30 animate-fadeIn">
              <span>⚠️ {liveError}</span>
              <button onClick={() => setLiveError(null)} className="font-bold underline ml-2">Dismiss</button>
            </div>
          )}

          {/* Main AI Avatar Stage with Animated Sound Rings */}
          <div className="relative flex items-center justify-center my-auto">
            {/* Outer Animated Ring 1 */}
            <motion.div
              animate={
                liveStatus === 'speaking'
                  ? { scale: [1, 1.4, 1], opacity: [0.35, 0.75, 0.35] }
                  : liveStatus === 'listening'
                  ? { scale: [1, 1.25, 1], opacity: [0.25, 0.55, 0.25] }
                  : { scale: 1, opacity: 0.15 }
              }
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-tr from-orange-500/30 via-amber-400/20 to-orange-400/30 blur-xl pointer-events-none"
            />

            {/* Middle Glowing Ring 2 */}
            <motion.div
              animate={
                liveStatus === 'speaking'
                  ? { scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }
                  : liveStatus === 'listening'
                  ? { scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }
                  : { scale: 1, opacity: 0.2 }
              }
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut', delay: 0.2 }}
              className="absolute w-48 h-48 md:w-60 md:h-60 rounded-full bg-gradient-to-br from-orange-500/40 to-amber-400/40 blur-lg pointer-events-none"
            />

            {/* Central Glassmorphic Avatar Circle */}
            <motion.div
              animate={
                liveStatus === 'speaking' || liveStatus === 'listening'
                  ? { scale: [1, 1.05, 1] }
                  : { scale: 1 }
              }
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="relative w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 p-1 shadow-[0_15px_40px_rgba(252,74,1,0.35)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              onClick={toggleLiveCall}
            >
              <div className="w-full h-full rounded-full bg-white dark:bg-card/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center border border-white/60 dark:border-border/60">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg mb-1">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <span className="font-extrabold text-sm text-foreground tracking-tight">Maraki AI</span>
                <span className="text-[10px] font-semibold text-orange uppercase tracking-widest">
                  Live Coach
                </span>
              </div>
            </motion.div>
          </div>

          {/* Status Display Header & Timer */}
          <div className="text-center space-y-2 mt-6 mb-4 z-10">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
              {getStatusText()}
            </h2>

            {/* Floating Particles for 'Connecting' State */}
            {liveStatus === 'connecting' && (
              <div className="flex items-center justify-center gap-1.5 py-1">
                <span className="w-2 h-2 rounded-full bg-orange animate-ping" />
                <span className="w-2 h-2 rounded-full bg-orange animate-ping [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-orange animate-ping [animation-delay:0.4s]" />
              </div>
            )}

            {/* Live Call Duration Timer */}
            {isCallActive && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange/10 border border-orange/20 text-orange font-mono text-xs font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {formatTimer(callDuration)}
              </div>
            )}
          </div>

          {/* Real-Time Frequency Waveform Visualizer */}
          <div className="w-full max-w-sm h-12 flex items-center justify-center gap-1.5 px-4 my-2">
            {Array.from({ length: 18 }).map((_, i) => {
              const isAnimating = liveStatus === 'speaking' || liveStatus === 'listening';
              return (
                <motion.span
                  key={i}
                  animate={
                    isAnimating
                      ? { height: ['8px', `${Math.floor(Math.random() * 32) + 10}px`, '8px'] }
                      : { height: '6px' }
                  }
                  transition={{
                    repeat: isAnimating ? Infinity : 0,
                    duration: 0.4 + (i % 5) * 0.1,
                    ease: 'easeInOut',
                  }}
                  className={cn(
                    'w-1.5 rounded-full transition-all',
                    isAnimating
                      ? i % 2 === 0
                        ? 'bg-orange'
                        : 'bg-amber-400'
                      : 'bg-muted-foreground/30'
                  )}
                />
              );
            })}
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
              className="absolute inset-x-0 bottom-24 top-20 bg-card/95 backdrop-blur-2xl border-t border-border z-30 flex flex-col shadow-2xl rounded-t-[32px] overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange" />
                  <h3 className="font-bold text-sm text-foreground">Live Transcript History</h3>
                </div>
                <button
                  onClick={() => setIsTranscriptOpen(false)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
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

        {/* Floating Call Control Panel */}
        <div className="p-4 md:p-6 shrink-0 z-40">
          <div className="max-w-md mx-auto bg-white/80 dark:bg-card/80 backdrop-blur-2xl border border-white/60 dark:border-border/60 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[36px] p-3 flex items-center justify-around">

            {/* Mute Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95',
                  isMuted
                    ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                    : 'bg-muted/60 text-foreground hover:bg-muted border border-border'
                )}
                aria-label="Mute microphone"
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {isMuted ? 'Muted' : 'Mute'}
              </span>
            </div>

            {/* Speaker Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95',
                  !isSpeakerOn
                    ? 'bg-muted text-muted-foreground border border-border'
                    : 'bg-orange/10 text-orange border border-orange/30'
                )}
                aria-label="Toggle speaker"
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <span className="text-[10px] font-semibold text-muted-foreground">
                Speaker
              </span>
            </div>

            {/* Center Stage Glowing Orange Signature Microphone Call Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={toggleLiveCall}
                className={cn(
                  'w-16 h-16 rounded-full text-white flex items-center justify-center shadow-xl active:scale-95 transition-all relative group',
                  isCallActive
                    ? 'bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 shadow-[0_10px_30px_rgba(252,74,1,0.5)] animate-pulse'
                    : 'bg-gradient-to-tr from-orange-600 to-orange-500 shadow-lg shadow-orange/30 hover:scale-105'
                )}
                aria-label="Start or end voice call"
              >
                <Mic className="w-7 h-7 stroke-[2.2]" />
              </button>
              <span className="text-[11px] font-bold text-orange">
                {isCallActive ? 'Live' : 'Speak'}
              </span>
            </div>

            {/* Transcript Sheet Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95',
                  isTranscriptOpen
                    ? 'bg-orange text-white shadow-md shadow-orange/25'
                    : 'bg-muted/60 text-foreground hover:bg-muted border border-border'
                )}
                aria-label="Toggle transcript"
              >
                {isTranscriptOpen ? <ChevronUp className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </button>
              <span className="text-[10px] font-semibold text-muted-foreground">
                Text
              </span>
            </div>

            {/* Circular End Call Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={toggleLiveCall}
                disabled={!isCallActive}
                className={cn(
                  'w-12 h-12 rounded-full text-white flex items-center justify-center transition-all shadow-md active:scale-95',
                  isCallActive
                    ? 'bg-neutral-800 hover:bg-neutral-900 shadow-neutral-800/30 cursor-pointer'
                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50 border border-border'
                )}
                aria-label="End conversation"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-semibold text-muted-foreground">
                End
              </span>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
