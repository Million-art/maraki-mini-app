// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Send, 
  AlertCircle, 
  Play, 
  Flame, 
  Zap, 
  Menu, 
  X, 
  Plus, 
  Trash2, 
  Languages, 
  HelpCircle,
  Volume2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { computeWordDiff, type DiffToken } from '../../utils/strikethrough.util';
import { ApiService, API_ENDPOINTS } from '../../config/api';

import Header from '../../components/Header';
import ChatMessages from '../../components/ChatMessages';
import ChatInput from '../../components/ChatInput';
import VoiceButton from '../../components/VoiceButton';

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
  translatedText?: string;
}

interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  createdTime: number;
}

const TOPICS = [
  { label: '☕ Daily Routine', category: 'General', level: 'Easy', prompt: 'Tell me about what you usually do in the morning!' },
  { label: '💼 Job Interview', category: 'Career', level: 'Intermediate', prompt: 'Tell me about yourself and your professional strengths.' },
  { label: '✈️ Travel & Flying', category: 'Lifestyle', level: 'Easy', prompt: 'Where is your dream travel destination and why?' },
  { label: '⚽ Hobbies & Sports', category: 'Social', level: 'Fun', prompt: 'What do you love doing in your free time?' },
];

export default function VoiceChatPage() {
  const { isDarkMode } = useOutletContext<{ isDarkMode: boolean }>();
  
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
          originalText: "👋 Welcome! I'm Maraki, your AI English Coach. Tap the mic button to talk or choose a practice quest below!",
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
  const [isRecording, setIsRecording] = useState(false);
  const [, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [xp, setXp] = useState(240);
  const [streak] = useState(5);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
  const messages = activeThread?.messages || [];

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
  }, [messages, isProcessing]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
        setInputText(current);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  
  // Cache for AI generated audio to save tokens and prevent back-and-forth
  const audioCache = useRef<Map<string, string>>(new Map());

  const speakText = (text: string, messageId?: string) => {
    // If user clicks the currently playing message, stop it completely
    if (messageId && playingMessageId === messageId) {
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingMessageId(null);
      setIsSpeaking(false);
      return;
    }

    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }

    if (!('speechSynthesis' in window)) {
      alert('Text to speech is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    if (messageId) setPlayingMessageId(messageId);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const avail = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    if (avail.length > 0) {
      const bestVoice = avail.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') ||
            v.name.includes('Natural') ||
            v.name.includes('Premium') ||
            v.name.includes('Samantha') ||
            v.name.includes('Jenny'))
      ) || avail.find((v) => v.lang.startsWith('en'));

      if (bestVoice) {
        utterance.voice = bestVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (messageId) setPlayingMessageId(null);
    };
    utterance.onerror = (e) => {
      console.error('Speech Synthesis Error:', e);
      setIsSpeaking(false);
      if (messageId) setPlayingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type your message below!');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (inputText.trim()) {
        handleSendMessage(inputText);
      }
    } else {
      setTranscript('');
      setInputText('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isProcessing) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setInputText('');
    setTranscript('');
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

    // Award XP for participating!
    setXp(prev => prev + 15);

    try {
      let analysis: any;
      try {
        analysis = await ApiService.post(API_ENDPOINTS.VOICE_ANALYZE, { text: messageContent });
      } catch (apiErr) {
        console.warn('Fallback to direct Gemini call:', apiErr);
        analysis = await analyzeWithGemini(messageContent, messages);
      }

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
            id: (Date.now() + 1).toString(),
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

      speakText(analysis.aiReply);
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

  const analyzeWithGemini = async (userText: string, history: Message[]) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error('Maraki AI API key is not configured.');
    }
    
    const conversationContext = history
      .slice(-4)
      .map((m) => `${m.sender === 'user' ? 'Student' : 'Tutor'}: ${m.originalText}`)
      .join('\n');

    const prompt = `You are Maraki AI, an encouraging English voice conversation tutor.
The student spoke: "${userText}"

Recent conversation context:
${conversationContext}

Analyze the student's spoken sentence for grammar, tense, word choice, or punctuation mistakes.
Return ONLY a raw JSON object (no markdown, no backticks) with these exact keys:
{
  "hasMistake": boolean,
  "correctedText": "Full sentence corrected with proper English grammar, capitalization and punctuation.",
  "grammarMistake": {
    "type": "Short mistake type (e.g., Verb Tense, Subject-Verb Agreement, Preposition, Article, Word Choice)",
    "explanation": "Clear 1-sentence simple explanation of why it was corrected.",
    "nativeAlternative": "A natural phrase native speakers would use."
  },
  "aiReply": "A warm, natural 1-2 sentence response directly answering or continuing the specific conversation topic."
}`;

    const models = {
      basic: 'gemini-3.5-flash-lite',
      complex: 'gemini-3.5-flash',
      fallback: 'gemini-1.5-flash',
      live: 'gemini-2.0-flash-lite',
    } as Record<'basic' | 'complex' | 'fallback' | 'live', string>;

    const modelsToTry = Object.values(models);

    let lastError = '';
    for (const modelName of modelsToTry) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        const data = await res.json();

        if (data?.error) {
          lastError = data.error.message || JSON.stringify(data.error);
          continue;
        }

        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleaned = rawText.replace(/```json\s*|\s*```/g, '').trim();
          return JSON.parse(cleaned);
        }
      } catch (err: any) {
        lastError = err?.message || 'Network request failed';
      }
    }
    throw new Error('Maraki AI service is temporarily offline. ' + lastError);
  };

  const renderStrikethroughMessage = (msg: Message) => {
    if (!msg.correctedText || msg.originalText === msg.correctedText) {
      return <span>{msg.originalText}</span>;
    }

    const diffTokens: DiffToken[] = computeWordDiff(msg.originalText, msg.correctedText);

    return (
      <div className="flex flex-wrap gap-1 items-center">
        {diffTokens.map((token, idx) => {
          if (token.type === 'removed') {
            return (
              <span
                key={idx}
                className="line-through text-orange bg-orange/10 px-1 py-0.5 rounded font-semibold text-[13px]"
              >
                {token.text}
              </span>
            );
          }
          if (token.type === 'added') {
            return (
              <span
                key={idx}
                className="text-dark bg-lime px-1.5 py-0.5 rounded font-extrabold text-[13px]"
              >
                {token.text}
              </span>
            );
          }
          return <span key={idx}>{token.text}</span>;
        })}
      </div>
    );
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
          originalText: "👋 Welcome to a new practice session! What topic would you like to explore today?",
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
                  Maraki AI Companion v2.5
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-background text-foreground relative z-10">
        
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} streak={streak} xp={xp} />

        {/* Live Speech Waveform / Audio State Bar */}
        {(isRecording || isSpeaking || isProcessing) && (
          <div className="px-4 py-2 bg-muted/40 border-b border-border flex items-center justify-between text-xs font-semibold text-muted-foreground shrink-0">
            <div className="flex items-center gap-2">
              <Volume2 className={cn("w-4 h-4 text-primary", isSpeaking && "animate-pulse")} />
              <span>
                {isRecording ? "Listening to your voice..." : isSpeaking ? "Maraki AI is speaking..." : "Analyzing response..."}
              </span>
            </div>
            {/* Animated Equalizer Sound Bars */}
            <div className="flex items-end gap-1 h-3.5">
              <span className="w-1 bg-primary rounded-full h-3 animate-bounce" />
              <span className="w-1 bg-accent rounded-full h-4 animate-bounce [animation-delay:0.15s]" />
              <span className="w-1 bg-primary rounded-full h-2 animate-bounce [animation-delay:0.3s]" />
              <span className="w-1 bg-accent rounded-full h-3.5 animate-bounce [animation-delay:0.45s]" />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-4 py-8">
              <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-6">
                  <h1 className="text-5xl md:text-6xl font-black text-primary leading-tight uppercase tracking-tight">
                    WELCOME
                    <br />
                    BACK!
                  </h1>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-semibold">Ready to practice?</p>
                    <p className="text-base text-foreground leading-relaxed">
                      Start a conversation with Maraki AI and practice your English speaking and writing skills.
                    </p>
                  </div>
                </div>
                <div className="bg-primary text-primary-foreground rounded-3xl p-5 space-y-2.5 shadow-lg">
                  <p className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4" /> Speaking Tip</p>
                  <p className="text-xs leading-relaxed opacity-95">
                    Tap the mic button to speak naturally, or pick a practice topic below to begin your session.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <ChatMessages 
                messages={messages} 
                onSpeak={speakText} 
                playingMessageId={playingMessageId} 
                onExplain={(msg) => handleSendMessage(msg)} 
              />
              {isProcessing && (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center gap-2 text-sm text-primary font-semibold bg-primary/10 px-4 py-2 rounded-full animate-pulse">
                    <Sparkles className="w-4 h-4" />
                    Maraki AI is generating response...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Practice Quests / Suggested Cards - Display Title and Type (Category) only */}
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
            <VoiceButton
              onTranscript={(text) => setInputText(text)}
              onListeningChange={(listening) => setIsRecording(listening)}
              disabled={isProcessing}
            />
            
            <div className="flex-1">
              <ChatInput
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Talk or type to Maraki AI..."
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
