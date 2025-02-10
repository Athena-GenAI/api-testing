/**
 * Smart Money Position Tracking System - Type Definitions
 * 
 * This module defines the core types and interfaces used throughout the Smart Money API.
 * It includes definitions for environment variables, data structures, and API responses.
 * 
 * @module Types
 * @version 1.0.0
 * @since 2025-02-10
 */

/// <reference types="@cloudflare/workers-types" />

/**
 * Environment interface for Cloudflare Worker
 */
export interface Env {
  /**
   * R2 bucket for storing position data
   */
  SMART_MONEY_BUCKET: R2Bucket;

  /**
   * KV namespace for caching position data
   */
  SMART_MONEY_CACHE: KVNamespace;
}

/**
 * KV Namespace Interface
 * Defines the methods available on Cloudflare KV namespaces
 * 
 * @interface KVNamespace
 */
export interface KVNamespace {
  /** Get value by key */
  get(key: string): Promise<string | null>;
  
  /** Put value with optional TTL */
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  
  /** Delete value by key */
  delete(key: string): Promise<void>;
}

/**
 * Position type for token positions
 */
export interface Position {
  /** Token symbol */
  token: string;
  /** Account address */
  account: string;
  /** Protocol name */
  protocol: string;
  /** Index token symbol */
  indexToken: string;
  /** Position size */
  size: number;
  /** Leverage used */
  leverage: number;
  /** Profit/Loss */
  pnl: number;
  /** Block time when position was opened */
  openBlockTime: string;
  /** Position type (LONG/SHORT) */
  type: 'LONG' | 'SHORT';
  /** Position side (LONG/SHORT) */
  side: 'LONG' | 'SHORT';
  /** Whether position is long */
  isLong: boolean;
  /** Entry price */
  entryPrice: number;
  /** Mark price */
  markPrice: number;
  /** Unrealized PnL */
  unrealizedPnl: number;
  /** Realized PnL */
  realizedPnl: number;
  /** Creation timestamp */
  createdAt: string;
  /** Closing timestamp */
  closedAt: string | null;
  /** Trader address */
  trader: string;
}

/**
 * Token statistics type for API response
 */
export interface TokenStats {
  token: string;
  total_positions: number;
  percentage: string;
  position: 'LONG' | 'SHORT' | 'NEUTRAL';
}

/**
 * Protocol Type
 * Represents supported DeFi protocols
 * 
 * @typedef {string} Protocol
 */
export type Protocol = string;

/**
 * Formatted Position Interface
 * Position data formatted for API response
 * 
 * @interface FormattedPosition
 */
export interface FormattedPosition {
  /** Token symbol */
  token: string;
  
  /** Total number of positions */
  total_positions: number;
  
  /** Long/Short percentage */
  percentage: string;
  
  /** Position type */
  position: string;
}

/**
 * Token Statistics Interface
 * Detailed statistics for token analysis
 * 
 * @interface TokenStatistics
 */
export interface TokenStatistics {
  [token: string]: TokenStats;
}

/**
 * Formatted Result Interface
 * Standard API response format
 * 
 * @typedef {FormattedPosition[]} FormattedResult
 */
export type FormattedResult = FormattedPosition[];

/**
 * Copin API Response Interface
 * Expected response format from Copin API
 * 
 * @interface CopinApiResponse
 */
export interface CopinApiResponse {
  /** Array of positions */
  positions: Position[];
  
  /** Response timestamp */
  timestamp: string;
}

/**
 * Environment Variables Interface
 * Configuration for different environments
 * 
 * @interface EnvironmentVars
 */
export interface EnvironmentVars {
  /** Copin API base URL */
  COPIN_API_BASE: string;
  
  /** KV namespace for caching */
  KV_NAMESPACE: KVNamespace;
  
  /** R2 bucket for storage */
  R2_BUCKET: R2Bucket;
}

/**
 * Token Position Interface
 * Position data for a specific token
 * 
 * @interface TokenPosition
 */
export interface TokenPosition {
  /** Token symbol */
  token: string;
  
  /** Total number of positions */
  total_positions: number;
  
  /** Position percentage */
  percentage: string;
  
  /** Position type */
  position: 'LONG' | 'SHORT';
}

/**
 * Analysis Interface
 * Market sentiment analysis results
 * 
 * @interface Analysis
 */
export interface Analysis {
  /** Market sentiment */
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  
  /** Confidence score */
  confidence: number;
  
  /** Analysis factors */
  factors: string[];
  
  /** Token contract address */
  tokenAddress: string;
}

/**
 * Historical Analysis Interface
 * Historical trend analysis results
 * 
 * @interface HistoricalAnalysis
 */
export interface HistoricalAnalysis {
  /** Trend direction */
  trendDirection: 'UP' | 'DOWN' | 'SIDEWAYS';
  
  /** Confidence scores over time */
  confidenceOverTime: {
    timestamp: number;
    confidence: number;
  }[];
}

/**
 * Constants
 */

/** Priority tokens for analysis */
export const PRIORITY_TOKENS = ['$BTC', '$ETH', '$SOL'];

/** Cache time-to-live in seconds */
export const CACHE_TTL = 300; // 5 minutes
