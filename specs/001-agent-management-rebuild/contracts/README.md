# API Contracts

## Agent Server API

**File**: `agent-server-api.yaml`

This OpenAPI 3.1 specification documents the agent-server API as currently implemented. The agent-manager application consumes this API.

### Key Endpoints

**System**:
- `GET /health` - Health check (no auth required)

**Authentication**:
- `POST /auth/exchange` - Exchange user token for downstream service tokens

**Agents**:
- `GET /agents` - List all active agents
- `POST /agents/definitions` - Create agent definition
- `PUT /agents/definitions/{agent_id}` - Update agent definition

**Tools** (under `/agents` prefix):
- `GET /agents/tools` - List all tools
- `POST /agents/tools` - Create custom tool

**Workflows** (under `/agents` prefix):
- `GET /agents/workflows` - List all workflows
- `POST /agents/workflows` - Create workflow

**Evaluations** (under `/agents` prefix):
- `GET /agents/evals` - List all evaluators
- `POST /agents/evals` - Create evaluator

**Models**:
- `GET /agents/models` - List available LLM models from LiteLLM

**Runs**:
- `POST /runs` - Execute agent run
- `GET /runs/{run_id}` - Get run details
- `GET /runs` - List runs with filters
- `POST /runs/workflow` - Execute workflow

**Schedules**:
- `POST /runs/schedule` - Schedule recurring run
- `GET /runs/schedule` - List schedules
- `DELETE /runs/schedule/{job_id}` - Cancel schedule

**Scores**:
- `POST /scores/execute` - Execute scorer on runs
- `GET /scores/aggregates` - Get aggregated score metrics

**Streaming**:
- `GET /streams/runs/{run_id}` - SSE stream for run events

### Important Notes

1. **Tools, Workflows, Evals under `/agents`**: These endpoints are prefixed with `/agents/` not at root level
2. **No Individual GET/PUT/DELETE**: Tools, workflows, and evals only support list and create operations (no individual retrieval, update, or deletion in current API)
3. **Schedule Delete uses `job_id`**: The schedule cancellation endpoint uses `job_id` parameter, not `id`
4. **Limited Update Operations**: Only agent definitions can be updated via PUT; tools, workflows, and evals are create-only in current API

### Future Enhancements

The following endpoints may be added in future versions:
- `GET /agents/tools/{id}` - Get individual tool
- `PUT /agents/tools/{id}` - Update tool
- `DELETE /agents/tools/{id}` - Delete tool
- Similar CRUD operations for workflows and evals
- `GET /runs/schedule/{id}` - Get individual schedule details
- `PUT /runs/schedule/{id}` - Update schedule

### Agent-Client Implications

The agent-manager UI must adapt to the current API limitations:
- **Tools**: Can list and create, but cannot edit or delete individual tools
- **Workflows**: Can list and create, but cannot edit or delete individual workflows  
- **Evaluators**: Can list and create, but cannot edit or delete individual evaluators
- **Schedules**: Can list, create, and delete, but cannot edit or view individual schedule details

The UI should provide clear messaging about these limitations and may need to implement workarounds (e.g., create new version instead of editing).
