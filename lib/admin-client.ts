

/**
 * Admin API client that calls local API routes (which handle server-side auth)
 */

// Helper function to handle API responses
async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// ==========================================================================
// CLIENTS API (legacy - keeping for compatibility)
// ==========================================================================

/**
 * List all registered clients
 */
export async function listClients() {
  const response = await fetch('/api/admin/clients');
  return handleResponse(response);
}

/**
 * Register a new client
 */
export async function registerClient(clientData: {
  serverId: string;
  name: string;
  scopes: string[];
}) {
  const response = await fetch('/api/admin/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData),
  });
  return handleResponse(response);
}

/**
 * Delete a client
 */
export async function deleteClient(clientId: string) {
  const response = await fetch(`/api/admin/clients/${clientId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

/**
 * Update client scopes
 */
export async function updateClientScopes(clientId: string, scopes: string[]) {
  const response = await fetch('/api/admin/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serverId: clientId,
      name: clientId,
      scopes,
    }),
  });
  return handleResponse(response);
}

// ==========================================================================
// APPLICATIONS API (legacy - keeping for compatibility)
// ==========================================================================

/**
 * List all applications
 */
export async function listApplications() {
  const response = await fetch('/api/admin/applications');
  return handleResponse(response);
}

/**
 * Create a new application
 */
export async function createApplication(applicationData: {
  name: string;
  displayName: string;
  description: string;
}) {
  const response = await fetch('/api/admin/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(applicationData),
  });
  return handleResponse(response);
}

/**
 * Get application details
 */
export async function getApplication(applicationId: string) {
  const response = await fetch(`/api/admin/applications/${applicationId}`);
  return handleResponse(response);
}

/**
 * Delete an application
 */
export async function deleteApplication(applicationId: string) {
  const response = await fetch(`/api/admin/applications/${applicationId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

// ==========================================================================
// AGENTS API
// ==========================================================================

/**
 * List all agents
 */
export async function listAgents() {
  const response = await fetch('/api/admin/agents');
  return handleResponse(response);
}

/**
 * Create a new agent
 */
export async function createAgent(agentData: {
  name: string;
  displayName: string;
  instructions: string;
  model: string;
  tools: string[];
  scopes: string[];
}) {
  const response = await fetch('/api/admin/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agentData),
  });
  return handleResponse(response);
}

/**
 * Update an agent
 */
export async function updateAgent(agentId: string, agentData: {
  name?: string;
  displayName?: string;
  instructions?: string;
  model?: string;
  tools?: string[];
  scopes?: string[];
  isActive?: boolean;
}) {
  const response = await fetch(`/api/admin/agents/${agentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agentData),
  });
  return handleResponse(response);
}

/**
 * Delete an agent
 */
export async function deleteAgent(agentId: string) {
  const response = await fetch(`/api/admin/agents/${agentId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

// ==========================================================================
// WORKFLOWS API
// ==========================================================================

/**
 * List all workflows
 */
export async function listWorkflows() {
  const response = await fetch('/api/admin/workflows');
  return handleResponse(response);
}

/**
 * Create a new workflow
 */
export async function createWorkflow(workflowData: {
  name: string;
  displayName: string;
  description: string;
  steps: any[];
  triggers: any[];
  scopes: string[];
}) {
  const response = await fetch('/api/admin/workflows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflowData),
  });
  return handleResponse(response);
}

/**
 * Get workflow details including steps
 */
export async function getWorkflow(workflowId: string) {
  const response = await fetch(`/api/admin/workflows/${workflowId}`);
  return handleResponse(response);
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(workflowId: string) {
  const response = await fetch(`/api/admin/workflows/${workflowId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

// ==========================================================================
// TOOLS API
// ==========================================================================

/**
 * List all tools
 */
export async function listTools() {
  const response = await fetch('/api/admin/tools');
  return handleResponse(response);
}

/**
 * Create a new tool
 */
export async function createTool(toolData: {
  name: string;
  displayName: string;
  description: string;
  inputSchema: any;
  outputSchema?: any;
  executeCode: string;
  scopes: string[];
}) {
  const response = await fetch('/api/admin/tools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toolData),
  });
  return handleResponse(response);
}

/**
 * Delete a tool
 */
export async function deleteTool(toolId: string) {
  const response = await fetch(`/api/admin/tools/${toolId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

// ==========================================================================
// SCORERS API
// ==========================================================================

/**
 * List all scorers
 */
export async function listScorers() {
  const response = await fetch('/api/admin/scorers');
  return handleResponse(response);
}

/**
 * Create a new scorer
 */
export async function createScorer(scorerData: {
  name: string;
  displayName: string;
  description: string;
  scorerType: string;
  judgeModel: string;
  judgeInstructions: string;
  inputSchema: any;
  outputSchema?: any;
  config?: any;
  scopes: string[];
}) {
  const response = await fetch('/api/admin/scorers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scorerData),
  });
  return handleResponse(response);
}

/**
 * Delete a scorer
 */
export async function deleteScorer(scorerId: string) {
  const response = await fetch(`/api/admin/scorers/${scorerId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}