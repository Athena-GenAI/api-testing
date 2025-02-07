/**
 * Service for managing data storage and caching using Cloudflare KV and R2
 */

import { FormattedResult, Position, CopinApiResponse } from '../types';
import { CACHE_TTL } from '../types';

export class StorageService {
  private readonly kv: KVNamespace;
  private readonly r2: R2Bucket;

  constructor(kv: KVNamespace, r2: R2Bucket) {
    this.kv = kv;
    this.r2 = r2;
  }

  /**
   * Retrieves cached position data if available
   * @param date Current date string
   * @returns Promise<FormattedResult | null>
   */
  async getCachedPositions(date: string): Promise<FormattedResult | null> {
    try {
      const cached = await this.kv.get(`positions:${date}`, 'json');
      return cached as FormattedResult | null;
    } catch (error) {
      console.error('Error retrieving cached positions:', error);
      return null;
    }
  }

  /**
   * Stores position data in both KV and R2
   * @param date Current date string
   * @param positions Raw position data
   * @param formattedResults Analyzed position results
   */
  async storePositions(
    date: string,
    positions: Position[],
    formattedResults: FormattedResult
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    
    try {
      // Store in KV for fast access
      await this.kv.put(
        `positions:${date}`,
        JSON.stringify(formattedResults),
        { expirationTtl: CACHE_TTL }
      );

      // Store raw data in R2 for archival
      const rawData: CopinApiResponse = {
        positions,
        timestamp
      };

      await this.r2.put(
        `positions/${date}/${timestamp}.json`,
        JSON.stringify(rawData),
        {
          customMetadata: {
            type: 'positions',
            date,
            count: positions.length.toString()
          }
        }
      );

      // Store analyzed data in R2 for archival
      await this.r2.put(
        `analyzed/${date}/${timestamp}.json`,
        JSON.stringify(formattedResults),
        {
          customMetadata: {
            type: 'analyzed',
            date,
            tokenCount: Object.keys(formattedResults).length.toString()
          }
        }
      );
    } catch (error) {
      console.error('Error storing positions:', error);
      throw error;
    }
  }

  /**
   * Lists all position data for a given date from R2
   * @param date Date string
   * @returns Promise<string[]> List of object keys
   */
  async listPositionsForDate(date: string): Promise<string[]> {
    const objects = await this.r2.list({
      prefix: `positions/${date}/`
    });
    return objects.objects.map(obj => obj.key);
  }
}
