import os
import json

BLOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "blog")


def load_all_blog_posts(lang: str = "en"):
    """
    Load all blog posts from the slug/lang.json structure.
    
    Args:
        lang: Language code (default: "en")
    
    Returns:
        list: Sorted list of blog posts
    """
    posts = []
    
    if not os.path.exists(BLOG_DIR):
        return posts

    for item in os.listdir(BLOG_DIR):
        item_path = os.path.join(BLOG_DIR, item)
        # Skip files and special directories
        if not os.path.isdir(item_path) or item in ["processed", "images"]:
            continue
        
        slug = item
        lang_file = os.path.join(item_path, f"{lang}.json")
        
        if os.path.exists(lang_file):
            try:
                with open(lang_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                
                posts.append({
                    "id": slug,
                    "title": data.get("title"),
                    "date": data.get("date"),
                    "category": data.get("category"),
                    "meta_description": data.get("meta_description"),
                })
            except Exception:
                continue

    return sorted(posts, key=lambda x: x.get("date", ""), reverse=True)


def load_blog_post(post_id: str, lang: str = "en"):
    """
    Load a single blog post.
    
    Args:
        post_id: Blog slug
        lang: Language code (default: "en")
    
    Returns:
        dict or None: Blog data or None if not found
    """
    path = os.path.join(BLOG_DIR, post_id, f"{lang}.json")

    if not os.path.exists(path):
        return None

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
