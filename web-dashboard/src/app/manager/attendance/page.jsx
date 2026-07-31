"use client";

import { useCallback, useContext, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Clock3,
  RefreshCw,
  Search,
  UserCheck,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";

import AppShell from "../../../components/app-shell/AppShell";
import PageHeader from "../../../components/app-shell/PageHeader";

import { AuthContext } from "../../../context/AuthContext";
import { canAccessManagement } from "../../../utils/roleAccess";

import api from "../../../api/api";

import "./attendance.css";

const DEFAULT_FILTERS = {
  search: "",
  department: "all",
  status: "all",
};

const DEFAULT_PAGE_SIZE = 20;

export default function ManagerAttendancePage() {
  const router = useRouter();

  const { employee, loading: authLoading } = useContext(AuthContext);

  const [employees, setEmployees] = useState([]);

  const [departments, setDepartments] = useState([]);

  const [summary, setSummary] = useState({
    activeEmployees: 0,
    workingNow: 0,
    clockedOut: 0,
  });

  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  const [pageLoading, setPageLoading] = useState(true);

  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  const [error, setError] = useState("");

  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAttendance = useCallback(
    async ({
      page = 1,
      limit = DEFAULT_PAGE_SIZE,
      activeFilters = DEFAULT_FILTERS,
      showLoading = true,
    } = {}) => {
      try {
        if (showLoading) {
          setPageLoading(true);
        }

        setError("");

        const response = await api.get("/manager/attendance", {
          params: {
            page,
            limit,

            search: activeFilters.search.trim() || undefined,

            department:
              activeFilters.department === "all"
                ? undefined
                : activeFilters.department,

            status:
              activeFilters.status === "all" ? undefined : activeFilters.status,
          },
        });

        const data = response?.data || {};

        setEmployees(Array.isArray(data.employees) ? data.employees : []);

        setSummary({
          activeEmployees: Number(data.summary?.active_employees) || 0,

          workingNow: Number(data.summary?.working_now) || 0,

          clockedOut: Number(data.summary?.clocked_out) || 0,
        });

        setPagination({
          page: Number(data.pagination?.page) || page,

          limit: Number(data.pagination?.limit) || limit,

          total: Number(data.pagination?.total) || 0,

          totalPages: Number(data.pagination?.total_pages) || 0,

          hasPreviousPage: Boolean(data.pagination?.has_previous_page),

          hasNextPage: Boolean(data.pagination?.has_next_page),
        });

        setLastUpdated(new Date());
      } catch (err) {
        console.error("Attendance load error:", err);

        if (err.response?.status === 403) {
          setError("You do not have permission to view live attendance.");
        } else {
          setError(
            err.response?.data?.error || "Could not load live attendance.",
          );
        }
      } finally {
        if (showLoading) {
          setPageLoading(false);
        }
      }
    },
    [],
  );

  const loadDepartments = useCallback(async () => {
    try {
      setDepartmentsLoading(true);

      const response = await api.get("/manager/departments");

      const data = response?.data || {};

      setDepartments(Array.isArray(data.departments) ? data.departments : []);
    } catch (err) {
      console.error("Department load error:", err);

      /*
       * Attendance can still function without
       * the department dropdown options.
       */
      setDepartments([]);
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!employee) {
      router.replace("/login");
      return;
    }

    if (!canAccessManagement(employee.role)) {
      router.replace("/dashboard");
    }
  }, [authLoading, employee, router]);

  useEffect(() => {
    if (authLoading || !employee || !canAccessManagement(employee.role)) {
      return;
    }

    loadDepartments();

    loadAttendance({
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      activeFilters: DEFAULT_FILTERS,
    });
  }, [authLoading, employee, loadAttendance, loadDepartments]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (authLoading || !employee || !canAccessManagement(employee.role)) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadAttendance({
        page: pagination.page,
        limit: pagination.limit,
        activeFilters: appliedFilters,

        showLoading: false,
      });
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    authLoading,
    employee,
    pagination.page,
    pagination.limit,
    appliedFilters.search,
    appliedFilters.department,
    appliedFilters.status,
    loadAttendance,
  ]);

  if (authLoading) {
    return (
      <main className="attendance-session-loading">
        Checking management access...
      </main>
    );
  }

  if (!employee || !canAccessManagement(employee.role)) {
    return null;
  }

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const applyFilters = async (event) => {
    event.preventDefault();

    const nextFilters = {
      search: filters.search.trim(),
      department: filters.department,
      status: filters.status,
    };

    setAppliedFilters(nextFilters);

    await loadAttendance({
      page: 1,
      limit: pagination.limit,
      activeFilters: nextFilters,
    });
  };

  const clearFilters = async () => {
    const clearedFilters = {
      ...DEFAULT_FILTERS,
    };

    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);

    await loadAttendance({
      page: 1,
      limit: pagination.limit,
      activeFilters: clearedFilters,
    });
  };

  const changePage = async (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || pageLoading) {
      return;
    }

    await loadAttendance({
      page: nextPage,
      limit: pagination.limit,
      activeFilters: appliedFilters,
    });
  };

  const changePageSize = async (event) => {
    const nextLimit = Number(event.target.value);

    if (!Number.isInteger(nextLimit) || nextLimit < 1) {
      return;
    }

    await loadAttendance({
      page: 1,
      limit: nextLimit,
      activeFilters: appliedFilters,
    });
  };

  return (
    <AppShell>
      <div className="manager-attendance-page">
        <PageHeader
          eyebrow="Management"
          title="Live Attendance"
          description="See which employees are currently working and review their active shift status."
          actions={
            <button
              type="button"
              className="attendance-refresh"
              onClick={() =>
                loadAttendance({
                  page: pagination.page,
                  limit: pagination.limit,
                  activeFilters: appliedFilters,
                })
              }
              disabled={pageLoading}
            >
              <RefreshCw size={17} aria-hidden="true" />

              {pageLoading ? "Refreshing..." : "Refresh"}
            </button>
          }
        />

        {error && (
          <div className="attendance-error" role="alert">
            {error}
          </div>
        )}

        <section className="attendance-stats" aria-label="Attendance summary">
          <AttendanceStat
            icon={UserRoundCheck}
            label="Working Now"
            value={summary.workingNow}
            tone="success"
          />

          <AttendanceStat
            icon={UserRoundX}
            label="Clocked Out"
            value={summary.clockedOut}
            tone="neutral"
          />

          <AttendanceStat
            icon={UserCheck}
            label="Active Employees"
            value={summary.activeEmployees}
            tone="primary"
          />
        </section>

        <section className="attendance-filters">
          <div>
            <p className="attendance-eyebrow">Team Filters</p>

            <h2>Find employees</h2>
          </div>

          <form className="attendance-filter-form" onSubmit={applyFilters}>
            <label className="attendance-field attendance-field--search">
              <span>Search</span>

              <div className="attendance-search-input">
                <Search size={17} aria-hidden="true" />

                <input
                  type="search"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Name or email"
                  maxLength={100}
                />
              </div>
            </label>

            <label className="attendance-field">
              <span>Department</span>

              <select
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                disabled={departmentsLoading}
              >
                <option value="all">
                  {departmentsLoading
                    ? "Loading departments..."
                    : "All departments"}
                </option>

                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>

            <label className="attendance-field">
              <span>Status</span>

              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="all">All statuses</option>

                <option value="working">Working now</option>

                <option value="clocked_out">Clocked out</option>
              </select>
            </label>

            <div className="attendance-filter-actions">
              <button
                type="submit"
                className="attendance-filter-primary"
                disabled={pageLoading}
              >
                Apply
              </button>

              <button
                type="button"
                className="attendance-filter-secondary"
                onClick={clearFilters}
                disabled={pageLoading}
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="attendance-table-card">
          <div className="attendance-table-header">
            <div>
              <p className="attendance-eyebrow">Workforce</p>

              <h2>Employee Attendance</h2>
            </div>

            <div className="attendance-table-meta">
              <span>
                {pagination.total}{" "}
                {pagination.total === 1 ? "employee" : "employees"}
              </span>

              {lastUpdated && (
                <span>
                  Updated{" "}
                  {lastUpdated.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>

          {pageLoading && employees.length === 0 ? (
            <AttendanceSkeleton />
          ) : employees.length === 0 ? (
            <AttendanceEmptyState />
          ) : (
            <>
              <div className="attendance-table-wrapper">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th scope="col">Employee</th>

                      <th scope="col">Department</th>

                      <th scope="col">Status</th>

                      <th scope="col">Clock In</th>

                      <th scope="col">Duration</th>
                    </tr>
                  </thead>

                  <tbody>
                    {employees.map((item) => (
                      <AttendanceRow
                        key={item.id}
                        employee={item}
                        currentTime={currentTime}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="attendance-mobile-list">
                {employees.map((item) => (
                  <AttendanceMobileCard
                    key={`mobile-${item.id}`}
                    employee={item}
                    currentTime={currentTime}
                  />
                ))}
              </div>

              <div className="attendance-pagination">
                <div className="attendance-page-size">
                  <label htmlFor="attendance-page-size">Rows per page</label>

                  <select
                    id="attendance-page-size"
                    value={pagination.limit}
                    onChange={changePageSize}
                    disabled={pageLoading}
                  >
                    <option value="10">10</option>

                    <option value="20">20</option>

                    <option value="50">50</option>
                  </select>
                </div>

                <span>
                  Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
                </span>

                <div>
                  <button
                    type="button"
                    onClick={() => changePage(pagination.page - 1)}
                    disabled={pageLoading || !pagination.hasPreviousPage}
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={pageLoading || !pagination.hasNextPage}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function AttendanceStat({ icon: Icon, label, value, tone }) {
  return (
    <article className={`attendance-stat attendance-stat--${tone}`}>
      <div
        className={`attendance-stat__icon attendance-stat__icon--${tone}`}
        aria-hidden="true"
      >
        <Icon size={22} />
      </div>

      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function AttendanceRow({ employee, currentTime }) {
  const working = employee.attendance_status === "working";

  return (
    <tr>
      <td>
        <EmployeeIdentity employee={employee} />
      </td>

      <td>{employee.department || "Not assigned"}</td>

      <td>
        <AttendanceStatus working={working} />
      </td>

      <td>{working ? formatClockTime(employee.clock_in) : "—"}</td>

      <td>
        {working ? getActiveDuration(employee.clock_in, currentTime) : "—"}
      </td>
    </tr>
  );
}

function AttendanceMobileCard({ employee, currentTime }) {
  const working = employee.attendance_status === "working";

  return (
    <article className="attendance-mobile-card">
      <div className="attendance-mobile-card__header">
        <EmployeeIdentity employee={employee} />

        <AttendanceStatus working={working} />
      </div>

      <dl className="attendance-mobile-details">
        <div>
          <dt>Department</dt>

          <dd>{employee.department || "Not assigned"}</dd>
        </div>

        <div>
          <dt>Clock In</dt>

          <dd>{working ? formatClockTime(employee.clock_in) : "—"}</dd>
        </div>

        <div>
          <dt>Duration</dt>

          <dd>
            {working ? getActiveDuration(employee.clock_in, currentTime) : "—"}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function EmployeeIdentity({ employee }) {
  return (
    <div className="attendance-employee">
      <div className="attendance-avatar" aria-hidden="true">
        {getInitials(employee)}
      </div>

      <div>
        <strong>
          {employee.first_name} {employee.last_name}
        </strong>

        <span>{employee.email}</span>
      </div>
    </div>
  );
}

function AttendanceStatus({ working }) {
  return (
    <span
      className={
        working
          ? "attendance-status attendance-status--working"
          : "attendance-status attendance-status--out"
      }
    >
      <span className="attendance-status__dot" aria-hidden="true" />

      {working ? "Working" : "Clocked Out"}
    </span>
  );
}

function AttendanceSkeleton() {
  return (
    <div
      className="attendance-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading attendance"
    >
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div key={index} className="attendance-skeleton__row" />
      ))}
    </div>
  );
}

function AttendanceEmptyState() {
  return (
    <div className="attendance-empty">
      <Clock3 size={34} aria-hidden="true" />

      <h3>No employees found</h3>

      <p>No employees match the current attendance filters.</p>
    </div>
  );
}

function getInitials(employee) {
  const first = employee?.first_name?.charAt(0)?.toUpperCase() || "";

  const last = employee?.last_name?.charAt(0)?.toUpperCase() || "";

  return `${first}${last}` || "E";
}

function formatClockTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getActiveDuration(clockInValue, currentTime) {
  if (!clockInValue) {
    return "—";
  }

  const clockIn = new Date(clockInValue);

  if (Number.isNaN(clockIn.getTime())) {
    return "—";
  }

  const totalMinutes = Math.max(
    0,
    Math.floor((currentTime - clockIn.getTime()) / 60000),
  );

  const hours = Math.floor(totalMinutes / 60);

  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}
