"""
Python wrapper for the C++ Monte Carlo Risk Engine
"""

import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, validator
import risk_engine_cpp


class PortfolioAsset(BaseModel):
    """Portfolio asset representation"""
    asset_name: str
    weight: float
    expected_return: float
    volatility: float
    
    @validator('weight')
    def validate_weight(cls, v):
        if v < 0 or v > 1:
            raise ValueError('Weight must be between 0 and 1')
        return v
    
    @validator('volatility')
    def validate_volatility(cls, v):
        if v < 0:
            raise ValueError('Volatility must be non-negative')
        return v


class RiskMetrics(BaseModel):
    """Risk metrics output"""
    var_95: float
    var_99: float
    cvar_95: float
    cvar_99: float
    expected_return: float
    portfolio_vol: float
    num_simulations: int
    time_horizon_days: float
    simulation_summary: Optional[Dict[str, float]] = None


class RiskEngineWrapper:
    """
    Python wrapper for the C++ Monte Carlo Risk Engine
    
    This class provides a high-level interface to the C++ implementation,
    handling data validation, format conversion, and result processing.
    """
    
    def __init__(self, num_simulations: int = 100000, time_horizon_days: int = 1):
        """
        Initialize the risk engine wrapper
        
        Args:
            num_simulations: Number of Monte Carlo simulations
            time_horizon_days: Time horizon in days for risk calculation
        """
        self.num_simulations = num_simulations
        self.time_horizon = time_horizon_days / 252.0  # Convert to years
        
    def validate_portfolio(self, assets: List[PortfolioAsset]) -> None:
        """Validate portfolio assets"""
        if not assets:
            raise ValueError("Portfolio cannot be empty")
        
        total_weight = sum(asset.weight for asset in assets)
        if abs(total_weight - 1.0) > 1e-6:
            raise ValueError(f"Portfolio weights must sum to 1.0, got {total_weight}")
    
    def create_identity_correlation_matrix(self, size: int) -> List[List[float]]:
        """Create an identity correlation matrix"""
        matrix = []
        for i in range(size):
            row = [0.0] * size
            row[i] = 1.0
            matrix.append(row)
        return matrix
    
    def calculate_risk_metrics(
        self, 
        assets: List[PortfolioAsset],
        correlation_matrix: Optional[List[List[float]]] = None,
        num_simulations: Optional[int] = None,
        time_horizon_days: Optional[int] = None
    ) -> RiskMetrics:
        """
        Calculate VaR and CVaR for a given portfolio
        
        Args:
            assets: List of portfolio assets
            correlation_matrix: Asset correlation matrix (optional, defaults to identity)
            num_simulations: Number of simulations (optional, uses instance default)
            time_horizon_days: Time horizon in days (optional, uses instance default)
            
        Returns:
            RiskMetrics object containing calculated risk measures
        """
        # Validate inputs
        self.validate_portfolio(assets)
        
        # Use instance defaults if not provided
        sims = num_simulations if num_simulations is not None else self.num_simulations
        horizon_days = time_horizon_days if time_horizon_days is not None else int(self.time_horizon * 252)
        horizon_years = horizon_days / 252.0
        
        # Create correlation matrix if not provided (identity matrix)
        if correlation_matrix is None:
            correlation_matrix = self.create_identity_correlation_matrix(len(assets))
        
        # Validate correlation matrix dimensions
        if len(correlation_matrix) != len(assets) or len(correlation_matrix[0]) != len(assets):
            raise ValueError("Correlation matrix dimensions must match number of assets")
        
        # Extract asset data for C++ function
        asset_names = [asset.asset_name for asset in assets]
        weights = [asset.weight for asset in assets]
        expected_returns = [asset.expected_return for asset in assets]
        volatilities = [asset.volatility for asset in assets]
        
        try:
            # Call C++ function
            cpp_result = risk_engine_cpp.calculate_portfolio_risk(
                asset_names=asset_names,
                weights=weights,
                expected_returns=expected_returns,
                volatilities=volatilities,
                correlation_matrix=correlation_matrix,
                num_simulations=sims,
                time_horizon=horizon_years
            )
            
            # Calculate simulation summary statistics
            simulation_results = cpp_result.simulation_results
            simulation_summary = {
                "mean": float(np.mean(simulation_results)),
                "std": float(np.std(simulation_results)),
                "min": float(np.min(simulation_results)),
                "max": float(np.max(simulation_results)),
                "skewness": float(self._calculate_skewness(simulation_results)),
                "kurtosis": float(self._calculate_kurtosis(simulation_results))
            }
            
            # Return formatted results
            return RiskMetrics(
                var_95=cpp_result.var_95,
                var_99=cpp_result.var_99,
                cvar_95=cpp_result.cvar_95,
                cvar_99=cpp_result.cvar_99,
                expected_return=cpp_result.expected_return,
                portfolio_vol=cpp_result.portfolio_vol,
                num_simulations=sims,
                time_horizon_days=horizon_days,
                simulation_summary=simulation_summary
            )
            
        except Exception as e:
            raise RuntimeError(f"Risk calculation failed: {str(e)}")
    
    def _calculate_skewness(self, data: List[float]) -> float:
        """Calculate skewness of simulation results"""
        data_array = np.array(data)
        mean = np.mean(data_array)
        std = np.std(data_array)
        if std == 0:
            return 0.0
        return np.mean(((data_array - mean) / std) ** 3)
    
    def _calculate_kurtosis(self, data: List[float]) -> float:
        """Calculate excess kurtosis of simulation results"""
        data_array = np.array(data)
        mean = np.mean(data_array)
        std = np.std(data_array)
        if std == 0:
            return 0.0
        return np.mean(((data_array - mean) / std) ** 4) - 3.0
    
    def create_sample_portfolio(self) -> Tuple[List[PortfolioAsset], List[List[float]]]:
        """
        Create a sample portfolio for testing
        
        Returns:
            Tuple of (assets, correlation_matrix)
        """
        assets = [
            PortfolioAsset(
                asset_name="AAPL",
                weight=0.4,
                expected_return=0.12,
                volatility=0.25
            ),
            PortfolioAsset(
                asset_name="GOOGL",
                weight=0.3,
                expected_return=0.10,
                volatility=0.30
            ),
            PortfolioAsset(
                asset_name="MSFT",
                weight=0.3,
                expected_return=0.11,
                volatility=0.28
            )
        ]
        
        # Sample correlation matrix
        correlation_matrix = [
            [1.0, 0.7, 0.8],
            [0.7, 1.0, 0.6],
            [0.8, 0.6, 1.0]
        ]
        
        return assets, correlation_matrix


# Convenience functions for direct usage
def calculate_portfolio_risk(
    assets: List[Dict[str, Any]],
    correlation_matrix: Optional[List[List[float]]] = None,
    num_simulations: int = 100000,
    time_horizon_days: int = 1
) -> Dict[str, Any]:
    """
    Convenience function to calculate portfolio risk from dictionary inputs
    
    Args:
        assets: List of asset dictionaries with keys: asset_name, weight, expected_return, volatility
        correlation_matrix: Optional correlation matrix
        num_simulations: Number of Monte Carlo simulations
        time_horizon_days: Time horizon in days
        
    Returns:
        Dictionary with risk metrics
    """
    # Convert dict assets to PortfolioAsset objects
    portfolio_assets = [PortfolioAsset(**asset) for asset in assets]
    
    # Create engine and calculate risk
    engine = RiskEngineWrapper(num_simulations, time_horizon_days)
    result = engine.calculate_risk_metrics(portfolio_assets, correlation_matrix)
    
    return result.dict()