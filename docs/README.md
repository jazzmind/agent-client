# Agent Manager Documentation

This directory contains all documentation for the Agent Manager application.

## Directory Structure

```
docs/
├── architecture/     # System design and architecture
│   ├── overview.md  # Architecture overview
│   └── agent-server-integration.md
├── deployment/      # Deployment guides and procedures
├── development/     # Development workflows and setup
├── guides/          # How-to guides and tutorials
├── reference/       # API references and specifications
│   └── history/     # Implementation history
└── testing/         # Testing documentation
```

## Quick Links

### Getting Started
- [Architecture Overview](architecture/overview.md) - System design
- [Development Setup](development/setup.md) - Set up development environment

### Architecture
- [Agent Server Integration](architecture/agent-server-integration.md) - Backend integration
- [Architecture Overview](architecture/overview.md) - System design

### Deployment
- [Deployment Success](deployment/DEPLOYMENT-SUCCESS.md) - Production deployment guide
- [Deployment Fix](deployment/deployment-fix.md) - Deployment troubleshooting

### Development
- [Agent Manager Refactor](development/AGENT-MANAGER-REFACTOR.md) - Refactoring notes
- [UI Updates](development/agent-manager-ui-updates.md) - UI improvements
- [Rebuild Complete](development/rebuild-complete.md) - Rebuild summary
- [Integration Complete](development/integration-complete.md) - Integration status
- [Testing Guide](development/testing.md) - Development testing

### Workflow Builder
- [Workflow Final Summary](development/workflow-final-summary.md) - Workflow feature summary
- [Implementation Status](development/workflow-implementation-status.md) - Current status
- [Implementation Progress](development/workflow-implementation-progress.md) - Progress tracking
- [Plan Summary](development/workflow-plan-summary.md) - Original plan

### Guides
- [Authentication](guides/AUTHENTICATION.md) - Auth setup and configuration

### Reference
- [Docs Index](reference/README.md) - Documentation index
- [History](reference/history/) - Implementation history

## Key Features

### Agent Management
- Create and configure AI agents
- Edit prompts and settings
- View agent performance

### Chat Interface
- Interactive chat with agents
- Real-time SSE streaming
- File upload for RAG

### Workflow Builder
- Visual workflow designer
- Workflow execution monitoring
- Step-by-step tracking

### Tool Management
- Configure agent tools
- Test tool functionality
- Manage permissions

## Architecture

**Frontend-Only Application** - No direct database access

```
Agent Manager
  ├── Calls Agent Server API (conversations, agents, runs)
  └── Calls Ingest API (file uploads, RAG search)
```

All data operations go through backend APIs.

## Documentation Standards

### File Naming
- Use `kebab-case` for new files
- Legacy files may use `SCREAMING_SNAKE_CASE`

### Categories

| Category | Purpose |
|----------|---------|
| `architecture/` | System design, integration patterns |
| `deployment/` | Deploy guides, production setup |
| `development/` | Dev setup, implementation notes |
| `guides/` | Feature usage, configuration |
| `reference/` | API specs, history |
| `testing/` | Test documentation |

## Related Documentation

- **[CLAUDE.md](../CLAUDE.md)** - AI assistant guidance
- **[README.md](../README.md)** - Project overview
- **[Busibox Docs](../../busibox/docs/)** - Infrastructure documentation
