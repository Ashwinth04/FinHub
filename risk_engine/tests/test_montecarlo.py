"""
Unit tests for Monte Carlo Risk Engine
"""

import pytest
import numpy as np
import json
from fastapi.testclient import TestClient
from typing import List, Dict

# Import our modules
import sys
sys.path.append('../python')

from main import app
from risk_wrapper import RiskEngineWrapper, PortfolioAsset, calculate_portfolio_risk

# Create test client
client = TestClient(app)

class TestRiskEngineWrapper:
    """Test the Python wrapper functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.engine = RiskEngineWrapper(num_simulations=10000, time_horizon_days=1)
        
        self.sample_assets = [
            PortfolioAsset(asset_name="Asset1", weight=0.6, expected_return=0.10, volatility=0.20),
            PortfolioAsset(asset_name="Asset2", weight=0.4, expected_return=0.08, volatility=0.15)
        ]
        
        self.sample_correlation = [
            [1.0, 0.5],
            [0.5, 1.0]
        ]
    
    def test_portfolio_validation(self):
        """Test portfolio validation"""
        # Valid portfolio
        self.engine.validate_portfolio(self.sample_assets)
        
        # Empty portfolio should raise error
        with pytest.raises(ValueError, match="Portfolio cannot be empty"):
            self.engine.validate_portfolio([])
        
        # Weights not summing to 1
        invalid_assets = [
            PortfolioAsset(asset_name="Asset1", weight=0.7, expected_return=0.10, volatility=0.20),
            PortfolioAsset(asset_name="Asset2", weight=0.4, expected_return=0.08, volatility=0.15)
        ]
        with pytest.raises(ValueError, match="Portfolio weights must sum to 1.0"):
            self.engine.validate_portfolio(invalid_assets)
    
    def test_correlation_matrix_creation(self):
        """Test identity correlation matrix creation"""
        matrix = self.engine.create_identity_correlation_matrix(3)
        
        assert len(matrix) == 3
        assert len(matrix[0]) == 3
        assert matrix[0][0] == 1.0
        assert matrix[1][1] == 1.0
        assert matrix[2][2] == 1.0
        assert matrix[0][1] == 0.0
        assert matrix[1][0] == 0.0
    
    def test_risk_calculation_basic(self):
        """Test basic risk calculation"""
        result = self.engine.calculate_risk_metrics(
            assets=self.sample_assets,
            correlation_matrix=self.sample_correlation,
            num_simulations=5000
        )
        
        # Check that all fields are present and reasonable
        assert result.var_95 > 0  # VaR should be positive (loss)
        assert result.var_99 > result.var_95  # 99% VaR should be higher than 95%
        assert result.cvar_95 >= result.var_95  # CVaR should be >= VaR
        assert result.cvar_99 >= result.var_99
        assert result.expected_return > 0  # Positive expected return
        assert result.portfolio_vol > 0  # Positive volatility
        assert result.num_simulations == 5000
        assert result.simulation_summary is not None
    
    def test_risk_calculation_with_identity_correlation(self):
        """Test risk calculation with default correlation matrix"""
        result = self.engine.calculate_risk_metrics(
            assets=self.sample_assets,
            num_simulations=5000
        )
        
        assert result.var_95 > 0
        assert result.var_99 > result.var_95
    
    def test_sample_portfolio(self):
        """Test sample portfolio creation"""
        assets, correlation_matrix = self.engine.create_sample_portfolio()
        
        assert len(assets) == 3
        assert len(correlation_matrix) == 3
        assert len(correlation_matrix[0]) == 3
        
        # Check weights sum to 1
        total_weight = sum(asset.weight for asset in assets)
        assert abs(total_weight - 1.0) < 1e-6
    
    def test_invalid_correlation_matrix(self):
        """Test handling of invalid correlation matrix"""
        # Wrong dimensions
        invalid_correlation = [[1.0, 0.5], [0.5, 1.0], [0.3, 0.3]]
        
        with pytest.raises(ValueError, match="Correlation matrix dimensions"):
            self.engine.calculate_risk_metrics(
                assets=self.sample_assets,
                correlation_matrix=invalid_correlation
            )


class TestConvenienceFunction:
    """Test the convenience function"""
    
    def test_calculate_portfolio_risk_function(self):
        """Test the convenience function"""
        assets_dict = [
            {"asset_name": "AAPL", "weight": 0.5, "expected_return": 0.12, "volatility": 0.25},
            {"asset_name": "GOOGL", "weight": 0.5, "expected_return": 0.10, "volatility": 0.30}
        ]
        
        result = calculate_portfolio_risk(
            assets=assets_dict,
            num_simulations=5000,
            time_horizon_days=1
        )
        
        assert isinstance(result, dict)
        assert 'var_95' in result
        assert 'var_99' in result
        assert 'cvar_95' in result
        assert 'cvar_99' in result
        assert result['var_95'] > 0
        assert result['var_99'] > result['var_95']


class TestFastAPIEndpoints:
    """Test FastAPI endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data
    
    def test_sample_portfolio_endpoint(self):
        """Test sample portfolio endpoint"""
        response = client.get("/sample-portfolio")
        assert response.status_code == 200
        data = response.json()
        assert "assets" in data
        assert "correlation_matrix" in data
        assert len(data["assets"]) == 3
        assert len(data["correlation_matrix"]) == 3
    
    def test_calculate_risk_endpoint_valid(self):
        """Test risk calculation endpoint with valid data"""
        request_data = {
            "assets": [
                {"asset_name": "AAPL", "weight": 0.6, "expected_return": 0.12, "volatility": 0.25},
                {"asset_name": "GOOGL", "weight": 0.4, "expected_return": 0.10, "volatility": 0.30}
            ],
            "correlation_matrix": [
                [1.0, 0.7],
                [0.7, 1.0]
            ],
            "num_simulations": 5000,
            "time_horizon_days": 1
        }
        
        response = client.post("/calculate-risk", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "var_95" in data
        assert "var_99" in data
        assert "cvar_95" in data
        assert "cvar_99" in data
        assert "calculation_time_ms" in data
        assert data["var_95"] > 0
        assert data["var_99"] > data["var_95"]
        assert data["num_simulations"] == 5000
    
    def test_calculate_risk_endpoint_invalid_weights(self):
        """Test risk calculation with invalid weights"""
        request_data = {
            "assets": [
                {"asset_name": "AAPL", "weight": 0.7, "expected_return": 0.12, "volatility": 0.25},
                {"asset_name": "GOOGL", "weight": 0.4, "expected_return": 0.10, "volatility": 0.30}
            ]
        }
        
        response = client.post("/calculate-risk", json=request_data)
        assert response.status_code == 422  # Validation error
    
    def test_calculate_risk_endpoint_no_correlation(self):
        """Test risk calculation without correlation matrix"""
        request_data = {
            "assets": [
                {"asset_name": "AAPL", "weight": 0.6, "expected_return": 0.12, "volatility": 0.25},
                {"asset_name": "GOOGL", "weight": 0.4, "expected_return": 0.10, "volatility": 0.30}
            ],
            "num_simulations": 5000
        }
        
        response = client.post("/calculate-risk", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["var_95"] > 0
    
    def test_quick_risk_endpoint(self):
        """Test quick risk calculation endpoint"""
        assets_data = [
            {"asset_name": "AAPL", "weight": 0.5, "expected_return": 0.12, "volatility": 0.25},
            {"asset_name": "GOOGL", "weight": 0.5, "expected_return": 0.10, "volatility": 0.30}
        ]
        
        response = client.post("/quick-risk", json=assets_data, params={"num_simulations": 3000})
        assert response.status_code == 200
        
        data = response.json()
        assert "var_95" in data
        assert "calculation_time_ms" in data
        assert data["num_simulations"] == 3000
    
    def test_calculate_risk_endpoint_invalid_correlation(self):
        """Test risk calculation with invalid correlation matrix"""
        request_data = {
            "assets": [
                {"asset_name": "AAPL", "weight": 0.6, "expected_return": 0.12, "volatility": 0.25},
                {"asset_name": "GOOGL", "weight": 0.4, "expected_return": 0.10, "volatility": 0.30}
            ],
            "correlation_matrix": [
                [1.0, 0.7, 0.5],  # Wrong dimensions
                [0.7, 1.0, 0.3],
                [0.5, 0.3, 1.0]
            ]
        }
        
        response = client.post("/calculate-risk", json=request_data)
        assert response.status_code == 422  # Validation error
    
    def test_extreme_parameters(self):
        """Test with extreme but valid parameters"""
        request_data = {
            "assets": [
                {"asset_name": "HighVol", "weight": 1.0, "expected_return": 0.20, "volatility": 0.50}
            ],
            "num_simulations": 1000,  # Minimum allowed
            "time_horizon_days": 252  # Maximum allowed (1 year)
        }
        
        response = client.post("/calculate-risk", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["var_95"] > 0
        assert data["time_horizon_days"] == 252


class TestEdgeCases:
    """Test edge cases and error conditions"""
    
    def test_single_asset_portfolio(self):
        """Test with single asset portfolio"""
        engine = RiskEngineWrapper(num_simulations=5000)
        assets = [
            PortfolioAsset(asset_name="AAPL", weight=1.0, expected_return=0.12, volatility=0.25)
        ]
        
        result = engine.calculate_risk_metrics(assets)
        assert result.var_95 > 0
        assert result.var_99 > result.var_95
    
    def test_zero_volatility_asset(self):
        """Test with zero volatility asset"""
        engine = RiskEngineWrapper(num_simulations=1000)
        assets = [
            PortfolioAsset(asset_name="RiskFree", weight=1.0, expected_return=0.03, volatility=0.0)
        ]
        
        result = engine.calculate_risk_metrics(assets)
        # With zero volatility, VaR should be very small (only due to expected return)
        assert result.var_95 >= 0
        assert result.portfolio_vol == 0.0
    
    def test_negative_correlation(self):
        """Test with negative correlation"""
        engine = RiskEngineWrapper(num_simulations=5000)
        assets = [
            PortfolioAsset(asset_name="Asset1", weight=0.5, expected_return=0.10, volatility=0.20),
            PortfolioAsset(asset_name="Asset2", weight=0.5, expected_return=0.08, volatility=0.15)
        ]
        correlation = [
            [1.0, -0.5],
            [-0.5, 1.0]
        ]
        
        result = engine.calculate_risk_metrics(assets, correlation)
        assert result.var_95 > 0
        # Portfolio volatility should be reduced due to negative correlation
        assert result.portfolio_vol < 0.175  # Should be less than average of individual volatilities


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])