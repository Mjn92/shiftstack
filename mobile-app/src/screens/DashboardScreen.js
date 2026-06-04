import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AuthContext } from "../context/AuthContext";

const DashboardScreen = ({ navigation }) => {
  const { employee, logout } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>ShiftStack</Text>

        <Text style={styles.welcome}>Welcome, {employee?.first_name}</Text>

        <Text style={styles.role}>{employee?.role?.toUpperCase()}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Time Tracking</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("Clock")}
        >
          <Text style={styles.buttonText}>Clock In / Clock Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("TimeHistory")}
        >
          <Text style={styles.buttonText}>My Time History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Status</Text>
        <Text style={styles.summaryText}>Ready to clock in</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF3FF",
    padding: 24,
  },

  header: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: "center",
  },

  logo: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#0A4DA2",
  },

  welcome: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: "600",
    color: "#111827",
  },

  role: {
    marginTop: 6,
    color: "#6B7280",
    fontSize: 14,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#111827",
  },

  primaryButton: {
    backgroundColor: "#0A4DA2",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  secondaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#111827",
  },

  summaryText: {
    fontSize: 16,
    color: "#6B7280",
  },

  logoutButton: {
    marginTop: 20,
    backgroundColor: "#DC2626",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  logoutText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
