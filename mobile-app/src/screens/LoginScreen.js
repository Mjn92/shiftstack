import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { AuthContext } from "../context/AuthContext";

const LoginScreen = () => {
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("matthew@shiftstack.com");
  const [password, setPassword] = useState("Password123!");

  const handleLogin = async () => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      await login(cleanEmail, password);
    } catch (err) {
      Alert.alert(
        "Login Failed",
        err?.response?.data?.error || "Invalid email or password",
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>ShiftStack</Text>

        <Text style={styles.subtitle}>Employee Time Tracking Platform</Text>

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>ShiftStack © 2026</Text>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    padding: 24,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  logo: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#0A4DA2",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    marginBottom: 16,
  },

  loginButton: {
    backgroundColor: "#0A4DA2",
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  footer: {
    textAlign: "center",
    marginTop: 24,
    color: "#6B7280",
  },
});
