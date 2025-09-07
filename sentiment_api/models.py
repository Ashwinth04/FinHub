from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import date

class SentimentHistoryItem(BaseModel):
    date: str
    score: float

class SentimentBySource(BaseModel):
    label: str
    mentions: int

class SentimentTrends(BaseModel):
    daily_change: float
    weekly_change: float
    monthly_change: float

class OverallSentiment(BaseModel):
    label: str
    score: float
    summary: str

class PriceData(BaseModel):
    date: str
    price: float

class SentimentPriceCorrelation(BaseModel):
    correlation_coefficient: float
    interpretation: str
    series: Dict[str, List[Dict[str, Any]]]

class SentimentResponse(BaseModel):
    token: str
    company: str
    overall_sentiment: OverallSentiment
    sentiment_by_source: Dict[str, SentimentBySource]
    sentiment_trends: SentimentTrends
    sentiment_history: List[SentimentHistoryItem]
    sentiment_price_correlation: SentimentPriceCorrelation

class SentimentRequest(BaseModel):
    token: str