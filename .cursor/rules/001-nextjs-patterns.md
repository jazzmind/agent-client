# Next.js App Router Patterns

**Purpose**: Ensure consistent Next.js 15 App Router usage across the Agent Manager application

## Directory Structure

```
app/
├── admin/                    # Admin pages
├── agent/[id]/              # Agent detail views
├── agents/                  # Agent listing
├── api/                     # API routes (proxy to backend)
│   ├── admin/              # Admin API routes
│   ├── agents/             # Agent CRUD
│   ├── auth/               # Authentication
│   ├── chat/               # Chat functionality
│   ├── conversations/      # Conversation management
│   ├── runs/               # Agent run execution
│   ├── tools/              # Tool configuration
│   └── workflows/          # Workflow execution
├── simulator/              # Agent simulator
├── tools/                  # Tool management
└── workflows/              # Workflow builder

components/
├── admin/                  # Admin components
├── agents/                 # Agent components
├── chat/                   # Chat interface
├── conversations/          # Conversation components
├── tools/                  # Tool components
└── workflow/               # Workflow builder

hooks/                      # React hooks
lib/                        # Utilities and API clients
```

## Key Architecture Principle

**NO DIRECT DATABASE ACCESS**

This application is a frontend-only app. All data operations go through backend APIs:
- **Agent Server API**: Conversations, agents, runs
- **Ingest API**: File uploads, RAG search

```typescript
// ✅ Good: Proxy to backend API
export async function GET(request: NextRequest) {
  const response = await fetch(`${AGENT_API_URL}/agents`);
  return NextResponse.json(await response.json());
}

// ❌ Bad: Direct database access
export async function GET(request: NextRequest) {
  const agents = await prisma.agent.findMany(); // NO!
  return NextResponse.json(agents);
}
```

## Component Patterns

### Server vs Client Components

**Default to Server Components**:
```typescript
// ✅ Good: Server Component (default)
// app/agents/page.tsx
export default async function AgentsPage() {
  const agents = await fetchAgents();
  return <AgentList agents={agents} />;
}
```

**Use Client Components when needed**:
```typescript
// ✅ Good: Client Component for interactivity
// components/chat/ChatInterface.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRunStream } from '@/hooks/useRunStream';

export function ChatInterface({ agentId }: { agentId: string }) {
  const [messages, setMessages] = useState([]);
  const { stream, isStreaming } = useRunStream();
  
  // Client-side state and effects
}
```

### When to use 'use client'

Use Client Components for:
- ✅ useState, useEffect, useReducer
- ✅ Event handlers (onClick, onChange)
- ✅ SSE streaming (useRunStream)
- ✅ Real-time updates
- ✅ Browser APIs

Keep as Server Components:
- ✅ Data fetching from APIs
- ✅ Static page layouts
- ✅ Large dependencies

## Page Patterns

### Static Pages

```typescript
// app/agents/page.tsx
export default async function AgentsPage() {
  const agents = await fetchAgents();
  return <AgentList agents={agents} />;
}
```

### Dynamic Pages

```typescript
// app/agent/[id]/page.tsx
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentPage({ params }: PageProps) {
  const { id } = await params;
  const agent = await fetchAgent(id);
  
  if (!agent) {
    notFound();
  }
  
  return <AgentDetail agent={agent} />;
}
```

## API Route Patterns (Proxy Routes)

All API routes should proxy to backend services:

### Basic Proxy

```typescript
// app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const response = await fetch(`${AGENT_API_URL}/agents`, {
    headers: {
      'Authorization': `Bearer ${session.token}`,
    },
  });

  return NextResponse.json(await response.json(), { 
    status: response.status 
  });
}
```

### Proxy with Body

```typescript
// app/api/agents/route.ts
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const response = await fetch(`${AGENT_API_URL}/agents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return NextResponse.json(await response.json(), { 
    status: response.status 
  });
}
```

### Dynamic Proxy Route

```typescript
// app/api/agents/[id]/route.ts
interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  
  const response = await fetch(`${AGENT_API_URL}/agents/${id}`, {
    headers: {
      'Authorization': `Bearer ${session.token}`,
    },
  });

  return NextResponse.json(await response.json(), { 
    status: response.status 
  });
}
```

## SSE Streaming Pattern

For real-time agent responses:

```typescript
// app/api/streams/runs/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  
  const response = await fetch(`${AGENT_API_URL}/runs/${id}/stream`, {
    headers: {
      'Accept': 'text/event-stream',
      'Authorization': `Bearer ${token}`,
    },
  });

  return new NextResponse(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

```typescript
// hooks/useRunStream.ts
'use client';

export function useRunStream(runId: string) {
  const [events, setEvents] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!runId) return;

    const eventSource = new EventSource(`/api/streams/runs/${runId}`);
    setIsStreaming(true);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents((prev) => [...prev, data]);
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsStreaming(false);
    };

    return () => {
      eventSource.close();
      setIsStreaming(false);
    };
  }, [runId]);

  return { events, isStreaming };
}
```

## Loading and Error States

### Loading UI

```typescript
// app/agents/loading.tsx
export default function AgentsLoading() {
  return <AgentListSkeleton />;
}
```

### Error Handling

```typescript
// app/agents/error.tsx
'use client';

export default function AgentsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-4">
      <h2>Failed to load agents</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Retry</button>
    </div>
  );
}
```

## AI Agent Instructions

When working with Next.js in Agent Manager:

1. **Never access database directly** - All data via backend APIs
2. **Proxy all API routes** - Forward to Agent Server or Ingest API
3. **Handle SSE properly** - Use EventSource for streaming
4. **Check component type** - Server vs Client
5. **Type params properly** - Use Promise types

When creating API routes:

1. **Always proxy** - Forward to backend service
2. **Add authentication** - Check session and forward token
3. **Handle errors** - Return appropriate status codes
4. **Support streaming** - For run execution endpoints
