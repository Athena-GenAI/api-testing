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
 * Environment Variables Interface
 * Defines the structure of environment variables and bindings available to the Worker
 * 
 * @interface Env
 */
export interface Env {
  /** KV namespace for caching position data */
  SMART_MONEY_CACHE: KVNamespace;
  
  /** R2 bucket for persistent storage */
  SMART_MONEY_BUCKET: R2Bucket;
  
  /** Base URL for Copin API */
  COPIN_API_BASE: string;
  
  /** D1 database instance */
  DB: D1Database;
  
  /** Workers AI binding */
  AI: any;
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
 * Protocol Type
 * Represents supported DeFi protocols
 * 
 * @typedef {string} Protocol
 */
export type Protocol = string;

/**
 * Position Interface
 * Represents a single trading position
 * 
 * @interface Position
 */
export interface Position {
  /** Trader's account address */
  account: string;
  
  /** Protocol where position was opened */
  protocol: Protocol;
  
  /** Token being traded */
  indexToken: string;
  
  /** Position size in USD */
  size: number;
  
  /** Position leverage */
  leverage: number;
  
  /** Current PnL */
  pnl: number;
  
  /** Position open time */
  openBlockTime: string;
  
  /** Position type */
  type: 'LONG' | 'SHORT';
  
  /** Alternative position side indicator */
  side?: 'LONG' | 'SHORT';
  
  /** Boolean flag for long positions */
  isLong?: boolean;
}

/**
 * Token Statistics Interface
 * Aggregated statistics for a specific token
 * 
 * @interface TokenStats
 */
export interface TokenStats {
  /** Token symbol */
  token: string;
  
  /** Number of long positions */
  long: number;
  
  /** Number of short positions */
  short: number;
  
  /** Total number of positions */
  total: number;
  
  /** Timestamp of statistics calculation */
  timestamp: number;
}

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
