'use client';

import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessageUI {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseChatReturn {
  messages: ChatMessageUI[];
  isLoading: boolean;
  isStreaming: boolean;
  leadSaved: boolean;
  error: string | null;
  sessionMessageCount: number;
  send: (message: string) => void;
  sendInit: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionMessageCount, setSessionMessageCount] = useState(0);
  const sessionIdRef = useRef<string>(uuidv4());
  const abortRef = useRef<AbortController | null>(null);

  const streamResponse = useCallback(
    async (userMessage: string, isInit: boolean) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setIsStreaming(false);
      setError(null);

      // Add user message to UI (skip for __INIT__)
      if (!isInit) {
        const userMsg: ChatMessageUI = {
          id: uuidv4(),
          role: 'user',
          content: userMessage,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
      }

      // Create placeholder for assistant response
      const assistantId = uuidv4();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            message: userMessage,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setIsLoading(false);
          setError('Failed to connect to chat service.');
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let firstChunkReceived = false;

        // Add empty assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE lines: data: {...}\n\n
          const lines = buffer.split('\n');
          buffer = '';

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              try {
                const chunk = JSON.parse(jsonStr);

                if (chunk.type === 'text') {
                  if (!firstChunkReceived) {
                    firstChunkReceived = true;
                    setIsLoading(false);
                    setIsStreaming(true);
                  }
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: m.content + chunk.content }
                        : m
                    )
                  );
                }

                if (chunk.type === 'lead_saved') {
                  setLeadSaved(true);
                }

                if (chunk.type === 'done') {
                  setSessionMessageCount(chunk.sessionMessageCount ?? 0);
                }

                if (chunk.type === 'error') {
                  setError(chunk.message);
                  // If error is the only chunk, update assistant message
                  if (!firstChunkReceived) {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId
                          ? { ...m, content: chunk.message }
                          : m
                      )
                    );
                  }
                }

                if (chunk.type === 'limit_warning') {
                  // Could surface this in UI later, for now just log
                  console.warn(
                    `Token limit warning: ${chunk.kind} at ${chunk.percentUsed}%`
                  );
                }
              } catch {
                // Partial JSON line, put it back into buffer
                buffer = lines.slice(i).join('\n');
                break;
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Connection lost. Please try again.');
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        abortRef.current = null;

        // Remove empty assistant messages (edge case: request failed before any text)
        setMessages((prev) =>
          prev.filter((m) => m.role === 'user' || m.content.length > 0)
        );
      }
    },
    []
  );

  const send = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || isLoading || isStreaming) return;
      streamResponse(trimmed, false);
    },
    [streamResponse, isLoading, isStreaming]
  );

  const sendInit = useCallback(() => {
    if (messages.length > 0 || isLoading || isStreaming) return;
    streamResponse('__INIT__', true);
  }, [messages.length, isLoading, isStreaming, streamResponse]);

  return {
    messages,
    isLoading,
    isStreaming,
    leadSaved,
    error,
    sessionMessageCount,
    send,
    sendInit,
  };
}
