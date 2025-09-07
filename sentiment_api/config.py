import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    DEFAULT_DAYS = 30
    SENTIMENT_SCALE_MIN = -5.0
    SENTIMENT_SCALE_MAX = 5.0