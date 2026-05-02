import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

export default api;