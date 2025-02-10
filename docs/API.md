# Smart Money API Documentation

## Overview

The Smart Money API provides real-time insights into trader positions across various cryptocurrencies. It is designed to be integrated with the game-node project and follows strict performance and reliability standards.

## Base URLs

- Production: `https://api.0xathena.ai/smart-money`
- Development: `https://smart-money-api-dev.ggenega.workers.dev/smart-money`

## Endpoints

### 1. Token Stats (`/token-stats`)

Returns position data for the top 6 tokens based on trading activity.

#### Request
```http
GET /smart-money/token-stats
```

#### Response
```json
{
  "data": [
    {
      "token": "BTC",
      "total_positions": 25,
      "percentage": "68%",
      "position": "LONG"
    }
  ],
  "from_cache": true,
  "last_updated": "2025-02-10T00:00:00Z"
}
```

#### Notes
- Returns exactly 6 tokens:
  - First 3 slots reserved for BTC, ETH, SOL (in that order)
  - Next 3 slots for tokens with at least 5 positions, sorted by total positions
- Position types:
  - NEUTRAL: Long percentage = 50%
  - LONG: Long percentage > 50%
  - SHORT: Long percentage < 50%
- Percentage format: number followed by % (e.g., "68%")
- Production environment uses caching (1-hour TTL)
- Development environment always returns fresh data

### 2. Metrics (`/metrics`)

Provides detailed API performance and usage metrics.

#### Request
```http
GET /smart-money/metrics
```

#### Response
```json
{
  "current": {
    "total_requests": 100,
    "cache_hits": 80,
    "api_errors": 2,
    "processing_time": 5000,
    "avg_response_time": 50
  },
  "historical": [
    {
      "date": "2025-02-09",
      "metrics": {
        "total_requests": 95,
        "cache_hits": 75,
        "api_errors": 1,
        "processing_time": 4800,
        "avg_response_time": 48
      }
    }
  ],
  "aggregated": {
    "total_requests": 195,
    "cache_hits": 155,
    "api_errors": 3,
    "processing_time": 9800,
    "cache_hit_rate": "79.49%",
    "error_rate": "1.54%",
    "avg_response_time_ms": 49
  },
  "period": {
    "start": "2025-02-03",
    "end": "2025-02-10"
  },
  "environment": "production"
}
```

## Error Handling

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "stack": "Stack trace (development only)"
}
```

### HTTP Status Codes
- 200: Success
- 404: Endpoint not found
- 500: Internal server error

## Rate Limiting
- No rate limiting currently implemented
- Fair usage policy applies

## Caching
- Production environment:
  - Token stats cached for 1 hour
  - Cache updates on the hour (e.g., 1:00, 2:00, 3:00)
- Development environment:
  - No caching
  - Always returns fresh data

## Integration Notes

### game-node Integration
1. Use production URL for production deployments
2. Handle cache status in responses
3. Consider hourly data refresh schedule
4. Implement error handling for all responses
5. Monitor error rates and response times

### Monitoring
- Monitor `/metrics` endpoint for:
  - Error rates
  - Cache hit rates
  - Response times
  - Request volumes
- Set up alerts for:
  - Error rate > 5%
  - Avg response time > 1000ms
  - Cache hit rate < 50%

## Security
- No authentication required
- CORS enabled for all origins
- Rate limiting may be added in future versions
