export function getTodayEntries(entries = [], date = new Date()) {
  if (!Array.isArray(entries)) {
    return [];
  }

  const targetDate = date.toDateString();

  return entries.filter((entry) => {
    if (!entry?.clock_in) {
      return false;
    }

    const clockIn = new Date(entry.clock_in);

    if (Number.isNaN(clockIn.getTime())) {
      return false;
    }

    return clockIn.toDateString() === targetDate;
  });
}

export function getCompletedEntries(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.filter((entry) => {
    return entry?.status === "closed" && Boolean(entry?.clock_out);
  });
}

export function calculateTotalMinutes(entries = []) {
  if (!Array.isArray(entries)) {
    return 0;
  }

  return entries.reduce((total, entry) => {
    const minutes = Number(entry?.total_minutes);

    if (!Number.isFinite(minutes) || minutes < 0) {
      return total;
    }

    return total + minutes;
  }, 0);
}
