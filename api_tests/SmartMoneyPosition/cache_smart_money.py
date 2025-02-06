"""
Smart Money Position Cache Handler

This script runs on a schedule via AWS Lambda to cache smart money position data,
ensuring that the main API endpoint always has fresh data available
without having to wait for API calls.
"""

import os
import json
import logging
from datetime import datetime, timedelta
import boto3
from botocore.exceptions import ClientError
from ATH_GetSmartMoneyPosition import fetch_smart_money_data, get_latest_smart_money

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')

def get_cache_timestamp():
    """Get timestamp for the current cache period (updates every 2 hours)"""
    now = datetime.now()
    # Round down to nearest even hour
    hour = now.hour - (now.hour % 2)
    cache_time = now.replace(hour=hour, minute=0, second=0, microsecond=0)
    return cache_time.strftime("%Y%m%d_%H")

def cache_smart_money_positions(bucket_name):
    """
    Fetch and cache smart money positions in S3.
    
    Args:
        bucket_name (str): Name of the S3 bucket to store cache
    
    Returns:
        bool: True if caching was successful, False otherwise
    """
    curr_time = get_cache_timestamp()
    
    try:
        # Fetch new position data
        all_positions = fetch_smart_money_data(curr_time)
        
        if all_positions:
            # Process the positions
            latest_smart_money = get_latest_smart_money(all_positions)
            
            if latest_smart_money != "[]":
                # Create a cache entry with metadata
                cache_entry = {
                    "timestamp": curr_time,
                    "last_updated": datetime.now().isoformat(),
                    "data": json.loads(latest_smart_money)
                }
                
                # Store in S3
                s3_client.put_object(
                    Bucket=bucket_name,
                    Key=f"cache/smart_money_cache.json",
                    Body=json.dumps(cache_entry, indent=2),
                    ContentType='application/json'
                )
                
                logger.info(f"Successfully cached smart money positions for {curr_time}")
                return True
    
    except Exception as e:
        logger.error(f"Failed to cache smart money positions: {e}")
    
    return False

def lambda_handler(event, context):
    """
    AWS Lambda handler for the caching function.
    Triggered every 2 hours by EventBridge.
    """
    bucket_name = os.environ.get('BUCKET_NAME')
    if not bucket_name:
        raise ValueError("BUCKET_NAME environment variable not set")
    
    success = cache_smart_money_positions(bucket_name)
    
    return {
        'statusCode': 200 if success else 500,
        'body': json.dumps({
            'success': success,
            'timestamp': get_cache_timestamp()
        })
    }
