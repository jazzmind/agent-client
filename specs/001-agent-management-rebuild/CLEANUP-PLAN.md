# Agent-Client Cleanup Plan - Remove Database Code

**Date**: 2025-12-11  
**Status**: Ready to Execute  
**Priority**: HIGH

---

## Files to Delete

### 1. Prisma Files

```bash
rm -rf prisma/
rm -f lib/db.ts
```

**Files**:
- `prisma/schema.prisma` - Database schema (move to agent-server)
- `lib/db.ts` - Prisma client instance

### 2. API Routes with Database Access

These files need to be **rewritten** to proxy to agent-server:

- `app/api/chat/route.ts` - Currently uses `db.conversation`, `db.message`, `db.chatSettings`
- `app/api/chat/settings/route.ts` - Currently uses `db.chatSettings`
- `app/api/conversations/route.ts` - Currently uses `db.conversation`
- `app/api/conversations/[id]/route.ts` - Currently uses `db.conversation`, `db.message`

**Action**: Rewrite to call agent-server API instead

### 3. Temporary/Old Files

```bash
rm -f app/api/chat/route-enhanced.ts  # Was replaced by route.ts
```

---

## Package.json Changes

### Remove Dependencies

```json
{
  "dependencies": {
    "@prisma/client": "^5.22.0",  // REMOVE
  },
  "devDependencies": {
    "prisma": "^5.22.0",  // REMOVE
  },
  "scripts": {
    "db:generate": "prisma generate",  // REMOVE
    "db:push": "prisma db push",  // REMOVE
    "db:migrate": "prisma migrate deploy",  // REMOVE
    "db:studio": "prisma studio"  // REMOVE
  }
}
```

---

## New Files to Create

### 1. Ingest API Client

```typescript
// lib/ingest-api-client.ts
const INGEST_API_URL = process.env.NEXT_PUBLIC_INGEST_API_URL || 'http://10.96.200.206:8001';

export async function uploadFile(
  file: File,
  conversationId: string,
  token?: string
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('conversation_id', conversationId);
  formData.append('create_knowledge_base', 'true');
  
  const response = await fetch(`${INGEST_API_URL}/ingest/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
  
  return response.json();
}

export async function searchKnowledgeBase(
  query: string,
  knowledgeBaseId: string,
  topK: number = 5,
  token?: string
) {
  const response = await fetch(`${INGEST_API_URL}/search/semantic`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      knowledge_base_id: knowledgeBaseId,
      top_k: topK,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }
  
  return response.json();
}
```

### 2. Updated Agent API Client

Add conversation endpoints to `lib/agent-api-client.ts`:

```typescript
// Conversations
export async function listConversations(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/conversations`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

export async function getConversation(id: string, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/conversations/${id}`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

export async function createConversation(data: { title?: string }, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/conversations`, {
    method: 'POST',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
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

// Messages
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
  return handleResponse(response);
}

// Chat Settings
export async function getChatSettings(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/users/me/chat-settings`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

export async function updateChatSettings(data: any, token?: string) {
  const response = await fetch(`${AGENT_API_URL}/users/me/chat-settings`, {
    method: 'PUT',
    headers: getAgentApiHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}
```

---

## Rewrite API Routes

### 1. Chat Route

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { getTokenFromRequest, getUserIdFromToken } from '@/lib/auth-helper';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { conversation_id, message, attachments = [], user_override = null } = body;

    // Get or create conversation
    let conversation;
    if (conversation_id) {
      conversation = await agentClient.getConversation(conversation_id, token);
    } else {
      conversation = await agentClient.createConversation(
        { title: message.substring(0, 50) },
        token
      );
    }

    // Save user message
    const userMessage = await agentClient.createMessage(
      conversation.id,
      {
        role: 'user',
        content: message,
        attachments,
      },
      token
    );

    // Get chat settings
    const settings = await agentClient.getChatSettings(token);

    // Load available tools and agents
    const [allTools, allAgents] = await Promise.all([
      agentClient.listTools(token),
      agentClient.listAgents(token),
    ]);

    // Filter by enabled settings
    const availableTools = allTools
      .filter((t: any) => settings.enabled_tools.includes(t.name))
      .map((t: any) => ({ name: t.name, description: t.description || '' }));

    const availableAgents = allAgents
      .filter((a: any) => settings.enabled_agents.includes(a.id))
      .map((a: any) => ({ id: a.id, name: a.name, description: a.description || '' }));

    // Call dispatcher
    let routingDecision;
    if (user_override) {
      routingDecision = {
        selected_tools: user_override.tools || [],
        selected_agents: user_override.agents || [],
        confidence: 1.0,
        reasoning: 'User override',
        alternatives: [],
        requires_disambiguation: false,
      };
    } else {
      routingDecision = await agentClient.routeQuery(
        {
          query: message,
          available_tools: availableTools,
          available_agents: availableAgents,
          attachments,
          user_settings: {
            temperature: settings.temperature,
            max_tokens: settings.max_tokens,
            model: settings.model,
          },
        },
        token
      );
    }

    // Check if disambiguation needed
    if (routingDecision.requires_disambiguation) {
      return NextResponse.json({
        requires_disambiguation: true,
        routing_decision: routingDecision,
        userMessage,
      });
    }

    // Execute routing decision
    let runId: string | null = null;
    let responseContent = '';

    if (routingDecision.selected_tools.length > 0 || routingDecision.selected_agents.length > 0) {
      const agentId = routingDecision.selected_agents[0] || 'chat-assistant';
      const run = await agentClient.createRun(
        {
          agent_id: agentId,
          input: {
            query: message,
            attachments,
            selected_tools: routingDecision.selected_tools,
            conversation_id: conversation.id,
          },
        },
        token
      );
      runId = run.id;
      responseContent = 'Processing your request...';
    } else {
      responseContent = "I'm not sure how to help with that. Could you rephrase your question?";
    }

    // Create assistant message
    const assistantMessage = await agentClient.createMessage(
      conversation.id,
      {
        role: 'assistant',
        content: responseContent,
        run_id: runId,
        routing_decision: routingDecision,
      },
      token
    );

    return NextResponse.json({
      userMessage,
      assistantMessage,
      conversation,
      runId,
      requires_disambiguation: false,
    });
  } catch (error: any) {
    console.error('[API] Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat message' },
      { status: error.statusCode || 500 }
    );
  }
}
```

### 2. Chat Settings Route

```typescript
// app/api/chat/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { getTokenFromRequest } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const settings = await agentClient.getChatSettings(token);
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('[API] Get settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get settings' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const settings = await agentClient.updateChatSettings(body, token);
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('[API] Update settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: error.statusCode || 500 }
    );
  }
}
```

### 3. Conversations Route

```typescript
// app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { getTokenFromRequest } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const conversations = await agentClient.listConversations(token);
    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('[API] List conversations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list conversations' },
      { status: error.statusCode || 500 }
    );
  }
}
```

### 4. Conversation Detail Route

```typescript
// app/api/conversations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { getTokenFromRequest } from '@/lib/auth-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const conversation = await agentClient.getConversation(params.id, token);
    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error('[API] Get conversation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get conversation' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await agentClient.deleteConversation(params.id, token);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('[API] Delete conversation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete conversation' },
      { status: error.statusCode || 500 }
    );
  }
}
```

### 5. Upload Route (Use Ingest API)

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as ingestClient from '@/lib/ingest-api-client';
import { getTokenFromRequest } from '@/lib/auth-helper';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const conversationId = formData.get('conversation_id') as string;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
        { status: 400 }
      );
    }

    const uploadedFiles = [];
    for (const file of files) {
      const result = await ingestClient.uploadFile(file, conversationId, token);
      uploadedFiles.push(result);
    }

    return NextResponse.json(uploadedFiles);
  } catch (error: any) {
    console.error('[API] Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload files' },
      { status: error.statusCode || 500 }
    );
  }
}
```

---

## Environment Variables

### Add to `.env.example` and `.env`

```bash
# Ingest API URL
NEXT_PUBLIC_INGEST_API_URL=http://10.96.200.206:8001
```

---

## Execution Steps

### 1. Backup Current Code

```bash
cd /Users/wessonnenreich/Code/sonnenreich/agent-client
git checkout -b remove-database-access
```

### 2. Delete Prisma Files

```bash
rm -rf prisma/
rm -f lib/db.ts
rm -f app/api/chat/route-enhanced.ts
```

### 3. Update package.json

Remove Prisma dependencies and scripts

### 4. Create New Files

- `lib/ingest-api-client.ts`
- Update `lib/agent-api-client.ts` with conversation endpoints

### 5. Rewrite API Routes

- `app/api/chat/route.ts`
- `app/api/chat/settings/route.ts`
- `app/api/conversations/route.ts`
- `app/api/conversations/[id]/route.ts`
- `app/api/upload/route.ts`

### 6. Update Environment

Add `NEXT_PUBLIC_INGEST_API_URL`

### 7. Test

- Verify no Prisma imports
- Verify no database connections
- Test all API routes
- Test file upload

### 8. Commit

```bash
git add -A
git commit -m "refactor: remove database access, use agent-server and ingest API"
```

---

## Verification Checklist

- [ ] No `prisma/` directory
- [ ] No `lib/db.ts` file
- [ ] No `@prisma/client` in package.json
- [ ] No `prisma` in devDependencies
- [ ] No database scripts in package.json
- [ ] No `import { db }` anywhere
- [ ] All API routes proxy to backend
- [ ] File upload uses ingest API
- [ ] Environment variables configured
- [ ] All tests pass
- [ ] Application runs without database connection

---

**Status**: Ready to execute cleanup
