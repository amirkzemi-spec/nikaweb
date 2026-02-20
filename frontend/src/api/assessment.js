import axios from "axios";

export const runAssessment = async (payload) => {
  const res = await axios.post("http://127.0.0.1:8000/api/assess", payload);
  return res.data;
};
