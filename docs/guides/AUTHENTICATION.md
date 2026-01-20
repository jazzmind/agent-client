# Agent Manager Authentication

**Created**: 2025-12-11  
**Last Updated**: 2026-01-19  
**Status**: Active  
**Category**: Guide  
**Related Docs**:
- `../architecture/overview.md`
- `../architecture/agent-server-integration.md`
- `../development/setup.md`

## Overview

Agent Manager uses a Zero Trust authentication architecture with multi-step token exchange:

1. **User Authentication**: Users log in via ai-portal (Better Auth)
2. **SSO Token**: ai-portal generates an SSO JWT token and redirects to agent-manager
3. **Token Exchange**: agent-manager exchanges the SSO token for authz service tokens
4. **Service Access**: authz tokens are used to call backend services (agent-server, etc.)

## Architecture

```
┌─────────────┐
│  User       │
└──────┬──────┘
       │ 1. Login
       ▼
┌─────────────────────┐
│  AI Portal          │
│  (Better Auth)      │
└──────┬──────────────┘
       │ 2. Generate SSO Token (HS256)
       │    - Contains user ID, email, roles
       │    - Signed with SSO_JWT_SECRET
       │
       │ 3. Redirect with token
       ▼
┌─────────────────────┐
│  Agent Manager      │
│  (This App)         │
└──────┬──────────────┘
       │ 4. Extract user ID from SSO token
       │ 5. Call authz service with:
       │    - agent-manager's client_id/secret
       │    - requested_subject (user ID)
       │    - audience (agent-api)
       │
       ▼
┌─────────────────────┐
│  AuthZ Service      │
│  (OAuth2 + RBAC)    │
└──────┬──────────────┘
       │ 6. Return authz token (RS256)
       │    - Signed with authz private key
       │    - Contains kid header
       │    - Audience-bound to agent-api
       │
       ▼
┌─────────────────────┐
│  Agent Server       │
│  (Python API)       │
└─────────────────────┘
```

## Client Credentials

Each application in the Busibox ecosystem has its own client credentials registered with the authz service:

- **ai-portal**: Primary authentication authority
  - `client_id`: `ai-portal`
  - Generates SSO tokens for users
  - Exchanges tokens for downstream services

- **agent-manager**: This application
  - `client_id`: `agent-manager`
  - Receives SSO tokens from ai-portal
  - Exchanges for agent-api tokens

- **Other apps**: Similar pattern
  - Each app has its own `client_id` and `client_secret`
  - Apps never share credentials

## Environment Configuration

### Production (.env)

```bash
# AuthZ Service
AUTHZ_BASE_URL=http://10.96.200.210:8010
AUTHZ_CLIENT_ID=agent-manager
AUTHZ_CLIENT_SECRET=<production-secret>

# AI Portal (for SSO)
NEXT_PUBLIC_AI_PORTAL_URL=http://10.96.200.201:3000
```

### Local Development (.env.local)

```bash
# AuthZ Service (production)
AUTHZ_BASE_URL=http://10.96.200.210:8010
AUTHZ_CLIENT_ID=agent-manager
AUTHZ_CLIENT_SECRET=<your-secret>

# AI Portal (production for SSO)
NEXT_PUBLIC_AI_PORTAL_URL=http://10.96.200.201:3000

# Local dev server
PORT=3001
```

## Token Exchange Flow

### 1. SSO Token (from ai-portal)

```json
{
  "sub": "user-id-123",
  "email": "user@example.com",
  "roles": ["Admin", "User"],
  "aud": "agent-manager",
  "iss": "jay-cashman-portal",
  "exp": 1234567890
}
```

**Signature**: HS256 (symmetric, shared secret)

### 2. AuthZ Token (from authz service)

```json
{
  "sub": "user-id-123",
  "aud": "agent-api",
  "scope": "agents:read agents:write",
  "iss": "authz-service",
  "exp": 1234567890
}
```

**Header**:
```json
{
  "alg": "RS256",
  "kid": "authz-key-id",
  "typ": "JWT"
}
```

**Signature**: RS256 (asymmetric, public/private key pair)

## Implementation

### Token Exchange (lib/authz-client.ts)

```typescript
export async function exchangeForAuthzToken(
  ssoToken: string,
  audience: 'agent-api' | 'ingest-api' | 'search-api',
  scopes?: string[]
): Promise<AuthzTokenResponse>
```

**Process**:
1. Extract user ID from SSO token
2. Call `POST /oauth/token` on authz service with:
   - `grant_type`: `urn:ietf:params:oauth:grant-type:token-exchange`
   - `client_id`: `agent-manager`
   - `client_secret`: From env
   - `requested_subject`: User ID from SSO token
   - `audience`: Target service (e.g., `agent-api`)
   - `scope`: Requested permissions
3. Return authz token

### Middleware (lib/auth-middleware.ts)

```typescript
export async function requireAuthWithTokenExchange(
  request: NextRequest
): Promise<AuthenticatedRequest | NextResponse>
```

**Usage in API routes**:
```typescript
export async function GET(request: NextRequest) {
  const auth = await requireAuthWithTokenExchange(request);
  if (auth instanceof NextResponse) return auth; // Error
  
  // Use auth.agentApiToken for backend calls
  const agents = await agentClient.listAgents(auth.agentApiToken);
  return NextResponse.json(agents);
}
```

## Registering Client Credentials

### Option 1: Manual Registration (Development)

Contact the authz service administrator to register agent-manager:

```bash
# Request these credentials:
client_id: agent-manager
client_secret: <generated-secret>
allowed_audiences: agent-api, ingest-api, search-api
```

### Option 2: Automated Registration (Deployment)

During deployment, the provisioning scripts should:

1. Generate a secure client_secret
2. Register with authz service via API:
   ```bash
   POST /internal/clients
   {
     "client_id": "agent-manager",
     "client_secret": "<generated>",
     "allowed_audiences": ["agent-api", "ingest-api", "search-api"]
   }
   ```
3. Store credentials in environment variables

## Testing

### Local Development

1. **Setup**:
   ```bash
   cp env.example .env.local
   # Update AUTHZ_CLIENT_SECRET with actual value
   npm run dev
   ```

2. **Test Flow**:
   - Go to http://10.96.200.201:3000 (ai-portal)
   - Log in
   - Click "Agent Manager" app
   - Should redirect to http://localhost:3001?token=...
   - Token should be exchanged automatically
   - Agents should load

3. **Debugging**:
   ```bash
   # Check token exchange
   curl -X POST http://10.96.200.210:8010/oauth/token \
     -d "grant_type=urn:ietf:params:oauth:grant-type:token-exchange" \
     -d "client_id=agent-manager" \
     -d "client_secret=<your-secret>" \
     -d "requested_subject=<user-id>" \
     -d "audience=agent-api" \
     -d "scope=agents:read agents:write"
   ```

### Common Issues

**"kid missing from token header"**
- Cause: Using SSO token directly with agent-server
- Fix: Ensure token exchange is happening (check logs)

**"AUTHZ_CLIENT_SECRET not configured"**
- Cause: Missing environment variable
- Fix: Add to .env.local

**"Token exchange failed (401)"**
- Cause: Invalid client credentials
- Fix: Verify AUTHZ_CLIENT_ID and AUTHZ_CLIENT_SECRET

**"Invalid SSO token: missing user ID"**
- Cause: SSO token is malformed or expired
- Fix: Return to ai-portal and log in again

## Security Considerations

1. **Client Secrets**: Never commit to git, use environment variables
2. **Token Lifetime**: SSO tokens expire in 6 hours, authz tokens in 15 minutes
3. **Audience Binding**: Authz tokens are bound to specific services
4. **Scope Limiting**: Request only necessary scopes
5. **HTTPS**: Use HTTPS in production for all token exchanges

## References

- [OAuth 2.0 Token Exchange (RFC 8693)](https://datatracker.ietf.org/doc/html/rfc8693)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- AuthZ Service Documentation: `../authz/README.md`
