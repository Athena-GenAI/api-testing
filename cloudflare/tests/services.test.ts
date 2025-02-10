/**
 * Test Suite for Smart Money API Services
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DatabaseService } from '../workers/api/services/databaseService';
import { CopinService } from '../workers/api/services/copinService';
import { Position, TokenPosition } from '../workers/api/types';

describe('Services', () => {
  let databaseService: DatabaseService;
  let mockDb: any;

  beforeEach(() => {
    // Create a simple mock D1Database
    mockDb = {
      prepare: jest.fn(() => mockDb),
      bind: jest.fn(() => mockDb),
      all: jest.fn(() => Promise.resolve({ results: [] })),
      run: jest.fn(() => Promise.resolve({ success: true })),
      batch: jest.fn(() => Promise.resolve([{ success: true }])),
      exec: jest.fn(() => Promise.resolve({ success: true }))
    };

    databaseService = new DatabaseService(mockDb);
  });

  describe('DatabaseService', () => {
    describe('storeTokenStats', () => {
      it('should store token stats correctly', async () => {
        const stats: TokenPosition[] = [
          {
            token: 'BTC',
            total_positions: 10,
            percentage: '75%',
            position: 'LONG' as const
          }
        ];

        await databaseService.storeTokenStats(stats);
        expect(mockDb.prepare).toHaveBeenCalled();
      });
    });

    describe('storePositions', () => {
      it('should store a position in the database', async () => {
        const position: Position = {
          type: 'LONG',
          size: 1000000,
          leverage: 10,
          pnl: 100,
          indexToken: 'ETH',
          isLong: true,
          openBlockTime: '1234567890',
          account: '0x123',
          protocol: 'GMX'
        };

        await databaseService.storePositions([position]);
        expect(mockDb.prepare).toHaveBeenCalled();
      });
    });
  });
});
