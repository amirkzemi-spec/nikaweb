from fastapi import APIRouter, HTTPException, Header, Depends
import os
import json
from slugify import slugify
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Absolute path to /data/blog directory
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
BLOG_DIR = os.path.join(BASE_DIR, "data", "blog")

router = APIRouter(prefix="/api/blog", tags=["Blogs"])

# -----------------------------------------
# Auth: Bot Secret
# -----------------------------------------
BOT_SECRET = os.getenv("BOT_SECRET")

def verify_bot_secret(x_bot_secret: str = Header(...)):
    if not BOT_SECRET:
        raise HTTPException(status_code=500, detail="BOT_SECRET not configured on server")
    if x_bot_secret != BOT_SECRET:
        raise HTTPException(status_code=403, detail="Invalid bot secret")
    return True


# -----------------------------------------
# Model: Blog Post Payload
# -----------------------------------------
class BlogPost(BaseModel):
    slug: str
    lang: str = "fa"
    title: str
    meta_description: str
    category: str = "General"
    date: Optional[str] = None          # auto-set if not provided
    content_html: str
    outline: list = []                  # table of contents
    image_url: Optional[str] = None     # relative path to header image
    tags: list = []


# -----------------------------------------
# Utility: Load ONE blog
# -----------------------------------------
def load_blog(slug: str, lang: str = "fa"):
    path = os.path.join(BLOG_DIR, slug, f"{lang}.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# -----------------------------------------
# GET /api/blog/list
# -----------------------------------------
@router.get("/list")
def list_blogs(page: int = 1, limit: int = 10, category: str | None = None, q: str | None = None, lang: str = "fa"):
    blogs = []
    if os.path.exists(BLOG_DIR):
        for item in os.listdir(BLOG_DIR):
            item_path = os.path.join(BLOG_DIR, item)
            if not os.path.isdir(item_path):
                continue
            slug = item
            data = load_blog(slug, lang=lang)
            if not data:
                continue
            if category and data.get("category", "").lower() != category.lower():
                continue
            if q:
                text = (data.get("title", "") + " " + data.get("meta_description", "")).lower()
                if q.lower() not in text:
                    continue
            blogs.append({
                "slug": slug,
                "title": data.get("title", ""),
                "meta_description": data.get("meta_description", ""),
                "category": data.get("category", "General"),
                "date": data.get("date", ""),
                "image_url": data.get("image_url", ""),
                "tags": data.get("tags", []),
            })
    blogs.sort(key=lambda x: x["date"], reverse=True)
    total = len(blogs)
    start = (page - 1) * limit
    end = start + limit
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total // limit) + (1 if total % limit else 0),
        "blogs": blogs[start:end]
    }


# -----------------------------------------
# GET /api/blog/{slug}
# -----------------------------------------
@router.get("/{slug}")
def get_blog(slug: str, lang: str = "fa"):
    slug = slugify(slug)
    data = load_blog(slug, lang=lang)
    if not data:
        raise HTTPException(status_code=404, detail=f"Blog '{slug}' not found")
    data["slug"] = slug
    return data


# -----------------------------------------
# GET /api/blog/html/{slug}
# -----------------------------------------
@router.get("/html/{slug}")
def get_blog_html(slug: str, lang: str = "fa"):
    slug = slugify(slug)
    data = load_blog(slug, lang=lang)
    if not data:
        raise HTTPException(status_code=404, detail=f"Blog '{slug}' not found")
    return {"slug": slug, "html": data.get("content_html", "")}


# -----------------------------------------
# GET /api/blog/toc/{slug}
# -----------------------------------------
@router.get("/toc/{slug}")
def get_blog_toc(slug: str, lang: str = "fa"):
    slug = slugify(slug)
    data = load_blog(slug, lang=lang)
    if not data:
        raise HTTPException(status_code=404, detail=f"Blog '{slug}' not found")
    return {"slug": slug, "toc": data.get("outline", [])}


# -----------------------------------------
# POST /api/blog/create  ← NEW
# -----------------------------------------
@router.post("/create", dependencies=[Depends(verify_bot_secret)])
def create_blog(post: BlogPost):
    """
    Create a new blog post by writing it to data/blog/{slug}/{lang}.json.
    Protected by X-Bot-Secret header.
    """
    slug = slugify(post.slug)

    # Auto-set date if not provided
    date = post.date or datetime.utcnow().strftime("%Y-%m-%d")

    # Build the post directory
    post_dir = os.path.join(BLOG_DIR, slug)
    os.makedirs(post_dir, exist_ok=True)

    # Check if post already exists
    post_path = os.path.join(post_dir, f"{post.lang}.json")
    if os.path.exists(post_path):
        raise HTTPException(status_code=409, detail=f"Blog '{slug}' already exists for lang '{post.lang}'")

    # Build the JSON payload
    payload = {
        "title": post.title,
        "meta_description": post.meta_description,
        "category": post.category,
        "date": date,
        "content_html": post.content_html,
        "outline": post.outline,
        "image_url": post.image_url or f"/blog_images/{slug}/header.png",
        "tags": post.tags,
        "lang": post.lang,
        "slug": slug,
    }

    with open(post_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    return {
        "success": True,
        "slug": slug,
        "lang": post.lang,
        "path": post_path,
        "message": f"Blog post '{slug}' published successfully."
    }