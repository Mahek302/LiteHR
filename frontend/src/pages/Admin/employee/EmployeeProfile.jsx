import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiMail, FiPhone, FiCalendar, FiMapPin, FiBriefcase, FiUser, FiDownload, FiEdit2, FiClock, FiAward, FiFileText, FiArrowLeft } from "react-icons/fi";
import { HiOutlineOfficeBuilding, HiOutlineUserGroup } from "react-icons/hi";
import { MdWorkOutline } from "react-icons/md";
import { useTheme, useThemeClasses } from "../../../contexts/ThemeContext";

const EmployeeProfile = () => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Helper to robustly decode JWT payload (base64url safe)
  const decodeJwtPayload = (token) => {
    try {
      const base64Url = token.split('.')[1] || '';
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      return JSON.parse(atob(padded));
    } catch (e) {
      return null;
    }
  };

  const darkMode = useTheme() || false;
  const theme = useThemeClasses();

  const [employee, setEmployee] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Load current user / employee profile
  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem('token');
      let employeeId = routeId || localStorage.getItem('employeeId');

      if (!token) {
        console.error('No token found');
        setEmployee({});
        return;
      }

      if (!employeeId && token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          employeeId = payload.employeeId || (payload.user && payload.user.employeeId) || null;
          if (employeeId) localStorage.setItem('employeeId', employeeId);
        } catch (e) {
          console.warn('Failed to decode token for employeeId', e);
        }
      }

      if (!employeeId) {
        setEmployee({
          employeeId: 'N/A',
          name: 'No Employee Profile',
          jobTitle: 'Please contact admin',
          department: 'N/A',
          email: 'N/A',
          phone: 'N/A',
          status: 'Active',
          joinDate: new Date().toISOString(),
          manager: null,
          location: 'N/A',
          shift: 'N/A',
          employmentType: 'N/A',
          dob: '',
          experience: 'N/A',
          reportsTo: 'N/A',
          avatar: 'https://ui-avatars.com/api/?name=No+Profile&background=Gray&color=fff&size=128',
          id: null,
          resumeUrl: null,
        });
        return;
      }

      try {
        console.log('Fetching employee profile', { routeId, tokenPresent: !!token, employeeId });

        const apiBase = import.meta.env.VITE_API_BASE_URL || '';

        if (routeId) {
          const empRes = await fetch(`${apiBase}/api/admin/employees/${employeeId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!empRes.ok) {
            let bodyText;
            try {
              const json = await empRes.json();
              bodyText = JSON.stringify(json);
            } catch (e) {
              bodyText = await empRes.text().catch(() => '<unreadable>');
            }
            console.error('Employee fetch failed:', empRes.status, bodyText);

            if (empRes.status === 401 || empRes.status === 403) {
              setErrorMsg('You do not have permission to view this employee. Please sign in with an ADMIN account to view other employees.');
              return;
            }

            setErrorMsg(`Failed to fetch employee: ${empRes.status} ${bodyText}`);
            return;
          }

          const empData = await empRes.json();
          console.log('Employee data received:', empData);

          const emp = empData.employee || empData.data || empData;
          const userInfo = emp.user || {};

          setEmployee({
            employeeId: emp.employeeCode || `EMP${emp.id}`,
            name: emp.fullName || 'Unknown',
            jobTitle: emp.designation || 'N/A',
            department: emp.department || 'N/A',
            email: userInfo.email || 'N/A',
            phone: emp.phone || 'N/A',
            status: emp.status || 'Active',
            joinDate: emp.dateOfJoining || new Date().toISOString(),
            manager: emp.manager ? emp.manager.fullName : null,
            location: emp.location || 'N/A',
            shift: emp.shift || 'N/A',
            employmentType: emp.employmentType || 'N/A',
            dob: emp.dateOfBirth || '',
            experience: emp.experience || 'N/A',
            reportsTo: emp.manager ? emp.manager.fullName : 'N/A',
            avatar: emp.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.fullName || 'User')}&background=0F172A&color=fff&size=128`,
            id: emp.id,
            resumeUrl: emp.resumeUrl || null,
          });
        } else {
          const meRes = await fetch(`${apiBase}/api/auth/getUser`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!meRes.ok) {
            console.error('Failed to fetch current user:', meRes.status);
            throw new Error('Failed to fetch current user');
          }

          const meData = await meRes.json();
          const empObj = meData.employee;

          if (!empObj) {
            setEmployee({
              employeeId: 'N/A',
              name: 'No Employee Profile',
              jobTitle: 'Please contact admin',
              department: 'N/A',
              email: meData.email || 'N/A',
              phone: 'N/A',
              status: 'Active',
              joinDate: new Date().toISOString(),
              manager: null,
              location: 'N/A',
              shift: 'N/A',
              employmentType: 'N/A',
              dob: '',
              experience: 'N/A',
              reportsTo: 'N/A',
              avatar: meData.employee?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(meData.username || 'User')}&background=0F172A&color=fff&size=128`,
              id: null,
              resumeUrl: null,
            });
            return;
          }

          setEmployee({
            employeeId: empObj.employeeCode || `EMP${empObj.id}`,
            name: empObj.fullName || 'Unknown',
            jobTitle: empObj.designation || 'N/A',
            department: empObj.department || 'N/A',
            email: meData.email || 'N/A',
            phone: empObj.phone || 'N/A',
            status: empObj.status || 'Active',
            joinDate: empObj.dateOfJoining || new Date().toISOString(),
            manager: empObj.manager ? empObj.manager.fullName : null,
            location: empObj.location || 'N/A',
            shift: empObj.shift || 'N/A',
            employmentType: empObj.employmentType || 'N/A',
            dob: empObj.dateOfBirth || '',
            experience: empObj.experience || 'N/A',
            reportsTo: empObj.manager ? empObj.manager.fullName : 'N/A',
            avatar: empObj.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(empObj.fullName || 'User')}&background=0F172A&color=fff&size=128`,
            id: empObj.id,
            resumeUrl: empObj.resumeUrl || null,
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setEmployee({
          employeeId: 'ERROR',
          name: 'Error Loading Profile',
          jobTitle: err.message,
          department: 'N/A',
          email: 'N/A',
          phone: 'N/A',
          status: 'Active',
          joinDate: new Date().toISOString(),
          manager: null,
          location: 'N/A',
          shift: 'N/A',
          employmentType: 'N/A',
          dob: '',
          experience: 'N/A',
          reportsTo: 'N/A',
          avatar: 'https://ui-avatars.com/api/?name=Error&background=DC2626&color=fff&size=128',
          id: null,
          resumeUrl: null,
        });
      }
    };

    loadProfile();
  }, [routeId]);

  // Fetch leave balances and attendance stats
  useEffect(() => {
    const fetchStatsData = async () => {
      if (!employee?.id) return;

      setStatsLoading(true);
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';

      const isViewingSelf = !routeId;
      const leaveUrl = routeId
        ? `${apiBase}/api/leaveBalance/${employee.id}`
        : `${apiBase}/api/leaveBalance/my`;

      const attendanceUrl = routeId
        ? `${apiBase}/api/attendance/${employee.id}`
        : `${apiBase}/api/attendance/getAttendance`;

      try {
        const leaveRes = await fetch(leaveUrl, { headers: { Authorization: `Bearer ${token}` } });
        console.log('Leave balance response status:', leaveRes);
        if (leaveRes.ok) {
          const leaveData = await leaveRes.json();
          if (Array.isArray(leaveData)) {
            const balances = {};
            leaveData.forEach((lb) => {
              const leaveType = (typeof lb.leaveType === 'string'
                ? lb.leaveType
                : lb.leaveType?.name || 'unknown').toLowerCase();
              balances[leaveType] = {
                total: lb.total || 0,
                used: lb.used || 0,
                remaining: lb.remaining || 0,
              };
            });
            setLeaveBalances(balances);
          }
        } else {
          console.warn('Failed to fetch leave balances:', leaveRes.status);
          setLeaveBalances(null);
        }
      } catch (err) {
        console.error('Error fetching leave balances:', err);
        setLeaveBalances(null);
      }

      try {
        const attendanceRes = await fetch(attendanceUrl, { headers: { Authorization: `Bearer ${token}` } });
        console.log('Attendance stats response status:', attendanceRes);
        if (attendanceRes.ok) {
          const attendanceDataList = await attendanceRes.json();

          if (Array.isArray(attendanceDataList)) {
            let presentCount = 0;
            let absentCount = 0;
            let lateCount = 0;
            let earlyExitCount = 0;
            let overtimeHours = 0;

            attendanceDataList.forEach((record) => {
              const status = record.status?.toLowerCase();
              if (status === 'present') presentCount++;
              else if (status === 'absent') absentCount++;

              if (record.isLate) lateCount++;
              if (record.earlyExit) earlyExitCount++;

              if (record.overtimeHours) {
                overtimeHours += parseFloat(record.overtimeHours);
              }
            });

            setAttendanceStats({
              present: presentCount,
              absent: absentCount,
              late: lateCount,
              earlyExit: earlyExitCount,
              overtime: Math.round(overtimeHours * 10) / 10,
            });
          } else {
            setAttendanceStats(null);
          }
        } else {
          console.warn('Failed to fetch attendance stats:', attendanceRes.status);
          setAttendanceStats(null);
        }
      } catch (err) {
        console.error('Error fetching attendance stats:', err);
        setAttendanceStats(null);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStatsData();
  }, [employee?.id, routeId]);

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!employee?.id || activeTab !== 'documents') return;

      setDocumentsLoading(true);
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';

      const docUrl = routeId
        ? `${apiBase}/api/documents/employee/${employee.id}`
        : `${apiBase}/api/documents/my`;

      try {
        const res = await fetch(docUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
        } else {
          console.warn("Failed to fetch documents", res.status);
        }
      } catch (err) {
        console.error("Error fetching documents", err);
      } finally {
        setDocumentsLoading(false);
      }
    };
    fetchDocuments();
  }, [activeTab, employee?.id, routeId]);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "attendance", label: "Attendance" },
    { id: "leaves", label: "Leaves" },
    { id: "documents", label: "Documents" },
  ];

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const handleProfileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('profile', file);

    const token = localStorage.getItem('token');
    if (!token) return alert('You must be logged in to upload');

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/employees/${employee.id}/upload-profile`, {
        method: 'POST',
        body: fd,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEmployee((prev) => ({ ...prev, avatar: data.profileImage }));
        // Update preview if needed, though react state should handle it
        alert('Profile uploaded successfully!');
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('resume', file);

    const token = localStorage.getItem('token');
    if (!token) return alert('You must be logged in to upload');

    try {
      // Show loading state if desired
      const res = await fetch(`${API_BASE_URL}/api/admin/employees/${employee.id}/upload-resume`, {
        method: 'POST',
        body: fd,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEmployee((prev) => ({ ...prev, resumeUrl: data.resumeUrl }));
        alert('Resume uploaded successfully!');
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
    // Reset input
    e.target.value = '';
  };



  if (!employee) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6 ${darkMode ? "dark" : ""}`}>
      {routeId && (
        <button
          onClick={() => navigate("/admin/employees")}
          className="mb-4 p-2 rounded-lg border border-purple-500/50 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          aria-label="Back"
          title="Back"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
      )}
      {errorMsg && (
        <div className="mb-4 p-3 rounded bg-rose-100 text-rose-800 border border-rose-200">
          <strong className="mr-2">⚠️ Error:</strong> {errorMsg}
        </div>
      )}

      {/* Profile Header */}
      <div
        className={`${theme.cardBg} rounded-2xl shadow-sm p-6 mb-6 border ${
          darkMode
            ? "border-purple-500/20 bg-slate-900"
            : "border-purple-200/60 bg-gradient-to-br from-purple-50/70 via-white to-blue-50/70"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img
                id="profile-preview"
                src={employee.avatar}
                alt={employee.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800"
              />
              <label
                htmlFor="profile-upload"
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg"
              >
                <FiEdit2 className="w-4 h-4" />
              </label>
              <input
                type="file"
                id="profile-upload"
                accept="image/*"
                className="hidden"
                onChange={handleProfileUpload}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{employee.name}</h1>
              <p className={`${theme.subtext} mb-2`}>{employee.jobTitle}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className={`flex items-center text-sm px-3 py-1 rounded-full ${darkMode ? "bg-blue-500/20 text-blue-200" : "bg-blue-50 text-blue-700"}`}>
                  <HiOutlineOfficeBuilding className="mr-1" />
                  {employee.department}
                </span>
                <span className={`flex items-center text-sm px-3 py-1 rounded-full ${darkMode ? "bg-emerald-500/20 text-emerald-200" : "bg-green-50 text-green-700"}`}>
                  <FiMapPin className="mr-1" />
                  {employee.location}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs ${employee.status === 'Active'
                  ? (darkMode ? "bg-emerald-500/20 text-emerald-200" : "bg-green-100 text-green-800")
                  : (darkMode ? "bg-slate-700 text-slate-200" : "bg-gray-100 text-gray-800")
                  }`}>
                  {employee.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => document.getElementById('profile-upload').click()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Upload Profile
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div
          className={`p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow ${
            darkMode
              ? "bg-slate-900 border-blue-500/25"
              : "bg-blue-50/70 border-blue-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={theme.subtext}>Employee ID</p>
              <p className={`text-xl font-semibold ${theme.text.primary}`}>{employee.employeeId}</p>
            </div>
            <div className={`p-2 rounded-full ${darkMode ? "bg-blue-500/20" : "bg-blue-100"}`}>
              <FiUser className={`text-xl ${darkMode ? "text-blue-200" : "text-blue-600"}`} />
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow ${
            darkMode
              ? "bg-slate-900 border-emerald-500/25"
              : "bg-emerald-50/70 border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={theme.subtext}>Join Date</p>
              <p className={`text-xl font-semibold ${theme.text.primary}`}>
                {new Date(employee.joinDate).toLocaleDateString()}
              </p>
            </div>
            <div className={`p-2 rounded-full ${darkMode ? "bg-emerald-500/20" : "bg-green-100"}`}>
              <FiCalendar className={`text-xl ${darkMode ? "text-emerald-200" : "text-green-600"}`} />
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow ${
            darkMode
              ? "bg-slate-900 border-purple-500/25"
              : "bg-purple-50/70 border-purple-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={theme.subtext}>Employment Type</p>
              <p className={`text-xl font-semibold ${theme.text.primary}`}>{employee.employmentType}</p>
            </div>
            <div className={`p-2 rounded-full ${darkMode ? "bg-purple-500/20" : "bg-purple-100"}`}>
              <FiBriefcase className={`text-xl ${darkMode ? "text-purple-200" : "text-purple-600"}`} />
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow ${
            darkMode
              ? "bg-slate-900 border-amber-500/25"
              : "bg-amber-50/70 border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={theme.subtext}>Reports To</p>
              <p className={`text-xl font-semibold ${theme.text.primary}`}>{employee.reportsTo || 'N/A'}</p>
            </div>
            <div className={`p-2 rounded-full ${darkMode ? "bg-amber-500/20" : "bg-orange-100"}`}>
              <HiOutlineUserGroup className={`text-xl ${darkMode ? "text-amber-200" : "text-orange-600"}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`${theme.cardBg} rounded-2xl shadow-sm border ${darkMode ? "border-purple-500/20" : "border-purple-200/40"}`}>
        <div className={`border-b ${darkMode ? "border-purple-500/20" : "border-purple-200/60"}`}>
          <div className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? (darkMode ? "border-purple-400 text-purple-200" : "border-purple-600 text-purple-600")
                  : (darkMode ? "border-transparent hover:border-purple-500 text-slate-300" : "border-transparent hover:border-purple-300 text-slate-500")
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Contact Information Box */}
              <div className={`${theme.cardBg} rounded-xl shadow-sm p-6 border ${darkMode ? "border-blue-500/25 bg-slate-900" : "border-blue-200 bg-gradient-to-br from-blue-50/70 to-white"}`}>
                <div className="flex items-center mb-6">
                  <div className={`p-2 rounded-full mr-3 ${darkMode ? "bg-blue-500/20" : "bg-blue-100"}`}>
                    <FiMail className={`text-xl ${darkMode ? "text-blue-200" : "text-blue-600"}`} />
                  </div>
                  <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Contact Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`flex items-center space-x-4 p-4 rounded-lg border ${darkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-100"}`}>
                    <div className={`p-2 rounded-full ${darkMode ? "bg-blue-500/20" : "bg-blue-100"}`}>
                      <FiMail className={darkMode ? "text-blue-200" : "text-gray-600"} />
                    </div>
                    <div>
                      <p className={theme.subtext}>Email Address</p>
                      <p className={`font-medium ${theme.text.primary}`}>{employee.email}</p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-4 p-4 rounded-lg border ${darkMode ? "bg-cyan-500/10 border-cyan-500/20" : "bg-cyan-50 border-cyan-100"}`}>
                    <div className={`p-2 rounded-full ${darkMode ? "bg-cyan-500/20" : "bg-cyan-100"}`}>
                      <FiPhone className={darkMode ? "text-cyan-200" : "text-gray-600"} />
                    </div>
                    <div>
                      <p className={theme.subtext}>Phone Number</p>
                      <p className={`font-medium ${theme.text.primary}`}>{employee.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Information Box */}
              <div className={`${theme.cardBg} rounded-xl shadow-sm p-6 border ${darkMode ? "border-emerald-500/25 bg-slate-900" : "border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white"}`}>
                <div className="flex items-center mb-6">
                  <div className={`p-2 rounded-full mr-3 ${darkMode ? "bg-emerald-500/20" : "bg-green-100"}`}>
                    <MdWorkOutline className={`text-xl ${darkMode ? "text-emerald-200" : "text-green-600"}`} />
                  </div>
                  <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Work Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg border ${darkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"}`}>
                    <p className={theme.subtext}>Shift</p>
                    <p className={`font-medium text-lg flex items-center mt-1 ${theme.text.primary}`}>
                      <FiClock className={`mr-2 ${darkMode ? "text-emerald-200" : "text-gray-500"}`} />
                      {employee.shift}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg border ${darkMode ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-100"}`}>
                    <p className={theme.subtext}>Experience</p>
                    <p className={`font-medium text-lg flex items-center mt-1 ${theme.text.primary}`}>
                      <FiAward className={`mr-2 ${darkMode ? "text-amber-200" : "text-gray-500"}`} />
                      {employee.experience}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg border ${darkMode ? "bg-violet-500/10 border-violet-500/20" : "bg-violet-50 border-violet-100"}`}>
                    <p className={theme.subtext}>Manager</p>
                    <p className={`font-medium text-lg ${theme.text.primary}`}>{employee.manager || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Documents Box */}
              <div
                className={`${theme.cardBg} rounded-xl shadow-sm p-6 border ${
                  darkMode
                    ? "border-purple-500/25 bg-slate-900"
                    : "border-purple-200 bg-gradient-to-br from-purple-50/70 to-white"
                }`}
              >
                <div className="flex items-center mb-6">
                  <div className={`p-2 rounded-full mr-3 ${darkMode ? "bg-purple-500/20" : "bg-purple-100"}`}>
                    <FiFileText className={`text-xl ${darkMode ? "text-purple-200" : "text-purple-600"}`} />
                  </div>
                  <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Documents</h3>
                </div>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${darkMode ? "bg-purple-500/10 border-purple-500/20" : "bg-purple-50 border-purple-200"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${darkMode ? "bg-blue-500/20" : "bg-blue-100"}`}>
                          <FiFileText className={darkMode ? "text-blue-200" : "text-blue-600"} />
                        </div>
                        <div>
                          <p className={`font-medium ${theme.text.primary}`}>Resume / CV</p>
                          <p className={`text-sm ${theme.subtext}`}>Upload your professional resume</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col space-y-2">
                          <input
                            type="file"
                            id="resume-upload"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={handleResumeUpload}
                          />
                          <button
                            onClick={() => document.getElementById('resume-upload').click()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors shadow-sm"
                          >
                            {employee.resumeUrl ? "Update Resume" : "Upload Resume"}
                          </button>
                        </div>
                        {employee.resumeUrl && (
                          <a
                            href={employee.resumeUrl.startsWith('http') ? employee.resumeUrl : `${API_BASE_URL}${employee.resumeUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-green-600 hover:text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded bg-green-50 dark:bg-green-900/20"
                          >
                            <FiDownload />
                            <span className="text-sm font-medium">Download</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <p id="resume-status" className={`text-sm mt-2 ${theme.subtext}`}>
                      {/* Status updated via alert now, but keeping container for spacing if needed */}
                      {employee.resumeUrl ? "Resume available" : "No resume uploaded"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div>
              <h3 className="text-lg font-semibold mb-6">Attendance Statistics</h3>
              {statsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3">Loading attendance data...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: 'Present', value: attendanceStats?.present || 0, color: 'green', icon: '✓' },
                    { label: 'Absent', value: attendanceStats?.absent || 0, color: 'red', icon: '✗' },
                    { label: 'Late', value: attendanceStats?.late || 0, color: 'yellow', icon: '⌚' },
                    { label: 'Early Exit', value: attendanceStats?.earlyExit || 0, color: 'orange', icon: '↩' },
                    { label: 'Overtime', value: attendanceStats?.overtime || 0, color: 'blue', icon: '⏱' },
                  ].map((stat) => (
                    <div key={stat.label} className={`${theme.cardBg} p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition-shadow`}>
                      <div className={`text-3xl font-bold mb-2 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                        {stat.value}
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-2xl">{stat.icon}</span>
                        <p className={theme.subtext}>{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "leaves" && (
            <div>
              <h3 className="text-lg font-semibold mb-6">Leave Balance</h3>
              {statsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3">Loading leave data...</span>
                </div>
              ) : leaveBalances ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(leaveBalances).map(([type, balance]) => (
                    <div key={type} className={`${theme.cardBg} p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow`}>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold capitalize text-lg">{type} Leave</h4>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {balance.remaining} / {balance.total}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Used</span>
                          <span>{balance.used} days</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${balance.total > 0 ? (balance.remaining / balance.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Remaining</span>
                          <span className="font-semibold">{balance.remaining} days</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className={theme.subtext}>No leave data available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div>
              <h3 className="text-lg font-semibold mb-6">Documents & Certificates</h3>
              {documentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3">Loading documents...</span>
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className={`${theme.cardBg} p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                            <FiBriefcase className="text-blue-600 dark:text-blue-400 w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold">{doc.name}</p>
                            <p className={`text-sm ${theme.subtext}`}>{doc.category || 'General'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${theme.subtext}`}>
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors"
                          >
                            <FiDownload className="w-4 h-4" />
                            <span className="text-sm font-medium">Download</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className={theme.subtext}>No documents found for this employee.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
