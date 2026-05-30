import React from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, AuthContext } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";

const AppContent = () => {
  return <AppNavigator />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
