import { MdMoreTime } from "react-icons/md";
import { GoCheck } from "react-icons/go";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiUsers, FiCalendar, FiBarChart2, FiPieChart, FiDownload } from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { useTheme, getThemeClasses } from "../../../contexts/ThemeContext";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { TbCalendarMonth } from "react-icons/tb";
import { addCorporatePdfHeader, addCorporatePdfFooters } from "../../../utils/corporatePdf";

const AdminAnalytics = () => {
  const darkMode = useTheme();
  const theme = getThemeClasses(darkMode);
  const [timeRange, setTimeRange] = useState("monthly");
  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeJobsCount, setActiveJobsCount] = useState(null);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Add this mapping function for leave types
  const getLeaveTypeName = (code) => {
    const leaveTypes = {
      'AL': 'Earned Leave',
      'EL': 'Earned Leave',
      'SL': 'Sick Leave',
      'CL': 'Casual Leave',
      'ML': 'Maternity Leave',
      'PL': 'Paternity Leave',
      'BL': 'Bereavement Leave'
    };
    return leaveTypes[code] || code; // Return the mapped name or original code if not found
  };

  // Color palette based on theme
  const colors = darkMode ? {
    primary: "#3B82F6", // Blue
    secondary: "#10B981", // Emerald
    tertiary: "#8B5CF6", // Purple
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    background: "#0F172A", // slate-900
    card: "#1E293B", // slate-800
    cardHover: "#334155", // slate-700
    border: "#475569", // slate-600
    text: "#F1F5F9", // slate-100
    textMuted: "#94A3B8", // slate-400
    grid: "#334155" // slate-700
  } : {
    primary: "#3B82F6", // Blue
    secondary: "#10B981", // Emerald
    tertiary: "#8B5CF6", // Purple
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    background: "#F8FAFC", // slate-50
    card: "#FFFFFF", // white
    cardHover: "#F1F5F9", // slate-100
    border: "#E2E8F0", // slate-200
    text: "#0F172A", // slate-900
    textMuted: "#64748B", // slate-500
    grid: "#E2E8F0" // slate-200
  };

  // Attendance data for bar chart (monthly present counts)
  const attendanceData = charts?.attendance || [];

  // Department distribution for pie chart
  const departmentData = charts?.departments?.map((d, i) => ({
    name: d.department || 'Unknown',
    value: Number(d.count),
    color: [colors.primary, colors.secondary, colors.warning, colors.tertiary, '#EC4899'][i % 5]
  })) || [];

  // Hiring trends for area chart
  const hiringData = charts?.hiring || [];

  // Leave statistics with mapped names
  const leaveData = charts?.leaveStats?.map((l, i) => ({
    ...l,
    type: getLeaveTypeName(l.type), // Map the leave code to full name
    color: [colors.success, colors.warning, colors.danger, colors.primary][i % 4]
  })) || [];

  // Custom tooltip for charts with theme support
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} p-3 border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg shadow-lg`}>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Chart styling based on theme
  const chartTheme = {
    backgroundColor: colors.card,
    textColor: colors.textMuted,
    gridColor: colors.grid,
    axisColor: colors.textMuted
  };

  const cardBg = darkMode ? 'bg-slate-800' : 'bg-white';
  const cardBorder = darkMode ? 'border-slate-700' : 'border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const inputBg = darkMode ? 'bg-slate-800' : 'bg-gray-50';
  const inputBorder = darkMode ? 'border-slate-700' : 'border-gray-300';
  const hoverBg = darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50';

  // Fetch dashboard & charts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      try {
        const [dashRes, chartsRes] = await Promise.all([
          axios.get('/api/dashboard/admin', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/dashboard/charts/admin', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setDashboard(dashRes.data);
        // Convert charts data into usable structures
        const chartData = {
          // Map monthly attendance
          attendance: chartsRes.data.attendance?.map((r) => ({
            month: monthNames[(Number(r.month) - 1) % 12] || 'N',
            present: Number(r.count)
          })) || null,

          departments: chartsRes.data.departments || null,

          // Map hiring trends (from hiring service)
          hiring: chartsRes.data.hiring?.map((r) => ({
            month: monthNames[(Number(r.month) - 1) % 12] || 'N',
            hired: Number(r.count),
            resigned: 0 // We assume 0 for now as we didn't impl resigned yet
          })) || null,

          // Map leave stats (from leaveStats service) - store raw type for mapping later
          leaveStats: chartsRes.data.leaveStats?.map(l => ({
            type: l.type,
            count: l.count,
            // Color will be applied in render/leaveData
          })) || null,

          // Performance from explicit service
          performance: chartsRes.data.performance?.map((p, i) => ({
            month: monthNames[i % 12], // Assuming ordered 1-12 or similar
            attendance: p.attendance,
            productivity: p.productivity,
            quality: p.quality
          })) || null,

          overtime: chartsRes.data.overtime || [],
          training: chartsRes.data.training || null,
          leaves: chartsRes.data.leaves || null
        };
        setCharts(chartData);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExportPDF = async () => {
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = await addCorporatePdfHeader(pdf, {
        title: "Admin Dashboard Report",
        subtitle: "Organization-level summary and trend data",
      });

      // Add stats summary
      pdf.setFontSize(12);
      pdf.text("Key Metrics Summary", 15, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      const stats = [
        `Total Employees: ${dashboard?.totalEmployees || "—"}`,
        `Active Users: ${dashboard?.totalActiveUsers || "—"}`,
        `Today's Attendance: ${dashboard?.presentToday || "—"} (${dashboard?.totalEmployees ? ((dashboard.presentToday / dashboard.totalEmployees) * 100).toFixed(1) : "—"}%)`,
        `Pending Leaves: ${dashboard?.pendingLeaves || "—"}`,
        `On Leave Today: ${dashboard?.onLeaveToday || "—"}`,
        `Departments: ${charts?.departments?.length || "—"}`,
        `Active Jobs: ${activeJobsCount || "—"}`,
      ];

      for (const stat of stats) {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = await addCorporatePdfHeader(pdf, {
            title: "Admin Dashboard Report",
          });
        }
        pdf.text(stat, 15, yPosition);
        yPosition += 6;
      }

      yPosition += 4;

      // Add Department Data Table
      if (charts?.departments && charts.departments.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = await addCorporatePdfHeader(pdf, {
            title: "Department Overview",
          });
        }

        pdf.setFontSize(12);
        pdf.text("Department Overview", 15, yPosition);
        yPosition += 8;

        pdf.setFontSize(9);
        const deptTableData = [
          ["Department", "Employee Count"],
          ...charts.departments.map((d) => [
            d.department || "N/A",
            String(d.count || 0),
          ]),
        ];

        autoTable(pdf, {
          head: [deptTableData[0]],
          body: deptTableData.slice(1),
          startY: yPosition,
          margin: { left: 15, right: 15 },
          theme: "grid",
          headStyles: {
            fillColor: [139, 92, 246],
            textColor: 255,
            fontStyle: "bold",
          },
          bodyStyles: {
            textColor: darkMode ? 255 : 0,
          },
          alternateRowStyles: {
            fillColor: darkMode ? [45, 45, 60] : [240, 240, 245],
          },
        });

        yPosition = pdf.internal.pageSize.getHeight() - 20;
      }

      // Add Attendance Data
      if (charts?.attendance && charts.attendance.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = await addCorporatePdfHeader(pdf, {
            title: "Monthly Attendance Summary",
          });
        }

        pdf.setFontSize(12);
        pdf.text("Monthly Attendance Summary", 15, yPosition);
        yPosition += 8;

        pdf.setFontSize(9);
        const attendanceTableData = [
          ["Month", "Present Count"],
          ...charts.attendance.map((a) => [
            monthNames[(Number(a.month) - 1) % 12] || "N/A",
            String(a.present || 0),
          ]),
        ];

        autoTable(pdf, {
          head: [attendanceTableData[0]],
          body: attendanceTableData.slice(1),
          startY: yPosition,
          margin: { left: 15, right: 15 },
          theme: "grid",
          headStyles: {
            fillColor: [139, 92, 246],
            textColor: 255,
            fontStyle: "bold",
          },
          bodyStyles: {
            textColor: darkMode ? 255 : 0,
          },
          alternateRowStyles: {
            fillColor: darkMode ? [45, 45, 60] : [240, 240, 245],
          },
        });

        yPosition = pdf.internal.pageSize.getHeight() - 20;
      }

      // Add Leave Data
      if (charts?.leaves && charts.leaves.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = await addCorporatePdfHeader(pdf, {
            title: "Leave Request Summary",
          });
        }

        pdf.setFontSize(12);
        pdf.text("Leave Request Summary", 15, yPosition);
        yPosition += 8;

        pdf.setFontSize(9);
        const leaveTableData = [
          ["Leave Type", "Count"],
          ...charts.leaves.map((l) => [getLeaveTypeName(l.type) || "N/A", String(l.count || 0)]),
        ];

        autoTable(pdf, {
          head: [leaveTableData[0]],
          body: leaveTableData.slice(1),
          startY: yPosition,
          margin: { left: 15, right: 15 },
          theme: "grid",
          headStyles: {
            fillColor: [139, 92, 246],
            textColor: 255,
            fontStyle: "bold",
          },
          bodyStyles: {
            textColor: darkMode ? 255 : 0,
          },
          alternateRowStyles: {
            fillColor: darkMode ? [45, 45, 60] : [240, 240, 245],
          },
        });
      }

      // Add recent activities
      if (dashboard?.recentWorklogs && dashboard.recentWorklogs.length > 0) {
        pdf.addPage();
        yPosition = await addCorporatePdfHeader(pdf, {
          title: "Recent Activities",
        });

        pdf.setFontSize(12);
        pdf.text("Recent Activities", 15, yPosition);
        yPosition += 8;

        pdf.setFontSize(9);
        const activitiesTableData = [
          ["Employee", "Action", "Date"],
          ...dashboard.recentWorklogs
            .slice(0, 10)
            .map((w) => [
              w.employee?.fullName || "Unknown",
              w.description || "Activity",
              w.date || "N/A",
            ]),
        ];

        autoTable(pdf, {
          head: [activitiesTableData[0]],
          body: activitiesTableData.slice(1),
          startY: yPosition,
          margin: { left: 15, right: 15 },
          theme: "grid",
          headStyles: {
            fillColor: [139, 92, 246],
            textColor: 255,
            fontStyle: "bold",
          },
          bodyStyles: {
            textColor: darkMode ? 255 : 0,
          },
          alternateRowStyles: {
            fillColor: darkMode ? [45, 45, 60] : [240, 240, 245],
          },
        });
      }

      addCorporatePdfFooters(pdf);

      // Save the PDF
      const fileName = `Admin_Dashboard_Report_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          {loading && (
            <div className="text-sm text-gray-400">Loading analytics...</div>
          )}
          {error && (
            <div className="text-sm text-rose-500">Error loading analytics: {error}</div>
          )}
          <div>
            <h1 className={`text-3xl font-bold ${textPrimary}`}>
              Analytics Dashboard
            </h1>
            <p className={textSecondary}>
              Comprehensive insights into employee performance and organizational metrics
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExportPDF} className={`flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors`}>
              <FiDownload className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Employees */}
        <div className={`${cardBg} rounded-xl p-6 border ${cardBorder} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${textSecondary}`}>Total Employees</p>
              <h3 className={`text-2xl font-bold ${textPrimary} mt-2`}>{dashboard ? dashboard.totalEmployees : '—'}</h3>
              <div className="flex items-center gap-2 mt-2">
                <GoCheck className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">{dashboard ? `Active users: ${dashboard.totalActiveUsers}` : '—'}</span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'} flex items-center justify-center`}>
              <FiUsers className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          </div>
        </div>

        {/* Avg. Attendance */}
        <div className={`${cardBg} rounded-xl p-6 border ${cardBorder} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${textSecondary}`}>Avg. Attendance</p>
              <h3 className={`text-2xl font-bold ${textPrimary} mt-2`}>{dashboard ? `${((dashboard.presentToday / dashboard.totalEmployees) * 100).toFixed(1)}%` : '—'}</h3>
              <div className="flex items-center gap-2 mt-2">
                <GoCheck className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">Present today: {dashboard ? dashboard.presentToday : '—'}</span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-100'} flex items-center justify-center`}>
              <GoCheck className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </div>
        </div>

        {/* Monthly Turnover */}
        <div className={`${cardBg} rounded-xl p-6 border ${cardBorder} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${textSecondary}`}>Monthly Turnover</p>
              <h3 className={`text-2xl font-bold ${textPrimary} mt-2`}>{dashboard ? `${dashboard.onLeaveToday || 0}` : '—'}</h3>
              <div className="flex items-center gap-2 mt-2">
                <TbCalendarMonth className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500">On leave today</span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-lg ${darkMode ? 'bg-amber-900/30' : 'bg-amber-100'} flex items-center justify-center`}>
              <TbCalendarMonth className={`w-6 h-6 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            </div>
          </div>
        </div>

        {/* Avg. Performance */}
        <div className={`${cardBg} rounded-xl p-6 border ${cardBorder} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${textSecondary}`}>Avg. Performance</p>
              <h3 className={`text-2xl font-bold ${textPrimary} mt-2`}>
                {dashboard?.avgPerformance ? `${Number(dashboard.avgPerformance).toFixed(1)}/5.0` : '—'}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <GoCheck className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">
                  {dashboard?.avgPerformance ? `Avg performance: ${Number(dashboard.avgPerformance).toFixed(1)}` : '—'}
                </span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100'} flex items-center justify-center`}>
              <FiBarChart2 className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Department Distribution - Pie Chart */}
        <div className={`${cardBg} rounded-xl p-6 border ${cardBorder} shadow-sm`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-lg font-semibold ${textPrimary}`}>Department Distribution</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Worklogs */}
        <div className={`${cardBg} rounded-xl p-6 border ${cardBorder} shadow-sm`}>
          <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Recent Worklogs</h3>
          {dashboard?.recentWorklogs && dashboard.recentWorklogs.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentWorklogs.map((w) => (
                <div key={w.id} className={`p-3 rounded ${darkMode ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className={`font-semibold ${textPrimary}`}>{w.employee?.fullName || 'Unknown'}</div>
                      <div className={`text-sm ${textSecondary}`}>{w.description}</div>
                    </div>
                    <div className="text-sm text-gray-500">{new Date(w.date).toLocaleDateString()} • {w.hoursWorked} hrs</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={textSecondary}>No recent worklogs found</p>
          )}
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Leave Statistics */}
        <div className={`${cardBg} rounded-xl p-6 border ${cardBorder} shadow-sm`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'} flex items-center justify-center`}>
              <FiCalendar className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${textPrimary}`}>Leave Statistics</h3>
              <p className={`text-sm ${textSecondary}`}>This month</p>
            </div>
          </div>

          <div className="space-y-3">
            {(leaveData).map((item, idx) => (
              <div key={idx} className={`flex justify-between items-center p-3 ${darkMode ? 'bg-slate-900/50' : 'bg-gray-50'} rounded-lg`}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || (idx === 0 ? colors.success : idx === 1 ? colors.warning : colors.danger) }}></div>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {item.type || `Month ${item.month}`}
                  </span>
                </div>
                <span className="font-bold" style={{ color: item.color || '#111' }}>{item.value || item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Overtime Hours */}
        <div className={`${cardBg} rounded-xl p-6 border ${cardBorder} shadow-sm`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-100'} flex items-center justify-center`}>
              <MdMoreTime className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${textPrimary}`}>Overtime Hours</h3>
              <p className={`text-sm ${textSecondary}`}>This month (proxy)</p>
            </div>
          </div>

          {charts?.overtime ? (
            <div className="text-center">
              <div className={`text-3xl font-bold ${textPrimary} mb-2`}>
                {charts.overtime.reduce((acc, curr) => acc + curr.hours, 0)}
              </div>
              <p className={`${textSecondary} mb-4`}>Total hours</p>
              <div>
                {charts.overtime.slice(0, 3).map((dept, i) => (
                  <div key={i} className={`flex justify-between text-sm ${textSecondary} mb-1`}>
                    <span>{dept.department}</span>
                    <span>{dept.hours} hrs</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className={textSecondary}>No overtime data</p>
          )}
        </div>
      </div>

      {/* Department Performance Table */}
      <div className={`${cardBg} rounded-xl p-6 border ${cardBorder} shadow-sm mb-8`}>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-6`}>Department Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-100'}>
              <tr>
                <th className={`p-4 text-center text-sm font-semibold ${textSecondary}`}>Department</th>
                <th className={`p-4 text-center text-sm font-semibold ${textSecondary}`}>Employees</th>
                <th className={`p-4 text-center text-sm font-semibold ${textSecondary}`}>Attendance Rate</th>
                <th className={`p-4 text-center text-sm font-semibold ${textSecondary}`}>Late Arrivals</th>
                <th className={`p-4 text-center text-sm font-semibold ${textSecondary}`}>Absences</th>
                <th className={`p-4 text-center text-sm font-semibold ${textSecondary}`}>Performance</th>
              </tr>
            </thead>
            <tbody>
              {departmentData.map((dept, index) => (
                <tr key={index} className={`${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'} transition-colors border-t ${cardBorder}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-purple-400 flex items-center justify-center text-white font-bold">
                        {dept.name.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-medium ${textPrimary}`}>{dept.name} Department</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-bold ${textPrimary}`}>{dept.value}</span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex-1 max-w-[150px]">
                        <div className={`h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-full overflow-hidden`}>
                          <div
                            className={`h-full rounded-full ${dept.value >= 35 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                              dept.value >= 20 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-rose-500 to-rose-400'
                              }`}
                            style={{ width: `${(dept.value / 50) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className={`font-bold ${textPrimary}`}>{dept.value}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-bold text-amber-400">{Math.floor(dept.value / 5)}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-bold text-rose-400">{Math.floor(dept.value / 8)}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${dept.value >= 35 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      dept.value >= 20 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                      {dept.value >= 35 ? 'Excellent' :
                        dept.value >= 20 ? 'Good' : 'Needs Improvement'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
