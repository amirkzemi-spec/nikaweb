import { useLocation, Link } from "react-router-dom";

export default function SearchResults() {
  const { state } = useLocation();
  const { results = [], query = "" } = state || {};

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">

      <h1 className="text-2xl font-bold mb-6">
        {`Search results for "${query}"`}
      </h1>

      {results.length === 0 && (
        <p className="text-gray-500">
          No results found.
        </p>
      )}

      <div className="grid gap-4">
        {results.map((item) => (
          <Link
            key={item.id}
            to={`/visa/${item.id}`}
            state={{ item }}
            className="border p-5 rounded-xl bg-white shadow hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold">{item.visa}</h2>
            <p className="text-brand-600 font-medium">{item.country}</p>
            <p className="text-gray-600 mt-2 line-clamp-2">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
