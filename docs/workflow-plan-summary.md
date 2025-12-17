# Workflow Enhancement Plan Summary

## Updated Plan Overview

The plan has been updated to include comprehensive workflow management with:

1. **Triggers** - How workflows start
   - `manual` - User-initiated
   - `cron` - Time-based scheduling  
   - `webhook` - HTTP endpoints
   - `event` - MinIO upload, email, message queue
   - `agent_completion` - When another agent finishes

2. **Steps** - What workflows do
   - `agent` - Delegate to an agent (Pydantic AI pattern)
   - `tool` - Call a tool directly
   - `condition` - Branch based on logic
   - `human` - Human-in-loop approval/decision
   - `parallel` - Run steps concurrently
   - `loop` - Iterate over items

3. **Guardrails** - Safety limits
   - `request_limit` - Max LLM requests
   - `total_tokens_limit` - Max tokens
   - `tool_calls_limit` - Max tool invocations
   - `timeout_seconds` - Max duration
   - `max_cost_dollars` - Cost ceiling

4. **Conditions** - Decision points
   - JSONPath field references (`$.step_id.field.path`)
   - Operators: `eq`, `ne`, `gt`, `lt`, `gte`, `lte`, `contains`, `exists`
   - Branch to different steps based on results

## Implementation Phases

### Phase 1: Completed ✅
- Basic agent management enhancements
- Tool management  
- Chat integration
- Dark mode

### Phase 2: Workflow Type System (Next)
- Define comprehensive TypeScript types
- `busibox-app/src/types/workflow.ts`
- Update API client types

### Phase 3: Backend - Workflow Engine
- Data models (SQLAlchemy)
- Trigger system (cron, webhook, events)
- Condition engine (JSONPath, operators)
- Guardrails (UsageLimits integration)
- Advanced step types (human-in-loop, parallel, loop)

### Phase 4: Backend - Workflow API
- CRUD endpoints for workflows
- Execution management
- Human approval endpoints
- Webhook trigger endpoints

### Phase 5: Frontend - busibox-app Components
- `WorkflowEditor` - Drag-drop graph editor
- `WorkflowStepNode` - Individual step nodes
- `TriggerConfig` - Trigger configuration
- `GuardrailsConfig` - Safety limits UI
- `ConditionBuilder` - Condition builder
- `WorkflowExecutionView` - Execution monitoring
- `WorkflowList` - Workflow dashboard

### Phase 6: Frontend - Agent Manager Integration
- `/workflows` - Dashboard page
- `/workflows/new` - Create with editor
- `/workflows/[id]` - Detail view
- `/workflows/[id]/edit` - Edit with editor
- `/workflows/executions/[id]` - Execution details

### Phase 7: Testing & Documentation
- Unit tests for workflow engine
- Integration tests for triggers
- Example workflows
- Documentation

## Example Workflow: Profile Builder

```json
{
  "name": "Personal Profile Creator",
  "trigger": {
    "type": "webhook",
    "config": {"path": "/profile-request", "auth_required": true}
  },
  "steps": [
    {
      "id": "get_document",
      "type": "tool",
      "tool": "document_search",
      "tool_args": {"query": "$.input.user_id"},
      "next_step": "check_document"
    },
    {
      "id": "check_document",
      "type": "condition",
      "condition": {
        "field": "$.get_document.found",
        "operator": "eq",
        "value": false,
        "then_step": "create_profile",
        "else_step": "check_completeness"
      }
    },
    {
      "id": "create_profile",
      "type": "agent",
      "agent_id": "profile-builder",
      "agent_prompt": "Create profile: $.input.message",
      "guardrails": {
        "request_limit": 3,
        "total_tokens_limit": 5000,
        "timeout_seconds": 30
      },
      "next_step": "send_message"
    }
  ],
  "guardrails": {
    "request_limit": 15,
    "total_tokens_limit": 20000,
    "timeout_seconds": 120
  }
}
```

## Visual Editor Features

**Node Types:**
- Agent (🤖) - Blue  
- Tool (🔧) - Orange
- Condition (🔀) - Purple
- Human (👤) - Green
- Parallel (⚡) - Yellow
- Loop (🔁) - Pink

**Features:**
- Drag-drop interface (ReactFlow)
- Real-time validation
- JSONPath references
- Guardrails per step
- Trigger configuration
- Execution monitoring

## References

- Full plan: `~/.cursor/plans/agent_manager_enhancements_2bf8d24b.plan.md`
- [Pydantic AI Multi-Agent Applications](https://ai.pydantic.dev/multi-agent-applications/)
- [Pydantic AI Usage Limits](https://ai.pydantic.dev/api/run/#pydantic_ai.UsageLimits)
