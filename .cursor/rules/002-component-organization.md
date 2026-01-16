# Component Organization Rules

**Purpose**: Ensure consistent component organization in the Agent Manager application

## Directory Structure

```
components/
├── admin/              # Admin-specific components (9)
│   ├── ClientManagement.tsx
│   ├── ModelManagement.tsx
│   └── ...
├── agents/             # Agent management components (2)
│   ├── AgentCard.tsx
│   └── AgentForm.tsx
├── auth/               # Authentication components (2)
│   └── LoginForm.tsx
├── chat/               # Chat interface components (11)
│   ├── ChatMessage.tsx
│   ├── ChatInput.tsx
│   ├── ChatContainer.tsx
│   └── ...
├── conversations/      # Conversation management (6)
│   ├── ConversationList.tsx
│   ├── ConversationCard.tsx
│   └── ...
├── tools/              # Tool management components (7)
│   ├── ToolCard.tsx
│   ├── ToolForm.tsx
│   └── ...
├── workflow/           # Workflow builder components (4)
│   ├── WorkflowCanvas.tsx
│   ├── WorkflowNode.tsx
│   └── ...
├── CustomHeader.tsx    # Custom header component
└── FetchWrapper.tsx    # Data fetching wrapper
```

## Placement Rules

### Feature Components

**IF** creating a feature-specific component:
- **Agent management** → `components/agents/`
- **Chat interface** → `components/chat/`
- **Conversations** → `components/conversations/`
- **Tool management** → `components/tools/`
- **Workflow builder** → `components/workflow/`

### Admin Components

**IF** creating admin-only components:
- **PLACE IN**: `components/admin/`
- **EXAMPLE**: `components/admin/ModelManagement.tsx`

### Simulator Components

**IF** creating simulator components:
- **PLACE IN**: `app/simulator/components/`
- **EXAMPLE**: `app/simulator/components/AgentSelector.tsx`

## Component Patterns

### Chat Components

```typescript
// components/chat/ChatMessage.tsx
'use client';

import { Message } from '@/lib/types';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  return (
    <div className={`message ${message.role}`}>
      <div className="content">
        {message.content}
        {isStreaming && <span className="cursor" />}
      </div>
    </div>
  );
}
```

### Workflow Components

```typescript
// components/workflow/WorkflowNode.tsx
'use client';

import { Node } from '@/lib/workflow-types';

interface WorkflowNodeProps {
  node: Node;
  onSelect: (node: Node) => void;
  onDelete: (nodeId: string) => void;
  isSelected: boolean;
}

export function WorkflowNode({ 
  node, 
  onSelect, 
  onDelete, 
  isSelected 
}: WorkflowNodeProps) {
  return (
    <div 
      className={`workflow-node ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(node)}
    >
      <div className="node-header">
        <span>{node.name}</span>
        <button onClick={() => onDelete(node.id)}>×</button>
      </div>
      <div className="node-content">
        {node.type}
      </div>
    </div>
  );
}
```

### Tool Components

```typescript
// components/tools/ToolForm.tsx
'use client';

import { useState } from 'react';
import { Tool, ToolConfig } from '@/lib/types';

interface ToolFormProps {
  tool?: Tool;
  onSubmit: (data: ToolConfig) => Promise<void>;
  onCancel: () => void;
}

export function ToolForm({ tool, onSubmit, onCancel }: ToolFormProps) {
  const [config, setConfig] = useState<ToolConfig>(
    tool?.config || { name: '', type: 'function' }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(config);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Hooks

Custom hooks go in the `hooks/` directory:

```typescript
// hooks/useChatMessages.ts
'use client';

import { useState, useCallback } from 'react';
import { Message } from '@/lib/types';

export function useChatMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ conversationId, content }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  return { messages, sendMessage, isLoading };
}
```

```typescript
// hooks/useRunStream.ts
'use client';

import { useState, useEffect } from 'react';
import { RunEvent } from '@/lib/types';

export function useRunStream(runId: string | null) {
  const [events, setEvents] = useState<RunEvent[]>([]);
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

    return () => eventSource.close();
  }, [runId]);

  return { events, isStreaming };
}
```

## Naming Conventions

### Files
- **Components**: PascalCase (`ChatMessage.tsx`)
- **Hooks**: camelCase with 'use' prefix (`useChatMessages.ts`)
- **Types**: camelCase (`types.ts`) or PascalCase for standalone (`Message.ts`)

### Exports
- **Components**: Named exports preferred
- **Hooks**: Named exports with 'use' prefix

### Props
- **Interface name**: `{ComponentName}Props`
- **Event handlers**: `on{Event}` pattern

## Import Patterns

### Path Aliases

```typescript
// ✅ Good: Use path aliases
import { ChatMessage } from '@/components/chat';
import { useChatMessages } from '@/hooks/useChatMessages';
import { Message } from '@/lib/types';

// ❌ Bad: Relative imports for distant files
import { ChatMessage } from '../../../components/chat';
```

### Barrel Exports

```typescript
// components/chat/index.ts
export { ChatMessage } from './ChatMessage';
export { ChatInput } from './ChatInput';
export { ChatContainer } from './ChatContainer';

// Usage
import { ChatMessage, ChatInput } from '@/components/chat';
```

## Decision Tree

```
START: I need to create a component

Q1: Is it for the chat interface?
├─ Yes → components/chat/
└─ No
   Q2: Is it for workflows?
   ├─ Yes → components/workflow/
   └─ No
      Q3: Is it for tool management?
      ├─ Yes → components/tools/
      └─ No
         Q4: Is it for conversations?
         ├─ Yes → components/conversations/
         └─ No
            Q5: Is it for agents?
            ├─ Yes → components/agents/
            └─ No
               Q6: Is it admin-only?
               ├─ Yes → components/admin/
               └─ No
                  Q7: Is it for the simulator?
                  ├─ Yes → app/simulator/components/
                  └─ No → Consider if it's shared/reusable
```

## AI Agent Instructions

When creating components:

1. **Determine feature area** - Use decision tree
2. **Check for existing** - Don't duplicate
3. **Use 'use client'** - Most components need interactivity
4. **Export correctly** - Named exports, barrel files
5. **Add types** - Props interface required

When reviewing components:

1. **Check placement** - Right directory?
2. **Check interactivity** - Needs 'use client'?
3. **Check imports** - Using path aliases?
4. **Check hooks** - Custom hooks in hooks/?
