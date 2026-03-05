import axios from "axios";

const TRIAL_USER_CODE_PREFIX = "TRL";
const STORAGE_PREFIX = "litehr_trial_demo_v1";

const toUpper = (value) => String(value || "").toUpperCase();

const safeParse = (raw, fallback = null) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const getStoredUser = () => safeParse(localStorage.getItem("user"), null);

// One shared seed for the active browser session so demo data stays connected across portals.
const getSeedKey = () => `${STORAGE_PREFIX}:seeded`;
const getDataKey = () => `${STORAGE_PREFIX}:data`;

const parsePath = (url) => {
  const normalized = String(url || "");
  const withoutOrigin = normalized.replace(/^https?:\/\/[^/]+/i, "");
  const [pathPart = "", queryPart = ""] = withoutOrigin.split("?");
  const withoutApi = pathPart.replace(/^\/api/i, "") || "/";
  const query = new URLSearchParams(queryPart);
  return {
    path: withoutApi.startsWith("/") ? withoutApi : `/${withoutApi}`,
    query,
  };
};

const buildDemoData = () => {
  const today = new Date().toISOString().slice(0, 10);
  const user = getStoredUser() || {};
  const managerName = user?.employee?.fullName || "Mahek Admin";

  const departments = [
    { id: 1, name: "Engineering", code: "ENG" },
    { id: 2, name: "HR", code: "HR" },
    { id: 3, name: "Sales", code: "SAL" },
    { id: 4, name: "Operations", code: "OPS" },
  ];

  const employees = [
    { id: 101, fullName: "Aarav Patel", employeeCode: "TRL001", department: "Engineering", email: "aarav@litehr.demo", designation: "Software Engineer", role: "EMPLOYEE", isActive: true },
    { id: 102, fullName: "Diya Shah", employeeCode: "TRL002", department: "Engineering", email: "diya@litehr.demo", designation: "Frontend Engineer", role: "EMPLOYEE", isActive: true },
    { id: 103, fullName: "Rohan Mehta", employeeCode: "TRL003", department: "HR", email: "rohan@litehr.demo", designation: "HR Specialist", role: "EMPLOYEE", isActive: true },
    { id: 104, fullName: "Nisha Verma", employeeCode: "TRL004", department: "Sales", email: "nisha@litehr.demo", designation: "Sales Executive", role: "EMPLOYEE", isActive: true },
    { id: 105, fullName: managerName, employeeCode: "TRL000", department: "Operations", email: user?.email || "admin@litehr.demo", designation: "Administrator", role: "ADMIN", isActive: true },
  ];

  const attendance = [
    { id: 1, employeeId: 101, status: "PRESENT", markIn: `${today}T09:02:00.000Z`, date: today },
    { id: 2, employeeId: 102, status: "PRESENT", markIn: `${today}T09:10:00.000Z`, date: today },
    { id: 3, employeeId: 103, status: "LATE", markIn: `${today}T09:36:00.000Z`, date: today },
    { id: 4, employeeId: 104, status: "ABSENT", markIn: null, date: today },
  ];

  const leaves = [
    { id: 1, employeeId: 103, leaveType: "SL", status: "PENDING", startDate: today, endDate: today },
    { id: 2, employeeId: 104, leaveType: "CL", status: "APPROVED", startDate: today, endDate: today },
    { id: 3, employeeId: 101, leaveType: "AL", status: "PENDING", startDate: today, endDate: today },
  ];

  const jobs = [
    { id: 1, title: "Frontend Developer", department: "Engineering", status: "Active" },
    { id: 2, title: "HR Associate", department: "HR", status: "Active" },
    { id: 3, title: "Operations Intern", department: "Operations", status: "Closed" },
  ];

  const jobApplications = [
    { id: 1, position: "Frontend Developer", status: "PENDING", job: { title: "Frontend Developer" } },
    { id: 2, position: "HR Associate", status: "SHORTLISTED", job: { title: "HR Associate" } },
  ];

  const worklogs = [
    { id: 1, employeeId: 101, description: "Completed onboarding checklist updates.", hoursWorked: 3.5, project: "HR Ops", date: today, createdAt: `${today}T10:30:00.000Z` },
    { id: 2, employeeId: 102, description: "Updated manager dashboard widgets.", hoursWorked: 4, project: "Internal Tools", date: today, createdAt: `${today}T12:30:00.000Z` },
    { id: 3, employeeId: 103, description: "Shortlisted profiles and scheduled interviews.", hoursWorked: 2.5, project: "Recruitment", date: today, createdAt: `${today}T13:40:00.000Z` },
  ];

  const tasks = [
    { id: 1, title: "Prepare attendance report", status: "IN_PROGRESS", employeeId: 101 },
    { id: 2, title: "Finalize hiring scorecards", status: "TODO", employeeId: 103 },
  ];

  const notifications = [
    { id: 1, title: "Demo Mode Activated", message: "Sample data is active across all portals.", isRead: false, createdAt: `${today}T08:30:00.000Z`, type: "info" },
  ];

  const documents = [
    { id: 1, title: "Employee Handbook", fileName: "employee-handbook.pdf", fileUrl: "/demo/employee-handbook.pdf", uploadedAt: `${today}T06:00:00.000Z`, access: "ALL" },
  ];

  const payslips = [
    { id: 1, employeeId: 101, month: "03", year: "2026", amount: 55000, status: "PUBLISHED" },
    { id: 2, employeeId: 102, month: "03", year: "2026", amount: 60000, status: "DRAFT" },
  ];

  return {
    meta: { seededAt: new Date().toISOString() },
    userProfile: user,
    departments,
    employees,
    attendance,
    leaves,
    jobs,
    jobApplications,
    worklogs,
    tasks,
    notifications,
    documents,
    payslips,
  };
};

const saveDemoData = (data) => {
  localStorage.setItem(getDataKey(), JSON.stringify(data));
};

export const getDemoData = () => safeParse(localStorage.getItem(getDataKey()), null);

export const hasSeededTrialDemo = () => localStorage.getItem(getSeedKey()) === "1" && Boolean(getDemoData());

export const seedTrialDemoData = () => {
  const data = buildDemoData();
  saveDemoData(data);
  localStorage.setItem(getSeedKey(), "1");
  return data;
};

export const isTrialUserSession = () => {
  const user = getStoredUser();
  if (user?.isTrial) return true;
  const employee = user?.employee || {};
  const employeeCode = toUpper(employee.employeeCode || user?.employeeCode);
  const department = toUpper(employee.department || user?.department);
  const designation = toUpper(employee.designation || user?.designation);
  return (
    employeeCode.startsWith(TRIAL_USER_CODE_PREFIX) ||
    department === "TRIAL" ||
    designation.startsWith("TRIAL ")
  );
};

const pickEmployee = (data) => {
  const user = getStoredUser() || {};
  const preferredCode = user?.employee?.employeeCode || user?.employeeCode;
  return (
    data.employees.find((e) => e.employeeCode === preferredCode) ||
    data.employees.find((e) => e.role === "EMPLOYEE") ||
    data.employees[0]
  );
};

const summarizeDashboardAdmin = (data) => {
  const totalEmployees = data.employees.length;
  const presentToday = data.attendance.filter((a) => ["PRESENT", "LATE", "HALF_DAY"].includes(toUpper(a.status))).length;
  const pendingLeaves = data.leaves.filter((l) => toUpper(l.status) === "PENDING").length;
  const onLeaveToday = data.leaves.filter((l) => toUpper(l.status) === "APPROVED").length;
  const recentWorklogs = data.worklogs.slice(0, 8).map((w) => ({
    ...w,
    employee: data.employees.find((e) => e.id === w.employeeId) || null,
  }));
  return {
    totalEmployees,
    totalActiveUsers: totalEmployees,
    presentToday,
    pendingLeaves,
    onLeaveToday,
    avgPerformance: 88,
    recentWorklogs,
  };
};

const summarizeChartAdmin = (data) => {
  const departments = data.departments.map((d) => ({
    department: d.name,
    count: data.employees.filter((e) => e.department === d.name).length,
  }));
  const month = String(new Date().getMonth() + 1);
  const attendance = [{ month, count: data.attendance.filter((a) => ["PRESENT", "LATE"].includes(toUpper(a.status))).length }];
  const leaveCounts = {};
  data.leaves.forEach((l) => {
    leaveCounts[l.leaveType] = (leaveCounts[l.leaveType] || 0) + 1;
  });
  const leaves = Object.keys(leaveCounts).map((leaveType) => ({
    type: leaveType,
    count: leaveCounts[leaveType],
  }));
  return { departments, attendance, leaves };
};

const asAxiosResponse = (config, status, data) => ({
  data,
  status,
  statusText: status >= 200 && status < 300 ? "OK" : "Error",
  headers: {},
  config,
  request: {},
});

const normalizeEntityPayload = (payload) => (payload && typeof payload === "object" ? payload : {});

const handleDemoRequest = (config) => {
  const method = toUpper(config.method || "GET");
  const { path, query } = parsePath(config.url);
  let data = getDemoData() || seedTrialDemoData();

  const currentEmployee = pickEmployee(data);

  const send = (status, body, nextData = null) => {
    if (nextData) {
      data = nextData;
      saveDemoData(data);
    }
    return Promise.resolve(asAxiosResponse(config, status, body));
  };

  if (method === "GET" && path === "/auth/getUser") return send(200, getStoredUser() || data.userProfile || {});
  if (method === "GET" && path === "/dashboard/admin") return send(200, summarizeDashboardAdmin(data));
  if (method === "GET" && path === "/dashboard/charts/admin") return send(200, summarizeChartAdmin(data));
  if (method === "GET" && path === "/dashboard/manager") {
    const dashboard = summarizeDashboardAdmin(data);
    return send(200, { teamSize: dashboard.totalEmployees, presentToday: dashboard.presentToday, pendingLeaves: dashboard.pendingLeaves, recentWorklogs: dashboard.recentWorklogs });
  }
  if (method === "GET" && path === "/dashboard/employee") {
    return send(200, {
      attendanceRate: 92,
      taskCompletionRate: 84,
      pendingTasks: data.tasks.filter((t) => t.employeeId === currentEmployee.id && toUpper(t.status) !== "COMPLETED").length,
      pendingLeaves: data.leaves.filter((l) => l.employeeId === currentEmployee.id && toUpper(l.status) === "PENDING").length,
    });
  }

  if (method === "GET" && path === "/admin/employees") return send(200, { employees: data.employees });
  if (method === "POST" && path === "/admin/employees") {
    const payload = normalizeEntityPayload(config.data && typeof config.data === "string" ? safeParse(config.data, {}) : config.data);
    const nextId = Math.max(0, ...data.employees.map((e) => e.id)) + 1;
    const employee = {
      id: nextId,
      fullName: payload.fullName || "New Employee",
      employeeCode: payload.employeeCode || `TRL${String(nextId).padStart(3, "0")}`,
      department: payload.department || "Operations",
      email: payload.email || `employee${nextId}@litehr.demo`,
      designation: payload.designation || "Associate",
      role: payload.role || "EMPLOYEE",
      isActive: true,
    };
    const nextData = { ...data, employees: [employee, ...data.employees] };
    return send(201, { employee }, nextData);
  }
  if (method === "GET" && /^\/admin\/employees\/\d+$/i.test(path)) {
    const id = Number(path.split("/").pop());
    const employee = data.employees.find((e) => e.id === id);
    return send(employee ? 200 : 404, employee || { message: "Not found" });
  }

  if (method === "GET" && path === "/departments") return send(200, data.departments);
  if (method === "POST" && path === "/departments") {
    const payload = normalizeEntityPayload(config.data && typeof config.data === "string" ? safeParse(config.data, {}) : config.data);
    const nextId = Math.max(0, ...data.departments.map((d) => d.id)) + 1;
    const dept = { id: nextId, name: payload.name || `Department ${nextId}`, code: payload.code || `D${nextId}` };
    const nextData = { ...data, departments: [...data.departments, dept] };
    return send(201, dept, nextData);
  }
  if (method === "GET" && /^\/departments\/\d+$/i.test(path)) {
    const id = Number(path.split("/").pop());
    const dept = data.departments.find((d) => d.id === id);
    return send(dept ? 200 : 404, dept || { message: "Not found" });
  }

  if (method === "GET" && path === "/jobs") {
    const statusFilter = query.get("status");
    const jobs = statusFilter ? data.jobs.filter((j) => toUpper(j.status) === toUpper(statusFilter)) : data.jobs;
    return send(200, jobs);
  }
  if (method === "POST" && path === "/jobs") {
    const payload = normalizeEntityPayload(config.data && typeof config.data === "string" ? safeParse(config.data, {}) : config.data);
    const nextId = Math.max(0, ...data.jobs.map((j) => j.id)) + 1;
    const job = { id: nextId, title: payload.title || "New Job", department: payload.department || "Operations", status: payload.status || "Active" };
    const nextData = { ...data, jobs: [job, ...data.jobs] };
    return send(201, job, nextData);
  }

  if (method === "GET" && path === "/job-applications") return send(200, { applications: data.jobApplications });
  if (method === "PUT" && /^\/job-applications\/\d+$/i.test(path)) {
    const id = Number(path.split("/").pop());
    const payload = normalizeEntityPayload(config.data && typeof config.data === "string" ? safeParse(config.data, {}) : config.data);
    const nextData = {
      ...data,
      jobApplications: data.jobApplications.map((a) => (a.id === id ? { ...a, status: payload.status || a.status } : a)),
    };
    return send(200, { success: true }, nextData);
  }

  if (method === "GET" && path === "/leave/all") return send(200, { leaves: data.leaves });
  if (method === "GET" && path === "/leave/pending") return send(200, { data: data.leaves.filter((l) => toUpper(l.status) === "PENDING") });
  if (method === "GET" && path === "/leave/my") return send(200, data.leaves.filter((l) => l.employeeId === currentEmployee.id));
  if (method === "POST" && path === "/leave/apply") {
    const payload = normalizeEntityPayload(config.data && typeof config.data === "string" ? safeParse(config.data, {}) : config.data);
    const nextId = Math.max(0, ...data.leaves.map((l) => l.id)) + 1;
    const leave = { id: nextId, employeeId: currentEmployee.id, leaveType: payload.leaveType || "CL", status: "PENDING", startDate: payload.startDate || new Date().toISOString().slice(0, 10), endDate: payload.endDate || new Date().toISOString().slice(0, 10) };
    const nextData = { ...data, leaves: [leave, ...data.leaves] };
    return send(201, leave, nextData);
  }
  if (method === "POST" && /^\/leave\/\d+\/approve$/i.test(path)) {
    const id = Number(path.split("/")[2]);
    const nextData = { ...data, leaves: data.leaves.map((l) => (l.id === id ? { ...l, status: "APPROVED" } : l)) };
    return send(200, { success: true }, nextData);
  }
  if (method === "POST" && /^\/leave\/\d+\/reject$/i.test(path)) {
    const id = Number(path.split("/")[2]);
    const nextData = { ...data, leaves: data.leaves.map((l) => (l.id === id ? { ...l, status: "REJECTED" } : l)) };
    return send(200, { success: true }, nextData);
  }

  if (method === "GET" && (path === "/leavebalance/my" || /^\/leavebalance\/\d+$/i.test(path))) {
    return send(200, [{ type: "CL", balance: 6 }, { type: "SL", balance: 4 }, { type: "AL", balance: 10 }]);
  }
  if (method === "GET" && path === "/leavetypes") return send(200, [{ code: "CL", name: "Casual Leave" }, { code: "SL", name: "Sick Leave" }, { code: "AL", name: "Annual Leave" }]);

  if (method === "GET" && path === "/manager/attendance/today") {
    const teamAttendance = data.attendance.map((a) => {
      const employee = data.employees.find((e) => e.id === a.employeeId) || {};
      return { ...a, employee, fullName: employee.fullName, employeeCode: employee.employeeCode, department: employee.department };
    });
    return send(200, { teamAttendance });
  }
  if (method === "GET" && path === "/manager/attendance") {
    const date = query.get("date");
    const rows = date ? data.attendance.filter((a) => a.date === date) : data.attendance;
    const teamAttendance = rows.map((a) => {
      const employee = data.employees.find((e) => e.id === a.employeeId) || {};
      return { ...a, employee, fullName: employee.fullName, employeeCode: employee.employeeCode, department: employee.department };
    });
    return send(200, { teamAttendance });
  }
  if (method === "GET" && path === "/manager/attendance/monthly") {
    return send(200, { data: data.attendance });
  }
  if (method === "GET" && path === "/attendance/all") return send(200, { data: data.attendance });
  if (method === "GET" && path === "/attendance/getAttendance") return send(200, { data: data.attendance.filter((a) => a.employeeId === currentEmployee.id) });
  if (method === "PUT" && path === "/attendance/mark-in") return send(200, { success: true, message: "Marked in (demo)." });
  if (method === "PUT" && path === "/attendance/mark-out") return send(200, { success: true, message: "Marked out (demo)." });
  if (method === "POST" && path === "/manager/attendance/mark") return send(200, { success: true, message: "Attendance updated (demo)." });
  if (method === "POST" && path === "/manager/attendance/remind") return send(200, { success: true, message: "Reminder sent (demo)." });

  if (method === "GET" && path === "/tasks/my") return send(200, { data: data.tasks.filter((t) => t.employeeId === currentEmployee.id) });
  if (method === "GET" && path === "/tasks/team") return send(200, { data: data.tasks });
  if (method === "POST" && path === "/tasks") {
    const payload = normalizeEntityPayload(config.data && typeof config.data === "string" ? safeParse(config.data, {}) : config.data);
    const nextId = Math.max(0, ...data.tasks.map((t) => t.id)) + 1;
    const task = { id: nextId, title: payload.title || payload.task || "New Task", status: payload.status || "TODO", employeeId: payload.employeeId || currentEmployee.id };
    const nextData = { ...data, tasks: [task, ...data.tasks] };
    return send(201, task, nextData);
  }
  if (method === "PATCH" && /^\/tasks\/\d+\/status$/i.test(path)) {
    const id = Number(path.split("/")[2]);
    const payload = normalizeEntityPayload(config.data && typeof config.data === "string" ? safeParse(config.data, {}) : config.data);
    const nextData = { ...data, tasks: data.tasks.map((t) => (t.id === id ? { ...t, status: payload.status || t.status } : t)) };
    return send(200, { success: true }, nextData);
  }

  if (method === "GET" && path === "/worklogs/team") {
    const rows = data.worklogs.map((w) => ({ ...w, employee: data.employees.find((e) => e.id === w.employeeId) || {} }));
    return send(200, { worklogs: rows });
  }
  if (method === "GET" && path === "/worklogs/my") return send(200, { data: data.worklogs.filter((w) => w.employeeId === currentEmployee.id) });
  if (method === "POST" && path === "/worklogs/add") {
    const payload = normalizeEntityPayload(config.data && typeof config.data === "string" ? safeParse(config.data, {}) : config.data);
    const nextId = Math.max(0, ...data.worklogs.map((w) => w.id)) + 1;
    const worklog = { id: nextId, employeeId: currentEmployee.id, description: payload.description || "Demo worklog", hoursWorked: Number(payload.hoursWorked) || 1, project: payload.project || "General", date: payload.date || new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString() };
    const nextData = { ...data, worklogs: [worklog, ...data.worklogs] };
    return send(201, worklog, nextData);
  }

  if (method === "GET" && path === "/holidays") return send(200, [{ date: "2026-03-08", name: "Demo Holiday" }]);
  if (method === "GET" && path === "/payslips/my") return send(200, data.payslips.filter((p) => p.employeeId === currentEmployee.id));
  if (method === "GET" && path === "/payslips") return send(200, data.payslips);
  if (method === "POST" && path === "/payslips/generate") return send(200, { success: true, message: "Payslips generated (demo)." });
  if (method === "PUT" && /^\/payslips\/\d+\/publish$/i.test(path)) return send(200, { success: true, message: "Payslip published (demo)." });

  if (method === "GET" && path === "/documents") return send(200, data.documents);
  if (method === "GET" && path === "/documents/my") return send(200, data.documents);
  if (method === "POST" && path === "/documents/upload") return send(201, { success: true, message: "Document uploaded (demo)." });
  if (method === "DELETE" && /^\/documents\/\d+$/i.test(path)) {
    const id = Number(path.split("/").pop());
    const nextData = { ...data, documents: data.documents.filter((d) => d.id !== id) };
    return send(200, { success: true }, nextData);
  }

  if (method === "GET" && path === "/notifications") return send(200, data.notifications);
  if (method === "PATCH" && /^\/notifications\/\d+\/read$/i.test(path)) {
    const id = Number(path.split("/")[2]);
    const nextData = { ...data, notifications: data.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)) };
    return send(200, { success: true }, nextData);
  }
  if (method === "PATCH" && path === "/notifications/read-all") {
    const nextData = { ...data, notifications: data.notifications.map((n) => ({ ...n, isRead: true })) };
    return send(200, { success: true }, nextData);
  }
  if (method === "POST" && path === "/notifications/clear") return send(200, { success: true }, { ...data, notifications: [] });
  if (method === "DELETE" && /^\/notifications\/\d+$/i.test(path)) {
    const id = Number(path.split("/").pop());
    return send(200, { success: true }, { ...data, notifications: data.notifications.filter((n) => n.id !== id) });
  }

  if (method === "PUT" && path === "/auth/profile") {
    const payload = normalizeEntityPayload(config.data && typeof config.data === "string" ? safeParse(config.data, {}) : config.data);
    const user = getStoredUser() || {};
    const updated = { ...user, ...payload, employee: { ...(user.employee || {}), ...payload } };
    localStorage.setItem("user", JSON.stringify(updated));
    return send(200, updated, { ...data, userProfile: updated });
  }
  if (method === "POST" && path === "/auth/upload-profile-image") return send(200, { url: "/demo/avatar.png" });

  if (method === "GET") return send(200, []);
  return send(200, { success: true, message: "Demo action simulated." });
};

export const installTrialDemoInterceptor = (client) => {
  if (!client || client.__trialDemoInstalled) return;
  client.__trialDemoInstalled = true;

  client.interceptors.request.use((config) => {
    if (!isTrialUserSession()) return config;

    const { path } = parsePath(config.url);
    const allowWhenUnseeded = path === "/auth/getUser";
    if (!hasSeededTrialDemo() && !allowWhenUnseeded) {
      return Promise.reject({
        response: {
          status: 403,
          data: {
            code: "TRIAL_SAMPLE_DATA_REQUIRED",
            message: "Insert sample demo data from Admin dashboard to continue.",
          },
        },
      });
    }

    config.adapter = () => handleDemoRequest(config);
    return config;
  });
};

installTrialDemoInterceptor(axios);
