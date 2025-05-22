from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import numpy as np
import torch
import logging
import os
import pickle
from datetime import datetime, timedelta
import yfinance as yf

# Import the portfolio model classes
from portfolio_model import (
    DataProcessor, PortfolioDataset, PortfolioOptimizationModel, 
    PortfolioOptimizer, prepare_data_pipeline, fetch_historical_data
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Portfolio Optimization API",
    description="Simple API for ML-based portfolio optimization",
    version="1.0.0"
)

# Global variables to store model state
global_model = None
global_optimizer = None
global_data_tuple = None
global_top_stocks = []
training_status = "not_started"

# Request/Response models
class UniversalStocksRequest(BaseModel):
    tickers: List[str] = Field(..., description="List of stock tickers for the universal set")

class TrainRequest(BaseModel):
    num_epochs: int = Field(50, description="Number of training epochs")
    batch_size: int = Field(32, description="Batch size for training")
    learning_rate: float = Field(1e-4, description="Learning rate")

class PredictRequest(BaseModel):
    tickers: List[str] = Field(..., description="List of tickers to include in portfolio")
    strategy: str = Field("Maximum Sharpe Ratio", description="Strategy: 'Maximum Sharpe Ratio', 'Minimum Volatility', or 'Equal Risk Contribution'")
    risk_tolerance: int = Field(5, ge=1, le=10, description="Risk tolerance level (1-10)")

class PortfolioResponse(BaseModel):
    portfolio_weights: Dict[str, float]
    expected_metrics: Dict[str, str]

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Portfolio Optimization API",
        "version": "1.0.0",
        "status": "running"
    }

@app.post("/set-universal-stocks")
async def set_universal_stocks(request: UniversalStocksRequest):
    """Set the universal stock universe"""
    global global_top_stocks, training_status
    
    try:
        # Validate tickers by trying to fetch a small sample
        logger.info(f"Setting universal stocks: {request.tickers}")
        
        # Test if we can fetch data for these tickers
        test_failures = []
        for ticker in request.tickers:
            try:
                test_data = fetch_historical_data(ticker)
                if test_data.empty:
                    test_failures.append(ticker)
            except Exception as e:
                test_failures.append(ticker)
                logger.warning(f"Could not fetch data for {ticker}: {str(e)}")
        
        if test_failures:
            return {
                "status": "warning",
                "message": f"Successfully set universal stocks, but failed to validate: {test_failures}",
                "valid_tickers": [t for t in request.tickers if t not in test_failures],
                "failed_tickers": test_failures
            }
        
        global_top_stocks = request.tickers
        training_status = "not_started"
        
        return {
            "status": "success",
            "message": f"Universal stocks set successfully",
            "tickers": global_top_stocks,
            "count": len(global_top_stocks)
        }
        
    except Exception as e:
        logger.error(f"Error setting universal stocks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-universal-stocks")
async def get_universal_stocks():
    """Get the current universal stock universe"""
    return {
        "tickers": global_top_stocks,
        "count": len(global_top_stocks),
        "training_status": training_status
    }

async def train_model_background(num_epochs: int, batch_size: int, learning_rate: float):
    """Background task for training the model"""
    global global_model, global_optimizer, global_data_tuple, training_status
    
    try:
        training_status = "training"
        logger.info("Starting model training...")
        
        # Prepare data
        logger.info("Preparing data pipeline...")
        train_loader, val_loader, test_loader, data_tuple = prepare_data_pipeline(
            fetch_historical_data_fn=fetch_historical_data,
            tickers=global_top_stocks,
            window_size=252
        )
        
        global_data_tuple = data_tuple
        
        # Initialize model
        logger.info("Initializing model...")
        model = PortfolioOptimizationModel(
            num_assets=len(global_top_stocks),
            window_size=252,
            hidden_dim=64,
            feature_dim=4
        )
        
        # Initialize optimizer
        optimizer = PortfolioOptimizer(model, learning_rate=learning_rate)
        
        # Train model
        logger.info(f"Training model for {num_epochs} epochs...")
        train_losses, val_losses = optimizer.train(
            train_loader=train_loader,
            val_loader=val_loader,
            num_epochs=num_epochs,
            early_stopping_patience=10
        )
        
        # Store globally
        global_model = model
        global_optimizer = optimizer
        
        training_status = "completed"
        logger.info("Training completed successfully!")
        
    except Exception as e:
        training_status = f"failed: {str(e)}"
        logger.error(f"Training failed: {str(e)}")

@app.post("/train")
async def train_model(request: TrainRequest, background_tasks: BackgroundTasks):
    """Train the portfolio optimization model"""
    global training_status
    
    if not global_top_stocks:
        raise HTTPException(status_code=400, detail="Please set universal stocks first using /set-universal-stocks")
    
    if training_status == "training":
        raise HTTPException(status_code=400, detail="Training already in progress")
    
    # Start training in background
    background_tasks.add_task(
        train_model_background,
        request.num_epochs,
        request.batch_size,
        request.learning_rate
    )
    
    return {
        "status": "success",
        "message": "Training started in background",
        "training_status": "training",
        "parameters": {
            "num_epochs": request.num_epochs,
            "batch_size": request.batch_size,
            "learning_rate": request.learning_rate
        }
    }

@app.get("/training-status")
async def get_training_status():
    """Get the current training status"""
    return {
        "training_status": training_status,
        "model_ready": global_model is not None and global_optimizer is not None
    }

@app.post("/predict", response_model=PortfolioResponse)
async def predict_portfolio(request: PredictRequest):
    """Generate portfolio weights for given tickers"""
    global global_model, global_optimizer, global_data_tuple
    
    # Check if model is trained
    if global_model is None or global_optimizer is None:
        raise HTTPException(status_code=400, detail="Model not trained yet. Please train the model first.")
    
    if global_data_tuple is None:
        raise HTTPException(status_code=400, detail="No training data available")
    
    try:
        # Validate that all requested tickers are in the universal set
        invalid_tickers = [ticker for ticker in request.tickers if ticker not in global_top_stocks]
        if invalid_tickers:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid tickers: {invalid_tickers}. Must be from universal set: {global_top_stocks}"
            )
        
        # Create binary mask
        binary_mask = []
        for ticker in global_top_stocks:
            if ticker in request.tickers:
                binary_mask.append(1)
            else:
                binary_mask.append(0)
        
        logger.info(f"Generated binary mask: {binary_mask} for tickers: {request.tickers}")
        
        # Map strategy name to index
        strategy_map = {
            "Maximum Sharpe Ratio": 0,
            "Minimum Volatility": 1,
            "Equal Risk Contribution": 2
        }
        strategy_idx = strategy_map.get(request.strategy, 0)
        
        # Get data
        returns_dict, features_dict = global_data_tuple
        
        # Get common dates and use the most recent window
        common_dates = sorted(list(returns_dict[global_top_stocks[0]].index))
        window_size = 252
        window_dates = common_dates[-window_size:]
        
        # Prepare input data
        returns_window = np.zeros((window_size, len(global_top_stocks)))
        features_window = np.zeros((window_size, len(global_top_stocks), 4))
        
        for j, ticker in enumerate(global_top_stocks):
            returns_window[:, j] = returns_dict[ticker].loc[window_dates].values
            features_window[:, j, :] = features_dict[ticker].loc[window_dates].values
        
        # Generate portfolio weights using the optimizer's predict method
        portfolio_weights = global_optimizer.predict(
            returns=returns_window,
            features=features_window,
            active_tickers=request.tickers,
            strategy_idx=strategy_idx,
            risk_tolerance=request.risk_tolerance
        )
        
        # Calculate expected portfolio metrics
        active_indices = [global_top_stocks.index(ticker) for ticker in request.tickers]
        subset_returns = returns_window[:, active_indices]
        
        weights_array = np.array([portfolio_weights.get(ticker, 0) for ticker in request.tickers])
        
        # Calculate portfolio metrics
        mean_returns = np.mean(subset_returns, axis=0) * 252
        cov_matrix = np.cov(subset_returns.T) * 252
        
        portfolio_return = np.sum(mean_returns * weights_array)
        portfolio_volatility = np.sqrt(weights_array.T @ cov_matrix @ weights_array)
        sharpe_ratio = portfolio_return / portfolio_volatility if portfolio_volatility > 0 else 0
        
        # Format expected metrics
        expected_metrics = {
            "Expected Annual Return": f"{portfolio_return*100:.2f}%",
            "Expected Annual Volatility": f"{portfolio_volatility*100:.2f}%",
            "Expected Sharpe Ratio": f"{sharpe_ratio:.2f}"
        }
        
        return PortfolioResponse(
            portfolio_weights=portfolio_weights,
            expected_metrics=expected_metrics
        )
        
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "universal_stocks_set": len(global_top_stocks) > 0,
        "model_trained": global_model is not None,
        "training_status": training_status
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)