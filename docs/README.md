# Agent Manager Documentation

**Created**: 2025-12-11  
**Last Updated**: 2026-01-19  
**Status**: Active  
**Category**: Reference  

## Overview

Complete documentation for the Agent Manager application - a Next.js frontend for managing and interacting with AI agents in the Busibox infrastructure.

---

## Quick Start

### New to Agent Manager?

1. **[Architecture Overview](architecture/overview.md)** - Understand the system design
2. **[Development Setup](development/setup.md)** - Set up your local environment
3. **[Authentication Guide](guides/AUTHENTICATION.md)** - Understand the auth flow

### Deploying?

1. **[Deployment Guide](deployment/deployment-guide.md)** - Complete deployment instructions
2. **[Architecture Integration](architecture/agent-server-integration.md)** - Backend integration details

---

## Documentation Structure

```
docs/
├── README.md (this file)
├── architecture/           # System design and architecture
│   ├── overview.md        # High-level architecture
│   └── agent-server-integration.md  # Backend integration
├── deployment/            # Deployment guides
│   └── deployment-guide.md  # Complete deployment instructions
├── development/           # Development guides
│   ├── setup.md          # Development environment setup
│   ├── testing.md        # Testing guide
│   └── workflow-system.md  # Workflow implementation
├── guides/                # How-to guides
│   └── AUTHENTICATION.md  # Authentication flow
├── reference/             # Reference documentation
│   └── README.md         # API and type references
└── session-notes/         # Historical implementation notes
```

---

## Key Features

### Agent Management
- Create and configure AI agents
- Manage agent prompts and settings
- View agent performance and history

### Chat Interface
- Interactive chat with intelligent routing
- Real-time SSE streaming
- File upload for RAG search

### Workflow Builder
- Visual workflow designer
- Multi-step agent orchestration
- Execution monitoring and analytics

### Authentication
- Zero Trust architecture
- Token exchange with authz service
- SSO integration with AI Portal

---

## Architecture Principles

### 1. Frontend-Only Design

Agent Manager is **purely a frontend application**:
- ✅ Displays UI components
- ✅ Makes API calls to backends
- ✅ Manages client-side state
- ❌ No database access
- ❌ No business logic
- ❌ No file storage

### 2. API Gateway Pattern

All API routes are **proxies** to backend services:
- Agent Server API for conversations, agents, runs
- Ingest API for file uploads and RAG
- AuthZ Service for authentication

### 3. Zero Trust Authentication

- Session JWT from AI Portal
- Token exchange for each service
- Audience-bound tokens
- No client credentials for user operations

### 4. Type Safety

- 100% TypeScript with strict mode
- Shared types from busibox-app
- Compile-time validation

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.10 (App Router)
- **UI Library**: React 19.2.3
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Workflows**: React Flow

### Backend Integration
- **Agent Server**: Python FastAPI (agent-lxc:4111)
- **Ingest API**: Python FastAPI (ingest-lxc:8001)
- **AuthZ Service**: OAuth2 + RBAC (authz-lxc:8010)

### Deployment
- **Container**: apps-lxc (Proxmox LXC)
- **Process Manager**: PM2
- **Reverse Proxy**: nginx
- **Deployment**: Ansible automation

---

## Documentation Categories

### Architecture

Understand the system design and integration patterns:
- [System Architecture Overview](architecture/overview.md)
- [Agent Server Integration](architecture/agent-server-integration.md)

**Key Concepts**:
- Frontend-only architecture (no database)
- API gateway pattern
- Real-time SSE streaming
- Zero Trust authentication

### Deployment

Deploy and manage the application:
- [Deployment Guide](deployment/deployment-guide.md)

**Topics Covered**:
- Ansible deployment process
- Environment configuration
- Troubleshooting
- Rollback procedures
- Monitoring

### Development

Set up and develop locally:
- [Development Setup](development/setup.md)
- [Testing Guide](development/testing.md)
- [Workflow System](development/workflow-system.md)

**Topics Covered**:
- Local environment setup
- Running tests
- Development workflow
- Component architecture
- API integration

### Guides

Step-by-step guides for specific tasks:
- [Authentication Guide](guides/AUTHENTICATION.md)

**Topics Covered**:
- SSO token flow
- Token exchange process
- AuthZ integration
- Troubleshooting auth issues

### Reference

Technical reference documentation:
- [Reference Index](reference/README.md)

**Topics Covered**:
- API specifications
- Data models
- Type definitions

### Session Notes

Historical implementation notes and project completion documents:
- [Session Notes](session-notes/)

**Contents**:
- Implementation summaries
- Refactoring notes
- Deployment history
- Project milestones

---

## Common Tasks

### Getting Started

```bash
# Clone and install
git clone <repository-url>
cd agent-manager
npm install

# Configure environment
cp env.example .env.local
# Edit .env.local with your settings

# Start development server
npm run dev

# Open browser
open http://localhost:3001
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Building for Production

```bash
# Build optimized bundle
npm run build

# Start production server
npm start
```

### Deploying

```bash
# From Busibox admin workstation
cd /root/busibox/provision/ansible

# Deploy to test
make deploy-agent-manager INV=inventory/test

# Deploy to production
make deploy-agent-manager INV=inventory/production
```

---

## Project Status

### Current Version
- **Version**: 0.1.0
- **Status**: ✅ Production Ready
- **Last Updated**: 2026-01-19

### Completed Features
- ✅ Agent management (list, view, delete)
- ✅ Chat interface with dispatcher routing
- ✅ File upload and RAG search
- ✅ Real-time SSE streaming
- ✅ Workflow builder and execution
- ✅ Authentication and authorization
- ✅ Deployment automation

### In Progress
- 🚧 Agent creation UI
- 🚧 Advanced workflow features
- 🚧 Performance analytics dashboard

---

## Getting Help

### Documentation
- Browse this documentation site
- Check [Busibox Documentation](../../busibox/docs/)
- Review [Specifications](../specs/)

### Troubleshooting
- [Deployment Troubleshooting](deployment/deployment-guide.md#troubleshooting)
- [Development Issues](development/setup.md#troubleshooting)
- [Authentication Problems](guides/AUTHENTICATION.md#common-issues)

### Support
- Infrastructure team for deployment issues
- Development team for code questions
- Check session notes for historical context

---

## Contributing

### Code Style
- TypeScript with strict mode
- ESLint for linting
- Prettier for formatting
- Follow Next.js App Router conventions

### Testing
- Write tests for new features
- Maintain >80% coverage
- Test both unit and integration

### Documentation
- Update docs with code changes
- Follow documentation standards
- Add metadata headers to all docs

---

## Related Projects

- **Busibox**: Infrastructure and deployment automation
- **AI Portal**: Main dashboard and authentication
- **Busibox-App**: Shared component library
- **Agent Server**: Python FastAPI backend

---

## License

Part of the Busibox project.

---

**Last Updated**: 2026-01-19  
**Maintained By**: Busibox Infrastructure Team  
**Status**: ✅ Production Ready
