"use client";

import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const cleanEmail = email.trim().toLowerCase();
      const data = await login(cleanEmail, password);

      if (data.employee.role !== "admin" && data.employee.role !== "manager") {
        setError("Only admins and managers can access this dashboard.");
        return;
      }

      router.push("/dashboard");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.brandBlock}>
          <h1 style={styles.logo}>ShiftStack</h1>
          <p style={styles.subtitle}>Admin Dashboard Login</p>
        </div>

        {error && <p style={styles.errorBox}>{error}</p>}

        <form onSubmit={handleLogin}>
          <label style={styles.label}>Email Address</label>
          <input
            style={styles.input}
            id="email"
            name="email"
            type="email"
            value={email}
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            id="password"
            name="password"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={styles.button}>Sign In</button>
        </form>

        <p style={styles.footerText}>
          Secure access for managers and administrators.
        </p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#EAF3FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },

  card: {
    width: "100%",
    maxWidth: "430px",
    background: "#FFFFFF",
    borderRadius: "22px",
    padding: "36px",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.18)",
    border: "1px solid #DCEBFF",
  },

  brandBlock: {
    textAlign: "center",
    marginBottom: "28px",
  },

  logo: {
    margin: 0,
    fontSize: "38px",
    fontWeight: "800",
    color: "#0A4DA2",
    letterSpacing: "-0.5px",
  },

  subtitle: {
    marginTop: "8px",
    color: "#6B7280",
    fontSize: "16px",
  },

  errorBox: {
    background: "#FEE2E2",
    color: "#991B1B",
    padding: "12px 14px",
    borderRadius: "10px",
    marginBottom: "20px",
    fontWeight: "600",
  },

  label: {
    display: "block",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "8px",
  },

  input: {
    width: "100%",
    border: "1px solid #D1D5DB",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "18px",
    fontSize: "15px",
    outline: "none",
    background: "#F9FAFB",
  },

  button: {
    width: "100%",
    background: "#0A4DA2",
    color: "#FFFFFF",
    border: "none",
    padding: "15px",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
    marginTop: "6px",
  },

  footerText: {
    textAlign: "center",
    marginTop: "22px",
    color: "#6B7280",
    fontSize: "14px",
  },
};
