# Research Findings: Agent Management System Rebuild

**Date**: 2025-12-11  
**Feature**: Agent Management System Rebuild  
**Branch**: `001-agent-management-rebuild`

## Overview

This document captures research findings for key technical decisions required to implement the agent management system rebuild. Each section documents the decision made, rationale, alternatives considered, and implementation notes.

---

## 1. SSE Streaming in Next.js 15

### Decision

Use Next.js 15 Route Handlers with `ReadableStream` for SSE responses, combined with a custom React hook (`useRunStream`) that manages EventSource connections with automatic reconnection.

### Rationale

- Next.js 15 App Router provides native support for streaming responses via `ReadableStream`
- `EventSource` API is well-supported in modern browsers and handles SSE protocol automatically
- Custom hook encapsulates connection management, reconnection logic, and state updates
- Proxy pattern allows agent-client to add authentication headers before forwarding to agent-server

### Alternatives Considered

1. **Direct EventSource to agent-server**: Rejected because cannot inject JWT tokens in EventSource headers
2. **WebSockets**: Rejected because SSE is simpler for one-way server→client streaming and agent-server already implements SSE
3. **Polling**: Rejected due to higher latency and server load

### Implementation Notes

**API Route Pattern** (`app/api/streams/runs/[id]/route.ts`):
```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const token = await getAuthToken(request);
  
  // Create SSE stream to agent-server
  const agentServerUrl = `${process.env.AGENT_SERVER_URL}/streams/runs/${params.id}`;
  const response = await fetch(agentServerUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'text/event-stream',
    },
  });

  // Forward stream to client
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**React Hook Pattern** (`hooks/useRunStream.ts`):
```typescript
export function useRunStream(runId: string) {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [status, setStatus] = useState<RunStatus>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(`/api/streams/runs/${runId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents(prev => [...prev, data]);
      if (data.type === 'status') setStatus(data.status);
    };

    eventSource.onerror = () => {
      eventSource.close();
      // Reconnect after 3 seconds
      setTimeout(() => {
        // Create new EventSource
      }, 3000);
    };

    return () => eventSource.close();
  }, [runId]);

  return { events, status, error };
}
```

**Performance Considerations**:
- Limit to 100 concurrent SSE connections per client
- Implement connection pooling on server side
- Use heartbeat messages to detect stale connections
- Close connections after 30 minutes of inactivity

---

## 2. React Flow Integration

### Decision

Use React Flow v11+ with custom node types, controlled component pattern, and a converter utility that transforms the React Flow graph into the agent-server workflow definition format.

### Rationale

- React Flow is the industry standard for node-based editors (100k+ weekly downloads)
- Provides built-in features: drag-and-drop, zoom/pan, edge routing, minimap
- Supports custom node types with full React component flexibility
- Controlled component pattern gives full control over graph state
- TypeScript support is excellent

### Alternatives Considered

1. **Custom canvas implementation**: Rejected due to complexity and reinventing the wheel
2. **Rete.js**: Rejected due to less active maintenance and smaller community
3. **Cytoscape.js**: Rejected because designed for graph visualization, not editing

### Implementation Notes

**Installation**:
```bash
npm install reactflow
```

**Custom Node Example** (`components/admin/WorkflowNodes/AgentNode.tsx`):
```typescript
import { Handle, Position } from 'reactflow';

export function AgentNode({ data }: { data: AgentNodeData }) {
  return (
    <div className="px-4 py-2 border rounded shadow">
      <Handle type="target" position={Position.Top} />
      <div className="font-bold">{data.agentName}</div>
      <div className="text-sm text-gray-600">{data.agentId}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

**Workflow Converter** (`lib/workflow-converter.ts`):
```typescript
export function convertReactFlowToWorkflow(
  nodes: Node[],
  edges: Edge[]
): WorkflowDefinition {
  // Validate graph (no cycles, no disconnected nodes)
  validateWorkflowGraph(nodes, edges);
  
  // Convert nodes to steps
  const steps = nodes.map(node => ({
    id: node.id,
    type: node.type,
    config: node.data,
  }));
  
  // Convert edges to dependencies
  const dependencies = edges.map(edge => ({
    from: edge.source,
    to: edge.target,
  }));
  
  return { steps, dependencies };
}
```

**Validation Strategy**:
- Detect circular dependencies using depth-first search
- Ensure all nodes are connected to input/output
- Validate node configurations before allowing save
- Provide visual feedback for validation errors

**Performance Optimization**:
- Use React Flow's built-in virtualization for large graphs
- Lazy load node configuration panels
- Debounce auto-save during editing
- Optimize re-renders with React.memo

---

## 3. Shared Component Library Architecture

### Decision

Create busibox-ui as an npm package using tsup for building, with peer dependencies for React/Next.js, and prop-based API configuration for flexibility.

### Rationale

- tsup provides fast, zero-config bundling for TypeScript libraries
- Peer dependencies prevent version conflicts in consuming applications
- Prop-based API configuration allows components to work with different backends
- Storybook integration enables isolated component development and documentation
- Semantic versioning provides clear upgrade paths

### Alternatives Considered

1. **Monorepo with Turborepo**: Rejected as overkill for 2 applications
2. **Copy-paste components**: Rejected due to maintenance burden and drift
3. **Rollup**: Rejected because tsup is simpler and faster for TypeScript

### Implementation Notes

**Build Configuration** (`busibox-ui/tsup.config.ts`):
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'next'],
});
```

**Package Configuration** (`busibox-ui/package.json`):
```json
{
  "name": "@busibox/ui",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    },
    "./chat": {
      "require": "./dist/chat/index.js",
      "import": "./dist/chat/index.mjs",
      "types": "./dist/chat/index.d.ts"
    }
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "next": "^14.0.0 || ^15.0.0"
  }
}
```

**Component API Pattern** (configurable handlers):
```typescript
// busibox-ui/src/chat/components/MessageInput.tsx
export interface MessageInputProps {
  onSendMessage: (content: string, attachments: File[]) => Promise<void>;
  onAttachmentUpload?: (file: File) => Promise<string>;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({ 
  onSendMessage, 
  onAttachmentUpload,
  placeholder = "Type a message...",
  disabled = false 
}: MessageInputProps) {
  // Component implementation
}
```

**Usage in AI Portal** (direct LLM):
```typescript
<MessageInput 
  onSendMessage={async (content, files) => {
    await sendToLLM(content, files);
  }}
/>
```

**Usage in Agent Client** (agent-server routing):
```typescript
<MessageInput 
  onSendMessage={async (content, files) => {
    await sendToDispatcher(content, files);
  }}
/>
```

**Local Development Workflow**:
```bash
# In busibox-ui
npm link

# In agent-client or ai-portal
npm link @busibox/ui

# Watch mode in busibox-ui
npm run dev
```

**Publishing Strategy**:
- Use GitHub Packages or private npm registry
- Semantic versioning (MAJOR.MINOR.PATCH)
- Changelog for all releases
- Migration guides for breaking changes

---

## 4. JWT Token Management

### Decision

Use Next.js middleware to inject JWT tokens into agent-server requests, with httpOnly cookies for token storage and automatic refresh via API route.

### Rationale

- httpOnly cookies prevent XSS attacks (tokens not accessible to JavaScript)
- Next.js middleware runs on every request, perfect for token injection
- Automatic refresh via API route keeps tokens valid without user intervention
- Works seamlessly with existing better-auth system
- Compatible with SSE streaming (cookies sent automatically)

### Alternatives Considered

1. **localStorage**: Rejected due to XSS vulnerability
2. **Authorization header from client**: Rejected because requires exposing token to JavaScript
3. **Session-based auth**: Rejected because agent-server expects JWT tokens

### Implementation Notes

**Middleware** (`middleware.ts`):
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if request is to agent-server proxy
  if (request.nextUrl.pathname.startsWith('/api/agents') ||
      request.nextUrl.pathname.startsWith('/api/runs') ||
      request.nextUrl.pathname.startsWith('/api/streams')) {
    
    // Get JWT token from httpOnly cookie
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Token will be injected in API route handler
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

**Token Refresh** (`app/api/auth/refresh/route.ts`):
```typescript
export async function POST(request: Request) {
  const refreshToken = request.cookies.get('refresh_token')?.value;
  
  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }
  
  // Call auth service to refresh token
  const newToken = await refreshAuthToken(refreshToken);
  
  // Set new token in httpOnly cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600, // 1 hour
  });
  
  return response;
}
```

**Automatic Refresh Strategy**:
- Check token expiration before each agent-server request
- If token expires in <5 minutes, refresh proactively
- If request returns 401, refresh and retry once
- For SSE streams, refresh token before establishing connection

**Integration with better-auth**:
- Use existing better-auth session management
- Extract JWT token from better-auth session
- Store in httpOnly cookie for agent-server requests

---

## 5. Dispatcher UI/UX Patterns

### Decision

Use a multi-layered approach:
1. **Inline routing feedback**: Show which tools/agents were selected in the message thread
2. **Expandable details**: Click to see full routing decision reasoning
3. **Modal disambiguation**: When uncertain, show modal with capability options
4. **Settings panel**: Slide-out panel for advanced tool/agent configuration

### Rationale

- Inline feedback keeps users informed without disrupting conversation flow
- Expandable details provide transparency for power users without cluttering UI
- Modal disambiguation forces decision when needed but doesn't block other interactions
- Settings panel is accessible but not intrusive for default automatic mode

### Alternatives Considered

1. **Always show routing details**: Rejected as too verbose for most users
2. **Sidebar for routing**: Rejected because takes up permanent screen space
3. **Inline disambiguation**: Rejected because interrupts conversation flow
4. **Toast notifications**: Rejected because disappear and can't be reviewed

### Implementation Notes

**Inline Routing Feedback**:
```typescript
// In message display
<div className="text-sm text-gray-600 mt-2">
  <span className="font-medium">Routing:</span>
  {routingDecision.tools.map(tool => (
    <span key={tool} className="ml-2 px-2 py-1 bg-blue-100 rounded">
      {tool}
    </span>
  ))}
  {routingDecision.agents.map(agent => (
    <span key={agent} className="ml-2 px-2 py-1 bg-green-100 rounded">
      {agent}
    </span>
  ))}
  <button onClick={() => setShowDetails(true)} className="ml-2 underline">
    Details
  </button>
</div>
```

**Disambiguation Modal**:
```typescript
<Dialog open={showDisambiguation} onOpenChange={setShowDisambiguation}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Choose Capability</DialogTitle>
      <DialogDescription>
        I'm not sure which capability you need. Please select:
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-2">
      {availableCapabilities.map(cap => (
        <button
          key={cap.id}
          onClick={() => selectCapability(cap.id)}
          className="w-full text-left p-3 border rounded hover:bg-gray-50"
        >
          <div className="font-medium">{cap.name}</div>
          <div className="text-sm text-gray-600">{cap.description}</div>
        </button>
      ))}
    </div>
  </DialogContent>
</Dialog>
```

**Advanced Settings Panel**:
```typescript
<Sheet open={showSettings} onOpenChange={setShowSettings}>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Chat Settings</SheetTitle>
    </SheetHeader>
    <div className="space-y-4 mt-4">
      <div>
        <h3 className="font-medium mb-2">Tools</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" checked={tools.docSearch} />
            <span className="ml-2">Document Search</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" checked={tools.webSearch} />
            <span className="ml-2">Web Search</span>
          </label>
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-2">Personal Agents</h3>
        <select multiple className="w-full border rounded p-2">
          {personalAgents.map(agent => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="flex items-center">
          <input type="radio" name="mode" value="automatic" checked />
          <span className="ml-2">Automatic routing</span>
        </label>
        <label className="flex items-center">
          <input type="radio" name="mode" value="manual" />
          <span className="ml-2">Manual selection only</span>
        </label>
      </div>
    </div>
  </SheetContent>
</Sheet>
```

**Nested Agent Call Visualization**:
- Use tree structure with indentation for nested calls
- Show execution order with timestamps
- Expandable sections for each level
- Color coding: dispatcher (blue), agents (green), tools (orange)

**Example**:
```
└─ Dispatcher Agent (2.3s)
   ├─ Document Search Tool (0.8s)
   │  └─ Results: 5 documents found
   ├─ Personal Agent: "Research Assistant" (1.2s)
   │  ├─ RAG Tool (0.4s)
   │  └─ Summary Tool (0.6s)
   └─ Final Response (0.3s)
```

---

## 6. Component Migration Strategy

### Decision

Migrate chat components to busibox-ui in phases:
1. Extract components with minimal changes (keep functionality)
2. Make API calls configurable via props
3. Update AI Portal to use busibox-ui
4. Test thoroughly before proceeding
5. Add agent-specific extensions in agent-client

### Rationale

- Phased approach reduces risk of breaking AI Portal
- Keeping functionality identical ensures backward compatibility
- Configurable API handlers enable different backends
- Testing after each phase catches issues early

### Implementation Notes

**Migration Checklist**:
- [ ] Create busibox-ui/src/chat/ directory structure
- [ ] Copy MessageList.tsx → busibox-ui, remove AI Portal-specific imports
- [ ] Copy MessageInput.tsx → busibox-ui, make onSendMessage configurable
- [ ] Copy ConversationSidebar.tsx → busibox-ui, make API endpoint configurable
- [ ] Copy supporting components (ModelSelector, SearchToggles, Attachments)
- [ ] Create useChat hook with configurable API client
- [ ] Create useConversations hook with configurable API client
- [ ] Define TypeScript types in busibox-ui/src/chat/types/
- [ ] Build busibox-ui package
- [ ] Update AI Portal imports to @busibox/ui
- [ ] Test AI Portal chat functionality
- [ ] Fix any issues before proceeding

**Breaking Change Prevention**:
- Maintain exact same prop interfaces initially
- Add new props as optional with defaults
- Document all changes in CHANGELOG.md
- Provide migration guide for consumers

---

## 7. Workflow Failure Recovery

### Decision

Implement UI for both resume and restart options, with the actual capability depending on agent-server support. If agent-server doesn't support resume, disable that option with explanation.

### Rationale

- User choice provides flexibility (clarification answer)
- UI can be built regardless of backend capability
- Graceful degradation if resume not supported
- Future-proof for when resume is added to agent-server

### Implementation Notes

**Retry UI** (`components/admin/RunDetail.tsx`):
```typescript
{run.status === 'failed' && (
  <div className="mt-4 space-x-2">
    <button 
      onClick={() => retryRun(run.id, 'restart')}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      Restart from Beginning
    </button>
    <button 
      onClick={() => retryRun(run.id, 'resume')}
      disabled={!supportsResume}
      className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
      title={!supportsResume ? 'Resume not supported by agent-server' : ''}
    >
      Resume from Failed Step
    </button>
  </div>
)}
```

**Backend Capability Detection**:
```typescript
// Check agent-server capabilities
const capabilities = await fetch('/api/capabilities').then(r => r.json());
const supportsResume = capabilities.workflow_resume === true;
```

**Workflow State Preservation**:
- Agent-server must store completed step outputs
- UI displays which steps completed successfully
- Resume option only enabled if state is preserved

---

## 8. Advanced Settings Override Behavior

### Decision

Honor user-configured advanced settings strictly. When a user disables a tool or deselects an agent, the dispatcher will not use it, even if it would be optimal. Display a subtle indicator that alternative routing might be better.

### Rationale

- Respects user intent and prevents unexpected behavior (clarification answer)
- Users who configure advanced settings are making deliberate choices
- Transparency via indicator educates users without forcing changes
- Maintains trust by being predictable

### Implementation Notes

**Settings Enforcement** (`lib/agent-api-client.ts`):
```typescript
async function sendChatMessage(
  content: string,
  attachments: File[],
  settings: ChatSettings
) {
  const payload = {
    content,
    attachments,
    // Explicitly pass user settings to dispatcher
    allowed_tools: settings.enabled_tools,
    allowed_agents: settings.selected_agents,
    routing_mode: settings.routing_mode,
  };
  
  return await fetch('/api/runs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
```

**Alternative Routing Indicator**:
```typescript
{routingDecision.suboptimal && (
  <div className="mt-2 text-sm text-amber-600 flex items-center">
    <InfoIcon className="w-4 h-4 mr-1" />
    <span>
      Alternative routing might provide better results. 
      <button 
        onClick={() => setShowSettings(true)}
        className="underline ml-1"
      >
        Adjust settings
      </button>
    </span>
  </div>
)}
```

**Settings Persistence**:
- Store settings in localStorage for persistence across sessions
- Sync with backend user preferences (optional future enhancement)
- Provide "Reset to defaults" option

---

## 9. Personal Agent Privacy

### Decision

Enforce personal agent privacy at both UI and API levels. Personal agents are only visible to their creator and cannot be accessed by other users.

### Rationale

- Aligns with "personal" designation (clarification answer)
- Prevents unauthorized access to potentially sensitive configurations
- Simplifies permission management
- Reduces security risks

### Implementation Notes

**UI Filtering** (`lib/agent-api-client.ts`):
```typescript
async function listAgents(): Promise<Agent[]> {
  const response = await fetch('/api/agents');
  const agents = await response.json();
  
  // Agent-server filters based on JWT token user_id
  // UI receives only agents user has access to
  return agents;
}
```

**Agent List Display**:
```typescript
<div className="space-y-2">
  <h3 className="font-bold">Built-in Agents</h3>
  {agents.filter(a => a.is_builtin).map(agent => (
    <AgentCard key={agent.id} agent={agent} />
  ))}
  
  <h3 className="font-bold mt-4">My Personal Agents</h3>
  {agents.filter(a => a.is_personal).map(agent => (
    <AgentCard key={agent.id} agent={agent} editable />
  ))}
  
  <h3 className="font-bold mt-4">Organization Agents</h3>
  {agents.filter(a => !a.is_builtin && !a.is_personal).map(agent => (
    <AgentCard key={agent.id} agent={agent} />
  ))}
</div>
```

**Backend Enforcement**:
- Agent-server must filter agents by user_id in JWT token
- Personal agents have `created_by` field matching user_id
- API returns 404 if user tries to access another user's personal agent

---

## 10. Custom Tool Implementation

### Decision

Custom tools are Python functions that execute in the agent-server environment. The UI provides a code editor for Python code and schema definition, but execution is entirely server-side.

### Rationale

- Maintains consistency with agent-server backend (clarification answer)
- Enables tools to leverage Python libraries and agent-server infrastructure
- Simplifies deployment (no need to deploy tool code separately)
- Security and sandboxing handled by agent-server

### Implementation Notes

**Tool Editor UI** (`components/admin/ToolManagement.tsx`):
```typescript
<div className="space-y-4">
  <div>
    <label>Tool Name</label>
    <input type="text" value={toolName} onChange={e => setToolName(e.target.value)} />
  </div>
  
  <div>
    <label>Description</label>
    <textarea value={description} onChange={e => setDescription(e.target.value)} />
  </div>
  
  <div>
    <label>Input Schema (JSON)</label>
    <textarea 
      value={inputSchema} 
      onChange={e => setInputSchema(e.target.value)}
      className="font-mono"
    />
  </div>
  
  <div>
    <label>Python Implementation</label>
    <CodeEditor
      language="python"
      value={implementation}
      onChange={setImplementation}
      height="300px"
    />
  </div>
  
  <div>
    <button onClick={testTool}>Test Tool</button>
    <button onClick={saveTool}>Save Tool</button>
  </div>
</div>
```

**Code Editor**:
- Use Monaco Editor (VS Code editor) or CodeMirror
- Syntax highlighting for Python
- Basic linting (optional)
- Template/example provided for new tools

**Tool Testing**:
```typescript
async function testTool(toolCode: string, inputSchema: any, testInput: any) {
  const response = await fetch('/api/tools/test', {
    method: 'POST',
    body: JSON.stringify({
      code: toolCode,
      schema: inputSchema,
      input: testInput,
    }),
  });
  
  const result = await response.json();
  return result; // { output, error, execution_time }
}
```

**Security Considerations**:
- All code execution happens in agent-server (sandboxed environment)
- UI only sends code as string
- Agent-server responsible for validation and sandboxing
- Rate limiting on tool execution to prevent abuse

---

## Summary

All research tasks have been completed with clear decisions documented. Key takeaways:

1. **SSE Streaming**: Use Next.js Route Handlers + EventSource with custom hook
2. **React Flow**: Standard integration with custom nodes and converter utility
3. **Shared Library**: tsup-based build with prop-based API configuration
4. **JWT Tokens**: httpOnly cookies with middleware injection and automatic refresh
5. **Dispatcher UI**: Multi-layered approach with inline feedback and modal disambiguation
6. **Component Migration**: Phased approach with thorough testing
7. **Workflow Recovery**: UI for both options, capability depends on agent-server
8. **Settings Override**: Strictly honor user settings
9. **Personal Agents**: Private to creator, enforced at API level
10. **Custom Tools**: Python code editor in UI, execution in agent-server

These decisions provide a solid foundation for Phase 1 implementation. No critical unknowns remain.
