# Development Setup Guide

**Created**: 2026-01-19  
**Last Updated**: 2026-01-19  
**Status**: Active  
**Category**: Development  
**Related Docs**:
- `../guides/AUTHENTICATION.md`
- `../deployment/deployment-guide.md`

## Overview

This guide walks you through setting up a local development environment for the Agent Manager application.

---

## Prerequisites

### Required Software

- **Node.js**: v20 or later
- **npm**: v10 or later
- **Git**: For cloning the repository

### Required Services

The Agent Manager requires these backend services to be running:

- **Agent Server**: Python FastAPI backend (port 8000)
- **Ingest API**: File processing service (port 8001)
- **AuthZ Service**: Authentication service (port 8010)

You can either:
1. Run these services locally (see Busibox documentation)
2. Point to test environment services (recommended for frontend development)

---

## Step 1: Clone and Install

### Clone Repository

```bash
git clone <repository-url>
cd agent-manager
```

### Install Dependencies

```bash
npm install
```

This will install:
- Next.js 16.0.10
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- All required dependencies

---

## Step 2: Environment Configuration

### Create Environment File

```bash
cp env.example .env.local
```

### Configure Environment Variables

Edit `.env.local` with your settings:

```bash
# ============================================
# Backend API URLs
# ============================================

# Agent Server API (Python FastAPI)
NEXT_PUBLIC_AGENT_API_URL=http://10.96.201.202:4111  # test environment
# NEXT_PUBLIC_AGENT_API_URL=http://localhost:8000    # local development

# Ingest API (file processing)
NEXT_PUBLIC_INGEST_API_URL=http://10.96.201.206:8001  # test environment
# NEXT_PUBLIC_INGEST_API_URL=http://localhost:8001    # local development

# ============================================
# Authentication
# ============================================

# AuthZ Service (OAuth2 + RBAC)
AUTHZ_BASE_URL=http://10.96.200.210:8010
AUTHZ_CLIENT_ID=agent-manager
AUTHZ_CLIENT_SECRET=<your-secret-here>

# AI Portal (for SSO)
NEXT_PUBLIC_AI_PORTAL_URL=http://10.96.201.201:3000  # test environment
# NEXT_PUBLIC_AI_PORTAL_URL=http://localhost:3000    # local ai-portal

# ============================================
# Application Settings
# ============================================

# Development server port
PORT=3001

# Base path (leave empty for local dev)
NEXT_PUBLIC_BASE_PATH=

# ============================================
# Optional Settings
# ============================================

# Enable debug logging
# DEBUG=true
```

### Getting AuthZ Credentials

Contact your infrastructure administrator to get:
- `AUTHZ_CLIENT_ID`: Should be `agent-manager`
- `AUTHZ_CLIENT_SECRET`: Unique secret for your client

Or check the Ansible vault:
```bash
cd /path/to/busibox/provision/ansible
ansible-vault view group_vars/test/vault.yml | grep agent_manager
```

---

## Step 3: Start Development Server

### Standard Development Mode

```bash
npm run dev
```

This starts the Next.js development server with:
- **Port**: 3001 (configured in package.json)
- **Hot Reload**: Automatic on file changes
- **Fast Refresh**: React Fast Refresh enabled
- **Turbopack**: Fast bundler (default in Next.js 16)

### Webpack Mode (if needed)

```bash
npm run dev:webpack
```

Use this if you encounter Turbopack-specific issues.

### Access the Application

Open your browser to:
```
http://localhost:3001
```

---

## Step 4: Verify Setup

### Test Health Endpoint

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

### Test Backend Connectivity

```bash
# Test agent server
curl http://10.96.201.202:4111/health

# Test ingest API
curl http://10.96.201.206:8001/health

# Test authz service
curl http://10.96.200.210:8010/health
```

All should return `{"status": "ok"}` or similar.

### Test Authentication Flow

1. Navigate to http://localhost:3001
2. You should be redirected to AI Portal for login
3. After login, you'll be redirected back with an SSO token
4. The token should be exchanged for an authz token automatically
5. You should see the agent manager interface

---

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on changes)
npm run test:watch

# With coverage report
npm run test:coverage

# Interactive UI
npm run test:ui
```

### Type Checking

```bash
# Check TypeScript types
npx tsc --noEmit

# Or use the IDE (VS Code, Cursor, etc.)
# TypeScript errors will show inline
```

### Linting

```bash
# Run ESLint
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

---

## Project Structure

```
agent-manager/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (proxy to backend)
│   ├── agents/            # Agent management pages
│   ├── chat/              # Chat interface
│   ├── simulator/         # Agent simulator
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── agents/           # Agent-related components
│   ├── chat/             # Chat components
│   └── ui/               # Shared UI components
├── lib/                   # Utilities and clients
│   ├── agent-api-client.ts    # Agent server client
│   ├── ingest-api-client.ts   # Ingest API client
│   ├── auth-helper.ts         # Auth utilities
│   └── types.ts               # TypeScript types
├── docs/                  # Documentation
├── specs/                 # Specifications
└── test/                  # Test setup
```

---

## Common Development Tasks

### Adding a New Page

1. Create page file:
   ```typescript
   // app/my-page/page.tsx
   export default function MyPage() {
     return <div>My Page</div>;
   }
   ```

2. Access at: http://localhost:3001/my-page

### Adding an API Route

1. Create route file:
   ```typescript
   // app/api/my-endpoint/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   
   export async function GET(request: NextRequest) {
     return NextResponse.json({ message: 'Hello' });
   }
   ```

2. Call from frontend:
   ```typescript
   const response = await fetch('/api/my-endpoint');
   const data = await response.json();
   ```

### Adding a Component

1. Create component file:
   ```typescript
   // components/MyComponent.tsx
   export function MyComponent({ title }: { title: string }) {
     return <h1>{title}</h1>;
   }
   ```

2. Use in pages:
   ```typescript
   import { MyComponent } from '@/components/MyComponent';
   
   export default function Page() {
     return <MyComponent title="Hello" />;
   }
   ```

---

## Troubleshooting

### Port Already in Use

**Error**: `Port 3001 is already in use`

**Solution**:
```bash
# Find process using port 3001
lsof -ti:3001

# Kill the process
kill -9 $(lsof -ti:3001)

# Or use a different port
PORT=3002 npm run dev
```

### Module Not Found

**Error**: `Module not found: Can't resolve '@/...'`

**Solution**:
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
```

### TypeScript Errors

**Error**: Various TypeScript compilation errors

**Solution**:
```bash
# Check for errors
npx tsc --noEmit

# Update types
npm install --save-dev @types/node @types/react @types/react-dom

# Restart TypeScript server in IDE
# VS Code: Cmd+Shift+P -> "TypeScript: Restart TS Server"
```

### Backend Connection Failed

**Error**: `Failed to fetch from agent-server`

**Solutions**:
1. Verify backend services are running
2. Check environment variable URLs
3. Test connectivity with curl
4. Check network/firewall settings

### Authentication Errors

**Error**: `Token exchange failed` or `Unauthorized`

**Solutions**:
1. Verify AUTHZ_CLIENT_SECRET is correct
2. Check authz service is running
3. Ensure AI Portal is accessible
4. Clear browser cookies and try again

---

## IDE Setup

### VS Code / Cursor

Recommended extensions:
- **ESLint**: For linting
- **Prettier**: For code formatting
- **TypeScript**: Built-in, ensure it's enabled
- **Tailwind CSS IntelliSense**: For CSS class autocomplete

Settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Environment Variables in IDE

Create `.env.local` for IDE to recognize environment variables.

---

## Testing Strategy

### Unit Tests

Test individual functions and components:
```typescript
// lib/auth-helper.test.ts
import { extractUserId } from './auth-helper';

test('extracts user ID from token', () => {
  const token = 'eyJ...';
  const userId = extractUserId(token);
  expect(userId).toBe('user-123');
});
```

### Component Tests

Test React components:
```typescript
// components/AgentCard.test.tsx
import { render, screen } from '@testing-library/react';
import { AgentCard } from './AgentCard';

test('renders agent name', () => {
  render(<AgentCard agent={{ id: '1', name: 'Test Agent' }} />);
  expect(screen.getByText('Test Agent')).toBeInTheDocument();
});
```

### Integration Tests

Test API routes and flows:
```typescript
// app/api/agents/route.test.ts
import { GET } from './route';

test('returns list of agents', async () => {
  const request = new Request('http://localhost/api/agents');
  const response = await GET(request);
  const data = await response.json();
  expect(Array.isArray(data)).toBe(true);
});
```

---

## Performance Tips

### Development Performance

- Use Turbopack (default in Next.js 16)
- Keep component tree shallow
- Use React.memo() for expensive components
- Lazy load heavy components

### Build Performance

- Enable caching in next.config.ts
- Use Server Components where possible
- Minimize client-side JavaScript

---

## Next Steps

After setup:
1. Read [Architecture Overview](../architecture/overview.md)
2. Review [Authentication Guide](../guides/AUTHENTICATION.md)
3. Explore the codebase
4. Run tests to verify everything works
5. Make your first change!

---

## Getting Help

- **Documentation**: Check `/docs` directory
- **Code Examples**: Look at existing components
- **Busibox Docs**: Infrastructure documentation
- **Team**: Ask your team members

---

**Setup Complete!** 🎉

You're now ready to develop the Agent Manager application.
