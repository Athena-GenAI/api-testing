/**
 * Test Suite for AI Service
 * Tests the integration with Cloudflare Workers AI
 */

import { describe, it, expect, jest } from '@jest/globals';
import { AIService } from '../workers/api/services/aiService';
import { Position, TokenPosition } from '../workers/api/types';

describe('AIService', () => {
  let aiService: AIService;
  let mockAI: any;

  beforeEach(() => {
    mockAI = {
      run: jest.fn().mockImplementation(function(this: any, ...args: any[]) {
        const [model] = args;
        switch (model) {
          case '@cf/sentiment':
            return Promise.resolve({ score: 0.75 });
          case '@cf/anomaly-detection':
            return Promise.resolve({
              anomalies: [{ timestamp: '2025-02-08', score: 0.85 }]
            });
          default:
            return Promise.resolve({});
        }
      })
    };
    aiService = new AIService(mockAI as any);
  });

  describe('analyzePositionPatterns', () => {
    it('should analyze positions and return sentiment analysis', async () => {
      const positions: Position[] = [
        {
          type: 'LONG',
          size: 1000,
          leverage: 10,
          pnl: 100,
          indexToken: 'ETH',
          account: '0x123',
          protocol: 'GMX',
          isLong: true,
          openBlockTime: '1234567890'
        }
      ];

      const result = await aiService.analyzePositionPatterns(positions);

      expect(result).toEqual({
        sentiment: 'BULLISH',
        confidence: expect.any(Number),
        factors: expect.any(Array)
      });

      expect(mockAI.run).toHaveBeenCalledWith('@cf/sentiment', {
        text: expect.any(String)
      });
    });

    it('should handle neutral sentiment', async () => {
      mockAI.run.mockImplementationOnce(function(this: any, ...args: any[]) {
        return Promise.resolve({ score: 0.1 });
      });

      const positions: Position[] = [
        {
          type: 'LONG',
          size: 1000,
          leverage: 10,
          pnl: 100,
          indexToken: 'ETH',
          account: '0x123',
          protocol: 'GMX',
          isLong: true,
          openBlockTime: '1234567890'
        }
      ];

      const result = await aiService.analyzePositionPatterns(positions);

      expect(result.sentiment).toBe('NEUTRAL');
    });

    it('should handle bearish sentiment', async () => {
      mockAI.run.mockImplementationOnce(function(this: any, ...args: any[]) {
        return Promise.resolve({ score: -0.75 });
      });

      const positions: Position[] = [
        {
          type: 'SHORT',
          size: 1000,
          leverage: 10,
          pnl: -100,
          indexToken: 'ETH',
          account: '0x123',
          protocol: 'GMX',
          isLong: false,
          openBlockTime: '1234567890'
        }
      ];

      const result = await aiService.analyzePositionPatterns(positions);

      expect(result.sentiment).toBe('BEARISH');
    });
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies correctly', async () => {
      const stats = [
        {
          token: 'BTC',
          total_positions: 10,
          percentage: '75%',
          position: 'LONG' as const
        },
        {
          token: 'ETH',
          total_positions: 8,
          percentage: '25%',
          position: 'SHORT' as const
        }
      ];

      const anomalies = await aiService.detectAnomalies(stats);
      expect(anomalies).toBeDefined();
      expect(Array.isArray(anomalies)).toBe(true);
    });

    it('should detect market anomalies', async () => {
      const stats: TokenPosition[] = [
        {
          token: 'BTC',
          total_positions: 10,
          percentage: '75%',
          position: 'LONG' as const
        },
        {
          token: 'ETH',
          total_positions: 8,
          percentage: '25%',
          position: 'SHORT' as const
        }
      ];

      const result = await aiService.detectAnomalies(stats);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
