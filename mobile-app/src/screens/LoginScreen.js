import React, { useContext, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { AuthContext } from "../context/AuthContext";

const LoginScreen = () => {
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("matthew@shiftstack.com");
  const [password, setPassword] = useState("Password123!");

  const handleLogin = async () => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      console.log("Attempting login:", {
        email: cleanEmail,
        password,
      });

      await login(cleanEmail, password);
    } catch (err) {
      console.log("Login Error:", err?.response?.data || err);

      Alert.alert(
        "Login Failed",
        err?.response?.data?.error || "Invalid email or password",
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ShiftStack</Text>
      <Text style={styles.subtitle}>Employee Time Tracking</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
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

      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
});
