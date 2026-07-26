export default function LoadingState({ message = "Loading..." }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        padding: "24px",
        textAlign: "center",
        color: "#64748B",
      }}
    >
      {message}
    </div>
  );
}
