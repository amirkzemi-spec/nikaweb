// src/pages/Countries.jsx

import { countriesContent } from "../content/countriesContent.js";

export default function Countries() {
  const t = countriesContent;

  return (
    <div className="px-6 py-12 max-w-6xl mx-auto">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-4">{t.title}</h1>
      <p className="text-gray-600 mb-10">{t.subtitle}</p>

      {/* Countries Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {t.countries.map((country, index) => (
          <div
            key={index}
            className="p-5 border rounded-xl shadow-sm hover:shadow-md transition bg-white/70 backdrop-blur"
          >
            <h2 className="text-xl font-semibold mb-2">{country.name}</h2>

            <ul className="text-sm text-gray-700 leading-relaxed">
              {country.visas.map((visa, i) => (
                <li key={i}>• {visa}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
