import json
import requests
import os

def fetch_and_process_assets():
    # Get the directory where the script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    API_KEY = "egbJblmxMkXtjsN9coJzdADQ836i9OM__nhMPzveppsHELaKv8SrUQw"
    API_URL = "https://yields.llama.fi/poolsBorrow"
    
    try:
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(API_URL, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        if "data" in data:
            assets_list = data["data"]
            
            top_3_by_apy = sorted(
                assets_list,
                key=lambda x: float(x.get('apy', 0)),
                reverse=True
            )[:3]
            
            largest_yield_gain = max(
                assets_list,
                key=lambda x: float(x.get('apyChange1d', 0))
            )
            
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
            
            # Create full file path in script directory
            filepath = os.path.join(script_dir, "pools_borrow_response.json")
            
            with open(filepath, "w") as f:
                json.dump(result, f, indent=2)
            
            print(f"Data successfully written to {filepath}")
            return result
            
        else:
            error_result = {
                "error": "No data received from API",
                "message": "Failed to process assets"
            }
            filepath = os.path.join(script_dir, "pools_borrow_response_error.json")
            with open(filepath, "w") as f:
                json.dump(error_result, f, indent=2)
            return error_result
            
    except requests.exceptions.RequestException as e:
        error_result = {
            "error": str(e),
            "message": "Failed to fetch data from DeFi Llama API"
        }
        filepath = os.path.join(script_dir, "pools_borrow_response_error.json")
        with open(filepath, "w") as f:
            json.dump(error_result, f, indent=2)
        return error_result
    except Exception as e:
        error_result = {
            "error": str(e),
            "message": "Failed to process assets"
        }
        filepath = os.path.join(script_dir, "pools_borrow_response_error.json")
        with open(filepath, "w") as f:
            json.dump(error_result, f, indent=2)
        return error_result

if __name__ == "__main__":
    result = fetch_and_process_assets()
    print(json.dumps(result, indent=2))