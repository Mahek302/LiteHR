const PORTAL_PATHS = {
  ADMIN: "/admin/dashboard",
  MANAGER: "/manager/dashboard",
  EMPLOYEE: "/employee/dashboard",
};

const isBrowser = typeof window !== "undefined";

const dedupe = (items) => [...new Set(items)];

export const getPortalPath = (role) => PORTAL_PATHS[String(role || "").toUpperCase()] || null;

export const getPortalLabel = (role) => {
  const normalized = String(role || "").toUpperCase();
  if (normalized === "ADMIN") return "Admin";
  if (normalized === "MANAGER") return "Manager";
  if (normalized === "EMPLOYEE") return "Employee";
  return normalized;
};

export const getAvailablePortalRoles = (user) => {
  const trialRoles = Array.isArray(user?.trialAccessRoles) ? user.trialAccessRoles : [];
  const fallbackRole = user?.role ? [user.role] : [];

  return dedupe(
    [...trialRoles, ...fallbackRole]
      .map((role) => String(role || "").toUpperCase())
      .filter((role) => Boolean(getPortalPath(role)))
  );
};

export const getStoredPortalRole = () => {
  if (!isBrowser) return null;
  return localStorage.getItem("activePortalRole");
};

export const setStoredPortalRole = (role) => {
  if (!isBrowser) return;
  if (!role) {
    localStorage.removeItem("activePortalRole");
    return;
  }
  localStorage.setItem("activePortalRole", String(role).toUpperCase());
};

export const getActivePortalRole = (user, fallbackRole = null) => {
  const roles = getAvailablePortalRoles(user);
  const storedRole = String(getStoredPortalRole() || "").toUpperCase();

  if (storedRole && roles.includes(storedRole)) return storedRole;

  const normalizedFallback = String(fallbackRole || "").toUpperCase();
  if (normalizedFallback && roles.includes(normalizedFallback)) return normalizedFallback;

  return roles[0] || normalizedFallback || null;
};
