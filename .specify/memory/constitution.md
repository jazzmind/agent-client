# Agent Client Constitution

## Core Principles

### I. Component Reusability

Every UI component that could be useful across multiple Busibox applications MUST be built in the busibox-ui shared library. Components must be:
- Self-contained with clear interfaces
- Independently testable
- Documented with Storybook stories
- Configurable via props (no hardcoded API endpoints or business logic)

**Rationale**: Reduces duplication, ensures consistency across applications, and accelerates development of new features.

### II. API-First Design

The agent-client is a pure UI layer. All business logic, data persistence, and AI operations happen in the agent-server backend. The client MUST:
- Never implement business logic
- Always proxy requests to agent-server
- Handle only UI state and presentation
- Validate user input before sending to server (for UX, not security)

**Rationale**: Maintains clear separation of concerns, enables multiple clients (web, mobile, CLI), and centralizes security and business rules.

### III. Type Safety (NON-NEGOTIABLE)

TypeScript strict mode MUST be enabled with zero compilation errors. All code MUST:
- Define explicit types for all function parameters and return values
- Use TypeScript interfaces for all data structures
- Avoid `any` type except when interfacing with untyped libraries
- Generate types from OpenAPI specs where possible

**Rationale**: Prevents runtime errors, improves developer experience, enables better refactoring, and serves as living documentation.

### IV. Real-Time Streaming

Agent execution status MUST be streamed in real-time using Server-Sent Events (SSE). The implementation MUST:
- Use SSE for all long-running operations (agent runs, workflows)
- Implement automatic reconnection on connection loss
- Handle connection drops gracefully with user feedback
- Support 100+ concurrent SSE streams without degradation

**Rationale**: Provides immediate feedback to users, enables monitoring of long-running operations, and improves perceived performance.

### V. Visual Workflow Design

Workflows MUST be designed visually using drag-and-drop node placement. The workflow builder MUST:
- Use React Flow for node-based editing
- Support custom node types (Agent, Tool, Condition, Input, Output, Transform)
- Validate workflows before execution (no cycles, no disconnected nodes)
- Convert visual graphs to agent-server workflow format
- Provide clear error messages for validation failures

**Rationale**: Makes complex workflows accessible to non-technical users, reduces errors, and provides intuitive understanding of execution flow.

### VI. LLM-Assisted Development

Agent creation MUST be assisted by AI to reduce learning curve and improve quality. The LLM assistant MUST:
- Generate agent configurations from natural language descriptions
- Validate configurations and suggest improvements
- Support iterative refinement through conversation
- Recommend appropriate tools with explanations
- Stream responses for real-time feedback

**Rationale**: Democratizes agent creation, improves agent quality, reduces time to value, and educates users about best practices.

### VII. Test-First for Critical Paths

Critical user flows MUST have tests written before or alongside implementation. Test coverage MUST exceed 80% for:
- API client methods
- SSE streaming logic
- Workflow validation and conversion
- Component state management
- Authentication and authorization

**Rationale**: Prevents regressions, enables confident refactoring, documents expected behavior, and ensures reliability.

### VIII. Observability

All agent operations MUST be fully observable with comprehensive event timelines, performance metrics, and debugging tools. The system MUST:
- Log all API requests and responses (excluding sensitive data)
- Capture complete event timelines for runs
- Display performance metrics (duration, tokens, tool calls)
- Provide detailed error messages with context
- Enable export of run data for analysis

**Rationale**: Enables troubleshooting, performance optimization, quality improvement, and understanding of agent behavior.

---

## Architecture Standards

### Component Architecture

**Shared Components** (busibox-ui):
- MUST accept configuration via props
- MUST NOT hardcode API endpoints
- MUST support multiple backend types (direct LLM, agent-server)
- MUST be documented with Storybook stories
- MUST have unit tests

**Application Components** (agent-client):
- MAY use shared components from busibox-ui
- MUST handle application-specific logic
- SHOULD be small and focused (single responsibility)
- MUST use TypeScript interfaces for props

### API Client Architecture

**Agent API Client** (`lib/agent-api-client.ts`):
- MUST implement all agent-server endpoints
- MUST handle authentication (JWT token injection)
- MUST implement retry logic for transient failures
- MUST provide TypeScript types for all requests/responses
- MUST have comprehensive error handling
- MUST have unit tests with mocked responses

**API Proxy Routes** (`app/api/*`):
- MUST forward requests to agent-server
- MUST inject authentication headers
- MUST handle token refresh
- MUST provide user-friendly error messages
- MUST log requests for debugging (excluding sensitive data)

### State Management

**Server State** (data from agent-server):
- Use React Query or SWR for caching and synchronization
- Implement optimistic updates where appropriate
- Handle loading, error, and success states consistently

**UI State** (local to client):
- Use React hooks (useState, useReducer) for component state
- Use Context API for shared UI state (current conversation, filters, etc.)
- Persist user preferences in localStorage

**No Global State Library Required**: React's built-in state management is sufficient for this application's complexity.

### Error Handling

**User-Facing Errors**:
- MUST provide actionable guidance ("Try again" vs "Contact support")
- MUST NOT expose technical details (stack traces, internal errors)
- SHOULD suggest solutions when possible

**Developer Errors**:
- MUST log to console with full context
- MUST include request/response details
- SHOULD include stack traces

**Network Errors**:
- MUST implement retry logic (3 attempts with exponential backoff)
- MUST show connection status to user
- MUST handle offline gracefully

---

## Development Workflow

### Feature Development

1. **Understand Requirements**: Read feature spec and acceptance criteria
2. **Design Component API**: Define props, types, and behavior
3. **Write Tests**: Create test file with failing tests
4. **Implement**: Write code to make tests pass
5. **Create Story**: Add Storybook story for visual testing
6. **Manual Test**: Verify in browser with real agent-server
7. **Code Review**: Self-review using checklist
8. **Commit**: Use conventional commit messages

### Testing Workflow

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test API client with mock server
3. **Component Tests**: Test component interactions in Storybook
4. **Manual Tests**: Test with real agent-server in development environment
5. **E2E Tests** (optional): Test complete user journeys

### Deployment Workflow

1. **Local Testing**: Verify all tests pass locally
2. **Build**: Ensure production build succeeds
3. **Deploy to Test**: Deploy to test environment via Ansible
4. **Smoke Test**: Verify critical paths work in test environment
5. **Deploy to Production**: Deploy via Ansible after test verification
6. **Monitor**: Check logs and metrics after deployment

---

## Quality Gates

### Pre-Commit

- [ ] TypeScript compilation succeeds with zero errors
- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code formatted consistently

### Pre-Merge

- [ ] All acceptance criteria met
- [ ] Test coverage ≥80% for new code
- [ ] Storybook stories created for new components
- [ ] Documentation updated (if needed)
- [ ] Manual testing completed
- [ ] No console errors in browser

### Pre-Deployment

- [ ] All tests pass in CI
- [ ] Production build succeeds
- [ ] Environment variables configured
- [ ] Database migrations applied (if needed)
- [ ] Rollback plan documented

---

## Governance

### Constitution Authority

This constitution supersedes all other development practices for the agent-client project. Any deviation MUST be:
1. Documented with clear rationale
2. Approved by project lead
3. Updated in this constitution if it becomes a pattern

### Amendment Process

1. Propose amendment with rationale and examples
2. Discuss with team
3. Update constitution
4. Create migration plan if needed
5. Update version and last amended date

### Compliance

- All pull requests MUST verify compliance with this constitution
- Code reviews MUST check for violations
- Complexity MUST be justified against these principles
- Simplicity is preferred over cleverness

### Runtime Guidance

For day-to-day development guidance, refer to:
- `.cursor/rules/specify-rules.mdc` (auto-generated from plans)
- `specs/001-agent-management-rebuild/` (feature-specific documentation)
- `CLAUDE.md` (project overview for AI assistants)

---

**Version**: 1.0.0 | **Ratified**: 2025-12-11 | **Last Amended**: 2025-12-11
