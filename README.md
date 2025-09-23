# Agent Server Admin Client

This is a Next.js application that provides comprehensive administration tools for the Mastra agent server:

- **Client Management**: Register, update, and delete client applications with scope-based permissions
- **Agent Definitions**: Create and manage agents programmatically through the database
- **Workflow Management**: Define workflows that can be stored and loaded dynamically  
- **Tool Management**: Create custom tools that agents can use
- **Chat Interface**: Test agents with a real-time chat interface

## Architecture Overview

```
Admin Client (Next.js) → Agent Server (Mastra) → PostgreSQL Database
```

- **Admin Client**: Secure management interface with OAuth 2.0 authentication
- **Agent Server**: Mastra-powered backend with dynamic agent loading
- **Database**: PostgreSQL for client registrations, agent definitions, and scope management

## Prerequisites

Before running this client, ensure you have:

1. **Agent Server running**: Navigate to `../agent-server` and start it
2. **PostgreSQL Database**: Set up a PostgreSQL database with the required tables
3. **Management Client Credentials**: Configured in environment variables

## Environment Setup

Create a `.env.local` file based on `env.example`:

```bash
# Agent Server Configuration
MASTRA_API_URL=https://agent-sundai.vercel.app

# Management Client Credentials (for admin operations)
MANAGEMENT_CLIENT_ID=admin-client
MANAGEMENT_CLIENT_SECRET=your-management-secret-here

# Client Credentials (for chat operations)
CLIENT_ID=admin-ui-client
CLIENT_SECRET=your-client-secret-here

# OAuth Configuration
TOKEN_SERVICE_URL=https://agent-sundai.vercel.app
TOKEN_SERVICE_AUD=https://tools.local/admin
```

## Security Model

### Management Client Authentication

The admin interface uses a management client pattern for security:

1. **Management Client**: Special client with elevated privileges for admin operations
2. **Regular Clients**: Standard clients registered through the management interface
3. **Scope-Based Access**: Each client has specific scopes controlling access to agents/workflows/tools

### Environment Variables Required

**Agent Server** (set these in the agent-server):
```bash
# Management client credentials
MANAGEMENT_CLIENT_ID=admin-client
MANAGEMENT_CLIENT_SECRET=your-secure-secret-here

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Token service keys (from setup-auth script)
TOKEN_SERVICE_PRIVATE_KEY={"kty":"OKP",...}
TOKEN_SERVICE_PUBLIC_KEY={"kty":"OKP",...}
```

**Admin Client** (set these in this project):
```bash
# Same management credentials
MANAGEMENT_CLIENT_ID=admin-client
MANAGEMENT_CLIENT_SECRET=your-secure-secret-here

# Agent server URL
MASTRA_API_URL=https://your-agent-server.vercel.app
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your actual values
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the admin interface:**
   - Main chat: [http://localhost:3000](http://localhost:3000)
   - Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

## Features

### Client Management

- **Register new clients** with custom scopes
- **View all registered clients** with their permissions
- **Delete clients** when no longer needed
- **Update client scopes** for access control

Available scopes:
- `weather.read` - Access to weather information
- `weather.write` - Ability to modify weather settings
- `agent.execute` - Permission to execute agents
- `workflow.execute` - Permission to run workflows
- `tool.execute` - Permission to use tools
- `admin.read` - Read access to admin functions
- `admin.write` - Write access to admin functions

### Agent Definitions (Coming Soon)

- Create agents programmatically through the UI
- Define agent instructions, models, and tool assignments
- Scope-based access control for agents
- Hot-reload agents without server restart

### Workflow Management (Coming Soon)

- Visual workflow builder
- Step-by-step workflow definition
- Trigger configuration
- Workflow testing and debugging

### Tool Management (Coming Soon)

- Custom tool creation with input/output schemas
- JavaScript code editor for tool logic
- Tool testing and validation
- Scope-based tool access

## Testing the System

### 1. Test Client Management

1. Go to `/admin` → Client Management
2. Add a new client with scopes: `["weather.read", "agent.execute"]`
3. Verify the client appears in the list
4. Test deleting the client

### 2. Test Agent Access

1. Register a client with `agent.execute` scope
2. Use the client credentials to access the weather agent
3. Verify the agent responds correctly
4. Test with insufficient scopes (should fail)

### 3. Test Security

1. Try accessing admin endpoints without management credentials (should fail)
2. Try accessing with wrong management credentials (should fail)
3. Verify scope enforcement works correctly

## API Endpoints

### Admin API Routes (Next.js)

- `GET /api/admin/clients` - List all registered clients
- `POST /api/admin/clients` - Register a new client
- `DELETE /api/admin/clients/[clientId]` - Delete a client
- `PATCH /api/admin/clients/[clientId]` - Update client scopes

### Agent Server Routes

- `POST /servers/register` - Register new client (protected)
- `GET /servers` - List clients (protected)
- `DELETE /servers/:clientId` - Delete client (protected)
- `POST /admin/reload` - Reload dynamic definitions (protected)
- `GET /auth/health` - System health check

## Database Schema

The system uses PostgreSQL with the following tables:

- `client_registrations` - Client credentials and scopes
- `agent_definitions` - Dynamic agent configurations
- `workflow_definitions` - Dynamic workflow configurations  
- `tool_definitions` - Dynamic tool configurations

## Deployment

For production deployment:

1. **Set environment variables** in your deployment platform
2. **Configure PostgreSQL** connection
3. **Generate production keys** using the setup-auth script
4. **Set secure management client credentials**
5. **Deploy both agent-server and admin-client**

## Security Considerations

- Management client credentials should be kept secure
- Use HTTPS in production
- Rotate client secrets regularly
- Monitor client access logs
- Implement rate limiting for production use
- Validate all input data
- Use prepared statements for database queries
- Sanitize dynamic code execution (for tools)

## Troubleshooting

### Common Issues

1. **"Management client credentials not configured"**
   - Check `MANAGEMENT_CLIENT_ID` and `MANAGEMENT_CLIENT_SECRET` environment variables
   - Ensure they match between agent-server and admin-client

2. **"Failed to fetch clients"**
   - Verify agent server is running and accessible
   - Check `MASTRA_API_URL` environment variable
   - Ensure management client is registered in the agent server

3. **"Database connection failed"**
   - Verify `DATABASE_URL` is correct
   - Ensure PostgreSQL server is running
   - Check database credentials and permissions

4. **"Invalid token" or authentication errors**
   - Regenerate keys using the setup-auth script
   - Verify token service environment variables
   - Check client credentials match registration

### Debug Mode

Enable detailed logging by setting:
```bash
NODE_ENV=development
```

This will show detailed error messages and request/response logs.

## Learn More

- [Mastra Documentation](https://mastra.ai/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [OAuth 2.0 Client Credentials Flow](https://tools.ietf.org/html/rfc6749#section-4.4)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Contributing

When adding new features:

1. Follow the existing security patterns
2. Add proper error handling
3. Update environment variable documentation
4. Add tests for new functionality
5. Update this README with any new requirements