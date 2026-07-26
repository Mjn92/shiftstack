"use client";

import { Component } from "react";

export default class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard Error:", error);
    console.error("Component Stack:", errorInfo.componentStack);
  }

  handleReload = () => {
    this.setState({
      hasError: false,
      error: null,
    });

    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main style={styles.page}>
          <section style={styles.card} role="alert">
            <h1 style={styles.title}>Dashboard Unavailable</h1>

            <p style={styles.text}>
              ShiftStack encountered an unexpected problem while loading your
              dashboard.
            </p>

            <button
              type="button"
              style={styles.button}
              onClick={this.handleReload}
            >
              Reload Dashboard
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#EAF3FF",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
  },

  card: {
    width: "min(100%, 500px)",
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "32px",
    textAlign: "center",
    border: "1px solid #DCEBFF",
    boxShadow: "0 10px 25px rgba(0,0,0,.08)",
  },

  title: {
    color: "#991B1B",
    marginBottom: "16px",
  },

  text: {
    color: "#6B7280",
    lineHeight: 1.6,
    marginBottom: "24px",
  },

  button: {
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    border: "none",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
