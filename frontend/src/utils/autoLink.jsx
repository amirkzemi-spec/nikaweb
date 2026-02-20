export function autoLink(html, allBlogs, currentSlug) {
  let linkedHtml = html;

  for (const b of allBlogs) {
    if (b.slug === currentSlug) continue;

    const keyword = b.title;

    if (!keyword) continue;

    const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(`\\b${safeKeyword}\\b`, "gi");

    linkedHtml = linkedHtml.replace(
      regex,
      `<a href="/blog/${b.slug}" class="text-blue-600 underline">${keyword}</a>`
    );
  }

  return linkedHtml;
}
