const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const runAssessment = async (payload) => {
  const res = await fetch(`${API_BASE}/api/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
};
