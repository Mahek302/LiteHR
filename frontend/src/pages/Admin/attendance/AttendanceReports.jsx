import { BiLineChart } from "react-icons/bi";
import { AiOutlineAreaChart } from "react-icons/ai";
import { MdTimer } from "react-icons/md";
import { FaCalendarXmark } from "react-icons/fa6";
import { FaCalendarMinus } from "react-icons/fa6";
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { GoCheck } from "react-icons/go";
import {
  FiDownload, FiFilter, FiCalendar, FiUsers, FiClock, FiBarChart2,
  FiPieChart, FiTarget, FiAward
} from "react-icons/fi";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import { useTheme, getThemeClasses } from "../../../contexts/ThemeContext";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { addCorporatePdfHeader, addCorporatePdfFooters, escapeCsvValue } from "../../../utils/corporatePdf";

const AttendanceReports = () => {
  const [reportType, setReportType] = useState("daily");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState(null);
  const [error, setError] = useState(null);
  
  const darkMode = useTheme();
  const themeClasses = getThemeClasses(darkMode);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const departments = [
    { id: "all", name: "All Departments" },
    { id: "IT", name: "IT" },
    { id: "HR", name: "HR" },
    { id: "Finance", name: "Finance" },
    { id: "Operations", name: "Operations" }
  ];

  // Color palette based on theme
  const colors = darkMode ? {
    primary: "#3B82F6",
    secondary: "#10B981",
    tertiary: "#8B5CF6",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    background: "#0F172A",
    card: "#1E293B",
    cardHover: "#334155",
    border: "#475569",
    text: "#F1F5F9",
    textMuted: "#94A3B8",
    grid: "#334155"
  } : {
    primary: "#3B82F6",
    secondary: "#10B981",
    tertiary: "#8B5CF6",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    background: "#F8FAFC",
    card: "#FFFFFF",
    cardHover: "#F1F5F9",
    border: "#E2E8F0",
    text: "#0F172A",
    textMuted: "#64748B",
    grid: "#E2E8F0"
  };

  // Transform charts data for reports
  const trendData = charts?.attendance?.map((item) => ({
    month: item.month,
    attendance: item.present,
    late: Number(item.late || 0)
  })) || [];

  const lateToday = Number(
    dashboard?.lateToday ??
    charts?.lateToday ??
    0
  );
  const presentPercent = dashboard?.totalEmployees
    ? Math.round((dashboard.presentToday / dashboard.totalEmployees) * 100)
    : 0;
  const leavePercent = dashboard?.totalEmployees
    ? Math.round((dashboard.onLeaveToday / dashboard.totalEmployees) * 100)
    : 0;
  const latePercent = dashboard?.totalEmployees
    ? Math.round((lateToday / dashboard.totalEmployees) * 100)
    : 0;
  const absentPercent = Math.max(0, 100 - presentPercent - leavePercent - latePercent);

  const attendanceDistribution = [
    { name: "Present", value: presentPercent, color: "#10b981" },
    { name: "Late", value: latePercent, color: "#f59e0b" },
    { name: "Absent", value: absentPercent, color: "#ef4444" },
    { name: "Leave", value: leavePercent, color: "#3b82f6" },
  ];

  // Overtime data from API - Now using real data from charts
  const overtimeData = charts?.overtime?.map(item => ({
    department: item.department,
    hours: item.hours
  })) || [];

  // Weekly performance (derived from attendance data)
  const weeklyPerformance = charts?.attendance?.slice(0, 7).map((item, index) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index] || "Mon",
    attendance: item.present,
    target: 95
  })) || [];

  // Department stats for table - Using real attendance data
  const departmentStats = charts?.departments?.map(dept => {
    // Calculate attendance rate based on actual attendance data
    const deptAttendance = charts?.attendance?.reduce((acc, item) => acc + item.present, 0) || 0;
    const totalPossible = (charts?.attendance?.length || 1) * (dept.count || 1);
    const attendanceRate = Math.min(100, Math.round((deptAttendance / totalPossible) * 100)) || 85;
    
    return {
      name: dept.department,
      employees: dept.count,
      attendance: attendanceRate,
      late: Number(dept.late || dept.lateCount || 0),
      absent: Number(
        dept.absent ||
        dept.absentCount ||
        Math.max(0, (dept.count || 0) - Math.round(((attendanceRate || 0) / 100) * (dept.count || 0)))
      )
    };
  }) || [];

  const topPerformers = (() => {
    const worklogs = dashboard?.recentWorklogs || [];
    if (!worklogs.length) return [];
    const employeeCounts = new Map();
    for (const item of worklogs) {
      const name = item.employee?.fullName || "Unknown";
      const department = item.employee?.department || "N/A";
      const key = `${name}__${department}`;
      employeeCounts.set(key, (employeeCounts.get(key) || 0) + 1);
    }
    const maxCount = Math.max(...Array.from(employeeCounts.values()), 1);
    return Array.from(employeeCounts.entries())
      .map(([key, count]) => {
        const [name, department] = key.split("__");
        return {
          name,
          department,
          attendance: Math.round((count / maxCount) * 100),
        };
      })
      .sort((a, b) => b.attendance - a.attendance)
      .slice(0, 4);
  })();

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
  const bestWeeklyDay = weeklyPerformance.length
    ? weeklyPerformance.reduce((max, day) => day.attendance > max.attendance ? day : max)
    : { day: "-", attendance: 0, target: 0 };
  const weeklyAverage = weeklyPerformance.length
    ? Math.round(weeklyPerformance.reduce((acc, day) => acc + day.attendance, 0) / weeklyPerformance.length)
    : 0;
  const weeklyGap = weeklyPerformance.length
    ? Math.round(weeklyPerformance.reduce((acc, day) => acc + (day.target - day.attendance), 0) / weeklyPerformance.length)
    : 0;

  // Fetch dashboard & charts data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const query = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
        department: departmentFilter === 'all' ? '' : departmentFilter
      }).toString();

      const [dashRes, chartsRes] = await Promise.all([
        axios.get(`/api/dashboard/admin?${query}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/dashboard/charts/admin?${query}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setDashboard(dashRes.data);
      
      // Transform charts data
      const chartData = {
        attendance: chartsRes.data.attendance?.map((r) => ({
          month: monthNames[(Number(r.month) - 1) % 12] || 'N/A',
          present: Number(r.count)
        })) || null,

        departments: chartsRes.data.departments || null,

        hiring: chartsRes.data.hiring?.map((r) => ({
          month: monthNames[(Number(r.month) - 1) % 12] || 'N/A',
          hired: Number(r.count),
          resigned: 0
        })) || null,

        leaveStats: chartsRes.data.leaveStats?.map(l => ({
          type: l.type,
          count: l.count,
        })) || null,

        performance: chartsRes.data.performance?.map((p, i) => ({
          month: monthNames[i % 12],
          attendance: p.attendance,
          productivity: p.productivity,
          quality: p.quality
        })) || null,

        // This is the key part - overtime data from API
        overtime: chartsRes.data.overtime || [],
        training: chartsRes.data.training || null,
        leaves: chartsRes.data.leaves || null
      };
      
      setCharts(chartData);
      toast.success("Report data loaded successfully");
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load analytics');
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    await fetchData();
  };

  const exportReport = async (format) => {
    const loadingToast = toast.loading("Exporting report...");
    try {
      if (format === "pdf") {
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        let y = await addCorporatePdfHeader(pdf, {
          title: "Attendance Analytics Report",
          subtitle: `${dateRange.start} to ${dateRange.end} | Department: ${departmentFilter === "all" ? "All" : departmentFilter}`,
        });

        const summaryRows = [
          ["Total Employees", String(dashboard?.totalEmployees || 0)],
          ["Present Today", String(dashboard?.presentToday || 0)],
          ["On Leave Today", String(dashboard?.onLeaveToday || 0)],
          ["Avg Attendance", `${dashboard?.totalEmployees ? Math.round((dashboard.presentToday / dashboard.totalEmployees) * 100) : 0}%`],
        ];

        autoTable(pdf, {
          startY: y,
          head: [["Metric", "Value"]],
          body: summaryRows,
          theme: "grid",
          headStyles: { fillColor: [30, 58, 138] },
          margin: { left: 14, right: 14 },
        });

        y = (pdf.lastAutoTable?.finalY || y) + 8;
        autoTable(pdf, {
          startY: y,
          head: [["Department", "Employees", "Attendance %", "Late", "Absent"]],
          body: departmentStats.map((dept) => ([
            dept.name || "N/A",
            String(dept.employees || 0),
            `${dept.attendance || 0}%`,
            String(dept.late || 0),
            String(dept.absent || 0),
          ])),
          theme: "striped",
          headStyles: { fillColor: [30, 58, 138] },
          styles: { fontSize: 9, cellPadding: 2.2 },
          margin: { left: 14, right: 14 },
        });

        y = (pdf.lastAutoTable?.finalY || y) + 8;
        autoTable(pdf, {
          startY: y,
          head: [["Month", "Attendance %", "Late %"]],
          body: trendData.map((item) => ([
            item.month || "N/A",
            `${item.attendance || 0}%`,
            `${item.late || 0}%`,
          ])),
          theme: "striped",
          headStyles: { fillColor: [30, 58, 138] },
          styles: { fontSize: 9, cellPadding: 2.2 },
          margin: { left: 14, right: 14 },
        });

        addCorporatePdfFooters(pdf);
        pdf.save(`attendance_report_${dateRange.start}_to_${dateRange.end}.pdf`);
        toast.dismiss(loadingToast);
        toast.success("PDF exported successfully");
        return;
      }

      if (format === "csv" || format === "excel") {
        const headers = ["Department", "Employees", "AttendanceRate", "LateArrivals", "Absences"];
        const rows = departmentStats.map((dept) => ([
          escapeCsvValue(dept.name || "N/A"),
          escapeCsvValue(dept.employees || 0),
          escapeCsvValue(dept.attendance || 0),
          escapeCsvValue(dept.late || 0),
          escapeCsvValue(dept.absent || 0),
        ].join(",")));

        const csvData = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance_report_${dateRange.start}_to_${dateRange.end}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.dismiss(loadingToast);
        toast.success(`${format === "excel" ? "Excel" : "CSV"} exported successfully`);
      }
    } catch (err) {
      console.error("Export failed:", err);
      toast.dismiss(loadingToast);
      toast.error("Failed to export report");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${themeClasses.bg.primary} p-3 rounded-lg border ${themeClasses.border.primary}`}>
          <p className={themeClasses.text.primary}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
          <p className={themeClasses.text.secondary}>Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-500 mb-2">Error loading data</p>
          <p className={themeClasses.text.secondary}>{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${themeClasses.text.primary}`}>
              Attendance Analytics
            </h1>
            <p className={themeClasses.text.secondary}>
              Comprehensive attendance reports and visual analytics dashboard
            </p>
          </div>
          <FiBarChart2 className="w-12 h-12 text-purple-700" />
        </div>
      </div>

      {/* Report Controls */}
      <div className={`${themeClasses.bg.secondary} rounded-xl p-6 border ${themeClasses.border.primary} mb-8`}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Date Range */}
          <div>
            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className={`w-full px-4 py-3 ${themeClasses.input.bg} border ${themeClasses.input.border} ${themeClasses.input.text} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className={`w-full px-4 py-3 ${themeClasses.input.bg} border ${themeClasses.input.border} ${themeClasses.input.text} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
              Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className={`w-full px-4 py-3 ${themeClasses.input.bg} border ${themeClasses.input.border} ${themeClasses.input.text} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
            >
              {departments.map(dept => (
                <option key={dept.id} value={dept.id} className={darkMode ? 'bg-gray-900' : 'bg-white'}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiFilter className="w-5 h-5" />
            {loading ? 'Generating...' : 'Generate Report'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => exportReport("pdf")}
              className={`flex items-center gap-2 px-4 py-3 ${themeClasses.input.bg} border ${themeClasses.input.border} ${themeClasses.text.primary} rounded-lg hover:${darkMode ? 'bg-gray-800' : 'bg-gray-200'} font-medium`}
            >
              <FiDownload className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={() => exportReport("excel")}
              className={`flex items-center gap-2 px-4 py-3 ${themeClasses.input.bg} border ${themeClasses.input.border} ${themeClasses.text.primary} rounded-lg hover:${darkMode ? 'bg-gray-800' : 'bg-gray-200'} font-medium`}
            >
              <FiDownload className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => exportReport("csv")}
              className={`flex items-center gap-2 px-4 py-3 ${themeClasses.input.bg} border ${themeClasses.input.border} ${themeClasses.text.primary} rounded-lg hover:${darkMode ? 'bg-gray-800' : 'bg-gray-200'} font-medium`}
            >
              <FiDownload className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: "Total Employees", value: dashboard?.totalEmployees || 0, icon: FiUsers, color: "purple" },
          { label: "Avg Attendance", value: dashboard ? `${Math.round((dashboard.presentToday / dashboard.totalEmployees) * 100)}%` : '0%', icon: FiCalendar, color: "emerald" },
          { label: "Late Arrivals", value: lateToday, icon: MdTimer, color: "amber" },
          { label: "Total Absences", value: dashboard ? dashboard.totalEmployees - dashboard.presentToday : 0, icon: FaCalendarXmark, color: "rose" },
          { label: "Leave Days", value: dashboard?.onLeaveToday || 0, icon: FaCalendarMinus, color: "cyan" },
          { label: "Overtime Hours", value: charts?.overtime ? `${charts.overtime.reduce((acc, curr) => acc + curr.hours, 0)}h` : '0h', icon: FiClock, color: "purple" },
        ].map((metric, index) => (
          <div key={index} className={`${themeClasses.bg.secondary} p-5 rounded-xl border ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${
                  darkMode 
                    ? metric.color === 'purple' ? 'text-purple-400' :
                      metric.color === 'emerald' ? 'text-emerald-400' :
                      metric.color === 'amber' ? 'text-amber-400' :
                      metric.color === 'rose' ? 'text-rose-400' :
                      'text-cyan-400'
                    : metric.color === 'purple' ? 'text-purple-700' :
                      metric.color === 'emerald' ? 'text-emerald-700' :
                      metric.color === 'amber' ? 'text-amber-700' :
                      metric.color === 'rose' ? 'text-rose-700' :
                      'text-cyan-700'
                }`}>
                  {metric.label}
                </p>

                <div className="flex items-baseline gap-1">
                  <h3 className={`text-2xl font-bold mt-1 ${
                    darkMode 
                      ? metric.color === 'purple' ? 'text-purple-400' :
                        metric.color === 'emerald' ? 'text-emerald-400' :
                        metric.color === 'amber' ? 'text-amber-400' :
                        metric.color === 'rose' ? 'text-rose-400' :
                        'text-cyan-400'
                      : metric.color === 'purple' ? 'text-purple-600' :
                        metric.color === 'emerald' ? 'text-emerald-600' :
                        metric.color === 'amber' ? 'text-amber-600' :
                        metric.color === 'rose' ? 'text-rose-600' :
                        'text-cyan-700'
                  }`}>
                    {metric.value}
                  </h3>
                </div>
              </div>

              <metric.icon className={`w-8 h-8 ${
                darkMode 
                  ? metric.color === 'purple' ? 'text-purple-400' :
                    metric.color === 'emerald' ? 'text-emerald-400' :
                    metric.color === 'amber' ? 'text-amber-400' :
                    metric.color === 'rose' ? 'text-rose-400' :
                    'text-cyan-400'
                  : metric.color === 'purple' ? 'text-purple-700' :
                    metric.color === 'emerald' ? 'text-emerald-700' :
                    metric.color === 'amber' ? 'text-amber-700' :
                    metric.color === 'rose' ? 'text-rose-700' :
                    'text-cyan-700'
              }`} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Trend Chart */}
        <div className={`${themeClasses.bg.secondary} rounded-xl p-6 border ${themeClasses.border.primary}`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Monthly Attendance Trend</h3>
              <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>Last 6 months performance</p>
            </div>
            <AiOutlineAreaChart className="w-6 h-6 text-purple-400" />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart 
                data={trendData}
                margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                <XAxis 
                  dataKey="month" 
                  stroke={darkMode ? "#9ca3af" : "#4b5563"}
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 12 }}
                  label={{ 
                    value: 'Month', 
                    position: 'insideBottom', 
                    offset: -10,
                    fill: darkMode ? '#9ca3af' : '#4b5563',
                    fontSize: 12
                  }}
                />
                <YAxis 
                  stroke={darkMode ? "#9ca3af" : "#4b5563"}
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 12 }}
                  label={{ 
                    value: 'Percentage (%)', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: 10,
                    fill: darkMode ? '#9ca3af' : '#4b5563',
                    fontSize: 12,
                    dy: 30
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  wrapperStyle={{
                    paddingBottom: '10px',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="attendance"
                  name="Attendance %"
                  stroke="#10b981"
                  fill="url(#colorAttendance)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="late"
                  name="Late Arrivals"
                  stroke="#f59e0b"
                  fill="url(#colorLate)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className={`text-sm ${themeClasses.text.secondary}`}>Average Attendance</span>
              <span className={`ml-auto text-sm font-semibold ${themeClasses.text.primary}`}>
                {trendData.length > 0 ? Math.round(trendData.reduce((acc, curr) => acc + curr.attendance, 0) / trendData.length) : 0}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className={`text-sm ${themeClasses.text.secondary}`}>Average Late</span>
              <span className={`ml-auto text-sm font-semibold ${themeClasses.text.primary}`}>
                {trendData.length > 0 ? Math.round(trendData.reduce((acc, curr) => acc + curr.late, 0) / trendData.length) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Distribution */}
        <div className={`${themeClasses.bg.secondary} rounded-xl p-6 border ${themeClasses.border.primary}`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Attendance Distribution</h3>
              <p className={themeClasses.text.secondary}>Current month breakdown</p>
            </div>
            <FiPieChart className="w-6 h-6 text-purple-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={attendanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attendanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {attendanceDistribution.map((item, index) => (
              <div key={index} className={`flex items-center gap-2 p-2 rounded-lg ${themeClasses.bg.tertiary}`}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className={`text-sm ${themeClasses.text.primary}`}>{item.name}</span>
                <span className={`ml-auto text-sm font-medium ${themeClasses.text.primary}`}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Performance */}
      <div className={`${themeClasses.bg.secondary} rounded-xl p-6 border ${themeClasses.border.primary} mb-8`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Weekly Performance vs Target</h3>
            <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>Current week attendance vs goals</p>
          </div>
          <BiLineChart className="w-6 h-6 text-purple-400" />
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart 
              data={weeklyPerformance}
              margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
              <XAxis 
                dataKey="day" 
                stroke={darkMode ? "#9ca3af" : "#4b5563"}
                tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 12 }}
                label={{ 
                  value: 'Day of Week', 
                  position: 'insideBottom', 
                  offset: -10,
                  fill: darkMode ? '#9ca3af' : '#4b5563',
                  fontSize: 14
                }}
              />
              <YAxis 
                stroke={darkMode ? "#9ca3af" : "#4b5563"}
                tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 12 }}
                label={{ 
                  value: 'Attendance Rate (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  offset: 10,
                  fill: darkMode ? '#9ca3af' : '#4b5563',
                  fontSize: 14,
                  dy: 30
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                wrapperStyle={{
                  paddingBottom: '10px',
                  fontSize: '12px'
                }}
              />
              <Line
                type="monotone"
                dataKey="attendance"
                name="Actual Attendance"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: "#3b82f6" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Target"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: "#10b981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className={`text-sm ${themeClasses.text.muted}`}>Best Day</p>
            <p className={`text-sm font-semibold ${themeClasses.text.primary}`}>
              {bestWeeklyDay.day}
            </p>
            <p className="text-sm text-emerald-500">
              {bestWeeklyDay.attendance}%
            </p>
          </div>
          
          <div className="text-center">
            <p className={`text-sm ${themeClasses.text.muted}`}>Average</p>
            <p className={`text-sm font-semibold ${themeClasses.text.primary}`}>
              {weeklyAverage}%
            </p>
            <p className="text-sm text-blue-500">vs {weeklyPerformance[0]?.target}% target</p>
          </div>
          <div className="text-center">
            <p className={`text-sm ${themeClasses.text.muted}`}>Gap to Target</p>
            <p className={`text-sm font-semibold ${weeklyGap > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {weeklyGap}%
            </p>
            <p className="text-sm text-gray-500">average deficit</p>
          </div>
        </div>
      </div>

      {/* Department Performance Table */}
      <div className={`${themeClasses.bg.secondary} rounded-xl p-6 border ${themeClasses.border.primary} mb-8`}>
        <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-6 text-center`}>Department Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={themeClasses.bg.tertiary}>
              <tr>
                <th className={`p-4 text-left text-sm font-semibold ${themeClasses.text.secondary}`}>Department</th>
                <th className={`p-4 text-center text-sm font-semibold ${themeClasses.text.secondary}`}>Employees</th>
                <th className={`p-4 text-center text-sm font-semibold ${themeClasses.text.secondary}`}>Attendance Rate</th>
                <th className={`p-4 text-center text-sm font-semibold ${themeClasses.text.secondary}`}>Late Arrivals</th>
                <th className={`p-4 text-center text-sm font-semibold ${themeClasses.text.secondary}`}>Absences</th>
                <th className={`p-4 text-center text-sm font-semibold ${themeClasses.text.secondary}`}>Performance</th>
              </tr>
            </thead>
            <tbody>
              {departmentStats.map((dept, index) => (
                <tr key={index} className={`${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'} transition-colors border-t ${themeClasses.border.primary}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-purple-400 flex items-center justify-center text-white font-bold">
                        {dept.name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <p className={`font-medium ${themeClasses.text.primary}`}>{dept.name} Department</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-bold ${themeClasses.text.primary}`}>{dept.employees}</span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex-1 max-w-[150px]">
                        <div className={`h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-full overflow-hidden`}>
                          <div
                            className={`h-full rounded-full ${dept.attendance >= 95 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                              dept.attendance >= 90 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-rose-500 to-rose-400'
                              }`}
                            style={{ width: `${dept.attendance}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className={`font-bold ${themeClasses.text.primary}`}>{dept.attendance}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-bold text-amber-400">{dept.late}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-bold text-rose-400">{dept.absent}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${dept.attendance >= 95 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      dept.attendance >= 90 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                      {dept.attendance >= 95 ? 'Excellent' :
                        dept.attendance >= 90 ? 'Good' : 'Needs Improvement'}
                    </span>
                  </td>
                </tr>
              ))}
              {departmentStats.length === 0 && (
                <tr>
                  <td colSpan="6" className={`p-8 text-center ${themeClasses.text.secondary}`}>
                    No department data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers & Overtime Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Performers */}
        <div className={`${themeClasses.bg.secondary} rounded-xl p-6 border ${themeClasses.border.primary}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Top Performers</h3>
            <FiAward className="w-6 h-6 text-purple-400" />
          </div>

          <div className="space-y-4">
            {topPerformers.map((emp, index) => (
              <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'} transition-colors border ${themeClasses.border.primary}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-center text-white font-bold">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className={`font-medium ${themeClasses.text.primary}`}>{emp.name}</p>
                    <p className={themeClasses.text.secondary}>{emp.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">{emp.attendance}%</p>
                  <p className={`text-xs ${themeClasses.text.muted}`}>Attendance Rate</p>
                </div>
              </div>
            ))}
            {topPerformers.length === 0 && (
              <p className={`text-sm ${themeClasses.text.secondary}`}>No performer data available for this period.</p>
            )}
          </div>
        </div>

        {/* Overtime Comparison - Now with REAL data from API */}
        <div className={`${themeClasses.bg.secondary} rounded-xl p-6 border ${themeClasses.border.primary}`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Overtime Hours by Department</h3>
              <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>Monthly overtime distribution</p>
            </div>
            <FiClock className="w-6 h-6 text-purple-500" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart 
                data={overtimeData}
                margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                <XAxis 
                  dataKey="department" 
                  stroke={darkMode ? "#9ca3af" : "#4b5563"}
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 12 }}
                  label={{ 
                    value: 'Department', 
                    position: 'insideBottom', 
                    offset: -10,
                    fill: darkMode ? '#9ca3af' : '#4b5563',
                    fontSize: 14
                  }}
                />
                <YAxis 
                  stroke={darkMode ? "#9ca3af" : "#4b5563"}
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 12 }}
                  label={{ 
                    value: 'Overtime Hours', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: 10,
                    fill: darkMode ? '#9ca3af' : '#4b5563',
                    fontSize: 14,
                    dy: 30
                  }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: darkMode ? '#f3f4f6' : '#111827', fontWeight: 600 }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  wrapperStyle={{
                    paddingBottom: '10px',
                    fontSize: '12px'
                  }}
                />
                <Bar
                  dataKey="hours"
                  name="Overtime Hours"
                  fill="#f87d7d"
                  radius={[4, 4, 0, 0]}
                  label={{
                    position: 'top',
                    fill: darkMode ? '#9ca3af' : '#4b5563',
                    fontSize: 11,
                    formatter: (value) => `${value}h`
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Overtime Statistics */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className={`text-sm ${themeClasses.text.muted}`}>Total Overtime</p>
              <p className={`text-lg font-bold ${themeClasses.text.primary}`}>
                {overtimeData.reduce((acc, dept) => acc + dept.hours, 0)}h
              </p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${themeClasses.text.muted}`}>Highest</p>
              <p className={`text-lg font-bold text-amber-500`}>
                {overtimeData.length ? `${Math.max(...overtimeData.map(d => d.hours))}h` : "0h"}
              </p>
              <p className={`text-sm ${themeClasses.text.muted}`}>
                {overtimeData.length ? overtimeData.find(d => d.hours === Math.max(...overtimeData.map(d => d.hours)))?.department : "N/A"}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${themeClasses.text.muted}`}>Lowest</p>
              <p className={`text-lg font-bold text-emerald-500`}>
                {overtimeData.length ? `${Math.min(...overtimeData.map(d => d.hours))}h` : "0h"}
              </p>
              <p className={`text-sm ${themeClasses.text.muted}`}>
                {overtimeData.length ? overtimeData.find(d => d.hours === Math.min(...overtimeData.map(d => d.hours)))?.department : "N/A"}
              </p>
            </div>
          </div>
          
          {/* Show data source indicator */}
          <p className={`text-xs ${themeClasses.text.muted} text-center mt-2`}>
            * Data from {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReports;
