from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from models import SentimentRequest, SentimentResponse
from services.sentiment_service import SentimentService
from services.price_service import PriceService
import uvicorn
import os
import json
import numpy as np
import pandas as pd
from pydantic import BaseModel
from scipy.optimize import minimize
from datetime import datetime
from redis import asyncio as aioredis

app = FastAPI(title="Portfolio Sentiment API", version="1.0.0")
REDIS_URL = os.getenv("REDIS_URL","redis://localhost:6379")
redis = None

@app.on_event("startup")
async def startup_event():
    global redis
    redis = aioredis.from_url(REDIS_URL, decode_responses=True)
    await redis.ping()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sentiment_service = SentimentService()
price_service = PriceService()


class PortfolioRequest(BaseModel):
    id: int
    user_id: int
    name: str
    description: str
    is_default: int
    created_at: str
    updated_at: str
    assets: list


class OptimizationRequest(BaseModel):
    portfolio: PortfolioRequest
    objective: str
    riskTolerance: int

@app.get("/")
async def root():
    return {"message": "Portfolio Sentiment Analysis API"}


@app.post("/sentiment", response_model=SentimentResponse)
async def get_sentiment(request: SentimentRequest):
    try:
        ticker = request.token.upper().strip()
        if not ticker:
            raise HTTPException(status_code=400, detail="Token is required")
        
        result = sentiment_service.get_sentiment_analysis(ticker)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/sentiment/{ticker}", response_model=SentimentResponse)
async def get_sentiment_by_ticker(ticker: str):
    try:
        ticker = ticker.upper().strip()
        if not ticker:
            raise HTTPException(status_code=400, detail="Ticker is required")

        cache_key = f"sentiment:{ticker}"

        # Check cache
        cached_data = await redis.get(cache_key)
        if cached_data:
            print(f"Cache hit for {ticker}")
            return JSONResponse(content=json.loads(cached_data))

        # Fetch fresh data
        print(f"Cache miss for {ticker}")
        result = sentiment_service.get_sentiment_analysis(ticker)

        # Store in Redis (1 hour TTL)
        await redis.setex(cache_key, 3600, result.json())

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/optimize")
async def optimize_portfolio(request: OptimizationRequest):
    try:
        portfolio = request.portfolio
        objective = request.objective
        risk_tolerance = request.riskTolerance

        assets = portfolio.assets
        if not assets:
            raise HTTPException(status_code=400, detail="Portfolio must have assets")

        tickers = [asset["symbol"] for asset in assets]

        price_data = {}
        for ticker in tickers:
            hist = price_service.get_historical_prices(ticker, days=180)
            if not hist or len(hist) == 0:
                raise HTTPException(status_code=404, detail=f"No price data for {ticker}")
            price_data[ticker] = [entry["price"] for entry in hist]

        # Align data lengths
        min_len = min(len(v) for v in price_data.values())
        for t in tickers:
            price_data[t] = price_data[t][-min_len:]

        df = pd.DataFrame(price_data)
        returns = df.pct_change().dropna()

        mean_returns = returns.mean()
        cov_matrix = returns.cov()
        num_assets = len(tickers)

        def portfolio_performance(weights):
            ret = np.dot(weights, mean_returns)
            vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
            return ret, vol, ret / vol if vol != 0 else 0

        # Strategies
        def max_sharpe():
            def neg_sharpe(weights):
                ret, vol, _ = portfolio_performance(weights)
                adj_ret = ret * (1 + 0.05 * (risk_tolerance - 5))  # tilt by tolerance
                return -(adj_ret / vol if vol != 0 else -np.inf)

            return minimize(
                neg_sharpe,
                num_assets * [1. / num_assets],
                method="SLSQP",
                bounds=tuple((0, 1) for _ in range(num_assets)),
                constraints={"type": "eq", "fun": lambda x: np.sum(x) - 1}
            )

        def min_volatility():
            def vol_func(weights):
                _, vol, _ = portfolio_performance(weights)
                adj_vol = vol * (1 - 0.05 * (risk_tolerance - 5))
                return adj_vol

            return minimize(
                vol_func,
                num_assets * [1. / num_assets],
                method="SLSQP",
                bounds=tuple((0, 1) for _ in range(num_assets)),
                constraints={"type": "eq", "fun": lambda x: np.sum(x) - 1}
            )

        def equal_risk():
            def risk_contrib(weights):
                portfolio_vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
                mrc = np.dot(cov_matrix, weights) / portfolio_vol
                rc = weights * mrc
                target = portfolio_vol / num_assets
                return np.sum((rc - target) ** 2)

            return minimize(
                risk_contrib,
                num_assets * [1. / num_assets],
                method="SLSQP",
                bounds=tuple((0, 1) for _ in range(num_assets)),
                constraints={"type": "eq", "fun": lambda x: np.sum(x) - 1}
            )

        if objective == "maxSharpe":
            result = max_sharpe()
            strategy_type = "maximum_sharpe"
        elif objective == "minVolatility":
            result = min_volatility()
            strategy_type = "minimum_volatility"
        elif objective == "equalRisk":
            result = equal_risk()
            strategy_type = "equal_risk"
        else:
            raise HTTPException(status_code=400, detail="Invalid objective")

        if not result.success:
            raise HTTPException(status_code=500, detail="Optimization failed")

        weights = result.x
        exp_return, exp_vol, sharpe = portfolio_performance(weights)

        # Current allocations
        total_value = sum(asset["quantity"] * asset["purchase_price"] for asset in assets)
        current_allocations = {
            str(asset["id"]): (asset["quantity"] * asset["purchase_price"] / total_value) * 100
            for asset in assets
        }

        # Build output weights
        weights_output = {}
        for i, asset in enumerate(assets):
            weights_output[str(asset["id"])] = {
                "symbol": asset["symbol"],
                "name": asset["name"],
                "weight": float(weights[i]),
                "currentAllocation": current_allocations[str(asset["id"])],
                "optimizedAllocation": float(weights[i] * 100)
            }

        return {
            "type": strategy_type,
            "weights": weights_output,
            "metrics": {
                "expectedReturn": f"{exp_return:.2f}",
                "expectedRisk": f"{exp_vol:.2f}",
                "sharpeRatio": f"{sharpe:.2f}"
            },
            "objective": objective,
            "riskTolerance": risk_tolerance,
            "optimizedAt": datetime.utcnow().isoformat() + "Z"
        }

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)