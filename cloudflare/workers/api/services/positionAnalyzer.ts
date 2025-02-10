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

import { Position, TokenStats, FormattedResult, TokenStatistics } from '../types';
import { PRIORITY_TOKENS } from '../types';

/**
 * Position Analyzer Class
 * Provides methods for analyzing trading positions and generating insights
 * 
 * @class PositionAnalyzer
 */
export class PositionAnalyzer {
  /**
   * Analyzes positions and generates comprehensive statistics for each token
   * 
   * @method analyzePositions
   * @param {Position[]} positions - Array of trading positions to analyze
   * @returns {FormattedResult} Formatted statistics for each token
   * 
   * @example
   * const analyzer = new PositionAnalyzer();
   * const stats = analyzer.analyzePositions(positions);
   * // Returns: [{ token: '$BTC', total_positions: 100, percentage: '75% Long', position: 'LONG' }, ...]
   */
  analyzePositions(positions: Position[]): FormattedResult {
    const tokenStats = this.calculateTokenStats(positions);
    return this.formatResults(tokenStats);
  }

  /**
   * Calculates detailed statistics for each token from position data
   * Aggregates long and short positions, calculates totals and timestamps
   * 
   * @private
   * @method calculateTokenStats
   * @param {Position[]} positions - Array of positions to analyze
   * @returns {TokenStatistics} Statistics for each token
   * 
   * @example
   * private result = calculateTokenStats(positions);
   * // Returns: { '$BTC': { token: '$BTC', long: 75, short: 25, total: 100, timestamp: 1234567890 } }
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
      
      tokenStats[token].total = tokenStats[token].long + tokenStats[token].short;
    }

    return tokenStats;
  }

  /**
   * Formats token statistics into a human-readable format
   * Calculates percentages and determines dominant positions
   * 
   * @private
   * @method formatResults
   * @param {TokenStatistics} tokenStats - Raw token statistics
   * @returns {FormattedResult} Formatted and sorted results
   * 
   * @example
   * private result = formatResults(tokenStats);
   * // Returns: [{ token: '$BTC', total_positions: 100, percentage: '75% Long', position: 'LONG' }]
   */
  private formatResults(tokenStats: TokenStatistics): FormattedResult {
    const formattedResult: FormattedResult = [];
    
    // Get all tokens and order them by priority
    const tokens = this.orderTokensByPriority(Object.keys(tokenStats));
    
    for (const token of tokens) {
      const stats = tokenStats[token];
      const total = stats.long + stats.short;
      
      if (total === 0) continue;
      
      const longPercentage = (stats.long / total) * 100;
      const shortPercentage = (stats.short / total) * 100;
      const { position, percentage } = this.determinePosition(longPercentage, shortPercentage);
      
      formattedResult.push({
        token,
        total_positions: total,
        percentage: `${percentage.toFixed(2)}% ${position === 'LONG' ? 'Long' : 'Short'}`,
        position
      });
    }
    
    return formattedResult;
  }

  /**
   * Orders tokens by priority with priority tokens first
   * Maintains a consistent ordering for better UX
   * 
   * @private
   * @method orderTokensByPriority
   * @param {string[]} tokens - Array of token symbols
   * @returns {string[]} Ordered array of tokens
   * 
   * @example
   * private result = orderTokensByPriority(['$SOL', '$BTC', '$PEPE']);
   * // Returns: ['$BTC', '$SOL', '$PEPE']
   */
  private orderTokensByPriority(tokens: string[]): string[] {
    const prioritySet = new Set(PRIORITY_TOKENS);
    const priorityTokens = tokens.filter(token => prioritySet.has(token));
    const otherTokens = tokens.filter(token => !prioritySet.has(token)).sort();
    
    return [...priorityTokens, ...otherTokens];
  }

  /**
   * Determines the majority position and its percentage
   * Used to identify market sentiment for a token
   * 
   * @private
   * @method determinePosition
   * @param {number} longPercentage - Percentage of long positions
   * @param {number} shortPercentage - Percentage of short positions
   * @returns {{ position: string; percentage: number }} Position type and percentage
   * 
   * @example
   * private result = determinePosition(75, 25);
   * // Returns: { position: 'LONG', percentage: 75 }
   */
  private determinePosition(longPercentage: number, shortPercentage: number): { position: string; percentage: number } {
    if (longPercentage >= shortPercentage) {
      return { position: 'LONG', percentage: longPercentage };
    } else {
      return { position: 'SHORT', percentage: shortPercentage };
    }
  }

  /**
   * Normalizes token symbols for consistent formatting
   * Ensures all tokens follow the same format (e.g., $BTC)
   * 
   * @private
   * @method normalizeToken
   * @param {string} token - Raw token symbol
   * @returns {string} Normalized token symbol
   * 
   * @example
   * private result = normalizeToken('BTC');
   * // Returns: '$BTC'
   */
  private normalizeToken(token: string): string {
    // Remove any existing $ prefix
    token = token.replace('$', '');
    // Uppercase the token
    token = token.toUpperCase();
    // Add $ prefix
    return `$${token}`;
  }
}
