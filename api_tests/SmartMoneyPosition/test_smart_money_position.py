"""
Test suite for Smart Money Position tracker.
Tests both old and new data formats, edge cases, and core functionality.
"""

import unittest
import sys
import os

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from api_tests.SmartMoneyPosition.ath_get_smart_money_position import get_latest_smart_money

class TestSmartMoneyPosition(unittest.TestCase):
    def test_old_format_basic(self):
        """Test basic functionality with old data format"""
        test_data = [
            {
                "token": "BTC",
                "total_positions": 100,
                "percentage": "60.0%",
                "position": "LONG"
            },
            {
                "token": "ETH",
                "total_positions": 50,
                "percentage": "70.0%",
                "position": "SHORT"
            }
        ]
        
        result = get_latest_smart_money(test_data)
        
        # Check BTC is first (priority token)
        self.assertEqual(result[0]["token"], "BTC")
        self.assertEqual(result[0]["long_count"], 60)
        self.assertEqual(result[0]["short_count"], 40)
        self.assertEqual(result[0]["sentiment"], "bullish")
        
        # Check ETH stats
        eth_data = next(r for r in result if r["token"] == "ETH")
        self.assertEqual(eth_data["long_count"], 15)
        self.assertEqual(eth_data["short_count"], 35)
        self.assertEqual(eth_data["sentiment"], "bearish")
    
    def test_new_format_basic(self):
        """Test basic functionality with new data format"""
        test_data = [
            {
                "indexToken": "BTC",
                "isLong": True,
                "trader_id": "0x123",
                "protocol": "gmx",
                "size": 100000
            },
            {
                "indexToken": "BTC",
                "isLong": False,
                "trader_id": "0x456",
                "protocol": "kwenta",
                "size": 50000
            }
        ]
        
        result = get_latest_smart_money(test_data)
        
        # Check BTC stats
        self.assertEqual(result[0]["token"], "BTC")
        self.assertEqual(result[0]["long_count"], 1)
        self.assertEqual(result[0]["short_count"], 1)
        self.assertEqual(result[0]["unique_traders"], 2)
        self.assertEqual(sorted(result[0]["protocols"]), ["gmx", "kwenta"])
    
    def test_priority_tokens(self):
        """Test that BTC, ETH, SOL are always first"""
        test_data = [
            {
                "token": "DOGE",
                "total_positions": 1000,
                "percentage": "60.0%",
                "position": "LONG"
            },
            {
                "token": "BTC",
                "total_positions": 10,
                "percentage": "60.0%",
                "position": "LONG"
            },
            {
                "token": "ETH",
                "total_positions": 20,
                "percentage": "60.0%",
                "position": "LONG"
            },
            {
                "token": "SOL",
                "total_positions": 30,
                "percentage": "60.0%",
                "position": "LONG"
            }
        ]
        
        result = get_latest_smart_money(test_data)
        
        # First three should be BTC, ETH, SOL in that order
        self.assertEqual([r["token"] for r in result[:3]], ["BTC", "ETH", "SOL"])
    
    def test_empty_input(self):
        """Test handling of empty input"""
        result = get_latest_smart_money([])
        self.assertEqual(result, [])
    
    def test_invalid_percentage(self):
        """Test handling of invalid percentage format"""
        test_data = [
            {
                "token": "BTC",
                "total_positions": 100,
                "percentage": "invalid%",
                "position": "LONG"
            }
        ]
        
        result = get_latest_smart_money(test_data)
        self.assertEqual(result[0]["long_count"], 0)
        self.assertEqual(result[0]["short_count"], 100)
    
    def test_mixed_formats(self):
        """Test handling mix of old and new formats"""
        test_data = [
            {
                "token": "BTC",
                "total_positions": 100,
                "percentage": "60.0%",
                "position": "LONG"
            },
            {
                "indexToken": "ETH",
                "isLong": True,
                "trader_id": "0x123",
                "protocol": "gmx",
                "size": 100000
            }
        ]
        
        result = get_latest_smart_money(test_data)
        
        # Check both formats are processed correctly
        btc_data = next(r for r in result if r["token"] == "BTC")
        eth_data = next(r for r in result if r["token"] == "ETH")
        
        self.assertEqual(btc_data["long_count"], 60)
        self.assertEqual(btc_data["short_count"], 40)
        self.assertEqual(eth_data["long_count"], 1)
        self.assertEqual(eth_data["short_count"], 0)
    
    def test_limit_six_positions(self):
        """Test that only top 6 positions are returned"""
        test_data = [{"token": f"TOKEN{i}", 
                      "total_positions": 100 - i,
                      "percentage": "60.0%",
                      "position": "LONG"} for i in range(10)]
        
        result = get_latest_smart_money(test_data)
        self.assertEqual(len(result), 6)
        
        # Check sorting by total positions
        positions = [r["total_positions"] for r in result]
        self.assertEqual(positions, sorted(positions, reverse=True))

if __name__ == '__main__':
    unittest.main()
