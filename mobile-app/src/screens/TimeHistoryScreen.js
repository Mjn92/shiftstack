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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A4DA2" />
        <Text style={styles.loadingText}>Loading time history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>ShiftStack</Text>
        <Text style={styles.subtitle}>My Time History</Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={
          entries.length === 0 ? styles.emptyContainer : null
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No time entries found.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text
                style={[
                  styles.status,
                  item.status === "open"
                    ? styles.statusOpen
                    : styles.statusClosed,
                ]}
              >
                {item.status.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.label}>Clock In</Text>
            <Text style={styles.value}>
              {new Date(item.clock_in).toLocaleString()}
            </Text>

            <Text style={styles.label}>Clock Out</Text>
            <Text style={styles.value}>
              {item.clock_out
                ? new Date(item.clock_out).toLocaleString()
                : "Still Clocked In"}
            </Text>

            <Text style={styles.label}>Total Minutes</Text>
            <Text style={styles.value}>
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
    backgroundColor: "#EAF3FF",
    padding: 24,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EAF3FF",
  },

  loadingText: {
    marginTop: 12,
    color: "#6B7280",
  },

  header: {
    marginTop: 40,
    marginBottom: 24,
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

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  cardHeader: {
    marginBottom: 12,
  },

  status: {
    fontWeight: "bold",
    fontSize: 14,
  },

  statusOpen: {
    color: "#16A34A",
  },

  statusClosed: {
    color: "#0A4DA2",
  },

  label: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 8,
  },

  value: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
});
