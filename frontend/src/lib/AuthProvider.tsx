import React, { useState } from "react";
import { AuthContext } from "./AuthContext";
import { isTokenExpired } from "./jwt";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  //we are using localStorage for this project, but for real one we will use an http-only cookie I think
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem("token");
    return isTokenExpired(stored) ? null : stored;
  });

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  //we could perhaps memoize this, not a big deal for this project I think
  const isAuthenticated = !!token && !isTokenExpired(token);

  return <AuthContext.Provider value={{ token, login, logout, isAuthenticated }}>{children}</AuthContext.Provider>;
}
