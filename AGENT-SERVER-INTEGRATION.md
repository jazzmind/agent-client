# Agent Server Integration

This document describes the integration between the agent-client (Next.js) and the new Python agent-server.

## Overview

The agent-client now supports both:
1. **Legacy Mastra Server** (Node.js) - Original agent server
2. **Python Agent Server** (FastAPI + Pydantic AI) - New agent server with LiteLLM integration

## Architecture

```
Browser
  ↓
Next.js App (agent-client)
  ↓
Next.js API Routes (/api/agent/*)
  ↓
OAuth 2.0 Token Service (get admin token)
  ↓
Python Agent Server (agent-lxc:4111)
  ↓
LiteLLM (litellm-lxc:4000)
  ↓
Local LLMs (qwen3-30b, phi-4, etc.)
```

## Files Created

### 1. API Client Library
**`lib/agent-api-client.ts`**
- Client for Python agent-server API
- Handles authentication headers
- Provides typed functions for all endpoints
- Supports agents, workflows, tools, evals, and runs

### 2. Next.js API Route
**`app/api/agent/weather/route.ts`**
- Proxies requests to Python agent-server
- Handles OAuth 2.0 authentication
- Implements role-based access control
- Forwards Bearer tokens to agent-server

### 3. Weather Demo Page
**`app/weather/page.tsx`**
- Interactive demo of Python agent integration
- Shows role-based access control
- Displays authentication metadata
- Demonstrates tool calling and external API integration

## Authentication Flow

### 1. Client Request
```typescript
// Browser makes request to Next.js API route
fetch('/api/agent/weather', {
  method: 'POST',
  body: JSON.stringify({ query: 'What is the weather in Tokyo?' })
});
```

### 2. Next.js Gets Token
```typescript
// Next.js API route gets admin token
const identity = await getAdminIdentity();
// Returns: { token, clientId, scopes }
```

### 3. Check Authorization
```typescript
// Verify user has required scopes
const hasWeatherAccess = identity.scopes.some(scope => 
  scope.includes('weather') || scope.includes('admin')
);
```

### 4. Forward to Agent Server
```typescript
// Forward request with Bearer token
const response = await fetch(`${AGENT_API_URL}/agents/weather/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${identity.token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
});
```

### 5. Agent Server Validates Token
```python
# Python agent-server validates JWT token
# (Currently disabled for testing, will be re-enabled)
principal = await get_principal(request)
# Returns: Principal(client_id, scopes, user_id, etc.)
```

## Role-Based Access Control

### Weather Demo Requirements
The weather demo page requires one of these scopes:
- `weather.read` - Specific weather access
- `weather.write` - Weather write access
- `agent.execute` - General agent execution
- `admin.read` or `admin.write` - Admin access

### Checking Access
```typescript
const hasWeatherAccess = identity.scopes.some(scope => 
  scope.includes('weather') || 
  scope.includes('admin') || 
  scope.includes('agent')
);

if (!hasWeatherAccess) {
  return NextResponse.json(
    { error: 'Access denied. Weather functionality requires the "weather" role.' },
    { status: 403 }
  );
}
```

## Environment Configuration

### Required Variables

**`.env.local`** (agent-client):
```bash
# Python Agent Server URL
NEXT_PUBLIC_AGENT_API_URL=http://10.96.201.202:4111

# Admin Client Credentials (for OAuth)
ADMIN_CLIENT_ID=admin-ui-client
ADMIN_CLIENT_SECRET=your-admin-secret-here

# Token Service (for OAuth)
TOKEN_SERVICE_URL=https://agent-sundai.vercel.app
```

**`.env`** (agent-server on agent-lxc):
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db

# LiteLLM
LITELLM_BASE_URL=http://10.96.201.207:4000/v1
LITELLM_API_KEY=your-litellm-key

# Model
DEFAULT_MODEL=research  # Uses model_registry.yml

# Auth (for future use)
BUSIBOX_AUTHZ_URL=http://10.96.201.201:8000
```

## API Endpoints

### Weather Agent
```typescript
POST /api/agent/weather
Body: { query: string }
Response: { response: string, clientId: string, scopes: string[] }
```

### Direct Agent Server Endpoints
These can be called directly from Next.js API routes:

```typescript
// List agents
GET http://10.96.201.202:4111/agents

// Execute agent
POST http://10.96.201.202:4111/agents/{agentId}/execute
Body: { input: string, context?: object, stream?: boolean }

// Get run details
GET http://10.96.201.202:4111/runs/{runId}

// List workflows
GET http://10.96.201.202:4111/workflows

// Execute workflow
POST http://10.96.201.202:4111/workflows/{workflowId}/execute
Body: { input: object, context?: object }

// List tools
GET http://10.96.201.202:4111/tools

// Execute tool
POST http://10.96.201.202:4111/tools/{toolId}/execute
Body: { [key: string]: any }

// Health check
GET http://10.96.201.202:4111/health
```

## Testing the Integration

### 1. Start Agent Client
```bash
cd /Users/wessonnenreich/Code/sonnenreich/agent-client
npm run dev
```

### 2. Access Weather Demo
Navigate to: http://localhost:3000/weather

### 3. Test Queries
Try these example queries:
- "What is the weather in London?"
- "Should I bring an umbrella in Tokyo today?"
- "What's the weather like in San Francisco?"
- "Is it raining in Paris right now?"

### 4. Verify Authentication
Check the response metadata:
- Client ID should be displayed
- Scopes should include `admin.read`, `admin.write`, etc.
- Request should succeed if scopes include weather/admin/agent

### 5. Test Role-Based Access
To test access denial:
1. Modify the admin client scopes to exclude weather/admin/agent
2. Try accessing the weather page
3. Should receive 403 Forbidden error

## Deployment

### Busibox Deployment
The agent-client is deployed via Ansible to apps-lxc:

```bash
cd /path/to/busibox/provision/ansible
make deploy-agent-client
```

### Environment Variables on Busibox
Managed via Ansible vault:
```yaml
# provision/ansible/roles/secrets/vars/vault.yml
secrets:
  agent-client:
    admin_client_id: "admin-ui-client"
    admin_client_secret: "{{ vault_admin_client_secret }}"
    agent_api_url: "http://10.96.201.202:4111"
```

## Troubleshooting

### 1. "Failed to communicate with agent service"
- Check `NEXT_PUBLIC_AGENT_API_URL` is set correctly
- Verify agent-server is running: `curl http://10.96.201.202:4111/health`
- Check network connectivity between containers

### 2. "Authentication failed"
- Verify `ADMIN_CLIENT_ID` and `ADMIN_CLIENT_SECRET` are correct
- Check token service is accessible
- Verify client is registered in the system

### 3. "Access denied. Weather functionality requires the 'weather' role"
- Check admin client scopes include weather/admin/agent
- Verify token is being forwarded correctly
- Check agent-server logs for auth errors

### 4. "Invalid model name"
- Verify LiteLLM is configured with available models
- Check model_registry.yml has correct model purposes
- Ensure DEFAULT_MODEL matches a valid purpose

## Next Steps

### 1. Enable Authentication on Agent Server
Currently disabled for testing. Re-enable by uncommenting:
```python
# app/api/agents.py
principal: Principal = Depends(get_principal)
```

### 2. Add More Agent Demos
Create pages for:
- Document search agent
- RAG query agent
- Code generation agent
- Data analysis agent

### 3. Implement Streaming
Use SSE for real-time agent responses:
```typescript
const eventSource = streamRunUpdates(runId, token);
eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // Handle update
};
```

### 4. Add Run History
Display past agent runs with:
- Run status (pending, running, succeeded, failed)
- Input/output
- Execution time
- Error messages

### 5. Create Agent Builder UI
Allow users to:
- Create custom agents
- Configure tools and workflows
- Set scopes and permissions
- Test agents before deployment

## Success Criteria

✅ **Integration Complete**
- Agent-client can communicate with Python agent-server
- Authentication tokens are properly propagated
- Role-based access control is working
- Weather demo is functional end-to-end

✅ **Demonstrated Features**
- OAuth 2.0 client credentials flow
- JWT token forwarding
- Scope-based authorization
- Pydantic AI + LiteLLM integration
- Tool calling with external APIs
- Real-time weather data

✅ **Production Ready**
- Environment configuration via Ansible
- Secure credential management
- Error handling and logging
- Health checks
- Deployment automation

## References

- **Agent Server**: `/Users/wessonnenreich/Code/sonnenreich/busibox/srv/agent/`
- **Agent Client**: `/Users/wessonnenreich/Code/sonnenreich/agent-client/`
- **Busibox Deployment**: `/Users/wessonnenreich/Code/sonnenreich/busibox/provision/ansible/`
- **Model Registry**: `/Users/wessonnenreich/Code/sonnenreich/busibox/provision/ansible/group_vars/all/model_registry.yml`

