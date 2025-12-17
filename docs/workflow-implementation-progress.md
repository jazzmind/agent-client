# Workflow Enhancement Implementation Progress

## Completed ✅

### Phase 1: Type System
- ✅ Created comprehensive TypeScript workflow types in `busibox-app/src/types/workflow.ts`
  - Trigger types (manual, cron, webhook, event, agent_completion)
  - Guardrails types (request_limit, tokens, cost, timeout)
  - Step types (agent, tool, condition, human, parallel, loop)
  - Execution tracking types
  - Validation types
- ✅ Exported types from `busibox-app/src/types/index.ts`

### Phase 2: Database Models
- ✅ Updated `WorkflowDefinition` model with:
  - `trigger` field (JSON)
  - `guardrails` field (JSON)
- ✅ Created `WorkflowExecution` model:
  - Tracks execution state and status
  - Usage metrics (requests, tokens, tool_calls, cost)
  - Timing (started_at, completed_at, duration)
  - Error tracking
  - Human-in-loop state
- ✅ Created `StepExecution` model:
  - Per-step execution tracking
  - Step-level usage metrics
  - Step timing and errors
- ✅ Created Alembic migration `20251217_0000_005_workflow_enhancements.py`

### Phase 3: Workflow Engine Enhancements
- ✅ Updated imports to support new models
- ✅ Added `_evaluate_condition()` function:
  - Supports operators: eq, ne, gt, lt, gte, lte, contains, exists
  - JSONPath field resolution
  - Logging for debugging
- ✅ Enhanced `validate_workflow_steps()` function:
  - Validates all new step types
  - Checks required fields per step type
  - Validates condition, human, parallel, loop configurations

## Next Steps (Pending)

### Phase 4: Guardrails Implementation
**File:** `busibox/srv/agent/app/workflows/engine.py`

Add usage tracking and guardrail enforcement:

```python
class UsageLimits:
    """Track and enforce usage limits"""
    def __init__(self, guardrails: Optional[Dict[str, Any]] = None):
        self.request_limit = guardrails.get("request_limit") if guardrails else None
        self.total_tokens_limit = guardrails.get("total_tokens_limit") if guardrails else None
        # ... etc
    
    def check_and_update(self, usage: Dict[str, int]) -> bool:
        """Check if usage exceeds limits"""
        # Implementation
```

### Phase 5: Advanced Step Types
**File:** `busibox/srv/agent/app/workflows/engine.py`

Update `execute_workflow()` to handle:
1. **Condition steps** - Branch based on evaluation
2. **Human steps** - Pause for approval
3. **Parallel steps** - Execute concurrently with `asyncio.gather()`
4. **Loop steps** - Iterate over items

### Phase 6: Trigger System
**Files to create:**
- `busibox/srv/agent/app/workflows/triggers/base.py`
- `busibox/srv/agent/app/workflows/triggers/cron.py` (APScheduler)
- `busibox/srv/agent/app/workflows/triggers/webhook.py`
- `busibox/srv/agent/app/workflows/triggers/event.py`
- `busibox/srv/agent/app/workflows/triggers/manager.py`

### Phase 7: Workflow API Endpoints
**File:** `busibox/srv/agent/app/api/workflows.py`

Create FastAPI router with endpoints:
- `POST /agents/workflows/{id}/execute` - Manual trigger
- `GET /agents/workflows/{id}/executions` - List executions
- `GET /agents/workflows/executions/{exec_id}` - Get execution
- `POST /agents/workflows/executions/{exec_id}/approve` - Human approval
- `POST /agents/webhooks/{path}` - Webhook triggers

### Phase 8: Frontend Components (busibox-app)
**Directory:** `busibox-app/src/components/workflow/`

Create React components:
1. `WorkflowEditor.tsx` - Drag-drop graph editor (ReactFlow)
2. `WorkflowStepNode.tsx` - Step node visualization
3. `TriggerConfig.tsx` - Trigger configuration UI
4. `GuardrailsConfig.tsx` - Guardrails settings
5. `ConditionBuilder.tsx` - Condition builder UI
6. `WorkflowExecutionView.tsx` - Live execution monitoring
7. `WorkflowList.tsx` - Workflow dashboard

### Phase 9: Agent Manager Integration
**Files to update:**
- `agent-manager/app/workflows/page.tsx`
- `agent-manager/app/workflows/new/page.tsx`
- `agent-manager/app/workflows/[id]/page.tsx`
- `agent-manager/app/workflows/[id]/edit/page.tsx`
- `agent-manager/app/workflows/executions/[id]/page.tsx` (new)

## Commands to Run

### Apply Database Migration
```bash
cd /Users/wessonnenreich/Code/sonnenreich/busibox/srv/agent
alembic upgrade head
```

### Test Workflow Engine
```bash
cd /Users/wessonnenreich/Code/sonnenreich/busibox/srv/agent
pytest tests/test_workflow_engine.py -v
```

## Architecture Decisions

1. **Pydantic AI Patterns**: Following agent delegation and programmatic hand-off patterns
2. **JSONPath**: Simple `$.step_id.field` syntax for referencing step outputs
3. **Guardrails**: Per-step and global limits using Pydantic AI's `UsageLimits` pattern
4. **Storage**: SQLAlchemy with JSON columns for flexible workflow definitions
5. **Execution Tracking**: Separate `WorkflowExecution` and `StepExecution` tables for granular monitoring

## Key Features

- **Triggers**: Manual, cron, webhook, event-based, agent completion
- **Conditions**: Full JSONPath evaluation with 8 operators
- **Guardrails**: Request, token, tool call, cost, and timeout limits
- **Human-in-Loop**: Pause workflows for approval with timeout handling
- **Parallel Execution**: Run multiple steps concurrently
- **Loop Iteration**: Iterate over arrays with step execution per item
- **Usage Tracking**: Per-step and workflow-level metrics
- **Error Handling**: Graceful failures with error logging

## References

- Plan: `~/.cursor/plans/agent_manager_enhancements_2bf8d24b.plan.md`
- Summary: `agent-manager/docs/workflow-plan-summary.md`
- [Pydantic AI Multi-Agent](https://ai.pydantic.dev/multi-agent-applications/)
