export function formatDashboardDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getTodayEntries(entries = [], date = new Date()) {
  const today = date.toDateString();

  return entries.filter((entry) => {
    if (!entry?.clock_in) {
      return false;
    }

    return new Date(entry.clock_in).toDateString() === today;
  });
}

export function calculateTotalMinutes(entries = []) {
  return entries.reduce((total, entry) => {
    return total + (Number(entry?.total_minutes) || 0);
  }, 0);
}

export function formatHours(minutes = 0) {
  return (minutes / 60).toFixed(2);
}

export function getLastEntry(entries = []) {
  return entries.length > 0 ? entries[0] : null;
}

export function isManager(role) {
  return role === "manager" || role === "admin";
}

export function isAdmin(role) {
  return role === "admin";
}
