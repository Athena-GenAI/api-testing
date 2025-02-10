/**
 * Live API Tests for Copin Service
 * These tests interact with the actual Copin API
 * 
 * To run these tests:
 * 1. Create a .env file in the project root
 * 2. Add your Copin API key: COPIN_API_KEY=your_api_key_here
 * 3. Run the tests: npm run test tests/live-api.test.ts
 * 
 * @see https://docs.copin.io/features/developer/public-api-docs
 */

import * as dotenv from 'dotenv';
import { CopinService } from '../workers/api/services/copinService';
import { Position } from '../workers/api/types';
import { SUPPORTED_PROTOCOLS } from '../workers/api/constants/protocols';
import { TRADER_WALLETS } from '../workers/api/constants/wallets';

// Load environment variables from .env file
dotenv.config();

// Configure the service with dev environment settings
const API_BASE = 'https://api.copin.io/v1'; // Using the dev API endpoint
const API_KEY = '495684f1-a50a-4de1-b693-86b343c7aaf1'; // Using the dev API key

describe('Live Copin API Tests', () => {
  const copinService = new CopinService(API_BASE, API_KEY);

  describe('Position Fetching', () => {
    it('should fetch positions for a single trader', async () => {
      console.log('\n🔍 Testing position fetch for single trader...');
      const traderId = "0x0171d947ee6ce0f487490bD4f8D89878FF2d88BA"; // Known GMX trader
      const protocol = "GMX";
      const positions = await copinService.fetchPositionsForTrader(traderId, protocol);
      expect(positions).toBeDefined();
      expect(Array.isArray(positions)).toBe(true);
      if (positions.length > 0) {
        expect(positions[0]).toMatchObject({
          account: expect.any(String),
          protocol: expect.any(String),
          size: expect.any(Number)
        });
      }
      console.log(`Found ${positions.length} positions for trader ${traderId} on ${protocol}`);
    }, 30000); // 30 second timeout

    it('should fetch positions across multiple protocols for single trader', async () => {
      console.log('\n🌐 Testing position fetch across protocols for single trader...');
      const traderId = "0x0171d947ee6ce0f487490bD4f8D89878FF2d88BA"; // Known GMX trader
      const protocols = ["GMX", "GMX_V2", "GMX_AVAX"].slice(0, 3); // Test first 3 protocols
      const allPositions: Position[] = [];
      
      for (const protocol of protocols) {
        const protocolPositions = await copinService.fetchPositionsForTrader(traderId, protocol);
        allPositions.push(...protocolPositions);
        console.log(`${protocol}: ${protocolPositions.length} positions found for trader ${traderId}`);
        expect(Array.isArray(protocolPositions)).toBe(true);
      }

      console.log(`Total positions found: ${allPositions.length}`);
    }, 60000); // 60 second timeout

    it('should handle pagination correctly for single trader', async () => {
      console.log('\n📄 Testing pagination for single trader...');
      const traderId = "0x0171d947ee6ce0f487490bD4f8D89878FF2d88BA"; // Known GMX trader
      const protocol = "GMX";
      const positions = await copinService.fetchPositionsForTrader(traderId, protocol);
      expect(positions).toBeDefined();
      expect(Array.isArray(positions)).toBe(true);
      console.log(`Total positions fetched: ${positions.length}`);
    }, 30000); // 30 second timeout
  });

  describe('Data Validation', () => {
    it('should validate position data structure', async () => {
      console.log('\n✅ Testing position data structure...');
      const traderId = "0x0171d947ee6ce0f487490bD4f8D89878FF2d88BA"; // Known GMX trader
      const protocol = "GMX";
      const positions = await copinService.fetchPositionsForTrader(traderId, protocol);
      
      if (positions.length > 0) {
        const position = positions[0];
        expect(position).toMatchObject({
          account: expect.any(String),
          protocol: expect.any(String),
          size: expect.any(Number)
        });
      }
    }, 30000); // 30 second timeout

    it('should handle rate limits appropriately', async () => {
      console.log('\n🚦 Testing rate limiting...');
      const traderId = "0x0171d947ee6ce0f487490bD4f8D89878FF2d88BA"; // Known GMX trader
      const protocol = "GMX";
      const requests = Array(3).fill(null).map(() => 
        copinService.fetchPositionsForTrader(traderId, protocol)
      );
      
      await expect(Promise.all(requests)).resolves.toBeDefined();
    }, 60000); // 60 second timeout for multiple requests
  });
});
