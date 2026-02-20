import { visasContent } from "../content/visasContent";

export default function Visas() {
  const t = visasContent;

  return (
    <div className="px-6 py-12 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{t.title}</h1>
      <p className="text-gray-600 mb-10">{t.subtitle}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {t.categories.map((item, i) => (
          <div
            key={i}
            className="p-6 rounded-xl shadow-sm border bg-white/70 backdrop-blur hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold mb-2">{item.type}</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
