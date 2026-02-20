import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // ------------------------------------------------------------
  // LOAD BLOGS
  // ------------------------------------------------------------
  async function load(
    p = page,
    selectedCategory = category,
    search = query
  ) {
    setLoading(true);

    const cat =
      selectedCategory === "All" ? "" : selectedCategory.toLowerCase();

    try {
      const url = `${API_BASE}/api/blog/list?page=${p}&limit=6&category=${cat}&q=${search}`;

      const res = await fetch(url);

      if (!res.ok) {
        console.error("API error:", res.status);
        setBlogs([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log("API /api/blog/list →", data);

      setBlogs(Array.isArray(data.blogs) ? data.blogs : []);
      setPage(data.page || 1);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error("Failed to load blog list:", err);
      setBlogs([]);
    }

    setLoading(false);
  }

  // Initial load + reload when language changes
  useEffect(() => {
    load(1, category, query);
  }, []);

  // ------------------------------------------------------------
  // CATEGORY OPTIONS
  // ------------------------------------------------------------
  const categories = [
    "All",
    "Canada",
    "Netherlands",
    "Germany",
    "Digital Nomad",
    "Startup Visa",
  ];

  const handleCategoryClick = (cat) => {
    setCategory(cat);
    load(1, cat, query);
  };

  // ------------------------------------------------------------
  // SEARCH HANDLER
  // ------------------------------------------------------------
  const handleSearch = (e) => {
    e.preventDefault();
    load(1, category, query);
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  if (loading)
    return (
      <p className="text-center mt-20 text-gray-600 dark:text-gray-300">
        Loading blogs...
      </p>
    );

  if (blogs.length === 0)
    return (
      <p className="text-center mt-20 text-gray-500 dark:text-gray-400">
        No blogs available.
      </p>
    );

  return (
    <div className="pt-24 max-w-6xl mx-auto px-4 pb-32">
      <h1 className="text-3xl font-bold mb-10 text-center">
        Nika Visa Blog
      </h1>

      {/* SEARCH BAR */}
      <form
        onSubmit={handleSearch}
        className="flex justify-center mb-6 gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search blog..."
          className="border px-4 py-2 rounded-lg w-64 dark:bg-gray-900 dark:border-gray-700"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </form>

      {/* CATEGORY FILTER */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`px-4 py-1.5 rounded-full border text-sm transition ${
              category === cat
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-gray-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* BLOG LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {blogs.map((b) => (
          <Link
            key={b.slug}
            to={`/blog/${b.slug}`}
            className="block bg-white dark:bg-gray-900 border border-gray-200 
                     dark:border-gray-700 rounded-xl shadow hover:shadow-xl 
                     hover:-translate-y-1 transition-all duration-300 p-6"
          >
            <h2 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">
              {b.title}
            </h2>

            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {(b.meta_description || "").slice(0, 140)}...
            </p>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              {b.category} • {b.date}
            </div>
          </Link>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center gap-4 mt-12">
        <button
          disabled={page <= 1}
          onClick={() => load(page - 1)}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-40"
        >
          Previous
        </button>

        <span className="px-4 py-2 font-semibold">
          {`Page ${page} of ${totalPages}`}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => load(page + 1)}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
