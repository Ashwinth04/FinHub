import google.generativeai as genai
import json
import re
import traceback
from typing import Dict, Any, Optional
from config import Config
from google.genai import types
from google import genai as gai

class GeminiService:
    def __init__(self):
        genai.configure(api_key=Config.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        try:
            self.client = gai.Client(api_key=Config.GEMINI_API_KEY)
            print("Gemini Agent initialized successfully!!")
        except Exception as model_error:
            raise ValueError(f"Failed to initialize Gemini Model: {str(model_error)}")
    
    def analyze_sentiment(self, ticker: str) -> Optional[Dict[str, Any]]:
        prompt = self._build_sentiment_prompt(ticker)
        
        try:
            response = self.client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(
                        google_search=types.GoogleSearchRetrieval()
                    )]
                )
            )
            
            response_text = response.text
            
            try:
                data = json.loads(response_text)
            except json.JSONDecodeError:
                data = self._extract_json_from_text(response_text)
            
            return data
            
        except Exception as e:
            print(f"Gemini API error for {ticker}: {str(e)}")
            return None
    
    def _build_sentiment_prompt(self, ticker: str) -> str:
        return f"""
            Analyze the current market sentiment for stock ticker {ticker} and provide a JSON response with the following structure:

            {{
            "sentiment_data": {{
                "overall_score": <float between -5 and 5>,
                "overall_label": "<Very Negative|Negative|Neutral|Positive|Very Positive>",
                "summary": "<brief summary of sentiment>",
                "twitter_mentions": <integer>,
                "reddit_mentions": <integer>,
                "news_mentions": <integer>,
                "twitter_sentiment": "<sentiment label>",
                "reddit_sentiment": "<sentiment label>",
                "news_sentiment": "<sentiment label>"
            }}
            }}

            Search for recent discussions, news, and social media posts about {ticker}. Focus on the last 7 days.
            Return only valid JSON without any markdown formatting or additional text.
            """
    
    def _extract_json_from_text(self, text: str) -> Optional[Dict[str, Any]]:
        json_pattern = r'\{[\s\S]*\}'
        json_match = re.search(json_pattern, text)
        
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass
        
        return None