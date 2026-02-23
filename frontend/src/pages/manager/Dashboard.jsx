// src/pages/manager/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  Download,
  Eye,
  Plus,
  PieChart,
  LineChart,
  Activity,
  Target,
  ChevronDown,
  Building,
  FileText,
  Briefcase,
  UserPlus,
  Award,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { managerService } from '../../services/managerService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [showExportOptions, setShowExportOptions] = useState(false);
  const { isDarkMode = true } = useOutletContext() || {};

  // Get theme colors based on dark mode - matching homepage
  const themeColors = isDarkMode ? {
    primary: '#8b5cf6',      // Purple from homepage
    secondary: '#10b981',    // Green from homepage
    accent: '#3b82f6',       // Blue from homepage
    warning: '#f59e0b',      // Amber for warnings
    danger: '#ef4444',       // Red for alerts
    background: '#0f172a',   // Dark background from homepage
    card: '#1e293b',         // Dark card background
    text: '#f9fafb',         // Light text
    muted: '#9ca3af',        // Muted text
    border: '#374151',       // Border color
    grid: '#334155',         // Grid line color
  } : {
    primary: '#2563eb',      // Blue from charts
    secondary: '#10b981',    // Green from attendance
    accent: '#8b5cf6',       // Purple for highlights
    warning: '#f59e0b',      // Amber for warnings
    danger: '#ef4444',       // Red for alerts
    background: '#f8fafc',   // Light slate background
    card: '#ffffff',         // White cards
    text: '#1e293b',         // Slate 800 for text
    muted: '#64748b',        // Slate 500 for muted text
    border: '#e2e8f0',       // Light border
    grid: '#e2e8f0',         // Grid line color
  };

  // State for dashboard data
  const [statsData, setStatsData] = useState({
    totalEmployees: 0,
    todaysAttendance: 0,
    departments: 0,
    activeJobs: 0,
    pendingLeaves: 0,
    payrollDue: 0,
  });

  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const [leaveDistribution, setLeaveDistribution] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [departmentPerformance, setDepartmentPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await managerService.getTeamStats();
        const data = response.data;

        if (data) {
          setStatsData(data.stats);
          setDepartmentPerformance(data.departmentPerf || []);
          setWeeklyAttendance(data.weeklyAtt || []);
          setLeaveDistribution(data.leaveDist || []);
          setTodayAttendance(data.todayAtt || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        setStatsData(prev => ({ ...prev, error: error.message }));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (statsData.error) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl text-red-500 font-bold">Dashboard Error</h2>
        <p className="text-gray-600">{statsData.error}</p>
        <p className="text-sm mt-2">Please check console for details.</p>
      </div>
    );
  }

  // Navigation handlers
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Action handlers
  const handleSendReminder = async (employeeId, employeeName) => {
    const confirmed = window.confirm(`Send attendance reminder to ${employeeName}?`);
    if (confirmed) {
      try {
        await managerService.sendReminder(employeeId);
        alert(`Reminder sent to ${employeeName}`);
      } catch (error) {
        console.error("Failed to send reminder:", error);
        alert(`Failed to send reminder to ${employeeName}`);
      }
    }
  };

  // Calculate total leaves for pie chart
  const totalLeaves = leaveDistribution.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className={`p-4 md:p-6 min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`} style={{ backgroundColor: themeColors.background }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold transition-colors duration-300" style={{ color: themeColors.text }}>Dashboard</h1>
        <p className="text-sm transition-colors duration-300" style={{ color: themeColors.muted }}>Overview of your organization's performance</p>
      </div>

      {/* Welcome Card */}
      <div className="mb-6 p-6 rounded-xl shadow-sm transition-colors duration-300" style={{
        backgroundColor: themeColors.card,
        border: `1px solid ${themeColors.border}`
      }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1 transition-colors duration-300" style={{ color: themeColors.text }}>Welcome back, Manager!</h2>
            <p className="transition-colors duration-300" style={{ color: themeColors.muted }}>Here's what's happening with your organization today.</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="p-4 rounded-lg shadow-sm transition-colors duration-300" style={{
          backgroundColor: themeColors.card,
          border: `1px solid ${themeColors.border}`
        }}>
          <div className="flex items-center justify-between mb-2">
            <Users size={20} style={{ color: themeColors.primary }} />
            <span className="text-xs px-2 py-1 rounded-full transition-colors duration-300" style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}>
              +5%
            </span>
          </div>
          <p className="text-sm transition-colors duration-300" style={{ color: themeColors.muted }}>Total Employees</p>
          <p className="text-2xl font-bold mt-1 transition-colors duration-300" style={{ color: themeColors.text }}>{statsData.totalEmployees}</p>
        </div>

        <div className="p-4 rounded-lg shadow-sm transition-colors duration-300" style={{
          backgroundColor: themeColors.card,
          border: `1px solid ${themeColors.border}`
        }}>
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={20} style={{ color: themeColors.secondary }} />
            <span className="text-xs px-2 py-1 rounded-full transition-colors duration-300" style={{ backgroundColor: `${themeColors.secondary}20`, color: themeColors.secondary }}>
              +2.5%
            </span>
          </div>
          <p className="text-sm transition-colors duration-300" style={{ color: themeColors.muted }}>Today's Attendance</p>
          <p className="text-2xl font-bold mt-1 transition-colors duration-300" style={{ color: themeColors.text }}>{statsData.todaysAttendance}</p>
        </div>

        <div className="p-4 rounded-lg shadow-sm transition-colors duration-300" style={{
          backgroundColor: themeColors.card,
          border: `1px solid ${themeColors.border}`
        }}>
          <div className="flex items-center justify-between mb-2">
            <Building size={20} style={{ color: themeColors.accent }} />
            <span className="text-xs px-2 py-1 rounded-full transition-colors duration-300" style={{ backgroundColor: `${themeColors.accent}20`, color: themeColors.accent }}>
              +2
            </span>
          </div>
          <p className="text-sm transition-colors duration-300" style={{ color: themeColors.muted }}>Departments</p>
          <p className="text-2xl font-bold mt-1 transition-colors duration-300" style={{ color: themeColors.text }}>{statsData.departments}</p>
        </div>

        <div className="p-4 rounded-lg shadow-sm transition-colors duration-300" style={{
          backgroundColor: themeColors.card,
          border: `1px solid ${themeColors.border}`
        }}>
          <div className="flex items-center justify-between mb-2">
            <Briefcase size={20} style={{ color: themeColors.warning }} />
            <span className="text-xs px-2 py-1 rounded-full transition-colors duration-300" style={{ backgroundColor: `${themeColors.warning}20`, color: themeColors.warning }}>
              Active
            </span>
          </div>
          <p className="text-sm transition-colors duration-300" style={{ color: themeColors.muted }}>Active Jobs</p>
          <p className="text-2xl font-bold mt-1 transition-colors duration-300" style={{ color: themeColors.text }}>{statsData.activeJobs}</p>
        </div>

        <div className="p-4 rounded-lg shadow-sm transition-colors duration-300" style={{
          backgroundColor: themeColors.card,
          border: `1px solid ${themeColors.border}`
        }}>
          <div className="flex items-center justify-between mb-2">
            <Calendar size={20} style={{ color: themeColors.danger }} />
            <span className="text-xs px-2 py-1 rounded-full transition-colors duration-300" style={{ backgroundColor: `${themeColors.danger}20`, color: themeColors.danger }}>
              New
            </span>
          </div>
          <p className="text-sm transition-colors duration-300" style={{ color: themeColors.muted }}>Pending Leaves</p>
          <p className="text-2xl font-bold mt-1 transition-colors duration-300" style={{ color: themeColors.text }}>{statsData.pendingLeaves}</p>
        </div>

        <div className="p-4 rounded-lg shadow-sm transition-colors duration-300" style={{
          backgroundColor: themeColors.card,
          border: `1px solid ${themeColors.border}`
        }}>
          <div className="flex items-center justify-between mb-2">
            <FileText size={20} style={{ color: themeColors.primary }} />
            <span className="text-xs px-2 py-1 rounded-full transition-colors duration-300" style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}>
              Today
            </span>
          </div>
          <p className="text-sm transition-colors duration-300" style={{ color: themeColors.muted }}>Payroll Due</p>
          <p className="text-2xl font-bold mt-1 transition-colors duration-300" style={{ color: themeColors.text }}>{statsData.payrollDue}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Department Performance Chart */}
        <div className="p-6 rounded-xl shadow-sm transition-colors duration-300" style={{
          backgroundColor: themeColors.card,
          border: `1px solid ${themeColors.border}`
        }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold transition-colors duration-300" style={{ color: themeColors.text }}>Department Performance</h3>
              <p className="text-xs transition-colors duration-300 mt-1" style={{ color: themeColors.muted }}>Attendance rate by department</p>
            </div>
            <button
              onClick={() => handleNavigation('/manager/departments')}
              className="text-sm font-medium transition-colors duration-300 hover:opacity-80 cursor-pointer"
              style={{ color: themeColors.primary }}
            >
              View Details →
            </button>
          </div>

          <div className="space-y-6">
            {departmentPerformance.length > 0 ? (
              departmentPerformance.map((dept, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: themeColors.text }} className="font-medium">{dept.name}</span>
                    <div className="flex items-center gap-2">
                      <span style={{ color: themeColors.text }} className="font-bold">{dept.attendance}%</span>
                      {dept.attendance >= 90 ? (
                        <TrendingUp size={14} style={{ color: themeColors.secondary }} />
                      ) : dept.attendance >= 80 ? (
                        <Activity size={14} style={{ color: themeColors.warning }} />
                      ) : (
                        <TrendingDown size={14} style={{ color: themeColors.danger }} />
                      )}
                    </div>
                  </div>
                  <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: `${themeColors.primary}20` }}>
                    <div
                      className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${dept.attendance}%`,
                        background: `linear-gradient(90deg, ${dept.color || themeColors.primary}, ${themeColors.accent})`,
                        boxShadow: `0 0 8px ${dept.color || themeColors.primary}60`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs transition-colors duration-300" style={{ color: themeColors.muted }}>
                    <span>Productivity: {dept.productivity}%</span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      dept.attendance >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      dept.attendance >= 80 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {dept.attendance >= 90 ? 'Excellent' : dept.attendance >= 80 ? 'Good' : 'Needs Improvement'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8" style={{ color: themeColors.muted }}>
                No department data available
              </div>
            )}
          </div>
        </div>

        {/* Weekly Attendance Trend Chart */}
        <div className="p-6 rounded-xl shadow-sm transition-colors duration-300" style={{
          backgroundColor: themeColors.card,
          border: `1px solid ${themeColors.border}`
        }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold transition-colors duration-300" style={{ color: themeColors.text }}>Weekly Attendance Trends</h3>
              <p className="text-xs transition-colors duration-300 mt-1" style={{ color: themeColors.muted }}>Daily attendance overview</p>
            </div>
            <button
              onClick={() => handleNavigation('/manager/attendance')}
              className="text-sm font-medium transition-colors duration-300 hover:opacity-80 cursor-pointer"
              style={{ color: themeColors.primary }}
            >
              View Details →
            </button>
          </div>

          {/* Chart with axes */}
          <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute -left-2 top-0 h-48 flex flex-col justify-between text-xs" style={{ color: themeColors.muted }}>
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
            
            {/* Chart area */}
            <div className="ml-8">
              {/* Grid lines */}
              <div className="relative h-48 mb-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="absolute w-full border-t border-dashed"
                    style={{
                      top: `${i * 25}%`,
                      borderColor: themeColors.grid,
                      opacity: 0.3
                    }}
                  />
                ))}
                
                {/* Bars */}
                <div className="flex items-end justify-around h-full">
                  {weeklyAttendance.length > 0 ? (
                    weeklyAttendance.map((day, index) => {
                      const total = (day.present || 0) + (day.absent || 0);
                      const presentPercentage = total > 0 ? (day.present / total) * 100 : 0;
                      const absentPercentage = total > 0 ? 100 - presentPercentage : 0;

                      return (
                        <div key={index} className="flex flex-col items-center w-full max-w-[40px]">
                          <div className="relative w-full h-40 group">
                            {/* Tooltip */}
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Present: {day.present || 0} | Absent: {day.absent || 0}
                            </div>
                            
                            {/* Present bar */}
                            <div
                              className="absolute bottom-0 w-8 left-1/2 transform -translate-x-1/2 rounded-t transition-all duration-300 hover:opacity-90 cursor-pointer"
                              style={{
                                height: `${presentPercentage}%`,
                                background: `linear-gradient(180deg, ${themeColors.secondary}, ${themeColors.secondary}80)`,
                                boxShadow: `0 -2px 8px ${themeColors.secondary}40`
                              }}
                            />
                            
                            {/* Absent bar (stacked on top) - shown as pattern */}
                            {absentPercentage > 0 && (
                              <div
                                className="absolute w-8 left-1/2 transform -translate-x-1/2 rounded-b"
                                style={{
                                  bottom: `${presentPercentage}%`,
                                  height: `${absentPercentage}%`,
                                  background: `repeating-linear-gradient(45deg, ${themeColors.danger}20, ${themeColors.danger}20 4px, ${themeColors.danger}40 4px, ${themeColors.danger}40 8px)`,
                                  borderTop: `1px solid ${themeColors.danger}`
                                }}
                              />
                            )}
                          </div>
                          
                          {/* X-axis labels */}
                          <span className="text-xs mt-2 font-medium" style={{ color: themeColors.text }}>{day.day}</span>
                          <div className="text-[10px] mt-0.5" style={{ color: themeColors.muted }}>
                            {day.present || 0}/{total || 0}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 w-full" style={{ color: themeColors.muted }}>
                      No attendance data available
                    </div>
                  )}
                </div>
              </div>

              {/* X-axis line */}
              {weeklyAttendance.length > 0 && (
                <>
                  <div className="w-full h-px mt-1" style={{ backgroundColor: themeColors.grid }} />
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: themeColors.secondary }} />
                      <span style={{ color: themeColors.muted }}>Present</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-sm" style={{ 
                        background: `repeating-linear-gradient(45deg, ${themeColors.danger}40, ${themeColors.danger}40 2px, transparent 2px, transparent 4px)`,
                        border: `1px solid ${themeColors.danger}`
                      }} />
                      <span style={{ color: themeColors.muted }}>Absent</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leave Distribution & Today's Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Leave Distribution Chart */}
        <div className="p-6 rounded-xl shadow-sm transition-colors duration-300" style={{
          backgroundColor: themeColors.card,
          border: `1px solid ${themeColors.border}`
        }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold transition-colors duration-300" style={{ color: themeColors.text }}>Leave Distribution</h3>
              <p className="text-xs transition-colors duration-300 mt-1" style={{ color: themeColors.muted }}>Current leave types breakdown</p>
            </div>
            <button
              onClick={() => handleNavigation('/manager/leave-approval')}
              className="text-sm font-medium transition-colors duration-300 hover:opacity-80 cursor-pointer"
              style={{ color: themeColors.primary }}
            >
              View All →
            </button>
          </div>

          {leaveDistribution.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Legend */}
              <div className="space-y-3">
                {leaveDistribution.map((leave, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg transition-colors duration-300 hover:bg-opacity-80" style={{ backgroundColor: `${leave.color}10` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: leave.color, boxShadow: `0 0 8px ${leave.color}` }} />
                      <span className="text-sm font-medium" style={{ color: themeColors.text }}>{leave.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold" style={{ color: themeColors.text }}>{leave.count}</span>
                      <span className="text-xs" style={{ color: themeColors.muted }}>
                        ({totalLeaves > 0 ? Math.round((leave.count / totalLeaves) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pie Chart */}
              <div className="relative flex items-center justify-center">
                <div className="relative w-40 h-40">
                  {/* Outer border circle */}
                  <div 
                    className="absolute inset-0 rounded-full border-2 z-10" 
                    style={{ 
                      borderColor: themeColors.border,
                      boxShadow: `0 0 0 1px ${themeColors.border}` 
                    }}
                  />
                  
                  {/* SVG for pie segments */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="76"
                      fill="none"
                    />
                    
                    {/* Pie segments */}
                    {leaveDistribution.reduce((acc, leave, index) => {
                      const percentage = totalLeaves > 0 ? leave.count / totalLeaves : 0;
                      const startAngle = acc.reduce((sum, l) => sum + l.percentage, 0) * 360;
                      const angle = percentage * 360;
                      
                      const startRad = (startAngle) * Math.PI / 180;
                      const endRad = (startAngle + angle) * Math.PI / 180;
                      
                      const x1 = 80 + 68 * Math.cos(startRad);
                      const y1 = 80 + 68 * Math.sin(startRad);
                      const x2 = 80 + 68 * Math.cos(endRad);
                      const y2 = 80 + 68 * Math.sin(endRad);
                      
                      const largeArcFlag = angle > 180 ? 1 : 0;
                      
                      const pathData = [
                        `M 80 80`,
                        `L ${x1} ${y1}`,
                        `A 68 68 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `Z`
                      ].join(' ');
                      
                      acc.push({
                        ...leave,
                        percentage,
                        path: pathData
                      });
                      
                      return acc;
                    }, []).map((segment, idx) => (
                      <path
                        key={idx}
                        d={segment.path}
                        fill={segment.color}
                        stroke={themeColors.card}
                        strokeWidth="1.5"
                        className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                        style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.1))` }}
                      >
                        <title>{`${segment.type}: ${segment.count} employees (${Math.round(segment.percentage * 100)}%)`}</title>
                      </path>
                    ))}
                  </svg>
                  
                  {/* Inner circle for center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" 
                      style={{ 
                        backgroundColor: themeColors.background,
                        border: `2px solid ${themeColors.border}`
                      }}
                    >
                      <div className="text-center">
                        <p className="text-xl font-bold" style={{ color: themeColors.text }}>{totalLeaves}</p>
                        <p className="text-[10px]" style={{ color: themeColors.muted }}>Total</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: themeColors.muted }}>
              No leave data available
            </div>
          )}
        </div>

        {/* Today's Attendance */}
        <div className="p-6 rounded-xl shadow-sm transition-colors duration-300" style={{
          backgroundColor: themeColors.card,
          border: `1px solid ${themeColors.border}`
        }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold transition-colors duration-300" style={{ color: themeColors.text }}>Today's Attendance</h3>
            <button
              onClick={() => handleNavigation('/manager/attendance')}
              className="text-sm font-medium flex items-center space-x-1 transition-colors duration-300 hover:opacity-80 cursor-pointer"
              style={{ color: themeColors.primary }}
            >
              <Eye size={14} />
              <span>View Details</span>
            </button>
          </div>

          {todayAttendance.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {todayAttendance.map((employee) => (
                <div
                  key={employee.id}
                  className="p-4 rounded-lg border transition-colors duration-300 hover:shadow-md"
                  style={{
                    borderColor: employee.status === 'Present' ? `${themeColors.secondary}30` :
                      employee.status === 'Late' ? `${themeColors.warning}30` :
                        `${themeColors.danger}30`,
                    backgroundColor: employee.status === 'Present' ? `${themeColors.secondary}10` :
                      employee.status === 'Late' ? `${themeColors.warning}10` :
                        `${themeColors.danger}10`
                  }}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      employee.status === 'Present' ? 'bg-green-100 dark:bg-green-900/20' :
                      employee.status === 'Late' ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      <span className={`font-semibold transition-colors duration-300 ${
                        employee.status === 'Present' ? 'text-green-800 dark:text-green-300' :
                        employee.status === 'Late' ? 'text-yellow-800 dark:text-yellow-300' : 'text-red-800 dark:text-red-300'
                      }`}>
                        {employee.avatar}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium transition-colors duration-300" style={{ color: themeColors.text }}>{employee.name}</p>
                      <p className="text-xs transition-colors duration-300" style={{ color: themeColors.muted }}>{employee.employeeId}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium transition-colors duration-300 ${
                      employee.status === 'Present' ? 'text-green-600 dark:text-green-400' :
                      employee.status === 'Late' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {employee.status}
                    </span>
                    <span className="text-sm transition-colors duration-300" style={{ color: themeColors.muted }}>{employee.time}</span>
                  </div>
                  {employee.status === 'Absent' && (
                    <button
                      onClick={() => handleSendReminder(employee.employeeDbId, employee.name)}
                      className="mt-3 w-full text-xs py-1.5 rounded font-medium transition-colors duration-300 hover:opacity-90 cursor-pointer"
                      style={{ backgroundColor: themeColors.danger, color: 'white' }}
                    >
                      Send Reminder
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: themeColors.muted }}>
              No attendance data for today
            </div>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="p-6 rounded-xl shadow-sm mb-6 transition-colors duration-300" style={{
        backgroundColor: themeColors.card,
        border: `1px solid ${themeColors.border}`
      }}>
        <h3 className="text-lg font-semibold mb-6 transition-colors duration-300" style={{ color: themeColors.text }}>Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border transition-colors duration-300 hover:shadow-md" style={{ borderColor: `${themeColors.secondary}30`, backgroundColor: `${themeColors.secondary}10` }}>
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp size={20} style={{ color: themeColors.secondary }} />
              <span className="font-medium transition-colors duration-300" style={{ color: themeColors.text }}>Attendance Improvement</span>
            </div>
            <p className="text-sm transition-colors duration-300" style={{ color: themeColors.muted }}>
              Overall attendance improved by 2.5% this month
            </p>
            <div className="mt-3 flex items-center text-xs" style={{ color: themeColors.secondary }}>
              <ArrowUpRight size={12} className="mr-1" />
              <span>+2.5% vs last month</span>
            </div>
          </div>

          <div className="p-4 rounded-lg border transition-colors duration-300 hover:shadow-md" style={{ borderColor: `${themeColors.primary}30`, backgroundColor: `${themeColors.primary}10` }}>
            <div className="flex items-center space-x-2 mb-3">
              <Activity size={20} style={{ color: themeColors.primary }} />
              <span className="font-medium transition-colors duration-300" style={{ color: themeColors.text }}>Productivity Peak</span>
            </div>
            <p className="text-sm transition-colors duration-300" style={{ color: themeColors.muted }}>
              Sales department leads with 99% productivity
            </p>
            <div className="mt-3 flex items-center text-xs" style={{ color: themeColors.primary }}>
              <Award size={12} className="mr-1" />
              <span>Top performer this month</span>
            </div>
          </div>

          <div className="p-4 rounded-lg border transition-colors duration-300 hover:shadow-md" style={{ borderColor: `${themeColors.accent}30`, backgroundColor: `${themeColors.accent}10` }}>
            <div className="flex items-center space-x-2 mb-3">
              <Target size={20} style={{ color: themeColors.accent }} />
              <span className="font-medium transition-colors duration-300" style={{ color: themeColors.text }}>Monthly Target</span>
            </div>
            <p className="text-sm transition-colors duration-300" style={{ color: themeColors.muted }}>
              On track to achieve 94% attendance target
            </p>
            <div className="mt-3 w-full bg-white/30 rounded-full h-1.5">
              <div className="h-1.5 rounded-full" style={{ width: '94%', backgroundColor: themeColors.accent }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 rounded-xl shadow-sm transition-colors duration-300" style={{
        backgroundColor: themeColors.card,
        border: `1px solid ${themeColors.border}`
      }}>
        <h3 className="text-lg font-semibold mb-4 transition-colors duration-300" style={{ color: themeColors.text }}>Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleNavigation('/manager/employees')}
            className="flex flex-col items-center justify-center p-4 rounded-lg hover:opacity-90 transition-all duration-300 hover:scale-105 cursor-pointer"
            style={{ backgroundColor: `${themeColors.primary}10` }}
          >
            <Users size={24} style={{ color: themeColors.primary }} className="mb-2 transition-colors duration-300" />
            <span className="text-sm font-medium transition-colors duration-300" style={{ color: themeColors.text }}>Team Roster</span>
          </button>

          <button
            onClick={() => handleNavigation('/manager/attendance')}
            className="flex flex-col items-center justify-center p-4 rounded-lg hover:opacity-90 transition-all duration-300 hover:scale-105 cursor-pointer"
            style={{ backgroundColor: `${themeColors.secondary}10` }}
          >
            <Calendar size={24} style={{ color: themeColors.secondary }} className="mb-2 transition-colors duration-300" />
            <span className="text-sm font-medium transition-colors duration-300" style={{ color: themeColors.text }}>Attendance</span>
          </button>

          <button
            onClick={() => handleNavigation('/manager/attendance/calendar')}
            className="flex flex-col items-center justify-center p-4 rounded-lg hover:opacity-90 transition-all duration-300 hover:scale-105 cursor-pointer"
            style={{ backgroundColor: `${themeColors.accent}10` }}
          >
            <Calendar size={24} style={{ color: themeColors.accent }} className="mb-2 transition-colors duration-300" />
            <span className="text-sm font-medium transition-colors duration-300" style={{ color: themeColors.text }}>Leave Calendar</span>
          </button>

          <button
            onClick={() => handleNavigation('/manager/leave-approval')}
            className="flex flex-col items-center justify-center p-4 rounded-lg hover:opacity-90 transition-all duration-300 hover:scale-105 cursor-pointer"
            style={{ backgroundColor: `${themeColors.warning}10` }}
          >
            <Plus size={24} style={{ color: themeColors.warning }} className="mb-2 transition-colors duration-300" />
            <span className="text-sm font-medium transition-colors duration-300" style={{ color: themeColors.text }}>Add Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;