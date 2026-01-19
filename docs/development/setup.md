# Setup Guide for Agent Server Administration

This guide walks you through setting up and testing the complete agent server administration system.

## Step 1: Agent Server Setup

1. **Navigate to agent-server directory:**
   ```bash
   cd ../agent-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Generate authentication keys:**
   ```bash
   npm run setup-auth
   ```

4. **Set up environment variables (.env):**
   ```bash
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/agent_server

   # Management Client Credentials
   MANAGEMENT_CLIENT_ID=admin-client
   MANAGEMENT_CLIENT_SECRET=super-secure-management-secret-123

   # Token Service (from setup-auth output)
   TOKEN_SERVICE_PRIVATE_KEY={"kty":"OKP","crv":"Ed25519",...}
   TOKEN_SERVICE_PUBLIC_KEY={"kty":"OKP","crv":"Ed25519",...}

   # JWT Secret
   MASTRA_JWT_SECRET=your-jwt-secret-here
   ```

5. **Start the agent server:**
   ```bash
   npm run dev
   ```

## Step 2: Admin Client Setup

1. **Navigate to agent-manager directory:**
   ```bash
   cd ../agent-manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables (.env.local):**
   ```bash
   # Agent Server
   MASTRA_API_URL=http://localhost:4111

   # Management Client (same as agent-server)
   MANAGEMENT_CLIENT_ID=admin-client
   MANAGEMENT_CLIENT_SECRET=super-secure-management-secret-123

   # Chat Client Credentials (will be registered through admin UI)
   CLIENT_ID=admin-ui-client
   CLIENT_SECRET=will-be-generated

   # OAuth Configuration
   TOKEN_SERVICE_URL=http://localhost:4111
   TOKEN_SERVICE_AUD=https://tools.local/admin
   ```

4. **Start the admin client:**
   ```bash
   npm run dev
   ```

## Step 3: Test Client Management

1. **Access the admin panel:**
   - Open http://localhost:3000/admin
   - Go to "Client Management" tab

2. **Register the admin UI client:**
   ```json
   {
     "serverId": "admin-ui-client",
     "name": "Admin UI Client",
     "scopes": ["weather.read", "agent.execute"]
   }
   ```

3. **Copy the generated client secret** and update your `.env.local`:
   ```bash
   CLIENT_SECRET=generated-secret-from-step-2
   ```

4. **Test the chat interface:**
   - Go to http://localhost:3000
   - Try asking: "What's the weather in New York?"

## Step 4: Advanced Testing

### Test Scope Enforcement

1. **Create a limited client:**
   ```json
   {
     "serverId": "limited-client",
     "name": "Limited Access Client", 
     "scopes": ["weather.read"]
   }
   ```

2. **Test with different scopes** by updating your client credentials

### Test Client Management Operations

1. **List all clients** - verify the admin panel shows registered clients
2. **Delete a client** - use the delete button and verify removal
3. **Update client scopes** - this will be available through the register endpoint

## Step 5: Database Verification

Connect to your PostgreSQL database and verify the tables were created:

```sql
-- Check client registrations
SELECT * FROM client_registrations;

-- Check agent definitions (empty initially)
SELECT * FROM agent_definitions;

-- Check workflow definitions (empty initially)
SELECT * FROM workflow_definitions;

-- Check tool definitions (empty initially)  
SELECT * FROM tool_definitions;
```

## Step 6: Production Deployment

### Agent Server (Vercel)

1. **Set environment variables in Vercel:**
   - `DATABASE_URL` - Production PostgreSQL URL
   - `MANAGEMENT_CLIENT_ID` - Secure management client ID
   - `MANAGEMENT_CLIENT_SECRET` - Secure management secret
   - `TOKEN_SERVICE_PRIVATE_KEY` - From setup-auth
   - `TOKEN_SERVICE_PUBLIC_KEY` - From setup-auth
   - `MASTRA_JWT_SECRET` - Secure random string

2. **Deploy:**
   ```bash
   vercel --prod
   ```

### Admin Client (Vercel)

1. **Set environment variables in Vercel:**
   - `MASTRA_API_URL` - Your production agent server URL
   - `MANAGEMENT_CLIENT_ID` - Same as agent server
   - `MANAGEMENT_CLIENT_SECRET` - Same as agent server
   - `CLIENT_ID` - Register through admin UI
   - `CLIENT_SECRET` - From admin UI registration
   - `TOKEN_SERVICE_URL` - Production agent server URL
   - `TOKEN_SERVICE_AUD` - Your production audience

2. **Deploy:**
   ```bash
   vercel --prod
   ```

## Common Issues and Solutions

### Issue: "Management client credentials not configured"

**Solution:** Ensure `MANAGEMENT_CLIENT_ID` and `MANAGEMENT_CLIENT_SECRET` are set in both agent-server and admin-client environments.

### Issue: "Failed to fetch clients"

**Solutions:**
- Verify agent server is running on the correct port
- Check `MASTRA_API_URL` points to the correct server
- Ensure management credentials match between services

### Issue: "Database connection failed"

**Solutions:**
- Verify PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Ensure database user has CREATE TABLE permissions

### Issue: "Token verification failed"

**Solutions:**
- Regenerate keys using `npm run setup-auth`
- Ensure `TOKEN_SERVICE_PRIVATE_KEY` and `TOKEN_SERVICE_PUBLIC_KEY` match
- Verify token service URL is correct

## Security Checklist

- [ ] Management client credentials are secure and different from any other client
- [ ] Database credentials are not exposed in logs or frontend
- [ ] HTTPS is used in production
- [ ] Client secrets are properly rotated
- [ ] Input validation is in place for all admin operations
- [ ] Rate limiting is configured for production
- [ ] Database queries use prepared statements
- [ ] Authentication logs are monitored

## Next Steps

1. **Add Agent Definitions** - Implement the UI for creating agents programmatically
2. **Workflow Management** - Add visual workflow builder
3. **Tool Creation** - Implement custom tool creation interface
4. **Monitoring** - Add metrics and logging for client usage
5. **Backup** - Implement database backup procedures
6. **Testing** - Add automated tests for the admin API

## Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure the agent server is running and accessible
4. Check database connectivity and permissions
5. Review the authentication flow and token generation

For additional help, refer to the main README.md file.
