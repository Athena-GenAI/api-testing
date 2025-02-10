/**
 * Service for analyzing position data and generating statistics
 */

import { Position, TokenStats, FormattedResult, TokenStatistics } from '../types';
import { PRIORITY_TOKENS } from '../types';

export class PositionAnalyzer {
  /**
   * Analyzes positions and generates statistics for each token
   * @param positions Array of positions to analyze
   * @returns Formatted statistics for each token
   */
  analyzePositions(positions: Position[]): FormattedResult {
    const tokenStats = this.calculateTokenStats(positions);
    return this.formatResults(tokenStats);
  }

  /**
   * Calculates statistics for each token from position data
   * @param positions Array of positions to analyze
   * @returns Statistics for each token
   */
  private calculateTokenStats(positions: Position[]): TokenStatistics {
    const tokenStats: TokenStatistics = {};

    for (const position of positions) {
      const token = this.normalizeToken(position.indexToken);
      
      if (!tokenStats[token]) {
        tokenStats[token] = { long: 0, short: 0 };
      }

      if (position.isLong) {
        tokenStats[token].long++;
      } else {
        tokenStats[token].short++;
      }
    }

    return tokenStats;
  }

  /**
   * Formats token statistics into a readable format
   * @param tokenStats Statistics for each token
   * @returns Formatted results
   */
  private formatResults(tokenStats: TokenStatistics): FormattedResult {
    const formattedResult: FormattedResult = {};
    const orderedTokens = this.orderTokensByPriority(Object.keys(tokenStats));

    for (const token of orderedTokens) {
      const stats = tokenStats[token];
      const totalPositions = stats.long + stats.short;

      if (totalPositions > 0) {
        const longPercentage = (stats.long / totalPositions) * 100;
        const shortPercentage = (stats.short / totalPositions) * 100;
        
        const { position, percentage } = this.determinePosition(longPercentage, shortPercentage);

        formattedResult[token] = {
          total_positions: totalPositions,
          percentage: `${percentage.toFixed(1)}%`,
          position: `${position} ${percentage.toFixed(1)}%`
        };
      }
    }

    return formattedResult;
  }

  /**
   * Orders tokens by priority with priority tokens first
   * @param tokens Array of token symbols
   * @returns Ordered array of tokens
   */
  private orderTokensByPriority(tokens: string[]): string[] {
    const prioritySet = new Set(PRIORITY_TOKENS);
    const priorityTokens = tokens.filter(token => prioritySet.has(token));
    const otherTokens = tokens.filter(token => !prioritySet.has(token)).sort();
    
    return [...priorityTokens, ...otherTokens];
  }

  /**
   * Determines the majority position and its percentage
   * @param longPercentage Percentage of long positions
   * @param shortPercentage Percentage of short positions
   * @returns Position type and percentage
   */
  private determinePosition(longPercentage: number, shortPercentage: number): { position: string; percentage: number } {
    if (longPercentage > shortPercentage) {
      return { position: 'LONG', percentage: longPercentage };
    } else if (shortPercentage > longPercentage) {
      return { position: 'SHORT', percentage: shortPercentage };
    }
    return { position: 'NEUTRAL', percentage: 50.0 };
  }

  /**
   * Normalizes token symbols to a consistent format
   * @param token Raw token symbol
   * @returns Normalized token symbol
   */
  private normalizeToken(token: string): string {
    if (token.startsWith('0x')) return token;
    return `$${token.replace(/^\$/, '').split('-').pop()}`;
  }
}
