"""
Smart Money Position Tracker
This module tracks and analyzes smart money positions from various protocols.

The tracker supports two data formats:
1. New Format (from live API):
   {
       "indexToken": "BTC",
       "isLong": true,
       "trader_id": "0x...",
       "protocol": "gmx",
       "size": 100000
   }

2. Old Format (from historical data):
   {
       "token": "BTC",
       "total_positions": 30,
       "percentage": "63.3%",
       "position": "LONG"
   }

The module prioritizes BTC, ETH, and SOL in the output and returns the top 6 positions
by total position count. For each token, it provides:
- Long and short position counts
- Total number of positions
- Number of unique traders (new format only)
- List of protocols used (new format only)
- Overall sentiment (bullish/bearish)
"""

import requests
import json
from datetime import datetime
import os
import logging
from typing import Dict, List, Optional, Tuple
from constants.wallets import TRADER_WALLETS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CopinAPI:
    """Class for making requests to the Copin API."""

    def __init__(self):
        """Initialize the CopinAPI class with base URL and supported protocols."""
        self.base_url = "https://api.copin.io"
        self.supported_protocols = [
            'GMX', 'KWENTA', 'POLYNOMIAL', 'POLYNOMIAL_L2', 'GMX_V2_AVAX', 'GMX_V2',
            'GNS', 'GNS_POLY', 'GNS_BASE', 'GNS_APE', 'LEVEL_BNB', 'LEVEL_ARB',
            'MUX_ARB', 'APOLLOX_BNB', 'AVANTIS_BASE', 'EQUATION_ARB', 'LOGX_BLAST',
            'LOGX_MODE', 'MYX_ARB', 'DEXTORO', 'VELA_ARB', 'HMX_ARB', 'SYNTHETIX_V3',
            'SYNTHETIX_V3_ARB', 'KTX_MANTLE', 'CYBERDEX', 'YFX_ARB', 'KILOEX_OPBNB',
            'KILOEX_BNB', 'KILOEX_MANTA', 'KILOEX_BASE', 'ROLLIE_SCROLL',
            'MUMMY_FANTOM', 'HYPERLIQUID', 'SYNFUTURE_BASE', 'MORPHEX_FANTOM',
            'PERENNIAL_ARB', 'BSX_BASE', 'DYDX', 'UNIDEX_ARB', 'VERTEX_ARB',
            'HORIZON_BNB', 'HOLDSTATION_ZKSYNC', 'ZENO_METIS', 'LINEHUB_LINEA',
            'BMX_BASE', 'FOXIFY_ARB', 'APOLLOX_BASE', 'GMX_AVAX', 'SYNTHETIX',
            'DEPERP_BASE', 'ELFI_ARB'
        ]

    def get_position_data(self, trader_id: str, protocol: str, max_retries: int = 3) -> Optional[Dict]:
        """Get position statistics for a trader and protocol.
        
        Args:
            trader_id (str): ID of the trader (EVM address)
            protocol (str): Protocol to get positions for (e.g., GMX, KWENTA)
            max_retries (int): Maximum number of retry attempts
            
        Returns:
            dict|None: Position statistics data if successful, None if failed
        """
        if not trader_id or not protocol:
            raise ValueError("Trader ID and protocol must be provided")

        url = f"{self.base_url}/{protocol}/position/filter"
        
        # Prepare request body according to API docs
        request_body = {
            "pagination": {
                "limit": 100,
                "offset": 0
            },
            "queries": [
                {
                    "fieldName": "status",
                    "value": "OPEN"
                },
                {
                    "fieldName": "account",
                    "value": trader_id
                }
            ],
            "sortBy": "openBlockTime",
            "sortType": "desc"
        }
        
        for attempt in range(max_retries):
            try:
                response = requests.post(url, json=request_body)
                response.raise_for_status()
                return response.json()
            except requests.exceptions.RequestException as e:
                logger.info(f"Attempt {attempt + 1} failed, retrying...")
                if attempt == max_retries - 1:
                    logger.warning(f"Failed to fetch position data after {max_retries} attempts: {str(e)}")
                    return None

    def get_opening_data(self, trader_id: str, protocol: str) -> Dict:
        """Get opening position data for a trader and protocol.
        This is an alias for get_position_data with status=OPEN.
        
        Args:
            trader_id (str): ID of the trader (EVM address)
            protocol (str): Protocol to get positions for
            
        Returns:
            dict: Opening position data
        """
        return self.get_position_data(trader_id, protocol)

def transform_position_data(positions: List[Dict]) -> List[Dict]:
    """
    Transform position data from Copin API format to the standard format.
    
    Args:
        positions (List[Dict]): Raw position data from Copin API
        
    Returns:
        List[Dict]: Transformed data in the format:
        {
            "token": str,          # Token symbol (e.g., "BTC", "ETH")
            "total_positions": int, # Total number of positions for this token
            "percentage": str,      # Percentage of positions in given direction (e.g., "67.6%")
            "position": str        # Position direction ("LONG" or "SHORT")
        }
    """
    # Group positions by token and count long/short positions
    token_data = {}
    
    for pos in positions:
        # Get token name from position data and clean it
        token = pos.get("indexToken", "").upper()
        if not token:
            continue
            
        # Remove protocol prefix if present (e.g., "HYPERLIQUID-BTC" -> "BTC")
        if "-" in token:
            token = token.split("-")[1]
            
        # Initialize token data if not exists
        if token not in token_data:
            token_data[token] = {
                "long": 0,
                "short": 0
            }
            
        # Update position counts
        if pos.get("isLong"):
            token_data[token]["long"] += 1
        else:
            token_data[token]["short"] += 1
    
    # Transform to required format
    result = []
    for token, counts in token_data.items():
        total = counts["long"] + counts["short"]
        if total == 0:
            continue
            
        # Determine majority position and its count
        if counts["long"] >= counts["short"]:
            position = "LONG"
            majority_count = counts["long"]
        else:
            position = "SHORT"
            majority_count = counts["short"]
        
        # Calculate percentage (format to 1 decimal place)
        percentage = (majority_count / total) * 100
        
        result.append({
            "token": token,
            "total_positions": total,
            "percentage": f"{percentage:.1f}%",
            "position": position
        })
    
    # Sort by total positions (descending)
    result.sort(key=lambda x: (-x["total_positions"], x["token"]))
    
    return result

def fetch_smart_money_data(curr_time: str) -> List[Dict]:
    """
    Fetch smart money position data from Copin API.
    
    Args:
        curr_time (str): Current timestamp for data fetching
        
    Returns:
        List[Dict]: List of position data in standardized format
    """
    api = CopinAPI()
    all_positions = []
    
    for protocol in api.supported_protocols:
        for wallet in TRADER_WALLETS:
            try:
                data = api.get_position_data(wallet, protocol)
                if data and "data" in data:
                    positions = data["data"]
                    for pos in positions:
                        # Only include open positions
                        if pos.get("status") == "OPEN":
                            pos["protocol"] = protocol
                            all_positions.append(pos)
            except Exception as e:
                logger.warning(f"Error fetching {protocol} data for {wallet}: {str(e)}")
    
    logger.info(f"Fetched {len(all_positions)} positions from Copin API")
    return transform_position_data(all_positions)

def get_latest_smart_money(data: List[Dict]) -> List[Dict]:
    """
    Process smart money positions and return formatted results.
    
    This function aggregates positions by token and calculates sentiment
    based on the ratio of long to short positions.
    
    Processing Steps:
    1. Group positions by token
    2. For each position:
       - Count long and short positions
       - Track unique traders and protocols
       - Calculate total positions
    3. Sort results with priority tokens (BTC, ETH, SOL) first
    4. Sort remaining tokens by total position count
    5. Return top 6 results
    
    Args:
        data (List[Dict]): List of position data from various protocols
        
    Returns:
        List[Dict]: Formatted list of smart money positions. Each item contains:
            - token: Token symbol
            - long_count: Number of long positions
            - short_count: Number of short positions
            - total_positions: Total number of positions
            - unique_traders: Number of unique traders
            - protocols: List of protocols used
            - sentiment: 'bullish' if long_count > short_count, else 'bearish'
    """
    # Dictionary to store aggregated data for each token
    token_data = {}

    # Priority tokens to show first
    priority_tokens = ['BTC', 'ETH', 'SOL']

    # Process each position
    for position in data:
        token = position.get('token', '')
        if not token:
            continue

        # Initialize token data if not exists
        if token not in token_data:
            token_data[token] = {
                'long_count': 0,
                'short_count': 0,
                'total_positions': 0,
                'traders': set(),
                'protocols': set()
            }

        # Update counts
        if position.get('position') == 'LONG':
            token_data[token]['long_count'] += 1
        else:
            token_data[token]['short_count'] += 1

        token_data[token]['total_positions'] += 1
        token_data[token]['traders'].add(position.get('trader_id', ''))
        token_data[token]['protocols'].add(position.get('protocol', ''))

    # Format results
    results = []
    for token, stats in token_data.items():
        # Calculate sentiment
        sentiment = 'bullish' if stats['long_count'] > stats['short_count'] else 'bearish'

        result = {
            'token': token,
            'long_count': stats['long_count'],
            'short_count': stats['short_count'],
            'total_positions': stats['total_positions'],
            'unique_traders': len(stats['traders']),
            'protocols': list(stats['protocols']),
            'sentiment': sentiment
        }
        results.append(result)

    # Sort results
    # First, sort by priority tokens
    priority_results = []
    other_results = []
    
    for result in results:
        if result['token'] in priority_tokens:
            priority_results.append(result)
        else:
            other_results.append(result)
    
    # Sort priority tokens by total positions
    priority_results.sort(key=lambda x: (-x['total_positions'], priority_tokens.index(x['token'])))
    
    # Sort other tokens by total positions
    other_results.sort(key=lambda x: -x['total_positions'])
    
    # Combine and return top 6 results
    final_results = priority_results + other_results
    return final_results[:6]

def lambda_handler(event, context):
    """AWS Lambda handler for Smart Money Position tracking.
    
    Args:
        event (dict): Lambda event data
        context: Lambda context
        
    Returns:
        dict: API Gateway response with position data
    """
    try:
        # Get current time for data fetching
        curr_time = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Fetch position data from Copin API
        positions = fetch_smart_money_data(curr_time)
        
        # Process and format the results
        formatted_results = get_latest_smart_money(positions)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'timestamp': curr_time,
                'positions': formatted_results
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }