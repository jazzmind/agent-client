/**
 * Chat Page
 * 
 * Main chat interface for interacting with agents via dispatcher
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChatInterface } from '@jazzmind/busibox-app';
import type { ChatModelOption } from '@jazzmind/busibox-app';

export default function ChatPage() {
  const [modelsRaw, setModelsRaw] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadModels() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/models');
        if (!res.ok) {
          throw new Error(`Failed to load models: ${res.status}`);
        }
        const data = await res.json();
        setModelsRaw(Array.isArray(data) ? data : data.models || []);
      } catch (err) {
        console.error(err);
        setModelsRaw([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadModels();
  }, []);

  const availableModels: ChatModelOption[] = useMemo(() => {
    return modelsRaw
      .map((m: any) => ({
        id: String(m.id ?? m.name ?? ''),
        name: String(m.name ?? m.id ?? 'Unknown model'),
        description: m.provider ? String(m.provider) : undefined,
      }))
      .filter((m: ChatModelOption) => Boolean(m.id));
  }, [modelsRaw]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <ChatInterface availableModels={availableModels} />
    </div>
  );
}
