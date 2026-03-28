import requests
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models.schemas import AnalyzeRequest, AnalyzeResponse, ManualReviewRequest, CompareRequest, CompareResponse
from app.services.parser import URLParser
from app.services.scraper import AmazonScraper
from app.ml.inference import SentimentEngine

app = FastAPI(title="ReviewSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ml_engine = SentimentEngine()
scraper = AmazonScraper()

FALLBACK_A = [
    "Amazing build quality and screen. Totally worth it.",
    "Battery is decent, not great. But performance is smooth.",
    "Highly recommend this to anyone looking for an upgrade."
]
FALLBACK_B = [
    "Terrible battery life, do not buy.",
    "Screen is okay but it gets very hot during use.",
    "Overpriced for what it offers. Returning it tomorrow."
]

def expand_url(url: str) -> str:
    """Resolves shortened URLs (like amzn.in/d/...) to their full Amazon product page."""
    if "amzn.in/d/" in url or "a.co" in url:
        print(f"Resolving shortened URL: {url}")
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            response = requests.get(url, allow_redirects=True, timeout=10, headers=headers)
            print(f"Resolved to: {response.url}")
            return response.url
        except Exception as e:
            print(f"Failed to resolve URL: {e}")
            return url
    return url

@app.get("/")
def home():
    return {"message": "ReviewSense API is running!"}

@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
async def analyze_product(request: AnalyzeRequest):
    try:
        url_str = expand_url(str(request.url))
        
        try:
            product_info = URLParser.extract_product_info(url_str)
            product_id = product_info["product_id"]
            domain = urlparse(url_str).netloc
            clean_url = f"https://{domain}/dp/{product_id}"
        except Exception as e:
            clean_url = url_str

        print(f"Sending clean URL to Apify: {clean_url}")
        reviews = scraper.get_live_reviews(clean_url)
        
        if not reviews:
            print("Scraping returned no reviews. Using fallback data...")
            reviews = FALLBACK_A

        results = ml_engine.analyze_reviews(reviews)

        return AnalyzeResponse(
            product_name=results.get("product_name", "Analyzed Product"),
            predicted_rating=results.get("predicted_rating", 3.0),
            sentiment=results.get("sentiment", {"positive": 0, "neutral": 0, "negative": 0}),
            aspects=results.get("aspects", {}),
            summary=results.get("summary", "No summary generated."),
            pros=results.get("pros", []),             
            cons=results.get("cons", []),             
            verdict=results.get("verdict", "UNKNOWN") 
        )

    except Exception as e:
        print(f"Backend Error: {e}") 
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.post("/api/v1/analyze/manual", response_model=AnalyzeResponse)
async def analyze_manual(request: ManualReviewRequest):
    if not request.reviews:
        raise HTTPException(status_code=400, detail="Reviews list cannot be empty.")
    
    try:
        results = ml_engine.analyze_reviews(request.reviews)
        
        return AnalyzeResponse(
            product_name=results.get("product_name", "Manual Entry Analysis"),
            predicted_rating=results.get("predicted_rating", 3.0),
            sentiment=results.get("sentiment", {"positive": 0, "neutral": 0, "negative": 0}),
            aspects=results.get("aspects", {}),
            summary=results.get("summary", "No summary generated."),
            pros=results.get("pros", []),             
            cons=results.get("cons", []),             
            verdict=results.get("verdict", "UNKNOWN") 
        )
    except Exception as e:
        print(f"OpenAI/Processing Error: {e}") 
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/compare", response_model=CompareResponse)
async def compare_products_route(request: CompareRequest):
    try:
        url_a_str = expand_url(str(request.url_a))
        url_b_str = expand_url(str(request.url_b))
        
        try:
            clean_a = f"https://{urlparse(url_a_str).netloc}/dp/{URLParser.extract_product_info(url_a_str)['product_id']}"
        except: 
            clean_a = url_a_str

        try:
            clean_b = f"https://{urlparse(url_b_str).netloc}/dp/{URLParser.extract_product_info(url_b_str)['product_id']}"
        except: 
            clean_b = url_b_str

        print(f"Comparing: \nA: {clean_a}\nB: {clean_b}")

        reviews_a = scraper.get_live_reviews(clean_a)
        reviews_b = scraper.get_live_reviews(clean_b)

        if not reviews_a: reviews_a = FALLBACK_A
        if not reviews_b: reviews_b = FALLBACK_B

        result_a = ml_engine.analyze_reviews(reviews_a)
        result_b = ml_engine.analyze_reviews(reviews_b)

        comparison_result = ml_engine.compare_products(result_a, result_b)

        return CompareResponse(
            product_a=AnalyzeResponse(
                product_name=result_a.get("product_name", "Product A"),
                predicted_rating=result_a.get("predicted_rating", 3.0), 
                sentiment=result_a.get("sentiment", {"positive": 0, "neutral": 0, "negative": 0}), 
                aspects=result_a.get("aspects", {}),
                summary=result_a.get("summary", ""), 
                pros=result_a.get("pros", []), 
                cons=result_a.get("cons", []), 
                verdict=result_a.get("verdict", "UNKNOWN")
            ),
            product_b=AnalyzeResponse(
                product_name=result_b.get("product_name", "Product B"),
                predicted_rating=result_b.get("predicted_rating", 3.0), 
                sentiment=result_b.get("sentiment", {"positive": 0, "neutral": 0, "negative": 0}), 
                aspects=result_b.get("aspects", {}),
                summary=result_b.get("summary", ""), 
                pros=result_b.get("pros", []), 
                cons=result_b.get("cons", []), 
                verdict=result_b.get("verdict", "UNKNOWN")
            ),
            comparison=comparison_result
        )

    except Exception as e:
        print(f"Comparison Error: {e}") 
        raise HTTPException(status_code=500, detail=str(e))