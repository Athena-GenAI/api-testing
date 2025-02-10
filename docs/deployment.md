# Smart Money API Deployment Guide

## Overview

The Smart Money API is deployed using Cloudflare Workers, with separate environments for development and production. This guide covers the deployment process, environment configuration, and monitoring setup.

## Prerequisites

1. Node.js >= 18.0.0
2. npm or yarn
3. Cloudflare account with Workers enabled
4. Wrangler CLI installed globally:
   ```bash
   npm install -g wrangler
   ```

## Environment Setup

### 1. Configure Environment Variables

Create a `.env` file in the `cloudflare` directory:

```bash
cp .env.example .env
```

Required variables:
- `COPIN_API_KEY`: API key for Copin service
- `COPIN_BASE_URL`: Base URL for Copin API

### 2. Configure Wrangler

The `wrangler.toml` file contains environment-specific configurations:

```toml
# Development
[env.development]
name = "smart-money-api-dev"
workers_dev = true
kv_namespaces = [
  { binding = "SMART_MONEY_CACHE", id = "..." }
]
[[env.development.r2_buckets]]
binding = 'SMART_MONEY_BUCKET'
bucket_name = 'smart-money-data-dev'

# Production
[env.production]
name = "smart-money-api"
route = { pattern = "api.0xathena.ai/smart-money/*", zone_name = "0xathena.ai" }
workers_dev = false
kv_namespaces = [
  { binding = "SMART_MONEY_CACHE", id = "..." }
]
[[env.production.r2_buckets]]
binding = 'SMART_MONEY_BUCKET'
bucket_name = 'smart-money-data'
```

## Deployment Process

### 1. Development Environment

```bash
# Deploy to development
wrangler deploy --env development
```

Development URL: `https://smart-money-api-dev.ggenega.workers.dev`

### 2. Production Environment

```bash
# Deploy to production (requires approval)
wrangler deploy --env production
```

Production URL: `https://api.0xathena.ai/smart-money`

## Monitoring and Maintenance

### 1. Health Checks

Monitor the `/metrics` endpoint for:
- Error rates
- Cache hit rates
- Response times
- Request volumes

### 2. Logs

View real-time logs:
```bash
wrangler tail "api.0xathena.ai/smart-money/*"
```

### 3. Alerts

Set up alerts for:
- Error rate > 5%
- Average response time > 1000ms
- Cache hit rate < 50%

## Rollback Process

1. View deployment history:
   ```bash
   wrangler deployments list
   ```

2. Rollback to a specific version:
   ```bash
   wrangler rollback --version-id <version-id>
   ```

## Security Considerations

1. API Keys
   - Store in Cloudflare Workers Secrets
   - Rotate regularly
   - Never commit to version control

2. Environment Variables
   - Use different values for development and production
   - Restrict access to sensitive configurations

3. Deployment Protection
   - Production deployments require manual approval
   - Branch protection rules on main and develop branches
   - Required code reviews for PRs

## Integration Testing

1. Test with game-node:
   ```bash
   npm run test:integration
   ```

2. Verify API contract:
   ```bash
   npm run test:contract
   ```

## Troubleshooting

### Common Issues

1. Deployment Failures
   - Check TypeScript errors
   - Verify environment variables
   - Check Cloudflare account permissions

2. Performance Issues
   - Monitor cache hit rates
   - Check response times
   - Verify R2 bucket access

3. Integration Issues
   - Validate API responses
   - Check CORS settings
   - Verify game-node compatibility

### Support

For issues or questions:
1. Check the [GitHub Issues](https://github.com/Athena-GenAI/api-testing/issues)
2. Contact the development team
3. Review Cloudflare Workers documentation
