'use client';

import { Message } from 'ai';

interface ChatMessagesProps {
  messages: Message[];
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
      {messages.map((message, i) => (
        <div
          key={i}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-md lg:max-w-lg px-6 py-4 rounded-3xl ${
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground border border-border'
            }`}
          >
            <p className="text-base leading-relaxed">{message.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
