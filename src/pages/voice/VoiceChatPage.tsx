import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  X,
  Plus,
  Trash2,
  Volume2,
  PhoneCall,
  PhoneOff,
  Activity,
} from 'lucide-react';
import { cn } from '../../lib/utils';

declare global {
  interface Window {
    Telegram?: { WebApp?: { initDataUnsafe?: { user?: { id?: number } } } };
  }
}
import { ApiService, API_ENDPOINTS } from '../../config/api';
import { GeminiLiveService } from '../../services/geminiLive.service';

import Header from '../../components/Header';
import ChatMessages from '../../components/ChatMessages';
import ChatInput from '../../components/ChatInput';

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
  { label: ' Daily Routine', category: 'General', level: 'Easy', prompt: 'Tell me about what you usually do in the morning!' },
  { label: ' Job Interview', category: 'Career', level: 'Intermediate', prompt: 'Tell me about yourself and your professional strengths.' },
  { label: ' Travel & Flying', category: 'Lifestyle', level: 'Easy', prompt: 'Where is your dream travel destination and why?' },
  { label: ' Hobbies & Sports', category: 'Social', level: 'Fun', prompt: 'What do you love doing in your free time?' },
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
          originalText: "👋 Welcome to Maraki AI Live Voice Coach! Tap 'Start Live Call' to talk directly with your Gemini 3.1 Flash Live AI tutor!",
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
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [xp, setXp] = useState(240);
  const [streak] = useState(5);

  // Gemini 3.1 Flash Live API States
  const [liveStatus, setLiveStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error'>('disconnected');
  const [liveError, setLiveError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const liveServiceRef = useRef<GeminiLiveService | null>(null);
  const durationTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
  const messages = activeThread?.messages || [];

  // Get Telegram User ID or Demo ID
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
    scrollToBottom();
  }, [messages, liveStatus]);

  // Call duration timer effect
  useEffect(() => {
    if (liveStatus === 'connected' || liveStatus === 'speaking' || liveStatus === 'listening') {
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

        if (sender === 'user') {
          setXp(prev => prev + 10);
        }
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

  // Handle text message submission via Backend Service
  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isProcessing) return;

    setInputText('');
    setIsProcessing(true);

    const userMessageId = Date.now().toString();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const provisionalMsg: Message = {
      id: userMessageId,
      sender: 'user',
      originalText: messageContent,
      timestamp,
    };

    setThreads(prevThreads => prevThreads.map(t => {
      if (t.id === activeThreadId) {
        const updatedMessages = [...t.messages, provisionalMsg];
        const isFirstUserMessage = t.messages.filter(m => m.sender === 'user').length === 0;
        const newTitle = isFirstUserMessage
          ? messageContent.length > 22
            ? messageContent.substring(0, 20) + '...'
            : messageContent
          : t.title;
        return {
          ...t,
          title: newTitle,
          messages: updatedMessages
        };
      }
      return t;
    }));

    setXp(prev => prev + 15);

    try {
      const analysis: any = await ApiService.post(API_ENDPOINTS.VOICE_ANALYZE, { text: messageContent });
      const aiMsgId = (Date.now() + 1).toString();

      setThreads(prevThreads => prevThreads.map(t => {
        if (t.id === activeThreadId) {
          const updatedMessages = t.messages.map(msg =>
            msg.id === userMessageId
              ? {
                ...msg,
                correctedText: analysis.correctedText || messageContent,
                grammarMistake: analysis.hasMistake ? analysis.grammarMistake : undefined,
              }
              : msg
          );

          const aiMsg: Message = {
            id: aiMsgId,
            sender: 'ai',
            originalText: analysis.aiReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          return {
            ...t,
            messages: [...updatedMessages, aiMsg]
          };
        }
        return t;
      }));
    } catch (err: any) {
      console.error('[Maraki AI Error]:', err);
      const errorMessage = err?.message || 'An error occurred while connecting to Maraki AI.';

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        originalText: `⚠️ ${errorMessage}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setThreads(prevThreads => prevThreads.map(t => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            messages: [...t.messages, errorMsg]
          };
        }
        return t;
      }));
    } finally {
      setIsProcessing(false);
    }
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
          originalText: "👋 Welcome to a new practice session! Speak into the mic or select a topic to practice.",
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

  return (
    <div className="flex h-full bg-light text-dark font-sans select-none overflow-hidden w-full relative">

      {/* Session Drawer Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 240 }}
              className="fixed md:static inset-y-0 left-0 w-72 bg-white border-r border-light-dim flex flex-col z-50 h-full shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-5 border-b border-light-dim">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange flex items-center justify-center text-white shadow-sm">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <span className="font-display text-lg uppercase tracking-wider text-dark">Maraki AI</span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-full text-dark/50 hover:text-dark hover:bg-light transition-all md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <button
                  onClick={handleNewSession}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-orange text-white font-bold text-sm hover:bg-orange-soft active:scale-98 transition-all shadow-[0_4px_14px_rgba(252,74,1,0.25)]"
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
                        ? "bg-light border-orange/30 text-dark shadow-sm"
                        : "border-transparent text-dark/60 hover:bg-light/60 hover:text-dark"
                    )}
                  >
                    <span className="truncate flex-1 pr-2">{thread.title}</span>
                    <button
                      aria-label={`Delete ${thread.title}`}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-dark/40 hover:text-red-600 hover:bg-light transition-all"
                      onClick={(e) => handleDeleteSession(thread.id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </nav>

              <div className="p-4 border-t border-light-dim text-center">
                <p className="text-[10px] text-dark/40 uppercase tracking-widest font-bold">
                  Maraki AI Voice Companion v2.8
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-background text-foreground relative z-10">

        <Header onOpenSidebar={() => setIsSidebarOpen(true)} streak={streak} xp={xp} />

        {/* Processing State Bar */}
        {isProcessing && (
          <div className="px-4 py-2 bg-muted/40 border-b border-border flex items-center gap-2 text-xs font-semibold text-muted-foreground shrink-0">
            <Volume2 className="w-4 h-4 text-primary animate-pulse" />
            <span>Gemini is analyzing...</span>
          </div>
        )}

        {/* Gemini 3.1 Flash Live Call Active Banner */}
        {liveStatus !== 'disconnected' && (
          <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 border-b border-emerald-700 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-white animate-ping" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 animate-spin" />
                  Gemini 3.1 Live AI Call
                  {liveStatus === 'speaking' && <span className="bg-emerald-800 px-2 py-0.5 rounded-md text-[10px]">Tutor Speaking...</span>}
                  {liveStatus === 'listening' && <span className="bg-emerald-800 px-2 py-0.5 rounded-md text-[10px]">Listening to You...</span>}
                  {liveStatus === 'connecting' && <span className="bg-emerald-800 px-2 py-0.5 rounded-md text-[10px]">Connecting...</span>}
                </div>
                <div className="text-[11px] opacity-90 font-mono">Duration: {formatTimer(callDuration)}</div>
              </div>
            </div>

            {/* Equalizer Wave Animation */}
            <div className="flex items-center gap-1 h-5">
              <span className="w-1 bg-white rounded-full h-3 animate-bounce" />
              <span className="w-1 bg-white rounded-full h-5 animate-bounce [animation-delay:0.15s]" />
              <span className="w-1 bg-white rounded-full h-2 animate-bounce [animation-delay:0.3s]" />
              <span className="w-1 bg-white rounded-full h-4 animate-bounce [animation-delay:0.45s]" />
            </div>

            <button
              onClick={toggleLiveCall}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <PhoneOff className="w-4 h-4" /> End Call
            </button>
          </div>
        )}

        {liveError && (
          <div className="bg-red-100 border-b border-red-300 text-red-700 px-4 py-2 text-xs flex justify-between items-center">
            <span>⚠️ {liveError}</span>
            <button onClick={() => setLiveError(null)} className="font-bold underline">Dismiss</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-4 py-8">
              <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-6">
                  <h1 className="text-5xl md:text-6xl font-black text-primary leading-tight uppercase tracking-tight">
                    MARAKI AI
                    <br />
                    LIVE VOICE
                  </h1>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-semibold">Real-time English Speaking Practice</p>
                    <p className="text-base text-foreground leading-relaxed">
                      Experience zero-latency full-duplex voice conversations powered by Gemini 3.1 Flash Live API.
                    </p>
                  </div>
                </div>
                <div className="bg-primary text-primary-foreground rounded-3xl p-5 space-y-2.5 shadow-lg text-center">
                  <p className="text-sm font-semibold flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> Live Voice Call</p>
                  <p className="text-xs leading-relaxed opacity-95">
                    Tap the green "Start Live Call" button below to start talking into your microphone in real time.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <ChatMessages
                messages={messages}
                onExplain={(msg) => handleSendMessage(msg)}
              />
              {isProcessing && (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center gap-2 text-sm text-primary font-semibold bg-primary/10 px-4 py-2 rounded-full animate-pulse">
                    <Sparkles className="w-4 h-4" />
                    Gemini AI is processing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Suggested Topics */}
        <div className="px-4 py-2.5 flex gap-2 overflow-x-auto no-scrollbar shrink-0 bg-card border-t border-border">
          {TOPICS.map((topic, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedTopic(topic.label);
                handleSendMessage(topic.prompt);
              }}
              className={cn(
                'whitespace-nowrap px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border shrink-0 shadow-sm',
                selectedTopic === topic.label
                  ? 'bg-primary border-primary text-primary-foreground shadow-md'
                  : 'bg-muted/40 border-border text-foreground hover:border-primary/40'
              )}
            >
              <span>{topic.label}</span>
              <span className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                selectedTopic === topic.label ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {topic.category}
              </span>
            </button>
          ))}
        </div>

        {/* Bottom Bar Controls */}
        <div className="border-t border-border bg-card px-4 md:px-6 py-3.5 shrink-0 z-20">
          <div className="max-w-3xl mx-auto flex gap-3 items-center">
            {/* Gemini Live Call Toggle Button */}
            <button
              onClick={toggleLiveCall}
              className={cn(
                "px-4 py-3 rounded-full font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 shrink-0",
                liveStatus !== 'disconnected' && liveStatus !== 'error'
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              {liveStatus !== 'disconnected' && liveStatus !== 'error' ? (
                <>
                  <PhoneOff className="w-4 h-4" /> End Call
                </>
              ) : (
                <>
                  <PhoneCall className="w-4 h-4" /> Start Live Call
                </>
              )}
            </button>

            <div className="flex-1">
              <ChatInput
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Talk live or type here..."
                disabled={isProcessing}
              />
            </div>

            <button
              onClick={() => handleSendMessage()}
              disabled={isProcessing || !inputText || !inputText.trim()}
              className="p-3.5 h-[48px] w-[48px] bg-primary text-primary-foreground rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center flex-shrink-0 shadow-md active:scale-95"
              aria-label="Send message"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
