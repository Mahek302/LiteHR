import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiFilter, FiBriefcase, FiUsers, FiClock, FiEdit2, FiEye, FiTrash2,   } from "react-icons/fi";
import jobService from "../../../services/jobService";
import { toast } from "react-hot-toast";
import { useTheme, useThemeClasses } from "../../../contexts/ThemeContext";
import { FaChartGantt } from "react-icons/fa6";


const JobList = () => {
  const darkMode = useTheme() || false;
  const theme = useThemeClasses();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, departmentFilter, search]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (statusFilter !== "All") filters.status = statusFilter;
      if (departmentFilter !== "All") filters.department = departmentFilter;

      const data = await jobService.getJobs(filters);
      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job posting?")) return;
    try {
      await jobService.deleteJob(id);
      toast.success("Job deleted successfully");
      fetchJobs();
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job");
    }
  };

  // Stats calculation
  const totalJobs = jobs.filter(j => j.status === 'Active').length;
  const allApplications = jobs.flatMap(job => job.applications || []);
  const totalApplicants = allApplications.length;
  const totalInterviews = allApplications.filter(a => a.status === 'Interview').length;
  const totalHired = allApplications.filter(a => a.status === 'Hired').length;
  const hiringRate = totalApplicants > 0 ? Math.round((totalHired / totalApplicants) * 100) : 0;

  // Client-side search filtering
  const filtered = jobs.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase().trim()) ||
    job.department.toLowerCase().includes(search.toLowerCase().trim())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return darkMode ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border border-emerald-300";
      case "Closed": return darkMode ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-rose-100 text-rose-700 border border-rose-300";
      case "Draft": return darkMode ? "bg-gray-600/30 text-gray-200 border border-gray-500/40" : "bg-gray-100 text-gray-700 border border-gray-300";
      default: return darkMode ? "bg-gray-600/30 text-gray-200 border border-gray-500/40" : "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  const getDepartmentColor = (department) => {
    switch (department) {
      case "IT": return darkMode ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-blue-100 text-blue-700 border border-blue-300";
      case "HR": return darkMode ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" : "bg-pink-100 text-pink-700 border border-pink-300";
      case "Finance": return darkMode ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border border-emerald-300";
      case "Marketing": return darkMode ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-purple-100 text-purple-700 border border-purple-300";
      default: return darkMode ? "bg-gray-600/30 text-gray-200 border border-gray-500/40" : "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

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
                Job Openings
              </h1>
              <p className={getSecondaryTextColor()}>
                Manage and track all job postings and applications.
              </p>
            </div>
            <Link
              to="/admin/recruitment/add-job"
              className="relative group"
            >
              <div className="hidden"></div>
              <div className="relative bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-sm transition-all duration-300 font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Job Posting
              </div>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative group">
              <div className="hidden"></div>
              <div className={`relative ${getStatsCardBg()} backdrop-blur-sm rounded-xl p-5 border ${getStatsBorderColor()} ${darkMode ? "bg-gradient-to-br from-blue-500/10 to-slate-900/80" : "bg-gradient-to-br from-blue-50 to-white"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>Active Jobs</p>
                    <h3 className={`text-3xl font-bold ${getTextColor()} mt-2`}>{totalJobs}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <FiBriefcase className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="hidden"></div>
              <div className={`relative ${getStatsCardBg()} backdrop-blur-sm rounded-xl p-5 border ${getStatsBorderColor()} ${darkMode ? "bg-gradient-to-br from-emerald-500/10 to-slate-900/80" : "bg-gradient-to-br from-emerald-50 to-white"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>Total Applicants</p>
                    <h3 className={`text-3xl font-bold ${getTextColor()} mt-2`}>{totalApplicants}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                    <FiUsers className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="hidden"></div>
              <div className={`relative ${getStatsCardBg()} backdrop-blur-sm rounded-xl p-5 border ${getStatsBorderColor()} ${darkMode ? "bg-gradient-to-br from-amber-500/10 to-slate-900/80" : "bg-gradient-to-br from-amber-50 to-white"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>Interviews</p>
                    <h3 className={`text-3xl font-bold ${getTextColor()} mt-2`}>{totalInterviews}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <FiClock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="hidden"></div>
              <div className={`relative ${getStatsCardBg()} backdrop-blur-sm rounded-xl p-5 border ${getStatsBorderColor()} ${darkMode ? "bg-gradient-to-br from-violet-500/10 to-slate-900/80" : "bg-gradient-to-br from-violet-50 to-white"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>Hiring Rate</p>
                    <h3 className={`text-3xl font-bold ${getTextColor()} mt-2`}>{hiringRate}%</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
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
                  placeholder="Search jobs by title or department..."
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
                <option value="Active" className={darkMode ? "bg-gray-800" : "bg-white"}>Active</option>
                <option value="Closed" className={darkMode ? "bg-gray-800" : "bg-white"}>Closed</option>
                <option value="Draft" className={darkMode ? "bg-gray-800" : "bg-white"}>Draft</option>
              </select>
              <select
                className={`px-4 py-3 ${getInputBg()} border ${darkMode ? 'border-slate-700/60' : 'border-slate-300'} rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${getTextColor()}`}
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="All" className={darkMode ? "bg-gray-800" : "bg-white"}>All Departments</option>
                <option value="IT" className={darkMode ? "bg-gray-800" : "bg-white"}>IT</option>
                <option value="HR" className={darkMode ? "bg-gray-800" : "bg-white"}>HR</option>
                <option value="Finance" className={darkMode ? "bg-gray-800" : "bg-white"}>Finance</option>
                <option value="Marketing" className={darkMode ? "bg-gray-800" : "bg-white"}>Marketing</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="relative group">
        <div className="hidden"></div>
        <div className={`relative ${getCardBg()} rounded-2xl border ${darkMode ? 'border-slate-700/60' : 'border-indigo-100'} overflow-hidden shadow-sm`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? "bg-slate-800/70" : "bg-gradient-to-r from-violet-50 to-indigo-50"}>
                <tr>
                  <th className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} text-left text-sm font-semibold ${getTextColor()}`}>
                    Job Title
                  </th>
                  <th className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} text-left text-sm font-semibold ${getTextColor()}`}>
                    Department
                  </th>
                  <th className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} text-left text-sm font-semibold ${getTextColor()}`}>
                    Applicants
                  </th>
                  <th className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} text-left text-sm font-semibold ${getTextColor()}`}>
                    Posted Date
                  </th>
                  <th className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} text-left text-sm font-semibold ${getTextColor()}`}>
                    Deadline
                  </th>
                  <th className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} text-left text-sm font-semibold ${getTextColor()}`}>
                    Status
                  </th>
                  <th className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} text-left text-sm font-semibold ${getTextColor()}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr key={job.id} className={`${darkMode ? 'hover:bg-slate-800/35' : 'hover:bg-violet-50/40'} transition-colors group/row`}>
                    <td className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      <div>
                        <p className={`font-medium ${getTextColor()}`}>{job.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} ${darkMode ? 'text-gray-300' : 'text-gray-600'} px-2 py-1 rounded`}>
                            {job.jobType || job.type}
                          </span>
                          <span className={`text-xs ${getSecondaryTextColor()}`}>{job.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${getDepartmentColor(job.department)}`}>
                        {job.department}
                      </span>
                    </td>
                    <td className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <FiUsers className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`font-medium ${getTextColor()}`}>{job.applications?.length || 0}</span>
                        <Link
                          to={`/admin/recruitment/applications?job=${job.id}`}
                          className="text-xs text-blue-500 hover:text-blue-600"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                    <td className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      <p className={getTextColor()}>{new Date(job.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <FiClock className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`font-medium ${new Date(job.deadline) < new Date() && job.status === "Active"
                          ? "text-rose-500"
                          : getTextColor()
                          }`}>
                          {new Date(job.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                        <span className={`w-2 h-2 rounded-full bg-white`}></span>
                        {job.status}
                      </span>
                    </td>
                    <td className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      <div className="flex gap-2">
                        <Link
                          to={`/admin/recruitment/jobs/${job.id}`}
                          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'} text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors`}
                          title="View"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/recruitment/edit-job/${job.id}`}
                          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'} text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors`}
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'} text-rose-500 hover:text-rose-600 transition-colors`}
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <div className="max-w-md mx-auto">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${getInputBg()} border ${darkMode ? 'border-white/10' : 'border-gray-300'} flex items-center justify-center`}>
                          <FiBriefcase className={`w-8 h-8 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        </div>
                        <h3 className={`text-lg font-medium ${getTextColor()} mb-2`}>No job openings found</h3>
                        <p className={`${getSecondaryTextColor()} mb-4`}>Try adjusting your search or filter criteria</p>
                        <Link
                          to="/admin/recruitment/add-job"
                          className="text-blue-500 hover:text-blue-600 font-medium"
                        >
                          Create your first job posting
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`px-6 py-4 border-t ${darkMode ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between`}>
            <div className={`text-sm ${getSecondaryTextColor()}`}>
              Showing <span className={`font-medium ${getTextColor()}`}>1-{filtered.length}</span> of{" "}
              <span className={`font-medium ${getTextColor()}`}>{jobs.length}</span> jobs
            </div>
            <div className="flex gap-2">
              <button className={`px-3 py-2 ${getInputBg()} border ${darkMode ? 'border-white/20' : 'border-gray-300'} ${getSecondaryTextColor()} rounded-lg ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'} disabled:opacity-50`}>
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

export default JobList;
