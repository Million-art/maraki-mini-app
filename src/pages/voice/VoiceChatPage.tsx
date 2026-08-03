import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  Mic,
  MicOff,
  Sparkles,
  Send,
  AlertCircle,
  Play,
  Paperclip,
  Pencil
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { computeWordDiff, type DiffToken } from '../../utils/strikethrough.util';
import { ApiService, API_ENDPOINTS } from '../../config/api';

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

const TOPICS = [
  { label: '☕ Daily Routine', prompt: 'Tell me about what you usually do in the morning!' },
  { label: '💼 Job Interview', prompt: 'Tell me about yourself and your professional strengths.' },
  { label: '✈️ Travel & Flying', prompt: 'Where is your dream travel destination and why?' },
  { label: '⚽ Hobbies & Sports', prompt: 'What do you love doing in your free time?' },
];

export default function VoiceChatPage() {
  const { isDarkMode } = useOutletContext<{ isDarkMode: boolean }>();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      originalText: "👋 Hi there! I'm your AI English Voice Partner. Tap the microphone below or choose a topic to practice speaking!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [isRecording, setIsRecording] = useState(false);
  const [, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setIsSpeaking] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Setup Web Speech API Recognition
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

  // Pre-load available browser voices
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const avail = window.speechSynthesis.getVoices();
      setVoices(avail);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Text-to-Speech Engine
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    const avail = voices.length > 0 ? voices : window.speechSynthesis.getVoices();

    if (avail.length > 0) {
      const naturalVoice = avail.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') ||
            v.name.includes('Natural') ||
            v.name.includes('Premium') ||
            v.name.includes('Samantha') ||
            v.name.includes('Karen') ||
            v.name.includes('Victoria') ||
            v.name.includes('Jenny') ||
            v.name.includes('Zira') ||
            v.name.includes('English'))
      ) || avail.find((v) => v.lang.startsWith('en'));

      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Toggle Mic Recording
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

  // Process and send user message
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

    setMessages((prev) => [...prev, provisionalMsg]);

    try {
      let analysis: any;
      try {
        analysis = await ApiService.post(API_ENDPOINTS.VOICE_ANALYZE, { text: messageContent });
      } catch (apiErr) {
        console.warn('Backend API endpoint unavailable, calling direct Gemini AI engine:', apiErr);
        analysis = await analyzeWithGemini(messageContent, messages);
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessageId
            ? {
              ...msg,
              correctedText: analysis.correctedText || messageContent,
              grammarMistake: analysis.hasMistake ? analysis.grammarMistake : undefined,
            }
            : msg
        )
      );

      const aiReplyText = analysis.aiReply;

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        originalText: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (autoPlayAudio) {
        speakText(aiReplyText);
      }
    } catch (err: any) {
      console.error('[Maraki AI Voice Error]:', err);
      const errorMessage = err?.message || 'An error occurred while connecting to Maraki AI.';

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        originalText: `⚠️ ${errorMessage}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Direct Gemini analysis fallback
  const analyzeWithGemini = async (userText: string, history: Message[]) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error('Maraki AI API key is not configured in environment variables.');
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

    const modelsToTry = [
      'gemini-1.5-flash-8b',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
    ];

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
          const parsed = JSON.parse(cleaned);
          if (parsed.aiReply) {
            return parsed;
          }
        }
      } catch (err: any) {
        lastError = err?.message || 'Network request failed';
      }
    }

    throw new Error('Maraki AI service is temporarily unavailable. Please try again shortly. ' + lastError);
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
                className="line-through text-orange bg-orange/10 px-1 py-0.5 rounded font-medium text-xs sm:text-sm"
              >
                {token.text}
              </span>
            );
          }
          if (token.type === 'added') {
            return (
              <span
                key={idx}
                className="text-dark bg-lime px-1 py-0.5 rounded font-bold text-xs sm:text-sm"
              >
                {token.text}
              </span>
            );
          }
          return <span key={idx} className="text-white">{token.text}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-light text-dark font-sans select-none overflow-hidden max-w-md mx-auto relative shadow-2xl rounded-[32px] border-4 border-white/20">

      {/* Top Header Mockup */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-light-dim shrink-0">
        <button className="w-10 h-10 rounded-full flex items-center justify-center bg-light text-dark hover:bg-light-dim active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-base tracking-wide text-dark uppercase">AI Chat</span>
        <button className="w-10 h-10 rounded-full flex items-center justify-center bg-light text-dark hover:bg-light-dim active:scale-95 transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-orange animate-pulse" />
        </button>
      </div>

      {/* Main Conversation & Dashboard Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 pb-24">

        {/* Banner Grid (Mockup Hero Cards) */}
        <div className="grid grid-cols-12 gap-4 relative shrink-0">

          {/* Welcome Text & Character Card */}
          <div className="col-span-7 bg-white rounded-3xl p-4 shadow-sm flex flex-col justify-between border border-light-dim min-h-[190px] relative overflow-hidden">
            <div>
              <h1 className="text-3xl font-display text-orange leading-none tracking-tight">
                Welcome<br />Back!
              </h1>
            </div>

            {/* Styled Character Avatar Placeholder */}
            <div className="absolute right-2 bottom-6 w-24 h-32 flex items-end justify-center">
              <div className="relative w-full h-full flex items-end">
                {/* SVG Character illustration representing the redhead mascot */}
                <svg viewBox="0 0 100 120" className="w-full h-full object-contain">
                  <defs>
                    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FC4A01" />
                      <stop offset="100%" stopColor="#FF7A00" />
                    </linearGradient>
                  </defs>
                  {/* Hair back */}
                  <path d="M15,50 Q10,15 50,10 Q90,15 85,50 Q80,90 50,85 Q20,90 15,50 Z" fill="url(#hairGrad)" />
                  {/* Face */}
                  <ellipse cx="50" cy="50" rx="25" ry="30" fill="#FFDFC4" />
                  {/* Hair Front Bangs */}
                  <path d="M28,35 Q50,20 72,35 Q65,15 50,25 Q35,15 28,35 Z" fill="url(#hairGrad)" />
                  {/* Eyes */}
                  <circle cx="42" cy="48" r="3.5" fill="#101309" />
                  <circle cx="58" cy="48" r="3.5" fill="#101309" />
                  {/* Cheeks */}
                  <circle cx="38" cy="56" r="4" fill="#FF8A8A" opacity="0.6" />
                  <circle cx="62" cy="56" r="4" fill="#FF8A8A" opacity="0.6" />
                  {/* Smile */}
                  <path d="M45,62 Q50,68 55,62" fill="none" stroke="#FC4A01" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Body / Outfit */}
                  <path d="M30,80 L70,80 L78,120 L22,120 Z" fill="#C5F400" />
                  <path d="M50,80 L50,120" stroke="#a8d400" strokeWidth="2" />
                  {/* Collar */}
                  <path d="M40,80 Q50,90 60,80" fill="none" stroke="#FFDFC4" strokeWidth="3" />
                </svg>
              </div>
            </div>

            <div className="z-10">
              <p className="text-[11px] font-bold text-dark/70 leading-tight pr-4">
                Only 100 coins left to unlock this skin!
              </p>
            </div>
          </div>

          {/* Thursday Sticker / Banner */}
          <div className="col-span-5 relative flex items-center justify-center">
            {/* Starburst Burst Shape */}
            <div className="absolute w-full h-full flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-lime drop-shadow-sm animate-[spin_60s_linear_infinite]">
                <path d="M50,0 L57,17 L75,10 L73,28 L90,28 L81,44 L95,54 L79,62 L87,79 L70,74 L70,92 L54,82 L47,98 L37,84 L21,90 L24,72 L7,72 L16,56 L2,46 L18,38 L10,21 L27,26 L27,8 L43,18 Z" />
              </svg>
            </div>
            {/* Date Content in Starburst */}
            <div className="z-10 text-center select-none font-display">
              <p className="text-xs font-semibold text-dark/80 tracking-wide leading-none">THURSDAY</p>
              <p className="text-2xl font-bold text-dark leading-none my-0.5">APR 24</p>
              <p className="text-[9px] font-bold text-dark/60 leading-tight">Thursday is a great day<br />for chemistry!</p>
            </div>
          </div>

          {/* Affirmation Alert Card */}
          <div className="col-span-12 bg-orange rounded-3xl p-5 text-white shadow-md relative overflow-hidden flex flex-col gap-1 border border-orange-soft">
            <span className="text-[10px] font-bold tracking-widest text-white/70 uppercase">Your Affirmation</span>
            <p className="text-sm font-medium italic leading-relaxed pr-8">
              "I'm lucky with exams. The exam is going well for me!"
            </p>
            <button className="absolute right-4 bottom-4 text-white/75 hover:text-white transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Real Message Thread */}
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={cn('flex flex-col space-y-1', msg.sender === 'user' ? 'items-end' : 'items-start')}
              >
                {msg.sender === 'user' ? (
                  /* User Bubble Styled with Strikethrough Display & Mistakes */
                  <div className="max-w-[85%] bg-orange text-white rounded-[20px] rounded-br-sm p-4 shadow-sm border border-orange-soft">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">👤 Spoken</span>
                      <span className="text-[10px] text-white/50">{msg.timestamp}</span>
                    </div>

                    <div className="text-sm leading-relaxed">{renderStrikethroughMessage(msg)}</div>

                    {msg.grammarMistake && (
                      <div className="mt-3 pt-2.5 border-t border-white/20 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-lime font-bold uppercase tracking-wider text-[10px]">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {msg.grammarMistake.type}
                          </span>
                          <span>Grammar Tip</span>
                        </div>
                        <p className="text-white/90 leading-relaxed">{msg.grammarMistake.explanation}</p>
                        <div className="bg-black/15 p-2 rounded-xl text-white font-semibold text-[11px]">
                          💡 Native: "{msg.grammarMistake.nativeAlternative}"
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* AI/Tutor Bubble */
                  <div className="max-w-[85%] bg-white text-dark rounded-[20px] rounded-bl-sm p-4 shadow-sm border border-light-dim">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-dark/40">🤖 Tutor</span>
                      <span className="text-[10px] text-dark/40">{msg.timestamp}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{msg.originalText}</p>

                    <button
                      onClick={() => speakText(msg.originalText)}
                      className="mt-2 text-xs flex items-center gap-1 text-orange hover:text-orange-soft font-semibold transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Listen AI Voice
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-dark/50 italic py-2 font-sans">
              <Sparkles className="w-4 h-4 animate-spin text-orange" />
              Analyzing pronunciation & generating reply...
            </div>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Topics Drawer - Floating above input */}
      <div className="absolute bottom-[80px] left-0 right-0 px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto z-20">
        {TOPICS.map((topic, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSelectedTopic(topic.label);
              handleSendMessage(topic.prompt);
            }}
            className={cn(
              'whitespace-nowrap px-3.5 py-1.5 rounded-full font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all border border-light-dim',
              selectedTopic === topic.label
                ? 'bg-orange text-white'
                : 'bg-white text-dark hover:bg-light'
            )}
          >
            <Sparkles className="w-3 h-3 text-orange" />
            {topic.label}
          </button>
        ))}
      </div>

      {/* Styled Bottom Input Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-light-dim shrink-0 z-35 flex flex-col gap-2">

        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl"
          >
            <div className="flex items-center gap-2 text-rose-600 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Recording voice...
            </div>
            <div className="flex gap-0.5 items-end h-3">
              <span className="w-0.5 bg-rose-500 h-2 animate-bounce" />
              <span className="w-0.5 bg-rose-500 h-3 animate-bounce [animation-delay:0.1s]" />
              <span className="w-0.5 bg-rose-500 h-1.5 animate-bounce [animation-delay:0.2s]" />
            </div>
          </motion.div>
        )}

        <div className="flex items-center gap-2.5">
          {/* Circular Attachment Button */}
          <button className="w-11 h-11 rounded-full flex items-center justify-center bg-dark text-white hover:bg-dark-muted active:scale-95 transition-all shrink-0">
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Main Rounded Input Box */}
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isRecording ? 'Listening...' : 'Type your homework question...'}
              className="w-full h-11 pl-4 pr-10 rounded-full border border-light-dim bg-light/50 text-dark placeholder:text-dark/45 text-sm focus:outline-none focus:border-orange focus:bg-white transition-all"
            />

            {/* Input Send / Mic toggle button inside input bar */}
            <div className="absolute right-1">
              {inputText.trim() ? (
                <button
                  onClick={() => handleSendMessage()}
                  className="w-9 h-9 rounded-full bg-orange text-white flex items-center justify-center hover:bg-orange-soft active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={toggleRecording}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                    isRecording
                      ? "bg-rose-500 text-white animate-pulse"
                      : "text-dark/60 hover:text-dark hover:bg-light-dim"
                  )}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
