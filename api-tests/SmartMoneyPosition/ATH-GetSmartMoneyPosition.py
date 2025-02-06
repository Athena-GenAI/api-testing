"""
Smart Money Position Tracker

This module tracks and analyzes trading positions of significant traders ("smart money") across different protocols.
It fetches position data from the Copin API, processes it, and stores both raw and analyzed data in S3.

Key Features:
- Fetches trading positions from multiple trader wallets across supported protocols
- Analyzes position data to determine market sentiment (LONG/SHORT) for different tokens
- Prioritizes major cryptocurrencies (BTC, ETH, SOL) in the analysis
- Implements hourly batch processing with AWS Lambda
- Stores both raw position data and processed analytics in S3

Dependencies:
- boto3: AWS SDK for Python
- requests: HTTP library for API calls
- json: JSON processing
- logging: Logging functionality
- datetime: Date and time handling
"""

import requests
import boto3
import json
import math
import time 
import datetime
import logging
from botocore.exceptions import ClientError
from constants.wallets import TRADER_WALLETS
from constants.top_wallet_protocols import SUPPORTED_PROTOCOLS

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
COPIN_API_BASE = "https://api.copin.io"

def fetch_smart_money_data(curr_time):
    """
    Fetch smart money position data from Copin API and combine into a single file.
    
    This function:
    1. Iterates through predefined trader wallets and protocols
    2. Fetches current positions for each trader-protocol combination
    3. Stores raw position data and successful API calls in S3
    
    Args:
        curr_time (str): Current timestamp in YYYYMMDD_HH format for file naming
    
    Returns:
        list: Combined list of all trading positions with trader and protocol information
        
    Note:
        - Failed API calls are logged but don't stop the process
        - Data is stored in two S3 files:
          1. positions_{curr_time}.json: Raw position data
          2. successful_combinations_{curr_time}.json: Successful API calls
    """
    successful_combinations = []
    all_positions = []
    
    for trader_id in TRADER_WALLETS:
        trader_positions = []
        for protocol in SUPPORTED_PROTOCOLS:
            try:
                url = f"{COPIN_API_BASE}/{protocol}/position/opening/{trader_id}"
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                
                positions = response.json()
                # Add trader and protocol info to each position
                for position in positions:
                    position['trader_id'] = trader_id
                    position['protocol'] = protocol
                
                trader_positions.extend(positions)
                
                successful_combinations.append({
                    "trader_id": trader_id,
                    "protocol": protocol,
                    "endpoint": url
                })
                
            except Exception as e:
                logger.warning(f"Failed to fetch data for {trader_id} on {protocol}: {e}")
                continue
        
        if trader_positions:
            all_positions.extend(trader_positions)
    
    # Store all positions in a single file
    if all_positions:
        s3_client.put_object(
            Body=json.dumps(all_positions),
            Bucket='agent-data-miami',
            Key=f"athena/copin/smart-money-data/positions_{curr_time}.json"
        )
    
    # Store successful combinations
    if successful_combinations:
        s3_client.put_object(
            Body=json.dumps({
                "timestamp": curr_time,
                "combinations": successful_combinations
            }),
            Bucket='agent-data-miami',
            Key=f"athena/copin/smart-money-data/combinations/successful_combinations_{curr_time}.json"
        )
    
    return all_positions

def get_latest_smart_money(data):
    """
    Process position data and calculate trading sentiment statistics.
    
    This function:
    1. Aggregates positions by token
    2. Calculates LONG vs SHORT percentages
    3. Determines majority position and its percentage
    4. Returns top 6 positions (BTC, ETH, SOL + top 3 by percentage)
    
    Args:
        data (list): JSON data containing position information
        
    Returns:
        str: JSON string containing array of processed statistics,
             prioritizing BTC, ETH, SOL and top 3 positions by percentage
    """
    token_stats = {}
    MIN_POSITIONS = 5
    priority_tokens = ['BTC', 'ETH', 'SOL']
    
    # Process positions
    for position in data:
        token = position.get('indexToken', '')
        cleaned_token = token if token.startswith('0x') else f"{token.lstrip('$').split('-')[-1]}"
        
        if cleaned_token not in token_stats:
            token_stats[cleaned_token] = {"long": 0, "short": 0}
        
        token_stats[cleaned_token]["long" if position.get('isLong') else "short"] += 1
    
    # Format results
    formatted_results = []
    remaining_positions = []
    
    # Process all tokens
    for token, stats in token_stats.items():
        long_count = stats.get('long', 0)
        short_count = stats.get('short', 0)
        total_positions = long_count + short_count
        
        if total_positions >= MIN_POSITIONS:
            long_percentage = (long_count / total_positions) * 100
            short_percentage = (short_count / total_positions) * 100
            
            if long_count > short_count:
                majority_position = "LONG"
                majority_percentage = long_percentage
            elif short_count > long_count:
                majority_position = "SHORT"
                majority_percentage = short_percentage
            else:
                majority_position = "NEUTRAL"
                majority_percentage = 50.0

            position_data = {
                'token': f"${token}",
                'total_positions': total_positions,
                'percentage': f"{round(majority_percentage, 1)}%",
                'position': f"{round(majority_percentage, 1)}% {majority_position}",
                'raw_percentage': majority_percentage
            }
            
            # Add priority tokens directly to results
            if token in priority_tokens:
                formatted_results.append(position_data)
            else:
                remaining_positions.append(position_data)
    
    # Sort remaining positions by percentage and add top 3
    remaining_positions.sort(key=lambda x: (x['raw_percentage'], x['total_positions']), reverse=True)
    formatted_results.extend(remaining_positions[:3])
    
    # Remove sorting field from final output
    for item in formatted_results:
        del item['raw_percentage']
    
    return json.dumps(formatted_results, indent=2)

def main(smart_money_content_object, curr_time):
    """
    Main processing function that handles the retrieval and calculation of smart money positions.
    
    This function:
    1. Checks for existing calculations for the current timestamp
    2. If none exist, processes new data and stores results
    
    Args:
        smart_money_content_object (dict): S3 object containing raw position data
        curr_time (str): Current timestamp in YYYYMMDD_HH format
        
    Returns:
        str: JSON string containing processed smart money positions
        
    Note:
        Results are cached in S3 to prevent redundant calculations
    """
    try:
        # Check if we've already calculated for this timestamp
        latest_smart_money = s3_client.get_object(
            Bucket='agent-data-miami',
            Key=f"athena/custom-calculations/smart-money-data/latest_smart_money-{curr_time}.json"
        )
        latest_smart_money = latest_smart_money["Body"].read().decode()
        if latest_smart_money != "[]":
            return latest_smart_money
            
    except ClientError as ex:
        if ex.response['Error']['Code'] == 'NoSuchKey':
            logger.info('No existing calculations found - processing new data')
            smart_money_output = smart_money_content_object["Body"].read().decode()
            latest_smart_money = get_latest_smart_money(json.loads(smart_money_output))
            
            if latest_smart_money != "[]":
                s3_client.put_object(
                    Body=latest_smart_money,
                    Bucket='agent-data-miami',
                    Key=f"athena/custom-calculations/smart-money-data/latest_smart_money-{curr_time}.json"
                )
            return latest_smart_money

def get_batch_timestamp():
    """
    Generate an hourly timestamp string for batch processing.
    
    This function:
    1. Gets current datetime
    2. Formats it to YYYYMMDD_HH for consistent file naming
    
    Returns:
        str: Timestamp in YYYYMMDD_HH format (e.g., "20250205_23")
    """
    return datetime.datetime.now().strftime("%Y%m%d_%H")

def lambda_handler(event, context):
    """
    AWS Lambda handler function that orchestrates the smart money position tracking process.
    Now returns an array of positions instead of an object, focusing on top 6 positions.
    """
    latest_smart_money = "[]"  # Default to empty array instead of empty object
    curr_time = get_batch_timestamp()
    
    try:
        smart_money_output = s3_client.get_object(
            Bucket='agent-data-miami',
            Key=f"athena/copin/smart-money-data/positions_{curr_time}.json"
        )
        latest_smart_money = main(smart_money_output, curr_time)
        
    except ClientError as ex:
        if ex.response['Error']['Code'] == 'NoSuchKey':
            logger.info('No data found - fetching new data')
            all_positions = fetch_smart_money_data(curr_time)
            
            if all_positions:
                latest_smart_money = get_latest_smart_money(all_positions)
                
                # Store the processed results
                if latest_smart_money != "[]":
                    s3_client.put_object(
                        Body=latest_smart_money,
                        Bucket='agent-data-miami',
                        Key=f"athena/custom-calculations/smart-money-data/latest_smart_money-{curr_time}.json"
                    )
            else:
                latest_smart_money = "[]"
        else:
            logger.error('Unexpected error: %s' % ex)
            raise

    return {
        'statusCode': 200,
        "headers": {
            "Content-Type": "application/json"
        },
        'body': latest_smart_money
    }