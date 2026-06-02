import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>ShiftStack Admin Dashboard</h1>
      <p>Web dashboard is running successfully.</p>

      <div style={{ marginTop: "20px" }}>
        <Link href="/login">Go to Login</Link>
      </div>
    </main>
  );
}
