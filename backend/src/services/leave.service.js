import {
  Employee,
  LeaveRequest,
  LeaveType,
  EmployeeLeaveBalance,
  User,
} from "../models/index.js";
import { Op } from "sequelize";
import { createNotification } from "./notification.service.js";
import { sendEmail } from "../utils/email.js";

const CURRENT_YEAR = new Date().getFullYear();
const AUTO_DECISION_WINDOW_HOURS = 24;

// Helper: calculate number of leave days
const calculateDays = (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

const LEAVE_TYPE_ALIAS_TO_CODE = {
  cl: ["CL"],
  casual: ["CL"],
  "casual leave": ["CL"],
  sl: ["SL"],
  sick: ["SL"],
  "sick leave": ["SL"],
  al: ["AL", "EL", "PL"],
  annual: ["AL", "EL", "PL"],
  "annual leave": ["AL", "EL", "PL"],
  el: ["EL", "AL", "PL"],
  earned: ["EL", "AL", "PL"],
  "earned leave": ["EL", "AL", "PL"],
  pl: ["PL", "EL", "AL"],
  paid: ["PL", "EL", "AL"],
  "paid leave": ["PL", "EL", "AL"],
};

const normalizeText = (value) => (value || "").toString().trim().toLowerCase();

const resolveLeaveType = async (input) => {
  const raw = (input || "").toString().trim();
  if (!raw) return null;

  const normalized = normalizeText(raw);
  const candidateCodes = LEAVE_TYPE_ALIAS_TO_CODE[normalized] || [raw.toUpperCase()];

  let type = await LeaveType.findOne({
    where: {
      [Op.or]: [{ code: { [Op.in]: candidateCodes } }, { name: raw }],
    },
  });

  if (type) return type;

  const allTypes = await LeaveType.findAll();
  return (
    allTypes.find((t) => candidateCodes.includes((t.code || "").toUpperCase())) ||
    allTypes.find((t) => normalizeText(t.code) === normalized) ||
    allTypes.find((t) => normalizeText(t.name) === normalized) ||
    null
  );
};

const autoRejectExpiredPendingLeaves = async () => {
  const thresholdDate = new Date(Date.now() - AUTO_DECISION_WINDOW_HOURS * 60 * 60 * 1000);
  const stalePendingLeaves = await LeaveRequest.findAll({
    where: {
      status: "PENDING",
      createdAt: { [Op.lte]: thresholdDate },
    },
    include: [{ model: Employee, as: "employee" }],
  });

  for (const leave of stalePendingLeaves) {
    leave.status = "REJECTED";
    leave.approverId = null;
    await leave.save();

    if (leave.employee?.userId) {
      await createNotification({
        userId: leave.employee.userId,
        title: "Leave Request Auto-Rejected",
        message: "Your leave request was automatically rejected after 24 hours without approval.",
        type: "LEAVE",
      });
    }
  }
};

// ================= EMPLOYEE =================

// Apply for leave
export const applyLeaveService = async (employeeId, data) => {
  const { leaveType, fromDate, toDate, reason } = data;

  if (!leaveType || !fromDate || !toDate) {
    throw new Error("leaveType, fromDate and toDate are required");
  }
  if (new Date(fromDate) > new Date(toDate)) {
    throw new Error("fromDate cannot be after toDate");
  }

  const days = calculateDays(fromDate, toDate);

  // 1️⃣ Validate leave type
  // Accept either code or name for flexibility
  const type = await resolveLeaveType(leaveType);
  if (!type) {
    throw new Error("Invalid leave type");
  }

  // 2️⃣ Check leave balance
  const balance = await EmployeeLeaveBalance.findOne({
    where: {
      employeeId,
      leaveTypeId: type.id,
      year: CURRENT_YEAR,
    },
  });

  if (!balance || balance.remaining < days) {
    throw new Error("Insufficient leave balance");
  }

  // 3️⃣ Get employee profile
  const employee = await Employee.findByPk(employeeId);
  if (!employee) {
    throw new Error("Employee not found");
  }

  // 4️⃣ LEAVE COLLISION CHECK (exclude self)
  const collisions = await LeaveRequest.findAll({
    where: {
      employeeId: { [Op.ne]: employeeId },
      status: { [Op.in]: ["PENDING", "APPROVED"] },
      fromDate: { [Op.lte]: toDate },
      toDate: { [Op.gte]: fromDate },
    },
    include: [
      {
        model: Employee,
        as: "employee",
        where: {
          department: employee.department,
          designation: employee.designation,
        },
      },
    ],
  });

  const hasCollision = collisions.length > 0;
  const collisionCount = collisions.length;
  // All leave requests now require manual review.
  // If not actioned within 24 hours they are auto-rejected.
  const finalStatus = "PENDING";

  const duplicate = await LeaveRequest.findOne({
    where: {
      employeeId,
      fromDate,
      toDate,
      status: { [Op.in]: ["PENDING", "APPROVED"] },
      leaveType: { [Op.in]: [type.code, type.name, leaveType] },
    },
  });
  if (duplicate) {
    throw new Error("A leave request for this period already exists");
  }

  // 5️⃣ Create leave request
  const leave = await LeaveRequest.create({
    employeeId,
    leaveType: type.code,
    fromDate,
    toDate,
    reason,
    status: finalStatus,
    hasCollision,
    collisionCount,
  });

  // 6️⃣ Notify managers of the department
  // 🔔 Notify managers (manual approval)
  const managers = await Employee.findAll({
    where: {
      department: employee.department,
      designation: { [Op.like]: "%Manager%" },
    },
  });

  for (const manager of managers) {
    await createNotification({
      userId: manager.userId,
      title: "New Leave Request",
      message: `${employee.fullName} applied for leave`,
      type: "LEAVE",
    });
  }

  // 🔔 Notify Admins
  const admins = await User.findAll({ where: { role: 'ADMIN' } });
  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      title: "New Leave Request",
      message: `${employee.fullName} applied for leave`,
      type: "LEAVE",
    });
  }

  // Send email to all involved managers (if emails available)
  const managerEmails = (
    await Promise.all(
      managers.map(async (m) => {
        const user = await m.getUser();
        return user ? user.email : null;
      })
    )
  ).filter(Boolean);

  if (managerEmails.length > 0) {
    await sendEmail({
      to: managerEmails.join(","),
      subject: "New Leave Request",
      text: `${employee.fullName} has applied for leave.`,
    });
  }

  return leave;
};

// Employee: my leave history
export const getMyLeavesService = async (employeeId) => {
  return LeaveRequest.findAll({
    where: { employeeId },
    order: [["fromDate", "DESC"]],
  });
};

// ================= MANAGER / ADMIN =================

// Pending leaves (with collision info)
export const getPendingLeavesService = async (user) => {
  await autoRejectExpiredPendingLeaves();
  const whereLeave = { status: "PENDING" };

  const include = [
    {
      model: Employee,
      as: "employee",
      attributes: ["id", "fullName", "department", "designation"],
    },
  ];

  if (user.role === "MANAGER") {
    if (!user.employeeId) {
      throw new Error("Manager employee profile not linked");
    }

    const managerEmp = await Employee.findByPk(user.employeeId);
    if (!managerEmp) {
      throw new Error("Manager employee profile not found");
    }

    include[0].where = { department: managerEmp.department };
  }

  const leaves = await LeaveRequest.findAll({
    where: whereLeave,
    include,
    order: [["fromDate", "ASC"]],
  });

  // Filter out any orphaned leave requests that don't have an employee join
  const filtered = leaves.filter((l) => l.employee);
  if (filtered.length !== leaves.length) {
    // Log once when orphaned records are found so admins can inspect
    console.warn(`Filtered ${leaves.length - filtered.length} orphaned leave requests without employee profile`);
  }

  // Return Sequelize instances (with included employee) so controller can map/format
  return filtered;
};

// All leaves (for Admin/Manager View)
export const getAllLeavesService = async (user, filters = {}) => {
  await autoRejectExpiredPendingLeaves();
  const whereLeave = {};

  if (filters.status && filters.status !== 'all') {
    whereLeave.status = filters.status.toUpperCase();
  }

  const include = [
    {
      model: Employee,
      as: "employee",
      attributes: ["id", "fullName", "department", "designation", "employeeCode"],
    },
  ];

  if (user.role === "MANAGER") {
    if (!user.employeeId) {
      throw new Error("Manager employee profile not linked");
    }

    const managerEmp = await Employee.findByPk(user.employeeId);
    if (!managerEmp) {
      throw new Error("Manager employee profile not found");
    }

    include[0].where = { department: managerEmp.department };
  }

  const leaves = await LeaveRequest.findAll({
    where: whereLeave,
    include,
    order: [["createdAt", "DESC"]],
  });

  return leaves;
};

// Approve / Reject leave
export const updateLeaveStatusService = async (user, leaveId, newStatus) => {
  await autoRejectExpiredPendingLeaves();
  if (!["APPROVED", "REJECTED"].includes(newStatus)) {
    throw new Error("Invalid leave status");
  }

  const leave = await LeaveRequest.findByPk(leaveId, {
    include: [{ model: Employee, as: "employee" }],
  });

  if (!leave) {
    throw new Error("Leave request not found");
  }
  if (!leave.employee) {
    throw new Error("Employee profile not found for this leave request");
  }

  if (leave.status !== "PENDING") {
    throw new Error("Leave already processed");
  }

  // Manager department check
  if (user.role === "MANAGER") {
    const managerEmp = await Employee.findByPk(user.employeeId);
    if (!managerEmp || !leave.employee || managerEmp.department !== leave.employee.department) {
      throw new Error("Not allowed to approve/reject this leave");
    }
  }

  // If APPROVED → deduct balance
  if (newStatus === "APPROVED") {
    const days = calculateDays(leave.fromDate, leave.toDate);

    const type = await resolveLeaveType(leave.leaveType);
    if (!type) {
      throw new Error("Leave type not found for this request");
    }

    let balance = await EmployeeLeaveBalance.findOne({
      where: {
        employeeId: leave.employeeId,
        leaveTypeId: type.id,
        year: CURRENT_YEAR,
      },
    });

    // Auto-heal missing balance rows for the year
    if (!balance) {
      balance = await EmployeeLeaveBalance.create({
        employeeId: leave.employeeId,
        leaveTypeId: type.id,
        year: CURRENT_YEAR,
        total: type.yearlyLimit || 0,
        used: 0,
        remaining: type.yearlyLimit || 0,
      });
    }

    if (!balance || balance.remaining < days) {
      throw new Error("Insufficient leave balance");
    }

    balance.used += days;
    balance.remaining -= days;
    await balance.save();
  }

  leave.status = newStatus;
  leave.approverId = user.employeeId || null;
  await leave.save();

  // Notify employee (non-blocking for approval status update)
  if (leave.employee.userId) {
    try {
      await createNotification({
        userId: leave.employee.userId,
        title: "Leave Status Updated",
        message: `Your leave has been ${newStatus}`,
        type: "LEAVE",
      });
    } catch (notifyErr) {
      console.error("Leave notification failed:", notifyErr.message);
    }
  }

  // Send email if employee user has an email
  try {
    const empUser = await leave.employee.getUser();
    if (empUser && empUser.email) {
      await sendEmail({
        to: empUser.email,
        subject: "Leave Status Update",
        text: `Your leave has been ${newStatus}.`,
      });
    }
  } catch (mailErr) {
    console.error("Leave status email failed:", mailErr.message);
  }

  return leave;
};
