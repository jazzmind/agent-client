# Data Model: Agent Management System Rebuild

**Date**: 2025-12-11  
**Feature**: Agent Management System Rebuild  
**Branch**: `001-agent-management-rebuild`

## Overview

This document defines the data structures used in the agent-manager application and busibox-ui shared library. All entities are TypeScript interfaces that represent data received from the agent-server API or managed locally in the client.

**Key Principles**:
- Client is stateless; all persistent data managed by agent-server
- TypeScript interfaces match agent-server Pydantic schemas
- Dates are ISO 8601 strings from API, converted to Date objects in client
- UUIDs are strings in TypeScript
- Enums are string literal unions for type safety

---

## Agent-Server Entities

These entities are returned by the agent-server API and consumed by the agent-manager.

### Agent

Represents an AI agent with configuration, instructions, and tool assignments.

```typescript
export interface Agent {
  id: string;                          // UUID
  name: string;                        // Unique identifier (e.g., "doc-search")
  display_name: string | null;         // Human-readable name (e.g., "Document Search")
  description: string | null;          // Purpose and capabilities
  model: string;                       // LLM model name (e.g., "gpt-4")
  instructions: string;                // System prompt/instructions
  tools: Record<string, any>;          // Tool configurations
  workflow: Record<string, any> | null; // Workflow definition (if workflow agent)
  scopes: string[];                    // Required permission scopes
  is_active: boolean;                  // Whether agent is enabled
  version: number;                     // Configuration version
  created_at: string;                  // ISO 8601 timestamp
  updated_at: string;                  // ISO 8601 timestamp
  
  // Derived properties (computed in client)
  is_builtin?: boolean;                // True if hardcoded in agent-server
  is_personal?: boolean;               // True if created by current user
  created_by?: string;                 // User ID of creator (for personal agents)
}
```

**Validation Rules**:
- `name` must be unique, lowercase, alphanumeric with hyphens
- `model` must exist in available models list
- `instructions` must not be empty
- `tools` must reference valid tool names
- `scopes` must be valid scope identifiers

**State Transitions**:
- Created → Active (when saved)
- Active → Inactive (when deactivated)
- Inactive → Active (when reactivated)
- Active → Deleted (when deleted, soft delete)

**Relationships**:
- Agent → Tools (many-to-many via `tools` field)
- Agent → Runs (one-to-many)
- Agent → Schedules (one-to-many)

---

### Run

Represents a single execution of an agent with input, output, status, and events.

```typescript
export type RunStatus = 
  | 'pending'    // Queued, not started
  | 'running'    // Currently executing
  | 'succeeded'  // Completed successfully
  | 'failed'     // Completed with error
  | 'timeout';   // Exceeded tier timeout limit

export type RunTier = 
  | 'simple'     // 30s timeout, low memory
  | 'complex'    // 5min timeout, medium memory
  | 'batch';     // 30min timeout, high memory

export interface Run {
  id: string;                          // UUID
  agent_id: string;                    // UUID of agent executed
  input: Record<string, any>;          // Input data/parameters
  output: Record<string, any> | null;  // Result data (null if not completed)
  status: RunStatus;                   // Current execution status
  events: RunEvent[];                  // Timeline of events
  routing_decisions?: RoutingDecision[]; // For dispatcher runs
  performance_metrics: PerformanceMetrics;
  error: string | null;                // Error message if failed
  tier: RunTier;                       // Execution tier
  scopes: string[];                    // Scopes used for this run
  created_by: string;                  // User ID who initiated run
  created_at: string;                  // ISO 8601 timestamp
  started_at: string | null;           // When execution started
  completed_at: string | null;         // When execution completed
}

export interface RunEvent {
  id: string;                          // Event ID
  type: 'status' | 'tool_call' | 'agent_call' | 'output' | 'error';
  timestamp: string;                   // ISO 8601 timestamp
  data: Record<string, any>;           // Event-specific data
  parent_event_id?: string;            // For nested events
}

export interface RoutingDecision {
  query: string;                       // Original query
  selected_tools: string[];            // Tools selected by dispatcher
  selected_agents: string[];           // Agents selected by dispatcher
  confidence: number;                  // 0-1 confidence score
  reasoning: string;                   // Why these were selected
  alternatives: string[];              // Other options considered
  user_override: boolean;              // True if user configured settings
}

export interface PerformanceMetrics {
  duration_ms: number;                 // Total execution time
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  tool_calls: number;                  // Number of tool invocations
  agent_calls: number;                 // Number of nested agent calls
}
```

**Validation Rules**:
- `agent_id` must reference existing agent
- `status` transitions: pending → running → (succeeded | failed | timeout)
- `tier` determines timeout limits
- `events` must be chronologically ordered

**State Transitions**:
```
pending → running → succeeded
              ↓
            failed
              ↓
           timeout
```

**Relationships**:
- Run → Agent (many-to-one)
- Run → User (many-to-one, via `created_by`)
- Run → Scores (one-to-many)

---

### Workflow

Represents a multi-step agent workflow with nodes and edges defining execution flow.

```typescript
export type WorkflowNodeType = 
  | 'agent'      // Execute an agent
  | 'tool'       // Execute a tool
  | 'condition'  // Conditional branching
  | 'input'      // Workflow input
  | 'output'     // Workflow output
  | 'transform'; // Data transformation

export interface WorkflowNode {
  id: string;                          // Node ID (unique in workflow)
  type: WorkflowNodeType;              // Node type
  config: Record<string, any>;         // Node-specific configuration
  position?: { x: number; y: number }; // UI position (React Flow)
}

export interface WorkflowEdge {
  id: string;                          // Edge ID
  source: string;                      // Source node ID
  target: string;                      // Target node ID
  condition?: string;                  // Condition for conditional edges
}

export interface Workflow {
  id: string;                          // UUID
  name: string;                        // Workflow name
  description: string | null;          // Purpose and usage
  nodes: WorkflowNode[];               // Workflow nodes
  edges: WorkflowEdge[];               // Connections between nodes
  is_active: boolean;                  // Whether workflow is enabled
  created_by: string;                  // User ID of creator
  created_at: string;                  // ISO 8601 timestamp
  updated_at: string;                  // ISO 8601 timestamp
}

export interface WorkflowExecution {
  id: string;                          // Execution ID (same as run_id)
  workflow_id: string;                 // UUID of workflow
  status: RunStatus;                   // Overall execution status
  step_results: StepResult[];          // Results from each step
  created_at: string;                  // ISO 8601 timestamp
  completed_at: string | null;         // When execution completed
}

export interface StepResult {
  node_id: string;                     // Node that executed
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped';
  input: Record<string, any>;          // Input to this step
  output: Record<string, any> | null;  // Output from this step
  error: string | null;                // Error if failed
  started_at: string | null;           // When step started
  completed_at: string | null;         // When step completed
}
```

**Validation Rules**:
- `nodes` must include exactly one input node and one output node
- `edges` must not create circular dependencies
- All `edges.source` and `edges.target` must reference existing nodes
- Condition nodes must have at least 2 outgoing edges
- All nodes except input must have at least one incoming edge
- All nodes except output must have at least one outgoing edge

**State Transitions**:
- Workflow execution follows node dependencies
- Failed steps can be retried (resume) or workflow restarted
- Skipped steps occur when condition evaluates to false

**Relationships**:
- Workflow → Runs (one-to-many, via WorkflowExecution)
- Workflow → User (many-to-one, via `created_by`)

---

### Tool

Represents a capability that agents can use (search, RAG, ingest, custom, etc.).

```typescript
export interface Tool {
  id: string;                          // UUID
  name: string;                        // Unique identifier (e.g., "doc_search")
  description: string | null;          // What the tool does
  schema: ToolSchema;                  // Input/output schema
  entrypoint: string;                  // Python function path (e.g., "app.tools.search.execute")
  scopes: string[];                    // Required permission scopes
  is_active: boolean;                  // Whether tool is enabled
  is_builtin: boolean;                 // True if hardcoded in agent-server
  version: number;                     // Schema version
  created_at: string;                  // ISO 8601 timestamp
  updated_at: string;                  // ISO 8601 timestamp
}

export interface ToolSchema {
  input: {
    type: 'object';
    properties: Record<string, SchemaProperty>;
    required: string[];
  };
  output: {
    type: 'object';
    properties: Record<string, SchemaProperty>;
  };
}

export interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  items?: SchemaProperty;              // For array types
  properties?: Record<string, SchemaProperty>; // For object types
}

export interface ToolUsage {
  tool_id: string;                     // UUID
  usage_count: number;                 // Number of times used
  agent_count: number;                 // Number of agents using it
  last_used_at: string | null;         // ISO 8601 timestamp
  agents: string[];                    // Agent IDs using this tool
}
```

**Validation Rules**:
- `name` must be unique, lowercase, alphanumeric with underscores
- `schema` must be valid JSON Schema
- `entrypoint` must be valid Python module path
- Built-in tools cannot be modified or deleted

**Relationships**:
- Tool → Agents (many-to-many)
- Tool → Runs (many-to-many, via tool calls in events)

---

### Schedule

Represents a recurring agent execution with cron expression and execution history.

```typescript
export interface Schedule {
  id: string;                          // UUID
  agent_id: string;                    // UUID of agent to execute
  input: Record<string, any>;          // Input data for execution
  cron_expression: string;             // Cron expression (e.g., "0 9 * * *")
  tier: RunTier;                       // Execution tier
  scopes: string[];                    // Scopes for execution
  next_run_time: string;               // ISO 8601 timestamp
  is_active: boolean;                  // Whether schedule is enabled
  created_by: string;                  // User ID of creator
  created_at: string;                  // ISO 8601 timestamp
  updated_at: string;                  // ISO 8601 timestamp
}

export interface ScheduleExecution {
  id: string;                          // Execution ID
  schedule_id: string;                 // UUID of schedule
  run_id: string;                      // UUID of run created
  scheduled_time: string;              // When it was supposed to run
  actual_time: string;                 // When it actually ran
  status: RunStatus;                   // Execution status
  error: string | null;                // Error if failed
}
```

**Validation Rules**:
- `cron_expression` must be valid cron syntax
- `next_run_time` must be in the future
- `agent_id` must reference existing agent
- `tier` must be valid tier value

**State Transitions**:
- Created → Active (when enabled)
- Active → Paused (when disabled)
- Paused → Active (when re-enabled)
- Active → Deleted (when deleted)

**Relationships**:
- Schedule → Agent (many-to-one)
- Schedule → Runs (one-to-many, via executions)
- Schedule → User (many-to-one, via `created_by`)

---

### Scorer & Score

Represents evaluation definitions and results for assessing run quality.

```typescript
export interface Scorer {
  id: string;                          // UUID
  name: string;                        // Scorer name
  description: string | null;          // What it evaluates
  config: ScorerConfig;                // Evaluation configuration
  is_active: boolean;                  // Whether scorer is enabled
  created_by: string;                  // User ID of creator
  created_at: string;                  // ISO 8601 timestamp
  updated_at: string;                  // ISO 8601 timestamp
}

export interface ScorerConfig {
  criteria: string;                    // Evaluation criteria description
  pass_threshold: number;              // Minimum score to pass (0-1)
  model?: string;                      // LLM model for evaluation (if LLM-based)
  prompt_template?: string;            // Prompt for LLM evaluation
  rules?: Record<string, any>;         // Rule-based evaluation config
}

export interface Score {
  id: string;                          // UUID
  run_id: string;                      // UUID of run evaluated
  scorer_id: string;                   // UUID of scorer used
  score: number;                       // Score value (0-1)
  passed: boolean;                     // True if score >= pass_threshold
  details: Record<string, any>;        // Detailed evaluation results
  created_at: string;                  // ISO 8601 timestamp
}

export interface ScoreAggregate {
  scorer_id: string;                   // UUID of scorer
  agent_id?: string;                   // UUID of agent (if filtered)
  count: number;                       // Number of runs scored
  average: number;                     // Average score
  min: number;                         // Minimum score
  max: number;                         // Maximum score
  percentile_50: number;               // Median score
  percentile_90: number;               // 90th percentile
  percentile_95: number;               // 95th percentile
  pass_rate: number;                   // Percentage that passed
}
```

**Validation Rules**:
- `score` must be between 0 and 1
- `pass_threshold` must be between 0 and 1
- `passed` = `score >= pass_threshold`

**Relationships**:
- Scorer → Scores (one-to-many)
- Score → Run (many-to-one)
- Score → Scorer (many-to-one)

---

## Shared Library Entities (busibox-ui)

These entities are defined in busibox-ui and used by both AI Portal and Agent Client.

### Message

Represents a single message in a conversation.

```typescript
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;                          // Unique message ID
  role: MessageRole;                   // Who sent the message
  content: string;                     // Message text
  attachments: Attachment[];           // Attached files
  metadata: MessageMetadata;           // Additional data (routing, tool calls, etc.)
  timestamp: Date;                     // When message was sent
}

export interface MessageMetadata {
  // For agent-server routing (Agent Client)
  run_id?: string;                     // Associated run ID
  routing_decision?: RoutingDecision;  // Dispatcher routing info
  tool_calls?: ToolCall[];             // Tools invoked
  agent_calls?: AgentCall[];           // Nested agent calls
  
  // For direct LLM (AI Portal)
  model?: string;                      // LLM model used
  token_usage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  
  // Common
  error?: string;                      // Error message if failed
  duration_ms?: number;                // Response time
}

export interface ToolCall {
  tool_name: string;                   // Tool that was called
  input: Record<string, any>;          // Tool input
  output: Record<string, any> | null;  // Tool output
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  error: string | null;                // Error if failed
  duration_ms: number;                 // Execution time
}

export interface AgentCall {
  agent_id: string;                    // Agent that was called
  agent_name: string;                  // Agent display name
  input: Record<string, any>;          // Agent input
  output: Record<string, any> | null;  // Agent output
  status: RunStatus;                   // Agent execution status
  tool_calls: ToolCall[];              // Tools called by this agent
  duration_ms: number;                 // Execution time
}
```

**Validation Rules**:
- `role` must be valid MessageRole
- `content` must not be empty for user messages
- `timestamp` must be valid Date

**State Transitions**:
- User message: created → sent
- Assistant message: pending → streaming → complete

---

### Conversation

Represents a chat session with messages and settings.

```typescript
export interface Conversation {
  id: string;                          // Unique conversation ID
  title: string;                       // Conversation title (auto-generated or user-set)
  messages: Message[];                 // All messages in conversation
  settings?: ConversationSettings;     // Conversation-specific settings
  created_at: Date;                    // When conversation started
  updated_at: Date;                    // Last message timestamp
}

export interface ConversationSettings {
  // For AI Portal (direct LLM)
  model?: string;                      // Selected LLM model
  temperature?: number;                // LLM temperature
  search_enabled?: boolean;            // Whether search is enabled
  
  // For Agent Client (dispatcher routing)
  enabled_tools?: string[];            // Tools available to dispatcher
  selected_agents?: string[];          // Personal agents available
  routing_mode?: 'automatic' | 'manual'; // Routing behavior
}
```

**Validation Rules**:
- `messages` must be chronologically ordered
- First message must be from user
- Messages must alternate between user and assistant (with exceptions for system messages)

**Relationships**:
- Conversation → Messages (one-to-many)
- Conversation → User (many-to-one, implicit via session)

---

### Attachment

Represents a file attached to a message.

```typescript
export interface Attachment {
  id: string;                          // Unique attachment ID
  name: string;                        // Original filename
  type: string;                        // MIME type (e.g., "application/pdf")
  size: number;                        // File size in bytes
  url: string;                         // URL to access file
  uploaded_at: Date;                   // When file was uploaded
}
```

**Validation Rules**:
- `size` must be under maximum allowed (e.g., 10MB)
- `type` must be allowed MIME type
- `url` must be valid URL

**Relationships**:
- Attachment → Message (many-to-one)

---

## Client-Only Entities

These entities are managed entirely in the client and not persisted to agent-server.

### ChatSettings

User preferences for chat routing (Agent Client only).

```typescript
export interface ChatSettings {
  enabled_tools: string[];             // Tools available to dispatcher
  selected_agents: string[];           // Personal agents available (UUIDs)
  routing_mode: 'automatic' | 'manual'; // Routing behavior
}
```

**Storage**: localStorage, key: `chat_settings_${userId}`

**Default Values**:
```typescript
const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  enabled_tools: ['doc_search', 'web_search'],
  selected_agents: [],
  routing_mode: 'automatic',
};
```

---

### UIState

Transient UI state (not persisted).

```typescript
export interface UIState {
  // Chat
  currentConversationId: string | null;
  isStreaming: boolean;
  showSettings: boolean;
  showDisambiguation: boolean;
  
  // Agent Management
  selectedAgentId: string | null;
  agentEditorMode: 'create' | 'edit' | 'view';
  
  // Run Management
  selectedRunIds: string[];            // For comparison
  runFilters: RunFilters;
  
  // Workflow Builder
  workflowNodes: WorkflowNode[];
  workflowEdges: WorkflowEdge[];
  selectedNodeId: string | null;
}

export interface RunFilters {
  agent_id?: string;                   // Filter by agent
  status?: RunStatus;                  // Filter by status
  created_by?: string;                 // Filter by user
  date_from?: Date;                    // Filter by date range
  date_to?: Date;
}
```

---

## Entity Relationships Diagram

```
User (from auth)
  ├─→ Agent (created_by)
  │    ├─→ Run (agent_id)
  │    │    ├─→ Score (run_id)
  │    │    └─→ RunEvent (run_id)
  │    └─→ Schedule (agent_id)
  │         └─→ ScheduleExecution (schedule_id)
  │              └─→ Run (run_id)
  ├─→ Workflow (created_by)
  │    └─→ WorkflowExecution (workflow_id)
  │         └─→ StepResult (execution_id)
  ├─→ Scorer (created_by)
  │    └─→ Score (scorer_id)
  └─→ Conversation (implicit)
       └─→ Message (conversation_id)
            └─→ Attachment (message_id)

Tool (standalone)
  └─→ ToolUsage (tool_id)
```

---

## Data Flow

### Chat Flow (Dispatcher Routing)

```
User Input → MessageInput
  ↓
  → POST /api/runs (with dispatcher agent)
  ↓
  → Agent-Server POST /runs
  ↓
  → Run created (status: pending)
  ↓
  → SSE stream established (/api/streams/runs/{id})
  ↓
  → Events streamed (status, tool_calls, agent_calls, output)
  ↓
  → useRunStream hook updates UI
  ↓
  → Message displayed with routing decisions
```

### Agent Creation Flow

```
User Input → AgentEditor
  ↓
  → Validation (client-side)
  ↓
  → POST /api/agents
  ↓
  → Agent-Server POST /agents/definitions
  ↓
  → Agent created in database
  ↓
  → Agent returned to client
  ↓
  → AgentList updated
```

### Workflow Execution Flow

```
User Design → WorkflowBuilder (React Flow)
  ↓
  → Validation (circular deps, disconnected nodes)
  ↓
  → workflow-converter.ts (React Flow → agent-server format)
  ↓
  → POST /api/workflows
  ↓
  → Agent-Server POST /workflows
  ↓
  → Workflow saved
  ↓
  → Execute: POST /api/runs/workflow
  ↓
  → WorkflowExecution created
  ↓
  → SSE stream for step-by-step monitoring
  ↓
  → StepResults displayed in real-time
```

---

## Type Definitions Location

**agent-manager** (`lib/types.ts`):
- Agent, Run, Workflow, Tool, Schedule, Scorer, Score
- All agent-server API types
- ChatSettings, UIState, RunFilters

**busibox-ui** (`src/chat/types/index.ts`):
- Message, Conversation, Attachment
- MessageMetadata, ToolCall, AgentCall
- ConversationSettings

**Shared Types**:
- RoutingDecision (used by both)
- PerformanceMetrics (used by both)
- RunStatus, RunTier (used by both)

---

## API Request/Response Examples

### Create Agent

**Request**:
```json
POST /api/agents
{
  "name": "research-assistant",
  "display_name": "Research Assistant",
  "description": "Searches documents and generates summaries",
  "model": "gpt-4",
  "instructions": "You are a research assistant...",
  "tools": {
    "doc_search": {},
    "summarize": {}
  },
  "scopes": ["read:documents"],
  "is_active": true
}
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "research-assistant",
  "display_name": "Research Assistant",
  "description": "Searches documents and generates summaries",
  "model": "gpt-4",
  "instructions": "You are a research assistant...",
  "tools": {
    "doc_search": {},
    "summarize": {}
  },
  "scopes": ["read:documents"],
  "is_active": true,
  "version": 1,
  "created_at": "2025-12-11T10:00:00Z",
  "updated_at": "2025-12-11T10:00:00Z"
}
```

### Execute Agent Run

**Request**:
```json
POST /api/runs
{
  "agent_id": "550e8400-e29b-41d4-a716-446655440000",
  "input": {
    "query": "What are the key findings in document X?"
  },
  "tier": "complex",
  "scopes": ["read:documents"]
}
```

**Response**:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "agent_id": "550e8400-e29b-41d4-a716-446655440000",
  "input": {
    "query": "What are the key findings in document X?"
  },
  "output": null,
  "status": "pending",
  "events": [],
  "performance_metrics": {
    "duration_ms": 0,
    "token_usage": {
      "prompt_tokens": 0,
      "completion_tokens": 0,
      "total_tokens": 0
    },
    "tool_calls": 0,
    "agent_calls": 0
  },
  "error": null,
  "tier": "complex",
  "scopes": ["read:documents"],
  "created_by": "user-123",
  "created_at": "2025-12-11T10:05:00Z",
  "started_at": null,
  "completed_at": null
}
```

### SSE Event Stream

**Events** (text/event-stream):
```
event: status
data: {"type":"status","status":"running","timestamp":"2025-12-11T10:05:01Z"}

event: tool_call
data: {"type":"tool_call","tool_name":"doc_search","input":{"query":"document X"},"timestamp":"2025-12-11T10:05:02Z"}

event: tool_call
data: {"type":"tool_call","tool_name":"doc_search","output":{"results":[...]},"status":"succeeded","timestamp":"2025-12-11T10:05:03Z"}

event: output
data: {"type":"output","content":"Key findings: ...","timestamp":"2025-12-11T10:05:05Z"}

event: status
data: {"type":"status","status":"succeeded","timestamp":"2025-12-11T10:05:05Z"}
```

---

## Summary

All entities are well-defined with:
- ✅ Clear field types and constraints
- ✅ Validation rules specified
- ✅ State transitions documented
- ✅ Relationships mapped
- ✅ API request/response examples provided

The data model is ready for implementation. TypeScript interfaces will be created in `lib/types.ts` (agent-manager) and `src/chat/types/index.ts` (busibox-ui).
