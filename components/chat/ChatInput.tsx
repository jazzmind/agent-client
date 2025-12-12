/**
 * ChatInput Component
 * 
 * Input area for chat messages with:
 * - Text input with auto-resize
 * - File attachment support
 * - Send button
 * - Loading state
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 */

'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Attachment } from '@/lib/types';

interface ChatInputProps {
  onSend: (message: string, attachments: File[]) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in bytes
  className?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type your message...',
  maxLength = 4000,
  acceptedFileTypes = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png',
  maxFileSize = 10 * 1024 * 1024, // 10MB
  className = '',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      await onSend(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file size
    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Maximum size is ${formatFileSize(maxFileSize)}.`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const remainingChars = maxLength - message.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className={`border-t border-gray-200 bg-white ${className}`}>
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 pt-3 pb-2 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
              >
                <span>📎</span>
                <span className="truncate max-w-[200px]">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({formatFileSize(file.size)})
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-red-500 hover:text-red-700 ml-2"
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4">
        <div className="flex items-end space-x-2">
          {/* File attachment button */}
          <button
            onClick={openFileDialog}
            disabled={disabled || isSubmitting}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            title="Attach file"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedFileTypes}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isSubmitting}
              maxLength={maxLength}
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            
            {/* Character count */}
            {message.length > maxLength * 0.8 && (
              <div
                className={`absolute bottom-2 right-2 text-xs ${
                  isOverLimit ? 'text-red-500' : 'text-gray-400'
                }`}
              >
                {remainingChars}
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={disabled || isSubmitting || (!message.trim() && attachments.length === 0) || isOverLimit}
            className="flex-shrink-0 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
            type="button"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span>Send</span>
              </>
            )}
          </button>
        </div>

        {/* Helper text */}
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
