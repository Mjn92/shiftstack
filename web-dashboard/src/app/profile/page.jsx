"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

export default function ProfilePage() {
  const router = useRouter();
  const { employee, loading: authLoading, loadUser } = useContext(AuthContext);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    department: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !employee) {
      router.replace("/login");
    }
  }, [authLoading, employee, router]);

  useEffect(() => {
    if (!employee) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      phone: employee.phone || "",
      department: employee.department || "",
    });
  }, [employee]);

  const originalProfile = useMemo(
    () => ({
      first_name: employee?.first_name || "",
      last_name: employee?.last_name || "",
      phone: employee?.phone || "",
      department: employee?.department || "",
    }),
    [employee],
  );

  const hasProfileChanges = useMemo(() => {
    return Object.keys(originalProfile).some(
      (key) => form[key] !== originalProfile[key],
    );
  }, [form, originalProfile]);

  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordForm.new_password),
    [passwordForm.new_password],
  );

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetMessages = () => {
    setMessage("");
    setError("");
  };

  const updateProfile = async (event) => {
    event.preventDefault();
    resetMessages();

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim(),
      department: form.department.trim(),
    };

    if (!payload.first_name || !payload.last_name) {
      setError("First name and last name are required.");
      return;
    }

    try {
      setProfileSubmitting(true);

      const response = await api.put("/auth/profile", payload);

      setMessage(response.data?.message || "Profile updated successfully.");

      if (loadUser) {
        await loadUser();
      }
    } catch (err) {
      console.error("Profile update failed:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Profile update failed.",
      );
    } finally {
      setProfileSubmitting(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    resetMessages();

    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.confirm_password
    ) {
      setError("Complete all password fields.");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    if (passwordForm.current_password === passwordForm.new_password) {
      setError("New password must be different from the current password.");
      return;
    }

    try {
      setPasswordSubmitting(true);

      const response = await api.put("/auth/change-password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });

      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setShowCurrentPassword(false);
      setShowNewPassword(false);

      setMessage(response.data?.message || "Password changed successfully.");
    } catch (err) {
      console.error("Password change failed:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Password change failed.",
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const resetProfileForm = () => {
    setForm(originalProfile);
    resetMessages();
  };

  if (authLoading || !employee) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard} role="status" aria-live="polite">
          Loading your profile...
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <div style={styles.page}>
        <PageHeader
          eyebrow="Account"
          title="My Profile"
          description="Manage your ShiftStack account details and security settings."
        />

        {message && (
          <div style={styles.success} role="status" aria-live="polite">
            {message}
          </div>
        )}

        {error && (
          <div style={styles.error} role="alert">
            {error}
          </div>
        )}

        <section style={styles.profileSummary}>
          <div style={styles.avatar} aria-hidden="true">
            {getInitials(employee)}
          </div>

          <div style={styles.profileIdentity}>
            <p style={styles.profileEyebrow}>Signed in as</p>

            <h2 style={styles.profileName}>{getEmployeeName(employee)}</h2>

            <p style={styles.profileEmail}>{employee.email}</p>
          </div>

          <div style={styles.summaryBadges}>
            <span style={styles.roleBadge}>{formatRole(employee.role)}</span>

            <span
              style={{
                ...styles.statusBadge,
                ...(employee.active
                  ? styles.activeBadge
                  : styles.inactiveBadge),
              }}
            >
              {employee.active ? "Active" : "Inactive"}
            </span>
          </div>
        </section>

        <div style={styles.grid}>
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.cardEyebrow}>Account Details</p>
                <h2 style={styles.cardTitle}>Account Information</h2>
              </div>
            </div>

            <div style={styles.accountDetails}>
              <DetailRow label="Email" value={employee.email || "—"} />
              <DetailRow label="Role" value={formatRole(employee.role)} />
              <DetailRow
                label="Department"
                value={employee.department || "Not assigned"}
              />
              <DetailRow
                label="Phone"
                value={employee.phone || "Not provided"}
              />
              <DetailRow
                label="Account Status"
                value={employee.active ? "Active" : "Inactive"}
              />
              <DetailRow
                label="Employee ID"
                value={employee.id ? `#${employee.id}` : "—"}
              />
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.cardEyebrow}>Personal Information</p>
                <h2 style={styles.cardTitle}>Update Profile</h2>
              </div>

              {hasProfileChanges && (
                <span style={styles.unsavedBadge}>Unsaved changes</span>
              )}
            </div>

            <form onSubmit={updateProfile}>
              <div style={styles.twoColumnGrid}>
                <label style={styles.field}>
                  <span style={styles.label}>First Name</span>

                  <input
                    style={styles.input}
                    name="first_name"
                    value={form.first_name}
                    onChange={handleProfileChange}
                    autoComplete="given-name"
                    disabled={profileSubmitting}
                    required
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>Last Name</span>

                  <input
                    style={styles.input}
                    name="last_name"
                    value={form.last_name}
                    onChange={handleProfileChange}
                    autoComplete="family-name"
                    disabled={profileSubmitting}
                    required
                  />
                </label>
              </div>

              <label style={styles.field}>
                <span style={styles.label}>Phone</span>

                <input
                  style={styles.input}
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleProfileChange}
                  autoComplete="tel"
                  placeholder="Enter phone number"
                  disabled={profileSubmitting}
                />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Department</span>

                <input
                  style={styles.input}
                  name="department"
                  value={form.department}
                  onChange={handleProfileChange}
                  autoComplete="organization-title"
                  placeholder="Enter department"
                  disabled={profileSubmitting}
                />
              </label>

              <div style={styles.formActions}>
                <button
                  style={styles.secondaryButton}
                  type="button"
                  onClick={resetProfileForm}
                  disabled={!hasProfileChanges || profileSubmitting}
                >
                  Reset
                </button>

                <button
                  style={{
                    ...styles.primaryButton,
                    ...(!hasProfileChanges || profileSubmitting
                      ? styles.disabledButton
                      : {}),
                  }}
                  type="submit"
                  disabled={!hasProfileChanges || profileSubmitting}
                >
                  {profileSubmitting ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </section>

          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.cardEyebrow}>Security</p>
                <h2 style={styles.cardTitle}>Change Password</h2>
              </div>
            </div>

            <form onSubmit={changePassword}>
              <label style={styles.field}>
                <span style={styles.label}>Current Password</span>

                <div style={styles.passwordWrapper}>
                  <input
                    style={styles.passwordInput}
                    type={showCurrentPassword ? "text" : "password"}
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                    placeholder="Enter current password"
                    disabled={passwordSubmitting}
                    required
                  />

                  <button
                    type="button"
                    style={styles.passwordToggle}
                    onClick={() =>
                      setShowCurrentPassword((current) => !current)
                    }
                    disabled={passwordSubmitting}
                    aria-label={
                      showCurrentPassword
                        ? "Hide current password"
                        : "Show current password"
                    }
                  >
                    {showCurrentPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <label style={styles.field}>
                <span style={styles.label}>New Password</span>

                <div style={styles.passwordWrapper}>
                  <input
                    style={styles.passwordInput}
                    type={showNewPassword ? "text" : "password"}
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    disabled={passwordSubmitting}
                    minLength={8}
                    required
                  />

                  <button
                    type="button"
                    style={styles.passwordToggle}
                    onClick={() => setShowNewPassword((current) => !current)}
                    disabled={passwordSubmitting}
                    aria-label={
                      showNewPassword
                        ? "Hide new password"
                        : "Show new password"
                    }
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Confirm New Password</span>

                <input
                  style={styles.input}
                  type={showNewPassword ? "text" : "password"}
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  disabled={passwordSubmitting}
                  minLength={8}
                  required
                />
              </label>

              <div style={styles.passwordStrength}>
                <div style={styles.strengthHeader}>
                  <span style={styles.strengthLabel}>Password strength</span>
                  <strong style={styles.strengthValue}>
                    {passwordStrength.label}
                  </strong>
                </div>

                <div style={styles.strengthTrack}>
                  <div
                    style={{
                      ...styles.strengthFill,
                      width: `${passwordStrength.percent}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
              </div>

              <ul style={styles.passwordRequirements}>
                <li>Use at least 8 characters.</li>
                <li>Include a mix of letters, numbers, or symbols.</li>
                <li>Do not reuse your current password.</li>
              </ul>

              <button
                style={{
                  ...styles.primaryButton,
                  ...(passwordSubmitting ? styles.disabledButton : {}),
                }}
                type="submit"
                disabled={passwordSubmitting}
              >
                {passwordSubmitting
                  ? "Changing Password..."
                  : "Change Password"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <strong style={styles.detailValue}>{value}</strong>
    </div>
  );
}

function getEmployeeName(employee) {
  const fullName = `${employee?.first_name || ""} ${
    employee?.last_name || ""
  }`.trim();

  return fullName || employee?.email || "ShiftStack Employee";
}

function getInitials(employee) {
  const first = employee?.first_name?.charAt(0) || "";
  const last = employee?.last_name?.charAt(0) || "";

  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }

  return "SS";
}

function formatRole(role) {
  if (!role) {
    return "Employee";
  }

  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function getPasswordStrength(password) {
  if (!password) {
    return {
      label: "Not set",
      percent: 0,
      color: "#CBD5E1",
    };
  }

  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return {
      label: "Weak",
      percent: 25,
      color: "#DC2626",
    };
  }

  if (score <= 3) {
    return {
      label: "Moderate",
      percent: 60,
      color: "#D97706",
    };
  }

  return {
    label: "Strong",
    percent: 100,
    color: "#16A34A",
  };
}

const styles = {
  loadingPage: {
    minHeight: "100vh",
    backgroundColor: "#F4F7FB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
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
    width: "100%",
    maxWidth: "1440px",
    margin: "0 auto",
  },

  profileSummary: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "20px",
    padding: "22px",
    marginBottom: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  },

  avatar: {
    width: "64px",
    height: "64px",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    borderRadius: "50%",
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
    fontSize: "22px",
    fontWeight: "800",
  },

  profileIdentity: {
    flex: "1 1 240px",
    minWidth: 0,
  },

  profileEyebrow: {
    color: "#64748B",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: "0 0 4px",
  },

  profileName: {
    color: "#172033",
    fontSize: "26px",
    margin: 0,
    overflowWrap: "anywhere",
  },

  profileEmail: {
    color: "#64748B",
    fontSize: "14px",
    margin: "5px 0 0",
    overflowWrap: "anywhere",
  },

  summaryBadges: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  roleBadge: {
    display: "inline-block",
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "13px",
    fontWeight: "700",
  },

  statusBadge: {
    display: "inline-block",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "13px",
    fontWeight: "700",
  },

  activeBadge: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
  },

  inactiveBadge: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: "24px",
    alignItems: "start",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid #DCEBFF",
  },

  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  cardEyebrow: {
    color: "#2563EB",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: "0 0 5px",
  },

  cardTitle: {
    color: "#172033",
    fontSize: "22px",
    margin: 0,
  },

  unsavedBadge: {
    display: "inline-block",
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    borderRadius: "999px",
    padding: "7px 11px",
    fontSize: "12px",
    fontWeight: "700",
  },

  accountDetails: {
    display: "grid",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    overflow: "hidden",
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    padding: "15px",
    borderBottom: "1px solid #E2E8F0",
  },

  detailLabel: {
    color: "#64748B",
  },

  detailValue: {
    color: "#172033",
    textAlign: "right",
    overflowWrap: "anywhere",
  },

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "14px",
  },

  field: {
    display: "grid",
    gap: "8px",
    marginBottom: "16px",
  },

  label: {
    color: "#374151",
    fontWeight: "700",
    fontSize: "14px",
  },

  input: {
    width: "100%",
    minHeight: "46px",
    padding: "12px 13px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    fontSize: "15px",
  },

  passwordWrapper: {
    position: "relative",
  },

  passwordInput: {
    width: "100%",
    minHeight: "46px",
    padding: "12px 72px 12px 13px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    fontSize: "15px",
  },

  passwordToggle: {
    position: "absolute",
    top: "50%",
    right: "10px",
    transform: "translateY(-50%)",
    border: "none",
    backgroundColor: "transparent",
    color: "#0A4DA2",
    fontWeight: "700",
    cursor: "pointer",
    padding: "6px",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "6px",
  },

  primaryButton: {
    minHeight: "44px",
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    border: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },

  secondaryButton: {
    minHeight: "44px",
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    border: "1px solid #0A4DA2",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },

  disabledButton: {
    cursor: "not-allowed",
    opacity: 0.65,
  },

  passwordStrength: {
    marginTop: "2px",
    marginBottom: "14px",
  },

  strengthHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "7px",
  },

  strengthLabel: {
    color: "#64748B",
    fontSize: "13px",
  },

  strengthValue: {
    color: "#172033",
    fontSize: "13px",
  },

  strengthTrack: {
    height: "8px",
    backgroundColor: "#E2E8F0",
    borderRadius: "999px",
    overflow: "hidden",
  },

  strengthFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 160ms ease",
  },

  passwordRequirements: {
    color: "#64748B",
    fontSize: "13px",
    lineHeight: 1.6,
    paddingLeft: "20px",
    margin: "0 0 18px",
  },

  success: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
    border: "1px solid #BBF7D0",
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
  },

  error: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FCA5A5",
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
};
