/**
 * Test Suite for Copin Service
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { CopinService } from '../services/copinService';
import { TRADER_WALLETS } from '../constants/wallets';
import { SUPPORTED_PROTOCOLS } from '../constants/protocols';

describe('CopinService', () => {
  const baseUrl = 'https://api.example.com';
  const apiKey = 'test-api-key';
  let copinService: CopinService;

  // Mock fetch globally
  const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
  global.fetch = fetchMock;

  beforeEach(() => {
    fetchMock.mockClear();
    // Initialize with test API base URL and mock API key
    copinService = new CopinService(baseUrl, apiKey);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAllPositions', () => {
    it('should fetch and transform positions correctly', async () => {
      const mockResponse = {
        positions: [
          { type: 'LONG', size: '1000', leverage: '2', pnl: '100' }
        ]
      };

      fetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        } as Response)
      );

      const positions = await copinService.fetchAllPositions();
      expect(positions.length).toBeGreaterThan(0);
      expect(positions[0].isLong).toBe(true);
    }, 10000); // Increase timeout to 10 seconds

    it('should handle API errors gracefully', async () => {
      fetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response)
      );

      await expect(copinService.fetchAllPositions()).rejects.toThrow('Failed to fetch any positions');
    }, 10000); // Increase timeout to 10 seconds

    it('should handle different position type formats', async () => {
      const testCases = [
        {
          response: { positions: [{ type: 'LONG' }] },
          expected: true
        },
        {
          response: { positions: [{ isLong: true }] },
          expected: true
        },
        {
          response: { positions: [{ side: 'LONG' }] },
          expected: true
        }
      ];

      for (const testCase of testCases) {
        fetchMock.mockImplementation(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(testCase.response)
          } as Response)
        );

        const positions = await copinService.fetchAllPositions();
        expect(positions[0].isLong).toBe(testCase.expected);
      }
    }, 10000); // Increase timeout to 10 seconds
  });

  it('should be defined', () => {
    expect(copinService).toBeDefined();
  });
});
