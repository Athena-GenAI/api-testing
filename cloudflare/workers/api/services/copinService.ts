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

import { Env, Position } from '../types';
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
    try {
      console.log('Starting to fetch all positions...');
      console.log('API Base:', this.apiBase);
      console.log('API Key length:', this.apiKey.length);
      console.log('Supported protocols:', SUPPORTED_PROTOCOLS);
      console.log('Number of trader wallets:', TRADER_WALLETS.length);
      
      const positions = await this.fetchAllPositions();
      console.log(`Successfully fetched ${positions.length} positions`);
      return positions;
    } catch (error) {
      console.error('Error in getPositions:', error);
      throw error;
    }
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
    const limit = 100;
    let offset = 0;
    let hasMore = true;

    try {
      while (hasMore) {
        const body = {
          pagination: {
            limit,
            offset
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

        const mappedProtocol = this.mapProtocolToEndpoint(protocol);
        const url = `${this.apiBase}/api/${mappedProtocol}/position/filter`;
        console.log(`[${protocol}] Fetching positions from ${url} for ${traderId}`);
        console.log(`[${protocol}] Request body:`, JSON.stringify(body));
        console.log(`[${protocol}] Headers:`, {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey.substring(0, 5)}...`,
          'x-api-key': `${this.apiKey.substring(0, 5)}...`
        });

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
<<<<<<< Updated upstream
            'X-API-Key': this.apiKey
=======
            'Authorization': `Bearer ${this.apiKey}`,
            'x-api-key': this.apiKey
>>>>>>> Stashed changes
          },
          body: JSON.stringify(body)
        });

<<<<<<< Updated upstream
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
=======
        console.log(`[${protocol}] Response status:`, response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${protocol}] API error for ${traderId}:`, errorText);
          if (response.status === 404) {
            console.log(`[${protocol}] Skipping 404 for ${traderId}`);
            return [];
          }
          throw new Error(`API request failed: ${response.status} ${errorText}`);
        }

        const data = await response.json() as CopinApiResponse;
        console.log(`[${protocol}] Got response data:`, {
          meta: data.meta,
          dataLength: data.data?.length || 0
        });

        if (!data.data) {
          console.warn(`[${protocol}] No data returned for ${traderId}`);
          return [];
        }

        const newPositions = this.processPositions(data.data, protocol);
        console.log(`[${protocol}] Processed ${newPositions.length} positions for ${traderId}`);
        positions.push(...newPositions);

        // Check if there are more pages
        offset += limit;
        hasMore = data.meta && offset < data.meta.total;

        // Add a small delay between requests
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
>>>>>>> Stashed changes
      }

      return positions;
    } catch (error) {
<<<<<<< Updated upstream
      console.error(`Error fetching positions for ${traderId} on ${protocol}:`, error);
      throw error;
    }

    return positions;
=======
      console.error(`[${protocol}] Error fetching positions for ${traderId}:`, error);
      return [];
    }
>>>>>>> Stashed changes
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

  private mapProtocolToEndpoint(protocol: string): string {
    const protocolMap: { [key: string]: string } = {
      'GMX': 'gmx-arbitrum',
      'GMX_V2': 'gmx-v2',
      'KWENTA': 'kwenta',
      'POLYNOMIAL': 'polynomial',
      'GNS': 'gains',
      'SYNTHETIX': 'snx',
      'AEVO': 'aevo',
      'HYPERLIQUID': 'hyperliquid',
      'VERTEX': 'vertex',
      'PERP': 'perpetual',
      'LYRA': 'lyra'
    };
    const mapped = protocolMap[protocol] || protocol.toLowerCase();
    console.log(`Mapped protocol ${protocol} to ${mapped}`);
    return mapped;
  }

  private processPositions(positions: CopinPositionResponse[], protocol: string): Position[] {
    return positions.map(pos => {
      // Determine if the position is long
      let isLong: boolean;
      if (pos.type === 'LONG' || pos.side === 'LONG') {
        isLong = true;
      } else if (pos.type === 'SHORT' || pos.side === 'SHORT') {
        isLong = false;
      } else {
        isLong = pos.isLong ?? false; // Default to short if unclear
      }

      // Determine position type
      const type = isLong ? 'LONG' : 'SHORT';

      // Convert string values to numbers
      const size = pos.size ? parseFloat(pos.size) : 0;
      const leverage = pos.leverage ? parseFloat(pos.leverage) : 0;
      const pnl = pos.pnl ? parseFloat(pos.pnl) : 0;

      return {
        protocol,
        account: pos.account || '',
        indexToken: pos.indexToken || '',
        size,
        leverage,
        pnl,
        openBlockTime: pos.openBlockTime || '',
        type,
        side: type,
        isLong
      };
    });
  }
}

/**
 * Get all positions from R2 storage
 * @param env Environment variables and bindings
 * @returns Array of positions
 */
export async function getAllPositions(env: Env): Promise<Position[]> {
  try {
    // Get positions data from R2
    const object = await env.SMART_MONEY_BUCKET.get('positions.json');
    if (!object) {
      throw new Error('No positions data found in R2');
    }

    // Parse and return positions
    const positions = await object.json<Position[]>();
    return positions;
  } catch (error) {
    console.error('Error getting positions from R2:', error);
    throw error;
  }
}
