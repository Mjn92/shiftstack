import Link from "next/link";

export const metadata = {
  title: "ShiftStack",
  description:
    "ShiftStack workforce time tracking, employee management, and reporting.",
};

export default function HomePage() {
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.brandMark}>SS</span>

          <span style={styles.brandName}>ShiftStack</span>
        </div>

        <div style={styles.content}>
          <p style={styles.eyebrow}>Workforce Time Management</p>

          <h1 style={styles.title}>Time tracking built for the whole team.</h1>

          <p style={styles.description}>
            Clock in, review work history, track weekly hours, manage employees,
            and access workforce reporting from one place.
          </p>

          <div style={styles.actions}>
            <Link href="/login" style={styles.primaryButton}>
              Sign In
            </Link>
          </div>
        </div>

        <div style={styles.features}>
          <Feature
            title="Time Tracking"
            description="Clock in and out and review your work history."
          />

          <Feature
            title="Weekly Overview"
            description="Track weekly hours, shifts, and overtime."
          />

          <Feature
            title="Workforce Management"
            description="Management tools for employees, time entries, and reports."
          />
        </div>
      </section>
    </main>
  );
}

function Feature({ title, description }) {
  return (
    <article style={styles.feature}>
      <div style={styles.featureDot} />

      <div>
        <h2 style={styles.featureTitle}>{title}</h2>

        <p style={styles.featureDescription}>{description}</p>
      </div>
    </article>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "32px 20px",
    background:
      "linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 50%, #FFFFFF 100%)",
  },

  card: {
    width: "100%",
    maxWidth: "1000px",
    padding: "clamp(28px, 5vw, 56px)",
    border: "1px solid #DBE4EF",
    borderRadius: "24px",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "48px",
  },

  brandMark: {
    display: "grid",
    placeItems: "center",
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: "800",
  },

  brandName: {
    color: "#172033",
    fontSize: "22px",
    fontWeight: "800",
  },

  content: {
    maxWidth: "720px",
  },

  eyebrow: {
    margin: "0 0 10px",
    color: "#2563EB",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  title: {
    margin: 0,
    color: "#172033",
    fontSize: "clamp(36px, 6vw, 58px)",
    lineHeight: 1.08,
    letterSpacing: "-0.03em",
  },

  description: {
    maxWidth: "650px",
    margin: "20px 0 0",
    color: "#64748B",
    fontSize: "17px",
    lineHeight: 1.7,
  },

  actions: {
    display: "flex",
    gap: "12px",
    marginTop: "30px",
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "46px",
    padding: "11px 22px",
    borderRadius: "10px",
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    fontWeight: "700",
    textDecoration: "none",
  },

  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginTop: "56px",
    paddingTop: "28px",
    borderTop: "1px solid #E2E8F0",
  },

  feature: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px",
  },

  featureDot: {
    width: "9px",
    height: "9px",
    marginTop: "7px",
    flex: "0 0 auto",
    borderRadius: "50%",
    backgroundColor: "#2563EB",
  },

  featureTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "15px",
  },

  featureDescription: {
    margin: "6px 0 0",
    color: "#64748B",
    fontSize: "13px",
    lineHeight: 1.5,
  },
};
