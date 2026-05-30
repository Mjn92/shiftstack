import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import api from "../api/api";

const TimeHistoryScreen = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = async () => {
    try {
      const response = await api.get("/time/my-entries");
      setEntries(response.data);
    } catch (err) {
      console.error("Error loading entries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Time History</Text>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text>No time entries found.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>Status: {item.status}</Text>
            <Text>Clock In: {new Date(item.clock_in).toLocaleString()}</Text>
            <Text>
              Clock Out:{" "}
              {item.clock_out
                ? new Date(item.clock_out).toLocaleString()
                : "Still clocked in"}
            </Text>
            <Text>
              Total Minutes:{" "}
              {item.total_minutes !== null ? item.total_minutes : "Pending"}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

export default TimeHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
});
