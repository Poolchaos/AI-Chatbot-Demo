'use client';

import { useRef, useEffect, useState, useCallback, type FormEvent, type KeyboardEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { X, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { useChatContext } from '@/components/chat-provider';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-2 rounded-full bg-slate-400"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function ChatWindow() {
  const {
    isOpen,
    closeWidget,
    messages,
    isLoading,
    isStreaming,
    leadSaved,
    error,
    send,
  } = useChatContext();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');

  // Auto-resize textarea
  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, []);

  // Auto-scroll to bottom on new messages / streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-focus input when widget opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading || isStreaming) return;
    send(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-20 right-4 z-50 flex flex-col
            w-[380px] h-[560px]
            sm:bottom-20 sm:right-4 sm:w-[380px] sm:h-[560px]
            max-sm:inset-0 max-sm:bottom-0 max-sm:right-0 max-sm:w-full max-sm:h-full
            rounded-2xl max-sm:rounded-none
            bg-white shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              <span className="font-semibold text-sm">Elevate Offsites</span>
              {leadSaved && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </motion.div>
              )}
            </div>
            <button
              onClick={closeWidget}
              className="rounded-full p-1 hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => (
                          <strong className="font-semibold">{children}</strong>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-4 mb-2">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-4 mb-2">{children}</ol>
                        ),
                        li: ({ children }) => <li className="mb-0.5">{children}</li>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-md">
                  <TypingIndicator />
                </div>
              </div>
            )}

            {error && !isLoading && (
              <div className="flex justify-center">
                <p className="text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-full">
                  {error}
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 px-4 py-3 border-t border-slate-200 bg-white shrink-0"
          >
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about our packages..."
              disabled={isLoading || isStreaming}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm
                placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40
                disabled:opacity-50 disabled:cursor-not-allowed
                max-h-24 scrollbar-thin"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || isStreaming}
              className="rounded-xl bg-blue-600 p-2.5 text-white
                hover:bg-blue-500 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
