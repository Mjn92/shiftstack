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

    await SecureStore.setItemAsync("token", response.data.token);
    setEmployee(response.data.employee);

    return response.data;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    setEmployee(null);
  };

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get("/auth/me");
      setEmployee(response.data);
    } catch (err) {
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
