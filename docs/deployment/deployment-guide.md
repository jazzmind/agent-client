# Agent Manager Deployment Guide

**Created**: 2026-01-19  
**Last Updated**: 2026-01-19  
**Status**: Active  
**Category**: Deployment  
**Related Docs**:
- `../guides/AUTHENTICATION.md`
- `../architecture/overview.md`

## Overview

Agent Manager is deployed as part of the Busibox infrastructure using Ansible. The application runs on the apps-lxc container managed by PM2 and proxied through nginx.

---

## Prerequisites

### Infrastructure Requirements

- **Busibox Infrastructure**: Proxmox-based LXC containers
- **Apps Container**: apps-lxc (10.96.201.201 for test, 10.96.200.201 for production)
- **Agent Server**: agent-lxc running Python FastAPI backend
- **Ingest API**: ingest-lxc for file processing
- **AuthZ Service**: authz-lxc for authentication

### Access Requirements

- SSH access to Proxmox host or admin workstation
- Ansible vault password
- Git access to agent-manager repository

---

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│  User Browser                           │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  nginx (proxy-lxc)                      │
│  - SSL termination                      │
│  - Path routing: /agents                │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  PM2 (apps-lxc)                         │
│  - Process: agent-manager               │
│  - Port: 3001                           │
│  - Auto-restart on failure              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Next.js Application                    │
│  - Version: 16.0.10                     │
│  - React: 19.2.3                        │
│  - Pure frontend (no database)          │
└─────────────────────────────────────────┘
```

---

## Deployment Methods

### Method 1: Ansible Deployment (Recommended)

From the Busibox admin workstation or Proxmox host:

```bash
# Navigate to Ansible directory
cd /root/busibox/provision/ansible

# Deploy to test environment
ansible-playbook -i inventory/test -l apps \
  --tags app_deployer,secrets site.yml \
  --vault-password-file ~/.vault_pass \
  --extra-vars "deploy_app=agent-manager deploy_branch=test"

# Deploy to production
ansible-playbook -i inventory/production -l apps \
  --tags app_deployer,secrets site.yml \
  --vault-password-file ~/.vault_pass \
  --extra-vars "deploy_app=agent-manager deploy_branch=main"
```

**What This Does**:
1. Pulls latest code from GitHub
2. Installs dependencies (`npm install`)
3. Builds application (`npm run build`)
4. Configures environment variables from Ansible vault
5. Starts/restarts PM2 process
6. Verifies service is running

### Method 2: Make Targets (Convenience)

```bash
cd /root/busibox/provision/ansible

# Test deployment
make deploy-agent-manager INV=inventory/test

# Production deployment
make deploy-agent-manager INV=inventory/production
```

---

## Environment Configuration

### Required Environment Variables

Managed through Ansible vault (`provision/ansible/group_vars/*/vault.yml`):

```bash
# Agent Server API
NEXT_PUBLIC_AGENT_API_URL=http://10.96.201.202:4111  # test
NEXT_PUBLIC_AGENT_API_URL=http://10.96.200.202:4111  # production

# Ingest API
NEXT_PUBLIC_INGEST_API_URL=http://10.96.201.206:8001  # test
NEXT_PUBLIC_INGEST_API_URL=http://10.96.200.206:8001  # production

# Base Path (for nginx routing)
NEXT_PUBLIC_BASE_PATH=/agents

# Port
PORT=3001

# AuthZ Service
AUTHZ_BASE_URL=http://10.96.200.210:8010
AUTHZ_CLIENT_ID=agent-manager
AUTHZ_CLIENT_SECRET=<vault-encrypted>

# AI Portal (for SSO)
NEXT_PUBLIC_AI_PORTAL_URL=http://10.96.201.201:3000  # test
NEXT_PUBLIC_AI_PORTAL_URL=http://10.96.200.201:3000  # production
```

### Ansible Vault Structure

```yaml
# provision/ansible/group_vars/test/vault.yml
secrets:
  agent_manager:
    authz_client_id: "agent-manager"
    authz_client_secret: "{{ vault_agent_manager_authz_secret }}"
    agent_api_url: "http://10.96.201.202:4111"
    ingest_api_url: "http://10.96.201.206:8001"
```

---

## Deployment Process Details

### 1. Pre-Deployment Checks

```bash
# Check current deployment status
ssh apps-lxc "pm2 list"

# Check current version
ssh apps-lxc "pm2 logs agent-manager --lines 50 | grep 'version'"

# Check disk space
ssh apps-lxc "df -h /opt/apps"
```

### 2. Deployment Steps (Automated by Ansible)

1. **Clone/Pull Repository**:
   ```bash
   cd /opt/apps/agent-manager
   git fetch origin
   git checkout <branch>
   git pull origin <branch>
   ```

2. **Install Dependencies**:
   ```bash
   npm install --production
   ```

3. **Build Application**:
   ```bash
   npm run build
   ```
   - Uses Turbopack for fast builds
   - Generates optimized production bundle
   - Creates static assets

4. **Configure Environment**:
   - Ansible templates `.env` file from vault
   - Sets all required environment variables

5. **Restart Service**:
   ```bash
   pm2 restart agent-manager
   # or
   pm2 start ecosystem.config.js --only agent-manager
   ```

6. **Verify Deployment**:
   ```bash
   pm2 logs agent-manager --lines 20
   curl http://localhost:3001/api/health
   ```

### 3. Post-Deployment Verification

```bash
# Check service status
ssh apps-lxc "pm2 status agent-manager"

# Check logs for errors
ssh apps-lxc "pm2 logs agent-manager --lines 100 --err"

# Test health endpoint
curl http://10.96.201.201:3001/api/health

# Test through nginx proxy
curl https://test.busibox.local/agents/api/health
```

---

## Successful Deployment Indicators

### Service Status

```bash
pm2 status agent-manager
```

Expected output:
```
┌─────┬──────────────────┬─────────┬─────────┬──────────┬────────┐
│ id  │ name             │ mode    │ ↺       │ status   │ cpu    │
├─────┼──────────────────┼─────────┼─────────┼──────────┼────────┤
│ 2   │ agent-manager    │ fork    │ 0       │ online   │ 0.1%   │
└─────┴──────────────────┴─────────┴─────────┴──────────┴────────┘
```

### Build Output

```
Route (app)
├ ○ /              (Static)
├ ○ /agents        (Static)
├ ○ /chat          (Static)
├ ○ /simulator     (Static)
├ ƒ /api/*         (Dynamic - 21 API routes)

Total: 29 routes
- Static: 5
- Dynamic: 24
- Build time: ~2-3 seconds with Turbopack
```

### Log Output

```bash
pm2 logs agent-manager --lines 20
```

Expected:
```
[agent-manager] ▲ Next.js 16.0.10
[agent-manager] - Local:        http://localhost:3001
[agent-manager] - Network:      http://10.96.201.201:3001
[agent-manager] ✓ Ready in 1.2s
```

---

## Rollback Procedure

If deployment fails or issues are discovered:

### 1. Quick Rollback (Previous Commit)

```bash
cd /opt/apps/agent-manager
git log --oneline -5  # Find previous commit
git checkout <previous-commit-hash>
npm install
npm run build
pm2 restart agent-manager
```

### 2. Full Rollback (Re-deploy Previous Version)

```bash
cd /root/busibox/provision/ansible
ansible-playbook -i inventory/test -l apps \
  --tags app_deployer site.yml \
  --vault-password-file ~/.vault_pass \
  --extra-vars "deploy_app=agent-manager deploy_branch=<previous-branch>"
```

### 3. Emergency Stop

```bash
ssh apps-lxc "pm2 stop agent-manager"
```

---

## Troubleshooting

### Build Failures

**Symptom**: `npm run build` fails

**Common Causes**:
- TypeScript errors
- Missing dependencies
- Out of memory

**Solutions**:
```bash
# Check TypeScript errors
npm run type-check

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build

# Increase memory for build
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Service Won't Start

**Symptom**: PM2 shows "errored" or "stopped"

**Common Causes**:
- Port 3001 already in use
- Missing environment variables
- Invalid configuration

**Solutions**:
```bash
# Check port usage
netstat -tlnp | grep 3001

# Check PM2 logs
pm2 logs agent-manager --err --lines 50

# Restart with fresh config
pm2 delete agent-manager
pm2 start ecosystem.config.js --only agent-manager
```

### API Connection Errors

**Symptom**: "Failed to connect to agent-server"

**Common Causes**:
- Agent server not running
- Network connectivity issues
- Incorrect API URLs

**Solutions**:
```bash
# Test agent server connectivity
curl http://10.96.201.202:4111/health

# Check environment variables
ssh apps-lxc "cat /opt/apps/agent-manager/.env | grep API_URL"

# Verify network routing
ssh apps-lxc "ping -c 3 10.96.201.202"
```

### Authentication Failures

**Symptom**: "Token exchange failed" or "Unauthorized"

**Common Causes**:
- Invalid authz credentials
- Expired tokens
- AuthZ service unavailable

**Solutions**:
```bash
# Test authz service
curl http://10.96.200.210:8010/health

# Verify credentials
# (Check Ansible vault for correct values)

# Test token exchange manually
curl -X POST http://10.96.200.210:8010/oauth/token \
  -d "grant_type=client_credentials" \
  -d "client_id=agent-manager" \
  -d "client_secret=<secret>"
```

---

## Monitoring

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process details
pm2 show agent-manager

# Logs
pm2 logs agent-manager --lines 100

# Restart count
pm2 list | grep agent-manager
```

### Application Logs

```bash
# All logs
ssh apps-lxc "pm2 logs agent-manager"

# Error logs only
ssh apps-lxc "pm2 logs agent-manager --err"

# Follow logs
ssh apps-lxc "pm2 logs agent-manager -f"
```

### Health Checks

```bash
# Application health
curl http://localhost:3001/api/health

# Version check
curl http://localhost:3001/api/version

# Through nginx
curl https://test.busibox.local/agents/api/health
```

---

## Performance Considerations

### Build Performance

- **Turbopack**: Enabled for faster builds (~2-3 seconds)
- **Cache Components**: Experimental feature enabled
- **Production Build**: Optimized bundle size

### Runtime Performance

- **Server Components**: Used where possible for better performance
- **Client Components**: Only for interactive elements
- **API Proxying**: Minimal overhead, efficient token handling
- **SSE Streaming**: Efficient real-time updates

### Resource Usage

Typical resource consumption:
- **Memory**: ~120-150MB
- **CPU**: <5% idle, <30% under load
- **Disk**: ~200MB (including node_modules)

---

## Security Considerations

### Secrets Management

- All secrets stored in Ansible vault
- Never commit secrets to git
- Rotate credentials regularly

### Network Security

- Application only accessible through nginx proxy
- Internal API calls use private network
- No direct database access

### Authentication

- JWT tokens with short expiration
- Token exchange through authz service
- Audience-bound tokens for each service

---

## Deployment History

### Recent Deployments

**2025-12-13**: Initial production deployment
- Version: Next.js 16.0.10
- Status: ✅ Successful
- Features: Chat interface, agent management, file upload

**2025-12-11**: Architecture refactor complete
- Removed all Mastra dependencies
- Integrated with Python agent-server
- Pure frontend architecture

---

## Related Documentation

- [Architecture Overview](../architecture/overview.md) - System design
- [Authentication Guide](../guides/AUTHENTICATION.md) - Auth flow details
- [Development Setup](../development/setup.md) - Local development
- [Busibox Deployment Docs](../../../busibox/docs/deployment/) - Infrastructure deployment

---

## Support

For deployment issues:
1. Check this troubleshooting guide
2. Review PM2 logs
3. Verify environment configuration
4. Check backend service health
5. Contact infrastructure team

---

**Deployment Status**: ✅ Production Ready  
**Current Version**: 0.1.0  
**Last Successful Deployment**: 2025-12-13
