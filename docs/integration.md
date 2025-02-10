# Smart Money API Integration Guide

## Overview

This guide covers the integration of the Smart Money API with the game-node project. The API provides real-time insights into trader positions across various cryptocurrencies, with specific considerations for game-node integration.

## Integration Steps

### 1. Environment Configuration

Configure the appropriate API endpoint based on your environment:

```typescript
const API_ENDPOINTS = {
  development: 'https://smart-money-api-dev.ggenega.workers.dev/smart-money',
  production: 'https://api.0xathena.ai/smart-money'
};

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? API_ENDPOINTS.production 
  : API_ENDPOINTS.development;
```

### 2. API Client Implementation

Example TypeScript implementation:

```typescript
interface TokenStats {
  token: string;
  total_positions: number;
  percentage: string;
  position: 'LONG' | 'SHORT' | 'NEUTRAL';
}

interface TokenStatsResponse {
  data: TokenStats[];
  from_cache: boolean;
  last_updated: string;
}

class SmartMoneyClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getTokenStats(): Promise<TokenStatsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/token-stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch token stats:', error);
      throw error;
    }
  }

  async getMetrics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/metrics`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      throw error;
    }
  }
}
```

### 3. Error Handling

Implement robust error handling:

```typescript
class SmartMoneyError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'SmartMoneyError';
  }
}

// Usage in client
async function handleApiError(error: any): Promise<never> {
  if (error.status === 404) {
    throw new SmartMoneyError('Resource not found', 404, 'NOT_FOUND');
  }
  if (error.status === 500) {
    throw new SmartMoneyError('Internal server error', 500, 'SERVER_ERROR');
  }
  throw new SmartMoneyError('Unknown error', undefined, 'UNKNOWN');
}
```

### 4. Caching Strategy

Consider the API's caching behavior:

```typescript
class SmartMoneyCache {
  private cache: Map<string, { data: any; timestamp: number }>;
  private ttl: number;

  constructor(ttlMs: number = 3600000) { // 1 hour default
    this.cache = new Map();
    this.ttl = ttlMs;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }
}
```

### 5. Rate Limiting

Implement rate limiting to avoid overwhelming the API:

```typescript
class RateLimiter {
  private timestamps: number[];
  private limit: number;
  private window: number;

  constructor(limit: number = 100, windowMs: number = 60000) {
    this.timestamps = [];
    this.limit = limit;
    this.window = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.window);
    if (this.timestamps.length >= this.limit) return false;
    this.timestamps.push(now);
    return true;
  }
}
```

### 6. Monitoring Integration

Monitor API health and performance:

```typescript
class SmartMoneyMonitor {
  private client: SmartMoneyClient;
  private errorCount: number = 0;
  private lastCheck: number = 0;

  constructor(client: SmartMoneyClient) {
    this.client = client;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const metrics = await this.client.getMetrics();
      const now = Date.now();
      this.lastCheck = now;
      
      // Alert if error rate is too high
      if (metrics.aggregated.error_rate > 5) {
        this.notifyHighErrorRate(metrics.aggregated.error_rate);
      }

      // Alert if response time is too high
      if (metrics.aggregated.avg_response_time_ms > 1000) {
        this.notifyHighLatency(metrics.aggregated.avg_response_time_ms);
      }

      return true;
    } catch (error) {
      this.errorCount++;
      return false;
    }
  }

  private notifyHighErrorRate(rate: number): void {
    // Implement notification logic
  }

  private notifyHighLatency(latency: number): void {
    // Implement notification logic
  }
}
```

### 7. Testing

Example integration tests:

```typescript
describe('SmartMoney Integration', () => {
  const client = new SmartMoneyClient(API_BASE_URL);

  test('should fetch token stats', async () => {
    const stats = await client.getTokenStats();
    expect(stats.data).toHaveLength(6);
    expect(stats.data[0].token).toBe('BTC');
  });

  test('should handle API errors gracefully', async () => {
    // Mock API error
    try {
      await client.getTokenStats();
    } catch (error) {
      expect(error).toBeInstanceOf(SmartMoneyError);
    }
  });
});
```

## Best Practices

1. **Error Handling**
   - Implement retries for transient failures
   - Log errors with appropriate context
   - Handle rate limiting gracefully

2. **Caching**
   - Respect cache headers
   - Implement local caching when appropriate
   - Consider cache invalidation strategies

3. **Performance**
   - Monitor response times
   - Implement timeouts
   - Use connection pooling

4. **Security**
   - Validate all API responses
   - Implement proper error handling
   - Monitor for unusual patterns

5. **Testing**
   - Write comprehensive integration tests
   - Test error scenarios
   - Monitor API health in production

## Common Issues

1. **Cache Invalidation**
   - Problem: Stale data in game-node
   - Solution: Implement proper cache invalidation

2. **Rate Limiting**
   - Problem: Too many requests
   - Solution: Implement rate limiting and retries

3. **Error Handling**
   - Problem: Unhandled API errors
   - Solution: Implement proper error handling

## Support

For integration support:
1. Check the [GitHub Issues](https://github.com/Athena-GenAI/api-testing/issues)
2. Contact the development team
3. Review the API documentation
