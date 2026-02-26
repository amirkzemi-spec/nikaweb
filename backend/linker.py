"""
linker.py — Internal Link Injector
Scans existing posts and injects 3-5 relevant internal links into new content.
Used by generator.py pipeline.
"""

import os
import json
import re
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

BASE_DIR = os.path.dirname(__file__)
BLOG_DIR = os.path.join(BASE_DIR, "data", "blog")
SITE_URL = os.getenv("SITE_URL", "https://nikavisa.com")


# ============================================================
# STEP 1: Load all existing posts (title, tags, slug, excerpt)
# ============================================================
def load_existing_posts(lang: str = "fa", exclude_slug: str = "") -> list:
    posts = []
    if not os.path.exists(BLOG_DIR):
        return posts

    for item in os.listdir(BLOG_DIR):
        if item == exclude_slug:
            continue
        item_path = os.path.join(BLOG_DIR, item)
        if not os.path.isdir(item_path):
            continue
        post_path = os.path.join(item_path, f"{lang}.json")
        if not os.path.exists(post_path):
            continue
        with open(post_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Extract first 100 chars of plain text as excerpt
        content = data.get("content_html", "")
        excerpt = re.sub(r"<[^>]+>", "", content)[:150].strip()

        posts.append({
            "slug": item,
            "title": data.get("title", ""),
            "tags": data.get("tags", []),
            "category": data.get("category", ""),
            "excerpt": excerpt,
            "url": f"{SITE_URL}/blog/{item}",
        })

    return posts


# ============================================================
# STEP 2: Use GPT to find the most relevant posts + anchor text
# ============================================================
def find_relevant_links(new_post_title: str, new_post_content: str, existing_posts: list, max_links: int = 5) -> list:
    if not existing_posts:
        return []

    posts_summary = "\n".join([
        f"- slug: {p['slug']} | title: {p['title']} | tags: {', '.join(p['tags'])} | excerpt: {p['excerpt']}"
        for p in existing_posts
    ])

    prompt = f"""You are an SEO internal linking expert.

NEW ARTICLE:
Title: {new_post_title}
Content preview: {re.sub(r'<[^>]+>', '', new_post_content)[:500]}

EXISTING POSTS:
{posts_summary}

Task: Select the {max_links} most relevant existing posts to link to from the new article.
For each, suggest a natural Persian anchor text phrase that would appear in the new article.

Return ONLY valid JSON array (no markdown):
[
  {{"slug": "existing-slug", "anchor_text": "متن لینک به فارسی", "reason": "why this is relevant"}},
  ...
]

Rules:
- Only pick genuinely relevant posts (same topic, related visa type, or complementary info)
- Anchor text must be a natural Persian phrase that would fit in the article
- If fewer than {max_links} posts are relevant, return only the relevant ones
- Never force irrelevant links
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        raw = json.loads(response.choices[0].message.content)
        # GPT might return {"links": [...]} or just [...]
        if isinstance(raw, list):
            return raw
        for key in raw:
            if isinstance(raw[key], list):
                return raw[key]
        return []
    except Exception as e:
        print(f"⚠️ Link finding failed: {e}")
        return []


# ============================================================
# STEP 3: Inject links into HTML content
# ============================================================
def inject_links(content_html: str, links: list, existing_posts: list) -> str:
    if not links:
        return content_html

    # Build slug -> url map
    url_map = {p["slug"]: p["url"] for p in existing_posts}

    injected = 0
    for link in links:
        slug = link.get("slug")
        anchor = link.get("anchor_text", "")
        url = url_map.get(slug)

        if not slug or not anchor or not url:
            continue

        # Only inject if anchor text actually appears in the content
        if anchor in content_html:
            # Replace first occurrence only, avoid double-linking
            linked = f'<a href="{url}">{anchor}</a>'
            content_html = content_html.replace(anchor, linked, 1)
            injected += 1
        else:
            # Anchor not found verbatim — inject as a related article callout before closing
            # Find a good paragraph to insert after
            pass

    # If we couldn't inject naturally, append a "related articles" section
    naturally_injected = injected
    remaining = [l for l in links if l.get("anchor_text", "") not in content_html or naturally_injected == 0]

    if len(links) > 0 and injected < 2:
        # Append related posts section at end
        related_html = '\n<h2>مقالات مرتبط</h2>\n<ul>\n'
        for link in links[:5]:
            slug = link.get("slug")
            anchor = link.get("anchor_text", slug)
            url = url_map.get(slug, f"{SITE_URL}/blog/{slug}")
            related_html += f'  <li><a href="{url}">{anchor}</a></li>\n'
        related_html += '</ul>\n'
        content_html += related_html

    return content_html


# ============================================================
# MAIN FUNCTION: called from generator.py
# ============================================================
def add_internal_links(slug: str, title: str, content_html: str, lang: str = "fa", max_links: int = 4) -> str:
    """
    Main entry point. Takes new post data, finds relevant existing posts,
    injects internal links, returns updated content_html.
    """
    existing = load_existing_posts(lang=lang, exclude_slug=slug)

    if not existing:
        print("ℹ️ No existing posts found for internal linking.")
        return content_html

    print(f"🔗 Found {len(existing)} existing posts. Finding relevant links...")
    links = find_relevant_links(title, content_html, existing, max_links=max_links)

    if not links:
        print("ℹ️ No relevant links found.")
        return content_html

    print(f"🔗 Injecting {len(links)} internal links...")
    updated_html = inject_links(content_html, links, existing)
    return updated_html


# ============================================================
# QUICK TEST
# ============================================================
if __name__ == "__main__":
    test_html = "<h2 id='s1'>ویزای توریستی سوئیس</h2><p>برای سفر به سوئیس نیاز به ویزای شنگن دارید.</p>"
    result = add_internal_links(
        slug="swiss-tourist-visa",
        title="ویزای توریستی سوئیس برای ایرانیان",
        content_html=test_html,
    )
    print(result)
