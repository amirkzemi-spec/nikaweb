from fastapi import APIRouter, HTTPException
import os
import json
from slugify import slugify

# Absolute path to /data/blog directory
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
BLOG_DIR = os.path.join(BASE_DIR, "data", "blog")

router = APIRouter(prefix="/api/blog", tags=["Blogs"])


# -----------------------------------------
# Utility: Load ONE blog
# -----------------------------------------
def load_blog(slug: str, lang: str = "en"):
    """
    Load a blog post from slug/lang.json structure.
    
    Args:
        slug: Blog slug
        lang: Language code (default: "en")
    
    Returns:
        dict or None: Blog data or None if not found
    """
    path = os.path.join(BLOG_DIR, slug, f"{lang}.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# -----------------------------------------
# GET /api/blog/list
# -----------------------------------------
@router.get("/list")
def list_blogs(page: int = 1, limit: int = 10, category: str | None = None, q: str | None = None, lang: str = "en"):
    blogs = []

    # load all blogs from slug/lang.json structure
    if os.path.exists(BLOG_DIR):
        for item in os.listdir(BLOG_DIR):
            item_path = os.path.join(BLOG_DIR, item)
            
            # Skip files, only process directories
            if not os.path.isdir(item_path):
                continue
            
            slug = item
            data = load_blog(slug, lang=lang)

            # skip empty
            if not data:
                continue

            # category filter
            if category and data.get("category", "").lower() != category.lower():
                continue

            # search filter (title + meta_description)
            if q:
                text = (data.get("title","") + " " + data.get("meta_description","")).lower()
                if q.lower() not in text:
                    continue

            blogs.append({
                "slug": slug,
                "title": data.get("title",""),
                "meta_description": data.get("meta_description",""),
                "category": data.get("category","General"),
                "date": data.get("date","")
            })

    # sort newest first
    blogs.sort(key=lambda x: x["date"], reverse=True)

    # pagination math
    total = len(blogs)
    start = (page - 1) * limit
    end = start + limit
    paginated = blogs[start:end]

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total // limit) + (1 if total % limit else 0),
        "blogs": paginated
    }


# -----------------------------------------
# GET /api/blog/{slug}
# -----------------------------------------
@router.get("/{slug}")
def get_blog(slug: str, lang: str = "en"):
    slug = slugify(slug)
    data = load_blog(slug, lang=lang)

    if not data:
        raise HTTPException(status_code=404, detail=f"Blog '{slug}' not found")

    # Required for frontend
    data["slug"] = slug

    return data


# -----------------------------------------
# GET /api/blog/html/{slug}
# -----------------------------------------
@router.get("/html/{slug}")
def get_blog_html(slug: str, lang: str = "en"):
    slug = slugify(slug)
    data = load_blog(slug, lang=lang)

    if not data:
        raise HTTPException(status_code=404, detail=f"Blog '{slug}' not found")

    return {"slug": slug, "html": data.get("content_html", "")}


# -----------------------------------------
# GET /api/blog/toc/{slug}
# -----------------------------------------
@router.get("/toc/{slug}")
def get_blog_toc(slug: str, lang: str = "en"):
    slug = slugify(slug)
    data = load_blog(slug, lang=lang)

    if not data:
        raise HTTPException(status_code=404, detail=f"Blog '{slug}' not found")

    return {"slug": slug, "toc": data.get("outline", [])}
