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

  const cardTitleId = `dashboard-card-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <article style={styles.card} aria-labelledby={cardTitleId}>
      <p id={cardTitleId} style={styles.cardLabel}>
        {title}
      </p>

      <h3 style={highlightStyle}>{value}</h3>

      <p style={styles.cardText}>{text}</p>

      <button
        type="button"
        className="dashboard-button"
        style={{
          ...styles.button,
          backgroundColor: disabled ? "#9CA3AF" : "#0A4DA2",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.75 : 1,
        }}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        aria-label={`${buttonText}: ${title}`}
        title={disabled ? `${title} is not available yet` : undefined}
      >
        {buttonText}
      </button>
    </article>
  );
}
