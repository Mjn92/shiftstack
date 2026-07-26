"use client";

import { useCallback, useEffect, useState } from "react";

import api from "../api/api";

export default function useUnreadNotifications(enabled = true) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      const response = await api.get("/notifications/unread-count");

      setUnreadCount(Number(response.data?.unread_count) || 0);
    } catch (err) {
      console.error("Unread notification count error:", err);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUnreadCount();
  }, [enabled, refreshUnreadCount]);

  return {
    unreadCount,
    refreshUnreadCount,
  };
}
