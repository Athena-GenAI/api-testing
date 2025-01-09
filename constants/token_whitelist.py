"""
Token Whitelist Configuration

This module contains the whitelist of supported tokens.

Categories:
- Native tokens (ETH, BTC)
- Wrapped versions (WETH, WBTC)
- Staked versions (WSTETH, SFRXETH)
- Stablecoins (USDT, USDC, DAI)
- Bridged tokens (.E suffix versions)
- Liquid staking derivatives
- Synthetic versions
"""

DESIRED_SYMBOLS = {
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
}
