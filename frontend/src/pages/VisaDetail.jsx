import { useLocation, useParams, Link } from "react-router-dom";

export default function VisaDetail() {
  const { state } = useLocation();
  const { item } = state || {};
  const { id } = useParams();

  if (!item) {
    return (
      <div className="p-10 text-center text-gray-600">
        Visa details not found. Please search again.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">

      <Link
        to="/search-results"
        className="text-brand-600 mb-6 inline-block"
      >
        ← Back
      </Link>

      <h1 className="text-3xl font-bold mb-2">{item.visa}</h1>
      <h2 className="text-xl text-brand-700 mb-6">{item.country}</h2>

      <p className="text-gray-700 mb-6">{item.description}</p>

      {item.keywords && (
        <div className="flex flex-wrap gap-2">
          {item.keywords.map((kw, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
