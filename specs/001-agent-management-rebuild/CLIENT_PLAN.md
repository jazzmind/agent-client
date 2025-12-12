# Agent-Client Cleanup Plan - Remove Database Access

**Date**: 2025-12-11  
**Status**: ⚠️ IN PROGRESS  
**Estimated Time**: 1 day  
**Priority**: HIGH

---

## Overview

Remove all database access from agent-client and refactor to use agent-server and ingest API exclusively. Agent-client should be a pure frontend that proxies to backend APIs.

---

## Architecture Principles

### Agent-Client Role: Frontend Only

```
Agent-Client (Next.js)
  ├── UI Components (React)
  ├── API Route Handlers (proxy only)
  ├── NO Database Access
  ├── NO Business Logic
  └── NO File Storage

  Calls:
  ├── Agent-Server API (conversations, messages, agents, runs)
  └── Ingest API (file uploads, RAG, knowledge bases)
```

---

## Files to Delete

### 1. Prisma Files

```bash
rm -rf prisma/
rm -f lib/db.ts
rm -f app/api/chat/route-enhanced.ts
```

**Files**:
- `prisma/schema.prisma` - Database schema (moved to agent-server)
- `lib/db.ts` - Prisma client instance
- `app/api/chat/route-enhanced.ts` - Duplicate file

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

**File**: `lib/ingest-api-client.ts`

```typescript
const INGEST_API_URL = process.env.NEXT_PUBLIC_INGEST_API_URL || 'http://10.96.200.206:8001';

function getIngestApiHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || error.message || 'Request failed');
  }
  return response.json();
}

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
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  return handleResponse(response);
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
      ...getIngestApiHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      knowledge_base_id: knowledgeBaseId,
      top_k: topK,
    }),
  });
  
  return handleResponse(response);
}
```

### 2. Update Agent API Client

**File**: `lib/agent-api-client.ts`

Add conversation endpoints:

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

## API Routes to Rewrite

### 1. Chat Route

**File**: `app/api/chat/route.ts`

Remove all `db.*` calls, use agent-server API instead.

### 2. Chat Settings Route

**File**: `app/api/chat/settings/route.ts`

Remove `db.chatSettings`, use agent-server API.

### 3. Conversations Route

**File**: `app/api/conversations/route.ts`

Remove `db.conversation`, use agent-server API.

### 4. Conversation Detail Route

**File**: `app/api/conversations/[id]/route.ts`

Remove `db.conversation` and `db.message`, use agent-server API.

### 5. Upload Route

**File**: `app/api/upload/route.ts`

Use ingest API instead of mock implementation.

---

## Environment Variables

### Add to `.env.example`

```bash
# Ingest API URL
NEXT_PUBLIC_INGEST_API_URL=http://10.96.200.206:8001
```

---

## Execution Steps

### Phase 1: Preparation ✅

- [x] Create architecture documents
- [x] Create cleanup plan
- [x] Identify all files to change

### Phase 2: Create New Files

- [ ] Create `lib/ingest-api-client.ts`
- [ ] Update `lib/agent-api-client.ts` with conversation endpoints
- [ ] Update `env.example` with ingest API URL

### Phase 3: Rewrite API Routes

- [ ] Rewrite `app/api/chat/route.ts`
- [ ] Rewrite `app/api/chat/settings/route.ts`
- [ ] Rewrite `app/api/conversations/route.ts`
- [ ] Rewrite `app/api/conversations/[id]/route.ts`
- [ ] Rewrite `app/api/upload/route.ts`

### Phase 4: Delete Old Files

- [ ] Delete `prisma/` directory
- [ ] Delete `lib/db.ts`
- [ ] Delete `app/api/chat/route-enhanced.ts`

### Phase 5: Update Package.json

- [ ] Remove `@prisma/client` from dependencies
- [ ] Remove `prisma` from devDependencies
- [ ] Remove database scripts

### Phase 6: Testing

- [ ] Verify no Prisma imports
- [ ] Verify no database connections
- [ ] Test all API routes
- [ ] Test file upload
- [ ] Test conversation flow

### Phase 7: Commit

- [ ] Commit all changes
- [ ] Update documentation

---

## Verification Checklist

- [ ] No `prisma/` directory exists
- [ ] No `lib/db.ts` file exists
- [ ] No `@prisma/client` in package.json
- [ ] No `prisma` in devDependencies
- [ ] No database scripts in package.json
- [ ] No `import { db }` anywhere in codebase
- [ ] All API routes proxy to backend
- [ ] File upload uses ingest API
- [ ] Environment variables configured
- [ ] Application runs without database connection
- [ ] All tests pass

---

## Current Status

**Phase**: 1 (Preparation) ✅ COMPLETE  
**Next**: Phase 2 (Create New Files)

---

## Notes

- Agent-server endpoints must be implemented first (see SERVER_PLAN.md)
- Can work in parallel: create new files while server is being built
- Test with mock responses until server is ready
- Final integration testing after both client and server are complete

---

**Status**: ⚠️ READY TO START IMPLEMENTATION
