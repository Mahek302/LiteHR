// src/services/managerService.js
import api from './api';

export const managerService = {
    // --- Dashboard Stats ---
    getTeamStats: async () => {
        try {
            const parseArray = (payload, keys = []) => {
                if (Array.isArray(payload)) return payload;
                if (payload && Array.isArray(payload.data)) return payload.data;
                for (const key of keys) {
                    if (payload && Array.isArray(payload[key])) return payload[key];
                }
                return [];
            };

            const toISODate = (date) => {
                const d = new Date(date);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            };

            const isPresentStatus = (status) => {
                const s = (status || '').toUpperCase();
                return s === 'PRESENT' || s === 'LATE' || s === 'PRESENT_NO_LOGOUT' || s === 'HALF_DAY';
            };
            const normalizeLeaveType = (type) => {
                const raw = (type || '').toString().trim();
                const code = raw.toUpperCase();

                const leaveTypeMap = {
                    CL: 'Casual Leave',
                    SL: 'Sick Leave',
                    AL: 'Annual Leave',
                    EL: 'Earned Leave',
                    PL: 'Paid Leave',
                    ML: 'Maternity Leave',
                    PLT: 'Paternity Leave',
                    LWP: 'Leave Without Pay',
                    LOP: 'Loss of Pay',
                    WFH: 'Work From Home'
                };

                return leaveTypeMap[code] || raw || 'Other';
            };

            // Fetch core dashboard data in parallel
            const results = await Promise.allSettled([
                api.get('/dashboard/manager'),
                api.get('/admin/employees'),
                api.get('/manager/attendance/today'),
                api.get('/leave/all'),
                api.get('/job-applications'),
                api.get('/worklogs/team')
            ]);

            const dashboard = results[0].status === 'fulfilled' ? (results[0].value.data || {}) : {};
            const employees = results[1].status === 'fulfilled'
                ? parseArray(results[1].value.data, ['employees'])
                : [];
            const attendance = results[2].status === 'fulfilled'
                ? parseArray(results[2].value.data, ['teamAttendance'])
                : [];
            const leaves = results[3].status === 'fulfilled'
                ? parseArray(results[3].value.data, ['leaves'])
                : [];
            const applications = results[4].status === 'fulfilled'
                ? parseArray(results[4].value.data, ['applications'])
                : [];
            const worklogs = results[5].status === 'fulfilled'
                ? parseArray(results[5].value.data, ['worklogs'])
                : [];

            // Log errors if any (for debugging)
            results.forEach((res, idx) => {
                if (res.status === 'rejected') {
                    console.error(`Dashboard API ${idx} failed:`, res.reason);
                }
            });

            // Employee normalization map for cross-linking attendance/worklogs
            const employeeMap = {};
            employees.forEach((e) => {
                const normalized = e?.employee || e || {};
                const id = e?.id || normalized.id;
                if (!id) return;
                employeeMap[id] = {
                    id,
                    fullName: normalized.fullName || e.fullName || 'Unknown',
                    employeeCode: normalized.employeeCode || e.employeeCode || '',
                    department: normalized.department || e.department || 'General',
                };
            });

            // Calculate stats from real data with manager dashboard fallback
            const totalEmployees = dashboard.teamSize || employees.length;
            const todaysAttendance = dashboard.presentToday || attendance.filter(a => isPresentStatus(a.status)).length;
            const departments = new Set(Object.values(employeeMap).map(e => e.department).filter(Boolean)).size;
            const activeJobs = new Set(applications.map(a => a.job?.title || a.position).filter(Boolean)).size;
            const pendingLeaves = dashboard.pendingLeaves || leaves.filter(l => (l.status || '').toUpperCase() === 'PENDING').length;
            const payrollDue = dashboard.totalPayrollDue || 0;

            // Department Performance from REAL data
            const deptMap = {};
            Object.values(employeeMap).forEach(e => {
                const dept = e.department || 'General';
                if (!deptMap[dept]) deptMap[dept] = { count: 0, present: 0 };
                deptMap[dept].count++;
            });

            attendance.forEach(a => {
                const dept = a.department || employeeMap[a.employeeId]?.department || 'General';
                if (deptMap[dept] && isPresentStatus(a.status)) {
                    deptMap[dept].present++;
                }
            });

            const departmentPerf = Object.keys(deptMap).map((name, index) => {
                const data = deptMap[name];
                const attendanceRate = data.count > 0 ? Math.round((data.present / data.count) * 100) : 0;
                const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];
                return {
                    name,
                    attendance: attendanceRate,
                    productivity: 85,
                    color: colors[index % colors.length]
                };
            }).slice(0, 6);

            // Leave Distribution from REAL data
            const leaveTypes = {};
            leaves.forEach(l => {
                const type = normalizeLeaveType(l.leaveType);
                leaveTypes[type] = (leaveTypes[type] || 0) + 1;
            });

            const leaveDist = Object.keys(leaveTypes).map((type, index) => {
                const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
                return {
                    type,
                    count: leaveTypes[type],
                    color: colors[index % colors.length]
                };
            });

            // Today's Attendance List from REAL data
            const todayAtt = attendance.map((record, index) => ({
                id: record.id || index,
                employeeDbId: record.employeeId,
                name: record.fullName || record.employee?.fullName || employeeMap[record.employeeId]?.fullName || 'Unknown',
                status: record.status ? (record.status.charAt(0).toUpperCase() + record.status.slice(1).toLowerCase().replace('_', ' ')) : 'Absent',
                time: record.markIn ? new Date(record.markIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                    (record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'),
                avatar: (record.fullName || record.employee?.fullName || employeeMap[record.employeeId]?.fullName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2),
                employeeId: record.employeeCode || (record.employee?.employeeCode) || employeeMap[record.employeeId]?.employeeCode || `EMP${index}`
            })).slice(0, 5);

            // Get recent worklogs from REAL data
            const recentWorklogsSource = Array.isArray(dashboard.recentWorklogs) && dashboard.recentWorklogs.length > 0
                ? dashboard.recentWorklogs
                : worklogs;
            const recentWorklogs = recentWorklogsSource.slice(0, 5).map(log => ({
                id: log.id,
                date: log.date || log.createdAt,
                description: log.description || '',
                hoursWorked: Number(log.hoursWorked) || 0,
                project: log.project || 'General',
                employeeName: log.employee?.fullName || employeeMap[log.employeeId]?.fullName || log.employeeName || 'Unknown',
                employeeCode: log.employee?.employeeCode || employeeMap[log.employeeId]?.employeeCode || log.employeeCode || 'N/A'
            }));

            // Build last 7 days attendance trend
            const dates = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d;
            });
            const weeklyResults = await Promise.allSettled(
                dates.map((d) => api.get(`/manager/attendance?date=${toISODate(d)}`))
            );
            const weeklyAtt = dates.map((d, idx) => {
                const records = weeklyResults[idx].status === 'fulfilled'
                    ? parseArray(weeklyResults[idx].value.data, ['teamAttendance'])
                    : [];
                const present = records.filter((r) => isPresentStatus(r.status)).length;
                const absent = Math.max(records.length - present, 0);
                return {
                    day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    present,
                    absent,
                    date: toISODate(d),
                };
            });

            return {
                data: {
                    stats: {
                        totalEmployees,
                        todaysAttendance,
                        departments,
                        activeJobs,
                        pendingLeaves,
                        payrollDue
                    },
                    departmentPerf,
                    weeklyAtt,
                    leaveDist,
                    todayAtt,
                    recentWorklogs
                }
            };
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            return {
                data: {
                    stats: {
                        totalEmployees: 0,
                        todaysAttendance: 0,
                        departments: 0,
                        activeJobs: 0,
                        pendingLeaves: 0,
                        payrollDue: 0
                    },
                    departmentPerf: [],
                    weeklyAtt: [],
                    leaveDist: [],
                    todayAtt: [],
                    recentWorklogs: []
                }
            };
        }
    },

    getTeamAttendance: async (date = null) => {
        try {
            const url = date ? `/manager/attendance?date=${date}` : '/manager/attendance';
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching team attendance:', error);
            return { data: [] };
        }
    },

    getTeamMonthlyAttendance: async (month, year) => {
        try {
            const response = await api.get(`/manager/attendance/monthly?month=${month}&year=${year}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching monthly attendance:', error);
            return { data: [] };
        }
    },

    markEmployeeAttendance: async (payload) => {
        try {
            const response = await api.post(`/manager/attendance/mark`, payload);
            return response.data;
        } catch (error) {
            console.error('Error marking attendance:', error);
            throw error;
        }
    },

    getEmployeeAttendance: async (employeeId) => {
        try {
            const response = await api.get(`/attendance/${employeeId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching employee attendance:', error);
            return [];
        }
    },

    sendReminder: async (employeeId) => {
        try {
            const response = await api.post(`/manager/attendance/remind`, { employeeId });
            return response.data;
        } catch (error) {
            console.error('Error sending reminder:', error);
            throw error;
        }
    },

    // --- Employee Management ---
    getEmployees: async () => {
        try {
            const response = await api.get('/admin/employees');
            
            // Handle different response structures
            if (response.data && Array.isArray(response.data)) {
                return response.data;
            } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                return response.data.data;
            } else if (response.data && response.data.employees) {
                return response.data.employees;
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching employees:', error);
            return [];
        }
    },

    getEmployeeById: async (id) => {
        try {
            const response = await api.get(`/admin/employees/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching employee:', error);
            return null;
        }
    },

    // --- Leave Management ---
    getPendingLeaves: async () => {
        try {
            const response = await api.get('/leave/pending');
            return response.data;
        } catch (error) {
            console.error('Error fetching pending leaves:', error);
            return { data: [] };
        }
    },

    getAllLeaves: async () => {
        try {
            const response = await api.get('/leave/all');
            return response.data;
        } catch (error) {
            console.error('Error fetching all leaves:', error);
            return { data: [] };
        }
    },

    getLeaveBalanceByEmployeeId: async (employeeId) => {
        try {
            const response = await api.get(`/leavebalance/${employeeId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching leave balance:', error);
            return [];
        }
    },

    approveLeave: async (id, remarks) => {
        try {
            const response = await api.post(`/leave/${id}/approve`, { remarks });
            return response.data;
        } catch (error) {
            console.error('Error approving leave:', error?.response?.data || error.message);
            throw error;
        }
    },

    rejectLeave: async (id, reason) => {
        try {
            const response = await api.post(`/leave/${id}/reject`, { rejectionReason: reason });
            return response.data;
        } catch (error) {
            console.error('Error rejecting leave:', error?.response?.data || error.message);
            throw error;
        }
    },

    applyLeave: async (leaveData) => {
        try {
            const response = await api.post(`/leave/apply`, leaveData);
            return response.data;
        } catch (error) {
            console.error('Error applying leave:', error);
            throw error;
        }
    },

    // --- Department Management ---
    getDepartments: async () => {
        try {
            const response = await api.get('/departments');
            if (Array.isArray(response.data)) return response.data;
            if (Array.isArray(response.data?.data)) return response.data.data;
            return [];
        } catch (error) {
            console.error('Error fetching departments:', error);
            return [];
        }
    },

    getDepartmentById: async (id) => {
        try {
            const response = await api.get(`/departments/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching department:', error);
            return null;
        }
    },

    createDepartment: async (payload) => {
        try {
            const response = await api.post('/departments', payload);
            return response.data;
        } catch (error) {
            console.error('Error creating department:', error);
            throw error;
        }
    },

    // --- Task Management ---
    createTask: async (taskData) => {
        try {
            const response = await api.post("/tasks", taskData);
            return response.data;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    },

    getTeamTasks: async () => {
        try {
            const response = await api.get("/tasks/team");
            return response.data;
        } catch (error) {
            console.error('Error fetching team tasks:', error);
            return { data: [] };
        }
    },

    // --- Recruitment ---
    getJobApplications: async () => {
        try {
            const response = await api.get('/job-applications');
            return response.data;
        } catch (error) {
            console.error('Error fetching job applications:', error);
            return { data: [] };
        }
    },

    updateApplicationStatus: async (id, status) => {
        try {
            const response = await api.put(`/job-applications/${id}`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating application status:', error);
            throw error;
        }
    },

    // --- Worklogs Management (Updated with task and project fields) ---
    getTeamWorklogs: async (params = {}) => {
        try {
            const response = await api.get('/worklogs/team');
            const worklogsData = response?.data;
            let rawWorklogs = [];
            if (Array.isArray(worklogsData)) {
                rawWorklogs = worklogsData;
            } else if (worklogsData.data && Array.isArray(worklogsData.data)) {
                rawWorklogs = worklogsData.data;
            } else if (worklogsData.worklogs && Array.isArray(worklogsData.worklogs)) {
                rawWorklogs = worklogsData.worklogs;
            }
            // Normalize worklogs using included employee info from /worklogs/team
            const enhancedWorklogs = rawWorklogs.map(worklog => {
                const employee = worklog.employee || {};
                return {
                    id: worklog.id,
                    employeeId: worklog.employeeId || employee.id || null,
                    employeeName: employee.fullName || worklog.employeeName || 'Unknown',
                    employeeCode: employee.employeeCode || worklog.employeeCode || 'N/A',
                    department: employee.department || worklog.department || 'N/A',
                    task: worklog.task || worklog.taskName || 'Work Log',
                    taskName: worklog.taskName || worklog.task || 'Work Log',
                    project: worklog.project || 'General',
                    description: worklog.description || '',
                    hoursWorked: Number(worklog.hoursWorked) || 0,
                    date: worklog.date || worklog.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                    createdAt: worklog.createdAt || new Date().toISOString(),
                    updatedAt: worklog.updatedAt,
                    status: 'Completed'
                };
            });
            // Apply filters
            let filteredWorklogs = [...enhancedWorklogs];
            if (params.employeeId) {
                filteredWorklogs = filteredWorklogs.filter(w => w.employeeId == params.employeeId);
            }
            if (params.employeeName) {
                filteredWorklogs = filteredWorklogs.filter(w =>
                    (w.employeeName || '').toLowerCase().includes(params.employeeName.toLowerCase())
                );
            }
            if (params.project) {
                filteredWorklogs = filteredWorklogs.filter(w => w.project && w.project.toLowerCase().includes(params.project.toLowerCase()));
            }
            if (params.dateFrom) {
                filteredWorklogs = filteredWorklogs.filter(w => w.date >= params.dateFrom);
            }
            if (params.dateTo) {
                filteredWorklogs = filteredWorklogs.filter(w => w.date <= params.dateTo);
            }
            if (params.month) {
                filteredWorklogs = filteredWorklogs.filter(w => {
                    const month = new Date(w.date).getMonth() + 1;
                    return month.toString() === params.month;
                });
            }
            if (params.year) {
                filteredWorklogs = filteredWorklogs.filter(w => {
                    const year = new Date(w.date).getFullYear();
                    return year.toString() === params.year.toString();
                });
            }
            if (params.limit) {
                filteredWorklogs = filteredWorklogs.slice(0, Number(params.limit));
            }
            // Sort by date descending (most recent first)
            filteredWorklogs.sort((a, b) => new Date(b.date) - new Date(a.date));
            return { data: filteredWorklogs };
        } catch (error) {
            console.error('Error in getTeamWorklogs:', error);
            return { data: [] };
        }
    },
    getRecentWorklogs: async (limit = 5) => {
        try {
            const response = await managerService.getTeamWorklogs({ limit });
            return response;
        } catch (error) {
            console.error('Error fetching recent worklogs:', error);
            return { data: [] };
        }
    },

    getEmployeeWorklogs: async (employeeId, params = {}) => {
        try {
            const queryParams = new URLSearchParams(params);
            
            // Try multiple endpoints for employee-specific worklogs
            const possibleEndpoints = [
                `/worklogs/employee/${employeeId}`,
                `/api/worklogs/employee/${employeeId}`,
                `/employee/worklogs/${employeeId}`,
                `/worklogs?employeeId=${employeeId}`
            ];
            
            for (const endpoint of possibleEndpoints) {
                try {
                    const url = `${endpoint}${queryParams.toString() ? '&' + queryParams.toString() : ''}`;
                    const response = await api.get(url);
                    if (response.data) {
                        return response.data;
                    }
                } catch (err) {
                    // Continue to next endpoint
                }
            }
            
            return { data: [] };
        } catch (error) {
            console.error('Error fetching employee worklogs:', error);
            return { data: [] };
        }
    },

    // Discover available endpoints (for debugging)
    discoverEndpoints: async () => {
        const endpoints = {
            get: [
                '/worklogs',
                '/api/worklogs',
                '/employee/worklogs',
                '/worklogs/all',
                '/logs',
                '/timesheets'
            ],
            post: [
                '/worklogs',
                '/api/worklogs',
                '/employee/worklogs',
                '/worklog',
                '/timesheets'
            ]
        };
        
        const results = {
            get: {},
            post: {}
        };
        
        // Test GET endpoints
        for (const endpoint of endpoints.get) {
            try {
                const response = await api.get(endpoint);
                results.get[endpoint] = { 
                    status: 'success', 
                    statusCode: response.status,
                    hasData: !!response.data 
                };
                console.log(`✅ GET ${endpoint} works!`);
            } catch (err) {
                results.get[endpoint] = { 
                    status: 'error', 
                    message: err.message,
                    statusCode: err.response?.status 
                };
                console.log(`❌ GET ${endpoint} failed:`, err.message);
            }
        }
        
        // Test POST endpoints with a minimal payload
        const testPayload = {
            employeeId: 2,
            description: "Test worklog",
            hoursWorked: 1,
            date: new Date().toISOString().split('T')[0]
        };
        
        for (const endpoint of endpoints.post) {
            try {
                const response = await api.post(endpoint, testPayload);
                results.post[endpoint] = { 
                    status: 'success', 
                    statusCode: response.status 
                };
                console.log(`✅ POST ${endpoint} works!`);
            } catch (err) {
                results.post[endpoint] = { 
                    status: 'error', 
                    message: err.message,
                    statusCode: err.response?.status 
                };
                console.log(`❌ POST ${endpoint} failed:`, err.message);
            }
        }
        
        return results;
    },

    // Helper method to create a test worklog
    createTestWorklog: async () => {
        try {
            const testWorklog = {
                employeeId: 2, // Priya Sharma's ID
                task: "Dashboard Development",
                project: "Website Redesign",
                description: "Worked on fixing UI bugs and implementing new features",
                hoursWorked: 4.5,
                date: new Date().toISOString().split('T')[0]
            };
            
            console.log('Attempting to create test worklog:', testWorklog);
            
            // Try multiple possible POST endpoints
            const possiblePostEndpoints = [
                '/worklogs',
                '/api/worklogs',
                '/employee/worklogs',
                '/worklog',
                '/timesheets'
            ];
            
            let lastError = null;
            
            for (const endpoint of possiblePostEndpoints) {
                try {
                    console.log(`Trying POST ${endpoint}...`);
                    const response = await api.post(endpoint, testWorklog);
                    console.log(`✅ Success with endpoint ${endpoint}:`, response.data);
                    
                    // If we have an ID in the response, the worklog was created
                    if (response.data && (response.data.id || response.data.insertId)) {
                        return response.data;
                    }
                } catch (err) {
                    console.log(`❌ POST ${endpoint} failed:`, err.message);
                    lastError = err;
                }
            }
            
            // If we get here, try a different approach - maybe the endpoint expects different field names
            console.log('Trying alternative field names...');
            
            const alternativePayloads = [
                {
                    employeeId: 2,
                    taskName: "Dashboard Development",
                    projectName: "Website Redesign",
                    desc: "Worked on fixing UI bugs",
                    hours: 4.5,
                    workDate: new Date().toISOString().split('T')[0]
                },
                {
                    empId: 2,
                    task_title: "Dashboard Development",
                    project_name: "Website Redesign",
                    work_description: "Worked on fixing UI bugs",
                    hours_worked: 4.5,
                    log_date: new Date().toISOString().split('T')[0]
                }
            ];
            
            for (const payload of alternativePayloads) {
                for (const endpoint of possiblePostEndpoints) {
                    try {
                        console.log(`Trying alternative payload with ${endpoint}...`);
                        const response = await api.post(endpoint, payload);
                        console.log(`✅ Success with alternative payload on ${endpoint}:`, response.data);
                        return response.data;
                    } catch (err) {
                        // Continue
                    }
                }
            }
            
            // If all attempts fail, throw the last error
            throw lastError || new Error('No working POST endpoint found for worklogs');
            
        } catch (error) {
            console.error('Error creating test worklog:', error);
            throw error;
        }
    },

    // Direct SQL worklog creation (if you have a backend endpoint that accepts raw SQL)
    createWorklogViaSQL: async (worklogData) => {
        try {
            // This assumes you have an endpoint that can execute SQL
            const response = await api.post('/admin/query', {
                query: `INSERT INTO worklogs (employeeId, task, project, description, hoursWorked, date, createdAt, updatedAt) 
                        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                params: [
                    worklogData.employeeId,
                    worklogData.task || null,
                    worklogData.project || null,
                    worklogData.description,
                    worklogData.hoursWorked,
                    worklogData.date
                ]
            });
            return response.data;
        } catch (error) {
            console.error('Error creating worklog via SQL:', error);
            throw error;
        }
    }
};
