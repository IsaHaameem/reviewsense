import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class SentimentEngine:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def analyze_reviews(self, reviews: list[str]) -> dict:
        if not reviews:
            return {}

        reviews_text = "\n".join([f"- {r}" for r in reviews])
        
        prompt = f"""
        You are an expert e-commerce data analyst. Analyze the following product reviews:
        {reviews_text}

        You must extract and calculate:
        1. product_name: A short, 3-5 word name for the product based on what reviewers are talking about.
        2. predicted_rating: An overall rating from 1.0 to 5.0 based on the sentiment.
        3. sentiment: A count of how many reviews are positive, neutral, and negative.
        4. aspects: Identify the top 3-5 specific PRODUCT FEATURES mentioned. Rate consensus as "positive", "negative", or "neutral".
        5. summary: A 2-sentence executive summary.
        6. pros: A list of the top 3 selling points. Each must be an object with "text" (the feature) and "quote" (an exact sentence from the reviews proving it).
        7. cons: A list of the top 3 biggest complaints. Each must be an object with "text" (the feature) and "quote" (an exact sentence from the reviews proving it).
        8. verdict: A single word recommendation: "BUY", "CONSIDER", or "AVOID".

        Respond ONLY in valid JSON matching this exact structure:
        {{
            "product_name": "Columbia Fleece Jacket",
            "predicted_rating": 4.5,
            "sentiment": {{"positive": 8, "neutral": 2, "negative": 1}},
            "aspects": {{"Material": "positive", "Fit": "neutral", "Zippers": "negative"}},
            "summary": "Customers love the material but have mixed feelings about the fit.",
            "pros": [
                {{"text": "Soft fabric", "quote": "The cotton feels incredibly soft against the skin."}}
            ],
            "cons": [
                {{"text": "Zippers get stuck", "quote": "I've only worn it twice and the main zipper is already jammed."}}
            ],
            "verdict": "CONSIDER"
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a JSON-generating data analyst."},
                    {"role": "user", "content": prompt}
                ],
                response_format={ "type": "json_object" },
                temperature=0.2
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"OpenAI Error: {e}")
            raise e

    def compare_products(self, data_a: dict, data_b: dict) -> dict:
        prompt = f"""
        You are an expert tech reviewer comparing two products based on their review data.
        
        Product A Data: {json.dumps(data_a)}
        Product B Data: {json.dumps(data_b)}
        
        Analyze the overall rating, sentiment spread, and aspects. 
        1. Decide the overall winner (Respond with the ACTUAL 'product_name' from the data, or 'Tie').
        2. Write a 3-sentence summary explaining WHY the winner was chosen.
        3. Determine the winner for 3-4 shared aspects using their real names. If an aspect is only in one product, ignore it.

        Respond ONLY in valid JSON matching this exact structure:
        {{
            "winner": "iPhone 17 Pro",
            "summary": "The iPhone 17 Pro wins due to significantly higher positive sentiment regarding its battery life and build quality...",
            "aspect_winners": {{"Camera": "iPhone 17 Pro", "Battery": "iPhone 16", "Display": "Tie"}}
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo", 
                messages=[
                    {"role": "system", "content": "You are a JSON-generating comparison engine."},
                    {"role": "user", "content": prompt}
                ],
                response_format={ "type": "json_object" },
                temperature=0.2
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"OpenAI Comparison Error: {e}")
            raise e