# CRITICAL ARCHITECTURE ISSUE - Database Access Violation

**Date**: 2025-12-11  
**Status**: ⚠️ BLOCKING ISSUE  
**Priority**: HIGH

---

## Problem

The agent-manager is **directly accessing the database** via Prisma, which violates the architecture principle that **all data operations should go through the agent-server API**.

### Current Violations

**Files with direct database access**:
1. `app/api/chat/route.ts` - Saves conversations and messages directly to DB
2. `app/api/chat/settings/route.ts` - Saves user settings directly to DB
3. `app/api/conversations/route.ts` - Queries conversations directly from DB
4. `app/api/conversations/[id]/route.ts` - Queries/deletes conversations directly from DB
5. `lib/db.ts` - Prisma client instance

**Database models in agent-manager**:
- `Conversation` - Chat conversation metadata
- `Message` - Individual chat messages
- `ChatSettings` - User chat preferences
- `FileUpload` - File attachment metadata

---

## Why This Is Wrong

### Architectural Principles Violated

1. **Separation of Concerns**: Client should only handle UI/UX, not data persistence
2. **Single Source of Truth**: Agent-server should be the only service accessing the database
3. **Security**: Direct database access bypasses agent-server's authorization logic
4. **Scalability**: Multiple clients accessing the same database creates connection pool issues
5. **Maintainability**: Database schema changes require updating multiple services

### Specific Issues

1. **No Authorization**: Client bypasses agent-server's RBAC and guardrails
2. **Data Inconsistency**: Conversations/messages not linked to agent runs properly
3. **Connection Overhead**: Each Next.js instance maintains its own DB connection pool
4. **Schema Duplication**: Prisma schema duplicated between client and server
5. **Migration Complexity**: Database migrations must be coordinated across services

---

## Correct Architecture

```
┌─────────────────┐
│  Agent Client   │
│   (Next.js)     │
│                 │
│  - UI/UX only   │
│  - No database  │
│  - API calls    │
└────────┬────────┘
         │ HTTP/SSE
         │
         ▼
┌─────────────────┐
│  Agent Server   │
│   (FastAPI)     │
│                 │
│  - Business     │
│  - Auth/RBAC    │
│  - Database     │
└────────┬────────┘
         │ SQL
         ▼
┌─────────────────┐
│   PostgreSQL    │
│    (pg-lxc)     │
└─────────────────┘
```

---

## Required Agent-Server Endpoints

The agent-server needs these endpoints to replace direct database access:

### Conversation Management

```yaml
GET /conversations
  - List user's conversations
  - Pagination support
  - Filter by date range
  - Returns: Array<Conversation>

POST /conversations
  - Create new conversation
  - Body: { title: string }
  - Returns: Conversation

GET /conversations/{id}
  - Get conversation with messages
  - Authorization check
  - Returns: Conversation with messages[]

DELETE /conversations/{id}
  - Delete conversation
  - Authorization check
  - Cascade delete messages
  - Returns: 204 No Content

PATCH /conversations/{id}
  - Update conversation (title, etc.)
  - Authorization check
  - Returns: Conversation
```

### Message Management

```yaml
GET /conversations/{id}/messages
  - List messages in conversation
  - Pagination support
  - Returns: Array<Message>

POST /conversations/{id}/messages
  - Add message to conversation
  - Body: { role, content, attachments }
  - Links to run_id if applicable
  - Returns: Message

GET /messages/{id}
  - Get single message
  - Authorization check
  - Returns: Message
```

### Chat Settings

```yaml
GET /users/me/chat-settings
  - Get user's chat preferences
  - Returns: ChatSettings or default

PUT /users/me/chat-settings
  - Update chat preferences
  - Body: { enabled_tools, enabled_agents, model, temperature, max_tokens }
  - Returns: ChatSettings
```

### File Uploads

```yaml
POST /files/upload
  - Upload file to MinIO
  - Returns: { file_id, url, minio_path }

GET /files/{id}
  - Get file metadata
  - Authorization check
  - Returns: FileUpload

DELETE /files/{id}
  - Delete file from MinIO
  - Authorization check
  - Returns: 204 No Content
```

---

## Migration Plan

### Phase 1: Add Agent-Server Endpoints (REQUIRED)

1. Add conversation/message models to agent-server
2. Implement CRUD endpoints
3. Add authorization checks
4. Link conversations to agent runs
5. Add chat settings endpoints
6. Add file upload to MinIO

### Phase 2: Update Agent-Client (AFTER Phase 1)

1. Remove Prisma from agent-manager
2. Update API routes to call agent-server
3. Remove `lib/db.ts`
4. Remove `prisma/` directory
5. Update all components to use API routes
6. Remove database-related npm scripts

### Phase 3: Testing

1. Test conversation creation/listing
2. Test message persistence
3. Test authorization (user can only see their conversations)
4. Test file uploads
5. Test chat settings
6. Verify no direct database access

---

## Temporary Workaround

**For initial deployment**, we can:

1. **Keep Prisma temporarily** but document it as technical debt
2. **Add TODO comments** in all files with database access
3. **Create agent-server requirements document**
4. **Plan migration** once agent-server endpoints are ready

**However**, this should be **top priority** to fix properly.

---

## Impact Analysis

### If We Don't Fix This

- ❌ Security vulnerabilities (bypassed authorization)
- ❌ Data inconsistency between client and server
- ❌ Scalability issues (connection pool exhaustion)
- ❌ Cannot enforce rate limits or guardrails
- ❌ Difficult to add features (must update multiple services)
- ❌ Cannot audit user actions properly
- ❌ Violates microservices best practices

### If We Fix This

- ✅ Single source of truth (agent-server)
- ✅ Proper authorization and RBAC
- ✅ Scalable architecture
- ✅ Easier to maintain and extend
- ✅ Better security and auditing
- ✅ Follows microservices best practices
- ✅ Client is truly stateless

---

## Recommendation

**STOP** and fix this architecture issue before deploying to production.

**Priority**: HIGH  
**Effort**: Medium (2-3 days)  
**Risk if not fixed**: HIGH

### Immediate Actions

1. ✅ Document this issue (this file)
2. ⚠️ Create agent-server requirements document
3. ⚠️ Implement agent-server endpoints
4. ⚠️ Refactor agent-manager to remove Prisma
5. ⚠️ Test end-to-end
6. ⚠️ Deploy

---

## Decision

**Option A: Fix Now (RECOMMENDED)**
- Add endpoints to agent-server
- Remove Prisma from agent-manager
- Deploy correct architecture
- **Timeline**: 2-3 days
- **Risk**: Low

**Option B: Deploy with Technical Debt (NOT RECOMMENDED)**
- Deploy with Prisma temporarily
- Document as critical technical debt
- Fix in next sprint
- **Timeline**: Immediate
- **Risk**: HIGH (security, scalability)

**Recommendation**: **Option A** - Fix the architecture now before it becomes harder to change.

---

## Related Files

- `prisma/schema.prisma` - Should be removed from agent-manager
- `lib/db.ts` - Should be removed
- `app/api/chat/route.ts` - Needs refactoring
- `app/api/conversations/*.ts` - Needs refactoring
- `app/api/chat/settings/route.ts` - Needs refactoring

---

## Next Steps

1. Review this document with team
2. Decide on Option A or B
3. If Option A: Create agent-server requirements
4. If Option B: Add TODO comments and plan migration

**Status**: ⚠️ AWAITING DECISION
