"use client";

export default function DashboardCard({
  title,
  value,
  text,
  buttonText,
  onClick,
  highlight = "default",
  disabled = false,
  styles,
}) {
  const highlightStyle =
    highlight === "success"
      ? styles.successValue
      : highlight === "neutral"
        ? styles.neutralValue
        : styles.cardValue;

  return (
    <div style={styles.card}>
      <p style={styles.cardLabel}>{title}</p>

      <h3 style={highlightStyle}>{value}</h3>

      <p style={styles.cardText}>{text}</p>

      <button
        style={{
          ...styles.button,
          backgroundColor: disabled ? "#9CA3AF" : "#0A4DA2",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
      >
        {buttonText}
      </button>
    </div>
  );
}
