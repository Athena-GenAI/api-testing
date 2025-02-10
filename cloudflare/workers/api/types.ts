/// <reference types="@cloudflare/workers-types" />

/**
 * Types for Smart Money Position Tracking System
 */

export interface Env {
  SMART_MONEY_CACHE: KVNamespace;
  SMART_MONEY_BUCKET: R2Bucket;
  COPIN_API_BASE: string;
  DB: D1Database;
  AI: any;
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
  isLong?: boolean;
}

export interface TokenStats {
  token: string;
  long: number;
  short: number;
  total: number;
  timestamp: number;
}

export interface FormattedPosition {
  token: string;
  total_positions: number;
  percentage: string;
  position: string;
}

export interface TokenStatistics {
  [token: string]: TokenStats;
}

export type FormattedResult = FormattedPosition[];

export interface CopinApiResponse {
  positions: Position[];
  timestamp: string;
}

export interface EnvironmentVars {
  COPIN_API_BASE: string;
  KV_NAMESPACE: KVNamespace;
  R2_BUCKET: R2Bucket;
}

export interface TokenPosition {
  token: string;
  total_positions: number;
  percentage: string;
  position: 'LONG' | 'SHORT';
}

export interface Analysis {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  factors: string[];
  tokenAddress: string;
}

export interface HistoricalAnalysis {
  trendDirection: 'UP' | 'DOWN' | 'SIDEWAYS';
  confidenceOverTime: {
    timestamp: number;
    confidence: number;
  }[];
}

// Constants
export const PRIORITY_TOKENS = ['$BTC', '$ETH', '$SOL'];
export const CACHE_TTL = 300; // 5 minutes in seconds
