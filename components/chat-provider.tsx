'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useChat, type ChatMessageUI } from '@/hooks/use-chat';

interface ChatContextValue {
  isOpen: boolean;
  openWidget: () => void;
  closeWidget: () => void;
  messages: ChatMessageUI[];
  isLoading: boolean;
  isStreaming: boolean;
  leadSaved: boolean;
  error: string | null;
  sessionMessageCount: number;
  send: (message: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasInitRef = useRef(false);
  const chat = useChat();

  const openWidget = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeWidget = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Auto-greeting: send __INIT__ when widget first opens with no messages
  useEffect(() => {
    if (isOpen && !hasInitRef.current && chat.messages.length === 0 && !chat.isLoading) {
      hasInitRef.current = true;
      chat.sendInit();
    }
  }, [isOpen, chat]);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        openWidget,
        closeWidget,
        messages: chat.messages,
        isLoading: chat.isLoading,
        isStreaming: chat.isStreaming,
        leadSaved: chat.leadSaved,
        error: chat.error,
        sessionMessageCount: chat.sessionMessageCount,
        send: chat.send,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}
