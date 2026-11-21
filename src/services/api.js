import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  timeout: 60000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("erevive_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Log the user out if the token is rejected
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes("/auth/")) {
      localStorage.removeItem("erevive_token");
      localStorage.removeItem("erevive_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

const ALLOW_DEMO = import.meta.env.VITE_DEMO_FALLBACK !== "false";

/**
 * Try the real backend first. If the server cannot be reached at all
 * (no HTTP response), fall back to the clearly labelled DEMO MODE.
 * Real server errors (400, 401, 500...) are never hidden by demo mode.
 */
export async function withFallback(realCall, demoCall) {
  try {
    return await realCall();
  } catch (e) {
    if (!e.response && ALLOW_DEMO) {
      sessionStorage.setItem("erevive_demo", "1");
      window.dispatchEvent(new Event("erevive-demo"));
      return demoCall();
    }
    throw e;
  }
}

export default api;
