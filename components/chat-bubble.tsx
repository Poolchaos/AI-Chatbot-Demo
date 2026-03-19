'use client';

import { motion } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { useChatContext } from '@/components/chat-provider';

export function ChatBubble() {
  const { isOpen, openWidget, closeWidget } = useChatContext();

  return (
    <motion.button
      onClick={isOpen ? closeWidget : openWidget}
      className={`fixed bottom-4 right-4 z-50
        h-14 w-14 rounded-full
        bg-blue-600 text-white shadow-lg
        hover:bg-blue-500 transition-colors
        flex items-center justify-center
        ${isOpen ? 'max-sm:hidden' : ''}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      <motion.div
        key={isOpen ? 'close' : 'open'}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </motion.div>
      {/* Pulse ring when closed */}
      {!isOpen && (
        <span className="absolute inset-0 rounded-full animate-ping bg-blue-600/30 pointer-events-none" />
      )}
    </motion.button>
  );
}
