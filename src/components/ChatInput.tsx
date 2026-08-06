'use client';

import { forwardRef } from 'react';
import { Smile, Paperclip } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(
  ({ value, onChange, placeholder, disabled }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === 'Enter' &&
        !e.shiftKey &&
        !e.nativeEvent.isComposing &&
        e.keyCode !== 229
      ) {
        e.currentTarget.form?.dispatchEvent(
          new Event('submit', { cancelable: true, bubbles: true })
        );
      }
    };

    return (
      <div className="relative w-full flex items-center">
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Talk live or type here...'}
          disabled={disabled}
          className="w-full pl-5 pr-20 py-3.5 bg-background text-foreground text-sm rounded-full border border-border/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-muted-foreground/70 shadow-sm"
        />
        <div className="absolute right-4 flex items-center gap-2 text-muted-foreground/60 pointer-events-none">
          <Smile className="w-5 h-5 hover:text-foreground transition-colors cursor-pointer" />
          <Paperclip className="w-5 h-5 hover:text-foreground transition-colors cursor-pointer" />
        </div>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';

export default ChatInput;
