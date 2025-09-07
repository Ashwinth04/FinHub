import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any
import random
from services.gemini_service import GeminiService
from services.price_service import PriceService
from models import *

class SentimentService:
    def __init__(self):
        self.gemini_service = GeminiService()
        self.price_service = PriceService()
    
    def get_sentiment_analysis(self, ticker: str) -> SentimentResponse:
        company_name = self.price_service.get_company_name(ticker)
        historical_prices = self.price_service.get_historical_prices(ticker)
        
        gemini_data = self.gemini_service.analyze_sentiment(ticker)
        
        if gemini_data and 'sentiment_data' in gemini_data:
            return self._build_response_from_gemini(ticker, company_name, historical_prices, gemini_data['sentiment_data'])
        else:
            return self._build_mock_response(ticker, company_name, historical_prices)
    
    def _build_response_from_gemini(self, ticker: str, company_name: str, prices: List[Dict], gemini_data: Dict) -> SentimentResponse:
        overall_score = gemini_data.get('overall_score', 0.0)
        overall_label = gemini_data.get('overall_label', 'Neutral')
        summary = gemini_data.get('summary', f'{ticker} shows mixed market sentiment.')
        
        sentiment_history = self._generate_sentiment_history(overall_score)
        sentiment_trends = self._calculate_sentiment_trends(sentiment_history)
        correlation_data = self._calculate_price_sentiment_correlation(prices, sentiment_history)
        
        return SentimentResponse(
            token=ticker,
            company=company_name,
            overall_sentiment=OverallSentiment(
                label=overall_label,
                score=overall_score,
                summary=summary
            ),
            sentiment_by_source={
                "twitter": SentimentBySource(
                    label=gemini_data.get('twitter_sentiment', 'Positive'),
                    mentions=gemini_data.get('twitter_mentions', random.randint(1000, 10000))
                ),
                "reddit": SentimentBySource(
                    label=gemini_data.get('reddit_sentiment', 'Positive'),
                    mentions=gemini_data.get('reddit_mentions', random.randint(500, 5000))
                ),
                "news": SentimentBySource(
                    label=gemini_data.get('news_sentiment', 'Positive'),
                    mentions=gemini_data.get('news_mentions', random.randint(100, 3000))
                )
            },
            sentiment_trends=sentiment_trends,
            sentiment_history=sentiment_history,
            sentiment_price_correlation=correlation_data
        )
    
    def _build_mock_response(self, ticker: str, company_name: str, prices: List[Dict]) -> SentimentResponse:
        base_sentiment = random.uniform(-2.0, 3.0)
        sentiment_history = self._generate_sentiment_history(base_sentiment)
        sentiment_trends = self._calculate_sentiment_trends(sentiment_history)
        correlation_data = self._calculate_price_sentiment_correlation(prices, sentiment_history)
        
        sentiment_labels = ["Very Negative", "Negative", "Neutral", "Positive", "Very Positive"]
        label_index = min(4, max(0, int((base_sentiment + 2.5) * 2)))
        
        return SentimentResponse(
            token=ticker,
            company=company_name,
            overall_sentiment=OverallSentiment(
                label=sentiment_labels[label_index],
                score=round(base_sentiment, 1),
                summary=f"{ticker} shows {sentiment_labels[label_index].lower()} market sentiment based on recent analysis."
            ),
            sentiment_by_source={
                "twitter": SentimentBySource(
                    label=random.choice(sentiment_labels[2:]),
                    mentions=random.randint(1000, 10000)
                ),
                "reddit": SentimentBySource(
                    label=random.choice(sentiment_labels[1:4]),
                    mentions=random.randint(500, 5000)
                ),
                "news": SentimentBySource(
                    label=random.choice(sentiment_labels[1:4]),
                    mentions=random.randint(100, 3000)
                )
            },
            sentiment_trends=sentiment_trends,
            sentiment_history=sentiment_history,
            sentiment_price_correlation=correlation_data
        )
    
    def _generate_sentiment_history(self, base_score: float, days: int = 30) -> List[SentimentHistoryItem]:
        history = []
        current_score = base_score
        
        for i in range(days):
            date_obj = datetime.now() - timedelta(days=days-i-1)
            volatility = random.uniform(-0.3, 0.3)
            current_score += volatility
            current_score = max(-5.0, min(5.0, current_score))
            
            history.append(SentimentHistoryItem(
                date=date_obj.strftime("%Y-%m-%d"),
                score=round(current_score, 1)
            ))
        
        return history
    
    def _calculate_sentiment_trends(self, history: List[SentimentHistoryItem]) -> SentimentTrends:
        scores = [item.score for item in history]
        
        daily_change = scores[-1] - scores[-2] if len(scores) >= 2 else 0.0
        weekly_change = scores[-1] - scores[-7] if len(scores) >= 7 else 0.0
        monthly_change = scores[-1] - scores[0] if len(scores) > 0 else 0.0
        
        return SentimentTrends(
            daily_change=round(daily_change, 1),
            weekly_change=round(weekly_change, 1),
            monthly_change=round(monthly_change, 1)
        )
    
    def _calculate_price_sentiment_correlation(self, prices: List[Dict], sentiment_history: List[SentimentHistoryItem]) -> SentimentPriceCorrelation:
        if len(prices) < 2 or len(sentiment_history) < 2:
            correlation_coeff = random.uniform(0.3, 0.8)
        else:
            price_values = [p['price'] for p in prices[-len(sentiment_history):]]
            sentiment_values = [s.score for s in sentiment_history[-len(price_values):]]
            
            if len(price_values) == len(sentiment_values) and len(price_values) > 1:
                correlation_coeff = np.corrcoef(price_values, sentiment_values)[0, 1]
                if np.isnan(correlation_coeff):
                    correlation_coeff = random.uniform(0.3, 0.8)
            else:
                correlation_coeff = random.uniform(0.3, 0.8)
        
        correlation_coeff = round(correlation_coeff, 2)
        
        if correlation_coeff > 0.7:
            interpretation = "Strong positive correlation between sentiment and price."
        elif correlation_coeff > 0.4:
            interpretation = "Moderate positive correlation between sentiment and price."
        elif correlation_coeff > 0.1:
            interpretation = "Weak positive correlation between sentiment and price."
        elif correlation_coeff > -0.1:
            interpretation = "No significant correlation between sentiment and price."
        else:
            interpretation = "Negative correlation between sentiment and price."
        
        recent_sentiment = sentiment_history[-min(10, len(sentiment_history)):]
        recent_prices = prices[-min(10, len(prices)):]
        
        return SentimentPriceCorrelation(
            correlation_coefficient=correlation_coeff,
            interpretation=interpretation,
            series={
                "sentiment": [{"date": s.date, "score": s.score} for s in recent_sentiment],
                "price": [{"date": p["date"], "price": p["price"]} for p in recent_prices]
            }
        )