import { CopinService } from '../services/copinService';
import { TRADER_WALLETS } from '../constants/wallets';
import { SUPPORTED_PROTOCOLS } from '../constants/protocols';

describe('CopinService', () => {
  let copinService: CopinService;
  const fetchMock = jest.fn();

  beforeEach(() => {
    (global as any).fetch = fetchMock;
    // Initialize with test API base URL and mock API key
    copinService = new CopinService('https://api.example.com', 'test-api-key');
    fetchMock.mockClear();
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
          json: () => Promise.resolve(mockResponse),
          clone: function() {
            return {
              ok: true,
              json: () => Promise.resolve(mockResponse)
            };
          }
        })
      );

      const positions = await copinService.fetchAllPositions();
      expect(positions.length).toBeGreaterThan(0);
      expect(positions[0].isLong).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      fetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          clone: function() {
            return {
              ok: false,
              status: 500
            };
          }
        })
      );

      await expect(copinService.fetchAllPositions()).rejects.toThrow('Failed to fetch any positions');
    });

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
            json: () => Promise.resolve(testCase.response),
            clone: function() {
              return {
                ok: true,
                json: () => Promise.resolve(testCase.response)
              };
            }
          })
        );

        const positions = await copinService.fetchAllPositions();
        expect(positions[0].isLong).toBe(testCase.expected);
      }
    });
  });

  it('should be defined', () => {
    expect(copinService).toBeDefined();
  });
});
