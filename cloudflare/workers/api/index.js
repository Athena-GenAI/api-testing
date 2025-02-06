/**
 * Smart Money Position API Worker
 * 
 * This worker handles both the API endpoints for retrieving smart money positions
 * and the scheduled task for caching the latest data.
 */

// Constants
const CACHE_KEY = 'smart_money_positions';
const CACHE_TTL = 60 * 60 * 3; // 3 hours in seconds
const COPIN_API_URL = 'https://api.copin.io/v1/positions';

/**
 * Transform position data from Copin API format to our standard format
 * @param {Array} positions - Raw positions from Copin API
 * @returns {Array} Transformed positions
 */
async function transformPositionData(positions) {
  const tokenData = {};
  
  // Group positions by token
  for (const pos of positions) {
    let token = pos.indexToken?.toUpperCase();
    if (!token) continue;
    
    // Remove protocol prefix (e.g., "HYPERLIQUID-BTC" -> "BTC")
    if (token.includes('-')) {
      token = token.split('-')[1];
    }
    
    if (!tokenData[token]) {
      tokenData[token] = { long: 0, short: 0 };
    }
    
    // Count long/short positions
    if (pos.direction?.toLowerCase() === 'long') {
      tokenData[token].long++;
    } else if (pos.direction?.toLowerCase() === 'short') {
      tokenData[token].short++;
    }
  }
  
  // Transform into final format
  return Object.entries(tokenData).map(([token, counts]) => {
    const total = counts.long + counts.short;
    const longPercentage = (counts.long / total) * 100;
    
    return {
      token,
      total_positions: total,
      percentage: `${longPercentage.toFixed(1)}%`,
      position: longPercentage >= 50 ? 'LONG' : 'SHORT'
    };
  }).sort((a, b) => b.total_positions - a.total_positions);
}

/**
 * Fetch latest positions from Copin API
 * @returns {Promise<Array>} Transformed position data
 */
async function fetchSmartMoneyData() {
  const response = await fetch(COPIN_API_URL);
  if (!response.ok) {
    throw new Error(`Copin API error: ${response.status}`);
  }
  
  const data = await response.json();
  return transformPositionData(data.positions || []);
}

/**
 * Cache the latest smart money positions
 * @param {KVNamespace} SMART_MONEY_CACHE - KV namespace for caching
 */
async function cacheSmartMoneyPositions(SMART_MONEY_CACHE) {
  try {
    const positions = await fetchSmartMoneyData();
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
      const positions = await fetchSmartMoneyData();
      response = {
        data: positions,
        from_cache: false,
        last_updated: new Date().toISOString()
      };
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
  const result = await cacheSmartMoneyPositions(env.SMART_MONEY_CACHE);
  console.log('Cache update result:', result);
}

// Export event handlers
export default {
  // Handle HTTP requests
  fetch: handleRequest,
  
  // Handle scheduled events
  scheduled: handleScheduled
};
