/**
 * authStore.js
 * Role-based authentication state.
 *
 * ✅ Role is ONLY ever set from the backend JWT response.
 * ✅ switchRole() removed — no client-side role override.
 * ✅ refreshUser() updates state when /auth/me re-validates the token.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ROLES = {
  CASHIER: "cashier",
  MANAGER: "manager",
  ADMIN:   "admin",
};

export const useAuthStore = create(
  persist(
    (set) => ({
      user:            null,
      role:            null,
      isAuthenticated: false,
      token:           null,

      /** Called on successful login — userData.role comes from the JWT payload */
      login: (userData, token) =>
        set({
          user:            userData,
          role:            userData.role,   // ← only source of truth
          isAuthenticated: true,
          token,
        }),

      /**
       * Called on app boot after /auth/me validates the token.
       * Keeps role in sync with whatever the backend says.
       */
      refreshUser: (userData) =>
        set((state) => ({
          user: userData,
          role: userData.role,             // ← backend wins, always
          isAuthenticated: true,
          token: state.token,              // keep existing token
        })),

      logout: () =>
        set({
          user:            null,
          role:            null,
          isAuthenticated: false,
          token:           null,
        }),
    }),
    { name: "pos-auth" }
  )
);

// ─── Permission helpers ──────────────────────────────────────────
// All permission checks go through here so there's one place to audit.

export const canManageInventory = (role) =>
  [ROLES.ADMIN, ROLES.MANAGER].includes(role);

export const canApplyDiscounts = (role) =>
  [ROLES.ADMIN, ROLES.MANAGER].includes(role);

export const canViewReports = (role) =>
  [ROLES.ADMIN, ROLES.MANAGER].includes(role);

export const canDeleteProducts = (role) =>
  role === ROLES.ADMIN;