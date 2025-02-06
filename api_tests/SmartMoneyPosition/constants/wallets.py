"""
Constants for trader wallets to track in the Smart Money Position tracker.
These are high-performing traders identified on various protocols.
Dylan Burkey Searced for top wallets using the Copin API for position tracking.
not all wallets are used in the tracker, only top performers are included.
- refrence https://copin.io/protocol/gmx/traders
- current top wallets as of 2024-10-21
- Walle

"""

TRADER_WALLETS = [
    # Top GMX traders
    "0x9f431A46149bab70373B9C6867d2dB8C2F45aa11",  # GMX Trader 1
    "0x5a54aD9860B08AAee07174887f9ee5107b0A2e72",  # GMX Trader 2
    "0x24d02e64d4A2580d570666546aC937adaB2b3E08",  # GMX Trader 3
    
    # Top Kwenta traders
    "0x1755AF9d62eF0978AC9dAc48B3EeEBB90e793b82",  # Kwenta Trader 1
    "0xda72696cEC7398B548F0b62fc094d0ab46C632d3",  # Kwenta Trader 2
    
    # Top HyperLiquid traders
    "0x0cDDEbe6726F9684D982b7A4B325dD784b469D93",  # HyperLiquid Trader 1
    "0x9f07Dc88Dc450978e5DDF973f6a0236A7cFBF99a",  # HyperLiquid Trader 2
]
