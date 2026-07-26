"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

export default function ProfilePage() {
  const router = useRouter();
  const {
    employee,
    loading: authLoading,
    loadUser,
    logout,
  } = useContext(AuthContext);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
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
  const [profileErrors, setProfileErrors] = useState({});

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
    });
  }, [employee]);

  const originalProfile = useMemo(
    () => ({
      first_name: employee?.first_name || "",
      last_name: employee?.last_name || "",
      phone: employee?.phone || "",
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

    setProfileErrors((current) => ({
      ...current,
      [name]: "",
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

  const validateProfile = () => {
    const errors = {};

    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const phone = form.phone.trim();

    if (!firstName) {
      errors.first_name = "First name is required.";
    } else if (firstName.length > 50) {
      errors.first_name = "First name must be 50 characters or fewer.";
    }

    if (!lastName) {
      errors.last_name = "Last name is required.";
    } else if (lastName.length > 50) {
      errors.last_name = "Last name must be 50 characters or fewer.";
    }

    if (phone && !/^[0-9()+\-\s.]{7,25}$/.test(phone)) {
      errors.phone = "Enter a valid phone number.";
    }

    setProfileErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const updateProfile = async (event) => {
    event.preventDefault();

    if (profileSubmitting) {
      return;
    }

    resetMessages();

    if (!validateProfile()) {
      setError("Please correct the highlighted profile fields.");
      return;
    }

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim(),
    };

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

    if (passwordSubmitting) {
      return;
    }

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

    const passwordValidation = validatePassword(passwordForm.new_password);

    if (!passwordValidation.valid) {
      setError("New password must meet all password requirements.");
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

      if (response.data?.session_revoked) {
        if (logout) {
          await logout();
        }

        router.replace("/login?message=password-changed");
        return;
      }

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
    setProfileErrors({});
    resetMessages();
  };

  if (authLoading || !employee) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <LoadingState message="Loading your profile..." />
        </div>
      </main>
    );
  }

  const accountIsActive = isActiveValue(employee.active);

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
            <span>{message}</span>

            <button
              type="button"
              style={styles.messageClose}
              onClick={() => setMessage("")}
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div style={styles.errorWrapper}>
            <ErrorState message={error} />

            <button
              type="button"
              style={styles.errorCloseButton}
              onClick={() => setError("")}
              aria-label="Dismiss error message"
            >
              ×
            </button>
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
                ...(accountIsActive
                  ? styles.activeBadge
                  : styles.inactiveBadge),
              }}
            >
              {accountIsActive ? "Active" : "Inactive"}
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
                value={accountIsActive ? "Active" : "Inactive"}
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

            <form onSubmit={updateProfile} aria-busy={profileSubmitting}>
              <div style={styles.twoColumnGrid}>
                <label style={styles.field}>
                  <span style={styles.label}>First Name</span>

                  <input
                    style={{
                      ...styles.input,
                      ...(profileErrors.first_name ? styles.inputError : {}),
                    }}
                    id="profile-first-name"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleProfileChange}
                    autoComplete="given-name"
                    disabled={profileSubmitting}
                    aria-invalid={Boolean(profileErrors.first_name)}
                    aria-describedby={
                      profileErrors.first_name ? "first-name-error" : undefined
                    }
                    required
                  />

                  {profileErrors.first_name && (
                    <span
                      id="first-name-error"
                      style={styles.fieldError}
                      role="alert"
                    >
                      {profileErrors.first_name}
                    </span>
                  )}
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>Last Name</span>

                  <input
                    style={{
                      ...styles.input,
                      ...(profileErrors.last_name ? styles.inputError : {}),
                    }}
                    id="profile-last-name"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleProfileChange}
                    autoComplete="family-name"
                    disabled={profileSubmitting}
                    aria-invalid={Boolean(profileErrors.last_name)}
                    aria-describedby={
                      profileErrors.last_name ? "last-name-error" : undefined
                    }
                    required
                  />

                  {profileErrors.last_name && (
                    <span
                      id="last-name-error"
                      style={styles.fieldError}
                      role="alert"
                    >
                      {profileErrors.last_name}
                    </span>
                  )}
                </label>
              </div>

              <label style={styles.field}>
                <span style={styles.label}>Phone</span>

                <input
                  style={{
                    ...styles.input,
                    ...(profileErrors.phone ? styles.inputError : {}),
                  }}
                  type="tel"
                  id="profile-phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleProfileChange}
                  autoComplete="tel"
                  placeholder="Enter phone number"
                  disabled={profileSubmitting}
                  aria-invalid={Boolean(profileErrors.phone)}
                  aria-describedby={
                    profileErrors.phone ? "phone-error" : undefined
                  }
                />

                {profileErrors.phone && (
                  <span id="phone-error" style={styles.fieldError} role="alert">
                    {profileErrors.phone}
                  </span>
                )}
              </label>

              <div style={styles.formActions}>
                <button
                  style={{
                    ...styles.secondaryButton,
                    ...(!hasProfileChanges || profileSubmitting
                      ? styles.disabledButton
                      : {}),
                  }}
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

            <form onSubmit={changePassword} aria-busy={passwordSubmitting}>
              <label style={styles.field}>
                <span style={styles.label}>Current Password</span>

                <div style={styles.passwordWrapper}>
                  <input
                    style={styles.passwordInput}
                    type={showCurrentPassword ? "text" : "password"}
                    id="current-password"
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
                    id="new-password"
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    disabled={passwordSubmitting}
                    minLength={12}
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
                  id="confirm-password"
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  disabled={passwordSubmitting}
                  minLength={12}
                  aria-describedby={
                    passwordForm.confirm_password
                      ? "confirm-password-feedback"
                      : undefined
                  }
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

              <div
                style={styles.passwordRequirements}
                aria-label="Password requirements"
              >
                <PasswordRequirement
                  valid={passwordStrength.rules.length}
                  text="At least 12 characters"
                />

                <PasswordRequirement
                  valid={passwordStrength.rules.uppercase}
                  text="One uppercase letter"
                />

                <PasswordRequirement
                  valid={passwordStrength.rules.lowercase}
                  text="One lowercase letter"
                />

                <PasswordRequirement
                  valid={passwordStrength.rules.number}
                  text="One number"
                />

                <PasswordRequirement
                  valid={passwordStrength.rules.special}
                  text="One special character"
                />
              </div>

              {passwordForm.confirm_password && (
                <p
                  id="confirm-password-feedback"
                  role="status"
                  style={
                    passwordForm.confirm_password === passwordForm.new_password
                      ? styles.passwordMatch
                      : styles.passwordMismatch
                  }
                >
                  {passwordForm.confirm_password === passwordForm.new_password
                    ? "Passwords match."
                    : "Passwords do not match."}
                </p>
              )}

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

          <section style={styles.securityInfo}>
            <h3 style={styles.securityInfoTitle}>Account Security</h3>

            <p style={styles.securityInfoText}>
              Changing your password signs you out of existing ShiftStack
              sessions. You will need to sign in again with your new password.
            </p>

            <div style={styles.securityInfoGrid}>
              <DetailRow
                label="Authentication"
                value="JWT access and refresh tokens"
              />

              <DetailRow
                label="Account Status"
                value={accountIsActive ? "Active" : "Inactive"}
              />
            </div>
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

function PasswordRequirement({ valid, text }) {
  return (
    <div
      style={{
        ...styles.passwordRequirement,
        ...(valid ? styles.passwordRequirementValid : {}),
      }}
    >
      <span aria-hidden="true">{valid ? "✓" : "○"}</span>
      <span>{text}</span>
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

function isActiveValue(value) {
  return (
    value === true ||
    value === "true" ||
    value === "TRUE" ||
    value === 1 ||
    value === "1"
  );
}

function validatePassword(password) {
  const value = typeof password === "string" ? password : "";

  const rules = {
    length: value.length >= 12,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };

  return {
    rules,
    valid: Object.values(rules).every(Boolean),
  };
}

function getPasswordStrength(password) {
  const validation = validatePassword(password);
  const passedRules = Object.values(validation.rules).filter(Boolean).length;

  if (!password) {
    return {
      label: "Not set",
      percent: 0,
      color: "#CBD5E1",
      rules: validation.rules,
      valid: false,
    };
  }

  let label = "Very weak";
  let percent = 20;
  let color = "#DC2626";

  if (passedRules >= 5) {
    label = "Strong";
    percent = 100;
    color = "#16A34A";
  } else if (passedRules >= 4) {
    label = "Good";
    percent = 80;
    color = "#65A30D";
  } else if (passedRules >= 3) {
    label = "Fair";
    percent = 60;
    color = "#D97706";
  } else if (passedRules >= 2) {
    label = "Weak";
    percent = 40;
    color = "#EA580C";
  }

  return {
    label,
    percent,
    color,
    rules: validation.rules,
    valid: validation.valid,
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
    boxSizing: "border-box",
    minHeight: "46px",
    padding: "12px 13px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    fontSize: "15px",
  },

  inputError: {
    borderColor: "#DC2626",
    boxShadow: "0 0 0 1px #DC2626",
  },

  fieldError: {
    display: "block",
    marginTop: "5px",
    color: "#B91C1C",
    fontSize: "12px",
    fontWeight: "600",
  },

  passwordWrapper: {
    position: "relative",
  },

  passwordInput: {
    width: "100%",
    boxSizing: "border-box",
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
    display: "grid",
    gap: "8px",
    margin: "0 0 14px",
  },

  passwordRequirement: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#64748B",
    fontSize: "13px",
  },

  passwordRequirementValid: {
    color: "#15803D",
  },

  passwordMatch: {
    margin: "0 0 16px",
    color: "#15803D",
    fontSize: "12px",
    fontWeight: "600",
  },

  passwordMismatch: {
    margin: "0 0 16px",
    color: "#B91C1C",
    fontSize: "12px",
    fontWeight: "600",
  },

  securityInfo: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid #DCEBFF",
  },

  securityInfoTitle: {
    color: "#172033",
    margin: "0 0 8px",
    fontSize: "20px",
  },

  securityInfoText: {
    color: "#64748B",
    margin: "0 0 18px",
    lineHeight: 1.6,
  },

  securityInfoGrid: {
    display: "grid",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    overflow: "hidden",
  },

  success: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    backgroundColor: "#DCFCE7",
    color: "#166534",
    border: "1px solid #BBF7D0",
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
  },

  errorWrapper: {
    position: "relative",
    marginBottom: "20px",
  },

  errorCloseButton: {
    position: "absolute",
    top: "8px",
    right: "8px",
    border: "none",
    backgroundColor: "transparent",
    color: "#991B1B",
    cursor: "pointer",
    fontSize: "20px",
    lineHeight: 1,
    padding: "4px 6px",
  },

  messageClose: {
    flex: "0 0 auto",
    border: "none",
    backgroundColor: "transparent",
    color: "inherit",
    cursor: "pointer",
    fontSize: "20px",
    lineHeight: 1,
    padding: "2px 4px",
  },
};
