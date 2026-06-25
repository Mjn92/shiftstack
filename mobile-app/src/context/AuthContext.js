import React, { createContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import api from "../api/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    await SecureStore.setItemAsync("accessToken", response.data.accessToken);
    await SecureStore.setItemAsync("refreshToken", response.data.refreshToken);

    setEmployee(response.data.employee);

    return response.data;
  };

  const logout = async () => {
    const refreshToken = await SecureStore.getItemAsync("refreshToken");

    try {
      await api.post("/auth/logout", { refreshToken });
    } catch (err) {
      console.error("Logout error:", err);
    }

    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("token");

    setEmployee(null);
  };

  const loadUser = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync("accessToken");

      if (!accessToken) {
        setLoading(false);
        return;
      }

      const response = await api.get("/auth/me");
      setEmployee(response.data);
    } catch (err) {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      await SecureStore.deleteItemAsync("token");
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        employee,
        loading,
        login,
        logout,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
