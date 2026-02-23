import { RxCrossCircled } from "react-icons/rx";
import { GoCheck } from "react-icons/go";
import React, { useState, useEffect, useMemo } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiBarChart2, FiDownload, FiUsers, FiTrendingUp, FiTrendingDown, FiClock, FiPieChart, FiUser, FiFilter, FiBriefcase } from "react-icons/fi";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme, getThemeClasses } from "../../../contexts/ThemeContext";
import axios from "axios";

const MonthlyAttendance = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
const [selectedEmployee, setSelectedEmployee] = useState("all");

const isSingleEmployee = selectedEmployee !== "all";

  const [viewMode, setViewMode] = useState("calendar");
  const [employees, setEmployees] = useState([]);
  const [rawAttendance, setRawAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const darkMode = useTheme();
  const themeClasses = getThemeClasses(darkMode);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentMonthName = months[currentMonth.getMonth()];
  const currentYear = currentMonth.getFullYear();

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Employees
        const empRes = await axios.get("http://localhost:5000/api/admin/employees", { headers });
        const validEmployees = empRes.data
          .filter(u => u.employee)
          .map(u => ({
            id: u.employee.id,
            fullName: u.employee.fullName,
            firstName: u.employee.fullName.split(' ')[0],
            lastName: u.employee.fullName.split(' ').slice(1).join(' '),
            department: u.employee.department || 'N/A',
            employeeCode: u.employee.employeeCode || `EMP${u.employee.id.toString().padStart(3, '0')}`,
            initials: u.employee.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
          }));
        setEmployees(validEmployees);

        // Fetch Attendance for Month
        const monthParam = currentMonth.getMonth() + 1;
        const yearParam = currentMonth.getFullYear();
        const attRes = await axios.get(`http://localhost:5000/api/attendance/all?month=${monthParam}&year=${yearParam}`, { headers });
        setRawAttendance(attRes.data);

      } catch (error) {
        console.error("Failed to fetch attendance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentMonth]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(employees.map(emp => emp.department).filter(Boolean));
    return ['all', ...Array.from(depts)];
  }, [employees]);

  // Filter employees by department
  const filteredEmployees = useMemo(() => {
    if (selectedDepartment === 'all') return employees;
    return employees.filter(emp => emp.department === selectedDepartment);
  }, [employees, selectedDepartment]);

  // Process Data for UI
  const processedData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth.getMonth() + 1, 0).getDate();
    const data = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(currentYear, currentMonth.getMonth(), day);
      const dateStr = dateObj.toISOString().split('T')[0];
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dayEmployees = filteredEmployees.map(emp => {
        const record = rawAttendance.find(r =>
          r.employeeId === emp.id && r.date === dateStr
        );

        let status = isWeekend ? 'weekend' : 'absent';
        let checkIn = '-';
        let checkOut = '-';
        let hoursWorked = '0h';

        if (record) {
          status = 'present';
          if (record.markIn) {
            const inTime = new Date(record.markIn);
            checkIn = inTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            
            // Calculate hours if both markIn and markOut exist
            if (record.markOut) {
              const outTime = new Date(record.markOut);
              checkOut = outTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              const diffMs = outTime - inTime;
              const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
              const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              hoursWorked = `${diffHrs}h ${diffMins}m`;
            }
          }
        }

        return {
          ...emp,
          status,
          checkIn,
          checkOut,
          hoursWorked,
          isLate: false
        };
      });

      // Filter if specific employee selected
      const finalEmployees = selectedEmployee === 'all'
        ? dayEmployees
        : dayEmployees.filter(e => e.id === parseInt(selectedEmployee));

      data.push({
        day,
        date: dateStr,
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        isWeekend,
        employees: finalEmployees
      });
    }
    return data;
  }, [currentMonth, filteredEmployees, rawAttendance, selectedEmployee]);


  const miniCalendar = useMemo(() => {
  if (!isSingleEmployee) return [];

  const empId = parseInt(selectedEmployee);

  return processedData.map(day => {
    const emp = day.employees.find(e => e.id === empId);
    return {
      day: day.day,
      weekday: day.dayName,
      status: emp?.status || "absent"
    };
  }).filter(d => !["Sat", "Sun"].includes(d.weekday));
}, [processedData, selectedEmployee]);

  // Calculate Stats
  const stats = useMemo(() => {
    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let lateArrivals = 0;

    processedData.forEach(day => {
      if (!day.isWeekend) {
        day.employees.forEach(emp => {
          if (emp.status === 'present') presentDays++;
          if (emp.status === 'absent') absentDays++;
          if (emp.status === 'leave') leaveDays++;
        });
      }
    });

    return {
      workingDays: processedData.filter(d => !d.isWeekend).length,
      presentDays,
      absentDays,
      leaveDays,
      lateArrivals,
      totalEmployees: filteredEmployees.length,
      totalRecords: presentDays + absentDays + leaveDays
    };
  }, [processedData, filteredEmployees.length]);

  const attendanceDistribution = [
    { name: "Present", value: stats.presentDays, color: "#10B981" },
    { name: "Absent", value: stats.absentDays, color: "#EF4444" },
    { name: "Leave", value: stats.leaveDays, color: "#3B82F6" },
  ].filter(d => d.value > 0);

  const departmentPerformance = useMemo(() => {
    const deptMap = {};

    processedData.forEach(day => {
      if (day.isWeekend) return;
      day.employees.forEach(emp => {
        if (!deptMap[emp.department]) {
          deptMap[emp.department] = { present: 0, total: 0 };
        }
        deptMap[emp.department].total++;
        if (emp.status === 'present') {
          deptMap[emp.department].present++;
        }
      });
    });

    return Object.keys(deptMap).map(dept => ({
      department: dept,
      attendance: deptMap[dept].total > 0 ? Math.round((deptMap[dept].present / deptMap[dept].total) * 100) : 0,
    }));
  }, [processedData]);

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30';
      case 'absent': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30';
      case 'leave': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30';
      case 'weekend': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return '✓';
      case 'absent': return '✗';
      case 'leave': return 'L';
      case 'weekend': return 'W';
      default: return '-';
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${themeClasses.bg.primary} p-3 border ${themeClasses.border.primary} rounded-lg shadow-lg`}>
          <p className={themeClasses.text.primary}>{label}</p>
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

  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={themeClasses.text.secondary}>Loading attendance data...</p>
        </div>
      </div>
    );
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const monthParam = currentMonth.getMonth() + 1;
      const yearParam = currentMonth.getFullYear();

      const response = await axios.get(`http://localhost:5000/api/attendance/export?month=${monthParam}&year=${yearParam}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${currentMonthName}_${currentYear}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export attendance data.");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${themeClasses.text.primary}`}>
              Monthly Attendance Analytics
            </h1>
            <p className={themeClasses.text.secondary}>
              Comprehensive monthly attendance analysis with visual insights.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className={`flex items-center gap-2 px-4 py-2.5 ${themeClasses.bg.secondary} border ${themeClasses.border.primary} ${themeClasses.text.primary} rounded-lg hover:${darkMode ? 'bg-gray-700' : 'bg-gray-300'} font-medium transition-all hover:scale-105`}
            >
              <FiDownload className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Attendance Distribution Pie Chart */}
        <div className={`${themeClasses.bg.secondary} rounded-xl p-6 border ${themeClasses.border.primary} hover:shadow-lg transition-all`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Attendance Distribution</h3>
              <p className={themeClasses.text.secondary}>{currentMonthName} {currentYear} breakdown</p>
            </div>
            <FiPieChart className="w-6 h-6 text-purple-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
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
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Performance Bar Chart */}
        <div className={`${themeClasses.bg.secondary} rounded-xl p-6 border ${themeClasses.border.primary} hover:shadow-lg transition-all`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Department Performance</h3>
              <p className={themeClasses.text.secondary}>Attendance rate by department</p>
            </div>
            <FiBarChart2 className="w-6 h-6 text-purple-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                <XAxis dataKey="department" stroke={darkMode ? "#9CA3AF" : "#4b5563"} />
                <YAxis stroke={darkMode ? "#9CA3AF" : "#4b5563"} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="attendance" name="Attendance %" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Month Navigation & Filters */}
      <div className={`${themeClasses.bg.secondary} rounded-xl border ${themeClasses.border.primary} p-6 mb-8`}>
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          {/* Month Selector */}
          <div className="flex items-center gap-4">
            <button
              onClick={prevMonth}
              className={`p-2 rounded-lg hover:${darkMode ? 'bg-gray-700' : 'bg-gray-300'} transition-all hover:scale-110`}
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center min-w-[200px]">
              <h2 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
                {currentMonthName} {currentYear}
              </h2>
              <p className={themeClasses.text.secondary}>
                {stats.workingDays} Working Days • {stats.totalEmployees} Employees
              </p>
            </div>

            <button
              onClick={nextMonth}
              className={`p-2 rounded-lg hover:${darkMode ? 'bg-gray-700' : 'bg-gray-300'} transition-all hover:scale-110`}
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className={`px-4 py-2.5 ${themeClasses.input.bg} border ${themeClasses.input.border} ${themeClasses.input.text} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
            >
              <option value="all" className={darkMode ? 'bg-gray-900' : 'bg-white'}>All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id} className={darkMode ? 'bg-gray-900' : 'bg-white'}>{emp.fullName}</option>
              ))}
            </select>

            <div className={`${themeClasses.bg.tertiary} p-1 rounded-lg border ${themeClasses.border.primary}`}>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "calendar"
                  ? "bg-purple-600 text-white"
                  : `${themeClasses.text.secondary} hover:${themeClasses.text.primary}`
                  }`}
              >
                Calendar View
              </button>
              <button
                onClick={() => setViewMode("summary")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "summary"
                  ? "bg-purple-600 text-white"
                  : `${themeClasses.text.secondary} hover:${themeClasses.text.primary}`
                  }`}
              >
                Summary View
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
          <div className={`${themeClasses.bg.tertiary} p-4 rounded-lg border ${themeClasses.border.primary} hover:shadow-md transition-all`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <FiCalendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className={`text-xs ${themeClasses.text.secondary}`}>Working Days</p>
                <p className={`text-xl font-bold ${themeClasses.text.primary}`}>{stats.workingDays}</p>
              </div>
            </div>
          </div>
          <div className="bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/30 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <GoCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">Total Present</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-100">{stats.presentDays}</p>
              </div>
            </div>
          </div>
          <div className="bg-rose-500/10 p-4 rounded-lg border border-rose-500/30 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                <RxCrossCircled className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-xs text-rose-700 dark:text-rose-400">Total Absent</p>
                <p className="text-xl font-bold text-rose-700 dark:text-rose-400">{stats.absentDays}</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-blue-700 dark:text-blue-400">Total Leave</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{stats.leaveDays}</p>
              </div>
            </div>
          </div>
          <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/30 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <FiClock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400">Total Late</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{stats.lateArrivals}</p>
              </div>
            </div>
          </div>
          <div className={`${themeClasses.bg.tertiary} p-4 rounded-lg border ${themeClasses.border.primary} hover:shadow-md transition-all`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className={`text-xs ${themeClasses.text.secondary}`}>Attendance %</p>
                <p className={`text-xl font-bold ${themeClasses.text.primary}`}>
                  {stats.totalRecords > 0 ? Math.round((stats.presentDays / stats.totalRecords) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Table – All Employees */}
      {viewMode === "calendar" && !isSingleEmployee && (
        <div className={`${themeClasses.bg.secondary} rounded-xl border ${themeClasses.border.primary} mb-8`}>
          <div className="overflow-x-auto">
            <table className="min-w-max w-full border-separate border-spacing-0">
              {/* HEADER */}
              <thead>
                <tr>
                  {/* TOP LEFT */}
                  <th
                    className={`sticky top-0 left-0 z-50 p-4 text-left border-b border-r
                    ${themeClasses.border.primary} ${themeClasses.bg.tertiary}`}
                  >
                    Employee
                  </th>

                  {processedData.map(day => (
                    <th
                      key={day.day}
                      className={`sticky top-0 z-40 p-4 min-w-[70px] text-center border-b
                      ${themeClasses.border.primary} ${themeClasses.bg.tertiary}`}
                    >
                      {/* Date Number */}
                      <div className={`text-sm font-semibold ${day.isWeekend ? "text-gray-500" : themeClasses.text.secondary}`}>
                        {day.day}
                      </div>

                      {/* Day Name (Mon, Tue, etc.) */}
                      <div className={`text-xs mt-1 ${day.isWeekend ? "text-gray-500" : themeClasses.text.muted}`}>
                        {day.dayName?.slice(0,3)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* BODY */}
              <tbody>
                {processedData[0]?.employees.map(baseEmp => (
                  <tr key={baseEmp.id} className={`border-b ${themeClasses.border.primary}`}>
                    {/* LEFT COLUMN */}
                    <td
                      className={`sticky left-0 z-30 p-4 border-r
                      ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}
                    >
                      <div className="min-w-[200px]">
                        <p className={`font-medium ${themeClasses.text.primary}`}>
                          {baseEmp.fullName}
                        </p>
                        <p className={`text-sm ${themeClasses.text.secondary}`}>
                          {baseEmp.department}
                        </p>
                      </div>
                    </td>

                    {processedData.map(day => {
                      const employeeDay = day.employees.find(e => e.id === baseEmp.id);

                      return (
                        <td key={day.day} className="p-2 text-center">
                          <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium border ${getStatusColor(employeeDay?.status || "")}`}>
                            {getStatusIcon(employeeDay?.status || "")}
                          </div>

                          {employeeDay?.status === "present" && !day.isWeekend && (
                            <div className="text-xs text-gray-400 mt-1">
                              {employeeDay.checkIn}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Single Employee Calendar View with Sidebar */}
      {isSingleEmployee && viewMode === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Calendar - takes 2/3 of the space */}
          <div className="lg:col-span-2">
            {(() => {
              const emp = employees.find(e => e.id === parseInt(selectedEmployee));
              const firstDay = new Date(currentYear, currentMonth.getMonth(), 1).getDay();
              const daysInMonth = new Date(currentYear, currentMonth.getMonth() + 1, 0).getDate();
              const today = new Date().toDateString();

              const calendarCells = [];

              for (let i = 0; i < firstDay; i++) calendarCells.push(null);

              for (let d = 1; d <= daysInMonth; d++) {
                const dateObj = new Date(currentYear, currentMonth.getMonth(), d);
                const day = miniCalendar.find(x => x.day === d);
                calendarCells.push({
                  day: d,
                  status: day?.status,
                  isToday: dateObj.toDateString() === today
                });
              }

              return (
                <div className={`${themeClasses.bg.secondary} p-6 rounded-xl border ${themeClasses.border.primary}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text.primary}`}>
                    {emp?.fullName}'s Monthly Calendar
                  </h3>

                  {/* Weekdays */}
                  <div className="grid grid-cols-7 mb-2 text-center text-sm">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                      <div key={d} className={themeClasses.text.secondary}>{d}</div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 text-center border ${themeClasses.border.primary}">
                    {calendarCells.map((cell, i) => {
                      if (!cell) return <div key={i} className={`h-14 border ${themeClasses.border.primary}`}></div>;

                      return (
                        <div
                          key={i}
                          className={`h-14 flex flex-col items-center justify-center text-sm border ${themeClasses.border.primary}
                            ${cell.isToday ? "bg-purple-100 dark:bg-purple-700/20" : ""}
                          `}
                        >
                         <span className={`text-xs ${cell.isToday ? "text-gray-900 dark:text-black" : themeClasses.text.primary}`}>
  {cell.day}
</span>

                          {cell.status === "present" && (
                            <GoCheck className="text-emerald-500 text-sm" />
                          )}
                          {cell.status === "absent" && (
                            <RxCrossCircled className="text-rose-500 text-sm" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Employee Info Sidebar - takes 1/3 of the space */}
          <div className="lg:col-span-1">
            {(() => {
              const emp = employees.find(e => e.id === parseInt(selectedEmployee));
              
              // Calculate individual stats for this employee
              let presentCount = 0;
              let absentCount = 0;
              let leaveCount = 0;
              let lateCount = 0;

              processedData.forEach(day => {
                if (day.isWeekend) return;
                const empDay = day.employees.find(e => e.id === parseInt(selectedEmployee));
                if (empDay) {
                  if (empDay.status === 'present') presentCount++;
                  if (empDay.status === 'absent') absentCount++;
                  if (empDay.status === 'leave') leaveCount++;
                }
              });

              const totalWorkingDays = processedData.filter(d => !d.isWeekend).length;
              const attendancePercentage = totalWorkingDays > 0 ? Math.round((presentCount / totalWorkingDays) * 100) : 0;

              return (
                <div className={`${themeClasses.bg.secondary} p-6 rounded-xl border ${themeClasses.border.primary} space-y-6`}>
                  {/* Employee Basic Info */}
                  <div className="text-center">
                    <h3 className={`text-xl font-bold ${themeClasses.text.primary}`}>{emp?.fullName}</h3>
                    <p className={`text-sm ${themeClasses.text.secondary}`}>{emp?.employeeCode}</p>
                    <span className={`inline-block mt-2 px-3 py-1 ${themeClasses.bg.tertiary} ${themeClasses.text.secondary} rounded-full text-sm border ${themeClasses.border.primary}`}>
                      {emp?.department}
                    </span>
                  </div>

                  

                  {/* Employee Details */}
                  <div className="space-y-3 pt-3 border-t ${themeClasses.border.primary}">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <FiUser className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className={`text-xs ${themeClasses.text.secondary}`}>Employee ID</p>
                        <p className={`font-medium ${themeClasses.text.primary}`}>{emp?.employeeCode}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <FiBriefcase className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className={`text-xs ${themeClasses.text.secondary}`}>Department</p>
                        <p className={`font-medium ${themeClasses.text.primary}`}>{emp?.department}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <FiCalendar className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className={`text-xs ${themeClasses.text.secondary}`}>Month</p>
                        <p className={`font-medium ${themeClasses.text.primary}`}>{currentMonthName} {currentYear}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <FiClock className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className={`text-xs ${themeClasses.text.secondary}`}>Working Days</p>
                        <p className={`font-medium ${themeClasses.text.primary}`}>{totalWorkingDays} days</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Summary View - FIXED: Filter employees based on selectedEmployee */}
      {viewMode === "summary" && (
        <div className={`${themeClasses.bg.secondary} rounded-xl p-1 border ${themeClasses.border.primary} mb-8`}>
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full">
              <thead className={themeClasses.bg.tertiary}>
                <tr>
                  <th className={`p-4 text-left text-sm font-semibold ${themeClasses.text.secondary}`}>Employee</th>
                  <th className={`p-4 text-left text-sm font-semibold ${themeClasses.text.secondary}`}>Department</th>
                  <th className={`p-4 text-left text-sm font-semibold ${themeClasses.text.secondary}`}>Present</th>
                  <th className={`p-4 text-left text-sm font-semibold ${themeClasses.text.secondary}`}>Absent</th>
                  <th className={`p-4 text-left text-sm font-semibold ${themeClasses.text.secondary}`}>Leave</th>
                  <th className={`p-4 text-left text-sm font-semibold ${themeClasses.text.secondary}`}>Late Days</th>
                  <th className={`p-4 text-left text-sm font-semibold ${themeClasses.text.secondary}`}>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {/* Filter employees based on selectedEmployee */}
                {(selectedEmployee === 'all' ? employees : employees.filter(emp => emp.id === parseInt(selectedEmployee))).map(emp => {
                  // Aggregate data for this employee
                  let presentCount = 0;
                  let absentCount = 0;
                  let leaveCount = 0;
                  let lateCount = 0;

                  processedData.forEach(day => {
                    if (day.isWeekend) return;
                    const empDay = day.employees.find(e => e.id === emp.id);
                    if (empDay) {
                      if (empDay.status === 'present') presentCount++;
                      if (empDay.status === 'absent') absentCount++;
                      if (empDay.status === 'leave') leaveCount++;
                      // late check
                    }
                  });

                  const totalWorkingDays = processedData.filter(d => !d.isWeekend).length;
                  const attendancePercentage = totalWorkingDays > 0 ? Math.round((presentCount / totalWorkingDays) * 100) : 0;

                  return (
                    <tr key={emp.id} className={`hover:${themeClasses.bg.tertiary}/50 transition-colors border-b ${themeClasses.border.primary}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 flex items-center justify-center text-white font-bold">
                            {emp.fullName ? emp.fullName[0] : ''}
                          </div>
                          <div>
                            <p className={`font-medium ${themeClasses.text.primary}`}>{emp.fullName}</p>
                            <p className={`text-sm ${themeClasses.text.secondary}`}>{emp.employeeCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 ${themeClasses.bg.tertiary} ${themeClasses.text.secondary} rounded-full text-sm border ${themeClasses.border.primary}`}>
                          {emp.department || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{absentCount}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{leaveCount}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{lateCount}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className={`h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-full overflow-hidden`}>
                              <div
                                className={`h-full rounded-full ${attendancePercentage >= 90 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                                  attendancePercentage >= 75 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-rose-500 to-rose-400'
                                  }`}
                                style={{ width: `${attendancePercentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className={`text-lg font-bold ${attendancePercentage >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                            attendancePercentage >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                            {attendancePercentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className={`${themeClasses.bg.secondary} rounded-xl p-6 border ${themeClasses.border.primary} mb-8`}>
        <h3 className={`text-sm font-semibold ${themeClasses.text.primary} mb-4`}>Attendance Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">✓</div>
            <span className={`text-sm ${themeClasses.text.primary}`}>Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">✗</div>
            <span className={`text-sm ${themeClasses.text.primary}`}>Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30 flex items-center justify-center">W</div>
            <span className={`text-sm ${themeClasses.text.primary}`}>Weekend/Holiday</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyAttendance;