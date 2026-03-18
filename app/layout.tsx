import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ChatProvider } from '@/components/chat-provider';
import { ChatWindow } from '@/components/chat-window';
import { ChatBubble } from '@/components/chat-bubble';
import { ErrorBoundary } from '@/components/error-boundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Elevate Offsites — Premium Corporate Retreats',
  description:
    'Plan your next corporate retreat with Elevate Offsites. AI-powered event planning for teams of 15-200.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <ChatProvider>
            {children}
            <ChatWindow />
            <ChatBubble />
          </ChatProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
