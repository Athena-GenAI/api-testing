/**
 * Smart Money Position Tracker API
 * 
 * This module implements a Cloudflare Worker that tracks and analyzes smart money positions
 * across various DeFi protocols. It aggregates position data from the Copin API and provides
 * insights into market sentiment through position analysis.
 * 
 * Features:
 * - Tracks positions for BTC, ETH, SOL, and other tokens
 * - Identifies market anomalies (extreme long/short positions)
 * - Caches results for performance
 * - Updates data automatically via cron trigger
 * 
 * @module SmartMoneyAPI
 */

import { Env } from './types';
import { CopinService } from './services/copinService';
import { DatabaseService } from './services/databaseService';

// Constants
/**
 * Cache key for storing position data
 */
const CACHE_KEY = 'smart_money_positions';

/**
 * Cache TTL in seconds
 */
const CACHE_TTL = 60 * 60 * 1; // 1 hours in seconds

/**
 * Copin API base URL
 */
const COPIN_BASE_URL = "https://api.copin.io";

/**
 * Copin API key
 */
const COPIN_API_KEY = "495684f1-a50a-4de1-b693-86b343c7aaf1";

/**
 * R2 key for storing position data
 */
const R2_KEY = 'positions.json';

/**
 * Supported protocols for position tracking
 */
const SUPPORTED_PROTOCOLS = [
  "KWENTA",
  "GMX",
  "GNS", 
  "POLYNOMIAL",
  "SYNTHETIX",
  "AEVO",
  "HYPERLIQUID",
  "VERTEX",
  "PERP",
  "GMXV2",
  "LYRA"    
];

// Token address to symbol mapping
/**
 * Mapping of token addresses to human-readable symbols
 */
const TOKEN_SYMBOLS: { [key: string]: string } = {
  // Existing DeFi tokens
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
  
  // Protocol tokens
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

// List of smart money perpetual trader wallets
/**
 * List of smart money perpetual trader wallets
 */
const TRADER_WALLETS = [
  "0x0171d947ee6ce0f487490bD4f8D89878FF2d88BA",
  "0x077F7a7b115C989D07f8D8efb16A2C2747B4270d",
  "0x0A9Cd7e213960A1d2Ac6802e8D3E3A9E36E3F45c",
  "0x0b00366fBF7037E9d75E4A569ab27dAB84759302",
  "0x0c2253153370BF3A26970df7B6219442AF975783",
  "0x0D5550d52428E7e3175bfc9550207e4ad3859b17",
  "0x0e3bec1de41d7d1875Ea175f9b6123B4a7E6E6a3",
  "0x1081D3b50B6e6A4A2a5eB6D7e3E6e994530c5C5B",
  "0x1168D6a159B1b6b9002ef0E8c40004aC149663B7",
  "0x11Df180d9bdCFbC22443285E72C7C1C9F8EFD862",
  "0x1249CDA86774Bc170CAb843437DD37484F173ca8",
  "0x12F31B73D812dD89f22865AE726fD00f21F9CE57",
  "0x13B835Ba26d3c6B4C5C7Aa3741f5c94d6A5C8C65",
  "0x13f0d0a343A11Ad5E14943EA942A89E6132F7440",
  "0x14B50eC2f40A99C63E4c9Aa40B238D6A0b455f6e",
  "0x15A1fF7907A0Ac3BCf617294e8F36b4c92c9BF60",
  "0x15B7D803bE17e920a261D8A5906431787F2497EF",
  "0x15F8afe8e52Bd59B0958A39e21307a8495901E61",
  "0x1627C71C1F3f1A3d51f33e8e01E144F40a6846e9",
  "0x16a7ECF2c27Cb367Df36d39e389e66B42000E0dF",
  "0x16f9Af0B94abdE1B3Cf4f5F7f8CCBa7Df7d07d15",
  "0x1714f9A0e1C7B28Fc2F8EA27C99F15c9F5c1B8B0",
  "0x17B9f6c5f7f39563DF4711cD7Ba83B8A7cE5b6E8",
  "0x17D3F3E86C3d9A3Bb8f2D1f3F8B2E2f2E2f2E2f2",
  "0x1A1B1c1D1E1F1a1b1c1d1e1f1A1B1C1D1E1F1a1b",
  "0x1B1c1D1E1F1a1B1c1D1E1F1a1B1c1D1E1F1a1B1c",
  "0x1C1D1E1F1a1B1c1D1E1F1a1B1c1D1E1F1a1B1c1D",
  "0x1D1E1F1a1B1c1D1E1F1a1B1c1D1E1F1a1B1c1D1E",
  "0x1E1F1a1B1c1D1E1F1a1B1c1D1E1F1a1B1c1D1E1F",
  "0x1F1a1B1c1D1E1F1a1B1c1D1E1F1a1B1c1D1E1F1a",
  "0x1a1B1c1D1E1F1a1B1c1D1E1F1a1B1c1D1E1F1a1B",
  "0x1b1C1D1E1F1a1B1c1D1E1F1a1B1c1D1E1F1a1B1c",
  "0x1c1D1E1F1a1B1c1D1E1F1a1B1c1D1E1F1a1B1c1D",
  "0x1d1E1F1a1B1c1D1E1F1a1B1c1D1E1F1a1B1c1D1E",
  "0x1e1F1a1B1c1D1E1F1a1B1c1D1E1F1a1B1c1D1E1F",
  "0x1f1a1B1c1D1E1F1a1B1c1D1E1F1a1B1c1D1E1F1a",
  "0x2A2B2c2D2E2F2a2B2c2D2E2F2a2B2c2D2E2F2a2B",
  "0x2B2c2D2E2F2a2B2c2D2E2F2a2B2c2D2E2F2a2B2c",
  "0x2C2D2E2F2a2B2c2D2E2F2a2B2c2D2E2F2a2B2c2D",
  "0x2D2E2F2a2B2c2D2E2F2a2B2c2D2E2F2a2B2c2D2E",
  "0x2E2F2a2B2c2D2E2F2a2B2c2D2E2F2a2B2c2D2E2F",
  "0x2F2a2B2c2D2E2F2a2B2c2D2E2F2a2B2c2D2E2F2a",
  "0x2a2B2c2D2E2F2a2B2c2D2E2F2a2B2c2D2E2F2a2B",
  "0x2b2C2D2E2F2a2B2c2D2E2F2a2B2c2D2E2F2a2B2c",
  "0x2c2D2E2F2a2B2c2D2E2F2a2B2c2D2E2F2a2B2c2D",
  "0x2d2E2F2a2B2c2D2E2F2a2B2c2D2E2F2a2B2c2D2E",
  "0x2e2F2a2B2c2D2E2F2a2B2c2D2E2F2a2B2c2D2E2F",
  "0x2f2a2B2c2D2E2F2a2B2c2D2E2F2a2B2c2D2E2F2a",
  "0xB6860393Ade5CD3766E47e0B031A0F4C33FD48a4",
  "0xDAf845cEbBB9cAd08EB7497BB624329D086cD32A",
  "0x4535B3157eFa05466D5095309C6F12FE3be237dc"
];

// Type definitions
/**
 * Type alias for protocol names
 */
type Protocol = string;

/**
 * Interface for a position object
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
 * Interface for a position response object
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
 * Interface for a token position object
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
 * Interface for an API response object
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
 * Interface for a cache entry object
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
 * Interface for a Copin response object
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

// CORS headers
/**
 * CORS headers for API responses
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Process position data from all sources and calculate statistics
/**
 * Get all positions from R2 storage
 * @param env Environment variables and bindings
 * @returns Array of positions
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
 * Process position data to calculate statistics for each token
 * @param positions Array of positions to process
 * @returns Array of token positions with statistics
 */
async function processPositionData(positions: Position[]): Promise<TokenPosition[]> {
  try {
    console.log('Processing positions:', positions.length);
    
    // Group positions by token
    const positionsByToken: { [key: string]: Position[] } = {};
    for (const position of positions) {
      let token = position.indexToken;
      
      // Handle special token formats
      if (token.includes('HYPERLIQUID-')) {
        token = token.split('-')[1];
      } else if (position.protocol === 'GMX_V2') {
        // Use token symbol mapping for GMX_V2
        token = TOKEN_SYMBOLS[token.toLowerCase()] || token;
      }
      
      if (!positionsByToken[token]) {
        positionsByToken[token] = [];
      }
      positionsByToken[token].push(position);
    }

    // Calculate statistics for each token
    const tokenStats: TokenPosition[] = [];
    for (const [token, tokenPositions] of Object.entries(positionsByToken)) {
      const stats = processPositionStatistics(tokenPositions);
      if (stats.total_positions >= 5) {
        // Determine position type based on long percentage
        let position: 'LONG' | 'SHORT' | 'NEUTRAL';
        let percentage: number;

        if (stats.long_percentage === 50) {
          position = 'NEUTRAL';
          percentage = 50;
        } else {
          position = stats.long_percentage > 50 ? 'LONG' : 'SHORT';
          percentage = position === 'LONG' ? stats.long_percentage : stats.short_percentage;
        }

        tokenStats.push({
          token,
          total_positions: stats.total_positions,
          percentage: `${stats.long_percentage.toFixed(2)}%`,
          position
        });
      }
    }

    // Priority tokens in specific order (BTC, ETH, SOL)
    const priorityTokens = ['BTC', 'ETH', 'SOL'];
    const result: TokenPosition[] = [];

    // First add priority tokens in order if they exist
    for (const token of priorityTokens) {
      const stat = tokenStats.find(s => s.token === token);
      if (stat) {
        result.push(stat);
      }
    }

    // Then add other tokens with at least 5 positions
    const otherTokens = tokenStats
      .filter(stat => !priorityTokens.includes(stat.token))
      .sort((a, b) => b.total_positions - a.total_positions)
      .slice(0, 3);

    // Return exactly 6 tokens max (3 priority + up to 3 others with >= 5 positions)
    return [...result, ...otherTokens].slice(0, 6);
  } catch (error) {
    console.error('Error processing position data:', error);
    throw error;
  }
}

/**
 * Process position statistics
 * @param positions Array of positions to process
 * @returns Position statistics
 */
function processPositionStatistics(positions: Position[]): {
  long_count: number;
  short_count: number;
  long_percentage: number;
  short_percentage: number;
  total_positions: number;
} {
  const long_count = positions.filter(p => p.isLong || p.type === 'LONG' || p.side === 'LONG').length;
  const short_count = positions.filter(p => !p.isLong || p.type === 'SHORT' || p.side === 'SHORT').length;
  const total_positions = positions.length;
  
  const long_percentage = Number(((long_count / total_positions) * 100).toFixed(2));
  const short_percentage = Number(((short_count / total_positions) * 100).toFixed(2));

  return {
    long_count,
    short_count,
    long_percentage,
    short_percentage,
    total_positions,
  };
}

/**
 * Cloudflare Worker fetch handler
 * Processes HTTP requests to the API endpoints
 * 
 * @param {Request} request - HTTP request
 * @param {Env} env - Environment variables and bindings
 * @param {ExecutionContext} ctx - Execution context
 * @returns {Promise<Response>} HTTP response
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace('/smart-money/', '');

    try {
      if (request.method === 'GET' && path === 'positions') {
        // Get all positions
        const positions = await getAllPositions(env);
        return new Response(JSON.stringify(positions), {
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        });
      } else if (request.method === 'GET' && path === 'token-stats') {
        // Get token stats
        const positions = await getAllPositions(env);
        if (!positions || !Array.isArray(positions)) {
          console.error('Invalid positions data:', positions);
          return new Response(JSON.stringify({ error: 'Invalid positions data' }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...CORS_HEADERS,
            },
          });
        }
        
        const stats = await processPositionData(positions);
        return new Response(JSON.stringify(stats), {
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        });
      } else if (request.method === 'POST' && path === 'update') {
        // Update positions
        await updatePositions(env);
        return new Response(JSON.stringify({ success: true, message: 'Data updated successfully' }), {
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        });
      } else {
        return new Response('Not found', { status: 404 });
      }
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Starting scheduled task to update position data');
    try {
      const copinService = new CopinService(COPIN_BASE_URL, COPIN_API_KEY);
      const positions = await copinService.getPositions();
      
      // Store in R2
      await env.SMART_MONEY_BUCKET.put(R2_KEY, JSON.stringify(positions));
      
      // Store in database
      const dbService = new DatabaseService(env.DB);
      await dbService.storePositions(positions);
    } catch (error) {
      console.error('Error in scheduled task:', error);
    }
  }
};

/**
 * Update positions
 * @param env Environment variables and bindings
 */
async function updatePositions(env: Env): Promise<void> {
  try {
    const copinService = new CopinService(COPIN_BASE_URL, COPIN_API_KEY);
    const positions = await copinService.getPositions();
    
    // Store in R2
    await env.SMART_MONEY_BUCKET.put(R2_KEY, JSON.stringify(positions));
    
    // Store in database
    const dbService = new DatabaseService(env.DB);
    await dbService.storePositions(positions);
  } catch (error) {
    console.error('Error updating positions:', error);
  }
}

/**
 * Scheduled task handler
 * Updates position data cache periodically
 * 
 * @param {ScheduledEvent} event - Scheduled event details
 * @param {Env} env - Environment variables and bindings
 * @param {ExecutionContext} ctx - Execution context
 */
async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('Starting scheduled task to update position data');
  try {
    const copinService = new CopinService(COPIN_BASE_URL, COPIN_API_KEY);
    const positions = await copinService.getPositions();
    
    // Store in R2
    await env.SMART_MONEY_BUCKET.put(R2_KEY, JSON.stringify(positions));
    
    // Store in database
    const dbService = new DatabaseService(env.DB);
    await dbService.storePositions(positions);
  } catch (error) {
    console.error('Error in scheduled task:', error);
  }
}

/**
 * Fetch position data for a specific trader and protocol.
 * 
 * @param {string} trader_id - Trader ID
 * @param {string} protocol - Protocol name
 * @param {Env} env - Environment variables and bindings
 * @returns {Promise<Position[]>} Array of positions
 */
async function fetchPositionData(trader_id: string, protocol: string, env: Env): Promise<Position[]> {
  try {
    const copinService = new CopinService(COPIN_BASE_URL, COPIN_API_KEY);
    const positions = await copinService.fetchAllPositions();
    return positions.filter(pos => pos.account === trader_id && pos.protocol === protocol);
  } catch (error) {
    console.error(`Error fetching position data for ${protocol} trader ${trader_id}:`, error);
    return [];
  }
}

/**
 * Sleep for a specified number of milliseconds
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>} Resolves after sleeping
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if address is a dYdX address
 * 
 * @param {string} address - Address to check
 * @returns {boolean} True if address is a dYdX address
 */
function isDydxAddress(address: string): boolean {
  return address.startsWith('dydx1');
}
