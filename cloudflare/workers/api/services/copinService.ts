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
    this.apiBase = apiBase;
    this.apiKey = apiKey;
  }

  /**
   * Fetches position data for all trader wallets across all supported protocols
   * @returns Promise<Position[]>
   */
  async fetchAllPositions(): Promise<Position[]> {
    const allPositions: Position[] = [];
    const errors: Error[] = [];

    const fetchPromises = TRADER_WALLETS.flatMap(traderId =>
      SUPPORTED_PROTOCOLS.map(async protocol => {
        try {
          const url = `${this.apiBase}/${protocol}/position/filter`;
          console.log(`Fetching from ${url}`);
          
          const body = {
            pagination: {
              limit: 100,
              offset: 0
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
            if (response.status === 404) {
              console.warn(`No positions found for ${protocol} trader ${traderId}`);
            } else {
              console.error(`Error ${response.status} fetching ${protocol} data for ${traderId}`);
              console.error('Response:', await response.text());
            }
            return;
          }
          
          const data = await response.json() as CopinApiResponse;

          // Transform positions
          if (data.data && Array.isArray(data.data)) {
            const transformedPositions = data.data.map(pos => {
              const isLong = pos.isLong ?? (pos.type === 'LONG') ?? true;
              const type = pos.type || (isLong ? 'LONG' : 'SHORT');
              return {
                account: pos.account || traderId,
                protocol,
                isLong,
                type,
                side: pos.side,
                size: parseFloat(pos.size || '0'),
                leverage: parseFloat(pos.leverage || '0'),
                pnl: parseFloat(pos.pnl || '0'),
                indexToken: pos.indexToken || '',
                openBlockTime: pos.openBlockTime || ''
              };
            });

            if (transformedPositions.length > 0) {
              console.log(`Found ${transformedPositions.length} positions for ${protocol} trader ${traderId}`);
              allPositions.push(...transformedPositions);
            }
          }
        } catch (error) {
          console.error(`Error fetching ${protocol} data for ${traderId}:`, error);
          errors.push(error as Error);
        }
      })
    );

    await Promise.all(fetchPromises);

    if (allPositions.length === 0 && errors.length > 0) {
      throw new Error('Failed to fetch any positions');
    }

    return allPositions;
  }
}
