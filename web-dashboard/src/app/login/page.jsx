"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthContext } from "../../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { employee, loading: authLoading, login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && employee) {
      router.replace("/dashboard");
    }
  }, [authLoading, employee, router]);

  const handleLogin = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Enter your email address and password.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await login(normalizedEmail, password);
      router.replace("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Invalid email or password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || employee) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard} role="status" aria-live="polite">
          Loading ShiftStack...
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.layout}>
        <aside style={styles.heroPanel}>
          <div>
            <p style={styles.eyebrow}>Workforce Management</p>

            <h1 style={styles.heroTitle}>
              Time tracking built for clear, reliable operations.
            </h1>

            <p style={styles.heroText}>
              Clock shifts, review employee activity, and manage weekly reports
              from one secure workspace.
            </p>
          </div>

          <div style={styles.featureList}>
            <FeatureItem text="Secure role-based access" />
            <FeatureItem text="Employee clock-in and clock-out tracking" />
            <FeatureItem text="Weekly reports and audit visibility" />
          </div>

          <p style={styles.heroFooter}>
            ShiftStack employee management platform
          </p>
        </aside>

        <section style={styles.card}>
          <div style={styles.brandBlock}>
            <div style={styles.logoMark} aria-hidden="true">
              SS
            </div>

            <div>
              <p style={styles.brandName}>ShiftStack</p>
              <p style={styles.brandCaption}>Secure account access</p>
            </div>
          </div>

          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Welcome back</h2>

            <p style={styles.formSubtitle}>
              Sign in to continue to your dashboard.
            </p>
          </div>

          {error && (
            <div style={styles.errorBox} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>
            <label style={styles.field}>
              <span style={styles.label}>Email Address</span>

              <input
                style={styles.input}
                id="email"
                name="email"
                type="email"
                value={email}
                autoComplete="username"
                inputMode="email"
                placeholder="name@example.com"
                onChange={(event) => setEmail(event.target.value)}
                disabled={submitting}
                required
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Password</span>

              <div style={styles.passwordWrapper}>
                <input
                  style={styles.passwordInput}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={submitting}
                  required
                />

                <button
                  type="button"
                  style={styles.passwordToggle}
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={submitting}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button
              type="submit"
              style={{
                ...styles.button,
                ...(submitting ? styles.disabledButton : {}),
              }}
              disabled={submitting}
            >
              {submitting ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div style={styles.securityNote}>
            <span style={styles.securityIcon} aria-hidden="true">
              ✓
            </span>

            <p style={styles.securityText}>
              Your session is protected and access is based on your assigned
              employee role.
            </p>
          </div>

          <p style={styles.footerText}>
            Need account access? Contact your ShiftStack administrator.
          </p>
        </section>
      </section>
    </main>
  );
}

function FeatureItem({ text }) {
  return (
    <div style={styles.featureItem}>
      <span style={styles.featureIcon} aria-hidden="true">
        ✓
      </span>

      <span>{text}</span>
    </div>
  );
}

const styles = {
  loadingPage: {
    minHeight: "100vh",
    backgroundColor: "#EAF3FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },

  loadingCard: {
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    border: "1px solid #DCEBFF",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    padding: "24px",
    fontWeight: "bold",
    textAlign: "center",
  },

  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #EAF3FF 0%, #F8FBFF 52%, #EEF6FF 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },

  layout: {
    width: "100%",
    maxWidth: "1080px",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(360px, 0.9fr)",
    backgroundColor: "#FFFFFF",
    borderRadius: "28px",
    overflow: "hidden",
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.16)",
    border: "1px solid #DCEBFF",
  },

  heroPanel: {
    minHeight: "650px",
    background:
      "linear-gradient(145deg, #0A4DA2 0%, #123B74 55%, #172554 100%)",
    color: "#FFFFFF",
    padding: "52px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "40px",
  },

  eyebrow: {
    color: "#BFDBFE",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    margin: "0 0 16px",
  },

  heroTitle: {
    maxWidth: "540px",
    fontSize: "clamp(34px, 5vw, 52px)",
    lineHeight: 1.08,
    letterSpacing: "-0.04em",
    margin: "0 0 20px",
  },

  heroText: {
    maxWidth: "520px",
    color: "#DBEAFE",
    fontSize: "17px",
    lineHeight: 1.7,
    margin: 0,
  },

  featureList: {
    display: "grid",
    gap: "16px",
  },

  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#EFF6FF",
    fontSize: "15px",
  },

  featureIcon: {
    width: "26px",
    height: "26px",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "bold",
  },

  heroFooter: {
    color: "#BFDBFE",
    fontSize: "13px",
    margin: 0,
  },

  card: {
    padding: "48px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  brandBlock: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "36px",
  },

  logoMark: {
    width: "46px",
    height: "46px",
    display: "grid",
    placeItems: "center",
    borderRadius: "14px",
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: "-0.03em",
  },

  brandName: {
    color: "#172033",
    fontSize: "20px",
    fontWeight: "800",
    margin: 0,
  },

  brandCaption: {
    color: "#64748B",
    fontSize: "13px",
    margin: "3px 0 0",
  },

  formHeader: {
    marginBottom: "24px",
  },

  formTitle: {
    color: "#172033",
    fontSize: "32px",
    letterSpacing: "-0.03em",
    margin: "0 0 8px",
  },

  formSubtitle: {
    color: "#64748B",
    fontSize: "15px",
    margin: 0,
  },

  errorBox: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FCA5A5",
    padding: "13px 14px",
    borderRadius: "12px",
    marginBottom: "20px",
    fontWeight: "600",
    lineHeight: 1.5,
  },

  field: {
    display: "grid",
    gap: "8px",
    marginBottom: "18px",
  },

  label: {
    color: "#111827",
    fontWeight: "700",
    fontSize: "14px",
  },

  input: {
    width: "100%",
    minHeight: "48px",
    border: "1px solid #CBD5E1",
    borderRadius: "12px",
    padding: "13px 14px",
    fontSize: "15px",
    outline: "none",
    backgroundColor: "#FFFFFF",
  },

  passwordWrapper: {
    position: "relative",
  },

  passwordInput: {
    width: "100%",
    minHeight: "48px",
    border: "1px solid #CBD5E1",
    borderRadius: "12px",
    padding: "13px 72px 13px 14px",
    fontSize: "15px",
    outline: "none",
    backgroundColor: "#FFFFFF",
  },

  passwordToggle: {
    position: "absolute",
    top: "50%",
    right: "12px",
    transform: "translateY(-50%)",
    border: "none",
    backgroundColor: "transparent",
    color: "#0A4DA2",
    fontWeight: "700",
    cursor: "pointer",
    padding: "6px",
  },

  button: {
    width: "100%",
    minHeight: "50px",
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    border: "none",
    padding: "14px",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
    marginTop: "4px",
  },

  disabledButton: {
    cursor: "not-allowed",
    opacity: 0.65,
  },

  securityNote: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    backgroundColor: "#EFF6FF",
    border: "1px solid #BFDBFE",
    borderRadius: "12px",
    padding: "13px",
    marginTop: "22px",
  },

  securityIcon: {
    width: "22px",
    height: "22px",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    borderRadius: "50%",
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
    fontSize: "12px",
    fontWeight: "bold",
  },

  securityText: {
    color: "#1E3A8A",
    fontSize: "13px",
    lineHeight: 1.5,
    margin: 0,
  },

  footerText: {
    textAlign: "center",
    margin: "22px 0 0",
    color: "#64748B",
    fontSize: "13px",
    lineHeight: 1.5,
  },
};
