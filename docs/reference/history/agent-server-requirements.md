# Agent-Server API Enhancement Requirements

**Project**: Agent-Client Rebuild  
**Feature**: 001-agent-management-rebuild  
**Created**: 2025-12-11  
**Priority**: P1 (Required for Phase 1-2 implementation)  
**Target**: Busibox Agent-Server (`/srv/agent/`)

## Executive Summary

The agent-manager rebuild requires several new endpoints and enhancements to the existing agent-server API to support full CRUD operations, personal agent management, dispatcher agent functionality, and workflow state management.

**Current State**: Agent-server has basic create/list operations but lacks update/delete for tools, workflows, and evaluators.

**Required State**: Full CRUD operations, personal agent filtering, dispatcher agent, and workflow resume capabilities.

---

## Priority 1 - Critical (Required for Phase 1)

### REQ-001: Dispatcher Agent Implementation

**Endpoint**: N/A (agent implementation, not API)  
**Type**: New Agent  
**Priority**: P1 - Critical  
**Phase**: Phase 1 Week 3

**Description**:
Create a built-in "dispatcher" agent that analyzes user queries and intelligently routes them to appropriate tools and agents based on:
- Query content and intent
- User's available tools (doc search, web search, etc.)
- User's accessible agents (built-in + personal agents they own)
- User's role and permissions

**Required Capabilities**:
1. **Query Analysis**: Understand user intent from natural language
2. **Tool/Agent Selection**: Choose appropriate tools/agents for the query
3. **Confidence Scoring**: Provide confidence level (0-1) for routing decisions
4. **Reasoning**: Explain why specific tools/agents were selected
5. **Alternative Suggestions**: Provide alternative routing options when confidence is low
6. **Multi-Tool Orchestration**: Call multiple tools/agents in sequence or parallel
7. **Context Awareness**: Consider file attachments and conversation history

**Input Schema**:
```json
{
  "query": "string",
  "available_tools": ["doc_search", "web_search", ...],
  "available_agents": ["agent_id_1", "agent_id_2", ...],
  "attachments": [{"name": "...", "type": "...", "url": "..."}],
  "user_settings": {
    "enabled_tools": ["doc_search"],
    "enabled_agents": ["agent_id_1"]
  }
}
```

**Output Schema**:
```json
{
  "routing_decision": {
    "selected_tools": ["doc_search"],
    "selected_agents": ["agent_id_1"],
    "confidence": 0.85,
    "reasoning": "User query asks about documents, doc_search is most appropriate",
    "alternatives": ["web_search", "agent_id_2"],
    "requires_disambiguation": false
  },
  "execution_plan": [
    {"step": 1, "type": "tool", "name": "doc_search", "input": {...}},
    {"step": 2, "type": "agent", "name": "agent_id_1", "input": {...}}
  ]
}
```

**Acceptance Criteria**:
- [ ] Dispatcher agent can analyze queries and select appropriate tools/agents
- [ ] Confidence scores are accurate (validated against test cases)
- [ ] Reasoning is clear and helpful for users
- [ ] User settings are strictly honored (only uses enabled tools/agents)
- [ ] Handles file attachments appropriately
- [ ] Returns alternatives when confidence < 0.7

**Testing Requirements**:
- Unit tests for query analysis logic
- Integration tests with actual tools/agents
- Test cases covering: doc queries, web queries, multi-tool scenarios, low-confidence scenarios

---

### REQ-002: Personal Agent Filtering

**Endpoint**: `GET /agents`  
**Type**: Enhancement  
**Priority**: P1 - Critical  
**Phase**: Phase 1 Week 3-4

**Description**:
Enhance the `/agents` endpoint to filter agents based on ownership. Personal agents should only be visible to their creator, while built-in agents are visible to all users.

**Current Behavior**:
```python
# Returns all active agents regardless of creator
stmt = select(AgentDefinition).where(AgentDefinition.is_active.is_(True))
```

**Required Behavior**:
```python
# Filter by creator for personal agents
stmt = select(AgentDefinition).where(
    AgentDefinition.is_active.is_(True),
    or_(
        AgentDefinition.is_builtin.is_(True),  # Built-in agents visible to all
        AgentDefinition.created_by == current_user_id  # Personal agents only to creator
    )
)
```

**Database Schema Changes**:
```sql
-- Add is_builtin flag if not exists
ALTER TABLE agent_definitions ADD COLUMN is_builtin BOOLEAN DEFAULT FALSE;

-- Ensure created_by is populated
-- (should already exist from current implementation)
```

**API Changes**:
- No request/response schema changes
- Filtering happens server-side based on authenticated user

**Acceptance Criteria**:
- [ ] Built-in agents visible to all users
- [ ] Personal agents only visible to creator
- [ ] Other users cannot see/access personal agents via API
- [ ] Agent list correctly filtered in UI

---

### REQ-003: Individual Tool Retrieval

**Endpoint**: `GET /agents/tools/{tool_id}`  
**Type**: New Endpoint  
**Priority**: P1 - High  
**Phase**: Phase 1 Week 4

**Description**:
Add endpoint to retrieve a single tool definition by ID.

**Request**:
```
GET /agents/tools/{tool_id}
Authorization: Bearer <jwt>
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "doc_search",
  "description": "Search documents using semantic search",
  "schema": {
    "input": {...},
    "output": {...}
  },
  "entrypoint": "app.tools.doc_search:search",
  "scopes": ["search.read"],
  "is_active": true,
  "is_builtin": true,
  "version": 1,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Error Responses**:
- 404 Not Found: Tool does not exist
- 401 Unauthorized: Missing/invalid token

**Implementation**:
```python
@router.get("/tools/{tool_id}", response_model=ToolDefinitionRead)
async def get_tool(
    tool_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
) -> ToolDefinitionRead:
    tool = await session.get(ToolDefinition, tool_id)
    if not tool or not tool.is_active:
        raise HTTPException(status_code=404, detail="Tool not found")
    return ToolDefinitionRead.model_validate(tool)
```

**Acceptance Criteria**:
- [ ] Can retrieve individual tool by ID
- [ ] Returns 404 for non-existent tools
- [ ] Returns 404 for inactive tools
- [ ] Requires authentication

---

### REQ-004: Individual Workflow Retrieval

**Endpoint**: `GET /agents/workflows/{workflow_id}`  
**Type**: New Endpoint  
**Priority**: P1 - High  
**Phase**: Phase 2 Week 5

**Description**:
Add endpoint to retrieve a single workflow definition by ID.

**Request**:
```
GET /agents/workflows/{workflow_id}
Authorization: Bearer <jwt>
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "document-analysis-workflow",
  "description": "Extract, analyze, and summarize documents",
  "steps": [
    {
      "id": "step1",
      "type": "agent",
      "agent_id": "uuid",
      "input_mapping": {...},
      "output_mapping": {...}
    }
  ],
  "is_active": true,
  "version": 1,
  "created_by": "user_id",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Error Responses**:
- 404 Not Found: Workflow does not exist
- 401 Unauthorized: Missing/invalid token

**Implementation**: Similar to REQ-003 but for WorkflowDefinition model

**Acceptance Criteria**:
- [ ] Can retrieve individual workflow by ID
- [ ] Returns 404 for non-existent workflows
- [ ] Returns 404 for inactive workflows
- [ ] Requires authentication

---

### REQ-005: Individual Evaluator Retrieval

**Endpoint**: `GET /agents/evals/{eval_id}`  
**Type**: New Endpoint  
**Priority**: P1 - High  
**Phase**: Phase 2 Week 8

**Description**:
Add endpoint to retrieve a single evaluator definition by ID.

**Request**:
```
GET /agents/evals/{eval_id}
Authorization: Bearer <jwt>
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "accuracy-scorer",
  "description": "Scores run accuracy against expected output",
  "config": {
    "criteria": "Accuracy of response",
    "pass_threshold": 0.8,
    "model": "anthropic:claude-3-5-sonnet",
    "prompt_template": "...",
    "rules": {...}
  },
  "is_active": true,
  "version": 1,
  "created_by": "user_id",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Error Responses**:
- 404 Not Found: Evaluator does not exist
- 401 Unauthorized: Missing/invalid token

**Implementation**: Similar to REQ-003 but for EvalDefinition model

**Acceptance Criteria**:
- [ ] Can retrieve individual evaluator by ID
- [ ] Returns 404 for non-existent evaluators
- [ ] Returns 404 for inactive evaluators
- [ ] Requires authentication

---

## Priority 2 - Important (Required for Phase 2)

### REQ-006: Tool Update Endpoint

**Endpoint**: `PUT /agents/tools/{tool_id}`  
**Type**: New Endpoint  
**Priority**: P2 - Important  
**Phase**: Phase 2 Week 8

**Description**:
Add endpoint to update an existing tool definition.

**Request**:
```
PUT /agents/tools/{tool_id}
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "name": "doc_search",
  "description": "Updated description",
  "schema": {...},
  "entrypoint": "app.tools.doc_search:search",
  "scopes": ["search.read"],
  "is_active": true
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "doc_search",
  "description": "Updated description",
  "schema": {...},
  "entrypoint": "app.tools.doc_search:search",
  "scopes": ["search.read"],
  "is_active": true,
  "is_builtin": false,
  "version": 2,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-02T00:00:00Z"
}
```

**Error Responses**:
- 400 Bad Request: Invalid tool definition
- 403 Forbidden: Cannot modify built-in tools
- 404 Not Found: Tool does not exist
- 401 Unauthorized: Missing/invalid token

**Business Rules**:
- Built-in tools cannot be modified (return 403)
- Version number increments on each update
- Only tool creator or admin can update

**Implementation**:
```python
@router.put("/tools/{tool_id}", response_model=ToolDefinitionRead)
async def update_tool(
    tool_id: uuid.UUID,
    payload: ToolDefinitionCreate,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
) -> ToolDefinitionRead:
    tool = await session.get(ToolDefinition, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    if tool.is_builtin:
        raise HTTPException(status_code=403, detail="Cannot modify built-in tools")
    
    # Update fields
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(tool, key, value)
    
    tool.version += 1
    tool.updated_at = datetime.utcnow()
    
    await session.commit()
    await session.refresh(tool)
    return ToolDefinitionRead.model_validate(tool)
```

**Acceptance Criteria**:
- [ ] Can update custom tools
- [ ] Cannot update built-in tools (returns 403)
- [ ] Version increments on update
- [ ] updated_at timestamp updates
- [ ] Requires authentication and ownership

---

### REQ-007: Workflow Update Endpoint

**Endpoint**: `PUT /agents/workflows/{workflow_id}`  
**Type**: New Endpoint  
**Priority**: P2 - Important  
**Phase**: Phase 2 Week 5-6

**Description**:
Add endpoint to update an existing workflow definition.

**Request**: Similar to REQ-006 but for workflows

**Business Rules**:
- Cannot update workflow if it has active scheduled runs
- Version increments on update
- Validates workflow steps before saving

**Implementation**: Similar to REQ-006 but with workflow validation

**Acceptance Criteria**:
- [ ] Can update workflows
- [ ] Cannot update if active schedules exist (or prompt to update schedules)
- [ ] Validates steps before saving
- [ ] Version increments on update

---

### REQ-008: Evaluator Update Endpoint

**Endpoint**: `PUT /agents/evals/{eval_id}`  
**Type**: New Endpoint  
**Priority**: P2 - Important  
**Phase**: Phase 2 Week 8

**Description**:
Add endpoint to update an existing evaluator definition.

**Request**: Similar to REQ-006 but for evaluators

**Implementation**: Similar to REQ-006 but for EvalDefinition model

**Acceptance Criteria**:
- [ ] Can update evaluators
- [ ] Version increments on update
- [ ] Requires authentication and ownership

---

### REQ-009: Tool Soft Delete

**Endpoint**: `DELETE /agents/tools/{tool_id}`  
**Type**: New Endpoint  
**Priority**: P2 - Important  
**Phase**: Phase 2 Week 8

**Description**:
Add endpoint to soft-delete a tool (set is_active = false).

**Request**:
```
DELETE /agents/tools/{tool_id}
Authorization: Bearer <jwt>
```

**Response** (204 No Content)

**Error Responses**:
- 403 Forbidden: Cannot delete built-in tools
- 404 Not Found: Tool does not exist
- 409 Conflict: Tool is in use by active agents
- 401 Unauthorized: Missing/invalid token

**Business Rules**:
- Built-in tools cannot be deleted
- If tool is used by active agents, return 409 with list of agents
- Soft delete only (set is_active = false)

**Implementation**:
```python
@router.delete("/tools/{tool_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tool(
    tool_id: uuid.UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
):
    tool = await session.get(ToolDefinition, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    if tool.is_builtin:
        raise HTTPException(status_code=403, detail="Cannot delete built-in tools")
    
    # Check if tool is in use
    stmt = select(AgentDefinition).where(
        AgentDefinition.is_active.is_(True),
        AgentDefinition.tools.contains({"names": [tool.name]})
    )
    agents_using_tool = await session.execute(stmt)
    if agents_using_tool.scalars().first():
        raise HTTPException(
            status_code=409,
            detail="Tool is in use by active agents"
        )
    
    tool.is_active = False
    await session.commit()
```

**Acceptance Criteria**:
- [ ] Can soft-delete custom tools
- [ ] Cannot delete built-in tools
- [ ] Cannot delete if in use by active agents
- [ ] Returns 204 on success

---

### REQ-010: Workflow Soft Delete

**Endpoint**: `DELETE /agents/workflows/{workflow_id}`  
**Type**: New Endpoint  
**Priority**: P2 - Important  
**Phase**: Phase 2 Week 6

**Description**:
Add endpoint to soft-delete a workflow.

**Business Rules**:
- Cannot delete if workflow has active scheduled runs
- Soft delete only (set is_active = false)

**Implementation**: Similar to REQ-009 but for workflows

**Acceptance Criteria**:
- [ ] Can soft-delete workflows
- [ ] Cannot delete if active schedules exist
- [ ] Returns 204 on success

---

### REQ-011: Evaluator Soft Delete

**Endpoint**: `DELETE /agents/evals/{eval_id}`  
**Type**: New Endpoint  
**Priority**: P2 - Important  
**Phase**: Phase 2 Week 8

**Description**:
Add endpoint to soft-delete an evaluator.

**Implementation**: Similar to REQ-009 but for evaluators

**Acceptance Criteria**:
- [ ] Can soft-delete evaluators
- [ ] Returns 204 on success

---

### REQ-012: Schedule Retrieval

**Endpoint**: `GET /runs/schedule/{schedule_id}`  
**Type**: New Endpoint  
**Priority**: P2 - Important  
**Phase**: Phase 2 Week 7

**Description**:
Add endpoint to retrieve a single schedule by ID.

**Request**:
```
GET /runs/schedule/{schedule_id}
Authorization: Bearer <jwt>
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "agent_id": "uuid",
  "input": {...},
  "cron_expression": "0 9 * * *",
  "tier": "simple",
  "scopes": ["search.read"],
  "next_run_time": "2025-01-02T09:00:00Z",
  "is_active": true,
  "created_by": "user_id",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Implementation**: Similar to REQ-003 but for scheduled runs

**Acceptance Criteria**:
- [ ] Can retrieve individual schedule by ID
- [ ] Returns 404 for non-existent schedules
- [ ] Requires authentication

---

### REQ-013: Schedule Update

**Endpoint**: `PUT /runs/schedule/{schedule_id}`  
**Type**: New Endpoint  
**Priority**: P2 - Important  
**Phase**: Phase 2 Week 7

**Description**:
Add endpoint to update an existing schedule.

**Request**:
```
PUT /runs/schedule/{schedule_id}
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "agent_id": "uuid",
  "input": {...},
  "cron_expression": "0 10 * * *",
  "tier": "simple",
  "scopes": ["search.read"]
}
```

**Response** (200 OK): Same as REQ-012

**Business Rules**:
- Updates APScheduler job with new cron expression
- Recalculates next_run_time

**Implementation**:
```python
@router.put("/schedule/{schedule_id}", response_model=ScheduleRead)
async def update_schedule(
    schedule_id: uuid.UUID,
    payload: ScheduleCreate,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
    scheduler: AsyncIOScheduler = Depends(get_scheduler),
) -> ScheduleRead:
    # Get existing schedule
    schedule = await session.get(ScheduledRun, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Update fields
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(schedule, key, value)
    
    # Update APScheduler job
    scheduler.reschedule_job(
        str(schedule_id),
        trigger=CronTrigger.from_crontab(payload.cron_expression)
    )
    
    schedule.next_run_time = scheduler.get_job(str(schedule_id)).next_run_time
    schedule.updated_at = datetime.utcnow()
    
    await session.commit()
    await session.refresh(schedule)
    return ScheduleRead.model_validate(schedule)
```

**Acceptance Criteria**:
- [ ] Can update schedule configuration
- [ ] APScheduler job updates correctly
- [ ] next_run_time recalculates
- [ ] Requires authentication and ownership

---

## Priority 3 - Nice to Have (Optional for Phase 2-3)

### REQ-014: Workflow Resume Capability

**Endpoint**: `POST /runs/workflow/{run_id}/resume`  
**Type**: New Endpoint  
**Priority**: P3 - Nice to Have  
**Phase**: Phase 2 Week 6 (if time permits)

**Description**:
Add capability to resume a failed workflow from the point of failure instead of restarting from the beginning.

**Request**:
```
POST /runs/workflow/{run_id}/resume
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "from_step": "step_id_that_failed",
  "override_input": {...}  // Optional: override input for failed step
}
```

**Response** (202 Accepted):
```json
{
  "id": "new_run_id",
  "parent_run_id": "original_run_id",
  "agent_id": "uuid",
  "workflow_id": "uuid",
  "status": "pending",
  "resume_from_step": "step_id_that_failed",
  "created_at": "2025-01-02T00:00:00Z"
}
```

**Business Rules**:
- Original run must have status = "failed"
- Workflow state must be preserved (outputs from completed steps)
- New run inherits state from original run up to failed step
- New run gets new run_id but references parent_run_id

**Database Schema Changes**:
```sql
-- Add parent_run_id to track resumed runs
ALTER TABLE run_records ADD COLUMN parent_run_id UUID REFERENCES run_records(id);

-- Add resume_from_step to track where resume started
ALTER TABLE run_records ADD COLUMN resume_from_step VARCHAR(255);

-- Add workflow_state to preserve step outputs
ALTER TABLE run_records ADD COLUMN workflow_state JSONB;
```

**Implementation Complexity**: High (requires workflow state preservation)

**Acceptance Criteria**:
- [ ] Can resume failed workflow from failure point
- [ ] State from completed steps is preserved
- [ ] New run references original run
- [ ] Cannot resume non-failed runs

**Note**: This is complex and may be deferred to Phase 3 if time is limited.

---

### REQ-015: Bulk Operations

**Endpoints**: 
- `POST /agents/tools/bulk-delete`
- `POST /agents/workflows/bulk-delete`
- `POST /agents/evals/bulk-delete`

**Type**: New Endpoints  
**Priority**: P3 - Nice to Have  
**Phase**: Phase 3 Week 9 (if time permits)

**Description**:
Add bulk delete operations for tools, workflows, and evaluators.

**Request**:
```
POST /agents/tools/bulk-delete
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "tool_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response** (200 OK):
```json
{
  "deleted": ["uuid1", "uuid2"],
  "failed": [
    {
      "id": "uuid3",
      "reason": "Tool is in use by active agents"
    }
  ]
}
```

**Acceptance Criteria**:
- [ ] Can delete multiple items in one request
- [ ] Returns detailed success/failure for each item
- [ ] Validates each item individually

---

### REQ-016: Agent Version History

**Endpoint**: `GET /agents/definitions/{agent_id}/versions`  
**Type**: New Endpoint  
**Priority**: P3 - Nice to Have  
**Phase**: Phase 3 Week 9 (if time permits)

**Description**:
Add endpoint to retrieve version history for an agent.

**Response** (200 OK):
```json
{
  "agent_id": "uuid",
  "versions": [
    {
      "version": 2,
      "changes": "Updated instructions",
      "updated_by": "user_id",
      "updated_at": "2025-01-02T00:00:00Z"
    },
    {
      "version": 1,
      "changes": "Initial creation",
      "updated_by": "user_id",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Database Schema Changes**:
```sql
-- Create version history table
CREATE TABLE agent_definition_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agent_definitions(id),
  version INT NOT NULL,
  definition JSONB NOT NULL,
  changes TEXT,
  updated_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Acceptance Criteria**:
- [ ] Can retrieve version history
- [ ] Can rollback to previous version
- [ ] Version history preserved on updates

---

## Implementation Priority & Timeline

### Phase 1 (Weeks 1-4) - Critical

**Must Have**:
- ✅ REQ-001: Dispatcher Agent (Week 3)
- ✅ REQ-002: Personal Agent Filtering (Week 3-4)
- ✅ REQ-003: Individual Tool Retrieval (Week 4)

**Should Have**:
- REQ-004: Individual Workflow Retrieval (can defer to Phase 2 Week 5)
- REQ-005: Individual Evaluator Retrieval (can defer to Phase 2 Week 8)

### Phase 2 (Weeks 5-8) - Important

**Must Have**:
- ✅ REQ-004: Individual Workflow Retrieval (Week 5)
- ✅ REQ-007: Workflow Update (Week 5-6)
- ✅ REQ-010: Workflow Soft Delete (Week 6)
- ✅ REQ-012: Schedule Retrieval (Week 7)
- ✅ REQ-013: Schedule Update (Week 7)
- ✅ REQ-005: Individual Evaluator Retrieval (Week 8)
- ✅ REQ-006: Tool Update (Week 8)
- ✅ REQ-008: Evaluator Update (Week 8)
- ✅ REQ-009: Tool Soft Delete (Week 8)
- ✅ REQ-011: Evaluator Soft Delete (Week 8)

**Nice to Have**:
- REQ-014: Workflow Resume (Week 6, if time permits)

### Phase 3 (Weeks 9-10) - Optional

**Nice to Have**:
- REQ-015: Bulk Operations (Week 9)
- REQ-016: Agent Version History (Week 9)

---

## Testing Requirements

### Unit Tests

For each new endpoint:
- [ ] Request validation (valid/invalid payloads)
- [ ] Authentication/authorization checks
- [ ] Business rule validation
- [ ] Error handling

### Integration Tests

- [ ] Dispatcher agent routing accuracy
- [ ] Personal agent filtering across multiple users
- [ ] CRUD operations for tools/workflows/evals
- [ ] Schedule update with APScheduler
- [ ] Workflow resume (if implemented)

### Load Tests

- [ ] Dispatcher agent performance (target: <2s per query)
- [ ] Concurrent schedule updates
- [ ] Bulk operations (if implemented)

---

## Database Schema Changes Summary

### Required for Phase 1

```sql
-- Add is_builtin flag to agent_definitions (if not exists)
ALTER TABLE agent_definitions ADD COLUMN IF NOT EXISTS is_builtin BOOLEAN DEFAULT FALSE;

-- Ensure created_by exists on all definition tables
-- (should already exist from current implementation)
```

### Required for Phase 2

```sql
-- Add parent_run_id for workflow resume (if REQ-014 implemented)
ALTER TABLE run_records ADD COLUMN parent_run_id UUID REFERENCES run_records(id);
ALTER TABLE run_records ADD COLUMN resume_from_step VARCHAR(255);
ALTER TABLE run_records ADD COLUMN workflow_state JSONB;
```

### Optional for Phase 3

```sql
-- Version history table (if REQ-016 implemented)
CREATE TABLE agent_definition_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agent_definitions(id),
  version INT NOT NULL,
  definition JSONB NOT NULL,
  changes TEXT,
  updated_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Consistency Improvements

### Standardize Parameter Names

**Current Issue**: Schedule delete uses `job_id` while other endpoints use `id`

**Recommendation**: Standardize on `{resource}_id` format:
- `DELETE /runs/schedule/{schedule_id}` (change from `job_id`)
- `GET /agents/tools/{tool_id}` (consistent)
- `GET /agents/workflows/{workflow_id}` (consistent)

### Standardize Error Responses

**Current**: Some endpoints return `{"detail": "..."}`, others may vary

**Recommendation**: Consistent error format:
```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "details": {...}  // Optional additional context
}
```

---

## Dependencies & Blockers

### External Dependencies

1. **LiteLLM**: Required for dispatcher agent (already integrated)
2. **APScheduler**: Required for schedule updates (already integrated)
3. **PostgreSQL**: All database changes (already in use)

### Internal Dependencies

1. **Dispatcher Agent Logic**: Requires AI/ML expertise for query analysis
2. **Workflow State Management**: Complex logic for resume capability
3. **Version History**: Requires audit logging infrastructure

### No Blockers

All requirements can be implemented with existing infrastructure. No external blockers identified.

---

## Success Metrics

### Phase 1 Success

- [ ] Dispatcher agent achieves 95%+ routing accuracy
- [ ] Personal agent filtering works correctly
- [ ] Individual resource retrieval endpoints functional

### Phase 2 Success

- [ ] Full CRUD operations for tools/workflows/evals
- [ ] Schedule management fully functional
- [ ] Workflow resume working (if implemented)

### Phase 3 Success

- [ ] Bulk operations improve admin efficiency
- [ ] Version history enables rollback capability

---

## Questions for Agent-Server Team

1. **Dispatcher Agent**: Do you prefer to implement the dispatcher agent, or should agent-manager team provide the implementation?
2. **Workflow Resume**: Is workflow state preservation feasible with current architecture? Should this be deferred?
3. **Version History**: Is there existing audit logging infrastructure we can leverage?
4. **Timeline**: Can Phase 1 requirements (REQ-001, REQ-002, REQ-003) be completed by Week 3 of agent-manager implementation?
5. **API Consistency**: Should we standardize parameter names (`job_id` → `schedule_id`) as part of this work?

---

## Appendix: Example Dispatcher Agent Implementation

```python
# app/agents/dispatcher_agent.py

from pydantic_ai import Agent
from pydantic import BaseModel
from typing import List, Optional

class RoutingDecision(BaseModel):
    selected_tools: List[str]
    selected_agents: List[str]
    confidence: float
    reasoning: str
    alternatives: List[str]
    requires_disambiguation: bool

class DispatcherInput(BaseModel):
    query: str
    available_tools: List[str]
    available_agents: List[str]
    attachments: List[dict] = []
    user_settings: dict = {}

dispatcher_agent = Agent(
    model="anthropic:claude-3-5-sonnet",
    system_prompt="""You are a routing agent that analyzes user queries and determines 
    which tools and agents to use. Consider:
    
    1. Query intent and content
    2. Available tools: {available_tools}
    3. Available agents: {available_agents}
    4. User settings (must honor enabled/disabled tools/agents)
    5. File attachments (if any)
    
    Return a routing decision with:
    - selected_tools: List of tool names to use
    - selected_agents: List of agent IDs to use
    - confidence: 0-1 score (use 0.7 as disambiguation threshold)
    - reasoning: Explain your routing decision
    - alternatives: Other viable options
    - requires_disambiguation: True if confidence < 0.7
    
    IMPORTANT: Only use tools/agents that are enabled in user_settings.
    """,
    result_type=RoutingDecision,
)

async def route_query(input: DispatcherInput) -> RoutingDecision:
    """Route a user query to appropriate tools and agents."""
    result = await dispatcher_agent.run(
        input.query,
        available_tools=input.available_tools,
        available_agents=input.available_agents,
        user_settings=input.user_settings,
        attachments=input.attachments,
    )
    return result.output
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-11 | Agent-Client Team | Initial requirements document |
