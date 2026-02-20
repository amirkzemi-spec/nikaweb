import { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Ask an immigration question and I’ll answer based on our visa database.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/api/search?q=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();
      const results = Array.isArray(data.results) ? data.results : [];

      if (results.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text:
              "I couldn't find a matching program in our database. Try asking with a country or visa type.",
          },
        ]);
        return;
      }

      const top = results[0];
      const summary = `Top match: ${top.visa} (${top.country}). ${top.description || ""}`.trim();
      const list = results
        .slice(0, 5)
        .map((r) => `• ${r.visa} — ${r.country}`)
        .join("\n");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `${summary}\n\nOther matches:\n${list}`,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Something went wrong while searching. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">AI Immigration Assistant</h1>
      <p className="text-gray-600 mb-6">
        Ask about visas, eligibility, or country programs. Answers are grounded
        in our database.
      </p>

      <div className="border rounded-xl p-4 bg-white shadow-soft min-h-[320px]">
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "text-right"
                  : "text-left"
              }
            >
              <div
                className={
                  m.role === "user"
                    ? "inline-block bg-brand-600 text-white px-4 py-2 rounded-2xl max-w-[80%]"
                    : "inline-block bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl max-w-[80%] whitespace-pre-line"
                }
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a visa or immigration question..."
          className="flex-1 border rounded-lg px-4 py-3"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Searching..." : "Send"}
        </button>
      </form>
    </div>
  );
}
