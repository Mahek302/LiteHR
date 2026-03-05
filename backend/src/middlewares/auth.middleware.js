import { Employee } from "../models/index.js";
import { verifyToken } from "../utils/jwt.js";
import { parseTrialAccessFromEmployee } from "../utils/trialAccess.js";

const TRIAL_ALLOWED_ROUTES = ["/api/auth/getUser"];

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    req.user = decoded || {};

    let employee = null;
    if (req.user.id) {
      employee = await Employee.findOne({ where: { userId: req.user.id } });
      if (employee) {
        req.user.employeeId = employee.id;
      }
    }

    const trialMeta = parseTrialAccessFromEmployee(employee);
    req.user.isTrial = Boolean(req.user.isTrial || trialMeta.isTrial);
    req.user.trialAccessRoles =
      req.user.trialAccessRoles && req.user.trialAccessRoles.length
        ? req.user.trialAccessRoles
        : trialMeta.trialAccessRoles;

    if (
      req.user.isTrial &&
      !TRIAL_ALLOWED_ROUTES.some((allowedPath) =>
        String(req.originalUrl || "").startsWith(allowedPath)
      )
    ) {
      return res.status(403).json({
        message:
          "Trial account API access is restricted. Use static trial mode only.",
        code: "TRIAL_STATIC_MODE_ONLY",
      });
    }

    return next();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authenticate = authMiddleware;

export const authorize = (roles = []) => {
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!roles.length) {
      return next();
    }

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
};
