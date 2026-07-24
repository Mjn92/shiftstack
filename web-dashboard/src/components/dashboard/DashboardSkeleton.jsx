export default function DashboardSkeleton() {
  return (
    <div
      className="dashboard-skeleton"
      role="status"
      aria-label="Loading dashboard information"
      aria-live="polite"
    >
      <span className="sr-only">Loading dashboard information.</span>

      <div className="dashboard-skeleton__hero">
        <div className="dashboard-skeleton__line dashboard-skeleton__line--short" />
        <div className="dashboard-skeleton__line dashboard-skeleton__line--medium" />
        <div className="dashboard-skeleton__line dashboard-skeleton__line--long" />
      </div>

      <div className="dashboard-skeleton__grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="dashboard-skeleton__card"
            key={`dashboard-skeleton-${index}`}
          >
            <div className="dashboard-skeleton__circle" />
            <div className="dashboard-skeleton__line dashboard-skeleton__line--short" />
            <div className="dashboard-skeleton__line dashboard-skeleton__line--medium" />
            <div className="dashboard-skeleton__line dashboard-skeleton__line--long" />
          </div>
        ))}
      </div>
    </div>
  );
}
