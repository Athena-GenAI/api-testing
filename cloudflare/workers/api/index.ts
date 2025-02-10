/**
 * Smart Money API
 * 
 * Tracks and analyzes positions from top cryptocurrency traders
 * 
 * Key Features:
 * - Tracks positions for BTC, ETH, SOL, and other major tokens
 * - Real-time position tracking and analysis
 * - Identifies market sentiment through long/short ratios
 * - Cross-protocol position aggregation
 * - Automated hourly updates via cron
 * 
 * Architecture:
 * - Uses Cloudflare Workers for serverless execution
 * - R2 for persistent storage
 * - KV for high-performance caching
 * - Scheduled updates via cron triggers
 * 
 * @module SmartMoneyAPI
 * @version 1.0.0
 * @since 2025-02-10
 */

import { Env } from './types';
import { CopinService } from './services/copinService';

/**
 * Configuration Constants
 * These values define the core behavior of the API
 */

/**
 * Cache configuration for position data
 * @const {string} CACHE_KEY - Key for storing position data in KV
 * @const {number} CACHE_TTL - Cache time-to-live in seconds (1 hour)
 */
const CACHE_KEY = 'smart_money_positions';
const CACHE_TTL = 60 * 60 * 1;

/**
 * Copin API Configuration
 * @const {string} COPIN_BASE_URL - Base URL for Copin API
 * @const {string} COPIN_API_KEY - API key for authentication
 */
const COPIN_BASE_URL = "https://api.copin.io";
const COPIN_API_KEY = "495684f1-a50a-4de1-b693-86b343c7aaf1";

/**
 * Storage Configuration
 * @const {string} R2_KEY - Key for storing position data in R2
 */
const R2_KEY = 'positions.json';

/**
 * Supported DeFi Protocols
 * List of protocols we track for position data
 * @const {string[]} SUPPORTED_PROTOCOLS
 */
const SUPPORTED_PROTOCOLS = [
  "KWENTA",    // Synthetix derivatives
  "GMX",       // Perpetual DEX
  "GNS",       // Gains Network
  "POLYNOMIAL", // Polynomial Protocol
  "SYNTHETIX", // Synthetix
  "AEVO",      // Aevo Exchange
  "HYPERLIQUID", // HyperLiquid
  "VERTEX",    // Vertex Protocol
  "PERP",      // Perpetual Protocol
  "GMXV2",     // GMX Version 2
  "LYRA"       // Lyra Options
];

/**
 * Token Address to Symbol Mapping
 * Maps blockchain addresses to human-readable token symbols
 * Organized by category for better maintenance
 * @const {Object.<string, string>} TOKEN_SYMBOLS
 */
const TOKEN_SYMBOLS: { [key: string]: string } = {
  // Core DeFi Tokens
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 'AAVE',
  '0x0d8775f648430679a709e98d2b0cb6250d2887ef': 'BAT',
  '0xc00e94cb662c3520282e6f5717214004a7f26888': 'COMP',
  '0x0f5d2fb29fb7d3cfee444a4a1cba94de2aa4d70c': 'MANA',
  '0x9f8f72aa9304c8b593d555f12ef6589cc9e14c8991be': 'MKR',
  '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce': 'SHIB',
  '0x6c6ee5e31d828de241282b9606c8e98ea48526e2': 'HOT',
  '0x514910771af9ca656af840dff83e8264ecf986ca': 'LINK',
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'UNI',
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'WBTC',
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH',
  
  // Protocol Tokens
  '0x2b3bb4c683bfc5239b029131eef3b1d214478d93': 'SNX',
  '0x59b007e9ea8f89b069c43f8f45834d30853e3699': 'DYDX',
  '0x6110df298b411a46d6edce72f5caca9ad826c1de': 'AEVO',
  '0xeaf0191bca9dd417202cef2b18b7515abff1e196': 'GMX',
  '0xc8fcd6fb4d15dd7c455373297def375a08942ece': 'KWENTA',
  '0xd5fbf7136b86021ef9d0be5d798f948dce9c0dea': 'HYPERLIQUID',
  '0x09f9d7aaa6bef9598c3b676c0e19c9786aa566a8': 'PERP',
  
  // New tokens from logs
  '0x47c031236e19d024b42f8ae6780e44a573170703': 'PENDLE',
  '0x1cbba6346f110c8a5ea739ef2d1eb182990e4eb2': 'VIRTUAL',
  '0x7bbbf946883a5701350007320f525c5379b8178a': 'RENDER',
  '0x55391d178ce46e7ac8eaaea50a72d1a5a8a622da': 'ZEREBRO',
  '0x7f1fa204bb700853d36994da19f830b6ad18455c': 'MELANIA',
  '0x70d95587d40a2caf56bd97485ab3eec10bee6336': 'GRIFFAIN',
  '0x09400d9db990d5ed3f35d7be61dfaeb900af03c9': 'POPCAT',
  '0x63dc80ee90f26363b3fcd609007cc9e14c8991be': 'CHILLGUY',
  '0x8ea4fb801493dad8724f90fb2e279534fa591366': 'FARTCOIN',
  '0xc25cef6061cf5de5eb761b50e4743c1f5d7e5407': 'ZEREBRO_V2',
  '0x0418643f94ef14917f1345ce5c460c37de463ef7': 'MELANIA_V2',
  '0x6853ea96ff216fab11d2d930ce3c508556a4bdc4': 'GRIFFAIN_V2'
};

// Token symbol mapping
const TOKEN_SYMBOLS_LOWERCASE: { [key: string]: string } = {
  'wbtc': 'BTC',
  'weth': 'ETH',
  'wsol': 'SOL',
  'btc': 'BTC',
  'eth': 'ETH',
  'sol': 'SOL',
  'bitcoin': 'BTC',
  'ethereum': 'ETH',
  'solana': 'SOL',
  'wrapped bitcoin': 'BTC',
  'wrapped ethereum': 'ETH',
  'wrapped solana': 'SOL',
};

// List of smart money perpetual trader wallets
/**
 * Smart Money Wallets
 * Curated list of addresses known for profitable trading
 * These addresses are monitored for position changes
 * @const {string[]} TRADER_WALLETS
 */
const TRADER_WALLETS = [
  "0x0171d947ee6ce0f487490bD4f8D89878FF2d88BA",
  "0x077F7a7b115C989D07f8D8efb16A2C2747B4270d",
  "0x0A9Cd7e213960A1d2Ac6802e8D3E3A9E36E3F45c",
  "0x0b00366fBF7037E9d75E4A569ab27dAB84759302",
  "0xB6860393Ade5CD3766E47e0B031A0F4C33FD48a4",
  "0xDAf845cEbBB9cAd08EB7497BB624329D086cD32A",
  "0x4535B3157eFa05466D5095309C6F12FE3be237dc"
];

/**
 * Type Definitions
 * Core data structures used throughout the API
 */

/**
 * Protocol Type
 * @typedef {string} Protocol - Name of supported protocol
 */
type Protocol = string;

/**
 * Position Interface
 * Represents a single trading position
 * @interface Position
 */
interface Position {
  /**
   * Account address
   */
  account: string;
  /**
   * Index token
   */
  indexToken: string;
  /**
   * Position size
   */
  size: number;
  /**
   * Leverage
   */
  leverage: number;
  /**
   * PnL
   */
  pnl: number;
  /**
   * Open block time
   */
  openBlockTime: string;
  /**
   * Position type (LONG/SHORT)
   */
  type: 'LONG' | 'SHORT';
  /**
   * Side (LONG/SHORT)
   */
  side?: 'LONG' | 'SHORT';
  /**
   * Is long?
   */
  isLong?: boolean;
  /**
   * Protocol
   */
  protocol: string;
}

/**
 * Position Response Interface
 * API response format for position queries
 * @interface PositionResponse
 */
interface PositionResponse {
  /**
   * Data array
   */
  data: {
    /**
     * Account address
     */
    account: string;
    /**
     * Index token
     */
    indexToken: string;
    /**
     * Position size
     */
    size: number;
    /**
     * Leverage
     */
    leverage: number;
    /**
     * PnL
     */
    pnl: number;
    /**
     * Open block time
     */
    openBlockTime: string;
    /**
     * Position type (LONG/SHORT)
     */
    type?: 'LONG' | 'SHORT';
    /**
     * Side (LONG/SHORT)
     */
    side?: 'LONG' | 'SHORT';
    /**
     * Is long?
     */
    isLong?: boolean;
  }[];
  /**
   * Pagination metadata
   */
  pagination: {
    /**
     * Total count
     */
    total: number;
    /**
     * Limit
     */
    limit: number;
    /**
     * Offset
     */
    offset: number;
  };
}

/**
 * Token Position Interface
 * Aggregated position data for a specific token
 * @interface TokenPosition
 */
interface TokenPosition {
  /**
   * Token symbol
   */
  token: string;
  /**
   * Total positions
   */
  total_positions: number;
  /**
   * Percentage
   */
  percentage: string;
  /**
   * Position (LONG/SHORT/NEUTRAL)
   */
  position: 'LONG' | 'SHORT' | 'NEUTRAL';
}

/**
 * API Response Interface
 * Standard response format for all API endpoints
 * @interface ApiResponse
 */
interface ApiResponse {
  /**
   * Data array
   */
  data: TokenPosition[];
  /**
   * From cache?
   */
  from_cache: boolean;
  /**
   * Last updated timestamp
   */
  last_updated: string;
}

/**
 * Cache Entry Interface
 * Structure for cached position data
 * @interface CacheEntry
 */
interface CacheEntry {
  /**
   * Timestamp
   */
  timestamp: string;
  /**
   * Data array
   */
  data: TokenPosition[];
}

/**
 * Copin Response Interface
 * Expected response format from Copin API
 * @interface CopinResponse
 */
interface CopinResponse {
  /**
   * Positions array
   */
  positions: {
    /**
     * Index token
     */
    indexToken?: string;
    /**
     * Position size
     */
    size?: string;
    /**
     * Leverage
     */
    leverage?: string;
    /**
     * PnL
     */
    pnl?: string;
    /**
     * Open block time
     */
    openBlockTime?: string;
    /**
     * Position type (LONG/SHORT)
     */
    type?: 'LONG' | 'SHORT';
    /**
     * Side (LONG/SHORT)
     */
    side?: 'LONG' | 'SHORT';
    /**
     * Is long?
     */
    isLong?: boolean;
  }[];
}

/**
 * CORS Headers
 * Standard headers for cross-origin requests
 * @const {Object} corsHeaders
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Update positions in storage
 * @param env Environment variables and bindings
 */
async function updatePositions(env: Env): Promise<void> {
  try {
    // Get positions from R2
    const positions = await getAllPositions(env);
    
    // Process position data
    const tokenStats = await processPositionData(positions);
    
    // Store in KV cache with metadata
    const cacheData = {
      data: tokenStats,
      from_cache: false,
      last_updated: new Date().toISOString()
    };
    await env.SMART_MONEY_CACHE.put('token-stats', JSON.stringify(cacheData), { expirationTtl: 3600 });
    
    console.log('Successfully updated positions');
  } catch (error) {
    console.error('Error updating positions:', error);
    throw error;
  }
}

export default {
  /**
   * Fetch Handler
   * Processes incoming HTTP requests
   * 
   * Supports endpoints:
   * - GET /token-stats: Token position statistics
   * - GET /metrics: API performance metrics
   * 
   * @param {Request} request - HTTP request
   * @param {Env} env - Environment bindings
   * @param {ExecutionContext} ctx - Execution context
   * @returns {Promise<Response>} HTTP response
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = Date.now();
    // Only check cache in production environment
    const isDev = request.url.includes('workers.dev') || 
                 new URL(request.url).hostname.includes('localhost');
    console.log(`Environment: ${isDev ? 'development' : 'production'}`);
    
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/^\/smart-money\//, '');
      console.log('Processing request for path:', path);
      
      // Record request
      await recordMetrics(env, { total_requests: 1 }, isDev);

      // Handle different endpoints
      switch (path) {
        case 'metrics': {
          const today = new Date().toISOString().split('T')[0];
          const env_prefix = isDev ? 'dev' : 'prod';
          
          // Get metrics for the last 7 days
          const days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
          });

          const metricsPromises = days.map(async (date) => {
            const metrics = await env.SMART_MONEY_CACHE.get(`${env_prefix}:metrics:${date}`);
            return {
              date,
              metrics: metrics ? JSON.parse(metrics) : null
            };
          });

          const allMetrics = await Promise.all(metricsPromises);
          
          // Calculate aggregated metrics
          const aggregated = allMetrics.reduce((acc, { metrics }) => {
            if (!metrics) return acc;
            return {
              total_requests: acc.total_requests + metrics.total_requests,
              cache_hits: acc.cache_hits + metrics.cache_hits,
              api_errors: acc.api_errors + metrics.api_errors,
              processing_time: acc.processing_time + metrics.processing_time,
              avg_response_time: acc.avg_response_time + (metrics.avg_response_time || 0)
            };
          }, {
            total_requests: 0,
            cache_hits: 0,
            api_errors: 0,
            processing_time: 0,
            avg_response_time: 0
          });

          // Calculate overall averages
          const daysWithData = allMetrics.filter(m => m.metrics).length;
          if (daysWithData > 0) {
            aggregated.avg_response_time /= daysWithData;
          }
          
          return new Response(JSON.stringify({
            current: allMetrics[0].metrics,
            historical: allMetrics.slice(1),
            aggregated: {
              ...aggregated,
              cache_hit_rate: aggregated.total_requests ? 
                (aggregated.cache_hits / aggregated.total_requests * 100).toFixed(2) + '%' : '0%',
              error_rate: aggregated.total_requests ? 
                (aggregated.api_errors / aggregated.total_requests * 100).toFixed(2) + '%' : '0%',
              avg_response_time_ms: Math.round(aggregated.avg_response_time)
            },
            period: {
              start: days[days.length - 1],
              end: days[0]
            },
            environment: isDev ? 'development' : 'production'
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        
        case 'token-stats': {
          let cachedData = null;
          
          if (!isDev) {
            const today = new Date().toISOString().split('T')[0];
            console.log('Checking cache for date:', today);
            cachedData = await env.SMART_MONEY_CACHE.get(`positions:${today}`);
            if (cachedData) {
              try {
                cachedData = JSON.parse(cachedData);
                // Record cache hit
                await recordMetrics(env, { cache_hits: 1 }, isDev);
              } catch (e) {
                console.error('Error parsing cached data:', e);
                cachedData = null;
              }
            }
            console.log('Cache hit:', !!cachedData);
          }

          if (cachedData) {
            console.log('Returning cached data');
            const processingTime = Date.now() - startTime;
            await recordMetrics(env, { processing_time: processingTime }, isDev);
            
            return new Response(JSON.stringify(cachedData.data), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            });
          }

          console.log('Fetching fresh data from Copin API');
          const copinService = new CopinService(COPIN_BASE_URL, COPIN_API_KEY);
          const positions = await copinService.getPositions();
          console.log(`Fetched ${positions.length} positions`);
          
          const processedData = await processPositionData(positions);
          console.log(`Processed ${processedData.length} tokens`);

          // Only cache in production environment
          if (!isDev) {
            console.log('Updating cache with fresh data');
            const today = new Date().toISOString().split('T')[0];
            await env.SMART_MONEY_CACHE.put(
              `positions:${today}`,
              JSON.stringify({
                data: processedData,
                from_cache: false,
                last_updated: new Date().toISOString()
              })
            );
          }

          const processingTime = Date.now() - startTime;
          await recordMetrics(env, { processing_time: processingTime }, isDev);

          return new Response(JSON.stringify(processedData), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        
        default:
          return new Response(JSON.stringify({
            error: 'Not Found',
            message: `Endpoint '${path}' does not exist`
          }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      // Record error
      await recordMetrics(env, { api_errors: 1 }, isDev);
      
      const processingTime = Date.now() - startTime;
      await recordMetrics(env, { processing_time: processingTime }, isDev);

      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: errorMessage,
        stack: isDev ? errorStack : undefined
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  },

  /**
   * Scheduled Handler
   * Processes scheduled tasks (cron triggers)
   * 
   * Tasks:
   * - Update position data
   * - Clean up old metrics
   * - Verify cache integrity
   * 
   * @param {ScheduledEvent} event - Scheduled event details
   * @param {Env} env - Environment bindings
   * @param {ExecutionContext} ctx - Execution context
   * @returns {Promise<void>}
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Starting scheduled task to update position data');
    try {
      const copinService = new CopinService(COPIN_BASE_URL, COPIN_API_KEY);
      const positions = await copinService.getPositions();
      
      // Store in R2
      await env.SMART_MONEY_BUCKET.put(R2_KEY, JSON.stringify(positions));
      
      // Only update cache in production environment
      if (!event.cron.includes('dev')) {
        const processedPositions = await processPositionData(positions);
        await env.SMART_MONEY_CACHE.put(
          `positions:${new Date().toISOString().split('T')[0]}`,
          JSON.stringify({
            data: processedPositions,
            from_cache: false,
            last_updated: new Date().toISOString()
          })
        );
      }
      
      console.log('Successfully updated position data');
    } catch (error) {
      console.error('Error in scheduled task:', error);
    }
  }
};

/**
 * Process position data to generate token statistics
 * @param positions Array of positions from Copin API
 * @returns Array of token statistics
 */
async function processPositionData(positions: Position[]): Promise<TokenPosition[]> {
  // Group positions by token
  const tokenGroups = positions.reduce((acc, pos) => {
    const token = pos.indexToken.toUpperCase();
    if (!acc[token]) {
      acc[token] = {
        long: 0,
        short: 0,
        total: 0
      };
    }
    if (pos.isLong) {
      acc[token].long++;
    } else {
      acc[token].short++;
    }
    acc[token].total++;
    return acc;
  }, {} as Record<string, { long: number; short: number; total: number }>);

  // Convert to TokenStats array
  const stats = Object.entries(tokenGroups)
    .filter(([_, stats]) => stats.total >= 5) // Only include tokens with 5 or more positions
    .map(([token, stats]): TokenPosition => {
      const longPercentage = Math.round((stats.long / stats.total) * 100);
      return {
        token,
        total_positions: stats.total,
        percentage: `${longPercentage}%`,
        position: longPercentage === 50 ? 'NEUTRAL' : longPercentage > 50 ? 'LONG' : 'SHORT'
      };
    });

  // Sort tokens: BTC, ETH, SOL first, then by total positions
  const priorityTokens = ['BTC', 'ETH', 'SOL'];
  const sortedStats = stats.sort((a, b) => {
    const aIndex = priorityTokens.indexOf(a.token);
    const bIndex = priorityTokens.indexOf(b.token);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return b.total_positions - a.total_positions;
  });

  // Return maximum 6 tokens
  return sortedStats.slice(0, 6);
}

/**
 * Get All Positions
 * Retrieves all positions from R2 storage
 * 
 * @param {Env} env - Environment bindings
 * @returns {Promise<Position[]>} Array of positions
 */
async function getAllPositions(env: Env): Promise<Position[]> {
  try {
    // Get data from R2
    const object = await env.SMART_MONEY_BUCKET.get(R2_KEY);
    if (!object) {
      console.error('No data available in R2');
      return [];
    }

    const data = await object.json() as Position[];
    return data;
  } catch (error) {
    console.error('Error getting positions:', error);
    throw error;
  }
}

/**
 * Record Metrics
 * Records metrics for monitoring API performance and usage
 * 
 * @param {Env} env - Environment bindings
 * @param {Partial<MetricsData>} metrics - Partial metrics data to record
 * @param {boolean} isDev - Whether the request is from development environment
 */
async function recordMetrics(env: Env, metrics: Partial<MetricsData>, isDev: boolean) {
  const today = new Date().toISOString().split('T')[0];
  const env_prefix = isDev ? 'dev' : 'prod';
  
  // Get existing metrics
  const existing = await env.SMART_MONEY_CACHE.get(`${env_prefix}:metrics:${today}`);
  const currentMetrics: MetricsData = existing ? JSON.parse(existing) : {
    total_requests: 0,
    cache_hits: 0,
    api_errors: 0,
    processing_time: 0,
    avg_response_time: 0
  };

  // Update metrics
  const updatedMetrics = {
    ...currentMetrics,
    ...metrics,
  };

  // Calculate average response time
  if (metrics.processing_time !== undefined) {
    const totalTime = currentMetrics.processing_time + metrics.processing_time;
    const totalRequests = currentMetrics.total_requests + (metrics.total_requests || 0);
    updatedMetrics.avg_response_time = totalTime / totalRequests;
  }

  // Store updated metrics
  await env.SMART_MONEY_CACHE.put(
    `${env_prefix}:metrics:${today}`,
    JSON.stringify(updatedMetrics)
  );

  return updatedMetrics;
}

/**
 * Metrics Data Structure
 * Structure for tracking API performance and usage
 * @interface MetricsData
 */
interface MetricsData {
  total_requests: number;  // Total number of API requests
  cache_hits: number;      // Number of cache hits
  api_errors: number;      // Number of API errors
  processing_time: number; // Total processing time in milliseconds
  avg_response_time: number; // Average response time in milliseconds
}
