"""
FastAPI application for Monte Carlo Risk Engine
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, validator
from typing import List, Optional, Dict, Any
import logging
import time
from contextlib import asynccontextmanager

from risk_wrapper import RiskEngineWrapper, PortfolioAsset, calculate_portfolio_risk

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global risk engine instance
risk_engine = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global risk_engine
    
    # Startup
    logger.info("Starting Risk Engine API...")
    risk_engine = RiskEngineWrapper(num_simulations=100000, time_horizon_days=1)
    logger.info("Risk Engine initialized successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Risk Engine API...")

# Create FastAPI application
app = FastAPI(
    title="Monte Carlo Risk Engine API",
    description="High-performance Monte Carlo simulations for VaR and CVaR calculations",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class AssetInput(BaseModel):
    """Input model for portfolio assets"""
    asset_name: str
    weight: float
    expected_return: float
    volatility: float
    
    @validator('weight')
    def validate_weight(cls, v):
        if not (0 <= v <= 1):
            raise ValueError('Weight must be between 0 and 1')
        return v
    
    @validator('volatility')
    def validate_volatility(cls, v):
        if v < 0:
            raise ValueError('Volatility must be non-negative')
        return v

class RiskCalculationRequest(BaseModel):
    """Request model for risk calculations"""
    assets: List[AssetInput]
    correlation_matrix: Optional[List[List[float]]] = None
    num_simulations: Optional[int] = Query(default=100000, ge=1000, le=1000000)
    time_horizon_days: Optional[int] = Query(default=1, ge=1, le=252)
    
    @validator('assets')
    def validate_assets(cls, v):
        if not v:
            raise ValueError('At least one asset is required')
        if len(v) > 100:  # Reasonable limit
            raise ValueError('Maximum 100 assets allowed')
        
        # Check that weights sum to 1
        total_weight = sum(asset.weight for asset in v)
        if abs(total_weight - 1.0) > 1e-6:
            raise ValueError(f'Asset weights must sum to 1.0, got {total_weight:.6f}')
        
        return v
    
    @validator('correlation_matrix')
    def validate_correlation_matrix(cls, v, values):
        if v is None:
            return v
        
        assets = values.get('assets', [])
        n = len(assets)
        
        if len(v) != n:
            raise ValueError(f'Correlation matrix must be {n}x{n}, got {len(v)} rows')
        
        for i, row in enumerate(v):
            if len(row) != n:
                raise ValueError(f'Correlation matrix row {i} must have {n} elements, got {len(row)}')
            
            # Check diagonal elements
            if abs(row[i] - 1.0) > 1e-6:
                raise ValueError(f'Diagonal element [{i}][{i}] must be 1.0, got {row[i]}')
            
            # Check symmetry
            for j, val in enumerate(row):
                if abs(val - v[j][i]) > 1e-6:
                    raise ValueError(f'Correlation matrix must be symmetric: [{i}][{j}] != [{j}][{i}]')
                
                if abs(val) > 1.0:
                    raise ValueError(f'Correlation values must be between -1 and 1, got {val}')
        
        return v

class RiskCalculationResponse(BaseModel):
    """Response model for risk calculations"""
    var_95: float
    var_99: float
    cvar_95: float
    cvar_99: float
    expected_return: float
    portfolio_volatility: float
    num_simulations: int
    time_horizon_days: int
    calculation_time_ms: float
    simulation_summary: Dict[str, float]

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    version: str

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: str
    timestamp: str

# API Endpoints
@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Monte Carlo Risk Engine API",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/health"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        version="1.0.0"
    )

@app.post("/calculate-risk", response_model=RiskCalculationResponse)
async def calculate_risk(request: RiskCalculationRequest):
    """
    Calculate VaR and CVaR for a portfolio using Monte Carlo simulation
    
    This endpoint performs high-performance Monte Carlo simulations in C++ with OpenMP
    parallelization to calculate Value at Risk (VaR) and Conditional Value at Risk (CVaR)
    at 95% and 99% confidence levels.
    
    Args:
        request: Portfolio configuration and simulation parameters
        
    Returns:
        Risk metrics including VaR, CVaR, expected returns, and simulation statistics
    """
    start_time = time.time()
    
    try:
        # Convert request to internal format
        portfolio_assets = [
            PortfolioAsset(
                asset_name=asset.asset_name,
                weight=asset.weight,
                expected_return=asset.expected_return,
                volatility=asset.volatility
            )
            for asset in request.assets
        ]
        
        # Calculate risk metrics
        result = risk_engine.calculate_risk_metrics(
            assets=portfolio_assets,
            correlation_matrix=request.correlation_matrix,
            num_simulations=request.num_simulations,
            time_horizon_days=request.time_horizon_days
        )
        
        calculation_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        logger.info(f"Risk calculation completed in {calculation_time:.2f}ms for "
                   f"{len(request.assets)} assets, {request.num_simulations} simulations")
        
        return RiskCalculationResponse(
            var_95=result.var_95,
            var_99=result.var_99,
            cvar_95=result.cvar_95,
            cvar_99=result.cvar_99,
            expected_return=result.expected_return,
            portfolio_volatility=result.portfolio_vol,
            num_simulations=result.num_simulations,
            time_horizon_days=result.time_horizon_days,
            calculation_time_ms=calculation_time,
            simulation_summary=result.simulation_summary
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input parameters: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Risk calculation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Risk calculation failed: {str(e)}"
        )

@app.get("/sample-portfolio", response_model=Dict[str, Any])
async def get_sample_portfolio():
    """
    Get a sample portfolio configuration for testing
    
    Returns a sample 3-asset portfolio with correlation matrix that can be used
    to test the risk calculation endpoint.
    """
    try:
        assets, correlation_matrix = risk_engine.create_sample_portfolio()
        
        return {
            "assets": [asset.dict() for asset in assets],
            "correlation_matrix": correlation_matrix,
            "description": "Sample 3-asset portfolio (AAPL, GOOGL, MSFT) with correlation matrix"
        }
    except Exception as e:
        logger.error(f"Error creating sample portfolio: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create sample portfolio: {str(e)}"
        )

@app.post("/quick-risk", response_model=RiskCalculationResponse)
async def quick_risk_calculation(
    assets: List[Dict[str, Any]],
    num_simulations: int = Query(default=50000, ge=1000, le=500000)
):
    """
    Quick risk calculation endpoint with simplified input format
    
    This endpoint accepts a simple list of asset dictionaries and uses default
    correlation (identity matrix) for faster calculations with fewer simulations.
    
    Args:
        assets: List of asset dictionaries with keys: asset_name, weight, expected_return, volatility
        num_simulations: Number of Monte Carlo simulations (default: 50,000)
        
    Returns:
        Risk metrics for the portfolio
    """
    start_time = time.time()
    
    try:
        # Use the convenience function
        result_dict = calculate_portfolio_risk(
            assets=assets,
            correlation_matrix=None,  # Use identity matrix
            num_simulations=num_simulations,
            time_horizon_days=1
        )
        
        calculation_time = (time.time() - start_time) * 1000
        
        logger.info(f"Quick risk calculation completed in {calculation_time:.2f}ms")
        
        return RiskCalculationResponse(
            var_95=result_dict['var_95'],
            var_99=result_dict['var_99'],
            cvar_95=result_dict['cvar_95'],
            cvar_99=result_dict['cvar_99'],
            expected_return=result_dict['expected_return'],
            portfolio_volatility=result_dict['portfolio_vol'],
            num_simulations=result_dict['num_simulations'],
            time_horizon_days=result_dict['time_horizon_days'],
            calculation_time_ms=calculation_time,
            simulation_summary=result_dict['simulation_summary']
        )
        
    except Exception as e:
        logger.error(f"Quick risk calculation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Quick risk calculation failed: {str(e)}"
        )

# Custom exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=f"HTTP {exc.status_code}",
            detail=exc.detail,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        ).dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal Server Error",
            detail="An unexpected error occurred",
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        ).dict()
    )

if __name__ == "__main__":
    import uvicorn
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(description="Monte Carlo Risk Engine API Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to (default: 8000)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    parser.add_argument("--log-level", default="info", choices=["debug", "info", "warning", "error"], 
                       help="Log level (default: info)")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🚀 Monte Carlo Risk Engine API Server")
    print("=" * 60)
    print(f"Starting server on http://{args.host}:{args.port}")
    print(f"Swagger UI available at: http://localhost:{args.port}/docs")
    print(f"ReDoc available at: http://localhost:{args.port}/redoc")
    print("=" * 60)
    print("Press Ctrl+C to stop the server")
    print()
    
    try:
        uvicorn.run(
            "main:app",
            host=args.host,
            port=args.port,
            reload=args.reload,
            log_level=args.log_level
        )
    except KeyboardInterrupt:
        print("\n" + "=" * 60)
        print("🛑 Server stopped by user")
        print("=" * 60)
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Server failed to start: {e}")
        print("\nCommon solutions:")
        print(f"1. Check if port {args.port} is already in use")
        print("2. Try a different port with --port <number>")
        print("3. Make sure all dependencies are installed")
        sys.exit(1)