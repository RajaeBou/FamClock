import axios from "axios";

const rawBaseUrl =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const normalizedBaseUrl = rawBaseUrl.endsWith("/api")
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/$/, "")}/api`;

const api = axios.create({
  baseURL: normalizedBaseUrl,
});

export default api;