from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import SentimentRequest, SentimentResponse
from services.sentiment_service import SentimentService

app = FastAPI(title="Portfolio Sentiment API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sentiment_service = SentimentService()

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
        
        result = sentiment_service.get_sentiment_analysis(ticker)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)