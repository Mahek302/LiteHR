import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import employeeService from "../../services/employeeService";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import {
  Home,
  Clock,
  FileText,
  Calendar,
  Shield,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  Search,
  Download,
  Eye,
  ChevronRight,
  Plus,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Receipt,
  Wallet,
  Banknote,
  FileSpreadsheet,
  CalendarDays,
  Users,
  Sun,
  Moon,
  ChevronLeft,
  ChevronDown,
  FileCheck,
  Target,
  BarChart3,
  TrendingUp as TrendingUpIcon,
  PieChart,
  Activity,
  Check,
  MoreVertical,
  ChevronUp,
  ChevronsUp,
  Briefcase,
  Timer,
  Award,
  Star,
  Circle,
  CheckSquare,
  Square,
  Clock as ClockIcon,
  LogOut as LogOutIcon,
  Coffee,
  Umbrella,
  Heart,
  Plane,
  Home as HomeIcon,
  Building,
  Calendar as CalendarIcon,
  Zap,
  Battery,
  BatteryCharging,
  Wifi,
  WifiOff,
  EyeOff
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { MdOutlineSick } from "react-icons/md";
import { CiCalendar } from "react-icons/ci";
import { FaRegCalendarCheck } from "react-icons/fa6";

// Helper for safe date string
const getSafeDateStr = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeLeaveType = (type) => String(type || "").trim().toLowerCase();
const normalizeLeaveStatus = (status) => String(status || "").trim().toLowerCase();

const isCasualLeaveType = (type) => {
  const leaveType = normalizeLeaveType(type);
  return leaveType === "cl" || leaveType.includes("casual");
};

const isSickLeaveType = (type) => {
  const leaveType = normalizeLeaveType(type);
  return leaveType === "sl" || leaveType.includes("sick");
};

const isEarnedLeaveType = (type) => {
  const leaveType = normalizeLeaveType(type);
  return (
    leaveType === "al" ||
    leaveType === "el" ||
    leaveType === "pl" ||
    leaveType.includes("earned") ||
    leaveType.includes("annual") ||
    leaveType.includes("privilege") ||
    leaveType.includes("paid")
  );
};

const isApprovedLeave = (leave) => normalizeLeaveStatus(leave?.status) === "approved";

const EmployeeDashboard = () => {
  // Theme state
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    // Sync active section with URL path
    const path = location.pathname.split('/').pop();
    if (path && path !== 'employee') {
      setActiveSection(path);
    } else {
      setActiveSection('dashboard');
    }
  }, [location]);

  // Attendance state
  const [isClockedIn, setIsClockedIn] = useState(true);
  const [clockInTime, setClockInTime] = useState("09:00 AM");
  const [clockOutTime, setClockOutTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateDetails, setShowDateDetails] = useState(false);

  // Task state
  const [tasks, setTasks] = useState([]);
  const [completedTasksHistory, setCompletedTasksHistory] = useState([]);
  const [completedTaskTimers, setCompletedTaskTimers] = useState({});
  const [showCompletedHistory, setShowCompletedHistory] = useState(false);
  const [historyDateFilter, setHistoryDateFilter] = useState("");
  const [historyMonthFilter, setHistoryMonthFilter] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");

  // Form states
  const [newLeave, setNewLeave] = useState({
    type: "casual",
    from: "",
    to: "",
    reason: "",
    contactNumber: "",
    showContactNumber: false
  });



  const [newWorklog, setNewWorklog] = useState({
    task: "",
    description: "",
    time: "",
    project: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Filter states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showWorklogModal, setShowWorklogModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Worklog filters
  const [worklogDateFilter, setWorklogDateFilter] = useState("");
  const [worklogMonthFilter, setWorklogMonthFilter] = useState("");

  // Leave filters
  const [leaveMonthFilter, setLeaveMonthFilter] = useState("");
  const [leaveDateFilter, setLeaveDateFilter] = useState("");
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("all");

  // Enhanced attendance data for calendar with mark-in/out details
  const [attendanceData, setAttendanceData] = useState({});

  // Holiday data
  const [holidayData, setHolidayData] = useState({});

  // Leave Types
  const [leaveTypes, setLeaveTypes] = useState([]);

  // Sample data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Payslip Available",
      message: "December payslip is ready to view",
      time: "2 hours ago",
      read: false,
      type: "info",
    },
  ]);

  const [payslips, setPayslips] = useState([]);
  const [worklogs, setWorklogs] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({
    casual: 0,
    sick: 0,
    earned: 0,
  });
  const [leaves, setLeaves] = useState([]);
  const [viewPayslip, setViewPayslip] = useState(null);
  const [personalDocuments, setPersonalDocuments] = useState([]);

  // Analytics data
  // Derived Leave Stats - Moved here to access state
  // Calculate Used Leaves from approved leaves history
  const usedLeaves = {
    casual: leaves
      .filter((l) => isCasualLeaveType(l.type) && isApprovedLeave(l))
      .reduce((sum, l) => sum + (Number(l.days) || 0), 0),
    sick: leaves
      .filter((l) => isSickLeaveType(l.type) && isApprovedLeave(l))
      .reduce((sum, l) => sum + (Number(l.days) || 0), 0),
    earned: leaves
      .filter((l) => isEarnedLeaveType(l.type) && isApprovedLeave(l))
      .reduce((sum, l) => sum + (Number(l.days) || 0), 0)
  };

  // Calculate Total Leaves = Used + Remaining
  const totalLeaves = {
    casual: usedLeaves.casual + (leaveBalance.casual || 0),
    sick: usedLeaves.sick + (leaveBalance.sick || 0),
    earned: usedLeaves.earned + (leaveBalance.earned || 0)
  };

  // Analytics data
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  const fetchAllData = async () => {
    try {
      const [
        dashboardStats,
        attendanceRecords,
        tasksList,
        leavesList,
        worklogsList,
        leaveBalances,
        holidaysList,
        payslipsList,
        documentsList,
        leaveTypesList
      ] = await Promise.all([
        employeeService.getDashboardStats(),
        employeeService.getAttendance(),
        employeeService.getTasks(),
        employeeService.getLeaves(),
        employeeService.getWorklogs(),
        employeeService.getLeaveBalance(),
        employeeService.getHolidays(),
        employeeService.getPayslips(),
        employeeService.getDocuments(),
        employeeService.getLeaveTypes()
      ]);

      // Calculate weekly hours from worklogs
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);

      const weeklyHours = worklogsList
        .filter(w => new Date(w.date) >= startOfWeek)
        .reduce((sum, w) => sum + (parseFloat(w.hoursWorked) || 0), 0);

      // Map dashboard stats to analytics object expected by UI
      setAnalytics({
        ...dashboardStats,
        attendanceRate: dashboardStats.attendance?.totalDays ? Math.round((dashboardStats.attendance.presentDays / dashboardStats.attendance.totalDays) * 100) : 0,
        productivity: 90, // Mock/Placeholder
        tasksCompleted: dashboardStats.tasks?.completed + dashboardStats.tasks?.pending > 0
          ? Math.round((dashboardStats.tasks.completed / (dashboardStats.tasks.completed + dashboardStats.tasks.pending)) * 100)
          : 0,
        weeklyHours: weeklyHours.toFixed(1),
        leaveDays: dashboardStats.leaves?.used || 0,
        onTimeArrival: 100, // Placeholder
        workDays: dashboardStats.attendance?.totalDays || 0,
        overtimeHours: 0, // Placeholder
        monthlyHours: 0 // Placeholder
      });

      // Transform attendance array to object keyed by date
      const attendanceMap = {};
      attendanceRecords.forEach(record => {
        const dateStr = new Date(record.date).toISOString().split('T')[0];

        let hours = record.hours || 0;
        // If markIn/markOut exist and hours not calc, calc it
        if (!hours && record.markIn && record.markOut) {
          const start = new Date(record.markIn);
          const end = new Date(record.markOut);
          // Only calc if dates are valid
          if (!isNaN(start) && !isNaN(end)) {
            hours = ((end - start) / (1000 * 60 * 60)).toFixed(1);
          }
        }

        attendanceMap[dateStr] = {
          ...record,
          status: record.markIn ? 'present' : 'absent',
          hours: hours,
          markIn: record.markIn ? new Date(record.markIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
          markOut: record.markOut ? new Date(record.markOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
          rawMarkIn: record.markIn,
          rawMarkOut: record.markOut
        };
      });
      setAttendanceData(attendanceMap);

      // Check for today's attendance to set clock in/out state
      const todayStr = getSafeDateStr(new Date());

      const todayRecord = attendanceMap[todayStr];
      if (todayRecord) {
        // Check if marked in (and ignore placeholder string if any)
        const hasMarkedIn = todayRecord.markIn && todayRecord.markIn !== '--:--';
        const hasMarkedOut = todayRecord.markOut && todayRecord.markOut !== '--:--';

        if (hasMarkedIn && !hasMarkedOut) {
          setIsClockedIn(true);
          setClockInTime(todayRecord.markIn);
        } else if (hasMarkedIn && hasMarkedOut) {
          setIsClockedIn(false);
          setClockInTime(todayRecord.markIn);
          setClockOutTime(todayRecord.markOut);
        } else {
          setIsClockedIn(false);
          setClockInTime(null);
        }
      } else {
        setIsClockedIn(false);
        setClockInTime(null);
      }

      // Split tasks into active and history
      const activeTasks = [];
      const historyTasks = [];

      tasksList.forEach(t => {
        if (t.status === 'COMPLETED') {
          historyTasks.push({
            ...t,
            completed: true,
            completedAt: t.updatedAt || t.createdAt || new Date().toISOString(), // Fallback for filter
            historyStatus: 'Completed'
          });
        } else {
          activeTasks.push({
            ...t,
            completed: false
          });
        }
      });

      setTasks(activeTasks);
      setCompletedTasksHistory(historyTasks);

      setLeaves(leavesList.map(l => {
        const start = new Date(l.fromDate);
        const end = new Date(l.toDate);
        const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return {
          ...l,
          type: l.leaveType,
          status: normalizeLeaveStatus(l.status),
          from: l.fromDate,
          to: l.toDate,
          days: isNaN(days) ? 0 : days
        };
      }));
      setWorklogs(worklogsList.map(w => ({
        ...w,
        task: w.taskName || w.task || "Work Log",
        project: w.project || "",
        time: w.hoursWorked ? `${w.hoursWorked} hrs` : '--',
        status: "Completed"
      })));
      setPayslips(payslipsList);
      setPersonalDocuments(documentsList.documents || documentsList || []);

      // Process leave balance
      const balanceMap = { casual: 0, sick: 0, earned: 0 };
      if (Array.isArray(leaveBalances)) {
        leaveBalances.forEach(b => {
          // Backend returns flattened structure: { leaveType: "name", code: "code", ... }
          const typeName = (b.leaveType || b.LeaveType?.name || "").toLowerCase();
          const typeCode = (b.code || b.LeaveType?.code || "").toLowerCase();

          if (typeName.includes('casual') || typeCode === 'cl') balanceMap.casual = b.remaining;
          else if (typeName.includes('sick') || typeCode === 'sl') balanceMap.sick = b.remaining;
          else if (typeName.includes('earned') || typeName.includes('privilege') || typeCode === 'el' || typeCode === 'pl') balanceMap.earned = b.remaining;
        });
      }
      setLeaveBalance(balanceMap);

      // Process holidays
      const holidayMap = {};
      if (Array.isArray(holidaysList)) {
        holidaysList.forEach(h => {
          // Assuming holiday object has date and name/title
          // h.date could be ISO string
          const dateStr = new Date(h.date).toISOString().split('T')[0];
          holidayMap[dateStr] = h.name || h.title;
        });
      }
      setHolidayData(holidayMap);

      setLeaveTypes(Array.isArray(leaveTypesList) ? leaveTypesList : []);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      // Show more specific error if available
      const errMsg = err.response?.data?.message || err.message || "Failed to load dashboard data";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Graph data - Dynamic from tasks
  const [taskCompletionData, setTaskCompletionData] = useState([]);
  const [hoveredBar, setHoveredBar] = useState(null);

  // Calculate task completion stats when tasks or worklogs change
  useEffect(() => {
    if ((!tasks || tasks.length === 0) && (!worklogs || worklogs.length === 0)) {
      setTaskCompletionData([
        { week: "Week 1", completed: 0, total: 5, color: "#7C3AED" },
        { week: "Week 2", completed: 0, total: 5, color: "#2563EB" },
        { week: "Week 3", completed: 0, total: 5, color: "#10B981" },
        { week: "Week 4", completed: 0, total: 5, color: "#F59E0B" },
      ]);
      return;
    }

    const now = new Date();
    const stats = [];
    const colors = ["#7C3AED", "#2563EB", "#10B981", "#F59E0B"]; // Purple, Blue, Green, Amber

    // Generate last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - (i * 7 + 6)); // Start of the week window
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() - (i * 7)); // End of the week window
      endOfWeek.setHours(23, 59, 59, 999);

      // Filter tasks created within this window
      const weekTasks = tasks.filter(task => {
        const created = new Date(task.createdAt);
        return created >= startOfWeek && created <= endOfWeek;
      });

      // Filter worklogs created within this window
      const weekWorklogs = worklogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startOfWeek && logDate <= endOfWeek;
      });

      const tasksTotal = weekTasks.length;
      const tasksCompleted = weekTasks.filter(t => t.status === "COMPLETED").length;
      const worklogsCount = weekWorklogs.length;

      // Effective stats: Treat worklogs as "Ad-hoc tasks completed"
      // Total = Assigned Tasks + Ad-hoc Tasks (Worklogs)
      // Completed = Completed Assigned Tasks + Ad-hoc Tasks (Worklogs)
      const combinedTotal = tasksTotal + worklogsCount;
      const combinedCompleted = tasksCompleted + worklogsCount;

      const weekLabel = `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}-${endOfWeek.toLocaleDateString("en-US", { day: "numeric" })}`;

      stats.push({
        week: weekLabel,
        completed: combinedCompleted,
        total: combinedTotal || 5, // Ensure at least 5 for visual consistency
        color: colors[3 - i]
      });
    }

    setTaskCompletionData(stats);

  }, [tasks, worklogs]);

  // Calculate today's hours dynamically
  const [todayHours, setTodayHours] = useState("0h 0m");

  useEffect(() => {
    const calculateTodayHours = () => {
      const todayStr = getSafeDateStr(new Date());
      const todayRecord = attendanceData[todayStr];

      if (todayRecord && todayRecord.rawMarkIn) {
        const start = new Date(todayRecord.rawMarkIn);
        const end = todayRecord.rawMarkOut ? new Date(todayRecord.rawMarkOut) : new Date();

        if (!isNaN(start)) {
          const diffMs = end - start;
          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          setTodayHours(`${diffHrs}h ${diffMins}m`);
        } else {
          setTodayHours("0h 0m");
        }
      } else {
        setTodayHours("0h 0m");
      }
    };

    calculateTodayHours();
    // Re-calculate every minute if clocked in
    const interval = setInterval(calculateTodayHours, 60000);
    return () => clearInterval(interval);
  }, [attendanceData]);

  // Update current time every second for accuracy
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Timer for moving completed tasks to history
  useEffect(() => {
    const timers = { ...completedTaskTimers };

    Object.keys(timers).forEach(taskId => {
      if (!timers[taskId]) {
        // Start a 10-minute timer
        const timerId = setTimeout(() => {
          // Move task to completed history
          const taskToMove = tasks.find(t => t.id === taskId);
          if (taskToMove) {
            setCompletedTasksHistory(prev => [
              ...prev,
              { ...taskToMove, completedAt: new Date().toISOString(), historyStatus: 'Completed' }
            ]);

            // Remove from active tasks
            setTasks(prev => prev.filter(t => t.id !== taskId));

            // Clear the timer
            setCompletedTaskTimers(prev => {
              const newTimers = { ...prev };
              delete newTimers[taskId];
              return newTimers;
            });
          }
        }, 10 * 60 * 1000); // 10 minutes

        setCompletedTaskTimers(prev => ({
          ...prev,
          [taskId]: timerId
        }));
      }
    });

    return () => {
      Object.values(timers).forEach(timerId => {
        if (timerId) clearTimeout(timerId);
      });
    };
  }, [completedTaskTimers, tasks]);

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
      });
    }

    // Next month days
    const totalCells = 42;
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const changeMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getAttendanceStatus = (date) => {
    const dateStr = getSafeDateStr(date);
    return (
      attendanceData[dateStr] || {
        status: "not-marked",
        hours: 0,
        markIn: "--:--",
        markOut: "--:--",
        breaks: "--",
        overtime: "--",
        productivity: "--",
        notes: "No attendance marked",
      }
    );
  };

  const getHoliday = (date) => {
    const dateStr = getSafeDateStr(date);
    return holidayData[dateStr] || null;
  };

  // Enhanced date click handler
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowDateDetails(true);
  };

  // Task completion handler
  const handleTaskComplete = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const newStatus = task.completed ? "PENDING" : "COMPLETED"; // Assuming boolean toggle in UI
      // But verify backend status strings: "PENDING", "COMPLETED", "IN_PROGRESS"

      await employeeService.updateTaskStatus(taskId, task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED');

      // Optimistic update
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed, status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : task
        )
      );

      // If task is completed, set up timer for moving to history
      if (task.status !== 'COMPLETED') {
        // Task is being marked as completed
        setCompletedTaskTimers(prev => ({
          ...prev,
          [taskId]: null // Timer will be started by useEffect
        }));
      } else {
        // Task is being marked as incomplete - cancel timer if exists
        if (completedTaskTimers[taskId]) {
          clearTimeout(completedTaskTimers[taskId]);
          setCompletedTaskTimers(prev => {
            const newTimers = { ...prev };
            delete newTimers[taskId];
            return newTimers;
          });
        }

        // Also remove from completed history if present
        setCompletedTasksHistory(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (err) {
      console.error("Error updating task:", err);
      // Revert or show error
    }
  };

  // Undo task completion
  const handleUndoTask = (taskId) => {
    // Find task in history
    const taskToRestore = completedTasksHistory.find(t => t.id === taskId);
    if (taskToRestore) {
      // Remove from history
      setCompletedTasksHistory(prev => prev.filter(t => t.id !== taskId));

      // Add back to active tasks with PENDING status
      setTasks(prev => [
        ...prev,
        { ...taskToRestore, status: 'PENDING', completed: false }
      ]);

      toast.success('Task restored to active list');
    }
  };

  // Add new task
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    time: "",
    priority: "medium",
    project: "Alpha",
  });

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      if (!newTask.title) return; // Basic validation

      const createdTask = await employeeService.createTask({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority.toUpperCase(),
        project: newTask.project, // Note: Backend doesn't have project field in Task model? Investigating.
        // Task model has: title, description, assignedToEmployeeId, assignedByEmployeeId, status, priority, dueDate.
        // It does NOT have 'project' or 'time'. 'time' in frontend seems to be due date or specific time?
        // Frontend has 'time' and 'project'. Backend doesn't. 
        // For now, I will map project/time to description or omit them to prevent errors if backend ignores extra fields.
        // Or better, append to description.
      });

      // Actually, let's just send what we have. If backend ignores it, fine.
      // But we need to make sure we don't break strict mode if any.
      // Let's reload all data to get the fresh list with proper IDs
      await fetchAllData();

      setNewTask({
        title: "",
        description: "",
        time: "",
        priority: "medium",
        project: "Alpha",
      });
      setShowNewTaskModal(false);
    } catch (err) {
      console.error("Failed to add task:", err);
      // Optional: setError("Failed to add task");
    }
  };

  // Attendance functions
  const handleClockIn = async () => {
    try {
      await employeeService.markClockIn();
      setIsClockedIn(true);
      setClockInTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      fetchAllData(); // Refresh data
    } catch (err) {
      console.error("Clock in failed:", err);
    }
  };

  const handleClockOut = async () => {
    try {
      await employeeService.markClockOut();
      setIsClockedIn(false);
      setClockOutTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      fetchAllData(); // Refresh data
    } catch (err) {
      console.error("Clock out failed:", err);
    }
  };

  // Handle leave application
  const handleApplyLeave = async (e) => {
    e.preventDefault();

    // Validate Indian mobile number
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(newLeave.contactNumber)) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    try {
      await employeeService.applyLeave({
        leaveType: newLeave.type, // Sending the value directly (code or name)
        fromDate: newLeave.from,
        toDate: newLeave.to,
        reason: newLeave.reason,
        contactNumber: newLeave.contactNumber // Original number sent to backend
      });

      setShowLeaveModal(false);
      setNewLeave({ type: "casual", from: "", to: "", reason: "", contactNumber: "", showContactNumber: false });
      fetchAllData(); // Refresh list
    } catch (err) {
      console.error("Apply leave failed:", err);
    }
  };

  // Handle worklog submission
  const handleSubmitWorklog = async (e) => {
    e.preventDefault();
    try {
      await employeeService.addWorklog({
        taskName: newWorklog.task,
        description: newWorklog.description,
        hoursWorked: parseFloat(newWorklog.time),
        date: newWorklog.date,
        project: newWorklog.project // Keep the same field name for backend
      });

      setShowWorklogModal(false);
      setNewWorklog({
        task: "",
        description: "",
        time: "",
        project: "",
        date: new Date().toISOString().split("T")[0],
      });
      fetchAllData();
    } catch (err) {
      console.error("Add worklog failed:", err);
    }
  };

  // Filtered payslips
  const filteredPayslips = payslips.filter(
    (payslip) => Number(payslip.year) === Number(selectedYear)
  );

  // Filtered documents
  const filteredDocuments = personalDocuments.filter((doc) => {
    const matchesCategory =
      selectedCategory === "all" ||
      selectedCategory === "All Categories" ||
      doc.category === selectedCategory;

    const matchesSearch =
      searchQuery === "" ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Filtered worklogs
  const filteredWorklogs = worklogs.filter(log => {
    let matches = true;
    if (worklogDateFilter) {
      matches = matches && log.date === worklogDateFilter;
    }
    if (worklogMonthFilter) {
      const logMonth = new Date(log.date).getMonth() + 1;
      matches = matches && logMonth.toString() === worklogMonthFilter;
    }
    return matches;
  });

  // Filtered leaves with working filters
  const filteredLeaves = leaves.filter(leave => {
    let matches = true;

    // Date filter
    if (leaveDateFilter) {
      const leaveFromDate = new Date(leave.from).toISOString().split('T')[0];
      const leaveToDate = new Date(leave.to).toISOString().split('T')[0];
      // Check if filter date is within range
      matches = matches && (leaveDateFilter >= leaveFromDate && leaveDateFilter <= leaveToDate);
    }

    // Month filter
    if (leaveMonthFilter) {
      const leaveMonth = new Date(leave.from).getMonth() + 1;
      matches = matches && leaveMonth.toString() === leaveMonthFilter;
    }

    // Status filter
    if (leaveStatusFilter !== "all") {
      matches = matches && leave.status?.toLowerCase() === leaveStatusFilter.toLowerCase();
    }

    return matches;
  });

  // Filtered completed tasks history with working filters
  const filteredCompletedHistory = completedTasksHistory.filter(task => {
    let matches = true;

    // Date filter
    if (historyDateFilter && task.completedAt) {
      const taskDate = new Date(task.completedAt).toISOString().split('T')[0];
      matches = matches && taskDate === historyDateFilter;
    }

    // Month filter
    if (historyMonthFilter && task.completedAt) {
      const taskMonth = new Date(task.completedAt).getMonth() + 1;
      matches = matches && taskMonth.toString() === historyMonthFilter;
    }

    // Status filter
    if (historyStatusFilter !== "all") {
      matches = matches && task.historyStatus === historyStatusFilter;
    }

    return matches;
  });

  // Get full leave type name
  const getFullLeaveTypeName = (type) => {
    if (isSickLeaveType(type)) return "Sick Leave";
    if (isCasualLeaveType(type)) return "Casual Leave";
    if (isEarnedLeaveType(type)) return "Earned Leave";
    return type || "Leave";
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "present":
      case "work-from-home":
        return { bg: "#D1FAE5", text: "#10B981", icon: CheckCircle };
      case "late":
      case "half-day":
        return { bg: "#FEF3C7", text: "#F59E0B", icon: AlertCircle };
      case "absent":
        return { bg: "#FEE2E2", text: "#EF4444", icon: X };
      case "holiday":
        return { bg: "#E0E7FF", text: "#6366F1", icon: Umbrella };
      case "weekend":
        return { bg: "#F3F4F6", text: "#6B7280", icon: Coffee };
      default:
        return { bg: "#F3F4F6", text: "#6B7280", icon: Clock };
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return CheckCircle;
      case "work-from-home":
        return HomeIcon;
      case "late":
        return Clock;
      case "half-day":
        return ClockIcon;
      case "absent":
        return X;
      case "holiday":
        return Umbrella;
      case "weekend":
        return Coffee;
      default:
        return Clock;
    }
  };

  // Theme state - Now from context
  const { user, isDarkMode } = useOutletContext();
  const userData = user?.employee || {};
  const navigate = useNavigate();

  // Theme colors based on your specification
  const themeColors = {
    // Using your exact color specifications
    primary: "#7C3AED",
    primaryLight: "#EDE9FE",
    secondary: "#2563EB",
    accent: "#10B981",

    // Backgrounds & Surfaces
    appBackground: isDarkMode ? "#0F172A" : "#F8FAFC",
    cardBackground: isDarkMode ? "#1E293B" : "#FFFFFF",
    cardHover: isDarkMode ? "#334155" : "#F1F5F9",
    borderDivider: isDarkMode ? "#334155" : "#E5E7EB",

    // Text Colors
    textPrimary: isDarkMode ? "#F1F5F9" : "#111827",
    textSecondary: isDarkMode ? "#CBD5E1" : "#374151",
    textMuted: isDarkMode ? "#94A3B8" : "#6B7280",
    textDisabled: isDarkMode ? "#64748B" : "#9CA3AF",

    // Status Colors
    success: "#10B981",
    successBg: isDarkMode ? "#064E3B" : "#D1FAE5",
    warning: "#F59E0B",
    warningBg: isDarkMode ? "#78350F" : "#FEF3C7",
    danger: "#EF4444",
    dangerBg: isDarkMode ? "#7F1D1D" : "#FEE2E2",
    info: "#3B82F6",
    infoBg: isDarkMode ? "#1E40AF" : "#DBEAFE",

    // Chart Colors
    chartPurple: "#7C3AED",
    chartBlue: "#2563EB",
    chartGreen: "#10B981",
    chartAmber: "#F59E0B",
    chartRed: "#EF4444",
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "tasks":
        return renderTasks();
      case "attendance":
        return renderAttendance();
      case "worklogs":
        return renderWorklogs();
      case "leaves":
        return renderLeaveManagement();
      case "payslips":
        return renderPayslips();
      case "documents":
        return renderPersonalDocuments();
      case "profile":
        return renderProfile();
      default:
        return renderDashboard();
    }
  };

  // Tasks Section with working filters
  const renderTasks = () => (
    <div className="space-y-6">
      <div
        className="rounded-lg p-6 border mb-6"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.borderDivider,
        }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: themeColors.textPrimary }}
            >
              My Tasks
            </h1>
            <p style={{ color: themeColors.textSecondary }}>
              Manage and track your assigned tasks
            </p>
          </div>
          <button
            onClick={() => setShowCompletedHistory(!showCompletedHistory)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: showCompletedHistory ? themeColors.primary : themeColors.cardHover,
              color: showCompletedHistory ? '#FFFFFF' : themeColors.textPrimary
            }}
          >
            {showCompletedHistory ? 'Show Active Tasks' : 'Show Completed History'}
          </button>
        </div>
      </div>

      {!showCompletedHistory ? (
        // Active Tasks
        <>
          {tasks.length === 0 ? (
            <div
              className="rounded-lg border p-12 text-center"
              style={{
                backgroundColor: themeColors.cardBackground,
                borderColor: themeColors.borderDivider,
              }}
            >
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: themeColors.textMuted }} />
              <h3 className="text-lg font-medium mb-1" style={{ color: themeColors.textPrimary }}>No tasks assigned</h3>
              <p style={{ color: themeColors.textSecondary }}>You're all caught up!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border p-4 transition-all hover:shadow-md"
                  style={{
                    backgroundColor: themeColors.cardBackground,
                    borderColor: themeColors.borderDivider,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border`}
                          style={{
                            backgroundColor: task.priority === 'HIGH' ? themeColors.dangerBg : task.priority === 'MEDIUM' ? themeColors.warningBg : themeColors.successBg,
                            color: task.priority === 'HIGH' ? themeColors.danger : task.priority === 'MEDIUM' ? themeColors.warning : themeColors.success,
                            borderColor: 'transparent'
                          }}
                        >
                          {task.priority || 'NORMAL'}
                        </span>
                        {task.dueDate && (
                          <span className="flex items-center text-xs" style={{ color: themeColors.textMuted }}>
                            <CalendarIcon size={12} className="mr-1" />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold mb-1" style={{ color: themeColors.textPrimary }}>
                        {task.title}
                      </h3>
                      <p className="text-sm mb-3" style={{ color: themeColors.textSecondary }}>
                        {task.description || "No description provided."}
                      </p>

                      <div className="flex items-center gap-2 text-xs" style={{ color: themeColors.textMuted }}>
                        <User size={12} />
                        <span>Assigned by: {task.assigner?.fullName || "Manager"}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => handleTaskComplete(task.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border`}
                        style={{
                          backgroundColor: task.status === 'COMPLETED' ? themeColors.successBg : 'transparent',
                          color: task.status === 'COMPLETED' ? themeColors.success : themeColors.textSecondary,
                          borderColor: task.status === 'COMPLETED' ? 'transparent' : themeColors.borderDivider
                        }}
                      >
                        {task.status === 'COMPLETED' ? (
                          <>
                            <CheckCircle size={16} />
                            Completed
                          </>
                        ) : (
                          <>
                            <Circle size={16} />
                            Mark Complete
                          </>
                        )}
                      </button>
                      <span className="text-xs uppercase font-bold tracking-wider" style={{ color: themeColors.textMuted }}>{task.status?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        // Completed Tasks History with working filters
        <div
          className="rounded-lg border p-6"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.borderDivider,
          }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: themeColors.textPrimary }}>Completed Tasks History</h2>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Date</label>
                <input
                  type="date"
                  value={historyDateFilter}
                  onChange={(e) => setHistoryDateFilter(e.target.value)}
                  className="w-full p-2 rounded border text-sm"
                  style={{
                    backgroundColor: themeColors.cardBackground,
                    borderColor: themeColors.borderDivider,
                    color: themeColors.textPrimary,
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Month</label>
                <select
                  value={historyMonthFilter}
                  onChange={(e) => setHistoryMonthFilter(e.target.value)}
                  className="w-full p-2 rounded border text-sm"
                  style={{
                    backgroundColor: themeColors.cardBackground,
                    borderColor: themeColors.borderDivider,
                    color: themeColors.textPrimary,
                  }}
                >
                  <option value="">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Status</label>
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="w-full p-2 rounded border text-sm"
                  style={{
                    backgroundColor: themeColors.cardBackground,
                    borderColor: themeColors.borderDivider,
                    color: themeColors.textPrimary,
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Reopened">Reopened</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setHistoryDateFilter("");
                    setHistoryMonthFilter("");
                    setHistoryStatusFilter("all");
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: themeColors.cardHover,
                    color: themeColors.textPrimary,
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* History List */}
            {filteredCompletedHistory.length === 0 ? (
              <div className="text-center py-12">
                <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: themeColors.textMuted }} />
                <h3 className="text-lg font-medium mb-1" style={{ color: themeColors.textPrimary }}>No completed tasks found</h3>
                <p style={{ color: themeColors.textSecondary }}>Tasks will appear here 10 minutes after completion</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCompletedHistory.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border p-4"
                    style={{
                      backgroundColor: themeColors.cardHover,
                      borderColor: themeColors.borderDivider,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1" style={{ color: themeColors.textPrimary }}>
                          {task.title}
                        </h3>
                        <p className="text-sm mb-2" style={{ color: themeColors.textSecondary }}>
                          {task.description || "No description provided."}
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <span style={{ color: themeColors.textMuted }}>
                            Completed: {new Date(task.completedAt).toLocaleString()}
                          </span>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: task.historyStatus === 'Completed' ? themeColors.successBg : themeColors.warningBg,
                              color: task.historyStatus === 'Completed' ? themeColors.success : themeColors.warning,
                            }}
                          >
                            {task.historyStatus}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUndoTask(task.id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
                        style={{
                          backgroundColor: themeColors.primary,
                          color: '#FFFFFF',
                        }}
                      >
                        Undo / Mark Incomplete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Profile Section
  const renderProfile = () => (
    <div className="space-y-6">
      <div
        className="rounded-lg p-6 border mb-6"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.borderDivider,
        }}
      >
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: themeColors.textPrimary }}
        >
          My Profile
        </h1>
        <p style={{ color: themeColors.textSecondary }}>
          Manage your personal information and settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div
          className="col-span-1 rounded-lg border p-6 flex flex-col items-center"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.borderDivider,
          }}
        >
          <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4" style={{ borderColor: themeColors.primaryLight }}>
            {userData.profileImage ? (
              <img
                src={userData.profileImage}
                alt={userData.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-4xl font-bold"
                style={{ backgroundColor: themeColors.primary, color: "#FFF" }}
              >
                {userData.fullName?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <h2
            className="text-xl font-bold mb-1"
            style={{ color: themeColors.textPrimary }}
          >
            {userData.fullName || "N/A"}
          </h2>
          <p
            className="text-sm mb-4"
            style={{ color: themeColors.textSecondary }}
          >
            {userData.designation || "Employee"}
          </p>
          <div
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: themeColors.successBg,
              color: themeColors.success,
            }}
          >
            {userData.status || "Active"}
          </div>
        </div>

        {/* Details Grid */}
        <div
          className="col-span-1 md:col-span-2 rounded-lg border p-6"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.borderDivider,
          }}
        >
          <h3
            className="text-lg font-semibold mb-6"
            style={{ color: themeColors.textPrimary }}
          >
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Employee ID", value: userData.employeeCode || "N/A" },
              { label: "Department", value: userData.department || "N/A" },
              { label: "Email", value: user?.email || "N/A" },
              { label: "Phone", value: userData.phone || "N/A" },
              { label: "Location", value: userData.location || "N/A" },
              { label: "Join Date", value: userData.joiningDate ? new Date(userData.joiningDate).toLocaleDateString() : "03-08-2026" },
            ].map((item, index) => (
              <div key={index}>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: themeColors.textSecondary }}
                >
                  {item.label}
                </label>
                <div
                  className="text-base font-medium"
                  style={{ color: themeColors.textPrimary }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // DashboardHeader
  const DashboardHeader = () => (
    <div
      className="rounded-lg p-6 border mb-6 transform hover:scale-[1.002] transition-all duration-300"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: themeColors.borderDivider,
      }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: themeColors.textPrimary }}
          >
            Welcome back, {userData.fullName || "Employee"}!
          </h1>
          <p style={{ color: themeColors.textSecondary }}>
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <div
            className="rounded-lg p-3 border transform hover:scale-105 transition-all duration-200"
            style={{
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.borderDivider,
            }}
          >
            <div className="flex items-center space-x-3">
              <Clock size={20} style={{ color: themeColors.primary }} />
              <div>
                <p
                  className="text-sm"
                  style={{ color: themeColors.textSecondary }}
                >
                  Current Time
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: themeColors.textPrimary }}
                >
                  {currentTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // AttendanceSummary
  const AttendanceSummary = () => (
    <div
      className="rounded-lg p-5 border transform hover:scale-[1.02] transition-all duration-300"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: themeColors.borderDivider,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="p-2 rounded-lg transform hover:rotate-12 transition-transform"
          style={{ backgroundColor: themeColors.primaryLight }}
        >
          <CheckCircle size={20} style={{ color: themeColors.primary }} />
        </div>
        <span
          className="px-2 py-1 rounded text-xs font-semibold transform hover:scale-105 transition-transform"
          style={{
            backgroundColor: isClockedIn
              ? themeColors.successBg
              : themeColors.dangerBg,
            color: isClockedIn ? themeColors.success : themeColors.danger,
          }}
        >
          {isClockedIn ? "CLOCKED IN" : "CLOCKED OUT"}
        </span>
      </div>
      <h3
        className="text-lg font-semibold mb-3"
        style={{ color: themeColors.textPrimary }}
      >
        Attendance
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between transform hover:translate-x-1 transition-transform">
          <span
            style={{ color: themeColors.textSecondary }}
            className="text-sm"
          >
            Clock In
          </span>
          <span
            className="font-medium"
            style={{ color: themeColors.textPrimary }}
          >
            {clockInTime}
          </span>
        </div>
        <div className="flex justify-between transform hover:translate-x-1 transition-transform">
          <span
            style={{ color: themeColors.textSecondary }}
            className="text-sm"
          >
            Clock Out
          </span>
          <span
            className="font-medium"
            style={{ color: themeColors.textPrimary }}
          >
            {clockOutTime || "--:--"}
          </span>
        </div>
        <div className="flex justify-between transform hover:translate-x-1 transition-transform">
          <span
            style={{ color: themeColors.textSecondary }}
            className="text-sm"
          >
            Today's Hours
          </span>
          <span style={{ color: themeColors.success }} className="font-medium">
            {todayHours}
          </span>
        </div>
      </div>
    </div>
  );

  // TaskOverview
  const TaskOverview = () => (
    <div
      className="rounded-lg p-5 border transform hover:scale-[1.02] transition-all duration-300"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: themeColors.borderDivider,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="p-2 rounded-lg transform hover:rotate-12 transition-transform"
          style={{ backgroundColor: themeColors.infoBg }}
        >
          <Target size={20} style={{ color: themeColors.info }} />
        </div>
        <span
          className="text-sm font-medium transform hover:scale-105 transition-transform"
          style={{ color: themeColors.info }}
        >
          Today
        </span>
      </div>
      <h3
        className="text-lg font-semibold mb-3"
        style={{ color: themeColors.textPrimary }}
      >
        Tasks
      </h3>
      <div className="flex items-end mb-2">
        <span
          className="text-2xl font-bold"
          style={{ color: themeColors.textPrimary }}
        >
          {tasks.filter((t) => t.completed).length}/{tasks.length}
        </span>
        <span
          className="text-sm ml-2 flex items-center transform hover:scale-105 transition-transform"
          style={{ color: themeColors.success }}
        >
          {(
            (tasks.filter((t) => t.completed).length / tasks.length) *
            100
          ).toFixed(0) || 0}
          %
        </span>
      </div>
      <div className="text-sm" style={{ color: themeColors.textSecondary }}>
        Completed
      </div>
    </div>
  );

  // LeaveBalanceSummary - Updated icons
  const LeaveBalanceSummary = () => (
    <div
      className="rounded-lg p-5 border transform hover:scale-[1.02] transition-all duration-300"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: themeColors.borderDivider,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="p-2 rounded-lg transform hover:rotate-12 transition-transform"
          style={{ backgroundColor: themeColors.warningBg }}
        >
          <Calendar size={20} style={{ color: themeColors.warning }} />
        </div>
        <span
          className="text-sm font-medium transform hover:scale-105 transition-transform"
          style={{ color: themeColors.warning }}
        >
          Balance
        </span>
      </div>
      <h3
        className="text-lg font-semibold mb-3"
        style={{ color: themeColors.textPrimary }}
      >
        Leave Balance
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center transform hover:translate-x-1 transition-transform">
          <div className="flex items-center">
            <div
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: themeColors.success }}
            ></div>
            <span
              className="text-sm"
              style={{ color: themeColors.textSecondary }}
            >
              Casual
            </span>
          </div>
          <span
            className="font-bold"
            style={{ color: themeColors.textPrimary }}
          >
            {leaveBalance.casual} days
          </span>
        </div>
        <div className="flex justify-between items-center transform hover:translate-x-1 transition-transform">
          <div className="flex items-center">
            <MdOutlineSick
              className="mr-2"
              size={16}
              style={{ color: themeColors.info }}
            />
            <span
              className="text-sm"
              style={{ color: themeColors.textSecondary }}
            >
              Sick
            </span>
          </div>
          <span
            className="font-bold"
            style={{ color: themeColors.textPrimary }}
          >
            {leaveBalance.sick} days
          </span>
        </div>
        <div className="flex justify-between items-center transform hover:translate-x-1 transition-transform">
          <div className="flex items-center">
            <CiCalendar
              className="mr-2"
              size={16}
              style={{ color: themeColors.primary }}
            />
            <span
              className="text-sm"
              style={{ color: themeColors.textSecondary }}
            >
              Earned
            </span>
          </div>
          <span
            className="font-bold"
            style={{ color: themeColors.textPrimary }}
          >
            {leaveBalance.earned} days
          </span>
        </div>
        <div className="flex justify-between items-center transform hover:translate-x-1 transition-transform pt-2 mt-2 border-t" style={{ borderColor: themeColors.borderDivider }}>
          <div className="flex items-center">
            <FaRegCalendarCheck
              className="mr-2"
              size={16}
              style={{ color: themeColors.accent }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: themeColors.textPrimary }}
            >
              Total Available
            </span>
          </div>
          <span
            className="font-bold"
            style={{ color: themeColors.accent }}
          >
            {leaveBalance.casual + leaveBalance.sick + leaveBalance.earned} days
          </span>
        </div>
      </div>
    </div>
  );

  // WorklogSection
  const WorklogSection = () => (
    <div
      className="rounded-lg p-5 border transform hover:scale-[1.02] transition-all duration-300"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: themeColors.borderDivider,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="p-2 rounded-lg transform hover:rotate-12 transition-transform"
          style={{ backgroundColor: themeColors.successBg }}
        >
          <Timer size={20} style={{ color: themeColors.success }} />
        </div>
        <span
          className="text-sm font-medium transform hover:scale-105 transition-transform"
          style={{ color: themeColors.success }}
        >
          This Week
        </span>
      </div>
      <h3
        className="text-lg font-semibold mb-3"
        style={{ color: themeColors.textPrimary }}
      >
        Working Hours
      </h3>
      <div className="flex items-end mb-3">
        <span
          className="text-2xl font-bold"
          style={{ color: themeColors.textPrimary }}
        >
          {analytics.weeklyHours}h
        </span>
        <span
          className="text-sm ml-2 flex items-center transform hover:scale-105 transition-transform"
          style={{ color: themeColors.success }}
        >
        </span>
      </div>
      <div className="text-sm" style={{ color: themeColors.textSecondary }}>
        Total weekly hours
      </div>
    </div>
  );

  // AnalyticsGraphs - Traditional Bar Graph with Y and X Axis
  const AnalyticsGraphs = () => {
    // Find max value for y-axis scaling
    const maxCompleted = Math.max(...taskCompletionData.map(item => item.completed), 1);
    const maxTotal = Math.max(...taskCompletionData.map(item => item.total), 5);
    const yAxisMax = Math.max(maxCompleted, maxTotal) + 2; // Add some padding

    return (
      <div
        className="rounded-lg border p-6 mb-6 transform hover:scale-[1.002] transition-all duration-300"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.borderDivider,
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h3
              className="text-xl font-bold mb-2"
              style={{ color: themeColors.textPrimary }}
            >
              Task Completion Trend
            </h3>
            <p className="text-sm" style={{ color: themeColors.textSecondary }}>
              Weekly task completion overview for the last month
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <span
              className="text-xs px-2 py-1 rounded transform hover:scale-105 transition-transform"
              style={{
                backgroundColor: themeColors.infoBg,
                color: themeColors.info,
              }}
            >
              Last 4 Weeks
            </span>
            <span
              className="text-xs px-2 py-1 rounded transform hover:scale-105 transition-transform"
              style={{
                backgroundColor: themeColors.primaryLight,
                color: themeColors.primary,
              }}
            >
              {Math.round(
                taskCompletionData.reduce(
                  (sum, item) => sum + (item.completed / item.total) * 100,
                  0
                ) / taskCompletionData.length
              )}% Avg
            </span>
          </div>
        </div>

        {/* Chart Area with Traditional Axes */}
        <div className="relative h-80 mb-8">
          {/* Y-Axis Line */}
          <div className="absolute left-12 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* X-Axis Line */}
          <div className="absolute left-12 right-4 bottom-8 h-px bg-gray-300 dark:bg-gray-600"></div>

          {/* Y-Axis Labels */}
          <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-right pr-2" style={{ color: themeColors.textSecondary }}>
            <span>{yAxisMax}</span>
            <span>{Math.round(yAxisMax * 0.75)}</span>
            <span>{Math.round(yAxisMax * 0.5)}</span>
            <span>{Math.round(yAxisMax * 0.25)}</span>
            <span>0</span>
          </div>

          {/* Grid Lines (Horizontal) */}
          <div className="absolute left-12 right-4 top-0 bottom-8">
            {[0, 25, 50, 75, 100].map((percent) => {
              const yPosition = 100 - percent;
              return (
                <div
                  key={percent}
                  className="absolute w-full border-t border-dashed"
                  style={{
                    borderColor: themeColors.borderDivider,
                    top: `${yPosition}%`,
                    opacity: 0.3
                  }}
                />
              );
            })}
          </div>

          {/* Bars */}
          <div className="absolute left-14 right-4 top-0 bottom-8 flex items-end justify-around">
            {taskCompletionData.map((item, index) => {
              const completedHeight = (item.completed / yAxisMax) * 100;
              const totalHeight = (item.total / yAxisMax) * 100;

              return (
                <div
                  key={index}
                  className="flex flex-col items-center relative group w-16"
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip */}
                  {hoveredBar === index && (
                    <div
                      className="absolute -top-24 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-lg shadow-xl z-10 min-w-[140px] text-center"
                      style={{
                        backgroundColor: themeColors.cardBackground,
                        border: `1px solid ${themeColors.borderDivider}`,
                      }}
                    >
                      <div className="font-semibold text-sm mb-1" style={{ color: themeColors.textPrimary }}>
                        {item.week}
                      </div>
                      <div className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>
                        <span style={{ color: themeColors.success }}>Completed: {item.completed}</span>
                      </div>
                      <div className="text-xs mb-1" style={{ color: themeColors.textSecondary }}>
                        <span style={{ color: themeColors.info }}>Total: {item.total}</span>
                      </div>
                      <div className="text-sm font-bold" style={{ color: item.color }}>
                        {Math.round((item.completed / item.total) * 100)}%
                      </div>
                    </div>
                  )}

                  {/* Bar Container */}
                  <div className="w-10 flex flex-col items-center relative h-72">
                    {/* Total Bar (Background) */}
                    <div
                      className="absolute bottom-0 w-8 rounded-t-sm opacity-20"
                      style={{
                        height: `${totalHeight}%`,
                        backgroundColor: themeColors.textMuted,
                      }}
                    />

                    {/* Completed Bar */}
                    <div
                      className="absolute bottom-0 w-8 rounded-t-sm transition-all duration-300 cursor-pointer"
                      style={{
                        height: `${completedHeight}%`,
                        backgroundColor: item.color,
                        opacity: hoveredBar === index ? 1 : 0.8,
                        transform: hoveredBar === index ? 'scale(1.05)' : 'scale(1)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-Axis Labels */}
          <div className="absolute left-14 right-4 bottom-0 flex justify-around">
            {taskCompletionData.map((item, index) => (
              <div key={index} className="text-xs font-medium w-16 text-center" style={{ color: themeColors.textSecondary }}>
                {item.week}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="absolute right-0 top-0 flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-sm mr-1" style={{ backgroundColor: themeColors.success }}></div>
              <span className="text-xs" style={{ color: themeColors.textSecondary }}>Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-sm mr-1 opacity-20" style={{ backgroundColor: themeColors.textMuted }}></div>
              <span className="text-xs" style={{ color: themeColors.textSecondary }}>Total</span>
            </div>
          </div>
        </div>

        {/* Legend and Stats */}
        <div className="mt-8 pt-6 border-t" style={{ borderColor: themeColors.borderDivider }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center transform hover:scale-105 transition-transform">
              <div className="text-2xl font-bold" style={{ color: themeColors.success }}>
                {taskCompletionData.reduce((sum, item) => sum + item.completed, 0)}
              </div>
              <div className="text-sm" style={{ color: themeColors.textSecondary }}>
                Completed Tasks
              </div>
            </div>
            <div className="text-center transform hover:scale-105 transition-transform">
              <div className="text-2xl font-bold" style={{ color: themeColors.primary }}>
                {taskCompletionData.reduce((sum, item) => sum + item.total, 0)}
              </div>
              <div className="text-sm" style={{ color: themeColors.textSecondary }}>
                Total Tasks
              </div>
            </div>
            <div className="text-center transform hover:scale-105 transition-transform">
              <div className="text-2xl font-bold" style={{ color: themeColors.info }}>
                {Math.round(
                  taskCompletionData.reduce((sum, item) => sum + (item.completed / item.total) * 100, 0) /
                  taskCompletionData.length
                )}%
              </div>
              <div className="text-sm" style={{ color: themeColors.textSecondary }}>
                Avg Completion
              </div>
            </div>
            <div className="text-center transform hover:scale-105 transition-transform">
              <div className="text-2xl font-bold" style={{ color: themeColors.warning }}>
                {taskCompletionData.reduce((max, item) => Math.max(max, (item.completed / item.total) * 100), 0).toFixed(0)}%
              </div>
              <div className="text-sm" style={{ color: themeColors.textSecondary }}>
                Peak Performance
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handle Payslip Download
  const handleDownloadPayslip = (payslip) => {
    try {
      const doc = new jsPDF();

      // Company Header
      doc.setFontSize(22);
      doc.setTextColor(40, 40, 40);
      doc.text("LITE HR", 105, 20, { align: "center" });

      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text("Payslip for the month of " + new Date(0, payslip.month - 1).toLocaleString('default', { month: 'long' }) + " " + payslip.year, 105, 30, { align: "center" });

      // Employee Details Box
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(14, 40, 182, 45, 3, 3, 'FD');

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);

      // Left Column
      doc.setFont("helvetica", "bold");
      doc.text("Employee Name:", 20, 50);
      doc.setFont("helvetica", "normal");
      doc.text(userData.fullName || "N/A", 60, 50);

      doc.setFont("helvetica", "bold");
      doc.text("Employee Code:", 20, 60);
      doc.setFont("helvetica", "normal");
      doc.text(userData.employeeCode || "N/A", 60, 60);

      doc.setFont("helvetica", "bold");
      doc.text("Designation:", 20, 70);
      doc.setFont("helvetica", "normal");
      doc.text(userData.designation || "N/A", 60, 70);

      // Right Column
      doc.setFont("helvetica", "bold");
      doc.text("Department:", 110, 50);
      doc.setFont("helvetica", "normal");
      doc.text(userData.department || "N/A", 150, 50);

      doc.setFont("helvetica", "bold");
      doc.text("Working Days:", 110, 60);
      doc.setFont("helvetica", "normal");
      doc.text(String(payslip.workingDays || 0), 150, 60);

      doc.setFont("helvetica", "bold");
      doc.text("Present Days:", 110, 70);
      doc.setFont("helvetica", "normal");
      doc.text(String(payslip.presentDays || 0), 150, 70);

      doc.setFont("helvetica", "bold");
      doc.text("LOP Days:", 110, 80);
      doc.setFont("helvetica", "normal");
      doc.text(String(payslip.unpaidLeaves || 0), 150, 80);

      // Salary Details Table
      const columns = ["Earnings", "Amount (Rs.)", "Deductions", "Amount (Rs.)"];
      const basicSalary = parseFloat(payslip.basicSalary || 0);
      const deduction = parseFloat(payslip.deduction || 0);
      const netSalary = parseFloat(payslip.netSalary || 0);

      const data = [
        ["Basic Salary", basicSalary.toFixed(2), "Unpaid Leave Deduction", deduction.toFixed(2)],
        ["House Rent Allowance", "0.00", "Provident Fund", "0.00"], // Placeholders
        ["Special Allowance", "0.00", "Professional Tax", "0.00"], // Placeholders
        ["", "", "", ""],
        ["Total Earnings", basicSalary.toFixed(2), "Total Deductions", deduction.toFixed(2)],
      ];

      autoTable(doc, {
        startY: 95,
        head: [columns],
        body: data,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] }, // Purple
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold' },
          2: { fontStyle: 'bold' },
          1: { halign: 'right' },
          3: { halign: 'right' }
        }
      });

      // Net Salary Section
      const finalY = doc.lastAutoTable.finalY + 10;

      doc.setFillColor(240, 240, 240);
      doc.rect(14, finalY, 182, 15, 'F');

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("NET SALARY PAYABLE:", 20, finalY + 10);
      doc.text("Rs. " + netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 190, finalY + 10, { align: "right" });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("This is a computer-generated document and does not require a signature.", 105, 280, { align: "center" });

      // Save
      doc.save(`Payslip_${userData.fullName}_${payslip.month}_${payslip.year}.pdf`);
      toast.success("Payslip downloaded successfully");

    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  // Handle Document Actions
  const handleViewDocument = (doc) => {
    if (!doc.fileUrl) return;
    const fileUrl = `http://localhost:5000${doc.fileUrl}`;
    window.open(fileUrl, "_blank");
  };

  const handleDownloadDocument = async (doc) => {
    if (!doc.fileUrl) return;
    try {
      toast.loading("Downloading...");
      const response = await axios.get(`http://localhost:5000${doc.fileUrl}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.name || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success("Document downloaded");
    } catch (error) {
      console.error("Download failed", error);
      toast.dismiss();
      toast.error("Failed to download document");
    }
  };

  // Today's Summary Component
  const TodaysSummary = () => {
    // Parse todayHours (e.g., "8h 30m") to calculate overtime
    let overtimeStr = "0m";
    if (todayHours) {
      const parts = todayHours.split(' ');
      let totalMins = 0;
      parts.forEach(p => {
        if (p.includes('h')) totalMins += parseInt(p) * 60;
        if (p.includes('m')) totalMins += parseInt(p);
      });

      const standardDay = 8 * 60;
      if (totalMins > standardDay) {
        const overtimeMins = totalMins - standardDay;
        const otHrs = Math.floor(overtimeMins / 60);
        const otMins = overtimeMins % 60;
        overtimeStr = otHrs > 0 ? `+${otHrs}h ${otMins}m` : `+${otMins}m`;
      }
    }

    const summaryItems = [
      {
        label: "Work Duration",
        value: todayHours || "0h 0m",
        color: themeColors.textPrimary,
        icon: Clock,
      },
      {
        label: "Overtime",
        value: overtimeStr,
        color: themeColors.success,
        icon: TrendingUp,
      },
      {
        label: "Break Time",
        value: "1h 0m", // Placeholder
        color: themeColors.warning,
        icon: Coffee,
      },
      {
        label: "Productivity",
        value: `${analytics.productivity || 0}%`,
        color: themeColors.info,
        icon: Zap,
      },
    ];

    return (
      <div
        className="rounded-lg p-5 border transform hover:scale-[1.002] transition-all duration-300 h-full"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.borderDivider,
        }}
      >
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: themeColors.textPrimary }}
        >
          Today's Summary
        </h3>
        <div className="space-y-2">
          {summaryItems.map((item, index) => (
            <div
              key={index}
              className="p-2 rounded-lg hover:scale-[1.02] transition-transform group flex items-center justify-between"
              style={{ backgroundColor: themeColors.cardHover }}
            >
              <div className="flex items-center">
                <item.icon
                  size={14}
                  className="mr-2"
                  style={{ color: item.color }}
                />
                <span
                  className="text-xs"
                  style={{ color: themeColors.textSecondary }}
                >
                  {item.label}
                </span>
              </div>
              <span
                className="font-medium text-sm flex items-center"
                style={{ color: item.color }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Payslips Section
  const renderPayslips = () => (
    <div
      className="rounded-lg p-6 border mb-6"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: themeColors.borderDivider,
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ color: themeColors.textPrimary }}
        >
          My Payslips
        </h1>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: themeColors.textSecondary }}>Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={{
              backgroundColor: themeColors.appBackground,
              color: themeColors.textPrimary,
              borderColor: themeColors.borderDivider
            }}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredPayslips.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredPayslips.map((payslip) => (
            <div
              key={payslip.id}
              className="p-5 rounded-lg border hover:shadow-md transition-all duration-300"
              style={{
                backgroundColor: themeColors.cardHover, // Using cardHover for slight differentiation or cardBackground
                borderColor: themeColors.borderDivider,
              }}
            >
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div
                    className="p-3 rounded-full"
                    style={{ backgroundColor: themeColors.primaryLight }}
                  >
                    <FileSpreadsheet
                      size={24}
                      style={{ color: themeColors.primary }}
                    />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-bold"
                      style={{ color: themeColors.textPrimary }}
                    >
                      {payslip.month}/{payslip.year}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm mt-1" style={{ color: themeColors.textSecondary }}>
                      <span>Working Days: {payslip.workingDays}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Present: {payslip.presentDays}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Unpaid Leave: {payslip.unpaidLeaves}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end min-w-[150px]">
                  <span className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: themeColors.textSecondary }}>Net Salary</span>
                  <span className="text-xl font-bold" style={{ color: themeColors.success }}>₹{parseFloat(payslip.netSalary).toLocaleString('en-IN')}</span>
                  {parseFloat(payslip.deduction) > 0 && (
                    <span className="text-xs text-red-500 mt-1">Deduction: -₹{parseFloat(payslip.deduction).toLocaleString('en-IN')}</span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setViewPayslip(payslip)}
                    className="p-2 rounded-full hover:bg-opacity-20 transition-colors"
                    style={{ backgroundColor: themeColors.primaryLight }}
                    title="View Details"
                  >
                    <Eye size={18} style={{ color: themeColors.primary }} />
                  </button>
                  <button
                    onClick={() => handleDownloadPayslip(payslip)}
                    className="p-2 rounded-full hover:bg-opacity-20 transition-colors"
                    style={{ backgroundColor: themeColors.primaryLight }}
                    title="Download PDF"
                  >
                    <Download size={18} style={{ color: themeColors.primary }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="p-4 rounded-full mb-4" style={{ backgroundColor: themeColors.cardHover }}>
            <FileSpreadsheet size={48} style={{ color: themeColors.textMuted }} />
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: themeColors.textSecondary }}>
            No Payslips Found
          </h3>
          <p className="max-w-md" style={{ color: themeColors.textMuted }}>
            Your payslips will appear here once they are generated by the finance department.
          </p>
        </div>
      )}

      {/* View Payslip Modal */}
      {viewPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold dark:text-white">Payslip Details</h2>
              <button onClick={() => setViewPayslip(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Employee</p>
                  <p className="font-semibold dark:text-gray-200">{userData.fullName}</p>
                  <p className="text-sm text-gray-500">{userData.employeeCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Period</p>
                  <p className="font-semibold dark:text-gray-200">{viewPayslip.month}/{viewPayslip.year}</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Basic Salary</span>
                  <span className="font-medium dark:text-white">₹{parseFloat(viewPayslip.basicSalary).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Attendance</span>
                  <span>{viewPayslip.presentDays} / {viewPayslip.workingDays} Days</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Deductions (Unpaid Leaves: {viewPayslip.unpaidLeaves})</span>
                  <span>-₹{parseFloat(viewPayslip.deduction).toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3 flex justify-between items-center">
                  <span className="font-bold text-lg dark:text-white">Net Salary</span>
                  <span className="font-bold text-xl text-green-600 dark:text-green-400">₹{parseFloat(viewPayslip.netSalary).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <FileText size={18} /> Print
              </button>
              <button
                onClick={() => setViewPayslip(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Personal Documents Section with dropdown filter
  const renderPersonalDocuments = () => (
    <div
      className="rounded-lg p-6 border mb-6"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: themeColors.borderDivider,
      }}
    >
      <h1
        className="text-2xl font-bold mb-6"
        style={{ color: themeColors.textPrimary }}
      >
        Personal Documents
      </h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-transparent focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
            style={{
              borderColor: themeColors.borderDivider,
              color: themeColors.textPrimary,
              '--tw-ring-color': themeColors.primary
            }}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-lg border text-sm font-medium bg-transparent focus:ring-2 focus:ring-opacity-50 outline-none"
            style={{
              borderColor: themeColors.borderDivider,
              color: themeColors.textPrimary,
              backgroundColor: themeColors.cardBackground, // Add this line
            }}
          >
            <option value="all">All Categories</option>
            <option value="Employment">Employment</option>
            <option value="Payroll">Payroll</option>
            <option value="Legal">Legal</option>
            <option value="HR">HR</option>
            <option value="Verification">Verification</option>
            <option value="Personal">Personal</option>
          </select>
        </div>
      </div>

      {filteredDocuments.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden" style={{ borderColor: themeColors.borderDivider, backgroundColor: themeColors.cardBackground }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: themeColors.borderDivider }}>
                <th className="p-4 font-semibold text-sm" style={{ color: themeColors.textSecondary }}>Document Name</th>
                <th className="p-4 font-semibold text-sm hidden md:table-cell" style={{ color: themeColors.textSecondary }}>Category</th>
                <th className="p-4 font-semibold text-sm hidden md:table-cell" style={{ color: themeColors.textSecondary }}>Upload Date</th>
                <th className="p-4 font-semibold text-sm hidden sm:table-cell" style={{ color: themeColors.textSecondary }}>Size</th>
                <th className="p-4 font-semibold text-sm text-right" style={{ color: themeColors.textSecondary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr 
                  key={doc.id} 
                  className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/10 transition-colors" 
                  style={{ borderColor: themeColors.borderDivider }}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: themeColors.textPrimary }}>{doc.name}</p>
                        <p className="text-xs md:hidden" style={{ color: themeColors.textSecondary }}>{doc.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {doc.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm hidden md:table-cell" style={{ color: themeColors.textPrimary }}>
                    {new Date(doc.uploadDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm hidden sm:table-cell" style={{ color: themeColors.textSecondary }}>
                    {doc.size || "2.5 MB"}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="View"
                      >
                        <Eye size={18} style={{ color: themeColors.info }} />
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(doc)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Download"
                      >
                        <Download size={18} style={{ color: themeColors.success }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="p-4 rounded-full mb-4" style={{ backgroundColor: themeColors.cardHover }}>
            <FileText size={48} style={{ color: themeColors.textMuted }} />
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: themeColors.textSecondary }}>
            No Documents Found
          </h3>
          <p className="max-w-md" style={{ color: themeColors.textMuted }}>
            {searchQuery ? `No documents matching "${searchQuery}"` : "You haven't uploaded any documents yet."}
          </p>
        </div>
      )}
    </div>
  );

  // Calendar Section (without summary) - Reduced height
  const CalendarSection = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const attendance = getAttendanceStatus(selectedDate);
    const holiday = getHoliday(selectedDate);
    const StatusIcon = getStatusIcon(attendance.status);
    const statusColors = getStatusColor(attendance.status);

    return (
      <div className="space-y-3">
        <div
          className="rounded-lg border p-3 transform hover:scale-[1.002] transition-all duration-300"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.borderDivider,
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3
              className="font-semibold text-sm"
              style={{ color: themeColors.textPrimary }}
            >
              {currentMonth.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => changeMonth("prev")}
                className="p-1 rounded-lg hover:scale-110 transition-transform"
                style={{
                  backgroundColor: themeColors.cardHover,
                  color: themeColors.textPrimary,
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  setCurrentMonth(today);
                  setSelectedDate(today);
                }}
                className="text-xs px-2 py-1 rounded-lg hover:scale-110 transition-transform"
                style={{
                  backgroundColor: themeColors.primaryLight,
                  color: themeColors.primary,
                }}
              >
                Today
              </button>
              <button
                onClick={() => changeMonth("next")}
                className="p-1 rounded-lg hover:scale-110 transition-transform"
                style={{
                  backgroundColor: themeColors.cardHover,
                  color: themeColors.textPrimary,
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-medium py-0.5"
                style={{ color: themeColors.textSecondary }}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {daysInMonth.slice(0, 42).map((day, index) => {
              const dayAttendance = getAttendanceStatus(day.date);
              const dayHoliday = getHoliday(day.date);
              const isToday =
                day.date.toDateString() === new Date().toDateString();
              const isSelected =
                selectedDate.toDateString() === day.date.toDateString();
              const isWeekend =
                day.date.getDay() === 0 || day.date.getDay() === 6;

              let dateColor = themeColors.textPrimary;
              let bgColor = "transparent";
              let borderColor = "transparent";

              if (!day.isCurrentMonth) {
                dateColor = themeColors.textMuted;
                bgColor = themeColors.appBackground;
              } else if (dayHoliday) {
                dateColor = "#6366F1";
                bgColor = isSelected ? "#4F46E5" : "#E0E7FF";
              } else if (isWeekend) {
                dateColor = themeColors.warning;
              }

              if (isSelected) {
                bgColor = themeColors.primary;
                dateColor = "#FFFFFF";
                borderColor = themeColors.primary;
              } else if (isToday) {
                bgColor = themeColors.primaryLight;
                borderColor = themeColors.primary;
              }

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(day.date)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                  className={`
                    aspect-square p-0.5 rounded flex flex-col items-center justify-center text-xs
                    transition-all duration-200 relative overflow-hidden
                    ${!day.isCurrentMonth ? "opacity-60" : ""}
                    hover:z-10 hover:shadow-xl
                  `}
                  style={{
                    color: dateColor,
                    backgroundColor: bgColor,
                    border: `1px solid ${borderColor}`,
                    transform: "scale(1)",
                  }}
                  title={`${day.date.toLocaleDateString()} - ${dayAttendance.status === "not-marked"
                    ? "Not marked"
                    : dayAttendance.status
                    }`}
                >
                  {/* Background effect for attendance status */}
                  {day.isCurrentMonth &&
                    !isSelected &&
                    !isToday &&
                    dayAttendance.status !== "not-marked" &&
                    dayAttendance.status !== "weekend" && (
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundColor: statusColors.text,
                        }}
                      />
                    )}

                  {/* Holiday indicator */}
                  {dayHoliday && (
                    <div
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "#6366F1" }}
                    />
                  )}

                  <div
                    className={`font-medium relative z-10 text-xs ${isSelected ? "text-white" : ""
                      }`}
                  >
                    {day.date.getDate()}
                  </div>

                  {day.isCurrentMonth &&
                    !isSelected &&
                    !isToday &&
                    dayAttendance.status !== "not-marked" &&
                    dayAttendance.status !== "weekend" && (
                      <div
                        className="w-1 h-1 rounded-full mt-0.5 z-10 transition-transform duration-200 hover:scale-150"
                        style={{
                          backgroundColor: statusColors.text,
                        }}
                      />
                    )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Panel - Compact */}
        {showDateDetails && (
          <div
            className="rounded-lg border p-3 animate-in slide-in-from-bottom-5 duration-300 text-sm"
            style={{
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.borderDivider,
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <div
                  className="text-[10px]"
                  style={{ color: themeColors.textSecondary }}
                >
                  Selected Date
                </div>
                <div
                  className="text-sm font-bold flex items-center"
                  style={{ color: themeColors.textPrimary }}
                >
                  <CalendarIcon className="mr-1" size={14} />
                  {selectedDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
              <button
                onClick={() => setShowDateDetails(false)}
                className="p-1 rounded-lg hover:scale-110 transition-transform"
                style={{ color: themeColors.textMuted }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Holiday Banner - Compact */}
            {holiday && (
              <div
                className="mb-2 p-2 rounded-lg flex items-center animate-in fade-in-0 zoom-in-95"
                style={{
                  backgroundColor: "#E0E7FF",
                  border: "1px solid #6366F1",
                }}
              >
                <Umbrella
                  className="mr-1"
                  size={14}
                  style={{ color: "#6366F1" }}
                />
                <div>
                  <div
                    className="font-medium text-xs"
                    style={{ color: "#6366F1" }}
                  >
                    {holiday}
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Status Card - Compact */}
            <div
              className="mb-2 p-2 rounded-lg transform hover:scale-[1.02] transition-all duration-300"
              style={{
                backgroundColor: statusColors.bg,
                border: `1px solid ${statusColors.text}20`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <StatusIcon
                    className="mr-1"
                    size={14}
                    style={{ color: statusColors.text }}
                  />
                  <div>
                    <div
                      className="font-bold text-xs"
                      style={{ color: statusColors.text }}
                    >
                      {attendance.status === "work-from-home"
                        ? "WFH"
                        : attendance.status === "half-day"
                          ? "Half Day"
                          : attendance.status.charAt(0).toUpperCase() +
                          attendance.status.slice(1)}
                    </div>
                  </div>
                </div>
                {attendance.hours > 0 && (
                  <div className="text-right">
                    <div
                      className="text-sm font-bold"
                      style={{ color: statusColors.text }}
                    >
                      {attendance.hours}h
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mark In/Out Details - Compact */}
            {(attendance.status === "present" ||
              attendance.status === "late" ||
              attendance.status === "work-from-home" ||
              attendance.status === "half-day") && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className="p-2 rounded-lg transform hover:scale-105 transition-all duration-300"
                      style={{
                        backgroundColor: themeColors.cardHover,
                        border: `1px solid ${themeColors.borderDivider}`,
                      }}
                    >
                      <div className="flex items-center mb-1">
                        <ClockIcon
                          className="mr-1"
                          size={12}
                          style={{ color: themeColors.success }}
                        />
                        <span
                          className="text-[10px]"
                          style={{ color: themeColors.textSecondary }}
                        >
                          In
                        </span>
                      </div>
                      <div
                        className="text-sm font-bold"
                        style={{ color: themeColors.textPrimary }}
                      >
                        {attendance.markIn}
                      </div>
                    </div>

                    <div
                      className="p-2 rounded-lg transform hover:scale-105 transition-all duration-300"
                      style={{
                        backgroundColor: themeColors.cardHover,
                        border: `1px solid ${themeColors.borderDivider}`,
                      }}
                    >
                      <div className="flex items-center mb-1">
                        <LogOutIcon
                          className="mr-1"
                          size={12}
                          style={{ color: themeColors.danger }}
                        />
                        <span
                          className="text-[10px]"
                          style={{ color: themeColors.textSecondary }}
                        >
                          Out
                        </span>
                      </div>
                      <div
                        className="text-sm font-bold"
                        style={{ color: themeColors.textPrimary }}
                      >
                        {attendance.markOut}
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    );
  };

  // Quick Actions Section - Reduced size
  const QuickActionsSection = () => (
    <div
      className="rounded-lg border p-3 transform hover:scale-[1.002] transition-all duration-300 h-full flex flex-col"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: themeColors.borderDivider,
      }}
    >
      <h3
        className="text-sm font-semibold mb-3"
        style={{ color: themeColors.textPrimary }}
      >
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-2 flex-1">
        <button
          onClick={() => setActiveSection("attendance")}
          className="p-2 rounded-lg flex flex-col items-center justify-center transition-all hover:scale-105 hover:shadow-lg group"
          style={{
            backgroundColor: themeColors.cardHover,
            border: `1px solid ${themeColors.borderDivider}`,
          }}
        >
          <div
            className="p-1.5 rounded-lg mb-1 transform group-hover:rotate-12 transition-transform"
            style={{ backgroundColor: themeColors.primaryLight }}
          >
            <Clock size={14} style={{ color: themeColors.primary }} />
          </div>
          <span
            className="text-xs font-medium"
            style={{ color: themeColors.textPrimary }}
          >
            Attendance
          </span>
        </button>
        <button
          onClick={() => setShowWorklogModal(true)}
          className="p-2 rounded-lg flex flex-col items-center justify-center transition-all hover:scale-105 hover:shadow-lg group"
          style={{
            backgroundColor: themeColors.cardHover,
            border: `1px solid ${themeColors.borderDivider}`,
          }}
        >
          <div
            className="p-1.5 rounded-lg mb-1 transform group-hover:rotate-12 transition-transform"
            style={{ backgroundColor: themeColors.infoBg }}
          >
            <FileText size={14} style={{ color: themeColors.info }} />
          </div>
          <span
            className="text-xs font-medium"
            style={{ color: themeColors.textPrimary }}
          >
            Worklog
          </span>
        </button>
        <button
          onClick={() => setShowLeaveModal(true)}
          className="p-2 rounded-lg flex flex-col items-center justify-center transition-all hover:scale-105 hover:shadow-lg group"
          style={{
            backgroundColor: themeColors.cardHover,
            border: `1px solid ${themeColors.borderDivider}`,
          }}
        >
          <div
            className="p-1.5 rounded-lg mb-1 transform group-hover:rotate-12 transition-transform"
            style={{ backgroundColor: themeColors.warningBg }}
          >
            <Calendar size={14} style={{ color: themeColors.warning }} />
          </div>
          <span
            className="text-xs font-medium"
            style={{ color: themeColors.textPrimary }}
          >
            Leave
          </span>
        </button>
        <button
          onClick={() => setActiveSection("payslips")}
          className="p-2 rounded-lg flex flex-col items-center justify-center transition-all hover:scale-105 hover:shadow-lg group"
          style={{
            backgroundColor: themeColors.cardHover,
            border: `1px solid ${themeColors.borderDivider}`,
          }}
        >
          <div
            className="p-1.5 rounded-lg mb-1 transform group-hover:rotate-12 transition-transform"
            style={{ backgroundColor: themeColors.successBg }}
          >
            <Receipt size={14} style={{ color: themeColors.success }} />
          </div>
          <span
            className="text-xs font-medium"
            style={{ color: themeColors.textPrimary }}
          >
            Payslip
          </span>
        </button>
      </div>
    </div>
  );

  // Dashboard Section - Redesigned
  const renderDashboard = () => (
    <div className="space-y-6">
      <DashboardHeader />

      {/* Stats Grid - First Row: Attendance, Task, Leave Balance, Working Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AttendanceSummary />
        <TaskOverview />
        <LeaveBalanceSummary />
        <WorklogSection />
      </div>

      {/* Task Completion Graph - Full width with traditional axes */}
      <AnalyticsGraphs />

      {/* Two Column Layout - Quick Actions and Calendar - Smaller height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-auto">
          <QuickActionsSection />
        </div>
        <div className="h-auto">
          <CalendarSection />
        </div>
      </div>
    </div>
  );

  // Attendance Section
  const renderAttendance = () => (
    <div className="space-y-6">
      <div
        className="rounded-lg p-6 border transform hover:scale-[1.002] transition-all duration-300"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.borderDivider,
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: themeColors.textPrimary }}
            >
              Attendance
            </h1>
            <p style={{ color: themeColors.textSecondary }}>
              Mark your daily attendance and track history
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-center">
            <div
              className="text-sm"
              style={{ color: themeColors.textSecondary }}
            >
              Today's Date
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: themeColors.textPrimary }}
            >
              {currentTime.toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="lg:col-span-2 rounded-lg p-6 border transform hover:scale-[1.002] transition-all duration-300"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.borderDivider,
          }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: themeColors.textPrimary }}
          >
            Mark Attendance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleClockIn}
              disabled={isClockedIn || (clockInTime && clockInTime !== '--:--')}
              className="p-5 rounded-lg flex flex-col items-center justify-center transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed group"
              style={{
                backgroundColor: isClockedIn
                  ? themeColors.cardHover
                  : themeColors.successBg,
                border: `1px solid ${isClockedIn ? themeColors.borderDivider : themeColors.success
                  }`,
              }}
            >
              <CheckCircle
                className="mb-3 transform group-hover:scale-110 transition-transform"
                size={32}
                style={{
                  color: isClockedIn
                    ? themeColors.textMuted
                    : themeColors.success,
                }}
              />
              <span
                className="text-lg font-semibold mb-1"
                style={{
                  color: isClockedIn
                    ? themeColors.textMuted
                    : themeColors.textPrimary,
                }}
              >
                Mark In
              </span>
              <span
                className="text-sm"
                style={{ color: themeColors.textSecondary }}
              >
                Start your work day
              </span>
            </button>

            <button
              onClick={handleClockOut}
              disabled={!isClockedIn}
              className="p-5 rounded-lg flex flex-col items-center justify-center transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed group"
              style={{
                backgroundColor: !isClockedIn
                  ? themeColors.cardHover
                  : themeColors.dangerBg,
                border: `1px solid ${!isClockedIn ? themeColors.borderDivider : themeColors.danger
                  }`,
              }}
            >
              <LogOut
                className="mb-3 transform group-hover:scale-110 transition-transform"
                size={32}
                style={{
                  color: !isClockedIn
                    ? themeColors.textMuted
                    : themeColors.danger,
                }}
              />
              <span
                className="text-lg font-semibold mb-1"
                style={{
                  color: !isClockedIn
                    ? themeColors.textMuted
                    : themeColors.textPrimary,
                }}
              >
                Mark Out
              </span>
              <span
                className="text-sm"
                style={{ color: themeColors.textSecondary }}
              >
                End your work day
              </span>
            </button>
          </div>
        </div>

        {/* Today's Summary */}
        <TodaysSummary />
      </div>
    </div>
  );

  // Worklogs Section with filters and text input for project
  const renderWorklogs = () => (
    <div className="space-y-6">
      <div
        className="rounded-lg p-6 border transform hover:scale-[1.002] transition-all duration-300"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.borderDivider,
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: themeColors.textPrimary }}
            >
              Worklogs
            </h1>
            <p style={{ color: themeColors.textSecondary }}>
              Submit daily worklogs and track your tasks
            </p>
          </div>
          <button
            onClick={() => setShowWorklogModal(true)}
            className="mt-4 md:mt-0 px-4 py-2 rounded font-semibold flex items-center text-sm hover:scale-105 transition-transform"
            style={{ backgroundColor: themeColors.primary, color: "#FFFFFF" }}
          >
            <Plus className="mr-2" size={16} />
            New Worklog
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-lg border p-4"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.borderDivider,
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Filter by Date</label>
            <input
              type="date"
              value={worklogDateFilter}
              onChange={(e) => setWorklogDateFilter(e.target.value)}
              className="w-full p-2 rounded border text-sm"
              style={{
                backgroundColor: themeColors.cardBackground,
                borderColor: themeColors.borderDivider,
                color: themeColors.textPrimary,
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Filter by Month</label>
            <select
              value={worklogMonthFilter}
              onChange={(e) => setWorklogMonthFilter(e.target.value)}
              className="w-full p-2 rounded border text-sm"
              style={{
                backgroundColor: themeColors.cardBackground,
                borderColor: themeColors.borderDivider,
                color: themeColors.textPrimary,
              }}
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>{new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setWorklogDateFilter("");
                setWorklogMonthFilter("");
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: themeColors.cardHover,
                color: themeColors.textPrimary,
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Worklogs Display - Professional Cards Layout */}
      <div
        className="rounded-lg border transform hover:scale-[1.002] transition-all duration-300"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.borderDivider,
        }}
      >
        <div
          className="p-5 border-b"
          style={{ borderColor: themeColors.borderDivider }}
        >
          <h3
            className="text-lg font-semibold"
            style={{ color: themeColors.textPrimary }}
          >
            Recent Worklogs
          </h3>
        </div>
        <div className="p-5">
          {filteredWorklogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: themeColors.textMuted }} />
              <p style={{ color: themeColors.textSecondary }}>No worklogs found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWorklogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg border hover:shadow-md transition-all"
                  style={{
                    backgroundColor: themeColors.cardHover,
                    borderColor: themeColors.borderDivider,
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold" style={{ color: themeColors.textPrimary }}>{log.task}</h4>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: themeColors.successBg,
                        color: themeColors.success,
                      }}
                    >
                      {log.status}
                    </span>
                  </div>

                  <p className="text-sm mb-3" style={{ color: themeColors.textSecondary }}>
                    {log.description}
                  </p>

                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="flex items-center">
                      <Briefcase size={12} className="mr-1" style={{ color: themeColors.info }} />
                      <span style={{ color: themeColors.textMuted }}>Project:</span>
                      <span className="ml-1 font-medium" style={{ color: themeColors.textPrimary }}>{log.project || "--"}</span>
                    </span>
                    <span className="flex items-center">
                      <Timer size={12} className="mr-1" style={{ color: themeColors.warning }} />
                      <span style={{ color: themeColors.textMuted }}>Time:</span>
                      <span className="ml-1 font-medium" style={{ color: themeColors.textPrimary }}>{log.time}</span>
                    </span>
                    <span className="flex items-center">
                      <Calendar size={12} className="mr-1" style={{ color: themeColors.primary }} />
                      <span style={{ color: themeColors.textMuted }}>Date:</span>
                      <span className="ml-1 font-medium" style={{ color: themeColors.textPrimary }}>{log.date}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Leave Management Section with working filters
  const renderLeaveManagement = () => {
    const usedLeavesSummary = {
      casual: leaves
        .filter((l) => isCasualLeaveType(l.type) && isApprovedLeave(l))
        .reduce((sum, l) => sum + (Number(l.days) || 0), 0),
      sick: leaves
        .filter((l) => isSickLeaveType(l.type) && isApprovedLeave(l))
        .reduce((sum, l) => sum + (Number(l.days) || 0), 0),
      earned: leaves
        .filter((l) => isEarnedLeaveType(l.type) && isApprovedLeave(l))
        .reduce((sum, l) => sum + (Number(l.days) || 0), 0)
    };

    const totalLeavesSummary = {
      casual: usedLeavesSummary.casual + (leaveBalance.casual || 0),
      sick: usedLeavesSummary.sick + (leaveBalance.sick || 0),
      earned: usedLeavesSummary.earned + (leaveBalance.earned || 0)
    };

    return (
      <div className="space-y-6">
        <div
          className="rounded-lg p-6 border transform hover:scale-[1.002] transition-all duration-300"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.borderDivider,
          }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1
                className="text-2xl font-bold mb-2"
                style={{ color: themeColors.textPrimary }}
              >
                Leave Management
              </h1>
              <p style={{ color: themeColors.textSecondary }}>
                Apply for leave and track your requests
              </p>
            </div>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="mt-4 md:mt-0 px-4 py-2 rounded font-semibold flex items-center text-sm hover:scale-105 transition-transform"
              style={{ backgroundColor: themeColors.primary, color: "#FFFFFF" }}
            >
              <Plus className="mr-2" size={16} />
              Apply for Leave
            </button>
          </div>
        </div>

        {/* Leave Balance with Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              type: "Casual Leave",
              total: totalLeavesSummary.casual,
              used: usedLeavesSummary.casual,
              remaining: leaveBalance.casual,
              color: themeColors.success,
              icon: CiCalendar,
            },
            {
              type: "Sick Leave",
              total: totalLeavesSummary.sick,
              used: usedLeavesSummary.sick,
              remaining: leaveBalance.sick,
              color: themeColors.info,
              icon: MdOutlineSick,
            },
            {
              type: "Earned Leave",
              total: totalLeavesSummary.earned,
              used: usedLeavesSummary.earned,
              remaining: leaveBalance.earned,
              color: themeColors.primary,
              icon: FaRegCalendarCheck,
            },
          ].map((item, index) => {
            const isExhausted = item.remaining === 0;

            return (
              <div
                key={index}
                className={`rounded-lg p-5 border transform hover:scale-[1.02] transition-all duration-300 group ${isExhausted ? 'opacity-75' : ''}`}
                style={{
                  backgroundColor: themeColors.cardBackground,
                  borderColor: isExhausted ? themeColors.danger : themeColors.borderDivider,
                }}
              >
                <div className="flex items-center mb-3">
                  <div
                    className="p-2 rounded-lg mr-3 transform group-hover:rotate-12 transition-transform"
                    style={{ backgroundColor: themeColors.cardHover }}
                  >
                    <item.icon size={20} style={{ color: item.color }} />
                  </div>
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: themeColors.textPrimary }}
                  >
                    {item.type}
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: themeColors.textSecondary }}>Total:</span>
                    <span className="font-medium" style={{ color: themeColors.textPrimary }}>{item.total} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: themeColors.textSecondary }}>Used:</span>
                    <span className="font-medium" style={{ color: themeColors.warning }}>{item.used} days</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 mt-2 border-t" style={{ borderColor: themeColors.borderDivider }}>
                    <span style={{ color: themeColors.textSecondary }}>Remaining:</span>
                    <span className={`font-bold ${isExhausted ? 'text-red-500' : ''}`} style={{ color: isExhausted ? themeColors.danger : item.color }}>
                      {item.remaining} days
                    </span>
                  </div>
                  {isExhausted && (
                    <div className="mt-2 text-xs text-center p-1 rounded" style={{ backgroundColor: themeColors.dangerBg, color: themeColors.danger }}>
                      Balance exhausted
                    </div>  
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Leave Filters */}
        <div
          className="rounded-lg border p-4"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.borderDivider,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Filter by Date</label>
              <input
                type="date"
                value={leaveDateFilter}
                onChange={(e) => setLeaveDateFilter(e.target.value)}
                className="w-full p-2 rounded border text-sm"
                style={{
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.borderDivider,
                  color: themeColors.textPrimary,
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Filter by Month</label>
              <select
                value={leaveMonthFilter}
                onChange={(e) => setLeaveMonthFilter(e.target.value)}
                className="w-full p-2 rounded border text-sm"
                style={{
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.borderDivider,
                  color: themeColors.textPrimary,
                }}
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.textSecondary }}>Filter by Status</label>
              <select
                value={leaveStatusFilter}
                onChange={(e) => setLeaveStatusFilter(e.target.value)}
                className="w-full p-2 rounded border text-sm"
                style={{
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.borderDivider,
                  color: themeColors.textPrimary,
                }}
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setLeaveDateFilter("");
                  setLeaveMonthFilter("");
                  setLeaveStatusFilter("all");
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: themeColors.cardHover,
                  color: themeColors.textPrimary,
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Leave History */}
        <div
          className="rounded-lg border transform hover:scale-[1.002] transition-all duration-300"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.borderDivider,
          }}
        >
          <div
            className="p-5 border-b"
            style={{ borderColor: themeColors.borderDivider }}
          >
            <h3
              className="text-lg font-semibold"
              style={{ color: themeColors.textPrimary }}
            >
              Leave History
            </h3>
          </div>
          <div className="p-5">
            {filteredLeaves.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: themeColors.textMuted }} />
                <p style={{ color: themeColors.textSecondary }}>No leave records found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="p-4 rounded-lg flex items-center justify-between hover:scale-[1.01] transition-transform group"
                    style={{ backgroundColor: themeColors.cardHover }}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className="font-medium text-sm"
                        style={{ color: themeColors.textPrimary }}
                      >
                        {getFullLeaveTypeName(leave.type)}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: themeColors.textSecondary }}
                      >
                        {new Date(leave.from).toLocaleDateString()} to {new Date(leave.to).toLocaleDateString()} • {leave.days} days
                      </div>
                      <div
                        className="text-xs mt-1"
                        style={{ color: themeColors.textMuted }}
                      >
                        {leave.reason}
                      </div>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium ml-2 flex-shrink-0 transform group-hover:scale-110 transition-transform"
                      style={{
                        backgroundColor:
                          leave.status === "approved"
                            ? themeColors.successBg
                            : leave.status === "pending"
                              ? themeColors.warningBg
                              : themeColors.dangerBg,
                        color:
                          leave.status === "approved"
                            ? themeColors.success
                            : leave.status === "pending"
                              ? themeColors.warning
                              : themeColors.danger,
                      }}
                    >
                      {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  };

  // Render Modals
  const renderModals = () => (
    <>
      {/* Leave Application Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-0">
          <div
            className="rounded-lg border w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-300"
            style={{
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.borderDivider,
            }}
          >
            <div className="p-5">
              <div className="flex justify-between items-center mb-5">
                <h3
                  className="text-xl font-bold"
                  style={{ color: themeColors.textPrimary }}
                >
                  Apply for Leave
                </h3>
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="p-2 rounded hover:scale-110 transition-transform"
                  style={{ color: themeColors.textMuted }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleApplyLeave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: themeColors.textSecondary }}
                    >
                      Leave Type *
                    </label>
                    <select
                      value={newLeave.type}
                      onChange={(e) => setNewLeave({ ...newLeave, type: e.target.value })}
                      className="w-full p-2 rounded border text-sm hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: themeColors.cardBackground,
                        borderColor: themeColors.borderDivider,
                        color: themeColors.textPrimary,
                      }}
                      required
                    >
                      <option value="">Select Leave Type</option>
                      {(() => {
                        // Combine hardcoded and API options
                        const hardcodedTypes = [
                          { name: "Casual Leave", value: "Casual Leave" },
                          { name: "Sick Leave", value: "Sick Leave" },
                          { name: "Earned Leave", value: "Earned Leave" }
                        ];

                        const apiTypes = leaveTypes.map(type => ({
                          name: getFullLeaveTypeName(type.name || type.code),
                          value: type.code || type.name
                        }));

                        // Combine and remove duplicates based on name
                        const allTypes = [...hardcodedTypes, ...apiTypes];
                        const uniqueTypes = allTypes.filter((type, index, self) =>
                          index === self.findIndex(t => t.name === type.name)
                        );

                        return uniqueTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.name}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: themeColors.textSecondary }}
                    >
                      Contact During Leave *
                    </label>
                    <div className="relative">
                      <input
                        type={newLeave.showContactNumber ? "text" : "password"}
                        value={newLeave.contactNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setNewLeave({ ...newLeave, contactNumber: value });
                        }}
                        className="w-full p-2 rounded border text-sm pr-10 hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: themeColors.cardBackground,
                          borderColor: themeColors.borderDivider,
                          color: themeColors.textPrimary,
                        }}
                        placeholder="Enter 10-digit mobile number"
                        maxLength="10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setNewLeave({ ...newLeave, showContactNumber: !newLeave.showContactNumber })}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      >
                        {newLeave.showContactNumber ? (
                          <EyeOff size={16} style={{ color: themeColors.textMuted }} />
                        ) : (
                          <Eye size={16} style={{ color: themeColors.textMuted }} />
                        )}
                      </button>
                    </div>
                    {newLeave.contactNumber && (
                      <div className="mt-1 text-xs">
                        {/^[6-9]\d{9}$/.test(newLeave.contactNumber) ? (
                          <span style={{ color: themeColors.success }}>✓ Valid Indian Mobile Number</span>
                        ) : (
                          <span style={{ color: themeColors.danger }}>✗ Invalid Indian Mobile Number (must start with 6-9 and be 10 digits)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: themeColors.textSecondary }}
                    >
                      From Date *
                    </label>
                    <input
                      type="date"
                      value={newLeave.from}
                      onChange={(e) =>
                        setNewLeave({ ...newLeave, from: e.target.value })
                      }
                      className="w-full p-2 rounded border text-sm hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: themeColors.cardBackground,
                        borderColor: themeColors.borderDivider,
                        color: themeColors.textPrimary,
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: themeColors.textSecondary }}
                    >
                      To Date *
                    </label>
                    <input
                      type="date"
                      value={newLeave.to}
                      onChange={(e) =>
                        setNewLeave({ ...newLeave, to: e.target.value })
                      }
                      className="w-full p-2 rounded border text-sm hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: themeColors.cardBackground,
                        borderColor: themeColors.borderDivider,
                        color: themeColors.textPrimary,
                      }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: themeColors.textSecondary }}
                  >
                    Reason for Leave *
                  </label>
                  <textarea
                    value={newLeave.reason}
                    onChange={(e) =>
                      setNewLeave({ ...newLeave, reason: e.target.value })
                    }
                    className="w-full p-2 rounded border text-sm hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: themeColors.cardBackground,
                      borderColor: themeColors.borderDivider,
                      color: themeColors.textPrimary,
                    }}
                    rows="3"
                    placeholder="Please provide detailed reason for leave..."
                    required
                  />
                </div>

                <div
                  className="flex justify-end space-x-3 pt-4 border-t"
                  style={{ borderColor: themeColors.borderDivider }}
                >
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(false)}
                    className="px-4 py-1.5 text-sm hover:scale-105 transition-transform"
                    style={{ color: themeColors.textSecondary }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded text-sm font-medium hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: themeColors.primary,
                      color: "#FFFFFF",
                    }}
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Worklog Modal */}
      {showWorklogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-0">
          <div
            className="rounded-lg border w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-300"
            style={{
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.borderDivider,
            }}
          >
            <div className="p-5">
              <div className="flex justify-between items-center mb-5">
                <h3
                  className="text-xl font-bold"
                  style={{ color: themeColors.textPrimary }}
                >
                  Submit New Worklog
                </h3>
                <button
                  onClick={() => setShowWorklogModal(false)}
                  className="p-2 rounded hover:scale-110 transition-transform"
                  style={{ color: themeColors.textMuted }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitWorklog} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: themeColors.textSecondary }}
                    >
                      Task/Project Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newWorklog.task}
                      onChange={(e) =>
                        setNewWorklog({ ...newWorklog, task: e.target.value })
                      }
                      className="w-full p-2 rounded border text-sm hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: themeColors.cardBackground,
                        borderColor: themeColors.borderDivider,
                        color: themeColors.textPrimary,
                      }}
                      placeholder="Enter task name"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: themeColors.textSecondary }}
                    >
                      Project *
                    </label>
                    <input
                      type="text"
                      required
                      value={newWorklog.project}
                      onChange={(e) =>
                        setNewWorklog({
                          ...newWorklog,
                          project: e.target.value,
                        })
                      }
                      className="w-full p-2 rounded border text-sm hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: themeColors.cardBackground,
                        borderColor: themeColors.borderDivider,
                        color: themeColors.textPrimary,
                      }}
                      placeholder="Enter project name"
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: themeColors.textSecondary }}
                  >
                    Work Description *
                  </label>
                  <textarea
                    required
                    value={newWorklog.description}
                    onChange={(e) =>
                      setNewWorklog({
                        ...newWorklog,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-2 rounded border text-sm hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: themeColors.cardBackground,
                      borderColor: themeColors.borderDivider,
                      color: themeColors.textPrimary,
                    }}
                    rows="4"
                    placeholder="Describe your work in detail..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: themeColors.textSecondary }}
                    >
                      Time Spent (hours) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      required
                      value={newWorklog.time}
                      onChange={(e) =>
                        setNewWorklog({ ...newWorklog, time: e.target.value })
                      }
                      className="w-full p-2 rounded border text-sm hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: themeColors.cardBackground,
                        borderColor: themeColors.borderDivider,
                        color: themeColors.textPrimary,
                      }}
                      placeholder="e.g., 2.5"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: themeColors.textSecondary }}
                    >
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newWorklog.date}
                      onChange={(e) =>
                        setNewWorklog({ ...newWorklog, date: e.target.value })
                      }
                      className="w-full p-2 rounded border text-sm hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: themeColors.cardBackground,
                        borderColor: themeColors.borderDivider,
                        color: themeColors.textPrimary,
                      }}
                    />
                  </div>
                </div>

                <div
                  className="flex justify-end space-x-3 pt-4 border-t"
                  style={{ borderColor: themeColors.borderDivider }}
                >
                  <button
                    type="button"
                    onClick={() => setShowWorklogModal(false)}
                    className="px-4 py-1.5 text-sm hover:scale-105 transition-transform"
                    style={{ color: themeColors.textSecondary }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded text-sm font-medium hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: themeColors.primary,
                      color: "#FFFFFF",
                    }}
                  >
                    Submit Worklog
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-0">
          <div
            className="rounded-lg border w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-300"
            style={{
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.borderDivider,
            }}
          >
            <div className="p-5">
              <div className="flex justify-between items-center mb-5">
                <h3
                  className="text-xl font-bold"
                  style={{ color: themeColors.textPrimary }}
                >
                  Add New Task
                </h3>
                <button
                  onClick={() => setShowNewTaskModal(false)}
                  className="p-2 rounded hover:scale-110 transition-transform"
                  style={{ color: themeColors.textMuted }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: themeColors.textSecondary }}
                  >
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    className="w-full p-2 rounded border text-sm hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: themeColors.cardBackground,
                      borderColor: themeColors.borderDivider,
                      color: themeColors.textPrimary,
                    }}
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: themeColors.textSecondary }}
                  >
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    className="w-full p-2 rounded border text-sm hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: themeColors.cardBackground,
                      borderColor: themeColors.borderDivider,
                      color: themeColors.textPrimary,
                    }}
                    rows="3"
                    placeholder="Task description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: themeColors.textSecondary }}
                    >
                      Estimated Time
                    </label>
                    <input
                      type="text"
                      value={newTask.time}
                      onChange={(e) =>
                        setNewTask({ ...newTask, time: e.target.value })
                      }
                      className="w-full p-2 rounded border text-sm hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: themeColors.cardBackground,
                        borderColor: themeColors.borderDivider,
                        color: themeColors.textPrimary,
                      }}
                      placeholder="e.g., 2h"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: themeColors.textSecondary }}
                    >
                      Priority
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) =>
                        setNewTask({ ...newTask, priority: e.target.value })
                      }
                      className="w-full p-2 rounded border text-sm hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: themeColors.cardBackground,
                        borderColor: themeColors.borderDivider,
                        color: themeColors.textPrimary,
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: themeColors.textSecondary }}
                  >
                    Project
                  </label>
                  <select
                    value={newTask.project}
                    onChange={(e) =>
                      setNewTask({ ...newTask, project: e.target.value })
                    }
                    className="w-full p-2 rounded border text-sm hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: themeColors.cardBackground,
                      borderColor: themeColors.borderDivider,
                      color: themeColors.textPrimary,
                    }}
                  >
                    <option value="Alpha">Project Alpha</option>
                    <option value="Beta">Project Beta</option>
                    <option value="Gamma">Project Gamma</option>
                    <option value="Internal">Internal</option>
                  </select>
                </div>

                <div
                  className="flex justify-end space-x-3 pt-4 border-t"
                  style={{ borderColor: themeColors.borderDivider }}
                >
                  <button
                    type="button"
                    onClick={() => setShowNewTaskModal(false)}
                    className="px-4 py-1.5 text-sm hover:scale-105 transition-transform"
                    style={{ color: themeColors.textSecondary }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded text-sm font-medium hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: themeColors.primary,
                      color: "#FFFFFF",
                    }}
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div
      className="min-h-screen transition-colors duration-300 font-sans"
      style={{
        backgroundColor: themeColors.appBackground,
        color: themeColors.textPrimary,
      }
      }
    >
      {/* Main Content */}
      < div className="flex-1 min-w-0" >
        <main className="p-4 md:p-6">{renderActiveSection()}</main>
      </div >
      {/* Render Modals */}
      {renderModals()}
    </div >
  );
};

export default EmployeeDashboard;
