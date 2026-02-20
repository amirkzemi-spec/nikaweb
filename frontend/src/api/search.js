import axios from "axios";

export const searchPrograms = async (query) => {
  const res = await axios.get(
    `http://127.0.0.1:8000/api/search?q=${encodeURIComponent(query)}`
  );
  return res.data;
};
export const suggestPrograms = async (query) => {
  if (!query.trim()) return { results: [] };
  const res = await axios.get(
    `http://127.0.0.1:8000/api/search?q=${encodeURIComponent(query)}`
  );
  return res.data.results.slice(0, 5); // top 5 suggestions
};
