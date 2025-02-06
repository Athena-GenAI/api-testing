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
from ath_get_smart_money_position import fetch_smart_money_data

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
    try:
        # Get current timestamp for cache
        timestamp = get_cache_timestamp()
        
        # Fetch latest smart money positions
        positions = fetch_smart_money_data(timestamp)
        
        # Create cache entry with metadata
        cache_entry = {
            'timestamp': timestamp,
            'last_updated': datetime.now().isoformat(),
            'data': positions
        }
        
        # Upload to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key="cache/smart_money_cache.json",
            Body=json.dumps(cache_entry),
            ContentType='application/json'
        )
        
        logger.info(f"Successfully cached {len(positions)} positions")
        return True
        
    except Exception as e:
        logger.error(f"Error caching positions: {str(e)}")
        return False

def lambda_handler(event, context):
    """
    AWS Lambda handler for the caching function.
    Triggered every 2 hours by EventBridge.
    
    Args:
        event: AWS Lambda event
        context: AWS Lambda context
    
    Returns:
        dict: Response with status code and message
    """
    bucket_name = os.environ.get('BUCKET_NAME')
    if not bucket_name:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'BUCKET_NAME environment variable not set'})
        }
    
    success = cache_smart_money_positions(bucket_name)
    
    return {
        'statusCode': 200 if success else 500,
        'body': json.dumps({
            'message': 'Cache updated successfully' if success else 'Failed to update cache'
        })
    }
