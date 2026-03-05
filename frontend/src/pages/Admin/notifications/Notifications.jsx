import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiBell, FiCheck, FiTrash2, FiSettings, FiCalendar, FiUser, FiBriefcase, FiAlertCircle } from "react-icons/fi";
import { useTheme, useThemeClasses } from "../../../contexts/ThemeContext";
import demoRequestService from "../../../services/demoRequestService";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [approvingIds, setApprovingIds] = useState([]);
  const [trialRolesByNotificationId, setTrialRolesByNotificationId] = useState({});
  const darkMode = useTheme() || false;
  const theme = useThemeClasses();

  const extractDemoRequestId = (title) => {
    const match = String(title || "").match(/(?:Demo Request|Request for Demo)\s*#(\d+)/i);
    return match ? Number(match[1]) : null;
  };

  const isDemoTrialApproved = (notification) => {
    return /status:\s*approved|trial approved/i.test(
      `${notification?.message || ""}`
    );
  };

  const getApprovedTrialRole = (notification) => {
    const match = String(notification?.message || "").match(
      /trial access:\s*([^\n\r]+)/i
    );
    return match?.[1] || "EMPLOYEE";
  };

  const toggleTrialRole = (notificationId, role) => {
    setTrialRolesByNotificationId((prev) => {
      const current = Array.isArray(prev[notificationId]) ? prev[notificationId] : ["EMPLOYEE"];
      const exists = current.includes(role);
      const next = exists ? current.filter((r) => r !== role) : [...current, role];
      return {
        ...prev,
        [notificationId]: next.length ? next : ["EMPLOYEE"],
      };
    });
  };

  const mapType = (t, msg) => {
    if (t === "LEAVE") return "info";
    if (t === "TASK") return "info";
    if (t === "SYSTEM") {
      if (msg && msg.toLowerCase().includes("fail")) return "error";
      return "warning";
    }
    return "info";
  };

  const iconFor = (t) => {
    if (t === "LEAVE") return <FiCalendar className="w-5 h-5" />;
    if (t === "TASK") return <FiBriefcase className="w-5 h-5" />;
    return <FiAlertCircle className="w-5 h-5" />;
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mapped = res.data.map((n) => ({
        id: n.id,
        title: n.title || "Notification",
        message: n.message || "",
        type: mapType(n.type, n.message),
        originalType: n.type,
        createdAt: n.createdAt,
        timestamp: (n.createdAt || "").replace("T", " ").split(".")[0],
        read: !!n.isRead,
        icon: iconFor(n.type),
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error("Load notifications failed:", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch("/api/notifications/read-all", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Mark all read failed:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Delete notification failed:", err);
    }
  };

  const clearAll = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/notifications/clear", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
    } catch (err) {
      console.error("Clear notifications failed:", err);
    }
  };

  const handleApproveDemo = async (notification) => {
    const demoRequestId = extractDemoRequestId(notification.title);
    if (!demoRequestId) return;
    const selectedRoles =
      trialRolesByNotificationId[notification.id] || ["EMPLOYEE"];

    try {
      setApprovingIds((prev) => [...prev, notification.id]);
      await demoRequestService.approve(demoRequestId, selectedRoles);
      await loadNotifications();
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || "Failed to approve demo request";
      console.error("Approve demo request failed:", errorMessage);
      alert(errorMessage);
    } finally {
      setApprovingIds((prev) => prev.filter((id) => id !== notification.id));
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.read;
    if (filter === "read") return notif.read;
    if (filter === "error") return notif.type === "error";
    if (filter === "success") return notif.type === "success";
    if (filter === "warning") return notif.type === "warning";
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const todayCount = notifications.filter(n => {
    const d = new Date(n.createdAt);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length;
  const alertCount = notifications.filter(n => n.originalType === "SYSTEM").length;

  // Updated with darker colors for light mode
  const getTypeColor = (type) => {
    switch (type) {
      case "success": return darkMode ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border border-emerald-300";
      case "error": return darkMode ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-rose-100 text-rose-700 border border-rose-300";
      case "warning": return darkMode ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-amber-100 text-amber-700 border border-amber-300";
      case "info":
      default: return darkMode ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-blue-100 text-blue-700 border border-blue-300";
    }
  };

  const getTypeBg = (type) => {
    switch (type) {
      case "success": return darkMode ? "bg-emerald-500/10" : "bg-emerald-100";
      case "error": return darkMode ? "bg-rose-500/10" : "bg-rose-100";
      case "warning": return darkMode ? "bg-amber-500/10" : "bg-amber-100";
      case "info":
      default: return darkMode ? "bg-blue-500/10" : "bg-blue-100";
    }
  };

  // Helper functions for theme - Updated with more professional colors
  const getBgColor = () => darkMode ? "bg-gray-800" : "bg-white";
  const getBorderColor = () => darkMode ? "border-gray-700" : "border-gray-200";
  const getTextColor = () => darkMode ? "text-white" : "text-gray-800";
  const getSecondaryTextColor = () => darkMode ? "text-gray-400" : "text-gray-600";
  const getCardBg = () => darkMode ? "bg-gray-700/50" : "bg-gray-50";

  // Updated header gradient for light mode to be more subtle
  const getHeaderGradient = () => darkMode ? "from-gray-900 via-gray-800 to-gray-900" : "from-gray-50 via-slate-50 to-gray-100";
  const getHeaderTextColor = () => darkMode ? "text-gray-300" : "text-gray-600";

  // Darker text colors for better visibility
  const getAccentTextColor = () => darkMode ? "text-blue-400" : "text-blue-700";
  const getSuccessTextColor = () => darkMode ? "text-emerald-400" : "text-emerald-700";
  const getWarningTextColor = () => darkMode ? "text-amber-400" : "text-amber-700";
  const getErrorTextColor = () => darkMode ? "text-rose-400" : "text-rose-700";

  return (
    <div className="w-full">
      {/* Header */}
      <div className={`relative mb-8 overflow-hidden rounded-xl bg-gradient-to-br ${getHeaderGradient()} p-6 border ${getBorderColor()}`}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="relative z-10">
          <h1 className={`text-3xl font-bold ${getTextColor()} mb-2`}>
            Notifications
          </h1>
          <p className={getHeaderTextColor()}>Stay updated with system alerts and important announcements.</p>

          {/* Stats Grid - Updated with darker colors */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <FiBell className="w-6 h-6" />,
                label: "Total",
                value: notifications.length.toString(),
                color: darkMode ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-blue-100 text-blue-700 border border-blue-300",
                textColor: getAccentTextColor()
              },
              {
                icon: <div className="relative"><FiBell className="w-6 h-6" /><div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full"></div></div>,
                label: "Unread",
                value: unreadCount.toString(),
                color: darkMode ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-amber-100 text-amber-700 border border-amber-300",
                textColor: getWarningTextColor()
              },
              {
                icon: <FiCalendar className="w-6 h-6" />,
                label: "Today",
                value: todayCount.toString(),
                color: darkMode ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border border-emerald-300",
                textColor: getSuccessTextColor()
              },
              {
                icon: <FiAlertCircle className="w-6 h-6" />,
                label: "Alerts",
                value: alertCount.toString(),
                color: darkMode ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-rose-100 text-rose-700 border border-rose-300",
                textColor: getErrorTextColor()
              },
            ].map((stat, index) => (
              <div key={index} className={`${getBgColor()} rounded-lg border ${getBorderColor()} p-4 hover:shadow-sm transition-shadow`}>
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    {stat.icon}
                  </div>
                </div>
                <h3 className={`text-2xl font-bold ${getTextColor()} mt-4`}>{stat.value}</h3>
                <p className={getSecondaryTextColor()}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Action Buttons - Updated with darker colors */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={markAllAsRead}
              className={`flex items-center gap-2 px-4 py-2.5 ${darkMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-lg font-medium transition-colors`}
            >
              <FiCheck className="w-4 h-4" />
              Mark All as Read
            </button>
            <button
              onClick={clearAll}
              className={`flex items-center gap-2 px-4 py-2.5 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'} ${darkMode ? 'text-gray-300' : 'text-gray-700'} rounded-lg font-medium transition-colors`}
            >
              <FiTrash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Filters - Updated with darker colors */}
      <div className={`${getBgColor()} rounded-xl p-4 border ${getBorderColor()} mb-6`}>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "All", value: "all", color: darkMode ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-blue-100 text-blue-700 border border-blue-300" },
            { label: "Unread", value: "unread", color: darkMode ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-amber-100 text-amber-700 border border-amber-300", count: unreadCount },
            { label: "Read", value: "read", color: darkMode ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border border-emerald-300" },
            { label: "Errors", value: "error", color: darkMode ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-rose-100 text-rose-700 border border-rose-300" },
            { label: "Success", value: "success", color: darkMode ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border border-emerald-300" },
            { label: "Warnings", value: "warning", color: darkMode ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-amber-100 text-amber-700 border border-amber-300" },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === btn.value
                ? `${btn.color}`
                : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${darkMode ? 'text-gray-300' : 'text-gray-700'} border ${getBorderColor()}`
                }`}
            >
              <div className="flex items-center gap-2">
                {btn.label}
                {btn.count > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-rose-600 text-white rounded-full">
                    {btn.count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className={`${getBgColor()} rounded-xl border ${getBorderColor()} overflow-hidden`}>
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} transition-colors ${!notification.read ? getTypeBg(notification.type) : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full ${getTypeColor(notification.type)} flex items-center justify-center`}>
                    {notification.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold ${getTextColor()}`}>{notification.title}</h4>
                        {!notification.read && (
                          <span className={`inline-block w-2 h-2 ${darkMode ? 'bg-blue-500' : 'bg-blue-600'} rounded-full`}></span>
                        )}
                      </div>
                      <span className={`text-sm ${getSecondaryTextColor()}`}>
                        {notification.timestamp.split(' ')[0]} • {notification.timestamp.split(' ')[1]}
                      </span>
                    </div>

                    <p className={`${getSecondaryTextColor()} mb-4 whitespace-pre-line`}>{notification.message}</p>

                    <div className="flex gap-2">
                      {extractDemoRequestId(notification.title) && !isDemoTrialApproved(notification) && (
                        <>
                          <div className="flex items-center gap-3">
                            {["EMPLOYEE", "MANAGER", "ADMIN"].map((role) => {
                              const selected = (trialRolesByNotificationId[notification.id] || ["EMPLOYEE"]).includes(role);
                              return (
                                <label
                                  key={role}
                                  className={`text-xs flex items-center gap-1 ${darkMode ? "text-gray-200" : "text-gray-700"}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleTrialRole(notification.id, role)}
                                  />
                                  {role}
                                </label>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => handleApproveDemo(notification)}
                            disabled={approvingIds.includes(notification.id)}
                            className={`px-3 py-1.5 text-sm ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            {approvingIds.includes(notification.id)
                              ? "Approving..."
                              : "Approve 15-Day Trial"}
                          </button>
                        </>
                      )}
                      {extractDemoRequestId(notification.title) && isDemoTrialApproved(notification) && (
                        <span className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg font-medium">
                          {`Approved for ${getApprovedTrialRole(notification)}`}
                        </span>
                      )}
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className={`px-3 py-1.5 text-sm ${darkMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-lg font-medium transition-colors`}
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className={`px-3 py-1.5 text-sm ${darkMode ? 'bg-rose-600 hover:bg-rose-700' : 'bg-rose-600 hover:bg-rose-700'} text-white rounded-lg font-medium transition-colors`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                <FiBell className={`w-8 h-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-lg font-medium ${getTextColor()} mb-2`}>No notifications found</h3>
              <p className={`${getSecondaryTextColor()} mb-4`}>
                {filter === "unread"
                  ? "You have no unread notifications"
                  : "No notifications match your filter criteria"
                }
              </p>
              {filter !== "all" && (
                <button
                  onClick={() => setFilter("all")}
                  className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} font-medium`}
                >
                  View all notifications
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pagination - Updated with darker colors */}
        {filteredNotifications.length > 0 && (
          <div className={`px-6 py-4 border-t ${getBorderColor()} flex items-center justify-between`}>
            <div className={`text-sm ${getSecondaryTextColor()}`}>
              Showing <span className={`font-medium ${getTextColor()}`}>1-{filteredNotifications.length}</span> of{" "}
              <span className={`font-medium ${getTextColor()}`}>{notifications.length}</span> notifications
            </div>
            <div className="flex gap-2">
              <button className={`px-3 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} border ${getBorderColor()} rounded-lg ${getSecondaryTextColor()} transition-colors`}>
                Previous
              </button>
              <button className={`px-3 py-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white border ${darkMode ? 'border-blue-500' : 'border-blue-600'} rounded-lg transition-colors`}>
                1
              </button>
              <button className={`px-3 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} border ${getBorderColor()} rounded-lg ${getSecondaryTextColor()} transition-colors`}>
                2
              </button>
              <button className={`px-3 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} border ${getBorderColor()} rounded-lg ${getSecondaryTextColor()} transition-colors`}>
                3
              </button>
              <button className={`px-3 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} border ${getBorderColor()} rounded-lg ${getSecondaryTextColor()} transition-colors`}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
