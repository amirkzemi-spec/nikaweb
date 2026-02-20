import { useEffect, useState } from "react";

export default function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/blog/list`);
        const data = await res.json();
        setBlogs(data.blogs || []);
      } catch (e) {
        console.error("Failed to load blogs:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading)
    return <p className="text-center mt-20 text-gray-600">Loading…</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-10 text-center">Nika Visa Blog</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {blogs.map((b) => (
          <a
            key={b.slug}
            href={`/blog/${b.slug}`}
            className="p-6 border rounded-xl shadow-sm hover:shadow transition"
          >
            <h2 className="text-xl font-semibold mb-2">{b.title}</h2>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {b.meta_description}
            </p>

            <div className="text-gray-400 text-xs">
              {b.category} • {b.date}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
