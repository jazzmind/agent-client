# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and Cursor AI when working with code in this repository.

## Project Overview

**Agent Manager** is a Next.js application for managing and interacting with AI agents in the Busibox infrastructure. It provides agent configuration, workflow building, tool management, and a chat simulator for testing agents.

## Quick Start

### Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage

# Linting
npm run lint
```

### Environment Setup

```bash
cp env.example .env.local
# Edit .env.local with your settings
```

### Deployment

**From Busibox Admin Workstation**:
```bash
cd /path/to/busibox/provision/ansible

# Deploy to production:
make deploy-agent-client

# Deploy to test environment:
make deploy-agent-client INV=inventory/test
```

## Architecture

### Tech Stack

- **Framework**: Next.js 15.5 (App Router)
- **UI**: React 19, TypeScript 5, Tailwind CSS 4
- **APIs**: Agent Server, Ingest API (no direct database access)
- **Deployment**: PM2, nginx (apps-lxc container)

### Project Structure

```
agent-manager/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin pages
│   ├── agent/[id]/        # Agent detail views
│   ├── agents/            # Agent listing
│   ├── api/               # API routes (38 routes)
│   │   ├── admin/         # Admin API routes
│   │   ├── agents/        # Agent CRUD
│   │   ├── auth/          # Authentication
│   │   ├── chat/          # Chat functionality
│   │   ├── conversations/ # Conversation management
│   │   ├── runs/          # Agent run management
│   │   ├── tools/         # Tool configuration
│   │   └── workflows/     # Workflow execution
│   ├── simulator/         # Agent chat simulator
│   ├── tools/             # Tool management pages
│   └── workflows/         # Workflow builder pages
├── components/            # React components
│   ├── admin/            # 9 admin components
│   ├── agents/           # Agent components
│   ├── chat/             # 11 chat components
│   ├── conversations/    # Conversation components
│   ├── tools/            # Tool components
│   └── workflow/         # Workflow builder components
├── hooks/                # React hooks
│   ├── useChatMessages.ts
│   └── useRunStream.ts
├── lib/                  # Utilities and API clients
├── docs/                 # Documentation
│   ├── architecture/     # System design
│   ├── deployment/       # Deploy guides
│   └── development/      # Dev workflows
├── specs/                # Specifications (for speckit)
└── test/                 # Test setup
```

### Key Principle

**No Direct Database Access**: All data operations go through backend APIs:
- Agent Server API for conversations, agents, runs
- Ingest API for file uploads, RAG search

## Key Features

### 1. Agent Management
- Create and configure AI agents
- Edit agent prompts and settings
- View agent performance

### 2. Chat Interface
- Interactive chat with agents
- Real-time SSE streaming for responses
- File upload support for RAG

### 3. Workflow Builder
- Visual workflow designer
- Workflow execution and monitoring
- Step-by-step execution tracking

### 4. Tool Management
- Configure agent tools
- Test tool functionality
- Manage tool permissions

### 5. Agent Simulator
- Test agents in isolation
- Debug agent behavior
- Session management

## API Routes

The application proxies requests to backend services:

| Route Pattern | Backend | Purpose |
|--------------|---------|---------|
| `/api/agents/*` | Agent Server | Agent CRUD operations |
| `/api/conversations/*` | Agent Server | Conversation management |
| `/api/runs/*` | Agent Server | Agent run execution |
| `/api/chat/*` | Agent Server | Chat functionality |
| `/api/tools/*` | Agent Server | Tool configuration |
| `/api/workflows/*` | Agent Server | Workflow execution |
| `/api/upload/*` | Ingest API | File uploads |
| `/api/admin/*` | Agent Server | Admin operations |

## Development Workflow

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes and test locally**:
   ```bash
   npm run dev
   # Test in browser at http://localhost:3000
   ```

3. **Run tests**:
   ```bash
   npm test
   ```

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature
   ```

### Adding a New Feature

1. **Plan the feature**:
   - Determine required API routes
   - Design UI components
   - Identify backend dependencies

2. **Create API routes** (if needed):
   ```typescript
   // app/api/your-feature/route.ts
   export async function GET(request: Request) {
     // Proxy to backend API
   }
   ```

3. **Create components**:
   ```typescript
   // components/your-feature/YourComponent.tsx
   export function YourComponent() {
     // Implementation
   }
   ```

4. **Add pages**:
   ```typescript
   // app/your-feature/page.tsx
   export default function YourFeaturePage() {
     // Implementation
   }
   ```

## Environment Variables

```bash
# Agent Server API
NEXT_PUBLIC_AGENT_API_URL=http://agent-lxc:8000

# Ingest API
NEXT_PUBLIC_INGEST_API_URL=http://ingest-lxc:8001

# Auth
AUTH_SECRET=your-secret-key
```

See `env.example` for complete configuration.

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Manual Testing

1. **Agent Creation**:
   - Create new agent
   - Configure prompts
   - Test with simulator

2. **Chat Flow**:
   - Start conversation
   - Send messages
   - Verify streaming responses

3. **Workflow Builder**:
   - Create workflow
   - Execute workflow
   - Monitor execution

## Integration with Busibox

Agent Manager is deployed and managed through the Busibox infrastructure:

### Service Dependencies

- **Agent Server** (agent-lxc): Agent operations, conversations
- **Ingest API** (ingest-lxc): File uploads, RAG search
- **Apps Container** (apps-lxc): Hosts the Next.js application

### Deployment Flow

1. **Code Changes**: Pushed to GitHub
2. **Busibox Ansible**: Pulls changes and deploys
3. **Apps Container**: Runs the application with PM2
4. **Proxy Container**: Routes traffic via nginx

## Best Practices

### Code Style

- Use TypeScript for type safety
- Follow Next.js App Router conventions
- Use Server Components by default, Client Components when needed
- Keep components small and focused
- Use Tailwind CSS for styling

### API Routes

- All API routes should proxy to backend services
- Handle errors gracefully
- Add proper typing for request/response

### Components

- Prefer composition over inheritance
- Use React Server Components where possible
- Implement proper loading states
- Handle error states

## Troubleshooting

### Connection Issues

```bash
# Check Agent Server health
curl http://agent-lxc:8000/health

# Check Ingest API health
curl http://ingest-lxc:8001/health
```

### Build Issues

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### PM2 Issues (on apps-lxc)

```bash
pm2 list                    # Check status
pm2 logs agent-client       # View logs
pm2 restart agent-client    # Restart app
```

## Documentation

- **Architecture**: `docs/architecture/`
- **Deployment**: `docs/deployment/`
- **Development**: `docs/development/`
- **Workflows**: `docs/workflow-*.md`

## Related Projects

- **Busibox**: Infrastructure and deployment
- **AI Portal**: Main dashboard application
- **Busibox-App**: Shared component library
- **Agent Server**: Backend agent service (Python FastAPI)

## Important Notes

1. **No Database Access**: This app only calls APIs, never accesses databases directly
2. **SSE Streaming**: Agent responses use Server-Sent Events for real-time updates
3. **Deployment**: Always deploy to test environment first
4. **PM2**: Application runs under PM2 on apps-lxc container
