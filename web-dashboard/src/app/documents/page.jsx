"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "../../components/AppShell";
import SectionHeader from "../../components/SectionHeader";

import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

export default function DocumentsPage() {
  const router = useRouter();
  const { employee, loading } = useContext(AuthContext);

  const [documents, setDocuments] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !employee) {
      router.push("/login");
    }
  }, [loading, employee, router]);

  useEffect(() => {
    if (employee) {
      loadDocuments();
    }
  }, [employee]);

  const loadDocuments = async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await api.get("/documents");

      setDocuments(response.data.documents || []);
    } catch (err) {
      console.error("Documents load error:", err);

      setError(
        err.response?.data?.error || "Could not load company documents.",
      );
    } finally {
      setPageLoading(false);
    }
  };

  const categories = useMemo(() => {
    return [
      "all",
      ...new Set(
        documents.map((document) => document.category).filter(Boolean),
      ),
    ];
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesCategory =
        category === "all" || document.category === category;

      const matchesSearch =
        !normalizedSearch ||
        document.title?.toLowerCase().includes(normalizedSearch) ||
        document.description?.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [documents, category, search]);

  if (loading || !employee) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <h1 style={styles.loadingTitle}>Loading ShiftStack...</h1>

          <p style={styles.loadingText}>
            Checking your session and document access.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <main style={styles.page}>
        <div style={styles.container}>
          <SectionHeader
            title="Company Documents"
            subtitle="Access policies, benefits information, forms, and company resources."
            styles={styles}
          />

          <section style={styles.toolbar}>
            <input
              type="search"
              placeholder="Search documents..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={styles.searchInput}
            />

            <button
              type="button"
              onClick={loadDocuments}
              disabled={pageLoading}
              style={{
                ...styles.refreshButton,
                ...(pageLoading ? styles.disabledButton : {}),
              }}
            >
              {pageLoading ? "Refreshing..." : "Refresh"}
            </button>
          </section>

          <div style={styles.categoryRow}>
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                style={{
                  ...styles.categoryButton,
                  ...(category === item ? styles.categoryButtonActive : {}),
                }}
              >
                {formatLabel(item)}
              </button>
            ))}
          </div>

          {error && <div style={styles.error}>{error}</div>}

          {pageLoading && (
            <div style={styles.info}>Loading company documents...</div>
          )}

          {!pageLoading && !error && filteredDocuments.length === 0 && (
            <div style={styles.emptyState}>
              <h2 style={styles.emptyTitle}>No documents found</h2>

              <p style={styles.emptyText}>
                No company documents match the current filters.
              </p>
            </div>
          )}

          {!pageLoading && filteredDocuments.length > 0 && (
            <section style={styles.documentGrid}>
              {filteredDocuments.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </section>
          )}
        </div>
      </main>
    </AppShell>
  );
}

function DocumentCard({ document }) {
  const handleOpen = () => {
    window.open(document.file_url, "_blank", "noopener,noreferrer");
  };

  return (
    <article style={styles.card}>
      <div style={styles.cardTop}>
        <span style={styles.fileBadge}>{document.file_type || "FILE"}</span>

        <span style={styles.categoryBadge}>
          {formatLabel(document.category)}
        </span>
      </div>

      <h2 style={styles.cardTitle}>{document.title}</h2>

      <p style={styles.cardDescription}>
        {document.description || "No description available."}
      </p>

      <div style={styles.cardFooter}>
        <span style={styles.audience}>
          Available to: {formatLabel(document.audience)}
        </span>

        <button type="button" onClick={handleOpen} style={styles.openButton}>
          View Document
        </button>
      </div>
    </article>
  );
}

function formatLabel(value) {
  if (!value) {
    return "General";
  }

  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#EAF3FF",
    padding: "32px",
  },

  container: {
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
  },

  toolbar: {
    display: "flex",
    gap: "12px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },

  searchInput: {
    flex: 1,
    minWidth: "240px",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    fontSize: "15px",
  },

  refreshButton: {
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    border: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  categoryRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },

  categoryButton: {
    border: "1px solid #BFDBFE",
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    padding: "9px 14px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "600",
  },

  categoryButtonActive: {
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
  },

  documentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },

  card: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },

  fileBadge: {
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
    padding: "5px 9px",
    borderRadius: "7px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  categoryBadge: {
    backgroundColor: "#F1F5F9",
    color: "#475569",
    padding: "5px 9px",
    borderRadius: "7px",
    fontSize: "12px",
    fontWeight: "600",
  },

  cardTitle: {
    color: "#0A4DA2",
    fontSize: "20px",
    fontWeight: "bold",
    margin: 0,
  },

  cardDescription: {
    color: "#64748B",
    lineHeight: "1.6",
    margin: 0,
    flex: 1,
  },

  cardFooter: {
    borderTop: "1px solid #E2E8F0",
    paddingTop: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  audience: {
    color: "#64748B",
    fontSize: "13px",
  },

  openButton: {
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "9px",
    padding: "11px 14px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
  },

  error: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    padding: "14px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  info: {
    backgroundColor: "#DBEAFE",
    color: "#1E40AF",
    padding: "14px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  emptyState: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "18px",
    padding: "40px",
    textAlign: "center",
  },

  emptyTitle: {
    color: "#0A4DA2",
    marginTop: 0,
  },

  emptyText: {
    color: "#64748B",
    marginBottom: 0,
  },

  loadingPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    backgroundColor: "#EAF3FF",
    padding: "24px",
  },

  loadingCard: {
    backgroundColor: "#FFFFFF",
    padding: "32px",
    borderRadius: "18px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
  },

  loadingTitle: {
    color: "#0A4DA2",
    marginTop: 0,
  },

  loadingText: {
    color: "#64748B",
    marginBottom: 0,
  },
};
