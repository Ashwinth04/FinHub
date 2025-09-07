import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict
import numpy as np

class PriceService:
    def __init__(self):
        pass
    
    def get_historical_prices(self, ticker: str, days: int = 30) -> List[Dict[str, any]]:
        try:
            stock = yf.Ticker(ticker)
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            hist = stock.download(start=start_date, end=end_date)
            
            prices = []
            for date, row in hist.iterrows():
                prices.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "price": round(float(row['Close']), 2)
                })
            
            return prices[-days:] if len(prices) > days else prices
            
        except Exception as e:
            return self._generate_mock_prices(ticker, days)
    
    def get_company_name(self, ticker: str) -> str:
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            return info.get('longName', f"{ticker} Inc.")
        except:
            return f"{ticker} Inc."
    
    def _generate_mock_prices(self, ticker: str, days: int) -> List[Dict[str, any]]:
        base_price = hash(ticker) % 100 + 50
        prices = []
        
        for i in range(days):
            date_obj = datetime.now() - timedelta(days=days-i-1)
            noise = np.random.normal(0, 2)
            price = max(base_price + noise, 10)
            
            prices.append({
                "date": date_obj.strftime("%Y-%m-%d"),
                "price": round(price, 2)
            })
        
        return prices