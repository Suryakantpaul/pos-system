/**
 * authStore.js
 * Role-based authentication state (cashier | admin | manager)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ROLES = {
  CASHIER: "cashier",
  MANAGER: "manager",
  ADMIN: "admin",
};

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      token: null,

      login: (userData, token) =>
        set({
          user: userData,
          role: userData.role,
          isAuthenticated: true,
          token,
        }),

      logout: () =>
        set({
          user: null,
          role: null,
          isAuthenticated: false,
          token: null,
        }),

      // Demo: quick-switch role for UI preview
      switchRole: (role) =>
        set((state) => ({
          role,
          user: state.user ? { ...state.user, role } : null,
        })),
    }),
    { name: "pos-auth" }
  )
);

/** Permission helpers */
export const canManageInventory = (role) =>
  [ROLES.ADMIN, ROLES.MANAGER].includes(role);

export const canApplyDiscounts = (role) =>
  [ROLES.ADMIN, ROLES.MANAGER].includes(role);

export const canViewReports = (role) =>
  [ROLES.ADMIN, ROLES.MANAGER].includes(role);
