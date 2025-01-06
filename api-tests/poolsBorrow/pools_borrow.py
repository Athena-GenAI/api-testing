from datetime import datetime
import json
import requests

def fetch_and_process_assets():
    curr_time = datetime.now().strftime("%Y-%m-%d")
    API_KEY = "egbJblmxMkXtjsN9coJzdADQ836i9OM__nhMPzveppsHELaKv8SrUQw"
    API_URL = "https://yields.llama.fi/poolsBorrow"
    
    try:
        # Make API call with authentication
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(API_URL, headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Parse response data
        data = response.json()
        
        if "data" in data:
            assets_list = data["data"]
            
            # Sort by APY and get top 3
            top_3_by_apy = sorted(
                assets_list,
                key=lambda x: float(x.get('apy', 0)),
                reverse=True
            )[:3]
            
            # Find asset with largest 1d yield gain
            largest_yield_gain = max(
                assets_list,
                key=lambda x: float(x.get('apyChange1d', 0))  # Using apyChange1d from DeFi Llama's API
            )
            
            # Create result dictionary with only required fields
            result = {
                "top_3_apy": [
                    {
                        "chain": asset.get('chain', ''),
                        "project": asset.get('project', ''),
                        "symbol": asset.get('symbol', ''),
                        "apy": float(asset.get('apy', 0))
                    }
                    for asset in top_3_by_apy
                ],
                "largest_yield_gain": {
                    "chain": largest_yield_gain.get('chain', ''),
                    "project": largest_yield_gain.get('project', ''),
                    "symbol": largest_yield_gain.get('symbol', ''),
                    "yield_1d_change": float(largest_yield_gain.get('apyChange1d', 0))
                }
            }
            
            # Save to file
            with open(f"defi-llama-top-assets-{curr_time}.json", "w") as f:
                json.dump(result, f, indent=2)
            
            return result
            
        else:
            return {
                "error": "No data received from API",
                "message": "Failed to process assets"
            }
            
    except requests.exceptions.RequestException as e:
        return {
            "error": str(e),
            "message": "Failed to fetch data from DeFi Llama API"
        }
    except Exception as e:
        return {
            "error": str(e),
            "message": "Failed to process assets"
        }

if __name__ == "__main__":
    result = fetch_and_process_assets()
    print(json.dumps(result, indent=2))