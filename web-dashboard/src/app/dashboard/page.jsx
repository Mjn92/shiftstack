"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DashboardCard from "../../components/dashboard/DashboardCard";
import StatusBadge from "../../components/dashboard/StatusBadge";
import QuickActionCard from "../../components/dashboard/QuickActionCard";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

export default function DashboardPage() {
  const router = useRouter();
  const { employee, loading } = useContext(AuthContext);

  const [clockStatus, setClockStatus] = useState(null);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!loading && !employee) {
      router.push("/login");
    }
  }, [loading, employee, router]);

  const loadDashboardData = async () => {
    try {
      const statusResponse = await api.get("/time/status");
      const entriesResponse = await api.get("/time/my-entries");

      setClockStatus(statusResponse.data);
      setEntries(entriesResponse.data);
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  };

  useEffect(() => {
    if (employee) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDashboardData();
    }
  }, [employee]);

  if (loading || !employee) {
    return <p className="p-6">Loading...</p>;
  }

  const today = new Date().toDateString();

  const todaysEntries = entries.filter((entry) => {
    return new Date(entry.clock_in).toDateString() === today;
  });

  const todaysMinutes = todaysEntries.reduce((total, entry) => {
    return total + (entry.total_minutes || 0);
  }, 0);

  const todaysHours = (todaysMinutes / 60).toFixed(2);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-3xl font-bold">
          Welcome back, {employee.first_name}
        </h2>
        <p className="text-gray-500">Here is your ShiftStack dashboard.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <DashboardCard
          title="Current Status"
          value={<StatusBadge status={clockStatus?.clocked_in} />}
        />

        <DashboardCard title="Today's Hours" value={`${todaysHours} hrs`} />

        <DashboardCard title="Role" value={employee.role} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard title="Clock" href="/clock" />
        <QuickActionCard title="Time History" href="/time-history" />
        <QuickActionCard title="Profile" href="/profile" />
      </div>
    </DashboardLayout>
  );
}
