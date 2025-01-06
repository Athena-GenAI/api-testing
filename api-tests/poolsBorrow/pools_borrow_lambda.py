import json
import requests

def fetch_and_process_assets():

    API_KEY = "egbJblmxMkXtjsN9coJzdADQ836i9OM__nhMPzveppsHELaKv8SrUQw"
    API_URL = "https://yields.llama.fi/poolsBorrow"
    
    # Whitelist of desired symbols //
    # @todo make sure this is correct
    desired_symbols = ('ETH', 'WETH', 'WSTETH', 'WBTC', 'USDT', 'USDC', 'SUSDE', 'CBBTC', 'USDS', 'RETH', 'DAI', 'TBTC', 'USDE', 'CBETH', 'PYUSD', 'LUSD', 'SDAI', 'CRVUSD', 'GHO', 'FRAX', 'WETH.E', 'USDC.E', 'USDT.E', 'DAI.E', 'USBDC', 'SCRVUSD', 'DOLA', 'SFRXETH')
    
    try:
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(API_URL, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
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
                    }, ensure_ascii=False)
                }
            
            # Get top 3 by APY
            top_3_by_apy = sorted(
                aave_assets,
                key=lambda x: float(x.get('apy', 0)),
                reverse=True
            )[:3]
            
            result = {
                "top_3_apy": [
                    {
                        "chain": asset.get('chain', ''),
                        "project": asset.get('project', ''),
                        "symbol": asset.get('symbol', ''),
                        "apy": float(asset.get('apy', 0))
                    }
                    for asset in top_3_by_apy
                ]
            }
            
            return {
                "statusCode": 200,
                "body": json.dumps(result, ensure_ascii=False)
            }
            
        else:
            return {
                "statusCode": 404,
                "body": json.dumps({
                    "error": "No data received from API",
                    "message": "Failed to process assets"
                }, ensure_ascii=False)
            }
            
    except requests.exceptions.RequestException as e:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e),
                "message": "Failed to fetch data from DeFi Llama API"
            }, ensure_ascii=False)
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e),
                "message": "Failed to process assets"
            }, ensure_ascii=False)
        }

def lambda_handler(event, context):
    """
    AWS Lambda function handler that fetches and processes asset data.
    
    Args:
        event (dict): Lambda function event.
        context (LambdaContext): Lambda function context.
        
    Returns:
        dict: HTTP response containing the top 3 assets by APY or an error message.
    """
    return fetch_and_process_assets()