"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar.jsx";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

export default function ProfilePage() {
  const router = useRouter();
  const { employee, loading, loadUser } = useContext(AuthContext);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    department: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !employee) {
      router.push("/login");
    }

    if (employee) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        first_name: employee.first_name || "",
        last_name: employee.last_name || "",
        phone: employee.phone || "",
        department: employee.department || "",
      });
    }
  }, [loading, employee, router]);

  const handleProfileChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const updateProfile = async (e) => {
    e.preventDefault();

    try {
      setMessage("");
      setError("");

      await api.put("/auth/profile", form);

      setMessage("Profile updated successfully.");

      if (loadUser) {
        await loadUser();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Profile update failed.");
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();

    try {
      setMessage("");
      setError("");

      await api.put("/auth/change-password", passwordForm);

      setPasswordForm({
        current_password: "",
        new_password: "",
      });

      setMessage("Password changed successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Password change failed.");
    }
  };

  if (loading || !employee) {
    return <p style={{ padding: "32px" }}>Loading...</p>;
  }

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.header}>
          <h1 style={styles.title}>My Profile</h1>
          <p style={styles.subtitle}>
            View and manage your ShiftStack account details.
          </p>
        </section>

        {message && <div style={styles.success}>{message}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.grid}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Account Information</h2>

            <p>
              <strong>Email:</strong> {employee.email}
            </p>
            <p>
              <strong>Role:</strong> {employee.role}
            </p>
            <p>
              <strong>Status:</strong> {employee.active ? "Active" : "Inactive"}
            </p>
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Update Profile</h2>

            <form onSubmit={updateProfile}>
              <label style={styles.label}>First Name</label>
              <input
                style={styles.input}
                name="first_name"
                value={form.first_name}
                onChange={handleProfileChange}
              />

              <label style={styles.label}>Last Name</label>
              <input
                style={styles.input}
                name="last_name"
                value={form.last_name}
                onChange={handleProfileChange}
              />

              <label style={styles.label}>Phone</label>
              <input
                style={styles.input}
                name="phone"
                value={form.phone}
                onChange={handleProfileChange}
              />

              <label style={styles.label}>Department</label>
              <input
                style={styles.input}
                name="department"
                value={form.department}
                onChange={handleProfileChange}
              />

              <button style={styles.button} type="submit">
                Save Profile
              </button>
            </form>
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Change Password</h2>

            <form onSubmit={changePassword}>
              <label style={styles.label}>Current Password</label>
              <input
                style={styles.input}
                type="password"
                name="current_password"
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
              />

              <label style={styles.label}>New Password</label>
              <input
                style={styles.input}
                type="password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
              />

              <button style={styles.button} type="submit">
                Change Password
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#EAF3FF",
    padding: "32px",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    color: "#0A4DA2",
    fontSize: "36px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
  },
  cardTitle: {
    color: "#0A4DA2",
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "16px",
  },
  label: {
    display: "block",
    color: "#374151",
    fontWeight: "bold",
    marginBottom: "6px",
    marginTop: "12px",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #D1D5DB",
    marginBottom: "8px",
  },
  button: {
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    border: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
    marginTop: "16px",
  },
  success: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
  },
  error: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
  },
};
