/**
 * List of supported protocols for position data from Copin API
 * @see https://docs.copin.io/features/developer/public-api-docs
 */
export const SUPPORTED_PROTOCOLS = [
  "GMX",
  "GMX_V2",
  "GMX_AVAX",
  "GMX_V2_AVAX",
  "KWENTA",
  "POLYNOMIAL",
  "POLYNOMIAL_L2",
  "GNS",
  "GNS_POLY",
  "GNS_BASE",
  "GNS_APE",
  "HYPERLIQUID",
  "VERTEX_ARB",
  "SYNTHETIX_V3",
  "SYNTHETIX_V3_ARB",
  "DYDX",
  "PERENNIAL_ARB",
  "BSX_BASE",
  "AEVO",
  "VELA_ARB",
  "HMX_ARB",
  "LEVEL_ARB",
  "LEVEL_BNB",
  "MUX_ARB"
] as const;

export type Protocol = typeof SUPPORTED_PROTOCOLS[number];
