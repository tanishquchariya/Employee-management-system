import Attendance from "../model/Attendance.js";
import Leave from "../model/Leave.js";
import { getEmployeeForUser } from "../utils/employeeLookup.js";
import { formatDateToString, getTodayUTC } from "../utils/dateUtils.js";

// POST /api/attendance/mark - marks the logged-in employee Present for today
export const markAttendance = async (req, res) => {
  try {
    const employee = await getEmployeeForUser(req.user);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee record not found." });
    }

    const todayUTC = getTodayUTC();

    const leaveToday = await Leave.findOne({
      employee: employee._id,
      status: { $in: ["Pending", "Approved"] },
      fromDate: { $lte: todayUTC },
      toDate: { $gte: todayUTC },
    });
    if (leaveToday) {
      return res.status(400).json({
        success: false,
        message: "You cannot mark attendance on a day you have applied for leave.",
      });
    }

    const existing = await Attendance.findOne({ employee: employee._id, date: todayUTC });
    if (existing) {
      return res.status(400).json({ success: false, message: "Attendance already marked for today." });
    }

    const attendance = await Attendance.create({
      employee: employee._id,
      date: todayUTC,
      status: "Present",
    });
    return res.status(201).json({ success: true, message: "Attendance marked successfully.", attendance });
  } catch (error) {
    // Two quick taps can race past the check above; the unique index catches that.
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Attendance already marked for today." });
    }
    console.error("Error in markAttendance:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attendance/my - the logged-in employee's attendance history
export const getMyAttendance = async (req, res) => {
  try {
    const employee = await getEmployeeForUser(req.user);
    if (!employee) {
      return res.status(200).json({ success: true, attendance: [], joiningDate: "" });
    }
    const attendance = await Attendance.find({ employee: employee._id })
      .populate("employee", "name employeeId")
      .sort({ date: -1 });
    return res.status(200).json({
      success: true,
      attendance,
      joiningDate: formatDateToString(employee.joiningDate),
    });
  } catch (error) {
    console.error("Error in getMyAttendance:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
