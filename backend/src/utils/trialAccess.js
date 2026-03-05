const TRIAL_CODE_PREFIX = "TRL";
const TRIAL_DEPARTMENT = "TRIAL";
const TRIAL_DESIGNATION_PREFIX = "TRIAL ACCESS:";
const LEGACY_TRIAL_PREFIX = "TRIAL ";

const ACCESS_ORDER = ["EMPLOYEE", "MANAGER", "ADMIN"];

const normalizeRole = (value) => String(value || "").trim().toUpperCase();

export const normalizeTrialAccessRoles = (input) => {
  const values = Array.isArray(input) ? input : [input];
  const allowed = new Set(ACCESS_ORDER);
  const unique = [];

  for (const raw of values) {
    const role = normalizeRole(raw);
    if (!role || !allowed.has(role) || unique.includes(role)) continue;
    unique.push(role);
  }

  return unique.length ? unique : ["EMPLOYEE"];
};

export const getPrimaryRoleFromTrialAccess = (trialAccessRoles = []) => {
  const roles = normalizeTrialAccessRoles(trialAccessRoles);
  if (roles.includes("ADMIN")) return "ADMIN";
  if (roles.includes("MANAGER")) return "MANAGER";
  return "EMPLOYEE";
};

export const serializeTrialAccessInDesignation = (trialAccessRoles = []) => {
  const roles = normalizeTrialAccessRoles(trialAccessRoles);
  return `${TRIAL_DESIGNATION_PREFIX} ${roles.join(", ")}`;
};

export const parseTrialAccessFromEmployee = (employee) => {
  const code = normalizeRole(employee?.employeeCode);
  const department = normalizeRole(employee?.department);
  const designation = String(employee?.designation || "").trim();
  const designationUpper = designation.toUpperCase();

  const trialByProfile =
    code.startsWith(TRIAL_CODE_PREFIX) ||
    department === TRIAL_DEPARTMENT ||
    designationUpper.startsWith(TRIAL_DESIGNATION_PREFIX);

  if (!trialByProfile) {
    return { isTrial: false, trialAccessRoles: [] };
  }

  const encodedRoles = designationUpper.startsWith(TRIAL_DESIGNATION_PREFIX)
    ? designationUpper
        .replace(TRIAL_DESIGNATION_PREFIX, "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : designationUpper.startsWith(LEGACY_TRIAL_PREFIX)
      ? [designationUpper.replace(LEGACY_TRIAL_PREFIX, "").trim()]
      : [];

  return {
    isTrial: true,
    trialAccessRoles: normalizeTrialAccessRoles(encodedRoles),
  };
};
