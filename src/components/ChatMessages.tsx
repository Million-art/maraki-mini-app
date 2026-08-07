import React from 'react';
import { AlertCircle } from 'lucide-react';
import { computeWordDiff, type DiffToken } from '../utils/strikethrough.util';

export interface ChatMessagesProps {
  messages: any[];
  onSpeak?: (text: string, messageId: string) => void;
  onExplain?: (text: string) => void;
  playingMessageId?: string | null;
  isTyping?: boolean;
}

export default function ChatMessages({ messages, onSpeak, onExplain, playingMessageId, isTyping }: ChatMessagesProps) {
  
  const renderStrikethroughMessage = (msg: any) => {
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
                className="text-foreground bg-lime px-1.5 py-0.5 rounded font-extrabold text-[13px]"
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
    <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
      {messages.map((message, i) => (
        <div
          key={i}
          className={`flex ${
            message.sender === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-md lg:max-w-lg px-6 py-4 rounded-3xl relative shadow-sm ${
              message.sender === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'bg-card text-foreground border border-border rounded-tl-sm'
            }`}
          >
            {/* Header Label inside Bubble */}
            <div className="flex items-center justify-between gap-4 mb-2 opacity-80">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                {message.sender === 'user' ? 'Your Speech' : 'Maraki Coach'}
              </span>
              <span className="text-[9px]">
                {message.timestamp}
              </span>
            </div>

            {message.sender === 'user' ? (
              <div>
                <div className="text-base leading-relaxed">{renderStrikethroughMessage(message)}</div>
                
                {/* High Impact Grammar Spotlight Card */}
                {message.grammarMistake && (
                  <div className="mt-3 pt-3 border-t border-white/20 text-[12px] space-y-2">
                    <div className="flex items-center gap-1 text-lime font-extrabold uppercase tracking-wider text-[10px]">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {message.grammarMistake.type}
                    </div>
                    <p className="text-white/90 leading-tight">{message.grammarMistake.explanation}</p>
                    <div className="bg-white/10 p-2 rounded-xl text-lime font-bold text-[11px] mt-2 border border-lime/30 flex items-center justify-between">
                      <span>💡 Native: "{message.grammarMistake.nativeAlternative}"</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-base leading-relaxed">{message.originalText}</p>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Maraki AI Animated Typing Indicator */}
      {isTyping && (
        <div className="flex justify-start animate-fadeIn">
          <div className="max-w-xs px-5 py-3 rounded-3xl bg-white border border-gray-200/80 rounded-tl-sm shadow-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Maraki Coach</span>
              <span className="text-[10px] text-[#FF5500] font-semibold animate-pulse">is typing...</span>
            </div>
            <div className="flex items-center gap-1.5 py-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5500] animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5500] animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5500] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
