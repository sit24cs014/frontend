import api, { API_ENDPOINTS } from "./api";

const normalize = (d) => ({
  token: d.token || d.access_token,
  user: d.user || { name: d.name, email: d.email },
});

// Expected backend: POST /auth/register  { name, email, password } -> { token, user }
export const registerUser = async (data) =>
  normalize((await api.post(API_ENDPOINTS.register, data)).data);

// Expected backend: POST /auth/login  { email, password } -> { token, user }
export const loginUser = async (data) =>
  normalize((await api.post(API_ENDPOINTS.login, data)).data);

// Expected backend: POST /auth/forgot-password  { email } -> { message }
export const forgotPassword = async (email) =>
  (await api.post(API_ENDPOINTS.forgotPassword, { email })).data;
