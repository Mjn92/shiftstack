"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";

import Sidebar from "./Sidebar";

export default function MobileNavigation({
  menuOpen,
  onOpenMenu,
  onCloseMenu,
}) {
  return (
    <>
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-header__menu-button"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation-drawer"
        >
          <Menu size={24} aria-hidden="true" />
        </button>

        <Link href="/dashboard" className="mobile-header__brand">
          <span className="mobile-header__logo" aria-hidden="true">
            S
          </span>

          <span>ShiftStack</span>
        </Link>

        <Link
          href="/notifications"
          className="mobile-header__notification-link"
          aria-label="Open notifications"
        >
          Notifications
        </Link>
      </header>

      {menuOpen && (
        <div
          className="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="ShiftStack navigation"
        >
          <button
            type="button"
            className="mobile-drawer__backdrop"
            onClick={onCloseMenu}
            aria-label="Close navigation menu"
          />

          <div className="mobile-drawer__panel" id="mobile-navigation-drawer">
            <div className="mobile-drawer__header">
              <span>Navigation</span>

              <button
                type="button"
                className="mobile-drawer__close"
                onClick={onCloseMenu}
                aria-label="Close navigation menu"
              >
                <X size={24} aria-hidden="true" />
              </button>
            </div>

            <Sidebar mobile onNavigate={onCloseMenu} />
          </div>
        </div>
      )}
    </>
  );
}
