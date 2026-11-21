import api, { withFallback } from "./api";
import * as demo from "./demo";

const normalize = (d) => ({
  token: d.token || d.access_token,
  user: d.user || { name: d.name, email: d.email },
});

// Expected backend: POST /auth/register  { name, email, password } -> { token, user }
export const registerUser = (data) =>
  withFallback(
    async () => normalize((await api.post("/auth/register", data)).data),
    async () => normalize(await demo.register(data))
  );

// Expected backend: POST /auth/login  { email, password } -> { token, user }
export const loginUser = (data) =>
  withFallback(
    async () => normalize((await api.post("/auth/login", data)).data),
    async () => normalize(await demo.login(data))
  );

// Expected backend: POST /auth/forgot-password  { email } -> { message }
export const forgotPassword = (email) =>
  withFallback(
    async () => (await api.post("/auth/forgot-password", { email })).data,
    () => demo.forgotPassword()
  );
