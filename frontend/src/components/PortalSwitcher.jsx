import React from "react";
import { useNavigate } from "react-router-dom";
import {
  getActivePortalRole,
  getAvailablePortalRoles,
  getPortalLabel,
  getPortalPath,
  setStoredPortalRole,
} from "../utils/portalSwitch";

const PortalSwitcher = ({ user, currentRole, darkMode = true }) => {
  const navigate = useNavigate();
  const roles = getAvailablePortalRoles(user);

  if (roles.length < 2) return null;

  const activeRole = getActivePortalRole(user, currentRole);

  const handleSwitch = (role) => {
    const path = getPortalPath(role);
    if (!path) return;
    setStoredPortalRole(role);
    navigate(path);
  };

  return (
    <div
      className={`mt-3 rounded-lg border p-2 ${
        darkMode ? "border-gray-600 bg-gray-800/60" : "border-gray-300 bg-white"
      }`}
    >
      <p className={`mb-2 text-[11px] font-semibold uppercase ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
        Switch Portal
      </p>
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => {
          const selected = role === activeRole;
          return (
            <button
              key={role}
              type="button"
              onClick={() => handleSwitch(role)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                selected
                  ? "bg-indigo-600 text-white"
                  : darkMode
                    ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {getPortalLabel(role)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PortalSwitcher;
