import { describe, expect, it } from "vitest";

import {
  calculateTotalMinutes,
  formatDashboardDate,
  formatHours,
  getLastEntry,
  getTodayEntries,
  isAdmin,
  isManager,
} from "./dashboardHelpers";

describe("dashboardHelpers", () => {
  describe("calculateTotalMinutes", () => {
    it("adds total minutes from multiple entries", () => {
      const entries = [
        { total_minutes: 120 },
        { total_minutes: 90 },
        { total_minutes: 30 },
      ];

      expect(calculateTotalMinutes(entries)).toBe(240);
    });

    it("returns zero for an empty array", () => {
      expect(calculateTotalMinutes([])).toBe(0);
    });

    it("ignores missing or invalid total-minute values", () => {
      const entries = [
        { total_minutes: 60 },
        {},
        { total_minutes: null },
        { total_minutes: undefined },
        { total_minutes: "30" },
        { total_minutes: "invalid" },
      ];

      expect(calculateTotalMinutes(entries)).toBe(90);
    });

    it("uses an empty array when no argument is provided", () => {
      expect(calculateTotalMinutes()).toBe(0);
    });
  });

  describe("formatHours", () => {
    it("converts minutes into two-decimal hours", () => {
      expect(formatHours(90)).toBe("1.50");
    });

    it("formats a full eight-hour shift", () => {
      expect(formatHours(480)).toBe("8.00");
    });

    it("returns zero hours when no value is provided", () => {
      expect(formatHours()).toBe("0.00");
    });
  });

  describe("getLastEntry", () => {
    it("returns the first entry as the latest entry", () => {
      const entries = [
        { id: 3, status: "closed" },
        { id: 2, status: "closed" },
        { id: 1, status: "closed" },
      ];

      expect(getLastEntry(entries)).toEqual({
        id: 3,
        status: "closed",
      });
    });

    it("returns null for an empty array", () => {
      expect(getLastEntry([])).toBeNull();
    });

    it("returns null when no argument is provided", () => {
      expect(getLastEntry()).toBeNull();
    });
  });

  describe("getTodayEntries", () => {
    it("returns only entries from the supplied date", () => {
      const selectedDate = new Date("2026-07-20T12:00:00");

      const entries = [
        {
          id: 1,
          clock_in: "2026-07-20T08:00:00",
        },
        {
          id: 2,
          clock_in: "2026-07-20T13:30:00",
        },
        {
          id: 3,
          clock_in: "2026-07-19T09:00:00",
        },
      ];

      expect(getTodayEntries(entries, selectedDate)).toEqual([
        {
          id: 1,
          clock_in: "2026-07-20T08:00:00",
        },
        {
          id: 2,
          clock_in: "2026-07-20T13:30:00",
        },
      ]);
    });

    it("ignores entries without a clock-in value", () => {
      const selectedDate = new Date("2026-07-20T12:00:00");

      const entries = [
        {
          id: 1,
          clock_in: "2026-07-20T08:00:00",
        },
        {
          id: 2,
        },
        {
          id: 3,
          clock_in: null,
        },
      ];

      expect(getTodayEntries(entries, selectedDate)).toHaveLength(1);
    });

    it("returns an empty array when no entries match", () => {
      const selectedDate = new Date("2026-07-20T12:00:00");

      const entries = [
        {
          clock_in: "2026-07-19T08:00:00",
        },
      ];

      expect(getTodayEntries(entries, selectedDate)).toEqual([]);
    });

    it("uses an empty array when no entries are provided", () => {
      expect(getTodayEntries()).toEqual([]);
    });
  });

  describe("formatDashboardDate", () => {
    it("formats a supplied date for display", () => {
      const date = new Date("2026-07-20T12:00:00");

      const formattedDate = formatDashboardDate(date);

      expect(formattedDate).toContain("2026");
      expect(formattedDate).toContain("July");
      expect(formattedDate).toContain("20");
    });
  });

  describe("isManager", () => {
    it("returns true for managers", () => {
      expect(isManager("manager")).toBe(true);
    });

    it("returns true for admins", () => {
      expect(isManager("admin")).toBe(true);
    });

    it("returns false for employees", () => {
      expect(isManager("employee")).toBe(false);
    });

    it("returns false for missing roles", () => {
      expect(isManager()).toBe(false);
    });
  });

  describe("isAdmin", () => {
    it("returns true for admins", () => {
      expect(isAdmin("admin")).toBe(true);
    });

    it("returns false for managers", () => {
      expect(isAdmin("manager")).toBe(false);
    });

    it("returns false for employees", () => {
      expect(isAdmin("employee")).toBe(false);
    });

    it("returns false for missing roles", () => {
      expect(isAdmin()).toBe(false);
    });
  });
});
