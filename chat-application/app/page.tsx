'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import VoiceButton from '@/components/VoiceButton';
import Header from '@/components/Header';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    system: `You are Maraki, a friendly and encouraging English tutor. Your role is to help users improve their English speaking and writing skills through engaging conversation. Be supportive, provide helpful corrections when needed, and celebrate their progress.`,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(messages.length === 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setShowWelcome(messages.length === 0);
  }, [messages]);

  const handleVoiceTranscript = (transcript: string) => {
    handleInputChange({
      target: { value: transcript },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />

      <div className="flex-1 overflow-y-auto flex flex-col">
        {showWelcome ? (
          <div className="flex-1 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md space-y-8">
              <div className="text-center space-y-6">
                <h1 className="text-6xl md:text-7xl font-black text-primary leading-tight">
                  WELCOME
                  <br />
                  BACK!
                </h1>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-semibold">Ready to chat?</p>
                  <p className="text-base text-foreground leading-relaxed">
                    Start a conversation with Maraki and practice your English speaking and writing skills.
                  </p>
                </div>
              </div>

              <div className="bg-primary text-white rounded-3xl p-6 space-y-3">
                <p className="text-sm font-semibold">💡 Tip</p>
                <p className="text-sm leading-relaxed">
                  Use the microphone button to practice speaking, or type your messages to get real-time feedback.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ChatMessages messages={messages} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t border-border bg-card px-4 md:px-6 py-4 md:py-6">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <VoiceButton
              onTranscript={handleVoiceTranscript}
              disabled={isLoading}
            />
            
            <ChatInput
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading || !input || !input.trim()}
              className="p-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center flex-shrink-0"
              title="Send message"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346271 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.99021575 L3.03521743,10.4312088 C3.03521743,10.5883062 3.34915502,10.7454035 3.50612381,10.7454035 L16.6915026,11.5308905 C16.6915026,11.5308905 17.1624089,11.5308905 17.1624089,12.0021827 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
