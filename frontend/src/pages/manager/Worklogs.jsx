// src/pages/manager/Worklogs.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FileText,
  Filter,
  Calendar,
  Clock,
  User,
  Briefcase,
  Eye,
  AlertCircle,
  RefreshCw,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Loader,
  TrendingUp,
  Database,
  Search
} from 'lucide-react';
import { managerService } from '../../services/managerService';

const Worklogs = () => {
  const { isDarkMode = true } = useOutletContext() || {};

  // Theme colors
  const themeColors = isDarkMode ? {
    primary: '#8b5cf6',
    secondary: '#10b981',
    accent: '#3b82f6',
    warning: '#f59e0b',
    danger: '#ef4444',
    background: '#0f172a',
    card: '#1e293b',
    text: '#f9fafb',
    muted: '#9ca3af',
    border: '#374151',
    success: '#10b981',
    info: '#3b82f6',
  } : {
    primary: '#2563eb',
    secondary: '#10b981',
    accent: '#8b5cf6',
    warning: '#f59e0b',
    danger: '#ef4444',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    muted: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    info: '#3b82f6',
  };

  // State
  const [worklogs, setWorklogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    employeeId: '',
    employeeName: '',
    project: '',
    dateFrom: '',
    dateTo: '',
    month: '',
    year: '',
  });
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalHours: 0,
    avgHoursPerDay: 0,
    totalWorklogs: 0,
    activeEmployees: 0
  });
  const [selectedWorklog, setSelectedWorklog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [showDebug, setShowDebug] = useState(false);
  const [discoverResults, setDiscoverResults] = useState(null);
  const [discovering, setDiscovering] = useState(false);

  // Fetch employees for filter
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await managerService.getEmployees();
        console.log('Employees for filter:', response);
        
        // Handle different response structures
        let employeesData = [];
        if (Array.isArray(response)) {
          employeesData = response;
        } else if (response.data && Array.isArray(response.data)) {
          employeesData = response.data;
        } else if (response.employees && Array.isArray(response.employees)) {
          employeesData = response.employees;
        }
        
        // Format employees for dropdown
        const formattedEmployees = employeesData
          .map(emp => ({
            id: emp.id,
            fullName: (emp.employee?.fullName || emp.fullName || '').trim(),
            employeeCode: emp.employee?.employeeCode || emp.employeeCode || 'N/A'
          }))
          .filter((emp) => {
            if (!emp.id) return false;
            const normalizedName = emp.fullName.toLowerCase();
            return Boolean(emp.fullName) && normalizedName !== 'unknown';
          });
        
        console.log('Formatted employees for dropdown:', formattedEmployees);
        setEmployees(formattedEmployees);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
        setEmployees([]);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch worklogs
  const fetchWorklogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build params object with only non-empty values
      const params = {};
      if (filters.employeeId) params.employeeId = filters.employeeId;
      if (filters.project) params.project = filters.project;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      
      console.log('Fetching worklogs with params:', params);
      
      const response = await managerService.getTeamWorklogs(params);
      
      // Handle response
      let data = [];
      if (response && response.data) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      }
      
      console.log('Fetched worklogs:', data);
      
      setWorklogs(data);
      
      // Extract unique projects from actual data
      const uniqueProjects = [...new Set(data.map(w => w.project).filter(Boolean))];
      setProjects(uniqueProjects);
      
      // Calculate stats from actual data
      const totalHours = data.reduce((sum, w) => sum + (parseFloat(w.hoursWorked) || 0), 0);
      const uniqueEmployees = new Set(data.map(w => w.employeeId)).size;
      const uniqueDates = new Set(data.map(w => w.date)).size;
      
      setStats({
        totalHours: totalHours.toFixed(1),
        avgHoursPerDay: uniqueDates > 0 ? (totalHours / uniqueDates).toFixed(1) : 0,
        totalWorklogs: data.length,
        activeEmployees: uniqueEmployees
      });
      
    } catch (err) {
      console.error("Failed to fetch worklogs:", err);
      setError(err.message || "Failed to load worklogs");
      setWorklogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklogs();
  }, [filters.employeeId, filters.project, filters.dateFrom, filters.dateTo, filters.month, filters.year]);

  // Discover endpoints
  const discoverEndpoints = async () => {
    try {
      setDiscovering(true);
      const results = await managerService.discoverEndpoints();
      setDiscoverResults(results);
      console.log('Endpoint discovery results:', results);
      alert('Check console for endpoint discovery results (F12)');
    } catch (err) {
      alert('Discovery failed: ' + err.message);
    } finally {
      setDiscovering(false);
    }
  };

  // Create test worklog
  const createTestWorklog = async () => {
    try {
      setLoading(true);
      await managerService.createTestWorklog();
      alert('Test worklog created successfully!');
      fetchWorklogs(); // Refresh the list
    } catch (err) {
      console.error('Failed to create test worklog:', err);
      alert('Failed to create test worklog: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manual SQL insert (if you have access)
  const manualSQLInsert = () => {
    const sql = `INSERT INTO worklogs (employeeId, task, project, description, hoursWorked, date, createdAt, updatedAt) 
                 VALUES (2, 'Dashboard Development', 'Website Redesign', 'Worked on fixing UI bugs', 4.5, CURDATE(), NOW(), NOW());`;
    
    navigator.clipboard.writeText(sql);
    alert('SQL copied to clipboard! Run this in your database.');
  };

  // Sorting
  const sortedWorklogs = [...worklogs].sort((a, b) => {
    if (sortConfig.key === 'date') {
      const dateA = new Date(a.date || a.createdAt);
      const dateB = new Date(b.date || b.createdAt);
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    }
    if (sortConfig.key === 'hoursWorked') {
      return sortConfig.direction === 'asc' 
        ? (a.hoursWorked || 0) - (b.hoursWorked || 0)
        : (b.hoursWorked || 0) - (a.hoursWorked || 0);
    }
    if (sortConfig.key === 'employeeName') {
      const nameA = (a.employeeName || '').toLowerCase();
      const nameB = (b.employeeName || '').toLowerCase();
      if (nameA < nameB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (nameA > nameB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentWorklogs = sortedWorklogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedWorklogs.length / itemsPerPage);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      employeeId: '',
      employeeName: '',
      project: '',
      dateFrom: '',
      dateTo: '',
      month: '',
      year: '',
    });
    setCurrentPage(1);
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
    } catch {
      return dateString;
    }
  };

  // Analytics View
  const AnalyticsView = () => {
    if (worklogs.length === 0) {
      return (
        <div className="text-center py-12" style={{ color: themeColors.muted }}>
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No data available for analytics</p>
          <p className="text-sm mt-2">Submit worklogs from employee portal to see analytics</p>
        </div>
      );
    }

    // Group by employee
    const employeeStats = worklogs.reduce((acc, w) => {
      const empId = w.employeeId;
      const empName = w.employeeName || 'Unknown';
      
      if (!acc[empId]) {
        acc[empId] = {
          name: empName,
          totalHours: 0,
          worklogs: 0,
          projects: new Set()
        };
      }
      
      acc[empId].totalHours += parseFloat(w.hoursWorked) || 0;
      acc[empId].worklogs += 1;
      if (w.project) acc[empId].projects.add(w.project);
      
      return acc;
    }, {});

    // Group by project
    const projectStats = worklogs.reduce((acc, w) => {
      const project = w.project || 'Unassigned';
      
      if (!acc[project]) {
        acc[project] = {
          totalHours: 0,
          worklogs: 0,
          employees: new Set()
        };
      }
      
      acc[project].totalHours += parseFloat(w.hoursWorked) || 0;
      acc[project].worklogs += 1;
      if (w.employeeId) {
        acc[project].employees.add(w.employeeId);
      }
      
      return acc;
    }, {});

    const employeeArray = Object.entries(employeeStats).map(([id, data]) => ({
      id,
      ...data,
      projects: data.projects.size,
      avgHours: data.worklogs > 0 ? (data.totalHours / data.worklogs).toFixed(1) : 0
    })).sort((a, b) => b.totalHours - a.totalHours);

    const projectArray = Object.entries(projectStats).map(([name, data]) => ({
      name,
      ...data,
      employees: data.employees.size,
      avgHours: data.worklogs > 0 ? (data.totalHours / data.worklogs).toFixed(1) : 0
    })).sort((a, b) => b.totalHours - a.totalHours);

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: `${themeColors.primary}10`, border: `1px solid ${themeColors.border}` }}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: themeColors.primary }}>
                <Users size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: themeColors.muted }}>Active Employees</p>
                <p className="text-xl font-bold" style={{ color: themeColors.text }}>{stats.activeEmployees}</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: `${themeColors.secondary}10`, border: `1px solid ${themeColors.border}` }}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: themeColors.secondary }}>
                <Clock size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: themeColors.muted }}>Total Hours</p>
                <p className="text-xl font-bold" style={{ color: themeColors.text }}>{stats.totalHours}h</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: `${themeColors.accent}10`, border: `1px solid ${themeColors.border}` }}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: themeColors.accent }}>
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: themeColors.muted }}>Total Worklogs</p>
                <p className="text-xl font-bold" style={{ color: themeColors.text }}>{stats.totalWorklogs}</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: `${themeColors.warning}10`, border: `1px solid ${themeColors.border}` }}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: themeColors.warning }}>
                <TrendingUp size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: themeColors.muted }}>Avg Hours/Day</p>
                <p className="text-xl font-bold" style={{ color: themeColors.text }}>{stats.avgHoursPerDay}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Performance */}
        <div className="rounded-lg border p-4" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>Employee Performance</h3>
          <div className="space-y-4">
            {employeeArray.slice(0, 5).map((emp, idx) => (
              <div key={emp.id || idx} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium" style={{ color: themeColors.text }}>{emp.name}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm" style={{ color: themeColors.muted }}>{emp.worklogs} logs</span>
                    <span className="text-sm font-bold" style={{ color: themeColors.primary }}>{emp.totalHours.toFixed(1)}h</span>
                  </div>
                </div>
                <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: themeColors.border }}>
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all"
                    style={{
                      width: `${(emp.totalHours / (employeeArray[0]?.totalHours || 1)) * 100}%`,
                      backgroundColor: themeColors.primary
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs" style={{ color: themeColors.muted }}>
                  <span>Projects: {emp.projects}</span>
                  <span>Avg: {emp.avgHours}h/log</span>
                </div>
              </div>
            ))}
            {employeeArray.length === 0 && (
              <p className="text-center py-4" style={{ color: themeColors.muted }}>No employee data available</p>
            )}
          </div>
        </div>

        {/* Project Distribution */}
        <div className="rounded-lg border p-4" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>Project Hours Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectArray.slice(0, 6).map((project, idx) => (
              <div key={project.name} className="p-3 rounded-lg" style={{ backgroundColor: `${themeColors.primary}05` }}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm" style={{ color: themeColors.text }}>{project.name}</span>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: themeColors.primary, color: 'white' }}>
                    {project.totalHours.toFixed(1)}h
                  </span>
                </div>
                <div className="flex justify-between text-xs" style={{ color: themeColors.muted }}>
                  <span>{project.worklogs} worklogs</span>
                  <span>{project.employees} employees</span>
                </div>
                <div className="mt-2 relative h-1 rounded-full overflow-hidden" style={{ backgroundColor: themeColors.border }}>
                  <div
                    className="absolute top-0 left-0 h-full rounded-full"
                    style={{
                      width: `${(project.totalHours / (projectArray[0]?.totalHours || 1)) * 100}%`,
                      backgroundColor: themeColors.secondary
                    }}
                  />
                </div>
              </div>
            ))}
            {projectArray.length === 0 && (
              <p className="text-center py-4 col-span-2" style={{ color: themeColors.muted }}>No project data available</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 min-h-screen transition-colors duration-300" style={{ backgroundColor: themeColors.background }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold transition-colors duration-300" style={{ color: themeColors.text }}>Team Worklogs</h1>
            <p className="text-sm transition-colors duration-300 mt-1" style={{ color: themeColors.muted }}>
              View worklogs submitted by employees
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            {/* Debug Toggle */}
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="p-2 rounded-lg transition-all hover:scale-105"
              style={{ backgroundColor: `${themeColors.warning}20`, color: themeColors.warning }}
              title="Toggle Debug Info"
            >
              <Database size={20} />
            </button>

            {/* Discover Endpoints Button */}
            <button
              onClick={discoverEndpoints}
              disabled={discovering}
              className="p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
              style={{ backgroundColor: `${themeColors.info}20`, color: themeColors.info }}
              title="Discover API Endpoints"
            >
              <Search size={20} />
            </button>

            {/* Test Worklog Button */}
            <button
              onClick={createTestWorklog}
              disabled={loading}
              className="p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
              style={{ backgroundColor: `${themeColors.success}20`, color: themeColors.success }}
              title="Create Test Worklog"
            >
              + Test
            </button>

            {/* SQL Helper Button */}
            <button
              onClick={manualSQLInsert}
              className="p-2 rounded-lg transition-all hover:scale-105"
              style={{ backgroundColor: `${themeColors.accent}20`, color: themeColors.accent }}
              title="Copy SQL Insert"
            >
              SQL
            </button>

            {/* View Toggle - Only show if there's data */}
            {worklogs.length > 0 && (
              <div className="flex rounded-lg border p-1" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-purple-500 text-white' : ''}`}
                  style={viewMode !== 'table' ? { color: themeColors.muted } : {}}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${viewMode === 'analytics' ? 'bg-purple-500 text-white' : ''}`}
                  style={viewMode !== 'analytics' ? { color: themeColors.muted } : {}}
                >
                  Analytics
                </button>
              </div>
            )}

            <button
              onClick={fetchWorklogs}
              className="p-2 rounded-lg transition-all hover:scale-105"
              style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}
              title="Refresh"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {showDebug && (
        <div className="mb-4 p-4 rounded-lg border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold" style={{ color: themeColors.text }}>Debug Info:</h4>
            <button onClick={() => setShowDebug(false)} className="text-xs" style={{ color: themeColors.muted }}>Hide</button>
          </div>
          
          {/* Discovery Results */}
          {discoverResults && (
            <div className="mb-4">
              <h5 className="text-xs font-semibold mb-2" style={{ color: themeColors.text }}>Endpoint Discovery Results:</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: themeColors.success }}>GET Endpoints:</p>
                  <pre className="text-xs overflow-auto max-h-40 p-2 rounded" style={{ backgroundColor: themeColors.background, color: themeColors.muted }}>
                    {JSON.stringify(discoverResults.get, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: themeColors.warning }}>POST Endpoints:</p>
                  <pre className="text-xs overflow-auto max-h-40 p-2 rounded" style={{ backgroundColor: themeColors.background, color: themeColors.muted }}>
                    {JSON.stringify(discoverResults.post, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Current Data */}
          <div>
            <h5 className="text-xs font-semibold mb-2" style={{ color: themeColors.text }}>Current Data:</h5>
            <pre className="text-xs overflow-auto max-h-40 p-2 rounded" style={{ backgroundColor: themeColors.background, color: themeColors.muted }}>
              {JSON.stringify({
                employeesCount: employees.length,
                employees: employees.map(e => ({ id: e.id, name: e.fullName })),
                worklogsCount: worklogs.length,
                filters: filters,
                projects: projects
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
        <div className="flex items-center space-x-2 mb-4">
          <Filter size={18} style={{ color: themeColors.muted }} />
          <h3 className="font-medium" style={{ color: themeColors.text }}>Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Employee Filter */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: themeColors.muted }}>Employee</label>
            <select
              value={filters.employeeId}
              onChange={(e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                setFilters({ 
                  ...filters, 
                  employeeId: e.target.value, 
                  employeeName: selectedOption?.text || '' 
                });
              }}
              className="w-full p-2 rounded border text-sm"
              style={{
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
                color: themeColors.text
              }}
            >
              <option value="">All Employees</option>
              {employees.length > 0 ? (
                employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} {emp.employeeCode !== 'N/A' ? `(${emp.employeeCode})` : ''}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading employees...</option>
              )}
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: themeColors.muted }}>Project</label>
            <select
              value={filters.project}
              onChange={(e) => setFilters({ ...filters, project: e.target.value })}
              className="w-full p-2 rounded border text-sm"
              style={{
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
                color: themeColors.text
              }}
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: themeColors.muted }}>From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full p-2 rounded border text-sm"
              style={{
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
                color: themeColors.text
              }}
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: themeColors.muted }}>To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full p-2 rounded border text-sm"
              style={{
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
                color: themeColors.text
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Month Filter */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: themeColors.muted }}>Month</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-full p-2 rounded border text-sm"
              style={{
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
                color: themeColors.text
              }}
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: themeColors.muted }}>Year</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full p-2 rounded border text-sm"
              style={{
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
                color: themeColors.text
              }}
            >
              <option value="">All Years</option>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded text-sm font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: `${themeColors.danger}20`,
                color: themeColors.danger,
                border: `1px solid ${themeColors.danger}40`
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary - Only show if there's data */}
      {viewMode === 'table' && worklogs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
            <p className="text-sm" style={{ color: themeColors.muted }}>Total Hours</p>
            <p className="text-2xl font-bold" style={{ color: themeColors.primary }}>{stats.totalHours}h</p>
          </div>
          <div className="p-4 rounded-lg border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
            <p className="text-sm" style={{ color: themeColors.muted }}>Worklogs</p>
            <p className="text-2xl font-bold" style={{ color: themeColors.secondary }}>{stats.totalWorklogs}</p>
          </div>
          <div className="p-4 rounded-lg border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
            <p className="text-sm" style={{ color: themeColors.muted }}>Active Employees</p>
            <p className="text-2xl font-bold" style={{ color: themeColors.accent }}>{stats.activeEmployees}</p>
          </div>
          <div className="p-4 rounded-lg border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
            <p className="text-sm" style={{ color: themeColors.muted }}>Avg Hours/Day</p>
            <p className="text-2xl font-bold" style={{ color: themeColors.warning }}>{stats.avgHoursPerDay}h</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin" size={32} style={{ color: themeColors.primary }} />
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-lg border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: themeColors.danger }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: themeColors.text }}>Error Loading Worklogs</h3>
          <p style={{ color: themeColors.muted }}>{error}</p>
          <button
            onClick={fetchWorklogs}
            className="mt-4 px-4 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: themeColors.primary, color: 'white' }}
          >
            Try Again
          </button>
        </div>
      ) : worklogs.length === 0 ? (
        <div className="p-12 text-center rounded-lg border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
          <FileText size={64} className="mx-auto mb-4 opacity-50" style={{ color: themeColors.muted }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: themeColors.text }}>No Worklogs Found</h3>
          <p className="text-sm mb-6" style={{ color: themeColors.muted }}>
            Employees haven't submitted any worklogs yet.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={createTestWorklog}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{ backgroundColor: themeColors.success, color: 'white' }}
            >
              Create Test Worklog
            </button>
            <button
              onClick={manualSQLInsert}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{ backgroundColor: themeColors.accent, color: 'white' }}
            >
              Copy SQL Insert
            </button>
          </div>
          <p className="text-xs mt-4" style={{ color: themeColors.muted }}>
            Worklogs will appear here once employees submit them from their portal
          </p>
        </div>
      ) : viewMode === 'analytics' ? (
        <AnalyticsView />
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: themeColors.border }}>
                  <th className="p-4 text-left text-sm font-medium cursor-pointer hover:opacity-80" 
                      style={{ color: themeColors.muted }}
                      onClick={() => handleSort('employeeName')}>
                    <div className="flex items-center space-x-1">
                      <User size={14} />
                      <span>Employee</span>
                      {sortConfig.key === 'employeeName' && (
                        <ChevronDown size={14} className={`transform ${sortConfig.direction === 'desc' ? '' : 'rotate-180'}`} />
                      )}
                    </div>
                  </th>
                  <th className="p-4 text-left text-sm font-medium cursor-pointer hover:opacity-80"
                      style={{ color: themeColors.muted }}
                      onClick={() => handleSort('date')}>
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>Date</span>
                      {sortConfig.key === 'date' && (
                        <ChevronDown size={14} className={`transform ${sortConfig.direction === 'desc' ? '' : 'rotate-180'}`} />
                      )}
                    </div>
                  </th>
                  <th className="p-4 text-left text-sm font-medium" style={{ color: themeColors.muted }}>
                    <div className="flex items-center space-x-1">
                      <Briefcase size={14} />
                      <span>Task</span>
                    </div>
                  </th>
                  <th className="p-4 text-left text-sm font-medium" style={{ color: themeColors.muted }}>
                    <div className="flex items-center space-x-1">
                      <FileText size={14} />
                      <span>Project</span>
                    </div>
                  </th>
                  <th className="p-4 text-left text-sm font-medium" style={{ color: themeColors.muted }}>Description</th>
                  <th className="p-4 text-left text-sm font-medium cursor-pointer hover:opacity-80"
                      style={{ color: themeColors.muted }}
                      onClick={() => handleSort('hoursWorked')}>
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>Hours</span>
                      {sortConfig.key === 'hoursWorked' && (
                        <ChevronDown size={14} className={`transform ${sortConfig.direction === 'desc' ? '' : 'rotate-180'}`} />
                      )}
                    </div>
                  </th>
                  <th className="p-4 text-left text-sm font-medium" style={{ color: themeColors.muted }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentWorklogs.map((worklog) => (
                  <tr key={worklog.id} className="border-b last:border-0 hover:bg-opacity-50 transition-colors"
                      style={{ borderColor: themeColors.border }}>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center"
                             style={{ backgroundColor: `${themeColors.primary}20` }}>
                          <span className="text-xs font-bold" style={{ color: themeColors.primary }}>
                            {worklog.employeeName?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: themeColors.text }}>
                            {worklog.employeeName || 'N/A'}
                          </p>
                          <p className="text-xs" style={{ color: themeColors.muted }}>
                            {worklog.employeeCode || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm" style={{ color: themeColors.text }}>
                        {formatDate(worklog.date || worklog.createdAt)}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium" style={{ color: themeColors.text }}>
                        {worklog.taskName || worklog.task || 'N/A'}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs"
                            style={{ backgroundColor: `${themeColors.accent}20`, color: themeColors.accent }}>
                        {worklog.project || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm truncate max-w-xs" style={{ color: themeColors.muted }}>
                        {worklog.description || 'No description'}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold" style={{ color: themeColors.secondary }}>
                        {worklog.hoursWorked || 0}h
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setSelectedWorklog(worklog);
                          setShowDetailsModal(true);
                        }}
                        className="p-1.5 rounded transition-all hover:scale-110"
                        style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {worklogs.length > 0 && (
            <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: themeColors.border }}>
              <p className="text-sm" style={{ color: themeColors.muted }}>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, worklogs.length)} of {worklogs.length} entries
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded transition-all hover:scale-105 disabled:opacity-50"
                  style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-3 py-1 rounded text-sm" style={{ backgroundColor: themeColors.primary, color: 'white' }}>
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded transition-all hover:scale-105 disabled:opacity-50"
                  style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedWorklog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-300"
               style={{ backgroundColor: themeColors.card, border: `1px solid ${themeColors.border}` }}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: themeColors.text }}>Worklog Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 rounded hover:scale-110 transition-transform"
                  style={{ color: themeColors.muted }}
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Employee Info */}
                <div className="flex items-center space-x-4 p-4 rounded-lg" style={{ backgroundColor: `${themeColors.primary}10` }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                       style={{ backgroundColor: themeColors.primary, color: 'white' }}>
                    {selectedWorklog.employeeName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-lg font-semibold" style={{ color: themeColors.text }}>
                      {selectedWorklog.employeeName || 'N/A'}
                    </p>
                    <p className="text-sm" style={{ color: themeColors.muted }}>
                      {selectedWorklog.employeeCode || 'N/A'} • {selectedWorklog.department || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Worklog Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded" style={{ backgroundColor: `${themeColors.secondary}10` }}>
                    <p className="text-xs mb-1" style={{ color: themeColors.muted }}>Date</p>
                    <p className="font-medium" style={{ color: themeColors.text }}>
                      {formatDate(selectedWorklog.date || selectedWorklog.createdAt)}
                    </p>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: `${themeColors.accent}10` }}>
                    <p className="text-xs mb-1" style={{ color: themeColors.muted }}>Hours Worked</p>
                    <p className="font-medium text-lg" style={{ color: themeColors.accent }}>
                      {selectedWorklog.hoursWorked || 0} hours
                    </p>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: `${themeColors.primary}10` }}>
                    <p className="text-xs mb-1" style={{ color: themeColors.muted }}>Task</p>
                    <p className="font-medium" style={{ color: themeColors.text }}>
                      {selectedWorklog.taskName || selectedWorklog.task || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: `${themeColors.warning}10` }}>
                    <p className="text-xs mb-1" style={{ color: themeColors.muted }}>Project</p>
                    <p className="font-medium" style={{ color: themeColors.warning }}>
                      {selectedWorklog.project || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: `${themeColors.card}`, border: `1px solid ${themeColors.border}` }}>
                  <p className="text-sm font-medium mb-2" style={{ color: themeColors.text }}>Description</p>
                  <p className="text-sm" style={{ color: themeColors.muted }}>
                    {selectedWorklog.description || 'No description provided'}
                  </p>
                </div>

                {/* Metadata */}
                <div className="border-t pt-4" style={{ borderColor: themeColors.border }}>
                  <p className="text-xs" style={{ color: themeColors.muted }}>
                    Submitted: {new Date(selectedWorklog.createdAt).toLocaleString()}
                  </p>
                  {selectedWorklog.updatedAt && selectedWorklog.updatedAt !== selectedWorklog.createdAt && (
                    <p className="text-xs mt-1" style={{ color: themeColors.muted }}>
                      Last Updated: {new Date(selectedWorklog.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Worklogs;
