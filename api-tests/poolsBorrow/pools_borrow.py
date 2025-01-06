import json
import requests
import os
from datetime import datetime

def fetch_and_process_assets():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
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
            # Filter for projects starting with 'aave-' and having valid apyPct1D values
            aave_assets = [
                asset for asset in data["data"]
                if asset.get('project', '').lower().startswith('aave-') and 
                   asset.get('apy') is not None
            ]
            
            if not aave_assets:
                error_result = {
                    "timestamp": timestamp,
                    "error": "No valid Aave assets found",
                    "message": "No assets from Aave with valid yield data were found"
                }
                filepath = os.path.join(script_dir, f"pools_borrow_response_error_{timestamp}.json")
                with open(filepath, "w") as f:
                    json.dump(error_result, f, indent=2)
                return error_result
            
            # Get top 3 by APY
            top_3_by_apy = sorted(
                aave_assets,
                key=lambda x: float(x.get('apy', 0)),
                reverse=True
            )[:3]
            
            result = {
                "timestamp": timestamp,
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
            
            filepath = os.path.join(script_dir, f"pools_borrow_response_{timestamp}.json")
            
            with open(filepath, "w") as f:
                json.dump(result, f, indent=2)
            
            print(f"Data successfully written to {filepath}")
            return result
            
        else:
            error_result = {
                "timestamp": timestamp,
                "error": "No data received from API",
                "message": "Failed to process assets"
            }
            filepath = os.path.join(script_dir, f"pools_borrow_response_error_{timestamp}.json")
            with open(filepath, "w") as f:
                json.dump(error_result, f, indent=2)
            return error_result
            
    except requests.exceptions.RequestException as e:
        error_result = {
            "timestamp": timestamp,
            "error": str(e),
            "message": "Failed to fetch data from DeFi Llama API"
        }
        filepath = os.path.join(script_dir, f"pools_borrow_response_error_{timestamp}.json")
        with open(filepath, "w") as f:
            json.dump(error_result, f, indent=2)
        return error_result
    except Exception as e:
        error_result = {
            "timestamp": timestamp,
            "error": str(e),
            "message": "Failed to process assets"
        }
        filepath = os.path.join(script_dir, f"pools_borrow_response_error_{timestamp}.json")
        with open(filepath, "w") as f:
            json.dump(error_result, f, indent=2)
        return error_result

if __name__ == "__main__":
    result = fetch_and_process_assets()
    print(json.dumps(result, indent=2))