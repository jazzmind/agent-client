# Quickstart Guide: Agent Management System Rebuild

**Date**: 2025-12-11  
**Feature**: Agent Management System Rebuild  
**Branch**: `001-agent-management-rebuild`

## Overview

This guide provides step-by-step instructions for setting up the development environment, running the application locally, testing, and deploying to production.

---

## Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: For version control
- **Agent-Server**: Running at http://localhost:8000 (development) or http://10.96.200.31:8000 (production)
- **Authentication**: Valid JWT token from Busibox auth service

---

## Local Development Setup

### 1. Clone Repositories

```bash
# Clone agent-manager
cd ~/Code/sonnenreich
git clone <repo-url> agent-manager
cd agent-manager
git checkout 001-agent-management-rebuild

# Clone busibox-ui (shared library)
cd ~/Code/sonnenreich
git clone <repo-url> busibox-ui
cd busibox-ui
```

### 2. Install Dependencies

**busibox-ui** (shared library):
```bash
cd ~/Code/sonnenreich/busibox-ui
npm install
npm run build

# Link for local development
npm link
```

**agent-manager**:
```bash
cd ~/Code/sonnenreich/agent-manager
npm install

# Link to local busibox-ui
npm link @busibox/ui
```

### 3. Configure Environment

**agent-manager**:
```bash
cd ~/Code/sonnenreich/agent-manager
cp env.example .env.local
```

Edit `.env.local`:
```bash
# Agent Server
NEXT_PUBLIC_AGENT_SERVER_URL=http://localhost:8000
AGENT_SERVER_URL=http://localhost:8000

# Authentication
NEXT_PUBLIC_AUTH_URL=http://localhost:3001
JWT_SECRET=your-jwt-secret-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Start Development Servers

**Terminal 1 - busibox-ui** (watch mode):
```bash
cd ~/Code/sonnenreich/busibox-ui
npm run dev
```

**Terminal 2 - agent-manager**:
```bash
cd ~/Code/sonnenreich/agent-manager
npm run dev
```

**Terminal 3 - agent-server** (if running locally):
```bash
cd ~/Code/sonnenreich/busibox/srv/agent
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 5. Access Application

- **Agent Client**: http://localhost:3000
- **Storybook**: http://localhost:6006 (run `npm run storybook`)
- **Agent Server**: http://localhost:8000 (API)
- **Agent Server Docs**: http://localhost:8000/docs (Swagger UI)

---

## Running Tests

### Unit Tests

```bash
cd ~/Code/sonnenreich/agent-manager

# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# With coverage report
npm run test:coverage

# Run specific test file
npm test lib/agent-api-client.test.ts
```

### Component Tests (Storybook)

```bash
cd ~/Code/sonnenreich/agent-manager

# Start Storybook
npm run storybook

# Build Storybook for static hosting
npm run build-storybook
```

### Integration Tests

```bash
cd ~/Code/sonnenreich/agent-manager

# Requires agent-server running
npm run test:integration

# Or run specific integration test
npm test tests/integration/chat-flow.test.ts
```

### Testing busibox-ui Components

```bash
cd ~/Code/sonnenreich/busibox-ui

# Run unit tests
npm test

# Watch mode
npm run test:watch

# Storybook
npm run storybook
```

---

## Building for Production

### Build busibox-ui

```bash
cd ~/Code/sonnenreich/busibox-ui
npm run build

# Verify build output
ls dist/
# Should see: index.js, index.mjs, index.d.ts, chat/...
```

### Build agent-manager

```bash
cd ~/Code/sonnenreich/agent-manager
npm run build

# Verify build
npm start
# Should start on port 3000
```

---

## Deployment

### Deploy to Test Environment

**From admin workstation**:
```bash
cd ~/Code/sonnenreich/busibox/provision/ansible

# Deploy agent-manager to test
make deploy-agent-manager INV=inventory/test

# Verify deployment
ssh root@<test-apps-ip>
pm2 list
pm2 logs agent-manager
```

### Deploy to Production

**From admin workstation**:
```bash
cd ~/Code/sonnenreich/busibox/provision/ansible

# Deploy agent-manager to production
make deploy-agent-manager

# Verify deployment
ssh root@<prod-apps-ip>
pm2 list
pm2 logs agent-manager
```

### Manual Deployment (if needed)

**On apps-lxc container**:
```bash
# SSH into container
ssh root@<apps-ip>

# Navigate to app directory
cd /srv/apps/agent-manager

# Pull latest changes
git fetch origin
git checkout 001-agent-management-rebuild
git pull origin 001-agent-management-rebuild

# Install dependencies
npm install

# Build application
npm run build

# Restart PM2
pm2 restart agent-manager

# Check logs
pm2 logs agent-manager --lines 50
```

---

## Development Workflow

### Working on a Feature

1. **Create feature branch** (from `001-agent-management-rebuild`):
   ```bash
   git checkout -b feature/chat-dispatcher
   ```

2. **Make changes**:
   - Edit files in `agent-manager/` or `busibox-ui/`
   - Hot reload will update automatically

3. **Write tests**:
   ```bash
   # Create test file
   touch tests/unit/dispatcher.test.ts
   
   # Run tests in watch mode
   npm run test:watch
   ```

4. **Test in Storybook** (for components):
   ```bash
   # Create story
   touch components/chat/DispatcherSettings.stories.tsx
   
   # View in Storybook
   npm run storybook
   ```

5. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: add dispatcher settings UI"
   git push origin feature/chat-dispatcher
   ```

6. **Merge to main feature branch**:
   ```bash
   git checkout 001-agent-management-rebuild
   git merge feature/chat-dispatcher
   git push origin 001-agent-management-rebuild
   ```

### Working on busibox-ui

When making changes to busibox-ui that affect agent-manager:

1. **Make changes in busibox-ui**:
   ```bash
   cd ~/Code/sonnenreich/busibox-ui
   # Edit files
   npm run build
   ```

2. **Test in agent-manager**:
   ```bash
   cd ~/Code/sonnenreich/agent-manager
   # Changes are automatically available via npm link
   npm run dev
   ```

3. **Commit and version**:
   ```bash
   cd ~/Code/sonnenreich/busibox-ui
   
   # Update version in package.json
   npm version patch  # or minor, major
   
   # Commit
   git add .
   git commit -m "feat: add chat component X"
   git push
   
   # Publish (if using npm registry)
   npm publish
   ```

4. **Update agent-manager dependency**:
   ```bash
   cd ~/Code/sonnenreich/agent-manager
   npm install @busibox/ui@latest
   ```

---

## Common Tasks

### Add a New Component

```bash
# In agent-manager
touch components/admin/NewComponent.tsx
touch components/admin/NewComponent.stories.tsx
touch tests/unit/NewComponent.test.ts

# Implement component
# Write story
# Write tests

# View in Storybook
npm run storybook
```

### Add a New API Route

```bash
# Create route file
touch app/api/new-endpoint/route.ts

# Implement GET/POST/etc handlers
# Add to agent-api-client.ts

# Test
npm test lib/agent-api-client.test.ts
```

### Add a New Hook

```bash
# Create hook file
touch hooks/useNewFeature.ts

# Implement hook
# Write tests
touch tests/unit/useNewFeature.test.ts

# Use in component
```

### Debug SSE Streaming

```bash
# Check SSE connection in browser DevTools
# Network tab → Filter by "event-stream"

# Check agent-server logs
ssh root@<agent-ip>
journalctl -u agent-api -f

# Check agent-manager logs
pm2 logs agent-manager
```

### Run Linting

```bash
cd ~/Code/sonnenreich/agent-manager

# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Type check
npm run type-check
```

---

## Troubleshooting

### Issue: busibox-ui changes not reflecting in agent-manager

**Solution**:
```bash
# Rebuild busibox-ui
cd ~/Code/sonnenreich/busibox-ui
npm run build

# Clear Next.js cache in agent-manager
cd ~/Code/sonnenreich/agent-manager
rm -rf .next
npm run dev
```

### Issue: TypeScript errors after updating busibox-ui

**Solution**:
```bash
# Regenerate type definitions
cd ~/Code/sonnenreich/busibox-ui
npm run build

# Restart TypeScript server in agent-manager
# In VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Issue: SSE connection keeps dropping

**Solution**:
- Check agent-server is running and accessible
- Verify JWT token is valid (check browser cookies)
- Check network connectivity
- Review agent-server logs for errors
- Ensure no proxy/firewall blocking SSE

### Issue: Tests failing with "Cannot find module @busibox/ui"

**Solution**:
```bash
# Ensure busibox-ui is linked
cd ~/Code/sonnenreich/busibox-ui
npm link

cd ~/Code/sonnenreich/agent-manager
npm link @busibox/ui

# Or install from registry
npm install @busibox/ui@latest
```

### Issue: Agent-server returns 401 Unauthorized

**Solution**:
- Check JWT token in request headers
- Verify token hasn't expired
- Check `.env.local` has correct `JWT_SECRET`
- Ensure better-auth is configured correctly
- Check agent-server authentication middleware

---

## Key Configuration Files

### agent-manager

- **`.env.local`**: Environment variables (not committed)
- **`next.config.ts`**: Next.js configuration
- **`tsconfig.json`**: TypeScript configuration
- **`vitest.config.ts`**: Test configuration
- **`package.json`**: Dependencies and scripts

### busibox-ui

- **`tsup.config.ts`**: Build configuration
- **`package.json`**: Library metadata and peer dependencies
- **`tsconfig.json`**: TypeScript configuration

---

## Useful Commands

### Development

```bash
# Start dev server
npm run dev

# Start Storybook
npm run storybook

# Type check (no emit)
npm run type-check

# Lint code
npm run lint
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# UI mode
npm run test:ui
```

### Building

```bash
# Build for production
npm run build

# Start production server
npm start

# Build Storybook
npm run build-storybook
```

### Deployment

```bash
# From busibox/provision/ansible

# Deploy to test
make deploy-agent-manager INV=inventory/test

# Deploy to production
make deploy-agent-manager
```

---

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_AGENT_SERVER_URL` | Agent-server API endpoint (public) | `http://localhost:8000` |
| `AGENT_SERVER_URL` | Agent-server API endpoint (server-side) | `http://10.96.200.31:8000` |
| `NEXT_PUBLIC_AUTH_URL` | Authentication service URL | `http://localhost:3001` |
| `JWT_SECRET` | Secret for JWT token validation | `your-secret-key` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |

---

## Next Steps

After completing setup:

1. **Verify agent-server connection**:
   - Visit http://localhost:3000
   - Check browser console for errors
   - Verify API calls to agent-server succeed

2. **Explore Storybook**:
   - Run `npm run storybook`
   - Browse chat components
   - Test component interactions

3. **Run tests**:
   - Run `npm test`
   - Verify all tests pass
   - Check coverage report

4. **Start development**:
   - Pick a task from `tasks.md`
   - Create feature branch
   - Implement, test, commit

---

## Additional Resources

- **Feature Spec**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Research Findings**: [research.md](./research.md)
- **API Contract**: [contracts/agent-server-api.yaml](./contracts/agent-server-api.yaml)
- **Agent-Server Docs**: http://localhost:8000/docs (when running)
- **Busibox Docs**: `~/Code/sonnenreich/busibox/docs/`

---

## Getting Help

1. **Check documentation** in `specs/001-agent-management-rebuild/`
2. **Review agent-server API docs** at http://localhost:8000/docs
3. **Check Busibox architecture docs** in `busibox/docs/architecture/`
4. **Review existing code** in `agent-manager/` and `ai-portal/`
5. **Check test examples** in `tests/` directories
6. **Ask team** for clarification on requirements or technical decisions
