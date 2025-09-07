"""
Monte Carlo Risk Engine Python Package
"""

from .risk_wrapper import (
    RiskEngineWrapper, 
    PortfolioAsset, 
    RiskMetrics,
    calculate_portfolio_risk
)

__version__ = "1.0.0"
__author__ = "Risk Engine Team"
__description__ = "High-performance Monte Carlo simulations for VaR and CVaR calculations"

__all__ = [
    "RiskEngineWrapper",
    "PortfolioAsset", 
    "RiskMetrics",
    "calculate_portfolio_risk"
]