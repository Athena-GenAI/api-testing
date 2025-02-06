"""
Local test script for Smart Money Position tracker.
This script simulates the Lambda environment locally.
"""

import json
import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

# Import the lambda handler directly since we're in the same directory
from ath_get_smart_money_position import lambda_handler

def test_smart_money_positions():
    """Test the smart money position tracker locally"""
    # Simulate Lambda event and context
    event = {}
    context = None
    
    try:
        # Call the lambda handler
        result = lambda_handler(event, context)
        
        # Print the results in a readable format
        print("\nAPI Response Status Code:", result['statusCode'])
        print("\nHeaders:", json.dumps(result['headers'], indent=2))
        
        # Parse and print the body in a readable format
        body = json.loads(result['body'])
        print("\nPositions:", json.dumps(body, indent=2))
        
    except Exception as e:
        print(f"Error testing smart money positions: {e}")

if __name__ == "__main__":
    test_smart_money_positions()
