import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Send, RefreshCw, CheckCircle2, AlertCircle, Play, Info } from 'lucide-react';
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
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
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

  // Text-to-Speech Engine with Voice Filtering for Warm, Clear & Natural Audio
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // stop previous playback
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.05; // Friendly, warm pitch

    const avail = voices.length > 0 ? voices : window.speechSynthesis.getVoices();

    if (avail.length > 0) {
      // Find high-quality natural/Google/Apple English voices
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

  // Process and send user message with AI Grammar Correction
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

    // 1. Add provisional user message
    const provisionalMsg: Message = {
      id: userMessageId,
      sender: 'user',
      originalText: messageContent,
      timestamp,
    };

    setMessages((prev) => [...prev, provisionalMsg]);

    try {
      // 2. Perform AI Grammar Check & Voice Analysis via Backend API or Direct Gemini
      let analysis: any;
      try {
        analysis = await ApiService.post(API_ENDPOINTS.VOICE_ANALYZE, { text: messageContent });
      } catch (apiErr) {
        console.warn('Backend API unavailable, calling direct Gemini AI engine:', apiErr);
        analysis = await analyzeWithGemini(messageContent, messages);
      }

      // Update user message with corrected text and grammar metadata
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

      // Generate AI conversation response
      const aiReplyText = analysis.aiReply || "That's very interesting! Could you tell me more in English?";

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
    } catch (err) {
      console.error('Error handling voice message:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Real Gemini Flash API call for Voice Analysis & Dynamic Conversation Reply
  const analyzeWithGemini = async (userText: string, history: Message[]) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AQ.Ab8RN6K3cZQud0559mCoynTBSSjx9HR0PRv6p1X3-YjdvsfLbw';
    
    // Pass recent conversation context
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
      'gemini-3.1-flash-lite',
      'gemini-1.5-flash',
      'gemini-flash-lite-latest',
    ];

    for (const modelName of modelsToTry) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleaned = rawText.replace(/```json\s*|\s*```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.aiReply) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn(`Gemini model ${modelName} error:`, err);
      }
    }

    return analyzeGrammar(userText);
  };

  // Static pattern fallback if Gemini API is unreachable
  const analyzeGrammar = (text: string) => {
    const lower = text.toLowerCase();

    // Pattern 1: Tense errors (e.g. "I goes", "he go", "yesterday I go")
    if (lower.includes('i goes') || lower.includes('he go') || lower.includes('yesterday i go')) {
      const corrected = text
        .replace(/i goes/gi, 'I went')
        .replace(/he go/gi, 'he goes')
        .replace(/yesterday i go/gi, 'Yesterday I went');

      return {
        hasMistake: true,
        correctedText: corrected,
        grammarMistake: {
          type: 'Tense & Agreement',
          explanation: "Use past tense ('went') for past events like yesterday, and third-person singular ('he goes') for present habits.",
          nativeAlternative: 'Yesterday, I went to school.',
        },
        aiReply: "That sounds interesting! Where did you go yesterday, and who were you with?",
      };
    }

    // Pattern 2: Plural errors (e.g. "two childs", "many peoples")
    if (lower.includes('childs') || lower.includes('peoples')) {
      const corrected = text
        .replace(/childs/gi, 'children')
        .replace(/peoples/gi, 'people');

      return {
        hasMistake: true,
        correctedText: corrected,
        grammarMistake: {
          type: 'Irregular Plural',
          explanation: "'Child' becomes 'children' in plural form. 'People' is already plural for person.",
          nativeAlternative: 'I saw many people at the event.',
        },
        aiReply: "Great point! How many people were there altogether?",
      };
    }

    // Default clean response with light enhancement
    let cleanCorrected = text;
    // Capitalize first letter if needed
    cleanCorrected = cleanCorrected.charAt(0).toUpperCase() + cleanCorrected.slice(1);
    if (!cleanCorrected.endsWith('.') && !cleanCorrected.endsWith('?') && !cleanCorrected.endsWith('!')) {
      cleanCorrected += '.';
    }

    return {
      hasMistake: text !== cleanCorrected,
      correctedText: cleanCorrected,
      grammarMistake: {
        type: 'Punctuation & Style',
        explanation: 'Remember to capitalize the first letter and end with proper punctuation.',
        nativeAlternative: cleanCorrected,
      },
      aiReply: `That's wonderful! Could you tell me more about that?`,
    };
  };

  // Render Strikethrough Diff Tokens
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
                className="line-through text-red-500 bg-red-100 dark:bg-red-950/60 px-1 py-0.5 rounded font-medium text-xs sm:text-sm"
              >
                {token.text}
              </span>
            );
          }
          if (token.type === 'added') {
            return (
              <span
                key={idx}
                className="text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-1 py-0.5 rounded font-semibold text-xs sm:text-sm"
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

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {/* Header Bar */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 border-b shadow-sm',
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
            🎙️
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-tight">Voice Practice & AI Correction</h2>
            <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-time Speech Active
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoPlayAudio(!autoPlayAudio)}
            className={cn(
              'p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors',
              autoPlayAudio
                ? isDarkMode
                  ? 'bg-blue-900/40 text-blue-400 border border-blue-800'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
                : isDarkMode
                ? 'bg-gray-700 text-gray-400'
                : 'bg-gray-100 text-gray-500'
            )}
          >
            {autoPlayAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{autoPlayAudio ? 'Voice ON' : 'Mute'}</span>
          </button>

          <button
            onClick={() =>
              setMessages([
                {
                  id: '1',
                  sender: 'ai',
                  originalText: "👋 Chat reset! Tap the microphone below to start practicing speaking English.",
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ])
            }
            className={cn(
              'p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors',
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            )}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Topics Chips */}
      <div
        className={cn(
          'px-3 py-2 border-b flex gap-2 overflow-x-auto no-scrollbar text-xs',
          isDarkMode ? 'bg-gray-800/60 border-gray-700/60' : 'bg-gray-50/80 border-gray-200/80'
        )}
      >
        {TOPICS.map((topic, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSelectedTopic(topic.label);
              handleSendMessage(topic.prompt);
            }}
            className={cn(
              'whitespace-nowrap px-3 py-1.5 rounded-full font-medium transition-all shadow-sm flex items-center gap-1.5',
              selectedTopic === topic.label
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            )}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            {topic.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex flex-col space-y-1', msg.sender === 'user' ? 'items-end' : 'items-start')}
          >
            <div
              className={cn(
                'max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-sm text-sm transition-all',
                msg.sender === 'user'
                  ? isDarkMode
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-blue-600 text-white rounded-br-none'
                  : isDarkMode
                  ? 'bg-gray-800 border border-gray-700 text-gray-100 rounded-bl-none'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
              )}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-semibold opacity-75">
                  {msg.sender === 'user' ? '👤 Spoken by You' : '🤖 Maraki AI Teacher'}
                </span>
                <span className="text-[10px] opacity-60">{msg.timestamp}</span>
              </div>

              {/* Message Body */}
              {msg.sender === 'user' ? (
                <div>
                  <div className="text-sm">{renderStrikethroughMessage(msg)}</div>

                  {/* Grammar Correction Alert Card */}
                  {msg.grammarMistake && (
                    <div className="mt-3 pt-2.5 border-t border-blue-400/40 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-amber-200 font-medium">
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                          {msg.grammarMistake.type}
                        </span>
                        <span className="bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold">
                          Grammar Tip
                        </span>
                      </div>
                      <p className="text-blue-100 opacity-90 leading-relaxed">{msg.grammarMistake.explanation}</p>
                      <div className="bg-black/20 p-2 rounded text-emerald-200 font-mono text-[11px]">
                        💬 Native: "{msg.grammarMistake.nativeAlternative}"
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="leading-relaxed">{msg.originalText}</p>

                  <button
                    onClick={() => speakText(msg.originalText)}
                    className={cn(
                      'mt-1 text-xs flex items-center gap-1.5 font-medium transition-colors px-2 py-1 rounded-md',
                      isDarkMode
                        ? 'text-blue-400 hover:bg-gray-700'
                        : 'text-blue-600 hover:bg-blue-50'
                    )}
                  >
                    <Play className="w-3 h-3 fill-current" /> Listen AI Voice
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 italic py-2">
            <Sparkles className="w-4 h-4 animate-spin text-blue-500" />
            Analyzing grammar & generating voice response...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Live Voice Recording Controls & Input Bar */}
      <div
        className={cn(
          'p-3 border-t shadow-lg flex flex-col gap-2',
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        )}
      >
        {/* Pulsing Mic Visualizer Bar when Recording */}
        {isRecording && (
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-red-500/10 via-rose-500/20 to-red-500/10 border border-red-500/30 rounded-xl animate-pulse">
            <div className="flex items-center gap-2 text-red-500 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              Listening... Speak in English now
            </div>
            <div className="flex gap-1 items-end h-4">
              <span className="w-1 bg-red-500 h-2 animate-bounce" />
              <span className="w-1 bg-red-500 h-4 animate-bounce delay-100" />
              <span className="w-1 bg-red-500 h-3 animate-bounce delay-200" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Main Big Pulsing Mic Button */}
          <button
            onClick={toggleRecording}
            className={cn(
              'p-3.5 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center shrink-0',
              isRecording
                ? 'bg-red-500 text-white scale-110 ring-4 ring-red-300 dark:ring-red-900 animate-pulse'
                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white hover:opacity-95'
            )}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Text Input Fallback */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isRecording ? 'Listening to your voice...' : 'Type or speak your sentence...'}
            className={cn(
              'flex-1 px-4 py-3 rounded-full text-sm outline-none border transition-all',
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            )}
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isProcessing}
            className={cn(
              'p-3 rounded-full transition-all shrink-0',
              inputText.trim() && !isProcessing
                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
