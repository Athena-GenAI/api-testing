"""
Test script for live data fetching from Copin API.
"""
import os
import sys
import json
import time
from typing import List, Dict

# Add the project root to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
sys.path.append(project_root)

from ath_get_smart_money_position import fetch_smart_money_data
from mock_data import MOCK_POSITIONS

def validate_position_format(position: Dict) -> bool:
    """Validate that a position matches the required format."""
    required_fields = {
        "token": str,
        "total_positions": int,
        "percentage": str,
        "position": str
    }
    
    for field, field_type in required_fields.items():
        if field not in position:
            print(f"Missing field: {field}")
            return False
        if not isinstance(position[field], field_type):
            print(f"Invalid type for {field}: expected {field_type}, got {type(position[field])}")
            return False
    
    if position["position"] not in ["LONG", "SHORT"]:
        print(f"Invalid position value: {position['position']}")
        return False
    
    try:
        percentage = float(position["percentage"].rstrip("%"))
        if not (0 <= percentage <= 100):
            print(f"Invalid percentage value: {percentage}")
            return False
    except ValueError:
        print(f"Invalid percentage format: {position['percentage']}")
        return False
    
    return True

def main():
    """Main test function."""
    print("Starting live data test...\n")
    
    try:
        # Fetch and transform position data
        positions = fetch_smart_money_data(int(time.time()))
        
        print("\nValidating position data format...")
        all_valid = True
        for pos in positions:
            if not validate_position_format(pos):
                print(f"Invalid position format: {json.dumps(pos, indent=2)}")
                all_valid = False
        
        if all_valid:
            print("All positions have valid format!")
        
        print("\nTransformed Position Data:")
        print(json.dumps(positions, indent=2))
        
        # Print summary statistics
        total_positions = sum(p["total_positions"] for p in positions)
        unique_tokens = len(positions)
        print(f"\nTotal positions tracked: {total_positions}")
        print(f"Unique tokens tracked: {unique_tokens}\n")
        
        # Compare format with mock data
        print("Format comparison with mock data:")
        mock_example = MOCK_POSITIONS[0]
        live_example = positions[0] if positions else None
        
        print("\nMock data example:")
        print(json.dumps(mock_example, indent=2))
        
        if live_example:
            print("\nLive data example:")
            print(json.dumps(live_example, indent=2))
            
    except Exception as e:
        print(f"Error in position processing: {str(e)}")
    
    print("\nLive data test completed!")

if __name__ == "__main__":
    main()
