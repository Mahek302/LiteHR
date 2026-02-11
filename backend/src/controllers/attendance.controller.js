import {
  markInService,
  markOutService,
  getMyAttendanceService,
  getAllAttendanceService,
  exportAttendanceService,
} from "../services/attendance.service.js";

export const markInController = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const result = await markInService(employeeId);
    res.json({ message: "Marked in successfully", attendance: result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const markOutController = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const result = await markOutService(employeeId);
    res.json({ message: "Marked out successfully", attendance: result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const myAttendanceController = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID not found for user" });
    }
    const result = await getMyAttendanceService(employeeId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getAllAttendanceController = async (req, res) => {
  try {
    const { month, year } = req.query;
    const result = await getAllAttendanceService({ month, year });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const exportAttendanceController = async (req, res) => {
  try {
    const { month, year } = req.query;
    const { Parser } = await import("json2csv");

    const data = await exportAttendanceService({ month, year });

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No attendance records found for this period" });
    }

    const fields = ["Employee ID", "Employee Name", "Department", "Date", "Status", "Check In", "Check Out", "Work Hours"];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment(`attendance_${month}_${year}.csv`);
    return res.send(csv);

  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ message: "Failed to export attendance" });
  }
};

export const getAttendanceByEmployeeIdController = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID (param) is required" });
    }
    const result = await getMyAttendanceService(employeeId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
