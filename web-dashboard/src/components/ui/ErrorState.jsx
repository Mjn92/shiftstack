export default function ErrorState({
  message = "Something went wrong.",
  onRetry,
}) {
  const canRetry = typeof onRetry === "function";

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        padding: "20px",
        border: "1px solid #FCA5A5",
        borderRadius: "12px",
        backgroundColor: "#FEF2F2",
        color: "#991B1B",
      }}
    >
      <p
        style={{
          margin: 0,
          lineHeight: "1.5",
        }}
      >
        {message}
      </p>

      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: "12px",
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "#DC2626",
            color: "#FFFFFF",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
