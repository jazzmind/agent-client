# Correct Architecture for Agent-Client

**Date**: 2025-12-11  
**Status**: ✅ CLARIFIED  
**Priority**: HIGH

---

## Architecture Principles

### 1. Agent-Client is a Frontend Only

The agent-manager is **purely a UI/UX layer** that orchestrates calls to backend APIs:

```
┌─────────────────────────────────────────────────────────┐
│                    Agent Client                         │
│                  (Next.js Frontend)                     │
│                                                         │
│  - UI Components (React)                                │
│  - API Route Handlers (proxy only)                      │
│  - NO Database Access                                   │
│  - NO Business Logic                                    │
│  - NO File Storage                                      │
└─────────────────────────────────────────────────────────┘
                    │           │
                    │           │
        ┌───────────┘           └───────────┐
        │                                   │
        ▼                                   ▼
┌─────────────────┐              ┌─────────────────┐
│  Agent Server   │              │  Ingest API     │
│   (FastAPI)     │              │   (FastAPI)     │
│                 │              │                 │
│ - Agents        │              │ - Documents     │
│ - Runs          │              │ - Embeddings    │
│ - Conversations │              │ - RAG           │
│ - Messages      │              │ - File Upload   │
│ - Settings      │              │ - Knowledge     │
│ - Auth/RBAC     │              │   Bases         │
└────────┬────────┘              └────────┬────────┘
         │                                │
         │                                │
         ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│   PostgreSQL    │              │     Milvus      │
│    (pg-lxc)     │              │  (milvus-lxc)   │
│                 │              │                 │
│ - Agent data    │              │ - Embeddings    │
│ - Conversations │              │ - Vector search │
│ - Messages      │              │                 │
└─────────────────┘              └─────────────────┘
                                          │
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │      MinIO      │
                                 │   (files-lxc)   │
                                 │                 │
                                 │ - Raw files     │
                                 │ - Attachments   │
                                 └─────────────────┘
```

---

## Key Architecture Rules

### Rule 1: No Database in Agent-Client

❌ **NEVER**:
- Direct database connections (Prisma, TypeORM, etc.)
- Database migrations in agent-manager
- SQL queries from agent-manager

✅ **ALWAYS**:
- Call agent-server API for data
- Let agent-server handle database
- Agent-client is stateless

### Rule 2: File Handling via Ingest API

When files are received (chat upload, crawler, etc.):

1. **Upload to Ingest API**: `POST /ingest/upload`
2. **Ingest API**:
   - Stores file in MinIO
   - Extracts text/content
   - Generates embeddings
   - Stores in Milvus
   - Creates knowledge base entry
3. **Link to Conversation**: Agent-server links file to conversation/thread

### Rule 3: Conversation-Scoped RAG

Each conversation has its own RAG context:

```
Conversation
  ├── Messages (agent-server)
  ├── Files (ingest API)
  ├── Knowledge Base (ingest API)
  │   ├── Documents
  │   ├── Embeddings
  │   └── Metadata
  └── Lifecycle Settings
      ├── Duration (how long to keep)
      └── Memory creation (extract learnings)
```

**Agent Configuration**:
```json
{
  "conversation_lifecycle": {
    "retention_days": 30,
    "create_memories": true,
    "memory_extraction_prompt": "Extract key learnings..."
  }
}
```

---

## API Responsibilities

### Agent-Server API

**Owns**:
- Agent definitions
- Runs and execution
- Conversations and messages
- User settings
- Schedules and workflows
- Authorization and RBAC

**Endpoints**:
```
GET/POST /conversations
GET/POST /conversations/{id}/messages
GET/PUT /users/me/chat-settings
POST /runs (execute agents)
GET /streams/runs/{id} (SSE streaming)
POST /dispatcher/route (intelligent routing)
```

### Ingest API

**Owns**:
- File uploads
- Document processing
- Embedding generation
- Knowledge bases
- RAG search
- Vector storage

**Endpoints**:
```
POST /ingest/upload (upload file)
POST /ingest/process (process document)
GET /knowledge-bases (list KBs)
POST /knowledge-bases (create KB)
POST /knowledge-bases/{id}/documents (add doc)
POST /search/semantic (RAG search)
DELETE /knowledge-bases/{id} (cleanup)
```

### Agent-Client API Routes

**Purpose**: Proxy only, no business logic

**Pattern**:
```typescript
// app/api/conversations/route.ts
export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const conversations = await agentClient.listConversations(token);
  return NextResponse.json(conversations);
}
```

---

## File Upload Flow

### User Uploads File in Chat

```
1. User selects file in chat UI
   ↓
2. Agent-Client: POST /api/upload
   ↓
3. Agent-Client → Ingest API: POST /ingest/upload
   {
     "file": binary,
     "conversation_id": "uuid",
     "user_id": "string",
     "create_knowledge_base": true
   }
   ↓
4. Ingest API:
   - Uploads to MinIO
   - Extracts text
   - Generates embeddings
   - Creates/updates knowledge base for conversation
   - Returns file metadata
   ↓
5. Agent-Client → Agent-Server: POST /conversations/{id}/messages
   {
     "role": "user",
     "content": "Here's the document...",
     "attachments": [{
       "file_id": "uuid",
       "name": "doc.pdf",
       "url": "minio://...",
       "knowledge_base_id": "uuid"
     }]
   }
   ↓
6. Agent-Server:
   - Saves message with attachment
   - Links to conversation
   - Returns message
   ↓
7. Agent-Client displays message with file
```

### Agent Processes File

```
1. Agent receives message with attachment
   ↓
2. Agent-Server checks if file has knowledge base
   ↓
3. If yes: Agent can use RAG search
   POST /search/semantic
   {
     "query": "user's question",
     "knowledge_base_id": "conversation-kb-uuid",
     "top_k": 5
   }
   ↓
4. Agent uses retrieved context in response
   ↓
5. Response includes sources from RAG
```

---

## Conversation Lifecycle Management

### Agent Configuration

```json
{
  "name": "research-assistant",
  "conversation_settings": {
    "retention_policy": {
      "duration_days": 30,
      "auto_delete": true
    },
    "memory_creation": {
      "enabled": true,
      "trigger": "on_conversation_end",
      "extraction_prompt": "Summarize key insights and learnings from this conversation.",
      "store_in_knowledge_base": true
    },
    "rag_settings": {
      "create_conversation_kb": true,
      "kb_lifecycle": "same_as_conversation",
      "include_in_search": true
    }
  }
}
```

### Lifecycle Stages

**1. Conversation Start**:
- Agent-server creates conversation
- If `create_conversation_kb: true`, creates knowledge base via ingest API
- Links KB to conversation

**2. During Conversation**:
- Files uploaded → added to conversation KB
- Agent can search conversation KB for context
- Messages stored in agent-server

**3. Conversation End** (user closes, timeout, etc.):
- If `memory_creation.enabled: true`:
  - Agent extracts key learnings
  - Stores as structured memory
  - Optionally adds to user's long-term KB

**4. Retention Period Expires**:
- If `auto_delete: true`:
  - Delete conversation from agent-server
  - Delete conversation KB from ingest API
  - Delete files from MinIO (if not referenced elsewhere)

---

## Implementation Changes Required

### 1. Remove from Agent-Client

- ❌ Delete `prisma/` directory
- ❌ Delete `lib/db.ts`
- ❌ Remove `@prisma/client` and `prisma` from package.json
- ❌ Remove database scripts from package.json
- ❌ Delete all direct database access code

### 2. Add to Agent-Server

- ✅ Conversation model and endpoints
- ✅ Message model and endpoints
- ✅ Chat settings model and endpoints
- ✅ File attachment metadata (links to ingest API)
- ✅ Conversation lifecycle management
- ✅ Memory extraction on conversation end

### 3. Update Ingest API

- ✅ Knowledge base per conversation
- ✅ Link documents to conversations
- ✅ Lifecycle management (delete KB when conversation deleted)
- ✅ File upload with conversation context

### 4. Update Agent-Client

- ✅ Remove all database code
- ✅ Update API routes to proxy to agent-server
- ✅ Update file upload to use ingest API
- ✅ Update components to use API routes

---

## Agent-Client Code Structure

### Correct Pattern

```typescript
// lib/agent-api-client.ts
export async function listConversations(token?: string) {
  const response = await fetch(`${AGENT_API_URL}/conversations`, {
    headers: getAgentApiHeaders(token),
  });
  return handleResponse(response);
}

// lib/ingest-api-client.ts
export async function uploadFile(file: File, conversationId: string, token?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('conversation_id', conversationId);
  formData.append('create_knowledge_base', 'true');
  
  const response = await fetch(`${INGEST_API_URL}/ingest/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  return handleResponse(response);
}

// app/api/conversations/route.ts
export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const conversations = await agentClient.listConversations(token);
  return NextResponse.json(conversations);
}

// app/api/upload/route.ts
export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const conversationId = formData.get('conversation_id') as string;
  
  const result = await ingestClient.uploadFile(file, conversationId, token);
  return NextResponse.json(result);
}
```

---

## Migration Steps

### Step 1: Update Ingest API (if needed)

1. Add conversation-scoped knowledge bases
2. Add file upload with conversation linking
3. Add lifecycle management

### Step 2: Update Agent-Server

1. Add conversation/message models
2. Implement CRUD endpoints
3. Add file attachment metadata
4. Add conversation lifecycle management
5. Add memory extraction

### Step 3: Update Agent-Client

1. Create `lib/ingest-api-client.ts`
2. Remove all Prisma code
3. Update API routes to proxy
4. Update file upload to use ingest API
5. Update components
6. Test end-to-end

### Step 4: Deploy

1. Deploy ingest API updates
2. Deploy agent-server updates
3. Deploy agent-manager updates
4. Verify no database connections from client

---

## Benefits of Correct Architecture

✅ **Separation of Concerns**:
- Client: UI/UX only
- Agent-server: Agent logic and conversations
- Ingest API: File processing and RAG

✅ **Scalability**:
- Each service scales independently
- No database connection overhead from client

✅ **Security**:
- All authorization in backend
- No database credentials in client

✅ **Maintainability**:
- Clear boundaries
- Easy to test
- Single source of truth

✅ **Flexibility**:
- Can add more clients (mobile, CLI)
- Can swap implementations
- Can add features without client changes

---

## Summary

**Agent-Client Role**: Frontend orchestrator
- Displays UI
- Calls agent-server for conversations/messages
- Calls ingest API for file uploads
- NO database access
- NO business logic

**Agent-Server Role**: Agent orchestration and data
- Manages agents, runs, conversations
- Stores messages and metadata
- Handles authorization
- Manages conversation lifecycle

**Ingest API Role**: File processing and RAG
- Uploads files to MinIO
- Processes documents
- Generates embeddings
- Provides semantic search
- Manages knowledge bases

---

**Status**: ✅ ARCHITECTURE CLARIFIED - Ready to implement correctly
