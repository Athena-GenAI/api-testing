import { Env } from './types';
import { CopinService } from './services/copinService';

// Constants
const CACHE_KEY = 'smart_money_positions';
const CACHE_TTL = 60 * 60 * 2; // 2 hours in seconds
const COPIN_BASE_URL = "https://api.copin.io";
const COPIN_API_KEY = "495684f1-a50a-4de1-b693-86b343c7aaf1";
const R2_KEY = 'positions.json';
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

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Type definitions
type Protocol = string;

interface Position {
  account: string;
  indexToken: string;
  size: number;
  leverage: number;
  pnl: number;
  openBlockTime: string;
  type: 'LONG' | 'SHORT';
  side?: 'LONG' | 'SHORT';
  isLong?: boolean;
  protocol: string;
}

interface PositionResponse {
  data: {
    account: string;
    indexToken: string;
    size: number;
    leverage: number;
    pnl: number;
    openBlockTime: string;
    type?: 'LONG' | 'SHORT';
    side?: 'LONG' | 'SHORT';
    isLong?: boolean;
  }[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface TokenPosition {
  token: string;
  total_positions: number;
  percentage: string;
  position: 'LONG' | 'SHORT' | 'NEUTRAL';
}

interface ApiResponse {
  data: TokenPosition[];
  from_cache: boolean;
  last_updated: string;
}

interface CacheEntry {
  timestamp: string;
  data: TokenPosition[];
}

interface CopinResponse {
  positions: {
    indexToken?: string;
    size?: string;
    leverage?: string;
    pnl?: string;
    openBlockTime?: string;
    type?: 'LONG' | 'SHORT';
    side?: 'LONG' | 'SHORT';
    isLong?: boolean;
  }[];
}

// Token address to symbol mapping
const TOKEN_SYMBOLS: { [key: string]: string } = {
  // Existing DeFi tokens
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 'AAVE',
  '0x0d8775f648430679a709e98d2b0cb6250d2887ef': 'BAT',
  '0xc00e94cb662c3520282e6f5717214004a7f26888': 'COMP',
  '0x0f5d2fb29fb7d3cfee444a4a1cba94de2aa4d70c': 'MANA',
  '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': 'MKR',
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
const TRADER_WALLETS = [
  "0x0171d947ee6ce0f487490bD4f8D89878FF2d88BA",
  "0x077F7a7b115C989D07f8D8efb16A2C2747B4270d",
  "0xd8b07BC1bC3bAe553BCA5E94E99935dC12Df24Ff",
  "0x08c788aFdACF6cf81180D2bBBE42A7434D0C7A92",
  "0x7Ab8C59Db7b959Bb8C3481d5b9836dfbc939AF21",
  "0x6345f694846335624d182c7a6FfD342B70D462AF",
  "0x2E2e95fF8042A14Fa49DEB03bdb9d9113868494E",
  "0x47A761bb9e970AC93Cb571c4614C4cA643714e4F",
  "0x8e096995C3e4A3F0Bc5B3ea1cBA94dE2Aa4D70C9",
  "0x160dBDdc299Dd258E510f4cB5Aa9B26cd98d6F5a",
  "0x8C50b477e61F4C8f8bF22c9e00627ef24C35e4DB",
  "0xcDEcd8e2d264354Db73eEF8eAf564C531d041B09",
  "0xeAA595A76b7496189e0bCF935609DE9C4be29724",
  "0xeAA595A76b7496189e0bCF935609DE9C4be29724",
  "0xAD747d2d91D8fD336Bda8805961089cEc51f3550",
  "0x4Cd80aa0CE4881Eb8679EdA1f6fbe3d89AEc0F7F",
  "0x3A3a7D5aD0EFA928FBee524E6DB4D71c77F60947",
  "0x8aA077F5998D234Ac8641d73D6bc4976e2A210FC",
  "0x25554A80781eE62414C3747e81C3f50157C634B1",
  "0xCfA99B8E07D37F25E5769400c29e22076bC08e81",
  "0x6fbE81055140287005fFB5659A9312EBa019F350",
  "0x24d02e64d4A2580d570666546aC937adaB2b3E08",
  "0x5a54aD9860B08AAee07174887f9ee5107b0A2e72",
  "0x4471104dCD5025A32f9C1903A5Ffb453feeD3A24",
  "dydx1z7lqhru3k0ne6e6gzrc6a2m6cury2gdnms9rdn",
  "dydx1yccxr4zvg4sdl2ftxnkn99mrnn0yyfh8p8370m",
  "0x728744F0C85b1fBD31A71Ed9D938d0741A9ef248",
  "0xA8d4D10ccc757F6A1273f89ca5B2B5126b24Ae9A",
  "0x1755AF9d62eF0978AC9dAc48B3EeEBB90e793b82",
  "0xd174911340dD1E86Eb47bB7D5a8B057688aAF33A",
  "0xda72696cEC7398B548F0b62fc094d0ab46C632d3",
  "0x540878197C890811F3625FbFa29C0FC1D39Aed54",
  "0x0cDDEbe6726F9684D982b7A4B325dD784b469D93",
  "0x1F036252e04d9e077E63743e286dE1A98B337765",
  "0xdE0695cdC60aC0dEDB8739951eFf70006CaFAb15",
  "0x9f07Dc88Dc450978e5DDF973f6a0236A7cFBF99a",
  "0xCA2901bDB0a0dB7e6185f0F573E7E09D94a09055",
  "dydx1las9mnvw95xkynaca556tr03rtcqfhw4gk49xe",
  "0xB6860393Ade5CD3766E47e0B031A0F4C33FD48a4",
  "0xDAf845cEbBB9cAd08EB7497BB624329D086cD32A",
  "0x4535B3157eFa05466D5095309C6F12FE3be237dc"
];

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Set CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace('/smart-money/', '');

    try {
      if (request.method === 'GET' && path === 'positions') {
        // Get data from R2
        const object = await env.SMART_MONEY_BUCKET.get(R2_KEY);
        if (!object) {
          return new Response(JSON.stringify({ error: 'No data available' }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        const data = await object.json();
        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } else if (request.method === 'POST' && path === 'update') {
        // Manual trigger for updating data
        console.log('Manual trigger: Starting position data update');
        try {
          const positions = await processPositionData(env);
          await env.SMART_MONEY_BUCKET.put(R2_KEY, JSON.stringify(positions), {
            httpMetadata: {
              contentType: 'application/json',
            },
          });
          console.log('Manual trigger: Successfully updated position data');
          return new Response(JSON.stringify({ success: true, message: 'Data updated successfully' }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        } catch (error) {
          console.error('Manual trigger: Error updating data:', error);
          return new Response(JSON.stringify({ error: 'Failed to update data' }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      } else if (request.method === 'DELETE' && path === 'cache') {
        return new Response(JSON.stringify({ success: true, message: 'Cache operations disabled in staging' }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      return new Response('Not found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Error processing request:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Starting scheduled task to update position data');
    try {
      // Process position data
      const positions = await processPositionData(env);
      
      // Store in R2
      await env.SMART_MONEY_BUCKET.put(R2_KEY, JSON.stringify(positions), {
        httpMetadata: {
          contentType: 'application/json',
        },
      });
      
      console.log('Successfully updated position data');
    } catch (error) {
      console.error('Error updating position data:', error);
      throw error; // Let Cloudflare know the scheduled task failed
    }
  }
};

/**
 * Get human-readable token symbol
 */
function getTokenSymbol(token: string): string {
  // Clean token name
  token = token.toUpperCase();
  
  // Handle protocol prefix (e.g., "HYPERLIQUID-BTC" -> "BTC")
  if (token.includes('-')) {
    token = token.split('-')[1];
  }
  
  // Priority tokens - check if the token contains these strings
  if (token.includes('BTC') || token.includes('WBTC')) return 'BTC';
  if (token.includes('ETH') || token.includes('WETH')) return 'ETH';
  if (token.includes('SOL')) return 'SOL';
  
  // If token is already a symbol (BTC, ETH, etc), return it
  if (token.length <= 5) {
    return token;
  }
  
  // Try to find token in mapping
  const normalizedAddress = token.toLowerCase();
  const symbol = TOKEN_SYMBOLS[normalizedAddress];
  if (symbol) {
    console.log(`Mapped ${token} to ${symbol}`);
    return symbol;
  }

  // If no mapping found, return the cleaned token name
  console.log(`No mapping found for ${token}, using as is`);
  return token;
}

interface TokenStatistics {
  long: number;
  short: number;
}

interface CombinedData {
  timestamp: string;
  token_statistics: { [key: string]: TokenStatistics };
  traders: { [key: string]: { [key: string]: Position[] } };
}

/**
 * Calculate position percentages for long and short positions
 */
function calculatePositionPercentages(long_count: number, short_count: number): [number, number, number] {
  const total_positions = long_count + short_count;
  if (total_positions === 0) {
    return [0, 0, 0];
  }
  
  const long_percentage = (long_count / total_positions) * 100;
  const short_percentage = (short_count / total_positions) * 100;
  
  return [long_percentage, short_percentage, total_positions];
}

/**
 * Process position statistics to get long/short counts and percentages
 */
function processPositionStatistics(positions: Position[]): {
  long_count: number;
  short_count: number;
  long_percentage: number;
  short_percentage: number;
  total_positions: number;
} {
  const long_count = positions.filter(p => p.isLong).length;
  const short_count = positions.filter(p => !p.isLong).length;
  const total = long_count + short_count;
  
  if (total === 0) {
    return {
      long_count: 0,
      short_count: 0,
      long_percentage: 0,
      short_percentage: 0,
      total_positions: 0
    };
  }
  
  const long_percentage = (long_count / total) * 100;
  const short_percentage = (short_count / total) * 100;
  
  return {
    long_count,
    short_count,
    long_percentage,
    short_percentage,
    total_positions: total
  };
}

/**
 * Process position data from all protocols and traders.
 * Returns aggregated token statistics with long/short distributions.
 */
async function processPositionData(env: Env): Promise<TokenPosition[]> {
  try {
    console.log('Processing position data...');
    const copinService = new CopinService(COPIN_BASE_URL, COPIN_API_KEY);
    const allPositions = await copinService.fetchAllPositions();
    console.log(`Fetched ${allPositions.length} total positions`);

    // Group positions by token
    const positionsByToken: { [key: string]: Position[] } = {};
    for (const position of allPositions) {
      const token = position.indexToken;
      if (!positionsByToken[token]) {
        positionsByToken[token] = [];
      }
      positionsByToken[token].push(position);
    }

    // Calculate statistics for each token
    const tokenPositions = Object.entries(positionsByToken).map(([token, positions]) => {
      const stats = processPositionStatistics(positions);
      const [longPercentage, shortPercentage] = calculatePositionPercentages(stats.long_count, stats.short_count);

      return {
        token: getTokenSymbol(token),
        total_positions: stats.total_positions,
        percentage: `${longPercentage}% Long / ${shortPercentage}% Short`,
        position: longPercentage === 50 ? 'NEUTRAL' : longPercentage > 50 ? 'LONG' : 'SHORT'
      } satisfies TokenPosition;
    });

    // Sort by total positions
    return tokenPositions
      .sort((a, b) => b.total_positions - a.total_positions)
      .slice(0, 6); // Return top 6 tokens
  } catch (error) {
    console.error('Error processing position data:', error);
    throw error;
  }
}

/**
 * Fetch position data for a specific trader and protocol.
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
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if address is a dYdX address
 */
function isDydxAddress(address: string): boolean {
  return address.startsWith('dydx1');
}
