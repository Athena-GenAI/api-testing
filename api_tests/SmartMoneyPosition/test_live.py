"""
Test script for live data fetching from Copin API.
"""
import os
import sys
import json
import time

# Add the project root to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
sys.path.append(project_root)

from ath_get_smart_money_position import CopinAPI, fetch_smart_money_data

def main():
    """Main test function."""
    print("Starting live data test...\n")
    
    try:
        # Fetch and transform position data
        positions = fetch_smart_money_data(int(time.time()))
        
        print("\nTransformed Position Data:")
        print(json.dumps(positions, indent=2))
        
        # Print summary statistics
        total_positions = sum(p['total_positions'] for p in positions)
        unique_tokens = len(positions)
        print(f"\nTotal positions tracked: {total_positions}")
        print(f"Unique tokens tracked: {unique_tokens}\n")
        
        # Sort by total positions for display
        sorted_positions = sorted(positions, key=lambda x: x['total_positions'], reverse=True)
        
        # Print detailed statistics for top tokens
        for pos in sorted_positions[:10]:
            print(f"{pos['token']} Statistics:")
            print(f"- Total positions: {pos['total_positions']}")
            print(f"- Position: {pos['position']}")
            print(f"- Percentage: {pos['percentage']}\n")
            
    except Exception as e:
        print(f"Error in position processing: {str(e)}")
    
    print("Live data test completed!")

if __name__ == "__main__":
    main()
