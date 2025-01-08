import requests
import boto3
import json
import math

from botocore.exceptions import ClientError
from datetime import datetime

s3_client = boto3.client('s3')
desired_symbols = ('ETH', 'WETH', 'WSTETH', 'WBTC', 'USDT', 'USDC', 'SUSDE', 'CBBTC', 'USDS', 'RETH', 'DAI', 'TBTC', 'USDE', 'CBETH', 'PYUSD', 'LUSD', 'SDAI', 'CRVUSD', 'GHO', 'FRAX', 'WETH.E', 'USDC.E', 'USDT.E', 'DAI.E', 'USBDC', 'SCRVUSD', 'DOLA', 'SFRXETH')

API_KEY = "egbJblmxMkXtjsN9coJzdADQ836i9OM__nhMPzveppsHELaKv8SrUQw"
API_URL = "https://yields.llama.fi/poolsBorrow"
    
APY_TOP_COUNT = 3
DEFILLAMA_PRO = 1

def fetch_pools_borrowed_data(curr_time):
    if DEFILLAMA_PRO:
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(API_URL, headers=headers)
        response.raise_for_status()        
        s3_client.put_object(Body=response.text, Bucket='agent-data-miami', Key=f"athena/defillama/pools-borrowed-data/pools-borrowed-all-{curr_time}.json")
    else:
        print('API-KEY EXPIRED: please update the api token')

def calculate_top_borrowed_assets(data):
    """
    Fetches asset data from the DeFi Llama API, filters the assets based on a whitelist,
    and returns the top 3 assets by APY from the Aave project.
    
    Returns:
        dict: HTTP response containing the top 3 assets by APY or an error message.
    """
    if "data" in data:
        # Filter for:
        # 1. Projects starting with 'aave-'
        # 2. Having valid APY
        # 3. Symbol in whitelist
        aave_assets = [
            asset for asset in data["data"]
            if asset.get('project', '').lower().startswith('aave-') and 
                asset.get('apy') is not None and
                asset.get('symbol', '').upper() in desired_symbols
        ]
        
        if not aave_assets:
            return {
                "statusCode": 404,
                "body": json.dumps({
                    "error": "No valid Aave assets found",
                    "message": "No whitelisted assets from Aave with valid yield data were found"
                })
            }
        
        # Get top 3 by APY
        top_3_by_apy = sorted(
            aave_assets,
            key=lambda x: float(x.get('apy', 0)),
            reverse=True
        )[:3]
        
        result = [
                {
                    "chain": asset.get('chain', ''),
                    "project": asset.get('project', ''),
                    "symbol": f"${asset.get('symbol', '')}",
                    "apy": f"{round(asset.get('apy', 0),2)}%"
                }
                for asset in top_3_by_apy
            ]
        
        return json.dumps(result)


def main(pools_content_object, curr_time):
    try: 
        # Try to see if we've already calculated and pull that
        pools_sorted_object = s3_client.get_object(Bucket='agent-data-miami', Key=f"athena/custom-calculations/pools-borrowed-data/borrowed-top-apy-{curr_time}.json")
        best_pools_sorted = pools_sorted_object["Body"].read().decode()
        if best_pools_sorted != {}:
            return best_pools_sorted
    except ClientError as ex: 
        if ex.response['Error']['Code'] == 'NoSuchKey': # means we have not calculated yet
            print('No object found - please debug handler function!')
            pools_text = pools_content_object["Body"].read().decode()
            best_pools = calculate_top_borrowed_assets(json.loads(pools_text))
            if best_pools != []:
                s3_client.put_object(Body=best_pools, Bucket='agent-data-miami', Key=f"athena/custom-calculations/pools-borrowed-data/borrowed-top-apy-{curr_time}.json")
            return best_pools


def lambda_handler(event, context):
    """
    AWS Lambda function handler that fetches and processes asset data.
    
    Args:
        event (dict): Lambda function event.
        context (LambdaContext): Lambda function context.
        
    Returns:
        dict: HTTP response containing the top 3 assets by APY or an error message.
    """
    best_pools_sorted = {}
    curr_time = datetime.now().strftime("%Y-%m-%d-%H")
    try: 
        pools_content_object = s3_client.get_object(Bucket='agent-data-miami', Key=f"athena/defillama/pools-borrowed-data/pools-borrowed-all-{curr_time}.json")
        best_pools_sorted = main(pools_content_object, curr_time)
    except ClientError as ex:
        if ex.response['Error']['Code'] == 'NoSuchKey':
            print('No object found - please debug handler function!')
            fetch_pools_borrowed_data(curr_time)
            pools_content_object = s3_client.get_object(Bucket='agent-data-miami', Key=f"athena/defillama/pools-borrowed-data/pools-borrowed-all-{curr_time}.json")
            best_pools_sorted = main(pools_content_object, curr_time)
        else:
           print('Unexpected error: %s' % ex)
           raise
    body = json.loads(best_pools_sorted)
    body = json.dumps(body, indent=2)
    return {
        'statusCode': 200,
        "headers": {
            "Content-Type": "application/json"
        },
        'body': body
    }

