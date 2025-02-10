/**
 * Database Service for Smart Money API
 * Handles all database operations using Cloudflare D1
 */

import { D1Database, D1PreparedStatement } from '@cloudflare/workers-types';
import { Position, TokenPosition, Analysis, HistoricalAnalysis } from '../types';

interface D1Result<T = any> {
  results: T[];
  success: boolean;
  meta?: {
    duration: number;
  };
}

interface D1Row {
  [key: string]: string | number | boolean | null;
}

export class DatabaseService {
  constructor(private db: D1Database) {}

  /**
   * Store multiple positions using batch operations for better performance
   */
  async storePositions(positions: Position[]): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO positions (
        type, size, leverage, pnl, index_token, account, protocol, is_long, open_block_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const batch = positions.map(position => 
      stmt.bind(
        position.type,
        position.size,
        position.leverage,
        position.pnl,
        position.indexToken,
        position.account,
        position.protocol,
        position.isLong ? 1 : 0,
        position.openBlockTime
      )
    );

    await this.db.batch(batch);
  }

  /**
   * Store multiple token stats using batch operations
   */
  async storeTokenStats(stats: TokenPosition[]): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO position_stats (
        token,
        total_positions,
        percentage,
        position
      ) VALUES (?, ?, ?, ?)
    `);

    const batch = stats.map(stat => 
      stmt.bind(
        stat.token,
        stat.total_positions,
        stat.percentage,
        stat.position
      )
    );

    await this.db.batch(batch);
  }

  /**
   * Get all positions from the database
   */
  async getAllPositions(): Promise<Position[]> {
    const result = await this.db.prepare(`
      SELECT 
        type,
        size,
        leverage,
        pnl,
        index_token as indexToken,
        account,
        protocol,
        is_long as isLong,
        open_block_time as openBlockTime
      FROM positions 
      WHERE open_block_time >= datetime('now', '-24 hours')
      ORDER BY open_block_time DESC
    `).all<Position>();

    return result.results.map(pos => ({
      ...pos,
      isLong: Boolean(pos.isLong),
      size: Number(pos.size),
      leverage: Number(pos.leverage),
      pnl: Number(pos.pnl)
    }));
  }

  /**
   * Get positions for a specific account
   */
  async getPositionsForAccount(account: string): Promise<Position[]> {
    const result = await this.db.prepare(`
      SELECT * FROM positions WHERE account = ? ORDER BY open_block_time DESC
    `).bind(account).all<Position>();
    return result.results;
  }

  /**
   * Get all token stats
   */
  async getAllTokenStats(): Promise<TokenPosition[]> {
    const result = await this.db.prepare(`
      SELECT * FROM position_stats ORDER BY token
    `).all<TokenPosition>();
    return result.results;
  }

  /**
   * Get token stats for a specific token
   */
  async getTokenStats(token: string): Promise<TokenPosition[]> {
    const result = await this.db.prepare(`
      SELECT * FROM position_stats WHERE token = ? ORDER BY token
    `).bind(token).all<TokenPosition>();
    return result.results;
  }

  /**
   * Insert analysis results using individual transactions
   */
  async insertAnalysis(analyses: Analysis[]): Promise<void> {
    for (const analysis of analyses) {
      await this.db.prepare(`
        INSERT INTO analysis (token_address, sentiment, confidence, factors)
        VALUES (?, ?, ?, ?)
      `).bind(
        analysis.tokenAddress,
        analysis.sentiment,
        analysis.confidence,
        JSON.stringify(analysis.factors)
      ).run();
    }
  }

  /**
   * Get all analysis results
   */
  async getAllAnalysis(): Promise<Analysis[]> {
    const result = await this.db.prepare(`
      SELECT * FROM analysis ORDER BY token_address
    `).all<D1Row>();
    return result.results.map(row => ({
      tokenAddress: row.token_address as string,
      sentiment: row.sentiment as 'BULLISH' | 'BEARISH' | 'NEUTRAL',
      confidence: Number(row.confidence),
      factors: JSON.parse(row.factors as string) as string[]
    }));
  }

  /**
   * Get analysis for a specific token
   */
  async getAnalysisForToken(tokenAddress: string): Promise<Analysis | null> {
    const result = await this.db.prepare(`
      SELECT * FROM analysis WHERE token_address = ? ORDER BY token_address DESC LIMIT 1
    `).bind(tokenAddress).first<D1Row>();
    
    if (!result) return null;
    
    return {
      tokenAddress: result.token_address as string,
      sentiment: result.sentiment as 'BULLISH' | 'BEARISH' | 'NEUTRAL',
      confidence: Number(result.confidence),
      factors: JSON.parse(result.factors as string) as string[]
    };
  }
}
