# Smart Money API Development Guide

## Overview
The Smart Money API is built using Cloudflare Workers, providing real-time insights into trader positions across various cryptocurrencies. This guide covers development setup, best practices, and workflow.

## Development Setup

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- Cloudflare account with Workers enabled
- Wrangler CLI (`npm install -g wrangler`)

### Local Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Athena-GenAI/api-testing.git
   cd api-testing/cloudflare
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. Run locally:
   ```bash
   npm run dev
   ```

## Project Structure
```
cloudflare/
├── workers/
│   └── api/
│       └── index.ts      # Main API implementation
├── tests/
│   └── unit/            # Unit tests
├── docs/               # Documentation
├── wrangler.toml      # Cloudflare configuration
└── package.json
```

## Development Workflow

### 1. Branch Strategy
- `main`: Production deployments
- `develop`: Development work
- Feature branches: `feature/*`
- Bug fixes: `fix/*`

### 2. Code Style
- TypeScript with strict mode
- ESLint for linting
- Prettier for formatting
- Conventional commits

### 3. Testing
```bash
# Run unit tests
npm test

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

### 4. Local Development
```bash
# Start local development server
npm run dev

# Build for production
npm run build

# Deploy to development
npm run deploy:dev
```

## API Design Guidelines

### 1. Response Format
- Consistent error format
- Cache status indication
- Timestamp for data freshness
- Proper HTTP status codes

### 2. Performance
- Use KV cache effectively
- Minimize API calls
- Optimize response size
- Handle rate limiting

### 3. Monitoring
- Track error rates
- Monitor cache performance
- Log important events
- Watch response times

## Deployment Process

### 1. Development
```bash
wrangler deploy --env development
```

### 2. Staging
```bash
wrangler deploy --env staging
```

### 3. Production
```bash
wrangler deploy --env production
```

## Best Practices

### 1. Code Quality
- Write clear comments
- Use TypeScript types
- Follow single responsibility
- Write unit tests

### 2. Security
- Validate all inputs
- Sanitize outputs
- Use proper error handling
- Follow security headers

### 3. Performance
- Implement caching
- Optimize queries
- Minimize dependencies
- Use proper indexing

### 4. Monitoring
- Log important events
- Track metrics
- Monitor errors
- Watch performance

## Common Tasks

### Adding a New Endpoint
1. Define types
2. Implement handler
3. Add tests
4. Update documentation
5. Deploy and verify

### Updating Dependencies
1. Review changes
2. Update package.json
3. Run tests
4. Deploy to development
5. Verify functionality

### Debugging
1. Check logs
2. Verify metrics
3. Test locally
4. Review cache
5. Check dependencies

## Troubleshooting

### Common Issues
1. Deployment Failures
   - Check wrangler.toml
   - Verify environment
   - Check permissions

2. Performance Issues
   - Monitor cache
   - Check response times
   - Review metrics

3. Integration Problems
   - Verify API format
   - Check CORS settings
   - Test endpoints

## Resources
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [ESLint Rules](https://eslint.org/docs/rules/)
