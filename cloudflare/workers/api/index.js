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
  'HYPERLIQUID',
  'DYDX'
];
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
    "0x728744F0C85b1fBD31A71ED9D938d0741A9ef248",
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

/**
 * Check if a wallet address is for dYdX protocol
 * @param {string} address - Wallet address to check
 * @returns {boolean} True if dYdX address
 */
function isDydxAddress(address) {
  return address.startsWith('dydx');
}

/**
 * Fetch position data in batches to avoid subrequest limits
 * @param {string} traderId - Trader's wallet address
 * @param {string} protocol - Protocol name
 * @returns {Promise<Array>} Position data
 */
async function fetchPositionData(traderId, protocol, env) {
  // Skip if address format doesn't match protocol
  if (protocol === 'DYDX' && !isDydxAddress(traderId)) {
    return [];
  }
  if (protocol !== 'DYDX' && isDydxAddress(traderId)) {
    return [];
  }

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
    console.log(`Fetching ${protocol} data for ${traderId}`);
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
    console.log(`Got ${data.data?.length || 0} positions for ${protocol} trader ${traderId}`);
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
