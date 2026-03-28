import json
import os

class ReviewDatabase:
    def __init__(self, db_path: str = "data/real_db.json"):
        self.db_path = db_path
        self._load_data()

    def _load_data(self):
        if not os.path.exists(self.db_path):
            print(f"Warning: {self.db_path} not found.")
            self.data = {}
            return

        with open(self.db_path, 'r', encoding='utf-8') as f:
            self.data = json.load(f)

    def get_reviews(self, product_id: str) -> list[str]:
        return self.data.get(str(product_id), [])