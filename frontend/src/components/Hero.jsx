import { useState } from "react";
import { Link } from "react-router-dom";
import { suggestPrograms } from "../api/search"; // make sure suggestPrograms exists

export default function Hero({ query, setQuery, handleSearch }) {
  const [suggestions, setSuggestions] = useState([]);

  const handleTyping = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const items = await suggestPrograms(value);
    setSuggestions(items);
  };

  const handleSuggestionClick = (item) => {
    setQuery(item.visa);
    setSuggestions([]);
  };

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-brand-50 to-white pt-24 pb-32 px-6">

      {/* 3D GLOBE BACKGROUND */}
      <div className="absolute inset-0 -z-10 flex justify-center items-center pointer-events-none opacity-30">
        <svg className="w-[650px] h-[650px] animate-spin-slow" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="47" stroke="#60a5fa" strokeWidth="0.4" strokeDasharray="2 3" />
          <circle cx="50" cy="50" r="37" stroke="#3b82f6" strokeWidth="0.4" strokeDasharray="1 4" className="animate-reverse-spin" />
          <circle cx="50" cy="50" r="27" stroke="#2563eb" strokeWidth="0.4" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* PARTICLES */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-brand-400 rounded-full animate-particle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto text-center">

        {/* TITLE */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight animate-slideUp">
          Your AI-Powered Migration and Visa Advisor
        </h1>

        {/* SUBTITLE */}
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto animate-fadeIn">
          Instant, accurate, personalized visa guidance for students & founders.
        </p>

        {/* SEARCH BOX */}
        <form
          onSubmit={handleSearch}
          className="mt-10 max-w-xl mx-auto relative animate-scaleIn"
        >
          <input
            type="text"
            placeholder="Search country, visa or program..."
            className="w-full py-4 px-6 rounded-2xl border border-gray-300 shadow-soft focus:outline-brand-500 text-gray-700"
            value={query}
            onChange={handleTyping}
          />

          <button
            type="submit"
            className="absolute top-1/2 -translate-y-1/2 left-3 bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition"
          >
            Search
          </button>

          {/* AUTO-SUGGEST DROPDOWN */}
          {suggestions.length > 0 && (
            <div className="absolute top-full mt-3 w-full bg-white shadow-lg rounded-xl border z-30 text-left p-2">
              {suggestions.map((item, i) => (
                <div
                  key={i}
                  onClick={() => handleSuggestionClick(item)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded flex justify-between"
                >
                  <span className="font-medium text-brand-700">{item.visa}</span>
                  <span className="text-gray-500 text-sm">{item.country}</span>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* CTA BUTTONS */}
        <div className="mt-10 flex justify-center gap-4 animate-scaleIn">
          <Link
            to="/assessment"
            className="px-8 py-3 bg-brand-600 text-white rounded-lg text-lg shadow-medium hover:bg-brand-700 transition"
          >
            Start Visa Assessment
          </Link>

          <Link
            to="/chat"
            className="px-8 py-3 border-2 border-brand-600 text-brand-600 rounded-lg text-lg hover:bg-brand-50 transition"
          >
            Talk to AI Assistant
          </Link>
        </div>

        {/* TRUST BADGES */}
        <div className="mt-16 flex flex-wrap justify-center gap-6 opacity-80">
          <img src="https://flagcdn.com/w40/ca.png" className="h-10" alt="Canada" />
          <img src="https://flagcdn.com/w40/nl.png" className="h-10" alt="Netherlands" />
          <img src="https://flagcdn.com/w40/de.png" className="h-10" alt="Germany" />
          <img src="https://flagcdn.com/w40/se.png" className="h-10" alt="Sweden" />
          <img src="https://flagcdn.com/w40/fi.png" className="h-10" alt="Finland" />
          <img src="https://flagcdn.com/w40/au.png" className="h-10" alt="Australia" />
        </div>
      </div>

      {/* BLUE GLOW */}
      <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-brand-300 opacity-25 blur-3xl rounded-full"></div>
    </section>
  );
}
