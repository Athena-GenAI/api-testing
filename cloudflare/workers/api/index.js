/**
 * Smart Money Position API Worker
 * 
 * This worker handles both the API endpoints for retrieving smart money positions
 * and the scheduled task for caching the latest data.
 */

// Constants
const CACHE_KEY = 'smart_money_positions';
const CACHE_TTL = 60 * 60 * 1; // 1 hour in seconds
const COPIN_BASE_URL = "https://api.copin.io";
const SUPPORTED_PROTOCOLS = [
  'GMX', 'KWENTA', 'POLYNOMIAL', 'POLYNOMIAL_L2', 'GMX_V2_AVAX', 'GMX_V2',
  'GNS', 'GNS_POLY', 'GNS_BASE', 'GNS_APE', 'LEVEL_BNB', 'LEVEL_ARB',
  'MUX_ARB', 'APOLLOX_BNB', 'AVANTIS_BASE', 'EQUATION_ARB', 'LOGX_BLAST',
  'LOGX_MODE', 'MYX_ARB', 'DEXTORO', 'VELA_ARB', 'HMX_ARB', 'SYNTHETIX_V3',
  'SYNTHETIX_V3_ARB', 'KTX_MANTLE', 'CYBERDEX', 'YFX_ARB', 'KILOEX_OPBNB',
  'KILOEX_BNB', 'KILOEX_MANTA', 'KILOEX_BASE', 'ROLLIE_SCROLL',
  'MUMMY_FANTOM', 'HYPERLIQUID', 'SYNFUTURE_BASE', 'MORPHEX_FANTOM',
  'PERENNIAL_ARB', 'BSX_BASE', 'DYDX', 'UNIDEX_ARB', 'VERTEX_ARB',
  'HORIZON_BNB', 'HOLDSTATION_ZKSYNC', 'ZENO_METIS', 'LINEHUB_LINEA',
  'BMX_BASE', 'FOXIFY_ARB', 'APOLLOX_BASE', 'GMX_AVAX', 'SYNTHETIX',
  'DEPERP_BASE', 'ELFI_ARB'
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
 * Get human-readable token symbol from contract address
 * @param {string} address - Token contract address or symbol
 * @returns {string} Token symbol
 */
function getTokenSymbol(address) {
  // Common token mappings
  const tokenMap = {
    // Arbitrum Tokens
    '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f': 'BTC',
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1': 'ETH',
    '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4': 'LINK',
    '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8': 'USDC',
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9': 'USDT',
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': 'DAI',
    '0xC8fCd6fB4D15dD7C455373297dEF375a08942eCe': 'AVAX',
    '0xD5fBf7136B86021eF9d0BE5d798f948DcE9C0deA': 'ARB',
    '0x09F9d7aaa6Bef9598c3b676c0E19C9786Aa566a8': 'MATIC',
    '0x6110DF298B411a46d6edce72f5CAca9Ad826C1De': 'LINK',
    // Additional tokens from Python implementation
    '0x2B3bb4c683BFc5239B029131EEf3B1d214478d93': 'BTC',
    '0xEAf0191bCa9DD417202cEf2B18B7515ABff1E196': 'ETH',
    '0x59b007E9ea8F89b069c43F8f45834d30853e3699': 'SOL',
    // Add more token mappings as needed
  };

  // If it's already a symbol (BTC, ETH, etc.) return as is
  if (typeof address === 'string' && address.length <= 5) {
    return address;
  }

  // Try to get from mapping
  return tokenMap[address] || address;
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
    console.log(`Fetching ${protocol} data for ${traderId} from ${url}`);
    console.log('Request body:', JSON.stringify(body));
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
    console.log(`Got response for ${protocol} trader ${traderId}:`, JSON.stringify(data));
    
    // Transform the positions and clean up token names
    return (data.data || []).map(pos => ({
      ...pos,
      protocol,
      indexToken: getTokenSymbol(pos.indexToken)
    }));
  } catch (error) {
    console.error(`Error fetching ${protocol} data for ${traderId}:`, error);
    return [];
  }
}

/**
 * Fetch all smart money positions
 * @param {*} env - Environment variables
 * @returns {Promise<Array>} Position data
 */
async function fetchSmartMoneyData(env) {
  const allPositions = [];
  const maxRetries = 3;

  console.log('Starting to fetch smart money data');
  console.log('Protocols:', SUPPORTED_PROTOCOLS);
  console.log('Total wallets:', TRADER_WALLETS.length);

  for (const protocol of SUPPORTED_PROTOCOLS) {
    console.log(`Processing protocol: ${protocol}`);
    
    for (const wallet of TRADER_WALLETS) {
      try {
        const positions = await fetchPositionData(wallet, protocol, env);
        if (positions.length > 0) {
          console.log(`Found ${positions.length} positions for ${protocol} wallet ${wallet}`);
          allPositions.push(...positions);
        }
      } catch (error) {
        console.error(`Error fetching data for ${protocol} wallet ${wallet}:`, error);
      }
    }
  }

  console.log(`Total positions found: ${allPositions.length}`);
  const transformedData = transformPositionData(allPositions);
  console.log(`Transformed data:`, transformedData);
  return transformedData;
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
    const token = position.indexToken;
    if (!tokenData[token]) {
      tokenData[token] = {
        token,
        long_count: 0,
        short_count: 0,
        total_positions: 0
      };
    }

    // Update counts
    if (position.isLong) {
      tokenData[token].long_count++;
    } else {
      tokenData[token].short_count++;
    }
    tokenData[token].total_positions++;
  }

  // Transform into final format
  const result = Object.entries(tokenData).map(([token, data]) => {
    const longPercentage = (data.long_count / data.total_positions) * 100;
    
    return {
      token,
      total_positions: data.total_positions,
      percentage: `${longPercentage.toFixed(1)}%`,
      position: longPercentage >= 50 ? 'LONG' : 'SHORT'
    };
  });

  // Sort by total positions descending
  return result.sort((a, b) => {
    // First sort by priority tokens
    const priorityTokens = ['BTC', 'ETH', 'SOL'];
    const aIsPriority = priorityTokens.includes(a.token);
    const bIsPriority = priorityTokens.includes(b.token);
    
    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;
    
    // Then sort by total positions
    return b.total_positions - a.total_positions;
  });
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
    return new Response(null, {
      headers: corsHeaders
    });
  }

  // Handle smart money positions endpoint
  if (url.pathname.startsWith('/smart-money/positions')) {
    const isProduction = url.hostname === 'api.0xathena.ai';
    try {
      if (isProduction) {
        // Try to get from cache in production
        try {
          const cached = await env.SMART_MONEY_CACHE.get(CACHE_KEY);
          if (cached) {
            const cacheEntry = JSON.parse(cached);
            const cacheAge = Date.now() - new Date(cacheEntry.timestamp).getTime();
            
            // Only use cache if it's less than CACHE_TTL old
            if (cacheAge < CACHE_TTL * 1000) {
              console.log('Returning cached data from', cacheEntry.timestamp);
              return new Response(JSON.stringify({
                data: cacheEntry.data,
                from_cache: true,
                last_updated: cacheEntry.timestamp
              }), {
                headers: {
                  'Content-Type': 'application/json',
                  ...corsHeaders
                }
              });
            }
          }
        } catch (error) {
          console.error('Error reading from cache:', error);
        }
      }

      // Fetch fresh data
      const positions = await fetchSmartMoneyData(env);
      const timestamp = new Date().toISOString();

      if (isProduction) {
        // Cache in production only
        try {
          const cacheEntry = {
            timestamp,
            data: positions
          };
          await env.SMART_MONEY_CACHE.put(CACHE_KEY, JSON.stringify(cacheEntry), {
            expirationTtl: CACHE_TTL
          });
        } catch (error) {
          console.error('Error writing to cache:', error);
        }
      }

      return new Response(JSON.stringify({
        data: positions,
        from_cache: false,
        last_updated: timestamp
      }), {
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

  // Handle cache clear endpoint
  if (url.pathname.startsWith('/smart-money/cache') && request.method === 'DELETE') {
    const isProduction = url.hostname === 'api.0xathena.ai';
    if (isProduction) {
      try {
        await env.SMART_MONEY_CACHE.delete(CACHE_KEY);
        return new Response(JSON.stringify({
          success: true,
          message: "Cache cleared successfully"
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      } catch (error) {
        console.error('Error clearing cache:', error);
        return new Response(JSON.stringify({
          success: false,
          message: "Failed to clear cache",
          error: error.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    } else {
      return new Response(JSON.stringify({
        success: true,
        message: "Cache operations disabled in staging"
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }

  return new Response('Not found', {
    status: 404,
    headers: corsHeaders
  });
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
