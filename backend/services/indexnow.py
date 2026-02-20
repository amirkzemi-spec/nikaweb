import requests
import json

INDEXNOW_ENDPOINTS = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
    "https://yandex.com/indexnow"
]

# Replace this with your real domain
DOMAIN = "https://nikavisa.com"

# Must be constant for IndexNow
API_KEY = "nika-indexnow-2025-key"
API_KEY_FILE = f"{DOMAIN}/{API_KEY}.txt"


def notify_indexnow(slug: str):
    """
    Notify search engines that a new blog URL is published.
    """

    url = f"{DOMAIN}/blog/{slug}"

    payload = {
        "host": "nikavisa.com",
        "key": API_KEY,
        "keyLocation": API_KEY_FILE,
        "urlList": [url]
    }

    results = {}

    for endpoint in INDEXNOW_ENDPOINTS:
        try:
            r = requests.post(endpoint, json=payload, timeout=5)
            results[endpoint] = r.status_code
        except Exception as e:
            results[endpoint] = str(e)

    return {
        "submitted_url": url,
        "results": results
    }
