export default function EmptyState({
  title = "Nothing here yet",
  description = "There is currently nothing to display.",
  action,
}) {
  return (
    <section
      aria-live="polite"
      style={{
        padding: "40px 24px",
        border: "1px solid #DCEBFF",
        borderRadius: "16px",
        backgroundColor: "#FFFFFF",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          margin: 0,
          color: "#172033",
          fontSize: "20px",
          fontWeight: "700",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          maxWidth: "520px",
          margin: action ? "8px auto 20px" : "8px auto 0",
          color: "#64748B",
          lineHeight: "1.6",
        }}
      >
        {description}
      </p>

      {action && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          {action}
        </div>
      )}
    </section>
  );
}
