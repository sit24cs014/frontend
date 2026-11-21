import { createContext, useContext, useState, useCallback } from "react";
import * as auth from "../services/authService";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("erevive_user"));
    } catch {
      return null;
    }
  });

  const persist = ({ token, user }) => {
    if (token) localStorage.setItem("erevive_token", token);
    localStorage.setItem("erevive_user", JSON.stringify(user));
    setUser(user);
  };

  const login = useCallback(async (data) => persist(await auth.loginUser(data)), []);
  const register = useCallback(async (data) => persist(await auth.registerUser(data)), []);
  const logout = useCallback(() => {
    localStorage.removeItem("erevive_token");
    localStorage.removeItem("erevive_user");
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}
