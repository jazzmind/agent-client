# System Architecture Overview

**Last Updated**: 2025-12-11

---

## High-Level Architecture

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
│ - Conversations │              │ - File Upload   │
│ - Messages      │              │ - Knowledge     │
│ - Settings      │              │   Bases         │
│ - Agents        │              │ - RAG Search    │
│ - Runs          │              │ - Embeddings    │
└────────┬────────┘              └────────┬────────┘
         │                                │
         ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│   PostgreSQL    │              │     Milvus      │
│    (pg-lxc)     │              │  (milvus-lxc)   │
└─────────────────┘              └─────────────────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │      MinIO      │
                                 │   (files-lxc)   │
                                 └─────────────────┘
```

---

## Architecture Principles

### 1. Frontend-Only Design

The agent-manager is **purely a frontend application**:

✅ **Does**:
- Displays UI components
- Handles user interactions
- Makes API calls to backends
- Manages client-side state (temporary)
- Provides real-time updates via SSE

❌ **Does Not**:
- Access database directly
- Store persistent data
- Implement business logic
- Store files
- Manage user authentication (delegated to auth service)

### 2. API Gateway Pattern

All `app/api/*` routes are **proxies**:

```typescript
// Example: app/api/conversations/route.ts
export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const conversations = await agentClient.listConversations(token);
  return NextResponse.json(conversations);
}
```

**Benefits**:
- Centralized error handling
- Token management in one place
- Easy to mock for testing
- Clear separation of concerns

### 3. Stateless Client

The client maintains **no persistent state**:
- Authentication tokens in httpOnly cookies
- All data from backend APIs
- Conversation state in agent-server
- File state in ingest API

### 4. Type Safety

100% TypeScript with strict mode:
- All API responses typed
- Props validated at compile time
- No `any` types (except where necessary)
- Shared types in `lib/types.ts`

---

## Component Architecture

### UI Layer

```
components/
├── chat/           # Chat interface components
│   ├── ChatWindow.tsx
│   ├── ChatMessage.tsx
│   ├── ChatInput.tsx
│   ├── MessageList.tsx
│   └── ChatSettings.tsx
├── agents/         # Agent management components
│   ├── AgentCard.tsx
│   ├── AgentList.tsx
│   ├── AgentDetail.tsx (planned)
│   └── AgentForm.tsx (planned)
└── ui/             # Shared UI components
```

### API Layer

```
app/api/
├── chat/
│   ├── route.ts           # Send message
│   └── settings/route.ts  # Get/update settings
├── conversations/
│   ├── route.ts           # List conversations
│   └── [id]/route.ts      # Get/delete conversation
├── agents/
│   └── route.ts           # List agents
├── upload/
│   └── route.ts           # Upload files
└── streams/
    └── runs/[id]/route.ts # SSE streaming
```

### Client Libraries

```
lib/
├── agent-api-client.ts   # Agent Server API client
├── ingest-api-client.ts  # Ingest API client
├── auth-helper.ts        # JWT token utilities
├── error-handler.ts      # Error handling
├── sse-client.ts         # SSE streaming
└── types.ts              # Shared TypeScript types
```

---

## Data Flow

### 1. Chat Message Flow

```
1. User types message in ChatInput
   ↓
2. Submit → POST /api/chat
   ↓
3. API route extracts token
   ↓
4. Create/get conversation (agent-server)
   ↓
5. Save user message (agent-server)
   ↓
6. Get chat settings (agent-server)
   ↓
7. Call dispatcher for routing
   ↓
8. Execute agent run
   ↓
9. Return runId for streaming
   ↓
10. Client connects to SSE stream
   ↓
11. Display real-time updates
```

### 2. File Upload Flow

```
1. User selects file
   ↓
2. Validate (type, size)
   ↓
3. POST /api/upload → Ingest API
   ↓
4. Ingest API:
   - Upload to MinIO
   - Extract text
   - Generate embeddings
   - Create knowledge base
   ↓
5. Return file metadata
   ↓
6. Attach to message (agent-server)
   ↓
7. Agent can use RAG search
```

### 3. Agent Execution Flow

```
1. Dispatcher routes query
   ↓
2. Select agent + tools
   ↓
3. POST /api/runs (agent-server)
   ↓
4. Agent-server creates run
   ↓
5. Execute with Pydantic AI
   ↓
6. Stream events via SSE
   ↓
7. Save results to database
   ↓
8. Return final response
```

---

## Integration Points

### Agent Server API

**Purpose**: Agent orchestration and data management

**What It Provides**:
- Conversation management
- Message storage
- Agent definitions
- Run execution
- User settings
- Dispatcher routing

**Authentication**: JWT Bearer token

**Base URL**: `http://agent-lxc:8000`

### Ingest API

**Purpose**: File processing and RAG

**What It Provides**:
- File upload to MinIO
- Text extraction
- Embedding generation
- Knowledge base management
- Semantic search

**Authentication**: JWT Bearer token

**Base URL**: `http://ingest-lxc:8001`

---

## Security

### Authentication

- **JWT Tokens**: Busibox JWT for all API calls
- **httpOnly Cookies**: Automatic token refresh
- **Token Extraction**: `getTokenFromRequest()` helper
- **No Credentials**: Client never stores passwords

### Authorization

- **Backend Enforced**: All authorization in agent-server
- **User Scoping**: Data filtered by user ID
- **RBAC**: Role-based access control in agent-server
- **No Client-Side Auth**: Client trusts backend

### Data Security

- **No Database Access**: Cannot bypass authorization
- **API Only**: All requests through authenticated APIs
- **File Validation**: Type and size checks before upload
- **XSS Protection**: React auto-escaping
- **SQL Injection**: N/A (no database access)

---

## Scalability

### Horizontal Scaling

The client can scale independently:
- Stateless design
- No database connections
- No shared state
- Load balancer friendly

### Performance

**Optimizations**:
- Server components for static content
- Client components for interactivity
- Lazy loading for routes
- SSE for real-time updates (more efficient than polling)
- Optimistic updates where appropriate

### Caching

**Future Enhancements**:
- Request deduplication
- Response caching
- Optimistic updates
- Offline support

---

## Monitoring

### Logging

```typescript
console.error('[API] Chat error:', error);
console.log('[SSE] Connected to run:', runId);
```

**Best Practices**:
- Prefix with component/module
- Include relevant context
- No sensitive data in logs

### Error Tracking

- Errors returned to client
- User-friendly messages
- Stack traces in server logs
- Failed requests logged

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Charts**: React Flow (for workflows)

### Development
- **Testing**: Vitest
- **Linting**: ESLint
- **Type Checking**: TypeScript strict mode
- **Package Manager**: npm

### Deployment
- **Process Manager**: PM2
- **Reverse Proxy**: nginx
- **Container**: LXC (apps-lxc)
- **Platform**: Proxmox VE

---

## Design Decisions

### Why No Database?

**Reasons**:
1. **Separation of Concerns**: Frontend handles UI, backend handles data
2. **Security**: Cannot bypass authorization
3. **Scalability**: No connection pool management
4. **Simplicity**: Fewer moving parts
5. **Maintainability**: Single source of truth

### Why Next.js App Router?

**Reasons**:
1. **Server Components**: Better performance
2. **API Routes**: Built-in API layer
3. **File-Based Routing**: Clear structure
4. **SSR Support**: Better SEO (if needed)
5. **Modern**: Latest React features

### Why TypeScript?

**Reasons**:
1. **Type Safety**: Catch errors at compile time
2. **IDE Support**: Better autocomplete
3. **Refactoring**: Easier to refactor safely
4. **Documentation**: Types are self-documenting
5. **Team**: Enforces consistency

---

## Future Enhancements

### Planned Features

1. **Workflow Builder**: Visual workflow designer
2. **Run History**: Dedicated page for past runs
3. **Evaluation UI**: Score visualization
4. **Agent Templates**: Pre-built agent configurations
5. **Collaboration**: Share conversations (if RBAC allows)

### Performance Improvements

1. **Request Caching**: Cache GET requests
2. **Optimistic Updates**: Instant UI feedback
3. **Virtual Scrolling**: For long message lists
4. **Code Splitting**: Smaller bundle sizes
5. **Image Optimization**: Next.js Image component

---

## Related Documentation

- [Frontend Architecture](./frontend.md) - Detailed frontend design
- [API Integration](./api-integration.md) - API integration patterns
- [Database-Free Design](./database-free.md) - Why we don't use a database
- [Project History](./project-history.md) - Evolution of the architecture

---

**Next**: [Frontend Architecture →](./frontend.md)
