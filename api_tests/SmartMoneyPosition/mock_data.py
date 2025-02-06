"""
Mock data for testing the Smart Money Position tracker locally.

This module provides test data in the old format for local testing of the
Smart Money Position tracker. The data follows this structure:
{
    "token": str,          # Token symbol (e.g., "BTC", "ETH")
    "total_positions": int, # Total number of positions for this token
    "percentage": str,      # Percentage of positions in the given direction (e.g., "67.6%")
    "position": str        # Position direction ("LONG" or "SHORT")
}

The mock data includes a mix of:
- Priority tokens (BTC, ETH, SOL)
- Popular tokens (DOGE, XRP)
- Other tokens with varying position counts
- Both long and short positions
- Different percentage distributions

This helps test the tracker's ability to:
1. Prioritize BTC, ETH, and SOL
2. Calculate correct long/short counts
3. Sort by total positions
4. Determine sentiment
5. Handle percentage calculations
"""

MOCK_POSITIONS = [
  {
    "token": "ETH",
    "total_positions": 34,
    "percentage": "67.6%",
    "position": "LONG"
  },
  {
    "token": "SOL",
    "total_positions": 26,
    "percentage": "61.5%",
    "position": "LONG"
  },
  {
    "token": "ENA",
    "total_positions": 26,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "BTC",
    "total_positions": 30,
    "percentage": "63.3%",
    "position": "LONG"
  },
  {
    "token": "XRP",
    "total_positions": 29,
    "percentage": "55.2%",
    "position": "SHORT"
  },
  {
    "token": "DOGE",
    "total_positions": 33,
    "percentage": "57.6%",
    "position": "LONG"
  },
  {
    "token": "JUP",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "SHORT"
  },
  {
    "token": "HYPE",
    "total_positions": 19,
    "percentage": "52.6%",
    "position": "SHORT"
  },
  {
    "token": "NEAR",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "SPX",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "SHORT"
  },
  {
    "token": "GRIFFAIN",
    "total_positions": 4,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "ZEREBRO",
    "total_positions": 6,
    "percentage": "66.7%",
    "position": "SHORT"
  },
  {
    "token": "VIRTUAL",
    "total_positions": 4,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "BADGER",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "SHORT"
  },
  {
    "token": "FARTCOIN",
    "total_positions": 17,
    "percentage": "58.8%",
    "position": "LONG"
  },
  {
    "token": "PENGU",
    "total_positions": 12,
    "percentage": "58.3%",
    "position": "LONG"
  },
  {
    "token": "ANIME",
    "total_positions": 4,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "S",
    "total_positions": 3,
    "percentage": "66.7%",
    "position": "SHORT"
  },
  {
    "token": "MELANIA",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "SHORT"
  },
  {
    "token": "TRUMP",
    "total_positions": 12,
    "percentage": "58.3%",
    "position": "LONG"
  },
  {
    "token": "kBONK",
    "total_positions": 12,
    "percentage": "58.3%",
    "position": "LONG"
  },
  {
    "token": "SUI",
    "total_positions": 14,
    "percentage": "57.1%",
    "position": "SHORT"
  },
  {
    "token": "UNI",
    "total_positions": 4,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "AI16Z",
    "total_positions": 7,
    "percentage": "57.1%",
    "position": "LONG"
  },
  {
    "token": "POPCAT",
    "total_positions": 9,
    "percentage": "55.6%",
    "position": "SHORT"
  },
  {
    "token": "CHILLGUY",
    "total_positions": 2,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "LINK",
    "total_positions": 15,
    "percentage": "60.0%",
    "position": "LONG"
  },
  {
    "token": "LTC",
    "total_positions": 18,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "LDO",
    "total_positions": 5,
    "percentage": "60.0%",
    "position": "LONG"
  },
  {
    "token": "WLD",
    "total_positions": 4,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "WIF",
    "total_positions": 7,
    "percentage": "57.1%",
    "position": "SHORT"
  },
  {
    "token": "kPEPE",
    "total_positions": 20,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "AAVE",
    "total_positions": 20,
    "percentage": "60.0%",
    "position": "LONG"
  },
  {
    "token": "ONDO",
    "total_positions": 4,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "GRASS",
    "total_positions": 6,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "KAS",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "CRV",
    "total_positions": 4,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "ADA",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "SEI",
    "total_positions": 2,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "JTO",
    "total_positions": 7,
    "percentage": "57.1%",
    "position": "LONG"
  },
  {
    "token": "kNEIRO",
    "total_positions": 4,
    "percentage": "75.0%",
    "position": "LONG"
  },
  {
    "token": "GOAT",
    "total_positions": 10,
    "percentage": "70.0%",
    "position": "LONG"
  },
  {
    "token": "FIL",
    "total_positions": 4,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "FTM",
    "total_positions": 18,
    "percentage": "72.2%",
    "position": "LONG"
  },
  {
    "token": "GMT",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "ETC",
    "total_positions": 3,
    "percentage": "66.7%",
    "position": "LONG"
  },
  {
    "token": "MOODENG",
    "total_positions": 4,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "FTT",
    "total_positions": 2,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "OP",
    "total_positions": 8,
    "percentage": "62.5%",
    "position": "SHORT"
  },
  {
    "token": "ARB",
    "total_positions": 4,
    "percentage": "75.0%",
    "position": "SHORT"
  },
  {
    "token": "APE",
    "total_positions": 2,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "PURR",
    "total_positions": 2,
    "percentage": "100.0%",
    "position": "SHORT"
  },
  {
    "token": "ZK",
    "total_positions": 2,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "DYDX",
    "total_positions": 7,
    "percentage": "57.1%",
    "position": "LONG"
  },
  {
    "token": "ZRO",
    "total_positions": 3,
    "percentage": "66.7%",
    "position": "LONG"
  },
  {
    "token": "0x0EA09D97b4084d859328ec4bF8eBCF9ecCA26F1D",
    "total_positions": 2,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "0xC8fCd6fB4D15dD7C455373297dEF375a08942eCe",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "0x59b007E9ea8F89b069c43F8f45834d30853e3699",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "SHORT"
  },
  {
    "token": "TAO",
    "total_positions": 5,
    "percentage": "60.0%",
    "position": "LONG"
  },
  {
    "token": "MOVE",
    "total_positions": 2,
    "percentage": "50.0%",
    "position": "SHORT"
  },
  {
    "token": "PYTH",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "AIXBT",
    "total_positions": 2,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "BIO",
    "total_positions": 2,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "MATIC",
    "total_positions": 3,
    "percentage": "66.7%",
    "position": "LONG"
  },
  {
    "token": "OX",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "BLAST",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "PENDLE",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "MNT",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "FET",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "MKR",
    "total_positions": 2,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "RENDER",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "IMX",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "BLUR",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "EIGEN",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "0x2B3bb4c683BFc5239B029131EEf3B1d214478d93",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "STRK",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "MEME",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "INJ",
    "total_positions": 2,
    "percentage": "100.0%",
    "position": "SHORT"
  },
  {
    "token": "STRAX",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  },
  {
    "token": "DYM",
    "total_positions": 1,
    "percentage": "100.0%",
    "position": "LONG"
  }
]