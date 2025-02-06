"""
Cached Smart Money Position API

This module provides an API endpoint that returns cached smart money position data,
ensuring fast response times by avoiding direct API calls.
"""

import os
import json
from datetime import datetime, timedelta
import logging
import boto3
from botocore.exceptions import ClientError
from ath_get_smart_money_position import fetch_smart_money_data

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')

def get_cached_positions(bucket_name):
    """
    Retrieve cached smart money positions from S3.
    
    Args:
        bucket_name (str): Name of the S3 bucket containing the cache
    
    Returns:
        tuple: (data, status_code)
            - data: The cached position data or error message
            - status_code: HTTP status code (200 for success, 404 for missing cache, 500 for errors)
    """
    try:
        # Get the cached data from S3
        response = s3_client.get_object(
            Bucket=bucket_name,
            Key="cache/smart_money_cache.json"
        )
        
        cache_entry = json.loads(response['Body'].read().decode('utf-8'))
        
        # Check if cache is stale (older than 3 hours)
        last_updated = datetime.fromisoformat(cache_entry['last_updated'])
        if datetime.now() - last_updated > timedelta(hours=3):
            logger.warning("Cache is stale, fetching fresh data")
            positions = fetch_smart_money_data(cache_entry['timestamp'])
            return {
                'data': positions,
                'from_cache': False,
                'last_updated': datetime.now().isoformat()
            }, 200
        
        return {
            'data': cache_entry['data'],
            'from_cache': True,
            'last_updated': cache_entry['last_updated']
        }, 200
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            logger.warning("Cache not found, fetching fresh data")
            positions = fetch_smart_money_data(datetime.now().strftime("%Y%m%d_%H"))
            return {
                'data': positions,
                'from_cache': False,
                'last_updated': datetime.now().isoformat()
            }, 200
        else:
            logger.error(f"Error retrieving cache: {str(e)}")
            return {'error': 'Failed to retrieve positions'}, 500
            
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {'error': 'Internal server error'}, 500

def lambda_handler(event, context):
    """
    AWS Lambda handler for the cached positions API endpoint.
    
    Args:
        event: AWS Lambda event
        context: AWS Lambda context
    
    Returns:
        dict: Response with status code and body
    """
    bucket_name = os.environ.get('BUCKET_NAME')
    if not bucket_name:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'BUCKET_NAME environment variable not set'})
        }
    
    data, status_code = get_cached_positions(bucket_name)
    
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data)
    }
