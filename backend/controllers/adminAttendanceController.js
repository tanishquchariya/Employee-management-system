import mongoose from "mongoose";
import Employee from "../model/Employee.js";
import User from "../model/User.js";
import Attendance from "../model/Attendance.js";
import Leave from "../model/Leave.js";
import { eachDateInRange, formatDateToString, getTodayUTC } from "../utils/dateUtils.js";

// A pending request whose start date has already passed without a decision is
// rejected automatically (the UI already counts those days as Absent).
const autoRejectExpiredLeaves = async () => {
    await Leave.updateMany({ status: "Pending", fromDate: { $lt: getTodayUTC() } }, { status: "Rejected" });
};

// Leave shape used by the admin attendance screens ("Pending" is shown as "Applied").
const mapLeaveRequest = (leave) => ({
    id: leave._id.toString(),
    startDate: formatDateToString(leave.fromDate),
    endDate: formatDateToString(leave.toDate),
    reason: leave.reason,
    status: leave.status === "Pending" ? "Applied" : leave.status,
    createdAt: leave.createdAt ? leave.createdAt.toISOString() : new Date().toISOString(),
    decidedAt: leave.status !== "Pending" ? (leave.updatedAt ? leave.updatedAt.toISOString() : new Date().toISOString()) : null
});

const resolveProfileImage = (image) =>
    image
        ? (image.startsWith("http") || image.startsWith("data:"))
            ? image
            : `http://localhost:5000/${image.replace(/\\/g, "/")}`
        : "";

// GET /api/admin/attendance/list?date=&search=&department=&designation=  (admin)
export const getAttendanceList = async (req, res) => {
    try {
        await autoRejectExpiredLeaves();
        const { search = "", department, designation, date } = { ...req.query, ...req.body };
        const employeeQuery = {};

        if (search) {
            employeeQuery.name = { $regex: String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
        }

        if (department && department !== "All") {
            employeeQuery.department = department;
        }

        if (designation && designation !== "All") {
            employeeQuery.designation = designation;
        }

        const employees = await Employee.find(employeeQuery).sort({ createdAt: -1 });

        let selectedDate;
        if (date) {
            const [year, month, day] = date.split("-").map(Number);
            selectedDate = new Date(Date.UTC(year, month - 1, day));
        } else {
            selectedDate = getTodayUTC();
        }

        const nextDate = new Date(selectedDate);
        nextDate.setUTCDate(selectedDate.getUTCDate() + 1);

        const formattedDateStr = formatDateToString(selectedDate);

        const data = await Promise.all(
            employees.map(async (employee) => {
                const userDoc = await User.findOne({ email: employee.workEmail });
                const userObjectId = userDoc ? userDoc._id : null;
                const employeeIds = [employee._id, userObjectId].filter(Boolean);

                const attendance = await Attendance.findOne({
                    employee: { $in: employeeIds },
                    date: {
                        $gte: selectedDate,
                        $lt: nextDate,
                    },
                });

                const leaves = await Leave.find({ employee: { $in: employeeIds } }).sort({ createdAt: -1 });

                const leaveRequests = leaves.map(leave => ({
                    id: leave._id.toString(),
                    startDate: formatDateToString(leave.fromDate),
                    endDate: formatDateToString(leave.toDate),
                    reason: leave.reason,
                    status: leave.status === "Pending" ? "Applied" : leave.status,
                    createdAt: leave.createdAt ? leave.createdAt.toISOString() : new Date().toISOString(),
                    decidedAt: leave.status !== "Pending" ? (leave.updatedAt ? leave.updatedAt.toISOString() : new Date().toISOString()) : null
                }));

                const approvedLeaveForDate = leaves.find(leave =>
                    leave.status === "Approved" &&
                    new Date(leave.fromDate) <= selectedDate &&
                    new Date(leave.toDate) >= selectedDate
                );

                const attendanceRecords = [];
                if (attendance) {
                    attendanceRecords.push({
                        date: formattedDateStr,
                        status: attendance.status,
                        reason: ""
                    });
                } else if (approvedLeaveForDate) {
                    attendanceRecords.push({
                        date: formattedDateStr,
                        status: "Leave",
                        reason: approvedLeaveForDate.reason,
                        leaveRequestId: approvedLeaveForDate._id.toString()
                    });
                } else {
                    attendanceRecords.push({
                        date: formattedDateStr,
                        status: "Not Marked",
                        reason: ""
                    });
                }

                const profileImage = employee.profileImage
                    ? (employee.profileImage.startsWith('http') || employee.profileImage.startsWith('data:'))
                        ? employee.profileImage
                        : `http://localhost:5000/${employee.profileImage.replace(/\\/g, '/')}`
                    : '';

                return {
                    _id: employee._id,
                    id: employee.employeeId,
                    name: employee.name,
                    department: employee.department,
                    designation: employee.designation,
                    profileImage,
                    attendanceRecords,
                    leaveRequests
                };
            })
        );

        res.status(200).json({
            success: true,
            total: data.length,
            employees: data,
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

// GET /api/admin/attendance/employee/:id  (admin) - full history for one employee (:id = Employee _id)
export const getEmployeeAttendanceDetails = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid employee id." });
        }
        await autoRejectExpiredLeaves();

        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found." });
        }

        const userDoc = await User.findOne({ email: employee.workEmail });
        const employeeIds = [employee._id, userDoc ? userDoc._id : null].filter(Boolean);

        const [attendance, leaves] = await Promise.all([
            Attendance.find({ employee: { $in: employeeIds } }).sort({ date: 1 }),
            Leave.find({ employee: { $in: employeeIds } }).sort({ createdAt: -1 }),
        ]);

        const attendanceRecords = attendance.map((item) => ({
            date: formatDateToString(item.date),
            status: item.status,
            reason: "",
        }));

        // Approved leave days count as "Leave" unless the employee was actually marked present.
        const markedDates = new Set(attendanceRecords.map((record) => record.date));
        leaves
            .filter((leave) => leave.status === "Approved")
            .forEach((leave) => {
                eachDateInRange(leave.fromDate, leave.toDate).forEach((date) => {
                    if (!markedDates.has(date)) {
                        attendanceRecords.push({
                            date,
                            status: "Leave",
                            reason: leave.reason,
                            leaveRequestId: leave._id.toString(),
                        });
                    }
                });
            });

        return res.status(200).json({
            success: true,
            employee: {
                _id: employee._id,
                id: employee.employeeId,
                name: employee.name,
                department: employee.department,
                designation: employee.designation,
                profileImage: resolveProfileImage(employee.profileImage),
                joiningDate: formatDateToString(employee.joiningDate),
                attendanceRecords,
                leaveRequests: leaves.map(mapLeaveRequest),
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/admin/attendance/leave  (admin) - every leave request, newest first
export const getLeaveRequests = async (req, res) => {
    try {
        await autoRejectExpiredLeaves();
        const leaves = await Leave.find()
            .populate("employee", "name employeeId")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, leaves });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/admin/attendance/leave/:id  { status: "Approved" | "Rejected" }  (admin)
export const updateLeaveStatus = async (req, res) => {
    try {
        const { status } = req.body || {};
        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({ success: false, message: "Status must be Approved or Rejected." });
        }
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid leave id." });
        }
        await autoRejectExpiredLeaves();

        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ success: false, message: "Leave request not found." });
        }
        if (leave.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `This leave request was already ${leave.status.toLowerCase()}.`,
            });
        }

        if (status === "Approved") {
            const presentInRange = await Attendance.findOne({
                employee: leave.employee,
                date: { $gte: leave.fromDate, $lte: leave.toDate },
            });
            if (presentInRange) {
                return res.status(400).json({
                    success: false,
                    message: "The employee is already marked present within this leave range.",
                });
            }
        }

        leave.status = status;
        await leave.save();
        await leave.populate("employee", "name employeeId");

        return res.status(200).json({ success: true, message: `Leave ${status.toLowerCase()}.`, leave });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
