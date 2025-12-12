/**
 * MessageList Component
 * 
 * Scrollable list of chat messages with:
 * - Auto-scroll to bottom on new messages
 * - Loading indicator
 * - Empty state
 * - Virtualization for performance (optional)
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { Message } from '@/lib/types';
import { ChatMessage } from './ChatMessage';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  emptyMessage?: string;
  showRoutingDecisions?: boolean;
  showToolCalls?: boolean;
  autoScroll?: boolean;
  className?: string;
}

export function MessageList({
  messages,
  isLoading = false,
  emptyMessage = 'No messages yet. Start a conversation!',
  showRoutingDecisions = true,
  showToolCalls = true,
  autoScroll = true,
  className = '',
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Check if user has scrolled up
  const [isUserScrolling, setIsUserScrolling] = React.useState(false);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsUserScrolling(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`relative flex-1 overflow-hidden ${className}`}>
      {/* Messages container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto px-4 py-6 space-y-4"
      >
        {messages.length === 0 && !isLoading ? (
          // Empty state
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-lg">{emptyMessage}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                showRoutingDecision={showRoutingDecisions}
                showToolCalls={showToolCalls}
              />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Scroll to bottom button */}
      {isUserScrolling && messages.length > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
          title="Scroll to bottom"
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
