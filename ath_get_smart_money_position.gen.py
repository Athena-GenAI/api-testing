// ```python
import json
import time 
import datetime
import logging
import os
import requests
from constants.wallets import TRADER_WALLETS
from constants.top_wallet_protocols import SUPPORTED_PROTOCOLS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
COPIN_API_BASE = "https://api.copin.io/v1"

def fetch_smart_money_data(curr_time):
    try:
        from mock_data import MOCK_POSITIONS
        logger.info("Using mock data for local testing")
        return MOCK_POSITIONS
    except ImportError:
        logger.warning("Mock data not found, using live API")
    
    all_positions = []
    for trader_id in TRADER_WALLETS:
        trader_positions = []
        for protocol in SUPPORTED_PROTOCOLS:
            try:
                url = f"{COPIN_API_BASE}/{protocol}/position/opening/{trader_id}"
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                
                positions = response.json()
                for position in positions:
                    position['trader_id'] = trader_id
                    position['protocol'] = protocol
                
                trader_positions.extend(positions)
                
            except Exception as e:
                logger.warning(f"Failed to fetch data for {trader_id} on {protocol}: {e}")
                continue
        
        if trader_positions:
            all_positions.extend(trader_positions)
    
    return all_positions

def get_latest_smart_money(data):
    token_positions = {}
    
    for position in data:
        token = position.get('indexToken') or position.get('token', '').replace('$', '')
        if not token:
            continue
        
        if token not in token_positions:
            token_positions[token] = {
                'long_count': 0,
                'short_count': 0,
                'traders': set(),
                'protocols': set(),
                'total_positions': position.get('total_positions', 0)
            }
            
        stats = token_positions[token]
        
        if 'isLong' in position:
            if position['isLong']:
                stats['long_count'] += 1
            else:
                stats['short_count'] += 1
            stats['traders'].add(position.get('trader_id', 'unknown'))
            stats['protocols'].add(position.get('protocol', 'unknown'))
        else:
            total = position.get('total_positions', 0)
            percentage = float(position.get('percentage', '0%').rstrip('%'))
            pos_type = position.get('position', '').split()[-1]
            
            if pos_type == 'LONG':
                stats['long_count'] = int(total * percentage / 100)
                stats['short_count'] = total - stats['long_count']
            else:
                stats['short_count'] = int(total * percentage / 100)
                stats['long_count'] = total - stats['short_count']
            
            stats['total_positions'] = total

    formatted_results = []
    priority_tokens = ['BTC', 'ETH', 'SOL']
    
    for token in priority_tokens:
        if token in token_positions:
            stats = token_positions[token]
            formatted_results.append({
                'token': token,
                'long_count': stats['long_count'],
                'short_count': stats['short_count'],
                'total_positions': stats['total_positions'] or (stats['long_count'] + stats['short_count']),
                'unique_traders': len(stats.get('traders', [])),
                'protocols': list(stats.get('protocols', [])),
                'sentiment': 'bullish' if stats['long_count'] > stats['short_count'] else 'bearish'
            })
            del token_positions[token]
    
    for token, stats in sorted(token_positions.items(), 
                             key=lambda x: x[1]['total_positions'] or (x[1]['long_count'] + x[1]['short_count']), 
                             reverse=True):
        formatted_results.append({
            'token': token,
            'long_count': stats['long_count'],
            'short_count': stats['short_count'],
            'total_positions': stats['total_positions'] or (stats['long_count'] + stats['short_count']),
            'unique_traders': len(stats.get('traders', [])),
            'protocols': list(stats.get('protocols', [])),
            'sentiment': 'bullish' if stats['long_count'] > stats['short_count'] else 'bearish'
        })
    
    return formatted_results[:6]

def lambda_handler(event, context):
    try:
        curr_time = datetime.datetime.now().strftime("%Y%m%d_%H")
        positions = fetch_smart_money_data(curr_time)
        formatted_results = get_latest_smart_money(positions)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(formatted_results, indent=2)
        }
        
    except Exception as e:
        logger.error(f"Error processing smart money positions: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
// ```