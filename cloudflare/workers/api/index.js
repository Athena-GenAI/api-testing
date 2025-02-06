/**
 * Smart Money Position API Worker
 * 
 * This worker handles both the API endpoints for retrieving smart money positions
 * and the scheduled task for caching the latest data.
 */

// Constants
const CACHE_KEY = 'smart_money_positions';
const CACHE_TTL = 60 * 60 * 3; // 3 hours in seconds
const COPIN_BASE_URL = "https://api.copin.io";
const SUPPORTED_PROTOCOLS = [
  'GMX',
  'KWENTA',
  'HYPERLIQUID'  // Starting with just HYPERLIQUID for testing
];
const TRADER_WALLETS = [
  // Top GMX traders
  "0x9f431A46149bab70373B9C6867d2dB8C2F45aa11",  // GMX Trader 1
  "0x5a54aD9860B08AAee07174887f9ee5107b0A2e72",  // GMX Trader 2
  "0x24d02e64d4A2580d570666546aC937adaB2b3E08",  // GMX Trader 3
  
  // Top Kwenta traders
  "0x1755AF9d62eF0978AC9dAc48B3EeEBB90e793b82",  // Kwenta Trader 1
  "0xda72696cEC7398B548F0b62fc094d0ab46C632d3",  // Kwenta Trader 2
  
  // Top HyperLiquid traders
  "0x0cDDEbe6726F9684D982b7A4B325dD784b469D93",  // HyperLiquid Trader 1
  "0x9f07Dc88Dc450978e5DDF973f6a0236A7cFBF99a",  // HyperLiquid Trader 2
];

/**
 * Fetch position data in batches to avoid subrequest limits
 * @param {string} traderId - Trader's wallet address
 * @param {string} protocol - Protocol name
 * @returns {Promise<Array>} Position data
 */
async function fetchPositionData(traderId, protocol, env) {
  const url = `${COPIN_BASE_URL}/${protocol}/position/filter`;
  const body = {
    pagination: {
      limit: 100,
      offset: 0
    },
    queries: [
      {
        fieldName: "status",
        value: "OPEN"
      },
      {
        fieldName: "account",
        value: traderId
      }
    ],
    sortBy: "openBlockTime",
    sortType: "desc"
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching position data:', {
        status: response.status,
        statusText: response.statusText,
        url,
        traderId,
        protocol,
        error: errorText,
        requestBody: body
      });
      return [];
    }

    const data = await response.json();
    return (data.data || []).map(pos => ({
      ...pos,
      protocol
    }));
  } catch (error) {
    console.error(`Error fetching ${protocol} data for ${traderId}:`, error);
    return [];
  }
}

/**
 * Transform position data to the standard format
 * @param {Array} positions - Raw position data
 * @returns {Array} Transformed position data
 */
function transformPositionData(positions) {
  const tokenData = {};

  // Group positions by token
  for (const position of positions) {
    const token = position.indexToken.split('-')[1] || position.indexToken;
    if (!tokenData[token]) {
      tokenData[token] = {
        token,
        long_count: 0,
        short_count: 0,
        total_positions: 0,
        unique_traders: new Set(),
        protocols: new Set()
      };
    }

    // Update counts
    if (position.isLong) {
      tokenData[token].long_count++;
    } else {
      tokenData[token].short_count++;
    }
    tokenData[token].total_positions++;
    tokenData[token].unique_traders.add(position.account);
    tokenData[token].protocols.add(position.protocol);
  }

  // Convert to array and calculate additional fields
  const result = Object.values(tokenData).map(data => ({
    token: data.token,
    long_count: data.long_count,
    short_count: data.short_count,
    total_positions: data.total_positions,
    unique_traders: data.unique_traders.size,
    protocols: Array.from(data.protocols),
    sentiment: data.long_count > data.short_count ? 'bullish' : 'bearish'
  }));

  // Sort by priority tokens first, then by total positions
  const priorityTokens = ['BTC', 'ETH', 'SOL'];
  return result.sort((a, b) => {
    const aIsPriority = priorityTokens.includes(a.token);
    const bIsPriority = priorityTokens.includes(b.token);
    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;
    return b.total_positions - a.total_positions;
  }).slice(0, 6); // Return top 6 results
}

/**
 * Fetch all smart money positions
 * @param {*} env - Environment variables
 * @returns {Promise<Array>} Position data
 */
async function fetchSmartMoneyData(env) {
  const allPositions = [];
  for (const protocol of SUPPORTED_PROTOCOLS) {
    for (const wallet of TRADER_WALLETS) {
      const positions = await fetchPositionData(wallet, protocol, env);
      allPositions.push(...positions);
    }
  }
  return transformPositionData(allPositions);
}

/**
 * Cache the latest smart money positions
 * @param {KVNamespace} SMART_MONEY_CACHE - KV namespace for caching
 */
async function cacheSmartMoneyPositions(SMART_MONEY_CACHE, env) {
  try {
    const positions = await fetchSmartMoneyData(env);
    const cacheEntry = {
      timestamp: new Date().toISOString(),
      data: positions
    };
    
    await SMART_MONEY_CACHE.put(CACHE_KEY, JSON.stringify(cacheEntry), {
      expirationTtl: CACHE_TTL
    });
    
    return { success: true, positions };
  } catch (error) {
    console.error('Error caching positions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle incoming requests
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment bindings
 * @returns {Response} HTTP response
 */
async function handleRequest(request, env) {
  const url = new URL(request.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle cache clearing
  if (request.method === 'DELETE' && url.pathname.endsWith('/cache')) {
    try {
      await env.SMART_MONEY_CACHE.delete(CACHE_KEY);
      return new Response(JSON.stringify({
        success: true,
        message: 'Cache cleared successfully'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      return new Response(JSON.stringify({
        error: 'Failed to clear cache',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
  
  try {
    // Get cached data
    const cached = await env.SMART_MONEY_CACHE.get(CACHE_KEY);
    let response;
    
    if (cached) {
      const parsedCache = JSON.parse(cached);
      const cacheAge = Date.now() - new Date(parsedCache.timestamp).getTime();
      
      // If cache is fresh, use it
      if (cacheAge < CACHE_TTL * 1000) {
        response = {
          data: parsedCache.data,
          from_cache: true,
          last_updated: parsedCache.timestamp
        };
      }
    }
    
    // If no cache or stale, fetch fresh data
    if (!response) {
      const positions = await fetchSmartMoneyData(env);
      response = {
        data: positions,
        from_cache: false,
        last_updated: new Date().toISOString()
      };

      // Cache the new data
      await cacheSmartMoneyPositions(env.SMART_MONEY_CACHE, env);
    }
    
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

/**
 * Handle scheduled cache updates
 * @param {ScheduledEvent} event - The scheduled event
 * @param {Object} env - Environment bindings
 */
async function handleScheduled(event, env) {
  console.log('Running scheduled cache update');
  const result = await cacheSmartMoneyPositions(env.SMART_MONEY_CACHE, env);
  console.log('Cache update result:', result);
}

// Export event handlers
export default {
  // Handle HTTP requests
  fetch: handleRequest,
  
  // Handle scheduled events
  scheduled: handleScheduled
};
