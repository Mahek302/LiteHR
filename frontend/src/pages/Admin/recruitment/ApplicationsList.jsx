import { FaChartGantt } from "react-icons/fa6";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiFilter, FiUser, FiMail, FiPhone, FiCalendar, FiDownload, FiEye, FiCheck, FiX,  } from "react-icons/fi";
import jobService from "../../../services/jobService";
import { toast } from "react-hot-toast";
import { useTheme, useThemeClasses } from "../../../contexts/ThemeContext";

const ApplicationsList = () => {
  const darkMode = useTheme() || false;
  const theme = useThemeClasses();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [jobFilter, setJobFilter] = useState("All");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    interview: 0,
    hired: 0,
    avgMatch: 0
  });

  const fetchApplications = async () => {
    try {
      const data = await jobService.getJobApplications();
      const apps = data.applications || data.rows || (Array.isArray(data) ? data : []);
      setApplications(apps);
      calculateStats(apps);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      toast.error("Failed to load applications");
      setLoading(false);
      setApplications([]);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const calculateStats = (apps) => {
    const stats = {
      total: apps.length,
      new: apps.filter(a => a.status === 'New').length,
      interview: apps.filter(a => a.status === 'Interview').length,
      hired: apps.filter(a => a.status === 'Hired').length,
      avgMatch: 0
    };
    setStats(stats);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await jobService.updateJobApplicationStatus(id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchApplications();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const filtered = applications
    .filter(app => {
      const title = app.job?.title || "";
      const name = app.name || "";
      return name.toLowerCase().includes(search.toLowerCase().trim()) ||
        title.toLowerCase().includes(search.toLowerCase().trim());
    })
    .filter(app =>
      statusFilter === "All" ? true : app.status === statusFilter
    )
    .filter(app =>
      jobFilter === "All" ? true : (app.job?.title === jobFilter)
    );

  const getStatusColor = (status) => {
    switch (status) {
      case "New": return darkMode ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-blue-100 text-blue-700 border border-blue-300";
      case "Reviewed": return darkMode ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-amber-100 text-amber-700 border border-amber-300";
      case "Interview": return darkMode ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-purple-100 text-purple-700 border border-purple-300";
      case "Hired": return darkMode ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border border-emerald-300";
      case "Rejected": return darkMode ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-rose-100 text-rose-700 border border-rose-300";
      default: return darkMode ? "bg-gray-600/30 text-gray-200 border border-gray-500/40" : "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  const getMatchColor = (score) => {
    if (!score) return darkMode ? "text-gray-500" : "text-gray-400";
    if (score >= 80) return "text-emerald-500 dark:text-emerald-400";
    if (score >= 60) return "text-amber-500 dark:text-amber-400";
    return "text-rose-500 dark:text-rose-400";
  };

  const uniqueJobs = ["All", ...new Set(applications.map(app => app.job?.title).filter(Boolean))];

  // Theme helper functions
  const getBgColor = () => darkMode ? "bg-slate-950" : "bg-white";
  const getBorderColor = () => darkMode ? "border-slate-700/70" : "border-slate-200";
  const getTextColor = () => darkMode ? "text-slate-100" : "text-slate-800";
  const getSecondaryTextColor = () => darkMode ? "text-slate-300" : "text-slate-600";
  const getInputBg = () => darkMode ? "bg-slate-900/80" : "bg-slate-50";
  const getCardBg = () => darkMode ? "bg-slate-900/75" : "bg-white/95";
  const getHeaderBg = () =>
    darkMode
      ? "from-slate-950 via-indigo-950/20 to-emerald-950/20"
      : "from-violet-100 via-indigo-50 to-emerald-100/70";
  const getStatsCardBg = () => darkMode ? "bg-slate-900/70" : "bg-white/90";
  const getStatsBorderColor = () => darkMode ? "border-slate-700/60" : "border-slate-200/80";

  return (
    <div className="w-full">
      {/* Header */}
      <div className={`relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-br ${getHeaderBg()} p-8 border ${getBorderColor()}`}>
        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl ${darkMode ? "bg-violet-500/20" : "bg-violet-300/40"}`} />
        <div className={`absolute -bottom-12 -left-10 w-44 h-44 rounded-full blur-3xl ${darkMode ? "bg-emerald-500/20" : "bg-emerald-300/40"}`} />
        <div className={`absolute inset-0 ${darkMode ? 'opacity-20' : 'opacity-10'}`} style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='${darkMode ? '0.1' : '0.05'}'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className={`text-4xl font-bold ${getTextColor()} mb-2`}>
                Job Applications
              </h1>
              <p className={getSecondaryTextColor()}>
                Review and manage all job applications.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="relative group">
                <div className="hidden"></div>

              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative group">
              <div className="hidden"></div>
              <div className={`relative ${getStatsCardBg()} backdrop-blur-sm rounded-xl p-5 border ${getStatsBorderColor()} ${darkMode ? "bg-gradient-to-br from-blue-500/10 to-slate-900/80" : "bg-gradient-to-br from-blue-50 to-white"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>Total</p>
                    <h3 className={`text-3xl font-bold ${getTextColor()} mt-2`}>{stats.total}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <FiUser className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="hidden"></div>
              <div className={`relative ${getStatsCardBg()} backdrop-blur-sm rounded-xl p-5 border ${getStatsBorderColor()} ${darkMode ? "bg-gradient-to-br from-amber-500/10 to-slate-900/80" : "bg-gradient-to-br from-amber-50 to-white"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>New</p>
                    <h3 className={`text-3xl font-bold ${getTextColor()} mt-2`}>{stats.new}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">!</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="hidden"></div>
              <div className={`relative ${getStatsCardBg()} backdrop-blur-sm rounded-xl p-5 border ${getStatsBorderColor()} ${darkMode ? "bg-gradient-to-br from-violet-500/10 to-slate-900/80" : "bg-gradient-to-br from-violet-50 to-white"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>Interview</p>
                    <h3 className={`text-3xl font-bold ${getTextColor()} mt-2`}>{stats.interview}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <FiCalendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="hidden"></div>
              <div className={`relative ${getStatsCardBg()} backdrop-blur-sm rounded-xl p-5 border ${getStatsBorderColor()} ${darkMode ? "bg-gradient-to-br from-emerald-500/10 to-slate-900/80" : "bg-gradient-to-br from-emerald-50 to-white"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>Hired</p>
                    <h3 className={`text-3xl font-bold ${getTextColor()} mt-2`}>{stats.hired}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                    <FiCheck className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="hidden"></div>
              <div className={`relative ${getStatsCardBg()} backdrop-blur-sm rounded-xl p-5 border ${getStatsBorderColor()} ${darkMode ? "bg-gradient-to-br from-slate-500/10 to-slate-900/80" : "bg-gradient-to-br from-slate-100 to-white"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>Avg. Match</p>
                    <h3 className={`text-3xl font-bold ${getTextColor()} mt-2`}>{stats.avgMatch}%</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                    <FaChartGantt className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="relative group mb-6">
        <div className="hidden"></div>
        <div className={`relative ${getCardBg()} rounded-2xl p-6 border ${darkMode ? 'border-slate-700/60' : 'border-indigo-100'} shadow-sm`}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search applications by name or job title..."
                  className={`w-full pl-12 pr-4 py-3 ${getInputBg()} border ${darkMode ? 'border-slate-700/60' : 'border-slate-300'} rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${getTextColor()} ${darkMode ? 'placeholder-slate-500' : 'placeholder-slate-400'} transition-all`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                className={`px-4 py-3 ${getInputBg()} border ${darkMode ? 'border-slate-700/60' : 'border-slate-300'} rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${getTextColor()}`}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All" className={darkMode ? "bg-gray-800" : "bg-white"}>All Status</option>
                <option value="New" className={darkMode ? "bg-gray-800" : "bg-white"}>New</option>
                <option value="Reviewed" className={darkMode ? "bg-gray-800" : "bg-white"}>Reviewed</option>
                <option value="Interview" className={darkMode ? "bg-gray-800" : "bg-white"}>Interview</option>
                <option value="Hired" className={darkMode ? "bg-gray-800" : "bg-white"}>Hired</option>
                <option value="Rejected" className={darkMode ? "bg-gray-800" : "bg-white"}>Rejected</option>
              </select>
              <select
                className={`px-4 py-3 ${getInputBg()} border ${darkMode ? 'border-slate-700/60' : 'border-slate-300'} rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${getTextColor()}`}
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
              >
                {uniqueJobs.map(job => (
                  <option key={job} value={job} className={darkMode ? "bg-gray-800" : "bg-white"}>{job}</option>
                ))}
              </select>
              <button className={`flex items-center gap-2 px-4 py-3 ${getInputBg()} border ${darkMode ? 'border-slate-700/60' : 'border-slate-300'} rounded-lg ${darkMode ? 'hover:bg-slate-800/70' : 'hover:bg-violet-50'} ${getTextColor()}`}>
                <FiFilter className="w-4 h-4" />
                More Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="relative group">
        <div className="hidden"></div>
        <div className={`relative ${getCardBg()} rounded-2xl border ${darkMode ? 'border-slate-700/60' : 'border-indigo-100'} overflow-hidden shadow-sm`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? "bg-slate-800/70" : "bg-gradient-to-r from-violet-50 to-indigo-50"}>
                <tr>
                  <th className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} text-left text-sm font-semibold ${getTextColor()}`}>
                    Candidate
                  </th>
                  <th className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} text-left text-sm font-semibold ${getTextColor()}`}>
                    Applied For
                  </th>
                  <th className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} text-left text-sm font-semibold ${getTextColor()}`}>
                    Match Score
                  </th>
                  <th className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} text-left text-sm font-semibold ${getTextColor()}`}>
                    Applied Date
                  </th>
                  <th className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} text-left text-sm font-semibold ${getTextColor()}`}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className={`p-4 text-center ${getTextColor()}`}>Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <div className="max-w-md mx-auto">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${getInputBg()} border ${darkMode ? 'border-white/10' : 'border-gray-300'} flex items-center justify-center`}>
                          <FiUser className={`w-8 h-8 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        </div>
                        <h3 className={`text-lg font-medium ${getTextColor()} mb-2`}>No applications found</h3>
                        <p className={`${getSecondaryTextColor()} mb-4`}>Try adjusting your search or filter criteria</p>
                        <button
                          onClick={() => {
                            setSearch("");
                            setStatusFilter("All");
                            setJobFilter("All");
                          }}
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((app) => (
                  <tr key={app.id} className={`${darkMode ? 'hover:bg-slate-800/35' : 'hover:bg-violet-50/40'} transition-colors group/row`}>
                    <td className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-bold">
                          {app.name.charAt(0)}
                        </div>
                        <div>
                          <p className={`font-medium ${getTextColor()}`}>{app.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <FiMail className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">{app.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      <div>
                        <p className={`font-medium ${getTextColor()}`}>{app.job?.title}</p>
                        <p className={`text-sm ${getSecondaryTextColor()}`}>{app.job?.department}</p>
                      </div>
                    </td>
                    <td className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">N/A</span>
                      </div>
                    </td>
                    <td className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <FiCalendar className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={getTextColor()}>{new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      <div className="flex gap-2">
                        <Link
                          to={`/admin/recruitment/applications/${app.id}`}
                          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'} text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
                          title="View Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        {app.status === 'New' && (
                          <button
                            onClick={() => handleStatusChange(app.id, 'Reviewed')}
                            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'} text-emerald-500 hover:text-emerald-600 transition-colors`}
                            title="Mark Reviewed"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`px-6 py-4 border-t ${darkMode ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between`}>
            <div className={`text-sm ${getSecondaryTextColor()}`}>
              Showing <span className={`font-medium ${getTextColor()}`}>1-{filtered.length}</span> of{" "}
              <span className={`font-medium ${getTextColor()}`}>{applications.length}</span> applications
            </div>
            <div className="flex gap-2">
              <button className={`px-3 py-2 ${getInputBg()} border ${darkMode ? 'border-white/20' : 'border-gray-300'} ${getSecondaryTextColor()} rounded-lg ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'} disabled:opacity-50`} disabled>
                Previous
              </button>
              <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                1
              </button>
              <button className={`px-3 py-2 ${getInputBg()} border ${darkMode ? 'border-white/20' : 'border-gray-300'} ${getSecondaryTextColor()} rounded-lg ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'}`}>
                2
              </button>
              <button className={`px-3 py-2 ${getInputBg()} border ${darkMode ? 'border-white/20' : 'border-gray-300'} ${getSecondaryTextColor()} rounded-lg ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'}`}>
                3
              </button>
              <button className={`px-3 py-2 ${getInputBg()} border ${darkMode ? 'border-white/20' : 'border-gray-300'} ${getSecondaryTextColor()} rounded-lg ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'}`}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsList;
