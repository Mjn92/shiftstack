import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import api from "../api/api";

const ClockScreen = () => {
  const [clockedIn, setClockedIn] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    try {
      const response = await api.get("/time/status");
      setClockedIn(response.data.clocked_in);
      setCurrentEntry(response.data.current_entry);
    } catch (err) {
      Alert.alert("Error", "Could not load clock status");
    }
  };

  const refreshStatusWithDelay = () => {
    setTimeout(() => {
      loadStatus();
    }, 800);
  };

  const handleClockIn = async () => {
    try {
      setLoading(true);

      await api.post("/time/clock-in");

      setClockedIn(true);
      setCurrentEntry({
        clock_in: new Date().toISOString(),
      });

      refreshStatusWithDelay();
    } catch (err) {
      Alert.alert("Clock In Failed", err.response?.data?.error || "Error");
      await loadStatus();
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);

      await api.post("/time/clock-out");

      setClockedIn(false);
      setCurrentEntry(null);

      refreshStatusWithDelay();
    } catch (err) {
      Alert.alert("Clock Out Failed", err.response?.data?.error || "Error");
      await loadStatus();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>ShiftStack</Text>
        <Text style={styles.subtitle}>Clock In / Clock Out</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.cardLabel}>Current Status</Text>

        <Text
          style={[
            styles.statusText,
            clockedIn ? styles.clockedIn : styles.clockedOut,
          ]}
        >
          {clockedIn ? "Clocked In" : "Clocked Out"}
        </Text>

        {currentEntry ? (
          <Text style={styles.detailText}>
            Clocked in at: {new Date(currentEntry.clock_in).toLocaleString()}
          </Text>
        ) : (
          <Text style={styles.detailText}>No active shift started.</Text>
        )}
      </View>

      <View style={styles.actionCard}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (clockedIn || loading) && styles.disabledButton,
          ]}
          onPress={handleClockIn}
          disabled={clockedIn || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Processing..." : "Clock In"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.dangerButton,
            (!clockedIn || loading) && styles.disabledButton,
          ]}
          onPress={handleClockOut}
          disabled={!clockedIn || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Processing..." : "Clock Out"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ClockScreen;

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

  subtitle: {
    marginTop: 8,
    fontSize: 18,
    color: "#6B7280",
  },

  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  cardLabel: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 10,
  },

  statusText: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 12,
  },

  clockedIn: {
    color: "#16A34A",
  },

  clockedOut: {
    color: "#DC2626",
  },

  detailText: {
    fontSize: 15,
    color: "#374151",
    textAlign: "center",
  },

  actionCard: {
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

  primaryButton: {
    backgroundColor: "#0A4DA2",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 14,
  },

  dangerButton: {
    backgroundColor: "#DC2626",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#9CA3AF",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
