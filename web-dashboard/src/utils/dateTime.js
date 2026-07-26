function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatDate(value) {
  const date = parseDate(value);

  if (!date) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(value) {
  const date = parseDate(value);

  if (!date) {
    return "—";
  }

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateTime(value) {
  const date = parseDate(value);

  if (!date) {
    return "—";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatMinutes(totalMinutes) {
  const minutes = Number(totalMinutes);

  if (!Number.isFinite(minutes) || minutes < 0) {
    return "—";
  }

  const wholeMinutes = Math.round(minutes);
  const hours = Math.floor(wholeMinutes / 60);
  const remainingMinutes = wholeMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}
