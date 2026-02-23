"""
Nika Ingest Pipeline
====================
Reads URLs from  ingest/links.txt
Reads PDFs from  ingest/pdfs/
Chunks the text, deduplicates, writes to data/ingested.json,
then rebuilds the FAISS index.

Usage (from project root):
    python -m backend.ingest.ingest
"""

import os
import sys
import json
import hashlib

# ── Paths ──────────────────────────────────────────────────────────────────
INGEST_DIR  = os.path.dirname(__file__)
BACKEND_DIR = os.path.dirname(INGEST_DIR)
PROJECT_DIR = os.path.dirname(BACKEND_DIR)

LINKS_FILE  = os.path.join(INGEST_DIR, "links.txt")
PDF_DIR     = os.path.join(INGEST_DIR, "pdfs")
LOG_FILE    = os.path.join(INGEST_DIR, "ingested_log.json")   # tracks what's been processed
OUTPUT_FILE = os.path.join(BACKEND_DIR, "data", "ingested.json")

CHUNK_TARGET = 400   # target words per chunk
CHUNK_MAX    = 600   # hard max before a paragraph gets force-split

# ── Helpers ────────────────────────────────────────────────────────────────

def source_id(text: str) -> str:
    """Short stable hash used as a dedup key."""
    return hashlib.md5(text.encode()).hexdigest()[:12]

def chunk_text(text: str, title: str, source: str) -> list:
    """
    Split on paragraph boundaries, merging short paragraphs up to CHUNK_TARGET
    words and force-splitting paragraphs that exceed CHUNK_MAX words.
    This keeps bullet lists and numbered steps intact.
    """
    import re
    # Normalise line endings, then split on blank lines
    paragraphs = re.split(r"\n{2,}", text.replace("\r\n", "\n").strip())
    paragraphs = [p.strip() for p in paragraphs if p.strip()]

    # Force-split any single paragraph that is too long (e.g. a wall of text)
    split_paras = []
    for para in paragraphs:
        words = para.split()
        if len(words) <= CHUNK_MAX:
            split_paras.append(para)
        else:
            # Split by sentence boundaries
            sentences = re.split(r"(?<=[.!?])\s+", para)
            bucket = []
            for sent in sentences:
                bucket.append(sent)
                if len(" ".join(bucket).split()) >= CHUNK_TARGET:
                    split_paras.append(" ".join(bucket))
                    bucket = []
            if bucket:
                split_paras.append(" ".join(bucket))

    # Merge small paragraphs into chunks up to CHUNK_TARGET words
    chunks   = []
    bucket   = []
    wcount   = 0

    def flush(bucket, part_num):
        text_out = "\n\n".join(bucket).strip()
        if text_out:
            chunks.append({
                "title":       f"{title} (part {part_num})" if part_num > 1 else title,
                "description": text_out,
                "source":      source,
            })

    part = 1
    for para in split_paras:
        pwords = len(para.split())
        if wcount + pwords > CHUNK_TARGET and bucket:
            flush(bucket, part)
            part += 1
            bucket, wcount = [], 0
        bucket.append(para)
        wcount += pwords

    if bucket:
        flush(bucket, part)

    return chunks

def load_json(path: str, default):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default

def save_json(path: str, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# ── Scrapers ───────────────────────────────────────────────────────────────

def scrape_url(url: str):
    try:
        import requests
        from bs4 import BeautifulSoup
    except ImportError:
        print("  ! Install dependencies:  pip install requests beautifulsoup4")
        return None, None

    try:
        r = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        title = soup.title.string.strip() if soup.title else url
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)
        return title, text
    except Exception as e:
        print(f"  ✗ Failed: {url}  ({e})")
        return None, None

def extract_pdf(path: str):
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("  ! Install dependency:  pip install pymupdf")
        return None, None

    try:
        doc   = fitz.open(path)
        text  = "".join(page.get_text() for page in doc)
        title = (
            os.path.splitext(os.path.basename(path))[0]
            .replace("-", " ").replace("_", " ").title()
        )
        return title, text
    except Exception as e:
        print(f"  ✗ Failed: {path}  ({e})")
        return None, None

# ── Main ───────────────────────────────────────────────────────────────────

def main():
    log      = load_json(LOG_FILE, {})
    existing = load_json(OUTPUT_FILE, [])
    new_chunks: list = []

    # ── URLs ────────────────────────────────────────────────────────────────
    if os.path.exists(LINKS_FILE):
        raw_lines = open(LINKS_FILE, encoding="utf-8").readlines()
        lines = [
            l.strip() for l in raw_lines
            if l.strip() and not l.strip().startswith("#")
        ]
        print(f"\nLinks ({len(lines)} URLs in links.txt)")
        for line in lines:
            url, custom_title = (
                [x.strip() for x in line.split("|", 1)]
                if "|" in line else [line, None]
            )
            sid = source_id(url)
            if sid in log:
                print(f"  ↩  Already ingested: {url}")
                continue

            print(f"  →  Scraping: {url}")
            title, text = scrape_url(url)
            if not text:
                continue
            if custom_title:
                title = custom_title

            chunks = chunk_text(text, title, url)
            new_chunks.extend(chunks)
            log[sid] = {"source": url, "title": title, "chunks": len(chunks)}
            print(f"     ✓  {len(chunks)} chunk(s) — {title}")

    # ── PDFs ────────────────────────────────────────────────────────────────
    if os.path.exists(PDF_DIR):
        pdfs = [
            f for f in os.listdir(PDF_DIR)
            if f.lower().endswith(".pdf")
        ]
        print(f"\nPDFs ({len(pdfs)} files in ingest/pdfs/)")
        for filename in pdfs:
            path = os.path.join(PDF_DIR, filename)
            sid  = source_id(filename + str(os.path.getmtime(path)))
            if sid in log:
                print(f"  ↩  Already ingested: {filename}")
                continue

            print(f"  →  Extracting: {filename}")
            title, text = extract_pdf(path)
            if not text:
                continue

            chunks = chunk_text(text, title, filename)
            new_chunks.extend(chunks)
            log[sid] = {"source": filename, "title": title, "chunks": len(chunks)}
            print(f"     ✓  {len(chunks)} chunk(s) — {title}")

    # ── Save & rebuild ──────────────────────────────────────────────────────
    if not new_chunks:
        print("\nNothing new to ingest. Add URLs to ingest/links.txt or drop PDFs in ingest/pdfs/")
        return

    updated = existing + new_chunks
    save_json(OUTPUT_FILE, updated)
    save_json(LOG_FILE, log)
    print(f"\nAdded {len(new_chunks)} new chunk(s). Total in ingested.json: {len(updated)}")

    print("\nRebuilding FAISS index...")
    from rag.build_index import build
    build()
    print("Done. Restart the backend to load the new data.\n")


if __name__ == "__main__":
    main()
