# Smart Money Position Tracker - Cloudflare Implementation

This directory contains the Cloudflare Workers implementation of the Smart Money Position Tracker API.

## Architecture

The application uses the following Cloudflare services:

- **Cloudflare Workers**: Serverless functions that handle API requests and scheduled tasks
- **Cloudflare KV**: Key-value storage for caching position data
- **Cron Triggers**: Scheduled tasks for updating the cache

## Directory Structure

```
cloudflare/
├── workers/             # Worker implementations
│   └── api/            # Main API worker
│       └── index.js    # API implementation
├── wrangler.toml       # Cloudflare Workers configuration
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## Setup

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Create KV namespaces:
```bash
# For staging
wrangler kv:namespace create "SMART_MONEY_CACHE" --preview
# For production
wrangler kv:namespace create "SMART_MONEY_CACHE"
```

4. Update `wrangler.toml` with your KV namespace IDs

5. Install dependencies:
```bash
npm install
```

## Development

Run locally:
```bash
npm run dev
```

## Deployment

Deploy to staging:
```bash
npm run deploy:staging
```

Deploy to production:
```bash
npm run deploy:prod
```

## API Endpoints

### GET /smart-money/positions

Returns the current smart money positions.

Response format:
```json
{
  "data": [
    {
      "token": "BTC",
      "total_positions": 34,
      "percentage": "67.6%",
      "position": "LONG"
    }
  ],
  "from_cache": true,
  "last_updated": "2025-02-06T14:00:00Z"
}
```

## Caching

- Data is cached in Cloudflare KV for 3 hours
- Cache is automatically updated every 2 hours via Cron Trigger
- If cache is stale or missing, fresh data is fetched from the Copin API

## Environment Variables

Configure these in the Cloudflare Dashboard or `wrangler.toml`:

- `COPIN_API_KEY` (if required in the future)
- Additional environment-specific variables

## Testing

### Unit Tests

Run all tests:
```bash
npm run test
```

Run a specific test file:
```bash
npm run test path/to/test.ts
```

### Live API Tests

Some tests interact with the live Copin API. To run these tests:

1. Create a `.env` file in the project root:
```bash
touch .env
```

2. Add your Copin API key to `.env`:
```bash
COPIN_API_KEY=your_api_key_here
```

3. Run the live API tests:
```bash
npm run test tests/live-api.test.ts
```

The live API tests will:
- Fetch positions from all supported protocols
- Validate the structure of the API response
- Generate detailed statistics about the positions
- Log sample position data for debugging

If no API key is provided, the live API tests will be skipped with a warning message.
