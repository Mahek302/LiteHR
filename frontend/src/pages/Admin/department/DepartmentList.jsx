import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FiGrid, FiList, FiPlus, FiSearch, FiUsers, FiEdit2 } from "react-icons/fi";
import { HiOutlineOfficeBuilding, HiOutlineCheckCircle } from "react-icons/hi";
import { useTheme, getThemeClasses } from "../../../contexts/ThemeContext";

const DepartmentList = () => {
  const darkMode = useTheme();
  const theme = getThemeClasses(darkMode);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/departments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDepartments(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to load departments:", error);
      }
    };
    fetchDepartments();
  }, []);

  const filteredDepartments = useMemo(
    () =>
      departments.filter((dept) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return (
          String(dept.name || "").toLowerCase().includes(query) ||
          String(dept.head?.fullName || "").toLowerCase().includes(query) ||
          String(dept.code || "").toLowerCase().includes(query)
        );
      }),
    [departments, search]
  );

  const totalEmployees = departments.reduce((sum, d) => sum + Number(d.employeeCount || 0), 0);
  const activeDepartments = departments.filter((d) => d.isActive).length;

  return (
    <div className={`min-h-screen ${theme.bg.primary} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div
          className={`mb-8 rounded-2xl border ${theme.border.primary} p-6 md:p-8 relative overflow-hidden ${
            darkMode
              ? "bg-gradient-to-br from-slate-900/90 via-violet-900/20 to-emerald-900/20"
              : "bg-gradient-to-br from-violet-100 via-indigo-50 to-emerald-100/70"
          }`}
        >
          <div className={`absolute -top-8 -right-8 w-36 h-36 rounded-full blur-3xl ${darkMode ? "bg-violet-500/20" : "bg-violet-300/45"}`} />
          <div className={`absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl ${darkMode ? "bg-emerald-500/20" : "bg-emerald-300/45"}`} />
          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className={`text-3xl font-bold ${theme.text.primary} mb-1`}>Departments</h1>
              <p className={theme.text.secondary}>Manage and organize all departments.</p>
            </div>
            <Link
              to="/admin/departments/add"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-500 hover:to-green-500 text-white font-medium transition-colors shadow-sm"
            >
              <FiPlus className="w-5 h-5" />
              Add Department
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className={`rounded-xl border ${theme.border.secondary} ${theme.bg.secondary} p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme.text.muted}`}>Total Departments</p>
                <p className={`text-3xl font-bold ${theme.text.primary}`}>{departments.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <HiOutlineOfficeBuilding className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className={`rounded-xl border ${theme.border.secondary} ${theme.bg.secondary} p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme.text.muted}`}>Total Employees</p>
                <p className={`text-3xl font-bold ${theme.text.primary}`}>{totalEmployees}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <FiUsers className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className={`rounded-xl border ${theme.border.secondary} ${theme.bg.secondary} p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme.text.muted}`}>Active Departments</p>
                <p className={`text-3xl font-bold ${theme.text.primary}`}>{activeDepartments}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                <HiOutlineCheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-xl border ${theme.border.secondary} ${theme.bg.secondary} p-5 mb-6`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[260px] max-w-xl">
              <FiSearch className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.text.muted}`} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search departments, heads, or code..."
                className={`w-full pl-11 pr-4 py-3 rounded-lg border ${theme.input.border} ${theme.input.bg} ${theme.input.text} focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
              />
            </div>
            <div className={`inline-flex items-center gap-1 p-1 rounded-lg border ${theme.border.primary} ${theme.bg.tertiary}`}>
              <button
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    : `${theme.text.secondary} hover:text-purple-600`
                }`}
              >
                <FiGrid className="w-4 h-4" />
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    : `${theme.text.secondary} hover:text-purple-600`
                }`}
              >
                <FiList className="w-4 h-4" />
                List
              </button>
            </div>
          </div>
        </div>

        {filteredDepartments.length === 0 && (
          <div className={`rounded-xl border ${theme.border.primary} ${theme.bg.secondary} p-12 text-center`}>
            <h3 className={`text-lg font-semibold ${theme.text.primary} mb-2`}>No departments found</h3>
            <p className={theme.text.secondary}>{search ? "Try a different search query." : "Create your first department to get started."}</p>
          </div>
        )}

        {filteredDepartments.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDepartments.map((dept) => (
              <div key={dept.id} className={`rounded-xl border ${theme.border.primary} ${theme.bg.secondary} p-5 shadow-sm`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                    <HiOutlineOfficeBuilding className="w-6 h-6 text-white" />
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                      dept.isActive
                        ? darkMode
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                          : "bg-emerald-100 border-emerald-300 text-emerald-700"
                        : darkMode
                        ? "bg-slate-700 border-slate-600 text-slate-300"
                        : "bg-slate-100 border-slate-300 text-slate-700"
                    }`}
                  >
                    {dept.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3 className={`text-xl font-bold ${theme.text.primary} mb-2`}>{dept.name}</h3>
                <div className={`space-y-1 text-sm ${theme.text.secondary} mb-4`}>
                  <p>Code: {dept.code || "N/A"}</p>
                  <p>Head: {dept.head?.fullName || "Not Assigned"}</p>
                  <p>Employees: {dept.employeeCount || 0}</p>
                </div>
                <Link
                  to={`/admin/departments/edit/${dept.id}`}
                  className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium transition-colors"
                >
                  <FiEdit2 className="w-4 h-4" />
                  Edit Department
                </Link>
              </div>
            ))}
          </div>
        )}

        {filteredDepartments.length > 0 && viewMode === "list" && (
          <div className={`rounded-xl border ${theme.border.primary} ${theme.bg.secondary} overflow-hidden shadow-sm`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={darkMode ? "bg-slate-800/80" : "bg-gradient-to-r from-violet-50 to-indigo-50"}>
                  <tr>
                    {["Department", "Head", "Employees", "Status", "Actions"].map((head) => (
                      <th key={head} className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme.text.secondary}`}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((dept) => (
                    <tr key={dept.id} className={darkMode ? "hover:bg-slate-800/40" : "hover:bg-violet-50/40"}>
                      <td className={`px-6 py-4 border-t ${theme.border.primary}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                            <HiOutlineOfficeBuilding className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className={`font-semibold ${theme.text.primary}`}>{dept.name}</p>
                            <p className={`text-xs ${theme.text.muted}`}>{dept.code || "N/A"}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 border-t ${theme.border.primary} ${theme.text.secondary}`}>{dept.head?.fullName || "Not Assigned"}</td>
                      <td className={`px-6 py-4 border-t ${theme.border.primary} ${theme.text.secondary}`}>{dept.employeeCount || 0}</td>
                      <td className={`px-6 py-4 border-t ${theme.border.primary}`}>
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                            dept.isActive
                              ? darkMode
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                : "bg-emerald-100 border-emerald-300 text-emerald-700"
                              : darkMode
                              ? "bg-slate-700 border-slate-600 text-slate-300"
                              : "bg-slate-100 border-slate-300 text-slate-700"
                          }`}
                        >
                          {dept.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className={`px-6 py-4 border-t ${theme.border.primary}`}>
                        <Link
                          to={`/admin/departments/edit/${dept.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentList;
