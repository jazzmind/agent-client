# Agent Client Documentation

Complete documentation for the Busibox Agent Client application.

---

## Quick Links

### Getting Started
- [Quick Start Guide](./development/quick-start.md) - Get up and running in 5 minutes
- [Architecture Overview](./architecture/overview.md) - Understand the system design
- [API Integration](./architecture/api-integration.md) - How we integrate with backend services

### Development
- [Development Guide](./development/development-guide.md) - Development workflow and best practices
- [Testing Guide](./development/testing.md) - How to test the application
- [Contributing](./development/contributing.md) - How to contribute to the project

### Deployment
- [Deployment Guide](./deployment/deployment-guide.md) - How to deploy to production
- [Environment Configuration](./deployment/environment.md) - Environment variables and configuration
- [Troubleshooting](./deployment/troubleshooting.md) - Common issues and solutions

### Architecture
- [System Architecture](./architecture/overview.md) - High-level architecture
- [Frontend Architecture](./architecture/frontend.md) - Client-side architecture
- [API Integration](./architecture/api-integration.md) - Backend API integration
- [Database-Free Design](./architecture/database-free.md) - Why we don't use a database

---

## Documentation Structure

```
docs/
├── README.md (this file)
├── architecture/
│   ├── overview.md - System architecture overview
│   ├── frontend.md - Frontend architecture
│   ├── api-integration.md - API integration patterns
│   └── database-free.md - Database-free design principles
├── development/
│   ├── quick-start.md - Getting started guide
│   ├── development-guide.md - Development workflow
│   ├── testing.md - Testing guide
│   └── contributing.md - Contribution guidelines
└── deployment/
    ├── deployment-guide.md - Deployment instructions
    ├── environment.md - Environment configuration
    └── troubleshooting.md - Troubleshooting guide
```

---

## Project Overview

**Agent Client** is a Next.js application that provides a UI for managing and interacting with AI agents through the Busibox infrastructure.

### Key Features

- **Agent Management**: Create, configure, and manage AI agents
- **Chat Interface**: Interactive chat with intelligent routing
- **Workflow Builder**: Visual workflow designer (coming soon)
- **Run History**: Track and monitor agent executions
- **Settings Management**: Configure chat preferences and agent settings

### Technology Stack

- **Frontend**: Next.js 15.5, React 19, TypeScript 5
- **UI**: Tailwind CSS, React Flow
- **APIs**: Agent Server API, Ingest API
- **Deployment**: PM2, nginx reverse proxy

### Architecture Principles

1. **Frontend Only**: No database access, pure UI/UX layer
2. **API Gateway**: Proxies requests to backend services
3. **Stateless**: All state managed by backend services
4. **Type-Safe**: 100% TypeScript with strict typing
5. **Modular**: Clear separation of concerns

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp env.example .env.local
# Edit .env.local with your backend URLs

# 3. Run development server
npm run dev

# 4. Open browser
open http://localhost:3000
```

See [Quick Start Guide](./development/quick-start.md) for detailed instructions.

---

## Core Concepts

### 1. Frontend-Only Architecture

The agent-client **does not access any database directly**. All data operations go through backend APIs:

- **Agent Server API**: Conversations, messages, agents, runs, settings
- **Ingest API**: File uploads, document processing, RAG search

### 2. API Integration

All API routes in `app/api/*` are **proxy routes** that:
1. Extract authentication token
2. Call backend API
3. Return response to client

### 3. Real-Time Updates

Uses Server-Sent Events (SSE) for real-time streaming of:
- Agent run status
- Message generation
- Tool execution

### 4. File Handling

Files are uploaded to **Ingest API**, which:
1. Stores in MinIO
2. Extracts text/content
3. Generates embeddings
4. Creates conversation-scoped knowledge base
5. Enables RAG search

---

## Development Workflow

### 1. Local Development

```bash
npm run dev        # Start dev server
npm run test       # Run tests
npm run lint       # Check code quality
npm run type-check # TypeScript validation
```

### 2. Testing

```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Generate coverage
```

### 3. Building

```bash
npm run build    # Build for production
npm start        # Start production server
```

---

## Deployment

### Production Deployment

The application is deployed as part of the Busibox infrastructure:

1. **Container**: apps-lxc (10.96.200.201)
2. **Process Manager**: PM2
3. **Reverse Proxy**: nginx
4. **Path**: `/agents` or `agents.domain.com`

See [Deployment Guide](./deployment/deployment-guide.md) for details.

---

## API Documentation

### Agent Server API

Base URL: `http://agent-lxc:8000` or `http://10.96.200.202:8000`

**Endpoints**:
- `GET /conversations` - List conversations
- `POST /conversations` - Create conversation
- `POST /conversations/{id}/messages` - Send message
- `GET /users/me/chat-settings` - Get settings
- `POST /dispatcher/route` - Route query to agents/tools
- `GET /agents` - List agents
- `POST /runs` - Execute agent

### Ingest API

Base URL: `http://ingest-lxc:8001` or `http://10.96.200.206:8001`

**Endpoints**:
- `POST /ingest/upload` - Upload file
- `POST /search/semantic` - RAG search
- `GET /knowledge-bases` - List knowledge bases
- `GET /knowledge-bases/{id}/documents` - List documents

---

## Project History

### Agent Management Rebuild (Dec 2024)

Complete rebuild of the agent-client to:
1. Remove Mastra framework dependencies
2. Integrate with Python agent-server API
3. Remove all database access (use APIs instead)
4. Implement conversation management
5. Add file upload via ingest API

**Result**: Clean, maintainable, frontend-only application following microservices best practices.

See [Project History](./architecture/project-history.md) for detailed timeline.

---

## Contributing

We welcome contributions! Please see [Contributing Guide](./development/contributing.md) for:
- Code style guidelines
- Pull request process
- Testing requirements
- Documentation standards

---

## Support

### Documentation
- Full docs in `/docs` directory
- Specs in `/specs` directory (for speckit)
- Busibox docs: `/busibox/docs`

### Troubleshooting
- [Troubleshooting Guide](./deployment/troubleshooting.md)
- [Common Issues](./deployment/troubleshooting.md#common-issues)

### Contact
- Busibox Infrastructure Team
- See main Busibox README for contact information

---

## License

Part of the Busibox project. See main repository for license information.

---

**Last Updated**: 2025-12-11  
**Version**: 0.1.0  
**Status**: Production Ready
