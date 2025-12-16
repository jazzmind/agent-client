/**
 * Comprehensive Client for the Python Agent Server API
 * 
 * This client provides full access to the agent-server API including:
 * - Agent definitions (list, create, update, delete)
 * - Tools, workflows, and evaluations management
 * - Run execution and monitoring
 * - Scheduling
 * - Scoring and aggregates
 * - Model information
 * - SSE streaming
 * 
 * Based on OpenAPI spec: specs/001-agent-management-rebuild/contracts/agent-server-api.yaml
 */

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://10.96.200.202:8000';

// ==========================================================================
// TYPES
// ==========================================================================

export interface AgentDefinition {
  id: string;
  name: string;
  display_name?: string | null;
  description?: string | null;
  model: string;
  instructions: string;
  tools: Record<string, any>;
  workflow?: Record<string, any> | null;
  scopes: string[];
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface AgentDefinitionCreate {
  name: string;
  display_name?: string;
  description?: string;
  model: string;
  instructions: string;
  tools?: Record<string, any>;
  workflow?: Record<string, any> | null;
  scopes?: string[];
  is_active?: boolean;
}

export interface Run {
  id: string;
  agent_id: string;
  workflow_id?: string | null;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'timeout';
  input: Record<string, any>;
  output?: Record<string, any> | null;
  events: RunEvent[];
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RunEvent {
  timestamp: string;
  type: string;
  data: Record<string, any>;
}

export interface RunCreate {
  agent_id: string;
  workflow_id?: string | null;
  input: Record<string, any>;
}

export interface ScheduleCreate {
  agent_id: string;
  cron: string;
  input: Record<string, any>;
  scopes: string[];
  purpose: string;
}

export interface Schedule {
  schedule_id: string;
  message: string;
}

export interface TokenExchangeResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
  scopes: string[];
}

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    
    // Handle various error formats
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    if (typeof errorData.detail === 'string') {
      errorMessage = errorData.detail;
    } else if (typeof errorData.error === 'string') {
      errorMessage = errorData.error;
    } else if (typeof errorData.message === 'string') {
      errorMessage = errorData.message;
    } else if (errorData.detail && typeof errorData.detail === 'object') {
      errorMessage = JSON.stringify(errorData.detail);
    } else if (errorData.error && typeof errorData.error === 'object') {
      errorMessage = JSON.stringify(errorData.error);
    }
    
    throw new Error(errorMessage);
  }
  return response.json();
}

export function getAgentApiHeaders(token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// ==========================================================================
// HEALTH & AUTH
// ==========================================================================

export async function checkHealth() {
  const response = await fetch(`${AGENT_API_URL}/health`);
  return handleResponse(response);
}

export async function exchangeToken(scopes: string[], purpose: string, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/auth/exchange`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify({ scopes, purpose }),
  });
  return handleResponse(response) as Promise<TokenExchangeResponse>;
}

// ==========================================================================
// AGENTS
// ==========================================================================

export async function listAgents(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/agents`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response) as Promise<AgentDefinition[]>;
}

export async function createAgentDefinition(data: AgentDefinitionCreate, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/agents/definitions`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(response) as Promise<AgentDefinition>;
}

export async function updateAgentDefinition(agentId: string, data: AgentDefinitionCreate, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/agents/definitions/${agentId}`, {
    method: 'PUT',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(response) as Promise<AgentDefinition>;
}

export async function deleteAgent(agentId: string, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/agents/definitions/${agentId}`, {
    method: 'DELETE',
    headers: getAgentApiHeaders(token),
  });
  if (response.status === 204) {
    return { success: true };
  }
  return handleResponse(response);
}

// ==========================================================================
// TOOLS
// ==========================================================================

export async function listTools(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/agents/tools`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

export async function createTool(data: any, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/agents/tools`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// ==========================================================================
// WORKFLOWS
// ==========================================================================

export async function listWorkflows(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/agents/workflows`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

export async function createWorkflow(data: any, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/agents/workflows`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// ==========================================================================
// EVALUATIONS
// ==========================================================================

export async function listEvals(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/agents/evals`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

export async function createEval(data: any, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/agents/evals`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// ==========================================================================
// MODELS
// ==========================================================================

export async function listModels(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/models`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

// ==========================================================================
// RUNS
// ==========================================================================

export async function createRun(data: RunCreate, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/runs`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(response) as Promise<Run>;
}

export async function getRun(runId: string, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/runs/${runId}`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response) as Promise<Run>;
}

export async function listRuns(filters?: {
  agent_id?: string;
  status?: string;
  created_by?: string;
  limit?: number;
  offset?: number;
}, token?: string) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
  }
  
  const url = `${AGENT_API_URL}/runs${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

export async function executeWorkflow(data: {
  workflow_id: string;
  input: Record<string, any>;
  tier?: string;
  scopes?: string[];
}, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/runs/workflow`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(response) as Promise<Run>;
}

// ==========================================================================
// SCHEDULES
// ==========================================================================

export async function createSchedule(data: ScheduleCreate, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/runs/schedule`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(response) as Promise<Schedule>;
}

export async function listSchedules(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/runs/schedule`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

export async function deleteSchedule(jobId: string, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/runs/schedule/${jobId}`, {
    method: 'DELETE',
    headers: getAgentApiHeaders(token),
  });
  if (response.status === 204) {
    return { success: true };
  }
  return handleResponse(response);
}

// ==========================================================================
// SCORES
// ==========================================================================

export async function executeScorer(data: {
  scorer_id: string;
  run_ids: string[];
}, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/scores/execute`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function getScoreAggregates(filters?: {
  scorer_id?: string;
  agent_id?: string;
}, token?: string) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value);
    });
  }
  
  const url = `${AGENT_API_URL}/scores/aggregates${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

// ==========================================================================
// CONVERSATIONS
// ==========================================================================

export interface Conversation {
  id: string;
  title: string;
  user_id: string;
  message_count?: number;
  last_message?: {
    role: string;
    content: string;
    created_at: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: any[];
  run_id?: string;
  routing_decision?: any;
  tool_calls?: any[];
  created_at: string;
}

export async function listConversations(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/conversations`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response) as Promise<Conversation[]>;
}

export async function getConversation(id: string, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/conversations/${id}`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response) as Promise<Conversation & { messages?: Message[] }>;
}

export async function createConversation(data: { title?: string }, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/conversations`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(response) as Promise<Conversation>;
}

export async function updateConversation(id: string, data: { title?: string }, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/conversations/${id}`, {
    method: 'PATCH',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(response) as Promise<Conversation>;
}

export async function deleteConversation(id: string, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/conversations/${id}`, {
    method: 'DELETE',
    headers: getAgentApiHeaders(token),
  });
  if (response.status === 204) {
    return { success: true };
  }
  return handleResponse(response);
}

// ==========================================================================
// MESSAGES
// ==========================================================================

export async function createMessage(
  conversationId: string,
  data: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: any[];
    run_id?: string;
    routing_decision?: any;
    tool_calls?: any[];
  },
  token?: string
) {
  const response = await fetch(
    `${AGENT_API_URL}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: getAgentApiHeaders(token),
      body: JSON.stringify(data),
    }
  );
  return handleResponse(response) as Promise<Message>;
}

export async function listMessages(conversationId: string, token?: string) {
  const response = await fetch(
    `${AGENT_API_URL}/conversations/${conversationId}/messages`,
    {
      headers: getAgentApiHeaders(token),
    }
  );
  return handleResponse(response) as Promise<Message[]>;
}

export async function getMessage(id: string, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/messages/${id}`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response) as Promise<Message>;
}

// ==========================================================================
// CHAT SETTINGS
// ==========================================================================

export interface ChatSettings {
  id: string;
  user_id: string;
  enabled_tools: string[];
  enabled_agents: string[];
  model?: string;
  temperature: number;
  max_tokens: number;
  created_at: string;
  updated_at: string;
}

export async function getChatSettings(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/users/me/chat-settings`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response) as Promise<ChatSettings>;
}

export async function updateChatSettings(
  data: {
    enabled_tools?: string[];
    enabled_agents?: string[];
    model?: string;
    temperature?: number;
    max_tokens?: number;
  },
  token?: string
) {
  const response = await fetch(`${AGENT_API_URL}/users/me/chat-settings`, {
    method: 'PUT',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(response) as Promise<ChatSettings>;
}

// ==========================================================================
// DISPATCHER
// ==========================================================================

export interface DispatcherRequest {
  query: string;
  available_tools: Array<{ name: string; description: string }>;
  available_agents: Array<{ id: string; name: string; description?: string }>;
  attachments?: Array<{ name: string; type: string; url: string }>;
  user_settings?: Record<string, any>;
}

export interface DispatcherResponse {
  selected_tools: string[];
  selected_agents: string[];
  confidence: number;
  reasoning: string;
  alternatives: string[];
  requires_disambiguation: boolean;
}

export async function routeQuery(data: DispatcherRequest, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/dispatcher/route`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(response) as Promise<DispatcherResponse>;
}

// ==========================================================================
// STREAMING (SSE)
// ==========================================================================

/**
 * Stream run updates via Server-Sent Events
 * Note: This should typically be called from a Next.js API route that proxies
 * the SSE stream, as EventSource doesn't support custom headers
 */
export function streamRunUpdates(runId: string): EventSource {
  // This will be called from /api/streams/runs/[id] which handles auth
  return new EventSource(`/api/streams/runs/${runId}`);
}

/**
 * Server-side SSE stream (for use in API routes)
 */
export async function getRunStreamResponse(runId: string, token?: string): Promise<Response> {
  const response = await fetch(`${AGENT_API_URL}/streams/runs/${runId}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Accept': 'text/event-stream',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to stream run: ${response.status}`);
  }
  
  return response;
}
