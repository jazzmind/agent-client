/**
 * Chat Page
 * 
 * Main chat interface for interacting with agents via dispatcher
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChatMessages } from '@/hooks/useChatMessages';
import { ChatSettings as ChatSettingsType } from '@/lib/types';

export default function ChatPage() {
  const [settings, setSettings] = useState<ChatSettingsType>({
    enabled_tools: [],
    enabled_agents: [],
  });

  const [availableTools, setAvailableTools] = useState<any[]>([]);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);

  const { messages, isLoading, sendMessage } = useChatMessages({
    onError: (error) => {
      console.error('Chat error:', error);
      alert(`Error: ${error.message}`);
    },
  });

  // Load available resources and settings
  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setIsLoadingResources(true);
    try {
      // Load in parallel
      const [toolsRes, agentsRes, modelsRes, settingsRes] = await Promise.all([
        fetch('/api/tools'),
        fetch('/api/agents'),
        fetch('/api/models'),
        fetch('/api/chat/settings'),
      ]);

      if (toolsRes.ok) {
        const tools = await toolsRes.json();
        setAvailableTools(tools);
      }

      if (agentsRes.ok) {
        const agents = await agentsRes.json();
        setAvailableAgents(agents);
      }

      if (modelsRes.ok) {
        const models = await modelsRes.json();
        setAvailableModels(models);
      }

      if (settingsRes.ok) {
        const userSettings = await settingsRes.json();
        setSettings(userSettings);
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setIsLoadingResources(false);
    }
  };

  const handleUpdateSettings = async (newSettings: ChatSettingsType) => {
    try {
      const response = await fetch('/api/chat/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const savedSettings = await response.json();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  if (isLoadingResources) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <ChatWindow
        messages={messages}
        settings={settings}
        availableTools={availableTools}
        availableAgents={availableAgents}
        availableModels={availableModels}
        onSendMessage={sendMessage}
        onUpdateSettings={handleUpdateSettings}
        isLoading={isLoading}
      />
    </div>
  );
}
