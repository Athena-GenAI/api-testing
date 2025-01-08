import json
import requests
from token_whitelist import DESIRED_SYMBOLS  # Import the whitelist


def fetch_and_process_assets():
    """
    AWS Lambda optimized version of the asset fetcher.
    Fetches asset data from DeFi Llama API, filters for Aave protocol assets,
    and returns the top 3 performing assets by APY.

    Technical Flow:
    1. Fetches data from DeFi Llama's pools/borrow endpoint
    2. Filters for Aave protocol assets that match our whitelist
    3. Sorts by APY and selects top 3 performing assets
    4. Returns formatted response suitable for API Gateway

    Returns:
        dict: AWS Lambda response format containing:
            - statusCode: HTTP status code (200, 404, or 500)
            - body: JSON string containing either:
                - List of top 3 assets with chain, project, symbol, and APY
                - Error message and details if something fails
    """
    # API configuration
    API_KEY = "egbJblmxMkXtjsN9coJzdADQ836i9OM__nhMPzveppsHELaKv8SrUQw"
    API_URL = "https://yields.llama.fi/poolsBorrow"

    try:
        # Set up request headers for API authentication
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        }

        # Fetch data from DeFi Llama API
        response = requests.get(API_URL, headers=headers)
        response.raise_for_status()  # Raises exception for non-200 status codes

        data = response.json()

        if "data" in data:
            # Filter assets for Aave protocol and whitelist matches
            aave_assets = [
                asset
                for asset in data["data"]
                if asset.get("project", "").lower().startswith("aave-")
                and asset.get("apy") is not None
                and asset.get("symbol", "").upper() in DESIRED_SYMBOLS
            ]

            # Return 404 if no valid assets found
            if not aave_assets:
                return {
                    "statusCode": 404,
                    "body": json.dumps({
                        "error": "No valid Aave assets found",
                        "message": "No whitelisted assets from Aave with valid yield data were found",
                    }, ensure_ascii=False),
                }

            # Sort by APY (descending) and take top 3
            top_3_by_apy = sorted(
                aave_assets, 
                key=lambda x: float(x.get("apy", 0)), 
                reverse=True
            )[:3]

            # Format result with rounded APY values
            result = [
                {
                    "chain": asset.get("chain", ""),
                    "project": asset.get("project", ""),
                    "symbol": asset.get("symbol", ""),
                    "apy": round(float(asset.get("apy", 0)), 2),  # Round to 2 decimal places
                }
                for asset in top_3_by_apy
            ]

            return {
                "statusCode": 200,
                "body": json.dumps(result, ensure_ascii=False)
            }

        else:
            return {
                "statusCode": 404,
                "body": json.dumps(
                    {
                        "error": "No data received from API",
                        "message": "Failed to process assets",
                    },
                    ensure_ascii=False,
                ),
            }

    except requests.exceptions.RequestException as e:
        return {
            "statusCode": 500,
            "body": json.dumps(
                {
                    "error": str(e),
                    "message": "Failed to fetch data from DeFi Llama API",
                },
                ensure_ascii=False,
            ),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps(
                {"error": str(e), "message": "Failed to process assets"},
                ensure_ascii=False,
            ),
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
