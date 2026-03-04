// src/services/dashboard.service.js
import { Op } from "sequelize";
import {
  User,
  Employee,
  Attendance,
  LeaveRequest,
  Worklog,
  Task,
  Payslip,
} from "../models/index.js";
import { getMockLicensingScope } from "./licensingScope.service.js";

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

// Admin dashboard summary
export const getAdminDashboardService = async (requestingUser = null) => {
  const today = getTodayDateString();
  const licensingScope = await getMockLicensingScope(requestingUser);
  const isScoped = !!licensingScope;

  if (isScoped && licensingScope.employeeIds.length === 0) {
    return {
      totalEmployees: 0,
      totalActiveUsers: 0,
      presentToday: 0,
      onLeaveToday: 0,
      pendingLeaves: 0,
      avgPerformance: 0,
      recentWorklogs: [],
      totalPayrollDue: 0,
      payrollDueDate: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short" }),
    };
  }

  const employeeIdFilter = isScoped
    ? { id: { [Op.in]: licensingScope.employeeIds } }
    : undefined;

  const userIdFilter = isScoped
    ? { id: { [Op.in]: licensingScope.userIds }, isActive: true }
    : { isActive: true };

  const [totalEmployees, totalActiveUsers, presentToday, onLeaveToday, pendingLeaves, recentWorklogs, totalPayrollDue] =
    await Promise.all([
      Employee.count(employeeIdFilter ? { where: employeeIdFilter } : {}),

      User.count({ where: userIdFilter }),

      Attendance.count({
        include: isScoped
          ? [
            {
              model: Employee,
              as: "employee",
              where: employeeIdFilter,
            },
          ]
          : undefined,
        where: { date: today, markIn: { [Op.ne]: null } },
      }),

      LeaveRequest.count({
        include: isScoped
          ? [
            {
              model: Employee,
              as: "employee",
              where: employeeIdFilter,
            },
          ]
          : undefined,
        where: {
          status: "APPROVED",
          fromDate: { [Op.lte]: today },
          toDate: { [Op.gte]: today },
        },
      }),

      LeaveRequest.count({
        include: isScoped
          ? [
            {
              model: Employee,
              as: "employee",
              where: employeeIdFilter,
            },
          ]
          : undefined,
        where: { status: "PENDING" },
      }),

      Worklog.findAll({
        include: [
          {
            model: Employee,
            as: "employee",
            ...(isScoped ? { where: employeeIdFilter } : {}),
          },
        ],
        order: [["date", "DESC"]],
        limit: 5,
      }),

      Payslip.sum('netSalary', {
        where: { status: 'PUBLISHED' },
        include: isScoped
          ? [
            {
              model: Employee,
              as: "employee",
              where: employeeIdFilter,
            },
          ]
          : undefined,
      }),
    ]);

  const recentWorklogsMapped = recentWorklogs.map((log) => ({
    id: log.id,
    date: log.date,
    description: log.description,
    hoursWorked: log.hoursWorked,
    employee: log.employee
      ? {
        id: log.employee.id,
        fullName: log.employee.fullName,
        department: log.employee.department,
        designation: log.employee.designation,
      }
      : null,
  }));

  // Compute average performance as task completion rate (scaled to 5)
  // If there are no tasks, default to 0
  const [totalTasks, completedTasks] = await Promise.all([
    Task.count(
      isScoped ? { where: { assignedToEmployeeId: licensingScope.employeeIds } } : {}
    ),
    Task.count({
      where: isScoped
        ? { assignedToEmployeeId: licensingScope.employeeIds, status: "COMPLETED" }
        : { status: "COMPLETED" },
    }),
  ]);

  const completionRate = totalTasks ? completedTasks / totalTasks : 0;
  const avgPerformance = Number((completionRate * 5).toFixed(2));

  // Determine next payroll date (e.g. 15th of current/next month) or just static for now
  // For dynamic, if today > 15, next is next month 15th.
  const now = new Date();
  let nextPayDate = new Date(now.getFullYear(), now.getMonth(), 15);
  if (now.getDate() > 15) {
    nextPayDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  }
  const payrollDueDate = nextPayDate.toLocaleDateString("en-US", { day: 'numeric', month: 'short' });


  return {
    totalEmployees,
    totalActiveUsers,
    presentToday,
    onLeaveToday,
    pendingLeaves,
    avgPerformance,
    recentWorklogs: recentWorklogsMapped,
    totalPayrollDue: totalPayrollDue || 0,
    payrollDueDate,
  };
};

// Manager dashboard summary (based on manager's department)
export const getManagerDashboardService = async (user) => {
  const today = getTodayDateString();

  if (!user.employeeId) {
    throw new Error("Manager employee profile not linked");
  }

  const managerEmp = await Employee.findByPk(user.employeeId);
  if (!managerEmp) throw new Error("Manager employee profile not found");

  const dept = managerEmp.department;

  const [teamMembers, presentTodayTeam, onLeaveTodayTeam, pendingLeavesTeam, recentTeamWorklogs] =
    await Promise.all([
      Employee.findAll({ where: { department: dept } }),

      Attendance.count({
        include: [
          {
            model: Employee,
            as: "employee",
            where: { department: dept },
          },
        ],
        where: {
          date: today,
          markIn: { [Op.ne]: null },
        },
      }),

      LeaveRequest.count({
        include: [
          {
            model: Employee,
            as: "employee",
            where: { department: dept },
          },
        ],
        where: {
          status: "APPROVED",
          fromDate: { [Op.lte]: today },
          toDate: { [Op.gte]: today },
        },
      }),

      LeaveRequest.count({
        include: [
          {
            model: Employee,
            as: "employee",
            where: { department: dept },
          },
        ],
        where: {
          status: "PENDING",
        },
      }),

      Worklog.findAll({
        include: [
          {
            model: Employee,
            as: "employee",
            where: { department: dept },
          },
        ],
        order: [["date", "DESC"]],
        limit: 5,
      }),
    ]);

  const recentWorklogsMapped = recentTeamWorklogs.map((log) => ({
    id: log.id,
    date: log.date,
    description: log.description,
    hoursWorked: log.hoursWorked,
    employee: {
      id: log.employee.id,
      fullName: log.employee.fullName,
      department: log.employee.department,
      designation: log.employee.designation,
    },
  }));

  // Compute manager team average performance using tasks assigned to team members
  const employeeIds = teamMembers.map((e) => e.id);
  const [totalTeamTasks, completedTeamTasks] = await Promise.all([
    Task.count({ where: { assignedToEmployeeId: employeeIds } }),
    Task.count({ where: { assignedToEmployeeId: employeeIds, status: "COMPLETED" } }),
  ]);
  const teamCompletionRate = totalTeamTasks ? completedTeamTasks / totalTeamTasks : 0;
  const avgPerformance = Number((teamCompletionRate * 5).toFixed(2));

  return {
    department: dept,
    teamSize: teamMembers.length,
    presentToday: presentTodayTeam,
    onLeaveToday: onLeaveTodayTeam,
    pendingLeaves: pendingLeavesTeam,
    avgPerformance,
    recentWorklogs: recentWorklogsMapped,
  };
};
