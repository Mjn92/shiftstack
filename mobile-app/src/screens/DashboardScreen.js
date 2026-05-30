import React, { useContext } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { AuthContext } from "../context/AuthContext";

const DashboardScreen = ({ navigation }) => {
  const { employee, logout } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {employee?.first_name}</Text>
      <Text style={styles.subtitle}>Role: {employee?.role}</Text>

      <View style={styles.button}>
        <Button
          title="Clock In / Clock Out"
          onPress={() => navigation.navigate("Clock")}
        />
      </View>

      <View style={styles.button}>
        <Button
          title="My Time History"
          onPress={() => navigation.navigate("TimeHistory")}
        />
      </View>

      <View style={styles.button}>
        <Button title="Logout" onPress={logout} color="red" />
      </View>
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    marginBottom: 12,
  },
});
