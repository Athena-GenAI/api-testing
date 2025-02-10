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
        tokenStats[token] = {
          token,
          long: 0,
          short: 0,
          total: 0,
          timestamp: Date.now()
        };
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
    const formattedResult: FormattedResult = [];
    
    for (const [token, stats] of Object.entries(tokenStats)) {
      const position = stats.long >= stats.short ? 'LONG' : 'SHORT';
      const longPercentage = (stats.long / (stats.long + stats.short)) * 100;
      const shortPercentage = (stats.short / (stats.long + stats.short)) * 100;
      const percentage = position === 'LONG' ? longPercentage : shortPercentage;
      
      formattedResult.push({
        token,
        total_positions: stats.long + stats.short,
        percentage: `${percentage.toFixed(2)}% ${position === 'LONG' ? 'Long' : 'Short'}`,
        position
      });
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
    if (longPercentage >= shortPercentage) {
      return { position: 'LONG', percentage: longPercentage };
    } else {
      return { position: 'SHORT', percentage: shortPercentage };
    }
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
