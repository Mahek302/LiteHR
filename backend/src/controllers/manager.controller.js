// src/controllers/manager.controller.js
import {
  getTeamAttendanceService,
  markTeamAttendanceService,
  getTeamAttendanceAnalyticsService,
  getTeamMonthlyAttendanceService,
  sendReminderService
} from "../services/manager.service.js";

// ...Existing controllers...

export const getTeamAttendanceController = async (req, res) => {
  try {
    const { date } = req.query;
    const data = await getTeamAttendanceService(req.user, date);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getTeamMonthlyAttendanceController = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year are required" });
    }
    const data = await getTeamMonthlyAttendanceService(req.user, parseInt(month), parseInt(year));
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const markAttendanceController = async (req, res) => {
  try {
    const result = await markTeamAttendanceService(req.body);
    res.json({ message: "Attendance marked successfully", result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getTeamAttendanceAnalyticsController = async (req, res) => {
  try {
    const data = await getTeamAttendanceAnalyticsController(req.user);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const sendReminderController = async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }
    await sendReminderService(employeeId, req.user); // Service now handles notification creation
    res.json({ message: "Reminder sent successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
