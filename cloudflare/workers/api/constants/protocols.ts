/**
 * List of supported protocols for position data from Copin API
 * @see https://docs.copin.io/features/developer/public-api-docs
 */
export const SUPPORTED_PROTOCOLS = [
  "GMX",
  "KWENTA",
  "POLYNOMIAL",
  "GMX_V2",
  "GNS",
  "HYPERLIQUID",
  "VERTEX_ARB",
  "SYNTHETIX",
  "DYDX",
  "GMX_AVAX",
  "POLYNOMIAL_L2",
  "GNS_POLY",
  "GNS_BASE"
] as const;

export type Protocol = typeof SUPPORTED_PROTOCOLS[number];
