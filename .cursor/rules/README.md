# Agent Manager Cursor Rules

This directory contains rules for AI agents (Cursor, Claude Code, etc.) to follow when working on the Agent Manager application.

## Purpose

These rules ensure:
- **Consistency** - Code follows Next.js 15 App Router best practices
- **Architecture** - Frontend-only pattern is maintained (no direct DB access)
- **Quality** - Components and APIs are properly structured
- **Maintainability** - Code is organized predictably

## Rule Files

### Core Rules (001-099)
- **001-nextjs-patterns.md** - Next.js patterns with frontend-only architecture
- **002-component-organization.md** - Component structure for chat, workflows, tools

### Auto-Generated
- **specify-rules.mdc** - Auto-generated from speckit feature plans

## Key Architecture Principle

**NO DIRECT DATABASE ACCESS**

Agent Manager is a frontend-only application. All data operations must go through backend APIs:
- **Agent Server API** - Conversations, agents, runs, tools
- **Ingest API** - File uploads, RAG search

```typescript
// ✅ Correct: Proxy to backend
const response = await fetch(`${AGENT_API_URL}/agents`);

// ❌ Wrong: Direct database
const agents = await prisma.agent.findMany(); // NEVER DO THIS
```

## Quick Reference

### "Where should I create this component?"
1. **Chat UI** → `components/chat/`
2. **Workflow Builder** → `components/workflow/`
3. **Tool Management** → `components/tools/`
4. **Conversations** → `components/conversations/`
5. **Agent Management** → `components/agents/`
6. **Admin UI** → `components/admin/`
7. **Simulator** → `app/simulator/components/`

### "Where should I create this hook?"
- Custom hooks go in `hooks/`
- Examples: `useChatMessages.ts`, `useRunStream.ts`

### "How should I create this API route?"
1. **Always proxy** to Agent Server or Ingest API
2. Add authentication check
3. Forward token to backend
4. Handle SSE for streaming endpoints

### "Should this be a Server or Client Component?"
- **Most components**: Client Component (interactivity needed)
- **Page layouts**: Can be Server Component
- **Data fetching**: Can be Server Component (but data comes from API)

## Tech Stack

- **Framework**: Next.js 15.5 (App Router)
- **Language**: TypeScript 5
- **UI**: React 19, Tailwind CSS 4
- **APIs**: Agent Server, Ingest API
- **Deployment**: PM2 on apps-lxc

## Related Documentation

- **CLAUDE.md** - Main AI guidance file
- **docs/** - Architecture and development guides
- **specs/** - Speckit specifications
