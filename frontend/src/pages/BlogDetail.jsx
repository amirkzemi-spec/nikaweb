import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function BlogDetail() {
  const { slug } = useParams();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [toc, setToc] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const headerImage =
    blog?.images?.header?.png ||
    blog?.images?.header?.svg ||
    blog?.images?.header;

  // -------------------------------------------------------------
  // LOAD BLOG DATA
  // -------------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/blog/${slug}`);

        if (!res.ok) {
          setBlog(null);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setBlog(data);

        setToc(Array.isArray(data.toc) ? data.toc : []);
        setRelated(Array.isArray(data.related) ? data.related : []);
      } catch (err) {
        console.error("Failed to load blog:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug, API_BASE]);

  // -------------------------------------------------------------
  // SMOOTH SCROLLING FOR ANCHOR LINKS
  // -------------------------------------------------------------
  useEffect(() => {
    const handleClick = (e) => {
      const href = e.target.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      e.preventDefault();
      const id = href.replace("#", "");

      const target = document.getElementById(id);
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 100,
          behavior: "smooth",
        });
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // -------------------------------------------------------------
  // SCROLLSPY — Detect active H2/H3
  // -------------------------------------------------------------
  useEffect(() => {
    const headings = document.querySelectorAll("h2, h3");

    const handleScroll = () => {
      let current = null;
      const scrollPos = window.scrollY + 150;

      headings.forEach((h) => {
        if (h.offsetTop <= scrollPos) {
          current = h.id;
        }
      });

      setActiveId(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // -------------------------------------------------------------
  // RENDER STATES
  // -------------------------------------------------------------
  if (loading) {
    return (
      <p className="text-center mt-20 text-gray-600">
        Loading blog...
      </p>
    );
  }

  if (!blog) {
    return (
      <p className="text-center mt-20 text-red-500">
        Blog not found.
      </p>
    );
  }

  // -------------------------------------------------------------
  // PAGE LAYOUT
  // -------------------------------------------------------------
  return (
    <div className="pt-24 max-w-7xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-4 gap-10">

      {/* LEFT SIDEBAR — TABLE OF CONTENTS */}
      <aside className="hidden lg:block sticky top-32 h-fit max-h-[70vh] overflow-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow">
        <h3 className="font-bold mb-3 text-lg">
          Table of Contents
        </h3>

        {toc.length === 0 ? (
          <p className="text-gray-400">
            No sections
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {toc.map((item) => (
              <li
                key={item.id}
                className={
                  item.level === 3 ? "ml-4" : ""
                }
              >
                <a
                  href={`#${item.id}`}
                  className={`
                    block px-2 py-1 rounded transition-all duration-150
                    hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800
                    ${
                      activeId === item.id
                        ? "text-blue-600 font-semibold bg-blue-50 dark:bg-gray-800"
                        : ""
                    }
                  `}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <div className="lg:col-span-2">

        {/* Header Image */}
        {headerImage && (
          <img
            src={`${API_BASE}${headerImage.replace("/blog/images", "/blog_images")}`}
            alt={blog.alt_text?.header || blog.title}
            className="w-full rounded-xl shadow mb-10 object-contain"
          />
        )}

        {/* Blog Title */}
        <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>

        {/* Meta */}
        <div className="text-gray-500 mb-6 text-sm">
          {blog.date} • {blog.category}
        </div>

        {/* Blog HTML */}
        <div
          className={`blog-html prose prose-lg max-w-none
                      prose-headings:font-semibold
                      prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                      prose-p:leading-8 prose-li:leading-8
                      dark:prose-invert`}
          dangerouslySetInnerHTML={{ __html: blog.content_html }}
        />

        {/* Illustrations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {blog.images?.illustrations?.map((src, i) => (
            <img
              key={i}
              src={`${API_BASE}${src.replace("/blog/images", "/blog_images")}`}
              alt={blog.alt_text ? blog.alt_text[`illustration_${i + 1}`] : ""}
              className="w-full rounded-xl shadow"
            />
          ))}
        </div>

        {/* FAQ */}
        {blog.faq && blog.faq.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-4">
              FAQ
            </h2>

            {blog.faq.map((f, i) => (
              <div key={i} className="mb-6">
                <h3 className="font-semibold">{f.question}</h3>
                <p className="text-gray-600 mt-1">{f.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR — RELATED POSTS */}
      <aside className="hidden lg:block sticky top-32 h-fit bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow">
        <h3 className="font-bold mb-3 text-lg">
          Related Posts
        </h3>

        <div className="space-y-3">
          {related.map((r) => (
            <Link
              key={r.slug}
              to={`/blog/${r.slug}`}
              className="block text-blue-600 hover:underline text-sm"
            >
              {r.title}
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
