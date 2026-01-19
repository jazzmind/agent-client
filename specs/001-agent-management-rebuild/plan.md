# Implementation Plan: Agent Management System Rebuild

**Branch**: `001-agent-management-rebuild` | **Date**: 2025-12-11 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-agent-management-rebuild/spec.md`

## Summary

Rebuild the agent-manager application to provide a comprehensive UI for managing AI agents through the Python agent-server API. The system will feature intelligent chat routing via a dispatcher agent, visual workflow design, LLM-assisted agent creation, and complete admin controls. All chat components will be extracted into the busibox-ui shared library to enable reuse across Busibox applications (AI Portal, Agent Client, etc.).

**Core Technical Approach**:
- Extract chat components into busibox-ui with configurable API handlers supporting both direct LLM (AI Portal) and agent-server routing (Agent Client)
- Build comprehensive TypeScript API client for all agent-server endpoints
- Implement SSE streaming for real-time agent execution monitoring
- Use React Flow for visual workflow design
- Create LLM-assisted agent design interface
- Maintain existing Next.js 15 + TypeScript + Tailwind CSS stack

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15 (App Router)  
**Primary Dependencies**: 
- React 19, Next.js 15, TypeScript 5
- Tailwind CSS 4 for styling
- React Flow for workflow visualization
- Vitest for testing
- Storybook for component development
- jose for JWT handling

**Storage**: PostgreSQL (managed by agent-server, no direct access from client)  
**Testing**: Vitest with React Testing Library, Storybook for component testing  
**Target Platform**: Web browsers (Chrome 6+, Firefox 6+, Safari 5+, Edge 79+) with SSE support  
**Project Type**: Web application (Next.js frontend + API routes as proxy to agent-server)  
**Performance Goals**: 
- SSE event processing <100ms latency
- Page load <2s on 3G
- Workflow graph rendering <1s for 50 nodes
- API response time <500ms (95th percentile)

**Constraints**: 
- Must maintain backward compatibility with AI Portal after chat component migration
- Must support 100 concurrent SSE streams
- Must handle 10,000 stored runs efficiently
- Must work with existing Busibox authentication infrastructure

**Scale/Scope**: 
- 100 concurrent users
- 100 active agents
- 10,000 run records
- 50-node workflows
- 50 concurrent agent executions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ⚠️ **CONSTITUTION INCOMPLETE** - The constitution file exists as a template but has not been filled in with project-specific principles.

**Action Required**: The constitution must be completed before proceeding with full implementation. However, based on the feature specification and user requirements, the following principles are inferred:

### Inferred Core Principles

1. **Component Reusability**: Build shared components in busibox-ui for use across all Busibox applications
2. **API-First Design**: All agent operations go through agent-server API; client is a pure UI layer
3. **Type Safety**: TypeScript strict mode with zero compilation errors
4. **Real-Time Streaming**: Use SSE for live agent execution monitoring
5. **Visual Workflow Design**: Provide intuitive drag-and-drop workflow builder
6. **LLM-Assisted Development**: Integrate AI assistance for agent design and validation
7. **Test-First for Critical Paths**: 80%+ test coverage for API client and critical user flows
8. **Observability**: Comprehensive event timelines, metrics, and debugging tools

**Gate Status**: ✅ **CONDITIONAL PASS** - Proceeding with planning based on inferred principles. Constitution should be formalized before implementation begins.

## Project Structure

### Documentation (this feature)

```text
specs/001-agent-management-rebuild/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (in progress)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
│   └── agent-manager-api.yaml
├── tasks.md             # Phase 2 output (/speckit.tasks command)
└── checklists/
    └── requirements.md  # Requirements validation checklist
```

### Source Code (repository root)

```text
agent-manager/                    # Next.js application
├── app/                         # Next.js App Router
│   ├── page.tsx                # Home/dashboard
│   ├── layout.tsx              # Root layout
│   ├── chat/                   # Chat interface (uses busibox-ui)
│   │   ├── page.tsx           # Chat page with dispatcher
│   │   └── components/        # Agent-specific chat components
│   │       ├── DispatcherSettings.tsx
│   │       ├── RoutingVisualization.tsx
│   │       └── ToolAgentSelector.tsx
│   ├── admin/                  # Admin interface
│   │   ├── page.tsx           # Admin dashboard
│   │   ├── agents/            # Agent management
│   │   │   ├── page.tsx       # Agent list
│   │   │   ├── [id]/         # Agent detail/edit
│   │   │   └── new/          # Create agent
│   │   ├── runs/              # Run management
│   │   │   ├── page.tsx       # Run list
│   │   │   └── [id]/         # Run detail
│   │   ├── workflows/         # Workflow management
│   │   │   ├── page.tsx       # Workflow list
│   │   │   ├── [id]/         # Workflow detail/edit
│   │   │   └── builder/      # Visual workflow builder
│   │   ├── tools/             # Tool management
│   │   ├── schedules/         # Schedule management
│   │   ├── evaluations/       # Evaluation management
│   │   └── guardrails/        # Rate limits & usage
│   └── api/                    # API proxy routes
│       ├── agents/            # Proxy to agent-server /agents
│       ├── runs/              # Proxy to agent-server /runs
│       ├── workflows/         # Proxy to agent-server /workflows
│       ├── tools/             # Proxy to agent-server /tools
│       ├── evals/             # Proxy to agent-server /evals
│       ├── schedules/         # Proxy to agent-server /schedules
│       ├── models/            # Proxy to agent-server /models
│       └── streams/           # SSE streaming proxy
├── components/                 # React components
│   ├── chat/                  # Agent-specific chat extensions
│   │   ├── AgentChat.tsx     # Extended chat with agent features
│   │   ├── RunStatusIndicator.tsx
│   │   ├── ToolCallViewer.tsx
│   │   ├── EventTimeline.tsx
│   │   └── DispatcherFeedback.tsx
│   ├── admin/                 # Admin components
│   │   ├── AgentEditor.tsx
│   │   ├── AgentTester.tsx
│   │   ├── AgentList.tsx
│   │   ├── RunManagement.tsx
│   │   ├── RunDetail.tsx
│   │   ├── RunComparison.tsx
│   │   ├── WorkflowBuilder.tsx
│   │   ├── WorkflowNodes/    # React Flow nodes
│   │   │   ├── AgentNode.tsx
│   │   │   ├── ToolNode.tsx
│   │   │   ├── ConditionNode.tsx
│   │   │   ├── InputNode.tsx
│   │   │   └── OutputNode.tsx
│   │   ├── AgentDesignAssistant.tsx
│   │   ├── ValidationResults.tsx
│   │   ├── RefinementChat.tsx
│   │   ├── ToolManagement.tsx
│   │   ├── ScheduleManagement.tsx
│   │   ├── CronBuilder.tsx
│   │   ├── EvaluationManagement.tsx
│   │   ├── GuardrailsView.tsx
│   │   └── PerformanceDashboard.tsx
│   └── layout/                # Layout components
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Sidebar.tsx
├── lib/                        # Utilities and clients
│   ├── agent-api-client.ts    # Comprehensive agent-server API client
│   ├── sse-client.ts          # SSE streaming client
│   ├── workflow-converter.ts  # React Flow → agent-server format
│   ├── agent-designer.ts      # LLM-assisted design client
│   └── types.ts               # TypeScript type definitions
├── hooks/                      # React hooks
│   ├── useRunStream.ts        # SSE streaming hook
│   ├── useAgents.ts           # Agent management
│   ├── useRuns.ts             # Run management
│   └── useWorkflows.ts        # Workflow management
└── tests/                      # Test files
    ├── unit/                  # Unit tests
    ├── integration/           # Integration tests
    └── setup.ts               # Test setup

busibox-ui/                     # Shared UI component library
├── src/
│   ├── chat/                  # Chat components (migrated from AI Portal)
│   │   ├── components/
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── ConversationSidebar.tsx
│   │   │   ├── ModelSelector.tsx
│   │   │   ├── SearchToggles.tsx
│   │   │   ├── AttachmentUploader.tsx
│   │   │   └── AttachmentPreview.tsx
│   │   ├── hooks/
│   │   │   ├── useChat.ts
│   │   │   ├── useConversations.ts
│   │   │   ├── useSearchToggles.ts
│   │   │   └── useAttachments.ts
│   │   ├── types/
│   │   │   └── index.ts       # Message, Conversation, Attachment types
│   │   └── index.ts           # Exports
│   ├── layout/                # Existing layout components
│   ├── contexts/              # Existing contexts
│   └── index.ts               # Main exports
└── package.json
```

**Structure Decision**: This is a web application with:
1. **agent-manager**: Next.js frontend with API proxy routes
2. **busibox-ui**: Shared component library (new, created as part of this project)

The agent-manager acts as a pure UI layer that proxies all requests to the agent-server backend. The busibox-ui library provides reusable components that work with both direct LLM integration (AI Portal) and agent-server routing (Agent Client).

## Complexity Tracking

*No constitutional violations requiring justification. The project follows standard Next.js patterns with a shared component library, which is a common and well-established approach.*

---

## Phase 0: Research & Technology Decisions

### Research Tasks

Based on the Technical Context and feature requirements, the following areas require research to inform implementation decisions:

#### 1. SSE Streaming Best Practices for Next.js

**Question**: What is the best approach for handling Server-Sent Events in Next.js 15 App Router, especially for long-running agent executions?

**Research Focus**:
- Next.js 15 streaming response patterns
- SSE connection management and reconnection strategies
- Handling multiple concurrent SSE streams (target: 100 concurrent)
- Memory management for long-running streams
- Error handling and graceful degradation

**Expected Outcome**: Documented approach for `useRunStream` hook and SSE proxy routes

#### 2. React Flow Integration Patterns

**Question**: How should React Flow be integrated for workflow building with proper state management and conversion to agent-server format?

**Research Focus**:
- React Flow v11+ best practices for Next.js
- Custom node type implementation
- State management for workflow graphs
- Validation strategies (circular dependencies, disconnected nodes)
- Conversion from React Flow graph to backend workflow definition
- Performance optimization for 50+ node workflows

**Expected Outcome**: Architecture for WorkflowBuilder component and workflow-converter utility

#### 3. Shared Component Library Architecture

**Question**: What is the best approach for creating busibox-ui as a shared library that supports multiple API backends (direct LLM vs agent-server)?

**Research Focus**:
- TypeScript library build configuration (tsup, rollup, etc.)
- Prop-based API configuration patterns
- Versioning strategy for shared library
- Testing strategy for library components
- Documentation approach (Storybook integration)
- Dependency management (peer dependencies)

**Expected Outcome**: Build configuration and component API design for busibox-ui

#### 4. JWT Token Management in Next.js

**Question**: How should JWT tokens be managed for agent-server authentication, including automatic refresh?

**Research Focus**:
- Next.js middleware for token injection
- Token refresh strategies (proactive vs reactive)
- Secure token storage (httpOnly cookies vs localStorage)
- Token expiration handling in SSE streams
- Integration with existing better-auth system

**Expected Outcome**: Authentication strategy and token management implementation approach

#### 5. Dispatcher Agent UI/UX Patterns

**Question**: How should the UI display dispatcher routing decisions, nested agent calls, and disambiguation options?

**Research Focus**:
- UI patterns for showing AI reasoning/decision-making
- Nested execution visualization (tree view, timeline, etc.)
- Disambiguation UI patterns (modal, inline, sidebar)
- Advanced settings UI for tool/agent selection
- Real-time routing feedback during execution

**Expected Outcome**: UI/UX design for dispatcher-related features

### Research Output Location

All research findings will be documented in `research.md` with the following structure:

```markdown
# Research Findings: Agent Management System Rebuild

## 1. SSE Streaming in Next.js 15
- **Decision**: [chosen approach]
- **Rationale**: [why chosen]
- **Alternatives Considered**: [other options]
- **Implementation Notes**: [key details]

## 2. React Flow Integration
[same structure]

## 3. Shared Component Library
[same structure]

## 4. JWT Token Management
[same structure]

## 5. Dispatcher UI/UX
[same structure]
```

---

## Phase 1: Design & Contracts

### Data Model

The data model will be documented in `data-model.md` and will include:

#### Client-Side Entities (TypeScript interfaces)

These entities represent the data structures used in the agent-manager UI:

1. **Agent** (from agent-server)
   - `id`: UUID
   - `name`: string
   - `display_name`: string | null
   - `description`: string | null
   - `model`: string
   - `instructions`: string
   - `tools`: Record<string, any>
   - `workflow`: Record<string, any> | null
   - `scopes`: string[]
   - `is_active`: boolean
   - `is_builtin`: boolean (derived)
   - `is_personal`: boolean (derived from creator)
   - `created_at`: Date
   - `updated_at`: Date

2. **Run** (from agent-server)
   - `id`: UUID
   - `agent_id`: UUID
   - `input`: Record<string, any>
   - `output`: Record<string, any> | null
   - `status`: 'pending' | 'running' | 'succeeded' | 'failed' | 'timeout'
   - `events`: RunEvent[]
   - `routing_decisions`: RoutingDecision[] (for dispatcher runs)
   - `performance_metrics`: PerformanceMetrics
   - `error`: string | null
   - `tier`: 'simple' | 'complex' | 'batch'
   - `created_by`: UUID
   - `created_at`: Date
   - `completed_at`: Date | null

3. **Workflow** (from agent-server)
   - `id`: UUID
   - `name`: string
   - `description`: string | null
   - `steps`: WorkflowStep[]
   - `is_active`: boolean
   - `created_at`: Date
   - `updated_at`: Date

4. **Tool** (from agent-server)
   - `id`: UUID
   - `name`: string
   - `description`: string | null
   - `schema`: Record<string, any>
   - `entrypoint`: string
   - `scopes`: string[]
   - `is_active`: boolean
   - `is_builtin`: boolean

5. **Schedule** (from agent-server)
   - `id`: UUID
   - `agent_id`: UUID
   - `input`: Record<string, any>
   - `cron_expression`: string
   - `tier`: 'simple' | 'complex' | 'batch'
   - `scopes`: string[]
   - `next_run_time`: Date
   - `is_active`: boolean
   - `execution_history`: ScheduleExecution[]

6. **Scorer** (from agent-server)
   - `id`: UUID
   - `name`: string
   - `description`: string | null
   - `config`: Record<string, any>
   - `is_active`: boolean

7. **Score** (from agent-server)
   - `id`: UUID
   - `run_id`: UUID
   - `scorer_id`: UUID
   - `score`: number (0-1)
   - `passed`: boolean
   - `details`: Record<string, any>
   - `created_at`: Date

#### Shared Library Entities (busibox-ui)

8. **Message** (chat component)
   - `id`: string
   - `role`: 'user' | 'assistant' | 'system'
   - `content`: string
   - `attachments`: Attachment[]
   - `metadata`: Record<string, any> (for routing decisions, tool calls, etc.)
   - `timestamp`: Date

9. **Conversation** (chat component)
   - `id`: string
   - `title`: string
   - `messages`: Message[]
   - `created_at`: Date
   - `updated_at`: Date

10. **Attachment** (chat component)
    - `id`: string
    - `name`: string
    - `type`: string
    - `size`: number
    - `url`: string

11. **ChatSettings** (agent-manager specific)
    - `enabled_tools`: string[] (e.g., ['doc_search', 'web_search'])
    - `selected_agents`: UUID[] (personal agents)
    - `routing_mode`: 'automatic' | 'manual'

### API Contracts

#### Agent-Server API (consumed by agent-manager)

The agent-manager will consume the following agent-server endpoints. Contracts will be documented in `contracts/agent-server-api.yaml` (OpenAPI 3.0 format):

**Agents**:
- `GET /agents` - List all agents (built-in + custom)
- `POST /agents/definitions` - Create custom agent
- `GET /agents/definitions/{id}` - Get agent definition
- `PUT /agents/definitions/{id}` - Update agent definition
- `DELETE /agents/definitions/{id}` - Delete agent definition

**Runs**:
- `POST /runs` - Execute agent run
- `GET /runs/{id}` - Get run details
- `GET /runs` - List runs with filters
- `POST /runs/schedule` - Schedule recurring run
- `GET /runs/schedule` - List schedules
- `DELETE /runs/schedule/{id}` - Cancel schedule

**Workflows**:
- `POST /runs/workflow` - Execute workflow
- `GET /workflows` - List workflows
- `POST /workflows` - Create workflow
- `GET /workflows/{id}` - Get workflow
- `PUT /workflows/{id}` - Update workflow
- `DELETE /workflows/{id}` - Delete workflow

**Tools**:
- `GET /tools` - List all tools
- `POST /tools` - Create custom tool
- `GET /tools/{id}` - Get tool definition
- `PUT /tools/{id}` - Update tool
- `DELETE /tools/{id}` - Delete tool

**Evaluations**:
- `GET /evals` - List scorers
- `POST /evals` - Create scorer
- `POST /scores/execute` - Execute scorer on runs
- `GET /scores/aggregates` - Get aggregated scores

**Streaming**:
- `GET /streams/runs/{id}` - SSE stream for run events

**Models**:
- `GET /models` - List available LLM models

#### Agent-Client Internal API (Next.js API routes)

These routes proxy requests to agent-server with authentication:

- `GET /api/agents` → agent-server `GET /agents`
- `POST /api/agents` → agent-server `POST /agents/definitions`
- `GET /api/agents/{id}` → agent-server `GET /agents/definitions/{id}`
- `PUT /api/agents/{id}` → agent-server `PUT /agents/definitions/{id}`
- `DELETE /api/agents/{id}` → agent-server `DELETE /agents/definitions/{id}`
- `POST /api/runs` → agent-server `POST /runs`
- `GET /api/runs/{id}` → agent-server `GET /runs/{id}`
- `GET /api/runs` → agent-server `GET /runs`
- `GET /api/streams/runs/{id}` → agent-server `GET /streams/runs/{id}` (SSE)
- [Additional proxy routes for workflows, tools, evals, schedules, models]

### Quickstart Guide

The quickstart guide (`quickstart.md`) will provide:

1. **Local Development Setup**:
   ```bash
   # Clone and install dependencies
   cd agent-manager
   npm install
   
   # Install busibox-ui (local development)
   cd ../busibox-ui
   npm install
   npm link
   cd ../agent-manager
   npm link @busibox/ui
   
   # Configure environment
   cp env.example .env.local
   # Edit .env.local with agent-server URL
   
   # Start development server
   npm run dev
   ```

2. **Running Tests**:
   ```bash
   # Unit tests
   npm test
   
   # Watch mode
   npm run test:watch
   
   # Coverage
   npm run test:coverage
   
   # Storybook (component development)
   npm run storybook
   ```

3. **Building for Production**:
   ```bash
   npm run build
   npm start
   ```

4. **Key Configuration**:
   - `NEXT_PUBLIC_AGENT_SERVER_URL`: Agent-server endpoint
   - `NEXT_PUBLIC_AUTH_URL`: Authentication service endpoint
   - `JWT_SECRET`: For token validation

---

## Phase 2: Implementation Phases

### Phase 1 - Foundation (Priority: P1)

**Goal**: Establish core infrastructure for agent management and chat with dispatcher routing

**Deliverables**:

1. **busibox-ui Chat Components** (Week 1-2)
   - Extract chat components from AI Portal
   - Make API handlers configurable via props
   - Create reusable hooks (useChat, useConversations, useAttachments)
   - Define TypeScript types for messages, conversations
   - Set up build configuration (tsup)
   - Create Storybook stories for each component
   - Write unit tests for components and hooks
   - Update AI Portal to use busibox-ui components
   - Verify AI Portal functionality unchanged

2. **Agent API Client** (Week 2)
   - Create comprehensive TypeScript client for agent-server API
   - Implement all endpoints (agents, runs, workflows, tools, evals, schedules, models)
   - Add proper error handling and retry logic
   - Implement JWT token injection
   - Add TypeScript types for all request/response schemas
   - Write unit tests with mocked responses

3. **Chat with Dispatcher** (Week 3)
   - Create AgentChat component extending busibox-ui chat
   - Implement dispatcher routing visualization
   - Create DispatcherSettings for advanced tool/agent selection
   - Implement disambiguation UI for uncertain routing
   - Add support for file attachments in dispatcher context
   - Create RoutingVisualization component
   - Implement chat page using AgentChat

4. **Agent Management** (Week 3-4)
   - Create AgentList component with filtering
   - Create AgentEditor form with validation
   - Create AgentTester for quick testing
   - Implement agent CRUD operations
   - Add support for built-in vs custom agent distinction
   - Implement personal agent privacy (creator-only access)
   - Create admin agents page

5. **Run Monitoring** (Week 4)
   - Implement SSE streaming client (sse-client.ts)
   - Create useRunStream hook for real-time updates
   - Create RunStatusIndicator component
   - Create ToolCallViewer for expandable tool call details
   - Create EventTimeline for chronological events
   - Support nested agent call visualization (dispatcher → agent → tool)
   - Create RunManagement page with filters
   - Create RunDetail page with full run information

**Success Criteria**:
- ✅ AI Portal chat works with busibox-ui components
- ✅ Users can chat with dispatcher agent
- ✅ Dispatcher routes to appropriate tools/agents automatically
- ✅ Advanced settings allow explicit tool/agent selection
- ✅ Admins can create, edit, delete custom agents
- ✅ Users can see real-time agent execution status
- ✅ Run history is searchable and filterable

**Testing**:
- Unit tests for all components, hooks, and API client methods
- Integration tests for chat flow (send message → dispatcher → tool → response)
- Integration tests for agent CRUD operations
- SSE streaming tests with mock server
- Visual regression tests for chat components (Storybook)

### Phase 2 - Advanced Features (Priority: P2)

**Goal**: Add workflow builder, LLM-assisted design, and scheduling

**Deliverables**:

1. **Visual Workflow Builder** (Week 5-6)
   - Install and configure React Flow
   - Create custom node components (AgentNode, ToolNode, ConditionNode, etc.)
   - Create node configuration panels
   - Implement drag-and-drop workflow design
   - Add workflow validation (circular dependencies, disconnected nodes)
   - Create workflow-converter.ts for React Flow → agent-server format
   - Implement workflow execution with step-by-step monitoring
   - Add workflow resume/restart options for failed executions
   - Create WorkflowManagement page

2. **LLM-Assisted Agent Design** (Week 6-7)
   - Create agent-designer agent in agent-server (backend work)
   - Create agent-designer.ts client for calling designer agent
   - Create AgentDesignAssistant.tsx UI component
   - Implement natural language → agent configuration generation
   - Create ValidationResults.tsx for displaying suggestions
   - Create RefinementChat.tsx for iterative improvement
   - Add tool recommendation with explanations
   - Integrate into AgentEditor as optional assistant mode

3. **Schedule Management** (Week 7)
   - Create ScheduleManagement.tsx component
   - Create CronBuilder.tsx for visual cron expression building
   - Implement schedule CRUD operations
   - Display next run time calculations
   - Show schedule execution history
   - Add pause/resume/edit/delete controls

4. **Evaluation & Scoring** (Week 8)
   - Create EvaluationManagement.tsx component
   - Implement scorer definition CRUD
   - Create scorer execution interface
   - Display individual run scores
   - Show aggregated score metrics (avg, min, max, percentiles)
   - Add score filtering by agent, scorer, time period
   - Create score trend visualizations

5. **Tool Management** (Week 8)
   - Create ToolManagement.tsx component
   - Display built-in and custom tools
   - Implement custom tool creation with Python code editor
   - Add tool testing interface
   - Show tool usage analytics
   - Display which agents use which tools

**Success Criteria**:
- ✅ Users can design workflows visually
- ✅ Workflows execute with proper step sequencing
- ✅ Failed workflows offer resume/restart options
- ✅ LLM assistant generates agent configurations from descriptions
- ✅ Users can iteratively refine agent instructions
- ✅ Schedules execute automatically at specified times
- ✅ Scorers evaluate run quality
- ✅ Custom tools can be created and tested

**Testing**:
- Unit tests for workflow conversion logic
- Integration tests for workflow execution
- Unit tests for LLM assistant client
- Integration tests for schedule creation and execution
- Unit tests for scorer execution
- Integration tests for tool CRUD operations

### Phase 3 - Polish (Priority: P3)

**Goal**: Add analytics, comparison tools, and comprehensive documentation

**Deliverables**:

1. **Performance Dashboards** (Week 9)
   - Create PerformanceDashboard.tsx component
   - Add charts for runs over time (Chart.js or Recharts)
   - Display success rates by agent
   - Show average response times
   - Track token usage trends
   - Add time range filters

2. **Run Comparison** (Week 9)
   - Create RunComparison.tsx component
   - Implement side-by-side run comparison
   - Compare inputs, outputs, durations, tool usage
   - Highlight differences
   - Add export functionality

3. **Data Export** (Week 10)
   - Implement JSON export for runs
   - Implement CSV export for runs
   - Add bulk export with filters
   - Create export configuration UI

4. **Guardrails & Usage Monitoring** (Week 10)
   - Create GuardrailsView.tsx component
   - Display rate limits per tier
   - Show current usage metrics
   - Add visual indicators for approaching limits
   - Display historical usage charts
   - Add capacity planning insights

5. **Documentation** (Week 10)
   - Create architecture diagrams
   - Document API client usage
   - Create component usage guides
   - Write deployment guide
   - Create troubleshooting guide
   - Document testing strategy

**Success Criteria**:
- ✅ Admins can view performance trends
- ✅ Runs can be compared side-by-side
- ✅ Data can be exported in JSON/CSV
- ✅ Rate limits and usage are visible
- ✅ Documentation is comprehensive and accurate

**Testing**:
- Unit tests for chart data transformations
- Integration tests for data export
- Visual regression tests for dashboards
- Documentation accuracy verification

---

## Implementation Strategy

### Development Workflow

1. **Feature Branch**: All work happens on `001-agent-management-rebuild`
2. **Component Development**: Use Storybook for isolated component development
3. **Testing**: Write tests before or alongside implementation (TDD for critical paths)
4. **Code Review**: Self-review using checklist before considering complete
5. **Integration Testing**: Test with actual agent-server in development environment
6. **Deployment**: Deploy to test environment before production

### Testing Strategy

**Unit Tests** (Vitest + React Testing Library):
- All API client methods
- All hooks (useRunStream, useAgents, useRuns, useWorkflows)
- Component logic (form validation, state management)
- Utility functions (workflow-converter, token management)

**Integration Tests** (Vitest):
- Chat flow: message → dispatcher → tool → response
- Agent CRUD: create → test → save → list → edit → delete
- Run execution: start → stream events → complete
- Workflow execution: design → validate → execute → monitor
- Schedule execution: create → wait → verify execution

**Component Tests** (Storybook):
- Visual regression tests for all components
- Interaction tests for forms and controls
- Accessibility tests (WCAG 2.1 Level AA)

**E2E Tests** (optional, future):
- Full user journeys from login to task completion
- Cross-browser compatibility testing

### Deployment Strategy

**Development**:
- Local development with agent-server at localhost:8000
- Hot reload for rapid iteration
- Storybook for component development

**Test Environment**:
- Deploy to test apps-lxc container
- Connect to test agent-server (test environment)
- Use test authentication tokens
- Verify all features work end-to-end

**Production**:
- Deploy to production apps-lxc container via Ansible
- Connect to production agent-server
- Use production authentication
- Monitor performance and errors

### Risk Mitigation

**Risk 1: Chat component migration breaks AI Portal**
- **Mitigation**: Comprehensive testing of AI Portal after migration, maintain backward compatibility, use feature flags if needed

**Risk 2: SSE streaming performance issues with 100 concurrent streams**
- **Mitigation**: Load testing, connection pooling, automatic reconnection, graceful degradation

**Risk 3: React Flow performance with 50+ node workflows**
- **Mitigation**: Lazy loading, virtualization, performance profiling, optimization

**Risk 4: Dispatcher routing quality**
- **Mitigation**: Extensive testing with diverse queries, fallback to disambiguation UI, user feedback mechanism

**Risk 5: Workflow resume/restart depends on agent-server capabilities**
- **Mitigation**: Coordinate with agent-server team, implement UI for both options, graceful degradation if resume not supported

---

## Dependencies & Integration Points

### External Dependencies

1. **Agent-Server** (Python FastAPI)
   - **Endpoint**: http://10.96.200.31:8000 (production), http://localhost:8000 (development)
   - **Authentication**: JWT tokens via Authorization header
   - **Integration Points**: All agent operations, run execution, streaming
   - **Failure Mode**: Graceful degradation with error messages

2. **Authentication Service** (Busibox)
   - **Integration**: JWT token provider
   - **Failure Mode**: Cannot authenticate, show login prompt

3. **PostgreSQL** (via agent-server)
   - **Integration**: Indirect via agent-server API
   - **Failure Mode**: Agent-server returns 500 errors

### Shared Library Dependencies

1. **busibox-ui** (new)
   - **Version**: 0.1.0 (initial)
   - **Integration**: npm package, imported in agent-manager and AI Portal
   - **Breaking Changes**: Semantic versioning, changelog, migration guides

2. **React Flow** (npm package)
   - **Version**: ^11.0.0
   - **Integration**: Workflow builder
   - **Alternatives**: None (industry standard for node-based editors)

### Infrastructure Dependencies

1. **Ansible** (deployment)
   - **Role**: nextjs_app (existing)
   - **Updates**: Add reactflow dependency, update environment variables

2. **PM2** (process management)
   - **Configuration**: ecosystem.config.js
   - **Updates**: None required

3. **nginx** (reverse proxy)
   - **Configuration**: Existing proxy rules
   - **Updates**: None required (uses existing app routing)

---

## Acceptance Criteria

### Phase 1 Acceptance

- [ ] busibox-ui package published and installable
- [ ] AI Portal chat functionality unchanged after migration
- [ ] Agent-client chat interface functional with dispatcher routing
- [ ] Dispatcher automatically routes to appropriate tools/agents
- [ ] Advanced settings allow explicit tool/agent selection
- [ ] Disambiguation UI appears when routing is uncertain
- [ ] Admins can create, edit, delete custom agents
- [ ] Personal agents are private to creator
- [ ] Agent testing works before saving
- [ ] Real-time run monitoring with SSE streaming
- [ ] Run history searchable and filterable
- [ ] Run details show events, tool calls, routing decisions
- [ ] All Phase 1 tests passing (unit + integration)

### Phase 2 Acceptance

- [ ] Visual workflow builder functional
- [ ] Workflows can be designed, validated, saved, executed
- [ ] Failed workflows offer resume/restart options
- [ ] LLM assistant generates agent configurations
- [ ] Agent validation provides actionable suggestions
- [ ] Iterative refinement improves agent instructions
- [ ] Schedules execute automatically
- [ ] Schedule history shows past executions
- [ ] Scorers evaluate run quality
- [ ] Aggregated scores display correctly
- [ ] Custom tools can be created with Python code
- [ ] Tool testing works before deployment
- [ ] All Phase 2 tests passing

### Phase 3 Acceptance

- [ ] Performance dashboards show trends
- [ ] Run comparison works side-by-side
- [ ] Data export (JSON/CSV) functional
- [ ] Guardrails view shows rate limits and usage
- [ ] Documentation complete and accurate
- [ ] All Phase 3 tests passing
- [ ] Deployed to test environment successfully
- [ ] Deployed to production successfully

---

## Timeline Estimate

**Phase 1 - Foundation**: 4 weeks
- Week 1-2: busibox-ui migration and setup
- Week 2: Agent API client
- Week 3: Chat with dispatcher
- Week 3-4: Agent management
- Week 4: Run monitoring

**Phase 2 - Advanced Features**: 4 weeks
- Week 5-6: Visual workflow builder
- Week 6-7: LLM-assisted design
- Week 7: Schedule management
- Week 8: Evaluation, scoring, tool management

**Phase 3 - Polish**: 2 weeks
- Week 9: Performance dashboards, run comparison
- Week 10: Data export, guardrails, documentation

**Total**: 10 weeks (2.5 months)

**Critical Path**:
1. busibox-ui migration (blocks everything)
2. Agent API client (blocks all agent operations)
3. Chat with dispatcher (P1 user story)
4. Agent management (P1 user story)
5. Run monitoring (required for all features)

---

## Next Steps

1. **Complete Phase 0 Research**: Create `research.md` with findings for all 5 research tasks
2. **Complete Phase 1 Design**: Create `data-model.md` with detailed entity definitions
3. **Generate API Contracts**: Create `contracts/agent-server-api.yaml` with OpenAPI spec
4. **Create Quickstart**: Write `quickstart.md` with setup instructions
5. **Update Agent Context**: Run `.specify/scripts/bash/update-agent-context.sh cursor-agent`
6. **Break Down Tasks**: Run `/speckit.tasks` to create detailed task list
7. **Begin Implementation**: Start with busibox-ui chat component migration

---

## Notes

- **Constitution**: The project constitution template exists but has not been filled in. The inferred principles above should be formalized in `.specify/memory/constitution.md` before full implementation begins.
- **Workflow Resume**: The resume/restart functionality for failed workflows depends on agent-server capabilities. This should be verified during Phase 2 implementation.
- **Dispatcher Agent**: Assumes dispatcher agent exists in agent-server. If not, this must be implemented in agent-server first.
- **Personal Agent Privacy**: Agent-server must enforce that personal agents are only accessible by their creator. UI will filter based on permissions.
- **Custom Tools**: Tool creation UI will provide Python code editor, but execution happens in agent-server. Security and sandboxing are agent-server responsibilities.
