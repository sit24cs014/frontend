import axios from "axios";

export const API_ENDPOINTS = {
  health: "/health",
  register: "/auth/register",
  login: "/auth/login",
  forgotPassword: "/auth/forgot-password",
  dashboard: "/dashboard",
  survey: "/survey",
  analyses: "/analyses",
  pickups: "/pickups",
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("erevive_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes("/auth/")) {
      localStorage.removeItem("erevive_token");
      localStorage.removeItem("erevive_user");
      window.location.href = "/login";
    }
    if (!err.response && !err.message) {
      err.message =
        "Cannot connect to the E:Revive backend. Start Spring Boot at http://localhost:8080 and try again.";
    } else if (!err.response && err.code === "ERR_NETWORK") {
      err.message =
        "Cannot connect to the E:Revive backend. Start Spring Boot at http://localhost:8080 and try again.";
    }
    return Promise.reject(err);
  }
);

export default api;
