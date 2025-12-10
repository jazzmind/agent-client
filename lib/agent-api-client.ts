/**
 * Client for the Python Agent Server API
 * 
 * This client handles communication with the new Python-based agent server
 * running on agent-lxc (port 4111). It includes:
 * - OAuth 2.0 authentication with token propagation
 * - Agent execution endpoints
 * - Run management
 * - Health checks
 */

import { apiFetch } from './fetch-wrapper';

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://10.96.201.202:4111';

// Shadow fetch so all relative calls include basePath
const fetch = apiFetch;

/**
 * Helper function to handle API responses
 */
async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || errorData.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Get authentication headers for agent API
 * This will be called from Next.js API routes which have access to the user's token
 */
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
// HEALTH & INFO
// ==========================================================================

/**
 * Check agent API health
 */
export async function checkAgentHealth() {
  const response = await fetch(`${AGENT_API_URL}/health`);
  return handleResponse(response);
}

/**
 * Get API information
 */
export async function getAgentApiInfo() {
  const response = await fetch(`${AGENT_API_URL}/`);
  return handleResponse(response);
}

// ==========================================================================
// AGENTS
// ==========================================================================

/**
 * List all available agents
 */
export async function listAgentsFromApi(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/agents`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Get agent details
 */
export async function getAgentDetails(agentId: string, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/agents/${agentId}`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Execute an agent (create a run)
 */
export async function executeAgent(
  agentId: string,
  payload: {
    input: string;
    context?: Record<string, any>;
    stream?: boolean;
  },
  token?: string
) {
  const response = await fetch(`${AGENT_API_URL}/agents/${agentId}/execute`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

/**
 * Query the weather agent (demo endpoint)
 */
export async function queryWeatherAgent(query: string, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/agents/weather/query`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify({ query }),
  });
  return handleResponse(response);
}

/**
 * List available models
 */
export async function listAvailableModels(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/agents/models`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

// ==========================================================================
// RUNS
// ==========================================================================

/**
 * Get run details
 */
export async function getRunDetails(runId: string, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/runs/${runId}`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

/**
 * List runs (optionally filtered by agent)
 */
export async function listRuns(agentId?: string, token?: string) {
  const url = agentId 
    ? `${AGENT_API_URL}/runs?agent_id=${agentId}`
    : `${AGENT_API_URL}/runs`;
  
  const response = await fetch(url, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Stream run updates via SSE
 * Returns an EventSource for server-sent events
 */
export function streamRunUpdates(runId: string, token?: string): EventSource {
  const url = new URL(`${AGENT_API_URL}/runs/${runId}/stream`);
  
  // EventSource doesn't support custom headers, so we pass token as query param
  if (token) {
    url.searchParams.set('token', token);
  }
  
  return new EventSource(url.toString());
}

// ==========================================================================
// WORKFLOWS
// ==========================================================================

/**
 * List all workflows
 */
export async function listWorkflowsFromApi(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/workflows`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Execute a workflow
 */
export async function executeWorkflow(
  workflowId: string,
  payload: {
    input: Record<string, any>;
    context?: Record<string, any>;
  },
  token?: string
) {
  const response = await fetch(`${AGENT_API_URL}/workflows/${workflowId}/execute`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

// ==========================================================================
// TOOLS
// ==========================================================================

/**
 * List all tools
 */
export async function listToolsFromApi(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/tools`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Execute a tool directly
 */
export async function executeTool(
  toolId: string,
  payload: Record<string, any>,
  token?: string
) {
  const response = await fetch(`${AGENT_API_URL}/tools/${toolId}/execute`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

// ==========================================================================
// EVALS
// ==========================================================================

/**
 * List all evaluations
 */
export async function listEvalsFromApi(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/evals`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Run an evaluation
 */
export async function runEval(
  evalId: string,
  payload: {
    agent_id: string;
    test_cases: Array<{
      input: string;
      expected_output?: string;
      context?: Record<string, any>;
    }>;
  },
  token?: string
) {
  const response = await fetch(`${AGENT_API_URL}/evals/${evalId}/run`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}
