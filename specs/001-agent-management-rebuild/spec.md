# Feature Specification: Agent Management System Rebuild

**Feature Branch**: `001-agent-management-rebuild`  
**Created**: 2025-01-11  
**Status**: Draft  
**Input**: User description: "Rebuild agent-client to fully manage agents via Python agent-server API with chat components in busibox-ui, visual workflow builder, LLM-assisted design, and comprehensive admin interface"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Intelligent Chat with Dispatcher Agent (Priority: P1)

Users need a natural chat interface that intelligently routes their queries through a dispatcher agent. The dispatcher analyzes the query and user's available tools/agents (document search, web search, personal agents, etc.) to determine the best execution path. Users can chat naturally with optional file attachments, and the system automatically decides which capabilities to use.

**Why this priority**: This is the core user interaction pattern. The dispatcher-based architecture provides intelligent, context-aware responses without requiring users to manually select agents or tools. This establishes the foundation for all other features and demonstrates the power of agent orchestration.

**Independent Test**: Can be fully tested by sending various queries (questions, document analysis requests, web research) and verifying the dispatcher routes to appropriate agents/tools automatically. Users can also explicitly configure tool/agent selection through advanced settings. Delivers immediate value by enabling intelligent, hands-free agent interaction.

**Acceptance Scenarios**:

1. **Given** a user is on the chat page, **When** they send a natural language query, **Then** the dispatcher agent analyzes the query and automatically routes to appropriate tools/agents (doc search, web search, personal agents) with results streaming in real-time
2. **Given** a user attaches files to their message, **When** they send the query, **Then** the dispatcher considers the file context and routes to agents capable of document analysis
3. **Given** a dispatcher agent is executing, **When** it calls multiple tools/agents (e.g., doc search + personal agent), **Then** the user sees each tool/agent call with expandable details showing inputs and outputs
4. **Given** a user wants explicit control, **When** they open advanced settings, **Then** they can enable/disable specific tools (doc search, web search) and select specific personal agents to use
5. **Given** a dispatcher execution completes, **When** the user views the conversation, **Then** they can see the full routing decision, event timeline with timestamps, and performance metrics
6. **Given** a user wants to retry a response, **When** they click retry on a message, **Then** the dispatcher re-evaluates and re-executes with the same input
7. **Given** a dispatcher execution is in progress, **When** the user clicks stop, **Then** the execution terminates gracefully and shows partial results from completed steps

---

### User Story 2 - Create and Configure Agents (Priority: P1)

Administrators need to create new agents by defining their purpose, selecting models, assigning tools, and writing instructions. They should be able to test agents before deploying them.

**Why this priority**: Agent creation is essential for customizing the system to specific use cases. Without this, users are limited to built-in agents only.

**Independent Test**: Can be fully tested by navigating to agent management, creating a new agent with specific configuration, testing it with sample input, and verifying it appears in the agent list. Delivers value by enabling custom agent creation.

**Acceptance Scenarios**:

1. **Given** an admin is on the agent management page, **When** they click "Create Agent", **Then** they see a form with fields for name, description, model, instructions, and tool selection
2. **Given** an admin is creating an agent, **When** they select tools from the available list, **Then** the agent can use those tools during execution
3. **Given** an admin has configured an agent, **When** they click "Test", **Then** they can run a quick test with sample input and see results without saving
4. **Given** an admin has tested an agent successfully, **When** they save it, **Then** the agent appears in the active agents list and is available for use
5. **Given** an admin wants to modify an existing agent, **When** they edit and save changes, **Then** the updated configuration takes effect immediately

---

### User Story 3 - Design Workflows Visually (Priority: P2)

Users need to create multi-step agent workflows by connecting agents and tools in a visual editor, defining data flow between steps, and handling conditional branching.

**Why this priority**: Workflows enable complex automation scenarios that single agents cannot handle. This unlocks advanced use cases but builds on basic agent functionality.

**Independent Test**: Can be fully tested by opening the workflow builder, dragging agent and tool nodes onto the canvas, connecting them with edges, configuring each node, saving the workflow, and executing it with test data. Delivers value by enabling multi-step automation.

**Acceptance Scenarios**:

1. **Given** a user opens the workflow builder, **When** they drag an agent node onto the canvas, **Then** they can configure which agent to execute and what input to provide
2. **Given** a user has multiple nodes on the canvas, **When** they connect them with edges, **Then** the output of one step becomes the input to the next
3. **Given** a user adds a condition node, **When** they configure the condition logic, **Then** the workflow branches based on the condition result
4. **Given** a user has designed a workflow, **When** they click validate, **Then** the system checks for errors (disconnected nodes, missing configurations, circular dependencies)
5. **Given** a user has a valid workflow, **When** they save and execute it, **Then** each step runs in order and the results are stored with full event history

---

### User Story 4 - Get LLM Assistance for Agent Design (Priority: P2)

Users need help creating effective agents through AI-powered assistance that generates configurations from natural language, validates agent setups, suggests improvements, and recommends appropriate tools.

**Why this priority**: LLM assistance dramatically reduces the learning curve for agent creation and improves agent quality. However, manual agent creation must work first.

**Independent Test**: Can be fully tested by describing an agent in natural language ("Create an agent that searches documents and generates summaries"), receiving a generated configuration, validating it, refining the instructions through conversation, and saving the final agent. Delivers value by making agent creation accessible to non-technical users.

**Acceptance Scenarios**:

1. **Given** a user is creating an agent, **When** they describe the agent's purpose in natural language, **Then** the system generates a complete agent configuration including name, instructions, model selection, and tool recommendations
2. **Given** a user has a generated agent configuration, **When** they request validation, **Then** the system identifies potential issues and suggests improvements
3. **Given** a user wants to refine agent instructions, **When** they provide feedback in a conversational interface, **Then** the system iteratively improves the instructions based on the feedback
4. **Given** a user describes an agent's tasks, **When** the system recommends tools, **Then** it explains why each tool is appropriate for those tasks
5. **Given** a user accepts a generated configuration, **When** they save it, **Then** the agent is created with all recommended settings and is ready to use

---

### User Story 5 - Monitor and Analyze Agent Performance (Priority: P2)

Administrators need to view agent execution history, analyze performance metrics, compare runs, identify failures, and export data for further analysis.

**Why this priority**: Performance monitoring is essential for production use but can be added after basic agent execution works. It enables optimization and troubleshooting.

**Independent Test**: Can be fully tested by navigating to run management, filtering runs by agent/status/date, viewing detailed run information with events and metrics, comparing multiple runs side-by-side, and exporting run data. Delivers value by enabling performance optimization and debugging.

**Acceptance Scenarios**:

1. **Given** an admin is on the run management page, **When** they filter by agent and date range, **Then** they see a paginated list of matching runs with status, duration, and timestamp
2. **Given** an admin selects a run, **When** they view details, **Then** they see complete input/output, event timeline, tool calls, performance metrics, and any errors
3. **Given** an admin wants to compare runs, **When** they select multiple runs, **Then** they see side-by-side comparison of inputs, outputs, durations, and tool usage
4. **Given** an admin views the dashboard, **When** they check performance charts, **Then** they see runs over time, success rates, average response times, and token usage trends
5. **Given** an admin needs to export data, **When** they select runs and click export, **Then** they receive a JSON or CSV file with complete run information

---

### User Story 6 - Schedule Recurring Agent Executions (Priority: P3)

Users need to schedule agents to run automatically on a recurring basis (daily, weekly, custom cron) with automatic token refresh and result persistence.

**Why this priority**: Scheduling enables automation but is not required for basic agent functionality. It's valuable for production workflows but can be added later.

**Independent Test**: Can be fully tested by creating a schedule with a cron expression, verifying the next run time is calculated correctly, waiting for the scheduled execution, and confirming the run completed successfully with results stored. Delivers value by enabling hands-off automation.

**Acceptance Scenarios**:

1. **Given** a user is on schedule management, **When** they create a new schedule with agent, input, and cron expression, **Then** the system calculates and displays the next run time
2. **Given** a schedule is active, **When** the scheduled time arrives, **Then** the agent executes automatically with fresh authentication tokens
3. **Given** a scheduled run completes, **When** the user views the schedule history, **Then** they see all past executions with status and results
4. **Given** a user wants to pause automation, **When** they disable a schedule, **Then** no further automatic executions occur until re-enabled
5. **Given** a user needs to modify timing, **When** they edit the cron expression, **Then** the next run time updates immediately

---

### User Story 7 - Evaluate Agent Quality with Scorers (Priority: P3)

Administrators need to define scoring criteria, run evaluations on completed agent executions, view aggregated scores, and compare agent performance across multiple dimensions.

**Why this priority**: Evaluation enables systematic quality improvement but requires completed runs to evaluate. It's valuable for optimization but not essential for initial deployment.

**Independent Test**: Can be fully tested by creating a scorer with specific criteria, running it against completed runs, viewing individual scores with pass/fail status, and checking aggregated metrics. Delivers value by enabling data-driven agent improvement.

**Acceptance Scenarios**:

1. **Given** an admin creates a scorer, **When** they define evaluation criteria, **Then** the scorer can assess runs based on those criteria
2. **Given** an admin has completed runs, **When** they execute a scorer, **Then** each run receives a score between 0 and 1 with pass/fail status
3. **Given** multiple runs have been scored, **When** the admin views aggregates, **Then** they see average, min, max, and percentile scores
4. **Given** an admin wants to compare agents, **When** they view scores by agent, **Then** they can identify which agents perform best on specific criteria
5. **Given** an admin needs to track quality over time, **When** they view score trends, **Then** they see how agent performance changes across time periods

---

### User Story 8 - Manage Tools and Built-in Agents (Priority: P3)

Administrators need to view available tools, understand their capabilities, create custom tools, test tool functionality, and monitor tool usage across agents.

**Why this priority**: Tool management is important for extensibility but built-in tools work out of the box. Custom tool creation is advanced functionality that can be added later.

**Independent Test**: Can be fully tested by viewing the tool catalog, selecting a tool to see its schema and description, creating a custom tool with input/output definition, testing it with sample data, and viewing which agents use which tools. Delivers value by enabling system extensibility.

**Acceptance Scenarios**:

1. **Given** an admin is on tool management, **When** they view the tool catalog, **Then** they see all built-in tools (search, RAG, ingest, chat) with descriptions and schemas
2. **Given** an admin wants to create a custom tool, **When** they define the tool schema and implementation, **Then** the tool becomes available for agent assignment
3. **Given** an admin has created a custom tool, **When** they test it with sample input, **Then** they see the output and any errors before deploying
4. **Given** an admin views tool usage, **When** they check analytics, **Then** they see which tools are used most frequently and by which agents
5. **Given** an admin needs to update a tool, **When** they modify the schema or implementation, **Then** all agents using that tool receive the updates

---

### Edge Cases

- When the dispatcher agent cannot determine appropriate routing for a query, the system displays a disambiguation UI where users select their intended capability from available options
- How does the system handle cases where the dispatcher routes to an agent/tool the user doesn't have permission for?
- What happens when a dispatcher routes to multiple agents and one fails?
- How does the chat interface display nested agent calls (dispatcher → personal agent → tool)?
- What happens when an agent execution exceeds the tier timeout limit (simple: 30s, complex: 5min, batch: 30min)?
- How does the system handle SSE connection drops during long-running agent executions?
- What happens when a user tries to create an agent with tools they don't have permission to use?
- How does the workflow builder handle circular dependencies in workflow definitions?
- What happens when the agent-server is unavailable during agent creation or execution?
- What happens when a scheduled run fails due to authentication token expiration?
- How does the LLM assistant handle ambiguous or contradictory agent descriptions?
- When a workflow step fails midway through execution, users can choose to either resume from the failed step (preserving completed outputs) or restart the entire workflow from the beginning
- How does the system prevent rate limit exhaustion by poorly designed agents?
- When advanced settings are configured, the dispatcher honors user choices and only routes to enabled tools/agents, even if disabled options would be optimal for the query

## Requirements *(mandatory)*

### Functional Requirements

**Component Reusability**:
- **FR-001**: System MUST extract all chat-related components (MessageList, MessageInput, ConversationSidebar, AttachmentUploader, AttachmentPreview) into the busibox-ui shared library
- **FR-002**: Chat components MUST accept API endpoints and callbacks as props rather than hardcoding them
- **FR-003**: AI Portal MUST continue to function correctly after migrating to busibox-ui chat components
- **FR-004**: Chat components MUST support both direct LLM integration (AI Portal) and agent-server routing (Agent Client) through configurable API handlers

**Dispatcher Agent & Chat Routing**:
- **FR-005**: System MUST route all chat messages through a dispatcher agent that analyzes queries and determines appropriate tools/agents to use
- **FR-006**: Dispatcher agent MUST have access to user's available tools (document search, web search) and personal agents
- **FR-007**: Dispatcher agent MUST make intelligent routing decisions based on query content, attached files, and conversation context
- **FR-008**: System MUST provide advanced settings UI where users can explicitly enable/disable tools and select specific agents
- **FR-009**: System MUST default to automatic tool/agent selection when advanced settings are not configured
- **FR-010**: System MUST display dispatcher routing decisions in the chat interface (which tools/agents were selected and why)
- **FR-010a**: When dispatcher cannot confidently determine routing, system MUST display disambiguation UI with available capability options for user selection
- **FR-010b**: When user has configured advanced settings, dispatcher MUST honor those settings and only route to enabled tools/agents, even if disabled options would be optimal

**Agent Management**:
- **FR-011**: System MUST allow administrators to create new agents with name, description, model selection, instructions, tool assignments, and scopes
- **FR-012**: System MUST allow administrators to edit existing custom agents (built-in agents are read-only)
- **FR-013**: System MUST allow administrators to delete custom agents (built-in agents cannot be deleted)
- **FR-014**: System MUST display both built-in agents (hardcoded in agent-server) and custom agents (from database) in a unified list
- **FR-015**: System MUST provide a test interface for agents that allows quick execution with sample input before saving
- **FR-016**: System MUST validate agent configurations before saving (required fields, valid model names, valid tool references)
- **FR-017**: Personal agents created by users MUST be automatically available to the dispatcher for that user

**Agent Execution & Monitoring**:
- **FR-018**: System MUST execute all agents (including dispatcher) via the Python agent-server API at the configured endpoint
- **FR-019**: System MUST stream agent execution status and events in real-time using Server-Sent Events (SSE)
- **FR-020**: System MUST display run status indicators (pending, running, succeeded, failed, timeout) with appropriate visual styling
- **FR-021**: System MUST display tool calls made by agents with expandable details showing inputs and outputs
- **FR-022**: System MUST display nested agent calls (dispatcher calling other agents) with proper hierarchy visualization
- **FR-023**: System MUST display a chronological event timeline for each run showing all status transitions and tool executions
- **FR-024**: System MUST allow users to stop running agent executions gracefully
- **FR-025**: System MUST allow users to retry failed executions with the same input

**Run History & Analytics**:
- **FR-026**: System MUST maintain a searchable history of all agent runs (including dispatcher runs) with filters for agent, status, date range, and user
- **FR-027**: System MUST display detailed run information including input, output, events, routing decisions, performance metrics, and errors
- **FR-028**: System MUST allow side-by-side comparison of multiple runs
- **FR-029**: System MUST display performance dashboards with charts for runs over time, success rates, response times, and token usage
- **FR-030**: System MUST allow exporting run data in JSON and CSV formats

**Workflow Builder**:
- **FR-031**: System MUST provide a visual workflow editor using drag-and-drop node placement
- **FR-032**: System MUST support workflow node types: Agent, Tool, Condition, Input, Output, and Transform
- **FR-033**: System MUST allow users to connect nodes with edges to define execution flow
- **FR-034**: System MUST provide configuration panels for each node type to set parameters
- **FR-035**: System MUST validate workflows before execution (no disconnected nodes, no circular dependencies, all required configurations present)
- **FR-036**: System MUST convert visual workflow graphs to agent-server workflow definition format
- **FR-037**: System MUST execute workflows with proper step sequencing and data passing between steps
- **FR-038**: System MUST persist workflow definitions for reuse and modification
- **FR-038a**: When retrying a failed workflow, system MUST offer user choice to either resume from failed step (preserving completed outputs) or restart from beginning

**LLM-Assisted Design**:
- **FR-039**: System MUST generate agent configurations from natural language descriptions
- **FR-040**: System MUST validate agent configurations and provide specific suggestions for improvement
- **FR-041**: System MUST support iterative refinement of agent instructions through conversational feedback
- **FR-042**: System MUST recommend appropriate tools based on agent task descriptions with explanations
- **FR-043**: System MUST stream LLM responses for real-time feedback during agent design

**Scheduling**:
- **FR-044**: System MUST allow users to schedule agent runs with cron expressions
- **FR-045**: System MUST display the next scheduled run time for each schedule
- **FR-046**: System MUST automatically refresh authentication tokens before scheduled executions
- **FR-047**: System MUST persist results from scheduled runs with full event history
- **FR-048**: System MUST allow users to pause, resume, edit, and delete schedules
- **FR-049**: System MUST display schedule execution history with status and results

**Evaluation & Scoring**:
- **FR-050**: System MUST allow administrators to create scorer definitions with evaluation criteria
- **FR-051**: System MUST execute scorers against completed runs to generate scores (0-1 scale)
- **FR-052**: System MUST display individual run scores with pass/fail status and details
- **FR-053**: System MUST calculate and display aggregated score metrics (average, min, max, percentiles)
- **FR-054**: System MUST allow filtering score data by agent, scorer, and time period

**Tool Management**:
- **FR-055**: System MUST display all available tools (built-in and custom) with descriptions and schemas
- **FR-056**: System MUST allow administrators to create custom tools with schema definitions and Python function implementations
- **FR-056a**: Custom tool implementations MUST be Python functions that execute in the agent-server environment
- **FR-057**: System MUST allow administrators to test tools with sample input before deployment
- **FR-058**: System MUST display tool usage analytics showing which tools are used by which agents

**Rate Limits & Guardrails**:
- **FR-059**: System MUST display current rate limits per tier (simple/complex/batch) with timeout and memory constraints
- **FR-060**: System MUST display current usage metrics for agents and users
- **FR-061**: System MUST show visual indicators when approaching rate limits
- **FR-062**: System MUST display historical usage charts for capacity planning

**Authentication & Authorization**:
- **FR-063**: System MUST authenticate with the agent-server using JWT tokens
- **FR-064**: System MUST handle token refresh automatically when tokens expire
- **FR-065**: System MUST enforce role-based access control (admins can manage all agents, users can only create personal agents)
- **FR-066**: System MUST display only agents that the current user has permission to access
- **FR-067**: Dispatcher agent MUST only route to tools and agents the user has permission to use
- **FR-067a**: Personal agents MUST be private to their creator - no other users can view, access, or execute them

**API Integration**:
- **FR-068**: System MUST provide API proxy routes that forward requests to the agent-server
- **FR-069**: System MUST handle all agent-server API endpoints (agents, runs, workflows, tools, evals, schedules, models)
- **FR-070**: System MUST implement proper error handling with user-friendly messages for API failures
- **FR-071**: System MUST implement retry logic for transient network failures
- **FR-072**: Chat interface MUST route all messages through agent-server (dispatcher agent) rather than directly to LLM providers

### Key Entities

- **Agent**: Represents an AI agent with name, description, model, instructions, assigned tools, scopes, and active status. Can be built-in (hardcoded) or custom (database-stored). Includes special dispatcher agent for chat routing. Personal agents are private to their creator and not visible to other users.

- **Run**: Represents a single execution of an agent with input data, output results, status (pending/running/succeeded/failed/timeout), events timeline, routing decisions (for dispatcher), performance metrics, and creator information.

- **Workflow**: Represents a multi-step agent workflow with name, description, steps (nodes and edges), and active status. Steps define the execution sequence and data flow.

- **Tool**: Represents a capability that agents can use (search, RAG, ingest, chat, etc.) with name, description, schema, entrypoint, required scopes, and active status. Custom tools are implemented as Python functions that execute in the agent-server.

- **Schedule**: Represents a recurring agent execution with agent reference, input data, cron expression, tier, scopes, next run time, and execution history.

- **Scorer**: Represents an evaluation definition with name, description, configuration, and criteria for assessing run quality.

- **Score**: Represents the result of running a scorer on a run with score value (0-1), pass/fail status, details, and timestamp.

- **Conversation**: Represents a chat session routed through the dispatcher agent, including messages, attachments, tool/agent preferences, and advanced settings.

- **Message**: Represents a single message in a conversation with role (user/assistant), content, attachments, routing decisions, tool/agent results, and timestamp.

- **ChatSettings**: Represents user preferences for chat routing including enabled tools (doc search, web search), selected personal agents, and automatic vs manual routing mode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

**User Productivity**:
- **SC-001**: Users can chat naturally without selecting agents/tools, with dispatcher making intelligent routing decisions in under 2 seconds
- **SC-002**: Users can create and test a new custom agent in under 5 minutes using the LLM assistant
- **SC-003**: Users can design and execute a 3-step workflow in under 10 minutes using the visual builder
- **SC-004**: Users receive real-time feedback on agent execution with status updates appearing within 500ms of server events

**System Performance**:
- **SC-005**: Agent execution monitoring handles 100 concurrent SSE streams without degradation
- **SC-006**: Run history queries with filters return results in under 2 seconds for datasets up to 10,000 runs
- **SC-007**: Workflow validation completes in under 1 second for workflows with up to 50 nodes
- **SC-008**: Dispatcher routing decisions complete in under 1 second for queries with up to 10 available tools/agents

**Feature Adoption**:
- **SC-009**: 90% of users use default automatic routing without configuring advanced settings
- **SC-010**: 80% of users successfully create at least one custom agent within their first week
- **SC-011**: 60% of custom agents are created using LLM assistance rather than manual configuration
- **SC-012**: Users create an average of 3 workflows per month after feature launch

**System Reliability**:
- **SC-013**: SSE connections automatically reconnect within 3 seconds of connection loss without data loss
- **SC-014**: 95% of agent executions complete successfully without timeout or error
- **SC-015**: Scheduled runs execute within 1 minute of their scheduled time 99% of the time
- **SC-016**: Dispatcher successfully routes to appropriate tools/agents 95% of the time without user intervention

**Code Quality**:
- **SC-017**: All chat components successfully migrate to busibox-ui with no functionality loss in AI Portal
- **SC-018**: Chat components support both direct LLM (AI Portal) and agent-server routing (Agent Client) through same interface
- **SC-019**: Test coverage exceeds 80% for API client methods and critical user flows
- **SC-020**: TypeScript compilation produces zero errors with strict mode enabled

**User Satisfaction**:
- **SC-021**: Users rate the chat interface as "natural" or "very natural" in 90% of feedback
- **SC-022**: Users rate the visual workflow builder as "intuitive" or "very intuitive" in 85% of feedback
- **SC-023**: Users successfully complete their intended task on first attempt 90% of the time
- **SC-024**: Support tickets related to agent management decrease by 60% after LLM assistant launch
- **SC-025**: Users report that automatic routing meets their needs 85% of the time without manual configuration

## Scope & Boundaries *(mandatory)*

### In Scope

**Phase 1 - Foundation**:
- Migration of all chat components to busibox-ui with support for both direct LLM and agent-server routing
- Dispatcher agent integration for intelligent chat routing
- Advanced settings UI for explicit tool/agent selection
- Basic agent CRUD operations
- Agent execution with SSE streaming
- Run history and detail views with routing decisions
- API client for all agent-server endpoints

**Phase 2 - Advanced Features**:
- Visual workflow builder with React Flow
- LLM-assisted agent design
- Schedule management
- Evaluation and scoring
- Tool management

**Phase 3 - Polish**:
- Performance dashboards and analytics
- Run comparison tools
- Data export functionality
- Comprehensive documentation

### Out of Scope

- **Dispatcher agent implementation**: Assumes dispatcher agent exists in agent-server with ability to analyze queries and route to tools/agents
- **Agent-server implementation changes**: This project only builds the UI client; agent-server functionality is assumed to exist
- **Authentication system changes**: Uses existing better-auth implementation
- **Database schema changes**: Works with existing PostgreSQL schema in agent-server
- **Mobile applications**: Web interface only
- **Offline functionality**: Requires network connection to agent-server
- **Multi-tenancy**: Single organization deployment
- **Custom LLM model training**: Uses existing models via agent-server
- **Real-time collaboration**: No simultaneous editing by multiple users
- **Version control for agents**: No git-like versioning of agent configurations
- **A/B testing framework**: No built-in experimentation tools

### Dependencies

**External Systems**:
- **Agent-server**: Python FastAPI service at http://10.96.200.31:8000 (production) or http://localhost:8000 (development)
- **PostgreSQL**: Database for agent definitions, runs, workflows, etc. (managed by agent-server)
- **Authentication service**: JWT token provider (part of Busibox infrastructure)

**Shared Libraries**:
- **busibox-ui**: Shared UI component library (will be created as part of this project)
- **React Flow**: Visual workflow editor library (npm package)

**Infrastructure**:
- **Ansible**: Deployment automation (existing Busibox infrastructure)
- **PM2**: Process management for Next.js app (existing)
- **nginx**: Reverse proxy (existing)

### Assumptions

- Agent-server API is stable and matches the documented endpoints in the implementation plan
- Agent-server includes a dispatcher agent capable of analyzing queries and routing to appropriate tools/agents
- Dispatcher agent has access to user's permissions and available tools/agents for routing decisions
- Agent-server handles all authentication, authorization, and rate limiting enforcement
- Agent-server provides SSE streaming for run status updates including routing decisions
- Built-in agents (dispatcher, search, RAG, ingest, chat) are hardcoded in agent-server and cannot be modified via UI
- Users have modern browsers with SSE support (Chrome 6+, Firefox 6+, Safari 5+, Edge 79+)
- Network latency between agent-client and agent-server is under 100ms
- Agent executions complete within tier timeout limits (simple: 30s, complex: 5min, batch: 30min)
- LLM responses for agent design assistance are coherent and follow expected JSON formats
- Workflow execution is sequential (no parallel step execution in MVP)
- Tool schemas follow a consistent format that can be validated
- Rate limits are sufficient for expected user load (to be monitored in production)

## Non-Functional Requirements *(optional)*

### Performance

- **NFR-001**: Page load time under 2 seconds on 3G connection
- **NFR-002**: Time to interactive under 3 seconds
- **NFR-003**: SSE event processing latency under 100ms
- **NFR-004**: Workflow graph rendering for 50 nodes under 1 second
- **NFR-005**: API response time (excluding agent execution) under 500ms for 95th percentile

### Scalability

- **NFR-006**: Support 100 concurrent users without degradation
- **NFR-007**: Handle 10,000 stored runs with performant queries
- **NFR-008**: Support 100 active agents without UI slowdown
- **NFR-009**: Support workflows with up to 50 nodes
- **NFR-010**: Handle 50 concurrent agent executions

### Reliability

- **NFR-011**: 99.5% uptime during business hours
- **NFR-012**: Automatic SSE reconnection on connection loss
- **NFR-013**: Graceful degradation when agent-server is unavailable
- **NFR-014**: No data loss on browser refresh during agent execution
- **NFR-015**: Preserve workflow state on partial execution failure to enable resume capability; rollback only if user chooses restart option

### Security

- **NFR-016**: All API requests include valid JWT authentication tokens
- **NFR-017**: Sensitive data (tokens, credentials) never logged or exposed in UI
- **NFR-018**: Role-based access control enforced on all admin operations
- **NFR-019**: Input validation on all user-provided data
- **NFR-020**: XSS protection via React's built-in escaping

### Usability

- **NFR-021**: Consistent UI patterns across all features using Tailwind CSS
- **NFR-022**: Keyboard navigation support for all interactive elements
- **NFR-023**: Loading states for all async operations
- **NFR-024**: Error messages provide actionable guidance
- **NFR-025**: Responsive design works on screens 1024px and wider

### Maintainability

- **NFR-026**: TypeScript strict mode with zero compilation errors
- **NFR-027**: Component reusability score above 70% (shared components / total components)
- **NFR-028**: Test coverage above 80% for critical paths
- **NFR-029**: API client methods have unit tests with mocked responses
- **NFR-030**: Documentation includes architecture diagrams and API reference

### Accessibility

- **NFR-031**: WCAG 2.1 Level AA compliance for core user flows
- **NFR-032**: Screen reader support for agent execution status
- **NFR-033**: Sufficient color contrast ratios (4.5:1 for normal text)
- **NFR-034**: Focus indicators visible on all interactive elements
- **NFR-035**: Alt text for all informational images and icons

## Clarifications

### Session 2025-12-11

- Q: When the dispatcher cannot confidently route a query (ambiguous, no matching tools/agents, or low confidence), what should happen? → A: Show disambiguation UI asking user to select intended capability
- Q: Are personal agents created by users visible to other users, or are they private? → A: Private to creator only - no other users can see or use them
- Q: What language/format should custom tool implementations use? → A: Python functions that run in agent-server (consistent with backend)
- Q: When a workflow step fails midway through execution, how should the system handle recovery? → A: User choice - option to resume or restart on retry (Note: Implementation depends on agent-server workflow failure management capabilities)
- Q: When a user has configured advanced settings (e.g., disabled web search), but the dispatcher determines web search would be optimal for the query, what should happen? → A: Honor user settings - dispatcher only uses enabled tools/agents

## Open Questions

*No open questions at this time. All requirements are specified with reasonable defaults based on industry standards and the existing Busibox infrastructure.*
