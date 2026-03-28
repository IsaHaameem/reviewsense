from pydantic import BaseModel, HttpUrl
from typing import Dict, List

class AnalyzeRequest(BaseModel):
    url: HttpUrl

class ManualReviewRequest(BaseModel):
    reviews: List[str]

class SentimentDistribution(BaseModel):
    positive: int
    neutral: int
    negative: int

# --- ADD THIS NEW CLASS ---
class Citation(BaseModel):
    text: str
    quote: str

class AnalyzeResponse(BaseModel):
    product_name: str
    predicted_rating: float
    sentiment: SentimentDistribution
    aspects: Dict[str, str]
    summary: str
    pros: List[Citation]  # <-- UPDATED
    cons: List[Citation]  # <-- UPDATED
    verdict: str


class CompareRequest(BaseModel):
    url_a: HttpUrl
    url_b: HttpUrl

class ComparisonResult(BaseModel):
    winner: str  # "Product A", "Product B", or "Tie"
    summary: str
    aspect_winners: Dict[str, str] # e.g. {"Battery": "Product A", "Camera": "Product B"}

class CompareResponse(BaseModel):
    product_a: AnalyzeResponse
    product_b: AnalyzeResponse
    comparison: ComparisonResult