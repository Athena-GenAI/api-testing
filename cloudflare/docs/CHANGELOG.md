# Changelog

## 2025-02-08

### Added
- Added minimum threshold of 5 open positions for anomaly detection
- Added percentage rounding to 2 decimal places
- Added specific ordering for BTC, ETH, and SOL tokens
- Added comprehensive JSDoc comments to all files

### Changed
- Modified percentage format to only show the dominant percentage value (e.g., "67.86%" instead of "67.86% Long")
- Updated position filtering to only include non-priority tokens with 5 or more open positions
- Improved code documentation and comments

### Technical Details

#### Position Data Format
The API now returns positions in the following format:
```json
{
  "token": "BTC",
  "total_positions": 25,
  "percentage": "68.00%",
  "position": "LONG"
}
```

#### Token Ordering
1. Priority tokens are always shown first in this order:
   - BTC
   - ETH
   - SOL

2. Other tokens (anomalies):
   - Must have at least 5 open positions
   - Sorted by how extreme their position is (furthest from 50/50)
   - Only top 3 most extreme positions are included

#### Endpoints
- Development: https://smart-money-api-dev.ggenega.workers.dev/smart-money/positions
- Production: https://api.0xathena.ai/smart-money/positions

#### Testing Changes
To test changes:
1. Deploy to development:
   ```bash
   wrangler deploy --env dev
   ```
2. Trigger an update:
   ```bash
   curl -X POST https://smart-money-api-dev.ggenega.workers.dev/smart-money/update
   ```
3. Verify the changes:
   ```bash
   curl https://smart-money-api-dev.ggenega.workers.dev/smart-money/positions
   ```
4. If everything looks good, deploy to production:
   ```bash
   wrangler deploy --env production
   ```
