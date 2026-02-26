"""
Nika Visa Blog Bot — Step 5: Fixed Preview
"""
import os
import re
import logging
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, ContextTypes
from generator import generate_blog_post, generate_blog_image

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
BOT_SECRET = os.getenv("BOT_SECRET")
BACKEND_URL = os.getenv("BACKEND_URL", "https://api.nikavisa.com")
ADMIN_CHAT_ID = int(os.getenv("ADMIN_CHAT_ID", "0"))

logging.basicConfig(format="%(asctime)s - %(levelname)s - %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)
PENDING_POSTS = {}


def strip_html(html: str) -> str:
    return re.sub(r'<[^>]+>', '', html)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_CHAT_ID:
        await update.message.reply_text("⛔ Unauthorized.")
        return
    await update.message.reply_text(
        "👋 *Nika Blog Bot is running!*\n\n"
        "• `/generate <topic>`\n"
        "• `/generate <topic> | keyword:<kw> | category:<cat> | tone:<tone> | context:<info>`\n"
        "• `/status`\n\n"
        "Example:\n`/generate ویزای تحصیلی کانادا | keyword:ویزای تحصیلی | category:Canada`",
        parse_mode="Markdown"
    )


async def status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_CHAT_ID:
        await update.message.reply_text("⛔ Unauthorized.")
        return
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BACKEND_URL}/", timeout=5)
        await update.message.reply_text("✅ Backend is online." if r.status_code == 200 else f"⚠️ Status {r.status_code}")
    except Exception as e:
        await update.message.reply_text(f"❌ Backend unreachable: {e}")


def parse_generate_args(args):
    full = " ".join(args)
    parts = [p.strip() for p in full.split("|")]
    result = {"topic": parts[0], "keyword": "", "category": "Immigration", "tone": "professional and trustworthy", "extra_context": ""}
    for part in parts[1:]:
        if part.lower().startswith("keyword:"): result["keyword"] = part[8:].strip()
        elif part.lower().startswith("category:"): result["category"] = part[9:].strip()
        elif part.lower().startswith("tone:"): result["tone"] = part[5:].strip()
        elif part.lower().startswith("context:"): result["extra_context"] = part[8:].strip()
    return result


async def generate(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_CHAT_ID:
        await update.message.reply_text("⛔ Unauthorized.")
        return
    if not context.args:
        await update.message.reply_text("⚠️ Usage: `/generate <topic>`", parse_mode="Markdown")
        return

    params = parse_generate_args(context.args)
    topic = params["topic"]

    thinking_msg = await update.message.reply_text(
        f"🔄 Generating: *{topic}*\n_Step 1/2: Writing content..._",
        parse_mode="Markdown"
    )

    try:
        post = generate_blog_post(**params)
        PENDING_POSTS[post["slug"]] = post

        await thinking_msg.edit_text(
            f"🎨 *{topic}*\n_Step 2/2: Generating header image..._",
            parse_mode="Markdown"
        )

        image_url = generate_blog_image(post["slug"], post.get("image_prompt", post["title"]))
        if image_url:
            post["image_url"] = image_url
            PENDING_POSTS[post["slug"]] = post

        # Build clean preview
        outline_text = "\n".join([f"  • {h['text']}" for h in post.get("outline", [])])
        tags_text = " ".join([f"#{t}" for t in post.get("tags", [])])
        content_preview = strip_html(post["content_html"])[:350].strip()
        word_count = len(strip_html(post["content_html"]).split())
        image_status = "✅ Generated" if image_url else "⚠️ Failed (will use default)"

        preview_text = (
            f"📝 *Draft Ready*\n\n"
            f"*Title:* {post['title']}\n"
            f"*Slug:* `{post['slug']}`\n"
            f"*Category:* {post['category']}\n"
            f"*Words:* ~{word_count}\n"
            f"*Meta:* {post['meta_description']}\n\n"
            f"*Outline:*\n{outline_text}\n\n"
            f"*Tags:* {tags_text}\n"
            f"*Image:* {image_status}\n\n"
            f"*Preview:*\n_{content_preview}..._"
        )

        keyboard = InlineKeyboardMarkup([[
            InlineKeyboardButton("✅ Approve & Publish", callback_data=f"approve::{post['slug']}"),
            InlineKeyboardButton("❌ Reject", callback_data=f"reject::{post['slug']}"),
        ]])

        await thinking_msg.delete()

        if image_url:
            local_image_path = os.path.join(os.path.dirname(__file__), "data", "blog", "images", post["slug"], "header.png")
            if os.path.exists(local_image_path):
                with open(local_image_path, "rb") as img_file:
                    await update.message.reply_photo(
                        photo=img_file,
                        caption=preview_text,
                        parse_mode="Markdown",
                        reply_markup=keyboard
                    )
            else:
                await update.message.reply_text(preview_text, parse_mode="Markdown", reply_markup=keyboard)
        else:
            await update.message.reply_text(preview_text, parse_mode="Markdown", reply_markup=keyboard)

    except Exception as e:
        await thinking_msg.edit_text(f"❌ Generation failed: {e}")


async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    action, slug = query.data.split("::")

    if action == "approve":
        post = PENDING_POSTS.get(slug)
        if not post:
            await query.edit_message_caption("⚠️ Post not found. Try generating again.")
            return
        await query.edit_message_caption(f"⏳ Publishing `{slug}`...", parse_mode="Markdown")
        import httpx
        try:
            async with httpx.AsyncClient() as http:
                r = await http.post(
                    f"{BACKEND_URL}/api/blog/create",
                    json=post,
                    headers={"X-Bot-Secret": BOT_SECRET},
                    timeout=10,
                )
            if r.status_code == 200:
                PENDING_POSTS.pop(slug, None)
                await query.edit_message_caption(
                    f"✅ *Published!*\n\n*Slug:* `{slug}`\n*URL:* https://nikavisa.com/blog/{slug}",
                    parse_mode="Markdown"
                )
            else:
                await query.edit_message_caption(f"❌ Publish failed: {r.status_code}\n{r.text}")
        except Exception as e:
            await query.edit_message_caption(f"❌ Publish error: {e}")

    elif action == "reject":
        PENDING_POSTS.pop(slug, None)
        await query.edit_message_caption("❌ Rejected. Send `/generate <topic>` to try again.", parse_mode="Markdown")


def main():
    if not TELEGRAM_BOT_TOKEN: raise ValueError("TELEGRAM_BOT_TOKEN not set")
    if ADMIN_CHAT_ID == 0: raise ValueError("ADMIN_CHAT_ID not set")
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("status", status))
    app.add_handler(CommandHandler("generate", generate))
    app.add_handler(CallbackQueryHandler(button_handler))
    logger.info("🤖 Bot started.")
    app.run_polling()

if __name__ == "__main__":
    main()
