"""
Token Whitelist Configuration

This module contains the whitelist of supported tokens for the DeFi Llama API integration.
The whitelist is used to filter asset data returned from the pools/borrow endpoint.

Categories of tokens included:
- Native tokens (ETH, BTC)
- Wrapped versions (WETH, WBTC)
- Staked versions (WSTETH, SFRXETH)
- Stablecoins (USDT, USDC, DAI)
- Bridged tokens (.E suffix versions)
- Liquid staking derivatives
- Synthetic versions

Usage:
    from token_whitelist import DESIRED_SYMBOLS
    
    # Use in filtering
    if token in DESIRED_SYMBOLS:
        # process token

Note:
    - All symbols should be in UPPERCASE
    - Symbols should match exactly as they appear in the DeFi Llama API
    - Bridged tokens use dot notation (e.g., 'WETH.E')
"""

DESIRED_SYMBOLS = (
    # Native and Wrapped Ethereum
    "ETH",
    "WETH",
    "WSTETH",
    "SFRXETH",
    "RETH",
    "CBETH",
    
    # Bitcoin representations
    "WBTC",
    "TBTC",
    "CBBTC",
    
    # Major Stablecoins
    "USDT",
    "USDC",
    "DAI",
    "LUSD",
    "FRAX",
    "GHO",
    
    # Synthetic/Derivative Stablecoins
    "SUSDE",
    "USDS",
    "USDE",
    "CRVUSD",
    "SCRVUSD",
    "PYUSD",
    "DOLA",
    
    # Derivative Tokens
    "SDAI",
    
    # Bridged Tokens (primarily from Avalanche)
    "WETH.E",
    "USDC.E",
    "USDT.E",
    "DAI.E",
    
    # Other Variants
    "USBDC",
) 