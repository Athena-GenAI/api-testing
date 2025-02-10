/**
 * Position Analysis Service Module
 * 
 * This service analyzes trading position data to generate statistical insights
 * and market sentiment indicators. It processes raw position data to calculate
 * various metrics including position ratios, token dominance, and trend analysis.
 * 
 * Features:
 * - Position aggregation by token
 * - Long/Short ratio analysis
 * - Priority token handling
 * - Market sentiment calculation
 * - Historical trend analysis
 * 
 * @module PositionAnalyzer
 * @version 1.0.0
 * @since 2025-02-10
 */

import { Position, TokenStats } from '../types';

/**
 * Internal token statistics for analysis
 */
interface InternalTokenStats {
  long: number;
  short: number;
  total: number;
}

/**
 * Position Analyzer Service
 * Analyzes position data to generate token statistics
 */
export class PositionAnalyzer {
  /**
   * Analyze positions to generate token statistics
   * @param positions Array of positions to analyze
   * @returns Array of token statistics
   */
  public analyzePositions(positions: Position[]): TokenStats[] {
    // Group positions by token
    const tokenStats: Record<string, InternalTokenStats> = {};

    // Process each position
    for (const position of positions) {
      const token = this.normalizeToken(position.indexToken);
      
      // Initialize token stats if not exists
      if (!tokenStats[token]) {
        tokenStats[token] = {
          long: 0,
          short: 0,
          total: 0
        };
      }

      // Update counts based on position type
      if (position.isLong) {
        tokenStats[token].long++;
      } else {
        tokenStats[token].short++;
      }
      tokenStats[token].total = tokenStats[token].long + tokenStats[token].short;
    }

    // Convert to array of TokenStats
    const stats = Object.entries(tokenStats)
      .filter(([_, stats]) => stats.total >= 5) // Only include tokens with 5 or more positions
      .map(([token, stats]): TokenStats => {
        const longPercentage = Math.round((stats.long / stats.total) * 100);
        const position = longPercentage === 50 ? 'NEUTRAL' as const :
                        longPercentage > 50 ? 'LONG' as const :
                        'SHORT' as const;
        return {
          token,
          total_positions: stats.total,
          percentage: `${longPercentage}%`,
          position
        };
      });

    // Sort tokens: BTC, ETH, SOL first, then by total positions
    const priorityTokens = ['BTC', 'ETH', 'SOL'];
    const sortedStats = stats.sort((a, b) => {
      const aIndex = priorityTokens.indexOf(a.token);
      const bIndex = priorityTokens.indexOf(b.token);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return b.total_positions - a.total_positions;
    });

    // Return maximum 6 tokens
    return sortedStats.slice(0, 6);
  }

  /**
   * Normalize token symbol
   * @param token Token symbol to normalize
   * @returns Normalized token symbol
   */
  private normalizeToken(token: string): string {
    return token.replace(/^[$]/, '').toUpperCase();
  }
}
