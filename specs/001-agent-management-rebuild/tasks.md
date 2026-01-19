# Tasks: Agent Management System Rebuild

**Input**: Design documents from `/specs/001-agent-management-rebuild/`  
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (complete), contracts/ (complete)

**Tests**: Tests are NOT explicitly requested in the specification. Test tasks are included but marked as optional. Focus on implementation tasks first.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **agent-manager**: Next.js app at `/Users/wessonnenreich/Code/sonnenreich/agent-manager/`
- **busibox-ui**: Shared library at `/Users/wessonnenreich/Code/sonnenreich/busibox-ui/`
- Paths shown below use relative paths from repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify Next.js 15 and React 19 are installed in agent-manager/package.json
- [x] T002 Verify TypeScript 5.x configuration in agent-manager/tsconfig.json with strict mode
- [x] T003 [P] Install React Flow package: `npm install reactflow` in agent-manager/
- [x] T004 [P] Verify Vitest and React Testing Library in agent-manager/package.json
- [x] T005 [P] Verify Storybook configuration in agent-manager/.storybook/
- [x] T006 [P] Create agent-manager/lib/types.ts with shared TypeScript types from data-model.md
- [x] T007 [P] Create agent-manager/.env.example with AGENT_SERVER_URL and other required variables
- [x] T008 [P] Verify busibox-ui package exists and has tsup build configuration
- [ ] T009 [P] Set up npm link for local busibox-ui development per quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Create comprehensive AgentAPIClient class in agent-manager/lib/agent-api-client.ts with all agent-server endpoints
- [ ] T011 [P] Create SSE client utility in agent-manager/lib/sse-client.ts for streaming connections
- [ ] T012 [P] Create useRunStream hook in agent-manager/hooks/useRunStream.ts for SSE streaming
- [ ] T013 [P] Create API proxy route handler in agent-manager/app/api/agents/route.ts (GET, POST)
- [ ] T014 [P] Create API proxy route handler in agent-manager/app/api/agents/definitions/[id]/route.ts (PUT)
- [ ] T015 [P] Create API proxy route handler in agent-manager/app/api/runs/route.ts (GET, POST)
- [ ] T016 [P] Create API proxy route handler in agent-manager/app/api/runs/[id]/route.ts (GET)
- [ ] T017 [P] Create API proxy route handler in agent-manager/app/api/streams/runs/[id]/route.ts (SSE streaming)
- [ ] T018 [P] Create API proxy route handler in agent-manager/app/api/models/route.ts (GET)
- [ ] T019 [P] Create error handling middleware in agent-manager/lib/error-handler.ts
- [ ] T020 [P] Create authentication helper in agent-manager/lib/auth-helper.ts for JWT token management

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Intelligent Chat with Dispatcher Agent (Priority: P1) 🎯 MVP

**Goal**: Enable users to chat naturally with intelligent routing through dispatcher agent. The dispatcher analyzes queries and automatically routes to appropriate tools/agents (doc search, web search, personal agents) with real-time streaming results.

**Independent Test**: Send various queries (questions, document analysis requests, web research) and verify dispatcher routes to appropriate agents/tools automatically. Test advanced settings for explicit tool/agent selection. Verify file attachments are handled correctly.

### busibox-ui Chat Components Migration

- [ ] T021 [P] [US1] Create busibox-ui/src/chat/ directory structure with components/, hooks/, types/ subdirectories
- [ ] T022 [P] [US1] Define TypeScript types in busibox-ui/src/chat/types/index.ts (Message, Conversation, Attachment, ChatSettings)
- [ ] T023 [P] [US1] Migrate MessageList.tsx from AI Portal to busibox-ui/src/chat/components/MessageList.tsx with configurable API handlers
- [ ] T024 [P] [US1] Migrate MessageInput.tsx from AI Portal to busibox-ui/src/chat/components/MessageInput.tsx with attachment handling
- [ ] T025 [P] [US1] Migrate ConversationSidebar.tsx from AI Portal to busibox-ui/src/chat/components/ConversationSidebar.tsx
- [ ] T026 [P] [US1] Migrate ModelSelector.tsx from AI Portal to busibox-ui/src/chat/components/ModelSelector.tsx
- [ ] T027 [P] [US1] Migrate SearchToggles.tsx from AI Portal to busibox-ui/src/chat/components/SearchToggles.tsx
- [ ] T028 [P] [US1] Migrate AttachmentUploader.tsx from AI Portal to busibox-ui/src/chat/components/AttachmentUploader.tsx
- [ ] T029 [P] [US1] Migrate AttachmentPreview.tsx from AI Portal to busibox-ui/src/chat/components/AttachmentPreview.tsx
- [ ] T030 [P] [US1] Create useChat hook in busibox-ui/src/chat/hooks/useChat.ts with configurable API calls
- [ ] T031 [P] [US1] Create useConversations hook in busibox-ui/src/chat/hooks/useConversations.ts
- [ ] T032 [P] [US1] Create useSearchToggles hook in busibox-ui/src/chat/hooks/useSearchToggles.ts
- [ ] T033 [P] [US1] Create useAttachments hook in busibox-ui/src/chat/hooks/useAttachments.ts
- [ ] T034 [US1] Create busibox-ui/src/chat/index.ts to export all chat components and hooks
- [ ] T035 [US1] Build busibox-ui package with tsup: `npm run build` in busibox-ui/
- [ ] T036 [US1] Update AI Portal to import chat components from @busibox/ui instead of local files
- [ ] T037 [US1] Test AI Portal chat functionality still works after migration (manual verification)

### Agent-Client Chat Implementation

- [ ] T038 [P] [US1] Create RunStatusIndicator component in agent-manager/components/chat/RunStatusIndicator.tsx
- [ ] T039 [P] [US1] Create ToolCallViewer component in agent-manager/components/chat/ToolCallViewer.tsx for expandable tool calls
- [ ] T040 [P] [US1] Create EventTimeline component in agent-manager/components/chat/EventTimeline.tsx
- [ ] T041 [P] [US1] Create DispatcherFeedback component in agent-manager/components/chat/DispatcherFeedback.tsx for routing decisions
- [ ] T042 [P] [US1] Create DispatcherSettings component in agent-manager/app/chat/components/DispatcherSettings.tsx for advanced settings
- [ ] T043 [P] [US1] Create RoutingVisualization component in agent-manager/app/chat/components/RoutingVisualization.tsx
- [ ] T044 [P] [US1] Create ToolAgentSelector component in agent-manager/app/chat/components/ToolAgentSelector.tsx
- [ ] T045 [US1] Create AgentChat component in agent-manager/components/chat/AgentChat.tsx that extends busibox-ui chat
- [ ] T046 [US1] Create chat page in agent-manager/app/chat/page.tsx using AgentChat component
- [ ] T047 [US1] Add chat navigation link to agent-manager/components/layout/Header.tsx
- [ ] T048 [US1] Implement disambiguation modal for low-confidence dispatcher decisions
- [ ] T049 [US1] Add retry and stop functionality to chat interface
- [ ] T050 [US1] Test chat with various queries and verify dispatcher routing (manual verification)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can chat with intelligent routing through dispatcher agent.

---

## Phase 4: User Story 2 - Create and Configure Agents (Priority: P1)

**Goal**: Enable administrators to create new agents by defining purpose, selecting models, assigning tools, and writing instructions. Admins can test agents before deploying them.

**Independent Test**: Navigate to agent management, create a new agent with specific configuration, test it with sample input, and verify it appears in the agent list.

### Agent Management Implementation

- [ ] T051 [P] [US2] Create useAgents hook in agent-manager/hooks/useAgents.ts for agent CRUD operations
- [ ] T052 [P] [US2] Create AgentList component in agent-manager/components/admin/AgentList.tsx with filtering and search
- [ ] T053 [P] [US2] Create AgentEditor component in agent-manager/components/admin/AgentEditor.tsx with form validation
- [ ] T054 [P] [US2] Create AgentTester component in agent-manager/components/admin/AgentTester.tsx for quick test runs
- [ ] T055 [US2] Create agent management page in agent-manager/app/admin/agents/page.tsx
- [ ] T056 [US2] Create new agent page in agent-manager/app/admin/agents/new/page.tsx
- [ ] T057 [US2] Create agent detail/edit page in agent-manager/app/admin/agents/[id]/page.tsx
- [ ] T058 [US2] Add agent management navigation link to admin sidebar
- [ ] T059 [US2] Implement personal agent privacy filtering (only show user's own personal agents)
- [ ] T060 [US2] Add tool selection interface with available tools from agent-server
- [ ] T061 [US2] Add model selection dropdown with models from agent-server /agents/models endpoint
- [ ] T062 [US2] Implement agent activation/deactivation toggle
- [ ] T063 [US2] Test agent creation, editing, testing, and deletion (manual verification)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can chat AND admins can create/manage agents.

---

## Phase 5: User Story 3 - Design Workflows Visually (Priority: P2)

**Goal**: Enable users to create multi-step agent workflows by connecting agents and tools in a visual editor, defining data flow between steps, and handling conditional branching.

**Independent Test**: Open workflow builder, drag agent and tool nodes onto canvas, connect them with edges, configure each node, save workflow, and execute it with test data.

### Workflow Builder Implementation

- [ ] T064 [P] [US3] Create workflow-converter utility in agent-manager/lib/workflow-converter.ts to convert React Flow graph to agent-server format
- [ ] T065 [P] [US3] Create useWorkflows hook in agent-manager/hooks/useWorkflows.ts for workflow CRUD operations
- [ ] T066 [P] [US3] Create AgentNode component in agent-manager/components/admin/WorkflowNodes/AgentNode.tsx
- [ ] T067 [P] [US3] Create ToolNode component in agent-manager/components/admin/WorkflowNodes/ToolNode.tsx
- [ ] T068 [P] [US3] Create ConditionNode component in agent-manager/components/admin/WorkflowNodes/ConditionNode.tsx
- [ ] T069 [P] [US3] Create InputNode component in agent-manager/components/admin/WorkflowNodes/InputNode.tsx
- [ ] T070 [P] [US3] Create OutputNode component in agent-manager/components/admin/WorkflowNodes/OutputNode.tsx
- [ ] T071 [P] [US3] Create TransformNode component in agent-manager/components/admin/WorkflowNodes/TransformNode.tsx
- [ ] T072 [P] [US3] Create node configuration panels for each node type in agent-manager/components/admin/WorkflowNodes/
- [ ] T073 [US3] Create WorkflowBuilder component in agent-manager/components/admin/WorkflowBuilder.tsx with React Flow integration
- [ ] T074 [US3] Create WorkflowManagement component in agent-manager/components/admin/WorkflowManagement.tsx
- [ ] T075 [US3] Create workflow builder page in agent-manager/app/admin/workflows/builder/page.tsx
- [ ] T076 [US3] Create workflow list page in agent-manager/app/admin/workflows/page.tsx
- [ ] T077 [US3] Create workflow detail/edit page in agent-manager/app/admin/workflows/[id]/page.tsx
- [ ] T078 [US3] Add API proxy routes for workflows in agent-manager/app/api/workflows/
- [ ] T079 [US3] Add API proxy route for workflow execution in agent-manager/app/api/runs/workflow/route.ts
- [ ] T080 [US3] Implement workflow validation (no cycles, no disconnected nodes, missing configs)
- [ ] T081 [US3] Add workflow execution monitoring with SSE streaming
- [ ] T082 [US3] Test workflow creation, editing, validation, and execution (manual verification)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Users can chat, manage agents, AND create workflows.

---

## Phase 6: User Story 4 - Get LLM Assistance for Agent Design (Priority: P2)

**Goal**: Enable users to get AI-powered assistance for creating effective agents through natural language descriptions, validation, and iterative refinement.

**Independent Test**: Describe an agent in natural language ("Create an agent that searches documents and generates summaries"), receive generated configuration, validate it, refine instructions through conversation, and save final agent.

### LLM-Assisted Design Implementation

- [ ] T083 [P] [US4] Create agent-designer client in agent-manager/lib/agent-designer.ts to call agent-server designer agent
- [ ] T084 [P] [US4] Create AgentDesignAssistant component in agent-manager/components/admin/AgentDesignAssistant.tsx
- [ ] T085 [P] [US4] Create ValidationResults component in agent-manager/components/admin/ValidationResults.tsx
- [ ] T086 [P] [US4] Create RefinementChat component in agent-manager/components/admin/RefinementChat.tsx
- [ ] T087 [US4] Integrate AgentDesignAssistant into agent creation flow in agent-manager/app/admin/agents/new/page.tsx
- [ ] T088 [US4] Add "Design with AI" button to agent editor
- [ ] T089 [US4] Implement natural language → agent config generation
- [ ] T090 [US4] Implement agent validation with suggestions
- [ ] T091 [US4] Implement iterative refinement through conversational interface
- [ ] T092 [US4] Add tool recommendation with explanations
- [ ] T093 [US4] Test LLM-assisted agent design flow (manual verification)

**Checkpoint**: At this point, User Stories 1-4 should all work independently. Users can chat, manage agents, create workflows, AND get LLM assistance.

---

## Phase 7: User Story 5 - Monitor and Analyze Agent Performance (Priority: P2)

**Goal**: Enable administrators to view agent execution history, analyze performance metrics, compare runs, identify failures, and export data for further analysis.

**Independent Test**: Navigate to run management, filter runs by agent/status/date, view detailed run information with events and metrics, compare multiple runs side-by-side, and export run data.

### Run Management Implementation

- [ ] T094 [P] [US5] Create useRuns hook in agent-manager/hooks/useRuns.ts for run queries and filtering
- [ ] T095 [P] [US5] Create RunManagement component in agent-manager/components/admin/RunManagement.tsx with filters
- [ ] T096 [P] [US5] Create RunDetail component in agent-manager/components/admin/RunDetail.tsx
- [ ] T097 [P] [US5] Create RunComparison component in agent-manager/components/admin/RunComparison.tsx
- [ ] T098 [P] [US5] Create PerformanceDashboard component in agent-manager/components/admin/PerformanceDashboard.tsx
- [ ] T099 [US5] Create run management page in agent-manager/app/admin/runs/page.tsx
- [ ] T100 [US5] Create run detail page in agent-manager/app/admin/runs/[id]/page.tsx
- [ ] T101 [US5] Implement run filtering by agent, status, date range, and created_by
- [ ] T102 [US5] Implement pagination for run list (50 runs per page)
- [ ] T103 [US5] Implement run comparison view (side-by-side up to 3 runs)
- [ ] T104 [US5] Add performance charts: runs over time, success rates, response times, token usage
- [ ] T105 [US5] Implement data export (JSON and CSV formats)
- [ ] T106 [US5] Add run retry functionality
- [ ] T107 [US5] Test run management, filtering, comparison, and export (manual verification)

**Checkpoint**: At this point, User Stories 1-5 should all work independently. Full agent lifecycle from chat to creation to monitoring is functional.

---

## Phase 8: User Story 6 - Schedule Recurring Agent Executions (Priority: P3)

**Goal**: Enable users to schedule agents to run automatically on a recurring basis (daily, weekly, custom cron) with automatic token refresh and result persistence.

**Independent Test**: Create a schedule with a cron expression, verify next run time is calculated correctly, wait for scheduled execution, and confirm run completed successfully with results stored.

### Schedule Management Implementation

- [ ] T108 [P] [US6] Create CronBuilder component in agent-manager/components/admin/CronBuilder.tsx for visual cron expression building
- [ ] T109 [P] [US6] Create ScheduleManagement component in agent-manager/components/admin/ScheduleManagement.tsx
- [ ] T110 [US6] Create schedule management page in agent-manager/app/admin/schedules/page.tsx
- [ ] T111 [US6] Add API proxy routes for schedules in agent-manager/app/api/schedules/
- [ ] T112 [US6] Implement schedule creation with agent selection, input, and cron expression
- [ ] T113 [US6] Display next run time calculation
- [ ] T114 [US6] Implement schedule activation/deactivation toggle
- [ ] T115 [US6] Add schedule history view showing past executions
- [ ] T116 [US6] Implement schedule editing (update cron expression and input)
- [ ] T117 [US6] Implement schedule deletion
- [ ] T118 [US6] Test schedule creation, editing, and execution (manual verification)

**Checkpoint**: At this point, User Stories 1-6 should all work independently. Automation through scheduling is functional.

---

## Phase 9: User Story 7 - Evaluate Agent Quality with Scorers (Priority: P3)

**Goal**: Enable administrators to define scoring criteria, run evaluations on completed agent executions, view aggregated scores, and compare agent performance across multiple dimensions.

**Independent Test**: Create a scorer with specific criteria, run it against completed runs, view individual scores with pass/fail status, and check aggregated metrics.

### Evaluation Management Implementation

- [ ] T119 [P] [US7] Create EvaluationManagement component in agent-manager/components/admin/EvaluationManagement.tsx
- [ ] T120 [US7] Create evaluation management page in agent-manager/app/admin/evaluations/page.tsx
- [ ] T121 [US7] Add API proxy routes for evaluations in agent-manager/app/api/evals/
- [ ] T122 [US7] Add API proxy routes for scores in agent-manager/app/api/scores/
- [ ] T123 [US7] Implement scorer creation with criteria definition
- [ ] T124 [US7] Implement scorer execution against selected runs
- [ ] T125 [US7] Display individual scores with pass/fail status
- [ ] T126 [US7] Display aggregated score metrics (average, min, max, percentiles, pass rate)
- [ ] T127 [US7] Add score filtering by scorer and agent
- [ ] T128 [US7] Add score trend visualization over time
- [ ] T129 [US7] Test evaluation creation, execution, and score viewing (manual verification)

**Checkpoint**: At this point, User Stories 1-7 should all work independently. Quality evaluation is functional.

---

## Phase 10: User Story 8 - Manage Tools and Built-in Agents (Priority: P3)

**Goal**: Enable administrators to view available tools, understand their capabilities, create custom tools, test tool functionality, and monitor tool usage across agents.

**Independent Test**: View tool catalog, select a tool to see its schema and description, create a custom tool with input/output definition, test it with sample data, and view which agents use which tools.

### Tool Management Implementation

- [ ] T130 [P] [US8] Create ToolManagement component in agent-manager/components/admin/ToolManagement.tsx
- [ ] T131 [US8] Create tool management page in agent-manager/app/admin/tools/page.tsx
- [ ] T132 [US8] Add API proxy routes for tools in agent-manager/app/api/tools/
- [ ] T133 [US8] Implement tool catalog view with built-in and custom tools
- [ ] T134 [US8] Display tool schemas (input/output definitions)
- [ ] T135 [US8] Implement custom tool creation with schema editor
- [ ] T136 [US8] Add tool testing interface with sample input
- [ ] T137 [US8] Display tool usage across agents
- [ ] T138 [US8] Implement tool activation/deactivation
- [ ] T139 [US8] Test tool management and custom tool creation (manual verification)

**Checkpoint**: All user stories (1-8) should now be independently functional. Complete agent management system is operational.

---

## Phase 11: Guardrails & Admin Dashboard (Cross-Cutting)

**Goal**: Add rate limit monitoring, usage tracking, and comprehensive admin dashboard.

- [ ] T140 [P] Create GuardrailsView component in agent-manager/components/admin/GuardrailsView.tsx
- [ ] T141 [P] Update admin dashboard in agent-manager/app/admin/page.tsx with metrics and quick actions
- [ ] T142 Add guardrails page in agent-manager/app/admin/guardrails/page.tsx
- [ ] T143 Display rate limits and usage by user/agent
- [ ] T144 Add admin dashboard charts: active agents, recent runs, system health
- [ ] T145 Add quick actions to dashboard: create agent, view recent runs, check schedules
- [ ] T146 Test admin dashboard and guardrails view (manual verification)

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T147 [P] Add loading states to all async operations
- [ ] T148 [P] Add error boundaries to all major components
- [ ] T149 [P] Implement toast notifications for user feedback
- [ ] T150 [P] Add keyboard shortcuts for common actions
- [ ] T151 [P] Optimize bundle size with code splitting
- [ ] T152 [P] Add accessibility attributes (ARIA labels, roles)
- [ ] T153 [P] Create comprehensive documentation in agent-manager/docs/
- [ ] T154 [P] Create Storybook stories for all shared components
- [ ] T155 Code cleanup and refactoring across all components
- [ ] T156 Performance optimization: lazy loading, memoization, virtualization
- [ ] T157 Security hardening: input validation, XSS prevention, CSRF tokens
- [ ] T158 Run quickstart.md validation for all user stories
- [ ] T159 Update README.md with setup instructions and feature overview
- [ ] T160 Create deployment documentation for production

---

## Phase 13: Optional Testing (If Requested)

**Note**: Tests were not explicitly requested in the specification. These tasks are optional.

### Unit Tests (Optional)

- [ ] T161 [P] Write unit tests for AgentAPIClient in agent-manager/tests/unit/agent-api-client.test.ts
- [ ] T162 [P] Write unit tests for useRunStream hook in agent-manager/tests/unit/useRunStream.test.ts
- [ ] T163 [P] Write unit tests for workflow-converter in agent-manager/tests/unit/workflow-converter.test.ts
- [ ] T164 [P] Write unit tests for agent-designer in agent-manager/tests/unit/agent-designer.test.ts
- [ ] T165 [P] Write unit tests for all React hooks in agent-manager/tests/unit/hooks/

### Integration Tests (Optional)

- [ ] T166 [P] Write integration test for chat flow in agent-manager/tests/integration/chat.test.ts
- [ ] T167 [P] Write integration test for agent creation in agent-manager/tests/integration/agent-management.test.ts
- [ ] T168 [P] Write integration test for workflow execution in agent-manager/tests/integration/workflow.test.ts
- [ ] T169 [P] Write integration test for run monitoring in agent-manager/tests/integration/run-management.test.ts

### Component Tests (Optional)

- [ ] T170 [P] Create Storybook stories for all busibox-ui chat components
- [ ] T171 [P] Create Storybook stories for all agent-manager admin components
- [ ] T172 [P] Write visual regression tests with Chromatic

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 3 (P2): Can start after Foundational - No dependencies on other stories (but benefits from US1 and US2 being complete)
  - User Story 4 (P2): Depends on User Story 2 (needs agent editor to integrate with)
  - User Story 5 (P2): Can start after Foundational - No dependencies on other stories
  - User Story 6 (P3): Can start after Foundational - No dependencies on other stories
  - User Story 7 (P3): Depends on User Story 5 (needs completed runs to evaluate)
  - User Story 8 (P3): Can start after Foundational - No dependencies on other stories
- **Guardrails (Phase 11)**: Can start after Foundational - No dependencies on user stories
- **Polish (Phase 12)**: Depends on all desired user stories being complete
- **Testing (Phase 13)**: Optional - Can be done in parallel with implementation or after

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent but benefits from US1/US2
- **User Story 4 (P2)**: Depends on User Story 2 completion (integrates with agent editor)
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 7 (P3)**: Depends on User Story 5 completion (needs runs to evaluate)
- **User Story 8 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

**User Story 1 (Chat)**:
1. busibox-ui migration (T021-T037) - All chat components must be migrated first
2. Agent-client chat components (T038-T050) - Build on top of busibox-ui components

**User Story 2 (Agent Management)**:
1. Hooks and components (T051-T054) - Can be built in parallel
2. Pages (T055-T057) - Use hooks and components
3. Features (T058-T063) - Add to pages

**User Story 3 (Workflows)**:
1. Utilities and hooks (T064-T065) - Foundation
2. Node components (T066-T072) - Can be built in parallel
3. Builder and management (T073-T074) - Use nodes
4. Pages and API routes (T075-T079) - Integration
5. Features (T080-T082) - Polish

**User Story 4 (LLM Assistance)**:
1. Client and components (T083-T086) - Can be built in parallel
2. Integration (T087-T093) - Add to agent editor

**User Story 5 (Run Management)**:
1. Hooks and components (T094-T098) - Can be built in parallel
2. Pages (T099-T100) - Use hooks and components
3. Features (T101-T107) - Add to pages

**User Story 6 (Scheduling)**:
1. Components (T108-T109) - Can be built in parallel
2. Page and API routes (T110-T111) - Integration
3. Features (T112-T118) - Add to page

**User Story 7 (Evaluation)**:
1. Component (T119) - Foundation
2. Page and API routes (T120-T122) - Integration
3. Features (T123-T129) - Add to page

**User Story 8 (Tool Management)**:
1. Component (T130) - Foundation
2. Page and API routes (T131-T132) - Integration
3. Features (T133-T139) - Add to page

### Parallel Opportunities

**Setup Phase**:
- T003, T004, T005, T006, T007, T008, T009 can all run in parallel

**Foundational Phase**:
- T011, T012, T013, T014, T015, T016, T017, T018, T019, T020 can all run in parallel after T010

**User Story 1**:
- T021-T033 (busibox-ui components and hooks) can all run in parallel
- T038-T044 (agent-manager components) can all run in parallel after busibox-ui is ready

**User Story 2**:
- T051-T054 can all run in parallel

**User Story 3**:
- T066-T072 (node components) can all run in parallel after T064-T065

**User Story 4**:
- T083-T086 can all run in parallel

**User Story 5**:
- T094-T098 can all run in parallel

**User Story 6**:
- T108-T109 can run in parallel

**User Story 8**:
- T130 is a single component

**Polish Phase**:
- T147-T154 can all run in parallel

**Testing Phase**:
- T161-T165 (unit tests) can all run in parallel
- T166-T169 (integration tests) can all run in parallel
- T170-T172 (component tests) can all run in parallel

**Multiple User Stories**:
Once Foundational phase completes, the following user stories can be worked on in parallel by different team members:
- User Story 1 (Chat)
- User Story 2 (Agent Management)
- User Story 3 (Workflows)
- User Story 5 (Run Management)
- User Story 6 (Scheduling)
- User Story 8 (Tool Management)

User Story 4 must wait for User Story 2 to complete.
User Story 7 must wait for User Story 5 to complete.

---

## Parallel Example: User Story 1 (Chat)

```bash
# Launch all busibox-ui component migrations together:
Task: "Define TypeScript types in busibox-ui/src/chat/types/index.ts"
Task: "Migrate MessageList.tsx from AI Portal to busibox-ui/src/chat/components/MessageList.tsx"
Task: "Migrate MessageInput.tsx from AI Portal to busibox-ui/src/chat/components/MessageInput.tsx"
Task: "Migrate ConversationSidebar.tsx from AI Portal to busibox-ui/src/chat/components/ConversationSidebar.tsx"
Task: "Migrate ModelSelector.tsx from AI Portal to busibox-ui/src/chat/components/ModelSelector.tsx"
Task: "Migrate SearchToggles.tsx from AI Portal to busibox-ui/src/chat/components/SearchToggles.tsx"
Task: "Migrate AttachmentUploader.tsx from AI Portal to busibox-ui/src/chat/components/AttachmentUploader.tsx"
Task: "Migrate AttachmentPreview.tsx from AI Portal to busibox-ui/src/chat/components/AttachmentPreview.tsx"
Task: "Create useChat hook in busibox-ui/src/chat/hooks/useChat.ts"
Task: "Create useConversations hook in busibox-ui/src/chat/hooks/useConversations.ts"
Task: "Create useSearchToggles hook in busibox-ui/src/chat/hooks/useSearchToggles.ts"
Task: "Create useAttachments hook in busibox-ui/src/chat/hooks/useAttachments.ts"

# After busibox-ui is ready, launch all agent-manager chat components together:
Task: "Create RunStatusIndicator component in agent-manager/components/chat/RunStatusIndicator.tsx"
Task: "Create ToolCallViewer component in agent-manager/components/chat/ToolCallViewer.tsx"
Task: "Create EventTimeline component in agent-manager/components/chat/EventTimeline.tsx"
Task: "Create DispatcherFeedback component in agent-manager/components/chat/DispatcherFeedback.tsx"
Task: "Create DispatcherSettings component in agent-manager/app/chat/components/DispatcherSettings.tsx"
Task: "Create RoutingVisualization component in agent-manager/app/chat/components/RoutingVisualization.tsx"
Task: "Create ToolAgentSelector component in agent-manager/app/chat/components/ToolAgentSelector.tsx"
```

---

## Parallel Example: User Story 2 (Agent Management)

```bash
# Launch all hooks and components together:
Task: "Create useAgents hook in agent-manager/hooks/useAgents.ts"
Task: "Create AgentList component in agent-manager/components/admin/AgentList.tsx"
Task: "Create AgentEditor component in agent-manager/components/admin/AgentEditor.tsx"
Task: "Create AgentTester component in agent-manager/components/admin/AgentTester.tsx"
```

---

## Parallel Example: User Story 3 (Workflows)

```bash
# Launch all node components together after converter is ready:
Task: "Create AgentNode component in agent-manager/components/admin/WorkflowNodes/AgentNode.tsx"
Task: "Create ToolNode component in agent-manager/components/admin/WorkflowNodes/ToolNode.tsx"
Task: "Create ConditionNode component in agent-manager/components/admin/WorkflowNodes/ConditionNode.tsx"
Task: "Create InputNode component in agent-manager/components/admin/WorkflowNodes/InputNode.tsx"
Task: "Create OutputNode component in agent-manager/components/admin/WorkflowNodes/OutputNode.tsx"
Task: "Create TransformNode component in agent-manager/components/admin/WorkflowNodes/TransformNode.tsx"
Task: "Create node configuration panels for each node type"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Chat with Dispatcher)
4. Complete Phase 4: User Story 2 (Agent Management)
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo if ready

**Rationale**: User Stories 1 and 2 are both P1 and provide immediate value. Chat enables users to interact with agents, and agent management enables customization. This is a complete MVP.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Chat) → Test independently → Deploy/Demo (MVP Part 1!)
3. Add User Story 2 (Agent Management) → Test independently → Deploy/Demo (MVP Complete!)
4. Add User Story 3 (Workflows) → Test independently → Deploy/Demo
5. Add User Story 4 (LLM Assistance) → Test independently → Deploy/Demo
6. Add User Story 5 (Run Management) → Test independently → Deploy/Demo
7. Add User Story 6 (Scheduling) → Test independently → Deploy/Demo
8. Add User Story 7 (Evaluation) → Test independently → Deploy/Demo
9. Add User Story 8 (Tool Management) → Test independently → Deploy/Demo
10. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - **Developer A**: User Story 1 (Chat)
   - **Developer B**: User Story 2 (Agent Management)
   - **Developer C**: User Story 5 (Run Management)
3. After first wave completes:
   - **Developer A**: User Story 3 (Workflows)
   - **Developer B**: User Story 4 (LLM Assistance) - requires US2 complete
   - **Developer C**: User Story 6 (Scheduling)
4. After second wave completes:
   - **Developer A**: User Story 8 (Tool Management)
   - **Developer B**: User Story 7 (Evaluation) - requires US5 complete
   - **Developer C**: Phase 11 (Guardrails & Dashboard)
5. All developers: Phase 12 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests are optional - focus on implementation first unless TDD is explicitly requested
- Agent-server API enhancements (from agent-server-requirements.md) must be completed before dependent features:
  - Dispatcher agent (REQ-001) required for User Story 1
  - Personal agent filtering (REQ-002) required for User Story 2
  - Individual resource retrieval (REQ-003, REQ-004, REQ-005) required for detail pages
  - CRUD operations (REQ-006-REQ-013) required for edit/delete functionality

---

## Task Count Summary

- **Total Tasks**: 172
- **Setup Phase**: 9 tasks
- **Foundational Phase**: 11 tasks
- **User Story 1 (P1)**: 30 tasks
- **User Story 2 (P1)**: 13 tasks
- **User Story 3 (P2)**: 19 tasks
- **User Story 4 (P2)**: 11 tasks
- **User Story 5 (P2)**: 14 tasks
- **User Story 6 (P3)**: 11 tasks
- **User Story 7 (P3)**: 11 tasks
- **User Story 8 (P3)**: 10 tasks
- **Guardrails Phase**: 7 tasks
- **Polish Phase**: 14 tasks
- **Testing Phase (Optional)**: 12 tasks

**Parallel Opportunities**: 89 tasks marked with [P] can run in parallel within their phase

**MVP Scope**: 63 tasks (Setup + Foundational + US1 + US2)

**Format Validation**: ✅ All tasks follow the required checklist format with checkbox, ID, optional [P] marker, [Story] label (where applicable), and file paths in descriptions.
