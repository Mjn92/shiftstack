import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
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

  const handleClockIn = async () => {
    try {
      setLoading(true);
      await api.post("/time/clock-in");
      Alert.alert("Success", "Clock-in request accepted");
      await loadStatus();
    } catch (err) {
      Alert.alert("Clock In Failed", err.response?.data?.error || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      await api.post("/time/clock-out");
      Alert.alert("Success", "Clock-out request accepted");
      await loadStatus();
    } catch (err) {
      Alert.alert("Clock Out Failed", err.response?.data?.error || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clock In / Clock Out</Text>

      <Text style={styles.status}>
        Status: {clockedIn ? "Clocked In" : "Clocked Out"}
      </Text>

      {currentEntry && (
        <Text style={styles.detail}>
          Clocked in at: {new Date(currentEntry.clock_in).toLocaleString()}
        </Text>
      )}

      <View style={styles.button}>
        <Button
          title="Clock In"
          onPress={handleClockIn}
          disabled={clockedIn || loading}
        />
      </View>

      <View style={styles.button}>
        <Button
          title="Clock Out"
          onPress={handleClockOut}
          disabled={!clockedIn || loading}
          color="red"
        />
      </View>
    </View>
  );
};

export default ClockScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  status: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  detail: {
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    marginBottom: 12,
  },
});
