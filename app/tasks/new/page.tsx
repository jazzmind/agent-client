'use client';

/**
 * Create New Task Page
 * Form to create a new agent task with schedule and notification configuration.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';

interface Agent {
  id: string;
  name: string;
  display_name: string;
  description?: string;
}

const SCHEDULE_PRESETS = [
  { value: 'every_5_minutes', label: 'Every 5 minutes' },
  { value: 'every_15_minutes', label: 'Every 15 minutes' },
  { value: 'every_30_minutes', label: 'Every 30 minutes' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'every_2_hours', label: 'Every 2 hours' },
  { value: 'every_6_hours', label: 'Every 6 hours' },
  { value: 'daily', label: 'Daily (9 AM)' },
  { value: 'daily_morning', label: 'Daily Morning (9 AM)' },
  { value: 'daily_evening', label: 'Daily Evening (6 PM)' },
  { value: 'weekly', label: 'Weekly (Monday 9 AM)' },
  { value: 'monthly', label: 'Monthly (1st, 9 AM)' },
  { value: 'custom', label: 'Custom Cron Expression' },
];

const NOTIFICATION_CHANNELS = [
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'teams', label: 'Microsoft Teams', icon: '💬' },
  { value: 'slack', label: 'Slack', icon: '💬' },
  { value: 'webhook', label: 'Webhook', icon: '🔗' },
];

const TRIGGER_TYPES = [
  { value: 'cron', label: 'Scheduled (Cron)', description: 'Run on a recurring schedule' },
  { value: 'webhook', label: 'Webhook', description: 'Trigger via HTTP webhook' },
  { value: 'one_time', label: 'One-time', description: 'Run once at a specific time' },
];

export default function CreateTaskPage() {
  const router = useRouter();
  const { isReady } = useAuth();
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentId, setAgentId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [triggerType, setTriggerType] = useState('cron');
  const [schedulePreset, setSchedulePreset] = useState('daily');
  const [customCron, setCustomCron] = useState('0 9 * * *');
  const [oneTimeDate, setOneTimeDate] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationChannel, setNotificationChannel] = useState('email');
  const [notificationRecipient, setNotificationRecipient] = useState('');
  const [insightsEnabled, setInsightsEnabled] = useState(true);
  const [maxInsights, setMaxInsights] = useState(50);

  useEffect(() => {
    if (!isReady) return;
    loadAgents();
  }, [isReady]);

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to load agents');
      const data = await response.json();
      setAgents(data);
      if (data.length > 0) {
        setAgentId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !agentId || !prompt.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (notificationsEnabled && !notificationRecipient.trim()) {
      setError('Please provide a notification recipient');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Build trigger config
      let triggerConfig: any = {};
      if (triggerType === 'cron') {
        triggerConfig.cron = schedulePreset === 'custom' ? customCron : schedulePreset;
      } else if (triggerType === 'one_time' && oneTimeDate) {
        triggerConfig.run_at = new Date(oneTimeDate).toISOString();
      }

      // Build notification config
      let notificationConfig: any = null;
      if (notificationsEnabled) {
        notificationConfig = {
          enabled: true,
          channel: notificationChannel,
          recipient: notificationRecipient,
          include_summary: true,
          include_portal_link: true,
        };
      }

      // Build insights config
      const insightsConfig = {
        enabled: insightsEnabled,
        max_insights: maxInsights,
        purge_after_days: 30,
        include_in_context: true,
        context_limit: 10,
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          agent_id: agentId,
          prompt,
          trigger_type: triggerType,
          trigger_config: triggerConfig,
          notification_config: notificationConfig,
          insights_config: insightsConfig,
          scopes: ['search.read', 'web_search.read'],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to create task');
      }

      const task = await response.json();
      router.push(`/tasks/${task.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/tasks"
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-4 inline-block"
        >
          ← Back to Tasks
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Task</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure a new scheduled or event-driven agent task
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Daily AI News Summary"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this task does"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Agent *
              </label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.display_name || agent.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prompt / Instructions *
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What should the agent do? e.g., Search for the latest AI and technology news and summarize the top 5 stories"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
          </div>
        </div>

        {/* Trigger Configuration */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Trigger</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trigger Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {TRIGGER_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setTriggerType(type.value)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      triggerType === type.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {type.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {type.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {triggerType === 'cron' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schedule
                </label>
                <select
                  value={schedulePreset}
                  onChange={(e) => setSchedulePreset(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {SCHEDULE_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                
                {schedulePreset === 'custom' && (
                  <div className="mt-2">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Cron Expression (minute hour day month day_of_week)
                    </label>
                    <input
                      type="text"
                      value={customCron}
                      onChange={(e) => setCustomCron(e.target.value)}
                      placeholder="0 9 * * *"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {triggerType === 'one_time' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Run At
                </label>
                <input
                  type="datetime-local"
                  value={oneTimeDate}
                  onChange={(e) => setOneTimeDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}

            {triggerType === 'webhook' && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  A webhook URL will be generated when you create the task.
                  You can use this URL to trigger the task from external services.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Enable</span>
            </label>
          </div>
          
          {notificationsEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Channel
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {NOTIFICATION_CHANNELS.map((channel) => (
                    <button
                      key={channel.value}
                      type="button"
                      onClick={() => setNotificationChannel(channel.value)}
                      className={`p-2 border rounded-lg text-center transition-colors ${
                        notificationChannel === channel.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{channel.icon}</span>
                      <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                        {channel.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {notificationChannel === 'email' ? 'Email Address' : 
                   notificationChannel === 'webhook' ? 'Webhook URL' : 
                   'Webhook URL'} *
                </label>
                <input
                  type={notificationChannel === 'email' ? 'email' : 'url'}
                  value={notificationRecipient}
                  onChange={(e) => setNotificationRecipient(e.target.value)}
                  placeholder={
                    notificationChannel === 'email' 
                      ? 'you@example.com' 
                      : 'https://hooks.example.com/webhook'
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required={notificationsEnabled}
                />
              </div>
            </div>
          )}
        </div>

        {/* Task Memory */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Task Memory</h2>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={insightsEnabled}
                onChange={(e) => setInsightsEnabled(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Enable</span>
            </label>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Task memory helps the agent remember previous results to avoid sending duplicate information.
          </p>
          
          {insightsEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Insights to Keep
              </label>
              <input
                type="number"
                value={maxInsights}
                onChange={(e) => setMaxInsights(parseInt(e.target.value) || 50)}
                min={1}
                max={500}
                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            {submitting ? 'Creating...' : 'Create Task'}
          </button>
          <Link
            href="/tasks"
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
