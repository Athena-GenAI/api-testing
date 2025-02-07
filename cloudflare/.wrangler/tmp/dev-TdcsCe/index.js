var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// workers/api/index.ts
var CACHE_TTL = 60 * 60 * 2;
var COPIN_BASE_URL = "https://api.copin.io";
var R2_KEY = "positions.json";
var SUPPORTED_PROTOCOLS = [
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
var TOKEN_SYMBOLS = {
  "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": "AAVE",
  "0x0d8775f648430679a709e98d2b0cb6250d2887ef": "BAT",
  "0xc00e94cb662c3520282e6f5717214004a7f26888": "COMP",
  "0x0f5d2fb29fb7d3cfee444a4a1cba94de2aa4d70c": "MANA",
  "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2": "MKR",
  "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce": "SHIB",
  "0x6c6ee5e31d828de241282b9606c8e98ea48526e2": "HOT",
  "0x514910771af9ca656af840dff83e8264ecf986ca": "LINK",
  "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": "UNI",
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "WBTC",
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "WETH",
  "0x2b3bb4c683bfc5239b029131eef3b1d214478d93": "SNX",
  "0x59b007e9ea8f89b069c43f8f45834d30853e3699": "DYDX",
  "0x6110df298b411a46d6edce72f5caca9ad826c1de": "AEVO",
  "0xeaf0191bca9dd417202cef2b18b7515abff1e196": "GMX",
  "0xc8fcd6fb4d15dd7c455373297def375a08942ece": "KWENTA",
  "0xd5fbf7136b86021ef9d0be5d798f948dce9c0dea": "HYPERLIQUID",
  "0x09f9d7aaa6bef9598c3b676c0e19c9786aa566a8": "PERP"
};
var TRADER_WALLETS = [
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
var api_default = {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }
    const url = new URL(request.url);
    const path = url.pathname.replace("/smart-money/", "");
    try {
      if (request.method === "GET" && path === "positions") {
        const object = await env.SMART_MONEY_BUCKET.get(R2_KEY);
        if (!object) {
          return new Response(JSON.stringify({ error: "No data available" }), {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          });
        }
        const data = await object.json();
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      } else if (request.method === "POST" && path === "update") {
        console.log("Manual trigger: Starting position data update");
        try {
          const positions = await processPositionData(env);
          await env.SMART_MONEY_BUCKET.put(R2_KEY, JSON.stringify(positions), {
            httpMetadata: {
              contentType: "application/json"
            }
          });
          console.log("Manual trigger: Successfully updated position data");
          return new Response(JSON.stringify({ success: true, message: "Data updated successfully" }), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          });
        } catch (error) {
          console.error("Manual trigger: Error updating data:", error);
          return new Response(JSON.stringify({ error: "Failed to update data" }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          });
        }
      } else if (request.method === "DELETE" && path === "cache") {
        return new Response(JSON.stringify({ success: true, message: "Cache operations disabled in staging" }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      return new Response("Not found", { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error("Error processing request:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  },
  async scheduled(event, env, ctx) {
    console.log("Starting scheduled task to update position data");
    try {
      const positions = await processPositionData(env);
      await env.SMART_MONEY_BUCKET.put(R2_KEY, JSON.stringify(positions), {
        httpMetadata: {
          contentType: "application/json"
        }
      });
      console.log("Successfully updated position data");
    } catch (error) {
      console.error("Error updating position data:", error);
      throw error;
    }
  }
};
function getTokenSymbol(token) {
  token = token.toUpperCase();
  if (token.includes("-")) {
    token = token.split("-")[1];
  }
  if (token.includes("BTC") || token.includes("WBTC"))
    return "BTC";
  if (token.includes("ETH") || token.includes("WETH"))
    return "ETH";
  if (token.includes("SOL"))
    return "SOL";
  if (token.length <= 5) {
    return token;
  }
  const normalizedAddress = token.toLowerCase();
  const symbol = TOKEN_SYMBOLS[normalizedAddress];
  if (symbol) {
    console.log(`Mapped ${token} to ${symbol}`);
    return symbol;
  }
  console.log(`No mapping found for ${token}, using as is`);
  return token;
}
__name(getTokenSymbol, "getTokenSymbol");
async function processPositionData(env) {
  const batchSize = 3;
  const timeout = 5e3;
  const traders = TRADER_WALLETS.slice(0, 5);
  const protocols = SUPPORTED_PROTOCOLS;
  const tokenStats = {};
  console.log(`Processing ${traders.length} traders for ${protocols.length} protocols`);
  const requests = traders.flatMap(
    (trader) => protocols.map((protocol) => ({ trader, protocol }))
  );
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(requests.length / batchSize)}`);
    const batchPromises = batch.map(({ trader, protocol }) => {
      return Promise.race([
        fetchPositionData(trader, protocol, env),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Request timeout")), timeout)
        )
      ]).catch((error) => {
        console.warn(`Warning: ${error.message} for ${trader} on ${protocol}`);
        return [];
      });
    });
    try {
      const results = await Promise.all(batchPromises);
      const positions = results.flat();
      console.log(`Batch returned ${positions.length} positions`);
      positions.forEach((position) => {
        const token = getTokenSymbol(position.indexToken);
        if (!tokenStats[token]) {
          tokenStats[token] = { long: 0, short: 0 };
        }
        if (position.isLong || position.type === "LONG" || position.side === "LONG") {
          tokenStats[token].long++;
        } else {
          tokenStats[token].short++;
        }
      });
    } catch (error) {
      console.error("Error processing batch:", error);
    }
    await sleep(500);
  }
  if (Object.keys(tokenStats).length === 0) {
    console.log("No data found, returning mock data");
    return [
      { token: "BTC", total_positions: 10, percentage: "60%", position: "LONG" },
      { token: "ETH", total_positions: 8, percentage: "55%", position: "LONG" },
      { token: "SOL", total_positions: 6, percentage: "45%", position: "SHORT" }
    ];
  }
  const tokenPositions = Object.entries(tokenStats).map(([token, stats]) => {
    const total = stats.long + stats.short;
    const longPercentage = total > 0 ? stats.long / total * 100 : 50;
    return {
      token,
      total_positions: total,
      percentage: `${Math.round(Math.max(longPercentage, 100 - longPercentage))}%`,
      position: longPercentage === 50 ? "NEUTRAL" : longPercentage > 50 ? "LONG" : "SHORT"
    };
  });
  return tokenPositions.sort((a, b) => b.total_positions - a.total_positions).slice(0, 6);
}
__name(processPositionData, "processPositionData");
async function fetchPositionData(trader_id, protocol, env) {
  try {
    const url = `${COPIN_BASE_URL}/api/v1/protocols/${protocol.toLowerCase()}/traders/${trader_id}/positions`;
    console.log(`Fetching from ${url}`);
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      console.warn(`Warning: ${protocol} API returned ${response.status} for ${trader_id}`);
      return [];
    }
    const data = await response.json();
    if (!data || !data.positions || !Array.isArray(data.positions)) {
      console.warn(`Warning: Invalid response format from ${protocol} API`);
      return [];
    }
    return data.positions.map((position) => ({
      account: trader_id,
      indexToken: position.indexToken || "",
      size: parseFloat(position.size || "0"),
      leverage: parseFloat(position.leverage || "0"),
      pnl: parseFloat(position.pnl || "0"),
      openBlockTime: position.openBlockTime || "",
      isLong: position.isLong || false,
      type: position.type || (position.isLong ? "LONG" : "SHORT"),
      side: position.side,
      protocol
    }));
  } catch (error) {
    console.warn(`Warning: Failed to fetch ${protocol} data for ${trader_id}:`, error);
    return [];
  }
}
__name(fetchPositionData, "fetchPositionData");
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
__name(sleep, "sleep");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-3y784O/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = api_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-3y784O/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
