# app/services/scraper.py
import os
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()

class AmazonScraper:
    def __init__(self):
        token = os.getenv("APIFY_API_TOKEN")
        self.client = ApifyClient(token) if token else None
        
        # Using the verified WebDataLabs scraper
        self.actor_id = "webdatalabs/amazon-reviews-scraper" 

    def get_live_reviews(self, product_url: str, max_reviews: int = 15) -> list[str]:
        """Scrapes live reviews from an Amazon URL using Apify."""
        if not self.client:
            print("WARNING: Apify token not found. Skipping live scrape.")
            return []

        print(f"Initiating live scrape for: {product_url}")
        
        # THE HARDCORE FIX: 
        # Strip input down to the absolute minimum required fields. 
        # No optional parameters = no schema validation errors.
        run_input = {
            "productUrls": [{"url": product_url}],
            "maxReviewsPerProduct": max_reviews
        }

        try:
            # Run the actor and wait for it to finish
            run = self.client.actor(self.actor_id).call(run_input=run_input)
            
            # Extract the review text from the resulting dataset
            reviews = []
            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                # Cast a wide net for whatever key the scraper decides to use
                text = item.get("text") or item.get("reviewText") or item.get("review") or item.get("content")
                if text:
                    reviews.append(str(text))
            
            print(f"Successfully scraped {len(reviews)} reviews!")
            return reviews
            
        except Exception as e:
            print(f"Apify Scraping Error: {e}")
            return []