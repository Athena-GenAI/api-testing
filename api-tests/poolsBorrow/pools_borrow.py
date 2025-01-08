import json
import requests
import os
from datetime import datetime


def fetch_and_process_assets():
    """
    Fetches asset data from the DeFi Llama API, filters the assets based on a whitelist,
    and returns the top 3 assets by APY from the Aave project.

    Technical Flow:
    1. Fetches data from DeFi Llama's pools/borrow endpoint
    2. Filters for Aave protocol assets that match our whitelist
    3. Sorts by APY and selects top 3 performing assets
    4. Saves results to timestamped JSON files

    Returns:
        dict: Response containing:
            - timestamp: Current timestamp
            - top_3_apy: List of top 3 assets with chain, project, symbol, and APY
            - error (if applicable): Error details and message
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    API_KEY = "egbJblmxMkXtjsN9coJzdADQ836i9OM__nhMPzveppsHELaKv8SrUQw"
    API_URL = "https://yields.llama.fi/poolsBorrow"

    # Updated whitelist of desired symbols without '$'
    desired_symbols = (
        "ETH",
        "WETH",
        "WSTETH",
        "WBTC",
        "USDT",
        "USDC",
        "SUSDE",
        "CBBTC",
        "USDS",
        "RETH",
        "DAI",
        "TBTC",
        "USDE",
        "CBETH",
        "PYUSD",
        "LUSD",
        "SDAI",
        "CRVUSD",
        "GHO",
        "FRAX",
        "WETH.E",
        "USDC.E",
        "USDT.E",
        "DAI.E",
        "USBDC",
        "SCRVUSD",
        "DOLA",
        "SFRXETH",
    )

    try:
        # Set up request headers with API key and content type
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        }

        # Make API request and check for successful response
        response = requests.get(API_URL, headers=headers)
        response.raise_for_status()

        # Parse JSON response
        data = response.json()

        if "data" in data:
            # Filter assets based on three criteria:
            # 1. Projects starting with 'aave-'
            # 2. Having valid APY
            # 3. Symbol in whitelist
            aave_assets = [
                asset
                for asset in data["data"]
                if asset.get("project", "").lower().startswith("aave-")
                and asset.get("apy") is not None
                and asset.get("symbol", "").upper() in desired_symbols
            ]

            # Handle case where no valid assets found
            if not aave_assets:
                error_result = {
                    "timestamp": timestamp,
                    "error": "No valid Aave assets found",
                    "message": "No whitelisted assets from Aave with valid yield data were found",
                }
                # Save error to JSON file
                filepath = os.path.join(
                    script_dir, f"pools_borrow_response_error_{timestamp}.json"
                )
                with open(filepath, "w") as f:
                    json.dump(error_result, f, indent=2)
                return error_result

            # Sort assets by APY in descending order and take top 3
            top_3_by_apy = sorted(
                aave_assets, key=lambda x: float(x.get("apy", 0)), reverse=True
            )[:3]

            # Format result with selected fields and timestamp
            result = {
                "timestamp": timestamp,
                "top_3_apy": [
                    {
                        "chain": asset.get("chain", ""),
                        "project": asset.get("project", ""),
                        "symbol": asset.get("symbol", ""),
                        "apy": float(asset.get("apy", 0)),
                    }
                    for asset in top_3_by_apy
                ],
            }

            # Write successful result to timestamped JSON file
            filepath = os.path.join(script_dir, f"pools_borrow_response_{timestamp}.json")
            with open(filepath, "w") as f:
                json.dump(result, f, indent=2)

            print(f"Data successfully written to {filepath}")
            return result

        else:
            # Handle case where API response has no data field
            error_result = {
                "timestamp": timestamp,
                "error": "No data received from API",
                "message": "Failed to process assets",
            }
            # Save error to JSON file
            filepath = os.path.join(
                script_dir, f"pools_borrow_response_error_{timestamp}.json"
            )
            with open(filepath, "w") as f:
                json.dump(error_result, f, indent=2)
            return error_result

    except requests.exceptions.RequestException as e:
        # Handle API request errors (network issues, invalid responses, etc)
        error_result = {
            "timestamp": timestamp,
            "error": str(e),
            "message": "Failed to fetch data from DeFi Llama API",
        }
        # Save error to JSON file
        filepath = os.path.join(script_dir, f"pools_borrow_response_error_{timestamp}.json")
        with open(filepath, "w") as f:
            json.dump(error_result, f, indent=2)
        return error_result

    except Exception as e:
        # Handle any other unexpected errors
        error_result = {
            "timestamp": timestamp,
            "error": str(e),
            "message": "Failed to process assets",
        }
        # Save error to JSON file
        filepath = os.path.join(script_dir, f"pools_borrow_response_error_{timestamp}.json")
        with open(filepath, "w") as f:
            json.dump(error_result, f, indent=2)
        return error_result


if __name__ == "__main__":
    # Execute the main function and print results when script is run directly
    result = fetch_and_process_assets()
    print(json.dumps(result, indent=2))