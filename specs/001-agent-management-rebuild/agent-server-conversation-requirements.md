# Agent-Server Requirements: Conversation & Message Management

**Date**: 2025-12-11  
**Priority**: HIGH  
**Related**: ARCHITECTURE-ISSUE.md

---

## Overview

The agent-server needs conversation and message management endpoints to support the agent-client chat interface without requiring direct database access from the client.

---

## Database Schema (Agent-Server)

### New Models Required

```python
# models.py

class Conversation(Base):
    """Chat conversation between user and agents"""
    __tablename__ = "conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    user_id = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_conversations_user_id', 'user_id'),
        Index('idx_conversations_created_at', 'created_at'),
    )


class Message(Base):
    """Individual message in a conversation"""
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False)
    role = Column(Enum('user', 'assistant', 'system', name='message_role'), nullable=False)
    content = Column(Text, nullable=False)
    attachments = Column(JSON, nullable=True)  # Array of {name, type, url, size}
    run_id = Column(UUID(as_uuid=True), ForeignKey('runs.id'), nullable=True)
    routing_decision = Column(JSON, nullable=True)  # DispatcherResponse
    tool_calls = Column(JSON, nullable=True)  # Array of tool call results
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    run = relationship("Run")
    
    # Indexes
    __table_args__ = (
        Index('idx_messages_conversation_id', 'conversation_id'),
        Index('idx_messages_created_at', 'created_at'),
        Index('idx_messages_run_id', 'run_id'),
    )


class ChatSettings(Base):
    """User chat preferences"""
    __tablename__ = "chat_settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255), unique=True, nullable=False, index=True)
    enabled_tools = Column(ARRAY(String), default=list)
    enabled_agents = Column(ARRAY(UUID(as_uuid=True)), default=list)
    model = Column(String(255), nullable=True)
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=2000)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class FileUpload(Base):
    """File upload metadata"""
    __tablename__ = "file_uploads"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    size = Column(Integer, nullable=False)
    url = Column(String(500), nullable=False)
    minio_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Indexes
    __table_args__ = (
        Index('idx_file_uploads_user_id', 'user_id'),
        Index('idx_file_uploads_created_at', 'created_at'),
    )
```

---

## API Endpoints

### 1. Conversation Management

#### List Conversations

```yaml
GET /conversations
Summary: List user's conversations
Authorization: Required (JWT)
Query Parameters:
  - limit: integer (default: 50, max: 100)
  - offset: integer (default: 0)
  - order_by: string (default: "created_at", options: "created_at", "updated_at")
  - order: string (default: "desc", options: "asc", "desc")
Response 200:
  {
    "conversations": [
      {
        "id": "uuid",
        "title": "string",
        "user_id": "string",
        "message_count": integer,
        "last_message": {
          "role": "user|assistant|system",
          "content": "string (preview, max 100 chars)",
          "created_at": "datetime"
        },
        "created_at": "datetime",
        "updated_at": "datetime"
      }
    ],
    "total": integer,
    "limit": integer,
    "offset": integer
  }
```

#### Create Conversation

```yaml
POST /conversations
Summary: Create new conversation
Authorization: Required (JWT)
Request Body:
  {
    "title": "string (optional, max 255 chars)"
  }
Response 201:
  {
    "id": "uuid",
    "title": "string",
    "user_id": "string",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
```

#### Get Conversation

```yaml
GET /conversations/{conversation_id}
Summary: Get conversation with messages
Authorization: Required (JWT, must own conversation)
Query Parameters:
  - include_messages: boolean (default: true)
  - message_limit: integer (default: 100)
  - message_offset: integer (default: 0)
Response 200:
  {
    "id": "uuid",
    "title": "string",
    "user_id": "string",
    "messages": [
      {
        "id": "uuid",
        "role": "user|assistant|system",
        "content": "string",
        "attachments": [...],
        "run_id": "uuid (optional)",
        "routing_decision": {...},
        "tool_calls": [...],
        "created_at": "datetime"
      }
    ],
    "created_at": "datetime",
    "updated_at": "datetime"
  }
Response 403: Forbidden (not owner)
Response 404: Not Found
```

#### Update Conversation

```yaml
PATCH /conversations/{conversation_id}
Summary: Update conversation metadata
Authorization: Required (JWT, must own conversation)
Request Body:
  {
    "title": "string (optional)"
  }
Response 200: Updated conversation
Response 403: Forbidden
Response 404: Not Found
```

#### Delete Conversation

```yaml
DELETE /conversations/{conversation_id}
Summary: Delete conversation and all messages
Authorization: Required (JWT, must own conversation)
Response 204: No Content
Response 403: Forbidden
Response 404: Not Found
```

---

### 2. Message Management

#### List Messages

```yaml
GET /conversations/{conversation_id}/messages
Summary: List messages in conversation
Authorization: Required (JWT, must own conversation)
Query Parameters:
  - limit: integer (default: 100)
  - offset: integer (default: 0)
  - order: string (default: "asc", options: "asc", "desc")
Response 200:
  {
    "messages": [...],
    "total": integer,
    "limit": integer,
    "offset": integer
  }
Response 403: Forbidden
Response 404: Not Found
```

#### Create Message

```yaml
POST /conversations/{conversation_id}/messages
Summary: Add message to conversation
Authorization: Required (JWT, must own conversation)
Request Body:
  {
    "role": "user|assistant|system",
    "content": "string",
    "attachments": [
      {
        "name": "string",
        "type": "string",
        "url": "string",
        "size": integer
      }
    ] (optional),
    "run_id": "uuid (optional)",
    "routing_decision": {...} (optional),
    "tool_calls": [...] (optional)
  }
Response 201: Created message
Response 403: Forbidden
Response 404: Not Found
```

#### Get Message

```yaml
GET /messages/{message_id}
Summary: Get single message
Authorization: Required (JWT, must own conversation)
Response 200: Message object
Response 403: Forbidden
Response 404: Not Found
```

---

### 3. Chat Settings

#### Get Chat Settings

```yaml
GET /users/me/chat-settings
Summary: Get user's chat preferences
Authorization: Required (JWT)
Response 200:
  {
    "id": "uuid",
    "user_id": "string",
    "enabled_tools": ["string"],
    "enabled_agents": ["uuid"],
    "model": "string (optional)",
    "temperature": float,
    "max_tokens": integer,
    "created_at": "datetime",
    "updated_at": "datetime"
  }
Response 200 (if not exists): Default settings
```

#### Update Chat Settings

```yaml
PUT /users/me/chat-settings
Summary: Update chat preferences
Authorization: Required (JWT)
Request Body:
  {
    "enabled_tools": ["string"] (optional),
    "enabled_agents": ["uuid"] (optional),
    "model": "string (optional)",
    "temperature": float (optional, 0.0-2.0),
    "max_tokens": integer (optional, 1-32000)
  }
Response 200: Updated settings
Response 400: Invalid parameters
```

---

### 4. File Upload

#### Upload File

```yaml
POST /files/upload
Summary: Upload file to MinIO
Authorization: Required (JWT)
Request: multipart/form-data
  - file: binary
  - conversation_id: uuid (optional, for linking)
Response 201:
  {
    "id": "uuid",
    "filename": "string",
    "content_type": "string",
    "size": integer,
    "url": "string",
    "minio_path": "string",
    "created_at": "datetime"
  }
Response 400: Invalid file
Response 413: File too large
```

#### Get File Metadata

```yaml
GET /files/{file_id}
Summary: Get file metadata
Authorization: Required (JWT, must own file)
Response 200: FileUpload object
Response 403: Forbidden
Response 404: Not Found
```

#### Delete File

```yaml
DELETE /files/{file_id}
Summary: Delete file from MinIO
Authorization: Required (JWT, must own file)
Response 204: No Content
Response 403: Forbidden
Response 404: Not Found
```

---

## Authorization Rules

### Conversation Access

- Users can only access their own conversations
- Check `conversation.user_id == authenticated_user_id`
- Return 403 Forbidden if not owner

### Message Access

- Users can only access messages in their own conversations
- Check via conversation ownership
- Return 403 Forbidden if not owner

### Chat Settings

- Users can only access their own settings
- Automatically filtered by authenticated user ID

### File Access

- Users can only access their own files
- Check `file.user_id == authenticated_user_id`
- Return 403 Forbidden if not owner

---

## Business Logic

### Conversation Creation

1. Extract user ID from JWT token
2. Generate title if not provided (e.g., "Conversation {date}")
3. Create conversation with user_id
4. Return conversation object

### Message Creation

1. Verify conversation ownership
2. Create message with conversation_id
3. Update conversation.updated_at
4. If run_id provided, link to agent run
5. Return message object

### File Upload

1. Validate file type and size
2. Generate unique filename (UUID + extension)
3. Upload to MinIO bucket
4. Store metadata in database
5. Return file metadata with public URL

---

## Implementation Notes

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "Add conversation and message models"

# Apply migration
alembic upgrade head
```

### MinIO Configuration

```python
# config.py
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "files-lxc:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY")
MINIO_BUCKET = "agent-client-uploads"
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
```

### File Upload Limits

```python
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {
    'pdf', 'doc', 'docx', 'txt', 'md',
    'png', 'jpg', 'jpeg', 'gif', 'webp',
    'csv', 'xlsx', 'json', 'xml'
}
```

---

## Testing Requirements

### Unit Tests

- Test conversation CRUD operations
- Test message CRUD operations
- Test authorization checks
- Test chat settings upsert
- Test file upload/delete

### Integration Tests

- Test conversation with messages
- Test file upload to MinIO
- Test unauthorized access (403)
- Test cascade delete (conversation → messages)

### API Tests

- Test all endpoints with valid JWT
- Test all endpoints without JWT (401)
- Test all endpoints with wrong user (403)
- Test pagination
- Test file upload with various types

---

## Timeline Estimate

- **Database Models**: 2 hours
- **Conversation Endpoints**: 4 hours
- **Message Endpoints**: 3 hours
- **Chat Settings Endpoints**: 2 hours
- **File Upload Endpoints**: 4 hours
- **Authorization Logic**: 2 hours
- **Testing**: 4 hours
- **Documentation**: 1 hour

**Total**: ~22 hours (~3 days)

---

## Acceptance Criteria

- [ ] All database models created
- [ ] All endpoints implemented
- [ ] Authorization checks working
- [ ] File upload to MinIO working
- [ ] All tests passing (unit + integration)
- [ ] OpenAPI spec updated
- [ ] Agent-client refactored to use new endpoints
- [ ] No direct database access from agent-client
- [ ] Documentation complete

---

## Related Documents

- `ARCHITECTURE-ISSUE.md` - Problem description
- `agent-server-requirements.md` - Original requirements
- OpenAPI spec: `busibox/openapi/agent-api.yaml`

---

**Status**: ⚠️ READY FOR IMPLEMENTATION
