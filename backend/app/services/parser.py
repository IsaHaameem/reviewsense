import re
from urllib.parse import urlparse, parse_qs

class URLParser:
    @staticmethod
    def extract_product_info(url: str) -> dict:
        parsed_url = urlparse(str(url))
        domain = parsed_url.netloc.lower()

        if "amazon" in domain:
            # Matches /dp/B08N5WRWNW or /product/B08N5WRWNW
            match = re.search(r"/(?:dp|product|gp/product)/([A-Z0-9]+)", parsed_url.path)
            if match:
                return {"platform": "amazon", "product_id": match.group(1)}
                
        elif "flipkart" in domain:
            # Matches p/itm... and extracts pid from query params
            query_params = parse_qs(parsed_url.query)
            if "pid" in query_params:
                return {"platform": "flipkart", "product_id": query_params["pid"][0]}
        
        raise ValueError("Unsupported URL format or missing Product ID.")