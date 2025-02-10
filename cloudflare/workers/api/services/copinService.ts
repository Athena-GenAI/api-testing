/**
 * Service for interacting with the Copin API
 * @see https://docs.copin.io/features/developer/public-api-docs
 */

import { Position } from '../types';
import { TRADER_WALLETS } from '../constants/wallets';
import { SUPPORTED_PROTOCOLS } from '../constants/protocols';

interface CopinPositionResponse {
  type?: 'LONG' | 'SHORT';
  isLong?: boolean;
  side?: 'LONG' | 'SHORT';
  size?: string;
  leverage?: string;
  pnl?: string;
  indexToken?: string;
  openBlockTime?: string;
  account?: string;
  status?: 'OPEN' | 'CLOSE';
}

interface CopinApiResponse {
  data: CopinPositionResponse[];
  meta: {
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
  };
}

export class CopinService {
  private readonly apiBase: string;
  private readonly apiKey: string;

  constructor(apiBase: string, apiKey: string) {
    // Remove /v1 from the API base if present
    this.apiBase = apiBase.replace('/v1', '');
    this.apiKey = apiKey;
  }

  /**
   * Fetches all positions from all traders and protocols
   * @returns Promise<Position[]>
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
   * @param traderId The trader's wallet address
   * @param protocol The protocol to fetch positions from
   * @returns Promise<Position[]>
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
            'Accept': 'application/json',
            'x-api-key': this.apiKey
          },
          body: JSON.stringify(body)
        });
        
        if (!response.ok) {
          if (response.status !== 404) { // Ignore 404s as they might be expected for some protocols
            throw new Error(`HTTP ${response.status} for ${protocol}: ${await response.text()}`);
          }
          break;
        }
        
        const data = await response.json() as CopinApiResponse;

        // Transform positions
        if (data.data && Array.isArray(data.data)) {
          const transformedPositions = data.data
            .map(pos => {
              // Determine if position is long based on type, side, or isLong
              const isLong = pos.type === 'LONG' || pos.side === 'LONG' || pos.isLong === true;
              const type = isLong ? ('LONG' as const) : ('SHORT' as const);
              
              // Only include OPEN positions with valid size and token
              if (pos.status !== 'CLOSE' && pos.size && pos.indexToken) {
                const position: Position = {
                  account: pos.account || traderId,
                  protocol,
                  isLong,
                  type,
                  side: type,
                  size: parseFloat(String(pos.size || '0')),
                  leverage: parseFloat(String(pos.leverage || '0')),
                  pnl: parseFloat(String(pos.pnl || '0')),
                  indexToken: pos.indexToken,
                  openBlockTime: pos.openBlockTime || new Date().toISOString()
                };
                return position;
              }
              return null;
            })
            .filter((pos): pos is Position => pos !== null);

          positions.push(...transformedPositions);
        }

        // Check if we need to fetch more pages
        if (data.meta && data.meta.total > offset + limit) {
          offset += limit;
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          hasMore = false;
        }
      }
    } catch (error) {
      // Return empty array on error, let the caller handle retry logic
      return [];
    }
    
    return positions;
  }

  /**
   * Fetches position data for all trader wallets across all supported protocols
   * @returns Promise<Position[]>
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
