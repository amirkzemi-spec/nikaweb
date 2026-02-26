"""
generator.py — Nika Blog Content Generator + Image Generation
"""

import os
import json
import httpx
from datetime import datetime
from slugify import slugify
from openai import OpenAI
from dotenv import load_dotenv
from linker import add_internal_links

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

BASE_DIR = os.path.dirname(__file__)
IMAGE_DIR = os.path.join(BASE_DIR, "data", "blog", "images")


def generate_blog_post(
    topic: str,
    keyword: str = "",
    category: str = "Immigration",
    tone: str = "professional and trustworthy",
    extra_context: str = "",
    lang: str = "fa",
) -> dict:

    keyword_instruction = f"The target SEO keyword is: {keyword}. Use it naturally in the title, first paragraph, and 2-3 subheadings." if keyword else ""
    context_instruction = f"""
Additional context to incorporate (use for accuracy — do not ignore):
---
{extra_context}
---
""" if extra_context else ""

    system_prompt = """You are an expert Persian immigration content writer for nikavisa.com.
Your writing is accurate, helpful, and trustworthy — written for Iranian audiences considering immigration.
You write in fluent, natural Persian (Farsi). Never use machine-translated or stiff language.
You always structure articles clearly with proper H2/H3 headings.
You never make up visa requirements or legal facts — if unsure, say "consult an immigration advisor".
"""

    user_prompt = f"""Write a complete Persian blog post with the following specifications:

TOPIC: {topic}
CATEGORY: {category}
TONE: {tone}
TARGET LENGTH: approximately 1500 words with at least 5-6 main sections
{keyword_instruction}
{context_instruction}

Return ONLY a valid JSON object (no markdown, no backticks) with this exact structure:
{{
  "title": "<Persian title, SEO optimized>",
  "slug": "<english-slug-based-on-title>",
  "meta_description": "<Persian meta description, 150-160 chars>",
  "category": "{category}",
  "tags": ["<tag1>", "<tag2>", "<tag3>"],
  "outline": [
    {{"id": "section-1", "text": "<heading text>"}},
    {{"id": "section-2", "text": "<heading text>"}},
    {{"id": "section-3", "text": "<heading text>"}},
    {{"id": "section-4", "text": "<heading text>"}},
    {{"id": "section-5", "text": "<heading text>"}},
    {{"id": "section-6", "text": "<heading text>"}}
  ],
  "content_html": "<full article as HTML with h2, h3, p, ul, li tags in Persian>",
  "image_prompt": "<english description of an ideal clean minimal illustration for this article header>"
}}

Rules for content_html:
- Use <h2> for main sections, <h3> for subsections
- Use <p> for paragraphs, <ul><li> for lists
- Add id attributes to h2 tags matching outline (e.g. <h2 id="section-1">)
- Do NOT include <html>, <head>, <body> tags
- Do NOT include the title as H1
- Write at least 5-6 substantial sections with multiple paragraphs each
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
    )

    raw = json.loads(response.choices[0].message.content)
    slug = slugify(raw.get("slug", topic))
    date = datetime.utcnow().strftime("%Y-%m-%d")
    content_html = raw.get("content_html", "")

    print("🔗 Adding internal links...")
    content_html = add_internal_links(
        slug=slug,
        title=raw.get("title", topic),
        content_html=content_html,
        lang=lang,
        max_links=4,
    )

    return {
        "slug": slug,
        "lang": lang,
        "title": raw.get("title", topic),
        "meta_description": raw.get("meta_description", ""),
        "category": raw.get("category", category),
        "date": date,
        "content_html": content_html,
        "outline": raw.get("outline", []),
        "tags": raw.get("tags", []),
        "image_url": f"/blog_images/{slug}/header.png",
        "image_prompt": raw.get("image_prompt", ""),
    }


def generate_blog_image(slug: str, image_prompt: str) -> str | None:
    full_prompt = (
        f"Clean minimal illustration for an immigration blog article. "
        f"{image_prompt}. "
        f"Style: clean, modern, minimal flat illustration. "
        f"Soft professional colors. No text, no letters, no words in the image. "
        f"White or light background. Suitable for a blog header."
    )

    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=full_prompt,
            size="1792x1024",
            quality="standard",
            n=1,
        )

        image_url = response.data[0].url
        slug_image_dir = os.path.join(IMAGE_DIR, slug)
        os.makedirs(slug_image_dir, exist_ok=True)
        image_path = os.path.join(slug_image_dir, "header.png")

        with httpx.Client() as http:
            img_response = http.get(image_url, timeout=30)
            with open(image_path, "wb") as f:
                f.write(img_response.content)

        return f"/blog_images/{slug}/header.png"

    except Exception as e:
        print(f"⚠️ Image generation failed: {e}")
        return None


if __name__ == "__main__":
    print("🔄 Generating test post...")
    result = generate_blog_post(
        topic="ویزای تحصیلی کانادا",
        keyword="ویزای تحصیلی کانادا",
        category="Canada",
        tone="professional and encouraging",
        extra_context="Canada requires IELTS 6.5+. Processing time 8-12 weeks. Budget CAD 10,000/year.",
    )
    print(f"\n✅ Title: {result['title']}")
    print(f"Sections: {len(result['outline'])}")
    print(f"Content length: {len(result['content_html'])} chars")