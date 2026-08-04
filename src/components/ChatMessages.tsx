// @ts-nocheck
import React from 'react';
import { AlertCircle, Play, HelpCircle } from 'lucide-react';
import { computeWordDiff, type DiffToken } from '../utils/strikethrough.util';

interface ChatMessagesProps {
  messages: any[];
  onSpeak?: (text: string) => void;
  onExplain?: (text: string) => void;
}

export default function ChatMessages({ messages, onSpeak, onExplain }: ChatMessagesProps) {
  
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
                
                {/* Action Chips Bar */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                  <button
                    onClick={() => onSpeak?.(message.originalText)}
                    className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-all flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" /> Listen
                  </button>

                  {message.id !== '1' && (
                    <button
                      onClick={() => onExplain?.(`Can you explain the grammar behind "${message.originalText.slice(0, 30)}..."?`)}
                      className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-all flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3" /> Explain
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
