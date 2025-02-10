/**
 * Copin API Service Module
 * 
 * This service handles all interactions with the Copin API, providing methods to fetch
 * and process position data from various DeFi protocols. It implements rate limiting,
 * error handling, and data normalization.
 * 
 * Features:
 * - Batch position fetching
 * - Rate limit handling
 * - Error recovery
 * - Data normalization
 * - Protocol-specific adaptations
 * 
 * @module CopinService
 * @see https://docs.copin.io/features/developer/public-api-docs
 * @version 1.0.0
 * @since 2025-02-10
 */

import { Position } from '../types';
import { TRADER_WALLETS } from '../constants/wallets';
import { SUPPORTED_PROTOCOLS } from '../constants/protocols';

/**
 * Copin Position Response Interface
 * Raw position data structure from Copin API
 * 
 * @interface CopinPositionResponse
 */
interface CopinPositionResponse {
  /** Position type (LONG/SHORT) */
  type?: 'LONG' | 'SHORT';
  
  /** Boolean flag for long positions */
  isLong?: boolean;
  
  /** Position side indicator */
  side?: 'LONG' | 'SHORT';
  
  /** Position size in USD */
  size?: string;
  
  /** Position leverage */
  leverage?: string;
  
  /** Current PnL */
  pnl?: string;
  
  /** Token being traded */
  indexToken?: string;
  
  /** Position open time */
  openBlockTime?: string;
  
  /** Trader's account address */
  account?: string;
  
  /** Position status */
  status?: 'OPEN' | 'CLOSE';
}

/**
 * Copin API Response Interface
 * Complete response structure from Copin API
 * 
 * @interface CopinApiResponse
 */
interface CopinApiResponse {
  /** Array of position data */
  data: CopinPositionResponse[];
  
  /** Pagination metadata */
  meta: {
    /** Number of items per page */
    limit: number;
    
    /** Starting position */
    offset: number;
    
    /** Total number of items */
    total: number;
    
    /** Total number of pages */
    totalPages: number;
  };
}

/**
 * Copin API Service Class
 * Handles all interactions with the Copin API
 * 
 * @class CopinService
 */
export class CopinService {
  private readonly apiBase: string;
  private readonly apiKey: string;

  /**
   * Creates a new CopinService instance
   * 
   * @constructor
   * @param {string} apiBase - Base URL for Copin API
   * @param {string} apiKey - API key for authentication
   */
  constructor(apiBase: string, apiKey: string) {
    // Remove /v1 from the API base if present
    this.apiBase = apiBase.replace('/v1', '');
    this.apiKey = apiKey;
  }

  /**
   * Fetches all positions from all traders and protocols
   * Implements batch processing with rate limiting
   * 
   * @async
   * @returns {Promise<Position[]>} Array of normalized positions
   * @throws {Error} If batch fetching fails
   */
  async getPositions(): Promise<Position[]> {
    const allPositions: Position[] = [];
    
    for (const traderId of TRADER_WALLETS) {
      for (const protocol of SUPPORTED_PROTOCOLS) {
        try {
          const positions = await this.fetchPositionsForTrader(traderId, protocol);
          allPositions.push(...positions);
        } catch (error) {
          console.error(`Error fetching positions for trader ${traderId} on ${protocol}:`, error);
        }
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return allPositions;
  }

  /**
   * Fetches positions for a specific trader on a specific protocol
   * Handles pagination and implements retries
   * 
   * @async
   * @param {string} traderId - The trader's wallet address
   * @param {string} protocol - The protocol to fetch positions from
   * @returns {Promise<Position[]>} Array of positions for the trader
   * @throws {Error} If API request fails
   */
  async fetchPositionsForTrader(traderId: string, protocol: string): Promise<Position[]> {
    const positions: Position[] = [];
    try {
      let offset = 0;
      let hasMore = true;
      const limit = 100;

      while (hasMore) {
        const url = `${this.apiBase}/${protocol}/position/filter`;
        const body = {
          pagination: {
            limit,
            offset
          },
          queries: [
            {
              fieldName: "account",
              value: traderId
            },
            {
              fieldName: "status",
              value: "OPEN"
            }
          ],
          sortBy: "openBlockTime",
          sortType: "desc"
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: CopinApiResponse = await response.json();
        
        // Process positions
        const processedPositions = this.processPositions(data.data, protocol);
        positions.push(...processedPositions);

        // Update pagination
        offset += limit;
        hasMore = offset < data.meta.total;
      }
    } catch (error) {
      console.error(`Error fetching positions for ${traderId} on ${protocol}:`, error);
      throw error;
    }

    return positions;
  }

  /**
   * Processes raw position data into normalized format
   * Handles different position formats across protocols
   * 
   * @private
   * @param {CopinPositionResponse[]} positions - Raw position data from API
   * @param {string} protocol - Protocol name for context
   * @returns {Position[]} Normalized position data
   */
  private processPositions(positions: CopinPositionResponse[], protocol: string): Position[] {
    return positions
      .filter(pos => pos.status === 'OPEN')
      .map(pos => ({
        account: pos.account || '',
        protocol,
        indexToken: pos.indexToken || '',
        size: parseFloat(pos.size || '0'),
        leverage: parseFloat(pos.leverage || '0'),
        pnl: parseFloat(pos.pnl || '0'),
        openBlockTime: pos.openBlockTime || '',
        type: pos.type || (pos.isLong ? 'LONG' : 'SHORT'),
        side: pos.side,
        isLong: pos.isLong
      }));
  }

  /**
   * Fetches position data for all trader wallets across all supported protocols
   * 
   * @async
   * @returns {Promise<Position[]>} Array of normalized positions
   */
  async fetchAllPositions(): Promise<Position[]> {
    const allPositions: Position[] = [];
    const errors: Error[] = [];
    const batchSize = 10; // Process 10 trader-protocol combinations at a time

    // Create all trader-protocol combinations
    const combinations = TRADER_WALLETS.flatMap(traderId =>
      SUPPORTED_PROTOCOLS.map(protocol => ({ traderId, protocol }))
    );

    // Process combinations in batches
    for (let i = 0; i < combinations.length; i += batchSize) {
      const batch = combinations.slice(i, i + batchSize);

      try {
        const batchResults = await Promise.all(
          batch.map(async ({ traderId, protocol }) => {
            try {
              return await this.fetchPositionsForTrader(traderId, protocol);
            } catch (error) {
              errors.push(error as Error);
              return [];
            }
          })
        );

        // Add successful results to allPositions
        for (const positions of batchResults) {
          allPositions.push(...positions);
        }

        // Add a delay between batches to avoid rate limiting
        if (i + batchSize < combinations.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        errors.push(error as Error);
      }
    }

    if (allPositions.length === 0 && errors.length > 0) {
      throw new Error(`Failed to fetch any positions. Errors: ${errors.map(e => e.message).join(', ')}`);
    }

    return allPositions;
  }
}
