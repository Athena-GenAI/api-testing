/// <reference types="@cloudflare/workers-types" />

/**
 * Types for Smart Money Position Tracking System
 */

export interface Env {
  SMART_MONEY_CACHE: KVNamespace;
  SMART_MONEY_BUCKET: R2Bucket;
  COPIN_API_BASE: string;
}

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export type Protocol = string;

export interface Position {
  account: string;
  protocol: Protocol;
  indexToken: string;
  size: number;
  leverage: number;
  pnl: number;
  openBlockTime: string;
  type: 'LONG' | 'SHORT';
  side?: 'LONG' | 'SHORT';
  isLong: boolean;
}

export interface TokenStats {
  long: number;
  short: number;
}

export interface FormattedPosition {
  total_positions: number;
  percentage: string;
  position: string;
}

export interface TokenStatistics {
  [token: string]: TokenStats;
}

export interface FormattedResult {
  [token: string]: FormattedPosition;
}

export interface CopinApiResponse {
  positions: Position[];
  timestamp: string;
}

export interface EnvironmentVars {
  COPIN_API_BASE: string;
  KV_NAMESPACE: KVNamespace;
  R2_BUCKET: R2Bucket;
}

// Constants
export const PRIORITY_TOKENS = ['$BTC', '$ETH', '$SOL'];
export const CACHE_TTL = 300; // 5 minutes in seconds
