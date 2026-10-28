import Attendance from "../model/Attendance.js";
import Leave from "../model/Leave.js";
import { getEmployeeForUser } from "../utils/employeeLookup.js";
import { getTodayUTC, parseDateOnly } from "../utils/dateUtils.js";

// POST /api/leave/apply  { fromDate, toDate, reason } - one request for a date range
export const applyLeave = async (req, res) => {
    try {
        const employeeDoc = await getEmployeeForUser(req.user);
        if (!employeeDoc) {
            return res.status(404).json({ success: false, message: "Employee record not found." });
        }

        const { fromDate, toDate, reason } = req.body;
        if (!fromDate || !toDate || !reason?.trim()) {
            return res.status(400).json({ success: false, message: "From date, to date and reason are required." });
        }

        const startDate = parseDateOnly(fromDate);
        const endDate = parseDateOnly(toDate);
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: "Invalid date." });
        }
        if (startDate > endDate) {
            return res.status(400).json({ success: false, message: "To date cannot be before from date." });
        }

        const todayUTC = getTodayUTC();
        if (startDate < todayUTC) {
            return res.status(400).json({ success: false, message: "Leave cannot start in the past." });
        }

        const attendance = await Attendance.findOne({ employee: employeeDoc._id, date: todayUTC });
        if (attendance) {
            const from = new Date(fromDate);
            const to = new Date(toDate);
            
            const fromUTC = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
            const toUTC = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
            
            if (fromUTC <= todayUTC && toUTC >= todayUTC) {
                return res.status(400).json({
                    success: false,
                    message: "You cannot apply for leave on a day you have marked present."
                });
            }
        }

        const overlapping = await Leave.findOne({
            employee: employeeDoc._id,
            status: { $in: ["Pending", "Approved"] },
            fromDate: { $lte: endDate },
            toDate: { $gte: startDate },
        });
        if (overlapping) {
            return res.status(400).json({
                success: false,
                message: "You already have a leave request that overlaps these dates.",
            });
        }

        const leave = await Leave.create({
            employee: employeeDoc._id,
            fromDate: startDate,
            toDate: endDate,
            reason: reason.trim(),
        });

        return res.status(201).json({ success: true, message: "Leave applied successfully.", leave });
    } catch (error) {
        console.error("Error in applyLeave:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/leave/my - the logged-in employee's leave requests, newest first
export const getMyLeaves = async (req, res) => {
    try {
        const employeeDoc = await getEmployeeForUser(req.user);
        if (!employeeDoc) {
            return res.status(200).json({ success: true, leaves: [] });
        }
        const leaves = await Leave.find({ employee: employeeDoc._id })
            .populate("employee", "name employeeId")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, leaves });
    } catch (error) {
        console.error("Error in getMyLeaves:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
