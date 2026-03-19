import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  options?: string[];
}

interface TechPackChatProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function TechPackChat({ messages, isTyping, onSendMessage, disabled }: TechPackChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setInput('');
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOptionClick = (option: string) => {
    if (disabled) return;
    onSendMessage(option);
  };

  // Find the last assistant message with options (only show options for the latest)
  const lastAssistantWithOptions = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant' && m.options?.length);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Tech Pack Assistant</p>
          <p className="text-[11px] text-gray-400">Building your tech pack</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-2.5', msg.role === 'user' && 'flex-row-reverse')}>
            {/* Avatar */}
            <div
              className={cn(
                'w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5',
                msg.role === 'assistant' ? 'bg-gray-100' : 'bg-gray-900'
              )}
            >
              {msg.role === 'assistant' ? (
                <Bot className="w-3.5 h-3.5 text-gray-600" />
              ) : (
                <User className="w-3.5 h-3.5 text-white" />
              )}
            </div>

            {/* Bubble */}
            <div className={cn('flex flex-col gap-2 max-w-[85%]')}>
              <div
                className={cn(
                  'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  msg.role === 'assistant'
                    ? 'bg-gray-100 text-gray-800 rounded-tl-md'
                    : 'bg-gray-900 text-white rounded-tr-md'
                )}
                dangerouslySetInnerHTML={{
                  __html: msg.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>'),
                }}
              />

              {/* Quick-reply options — only on the latest assistant message */}
              {msg.role === 'assistant' &&
                msg.id === lastAssistantWithOptions?.id &&
                msg.options &&
                !disabled && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleOptionClick(opt)}
                        className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-gray-600" />
            </div>
            <div className="rounded-2xl rounded-tl-md bg-gray-100 px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-200 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Tech pack complete!' : 'Type your answer...'}
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent border-0 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-0 min-h-[24px] max-h-[120px] py-0.5"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className="w-8 h-8 rounded-lg bg-gray-900 hover:bg-gray-800 p-0 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
