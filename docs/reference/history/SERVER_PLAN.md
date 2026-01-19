# Agent-Server Implementation Plan

**Date**: 2025-12-11  
**Status**: Ready for Implementation  
**Estimated Time**: 3-4 days  
**Priority**: HIGH

---

## Overview

The agent-server needs conversation and message management endpoints to support the agent-manager chat interface without requiring direct database access from the client.

---

## Database Schema

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
    attachments = Column(JSON, nullable=True)  # Array of {name, type, url, size, knowledge_base_id}
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
```

---

## API Endpoints

### 1. Conversation Management

#### List Conversations
```yaml
GET /conversations
Authorization: Required (JWT)
Query Parameters:
  - limit: integer (default: 50, max: 100)
  - offset: integer (default: 0)
  - order_by: string (default: "created_at")
  - order: string (default: "desc")
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
Authorization: Required (JWT)
Request Body:
  {
    "title": "string (optional, max 255 chars)"
  }
Response 201: Created conversation
```

#### Get Conversation
```yaml
GET /conversations/{conversation_id}
Authorization: Required (JWT, must own conversation)
Query Parameters:
  - include_messages: boolean (default: true)
  - message_limit: integer (default: 100)
  - message_offset: integer (default: 0)
Response 200: Conversation with messages
Response 403: Forbidden (not owner)
Response 404: Not Found
```

#### Update Conversation
```yaml
PATCH /conversations/{conversation_id}
Authorization: Required (JWT, must own conversation)
Request Body:
  {
    "title": "string (optional)"
  }
Response 200: Updated conversation
```

#### Delete Conversation
```yaml
DELETE /conversations/{conversation_id}
Authorization: Required (JWT, must own conversation)
Response 204: No Content (cascade deletes messages)
```

### 2. Message Management

#### List Messages
```yaml
GET /conversations/{conversation_id}/messages
Authorization: Required (JWT, must own conversation)
Query Parameters:
  - limit: integer (default: 100)
  - offset: integer (default: 0)
  - order: string (default: "asc")
Response 200: Paginated messages
```

#### Create Message
```yaml
POST /conversations/{conversation_id}/messages
Authorization: Required (JWT, must own conversation)
Request Body:
  {
    "role": "user|assistant|system",
    "content": "string",
    "attachments": [...] (optional),
    "run_id": "uuid (optional)",
    "routing_decision": {...} (optional),
    "tool_calls": [...] (optional)
  }
Response 201: Created message
```

#### Get Message
```yaml
GET /messages/{message_id}
Authorization: Required (JWT, must own conversation)
Response 200: Message object
```

### 3. Chat Settings

#### Get Chat Settings
```yaml
GET /users/me/chat-settings
Authorization: Required (JWT)
Response 200: Settings or default
```

#### Update Chat Settings
```yaml
PUT /users/me/chat-settings
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

---

## Implementation Steps

### 1. Database Migrations (2 hours)

```bash
# Create migration
alembic revision --autogenerate -m "Add conversation and message models"

# Apply migration
alembic upgrade head
```

### 2. Conversation Endpoints (4 hours)

- `GET /conversations` - List with pagination
- `POST /conversations` - Create with auto-title
- `GET /conversations/{id}` - Get with messages
- `PATCH /conversations/{id}` - Update title
- `DELETE /conversations/{id}` - Cascade delete

### 3. Message Endpoints (3 hours)

- `GET /conversations/{id}/messages` - List with pagination
- `POST /conversations/{id}/messages` - Create and link to run
- `GET /messages/{id}` - Get single message

### 4. Chat Settings Endpoints (2 hours)

- `GET /users/me/chat-settings` - Get or create default
- `PUT /users/me/chat-settings` - Upsert

### 5. Authorization Logic (2 hours)

- Conversation ownership checks
- Message access via conversation
- Settings access by user ID

### 6. Testing (4 hours)

- Unit tests for models
- Integration tests for endpoints
- Authorization tests
- Cascade delete tests

### 7. Documentation (1 hour)

- Update OpenAPI spec
- Add to implementation status doc

---

## Testing Requirements

### Unit Tests
- Test conversation CRUD operations
- Test message CRUD operations
- Test authorization checks
- Test chat settings upsert

### Integration Tests
- Test conversation with messages
- Test unauthorized access (403)
- Test cascade delete (conversation → messages)
- Test pagination

### API Tests
- Test all endpoints with valid JWT
- Test all endpoints without JWT (401)
- Test all endpoints with wrong user (403)

---

## Timeline

- **Database Models**: 2 hours
- **Conversation Endpoints**: 4 hours
- **Message Endpoints**: 3 hours
- **Chat Settings Endpoints**: 2 hours
- **Authorization Logic**: 2 hours
- **Testing**: 4 hours
- **Documentation**: 1 hour

**Total**: ~18 hours (~2-3 days)

---

## Acceptance Criteria

- [ ] All database models created
- [ ] All endpoints implemented
- [ ] Authorization checks working
- [ ] All tests passing (unit + integration)
- [ ] OpenAPI spec updated
- [ ] Documentation complete
- [ ] Ready for agent-manager integration

---

## OpenAPI Schema Updates

Add to `busibox/openapi/agent-api.yaml`:

```yaml
paths:
  /conversations:
    get:
      summary: List user's conversations
      tags: [conversations]
      # ... (full spec)
    post:
      summary: Create conversation
      tags: [conversations]
      # ... (full spec)
  
  /conversations/{conversation_id}:
    get:
      summary: Get conversation with messages
      tags: [conversations]
      # ... (full spec)
    patch:
      summary: Update conversation
      tags: [conversations]
      # ... (full spec)
    delete:
      summary: Delete conversation
      tags: [conversations]
      # ... (full spec)
  
  /conversations/{conversation_id}/messages:
    get:
      summary: List messages
      tags: [messages]
      # ... (full spec)
    post:
      summary: Create message
      tags: [messages]
      # ... (full spec)
  
  /messages/{message_id}:
    get:
      summary: Get message
      tags: [messages]
      # ... (full spec)
  
  /users/me/chat-settings:
    get:
      summary: Get chat settings
      tags: [settings]
      # ... (full spec)
    put:
      summary: Update chat settings
      tags: [settings]
      # ... (full spec)

components:
  schemas:
    Conversation:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        user_id:
          type: string
        message_count:
          type: integer
        last_message:
          $ref: '#/components/schemas/MessagePreview'
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
    
    Message:
      type: object
      properties:
        id:
          type: string
          format: uuid
        conversation_id:
          type: string
          format: uuid
        role:
          type: string
          enum: [user, assistant, system]
        content:
          type: string
        attachments:
          type: array
          items:
            $ref: '#/components/schemas/Attachment'
        run_id:
          type: string
          format: uuid
        routing_decision:
          $ref: '#/components/schemas/DispatcherResponse'
        tool_calls:
          type: array
        created_at:
          type: string
          format: date-time
    
    ChatSettings:
      type: object
      properties:
        id:
          type: string
          format: uuid
        user_id:
          type: string
        enabled_tools:
          type: array
          items:
            type: string
        enabled_agents:
          type: array
          items:
            type: string
            format: uuid
        model:
          type: string
        temperature:
          type: number
          format: float
        max_tokens:
          type: integer
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
```

---

## Related Files

- `busibox/srv/agent/models.py` - Add models
- `busibox/srv/agent/routes/` - Add route handlers
- `busibox/srv/agent/tests/` - Add tests
- `busibox/openapi/agent-api.yaml` - Update spec

---

**Status**: ⚠️ READY FOR IMPLEMENTATION

**Next**: Assign to agent-server developer for parallel implementation
