export const NOTIFICATIONS_UPDATED = "shiftstack:notifications-updated";

export function notifyNotificationsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED));
}
