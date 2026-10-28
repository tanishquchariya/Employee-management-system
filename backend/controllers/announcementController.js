import mongoose from "mongoose";
import Announcement from "../model/Announcement.js";
import Employee from "../model/Employee.js";
import { getEmployeeForUser } from "../utils/employeeLookup.js";
import { parseDateOnly } from "../utils/dateUtils.js";

// POST /api/announcements  (admin)
export const createAnnouncement = async (req, res) => {
    try {
        const { title, message, sendTo = "All", recipient = null, fromDate = null, toDate = null } = req.body;

        if (!title?.trim() || !message?.trim()) {
            return res.status(400).json({ success: false, message: "Title and message are required." });
        }
        if (!["All", "Employee"].includes(sendTo)) {
            return res.status(400).json({ success: false, message: "sendTo must be All or Employee." });
        }

        if (sendTo === "Employee") {
            if (!mongoose.isValidObjectId(recipient) || !(await Employee.exists({ _id: recipient }))) {
                return res.status(400).json({ success: false, message: "Please choose a valid employee." });
            }
        }

        const from = fromDate ? parseDateOnly(fromDate) : null;
        const to = toDate ? parseDateOnly(toDate) : null;
        if ((fromDate && !from) || (toDate && !to)) {
            return res.status(400).json({ success: false, message: "Invalid date." });
        }
        if (from && to && from > to) {
            return res.status(400).json({ success: false, message: "From Date cannot be after To Date." });
        }

        const created = await Announcement.create({
            title: title.trim(),
            message: message.trim(),
            sendTo,
            recipient: sendTo === "Employee" ? recipient : null,
            createdBy: req.user.id,
            fromDate: from,
            toDate: to,
        });
        const announcement = await created.populate("recipient", "name employeeId");

        return res.status(201).json({ success: true, message: "Announcement created.", announcement });
    } catch (error) {
        console.error("Error in createAnnouncement:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/announcements - admin: all; employee: those sent to everyone or to them, still active
export const getAnnouncements = async (req, res) => {
    try {
        const user = req.user;

        let query = {};
        if (user.role !== "admin") {
            const employee = await getEmployeeForUser(user);
            query = {
                $or: [
                    { sendTo: "All" },
                    ...(employee ? [{ sendTo: "Employee", recipient: employee._id }] : []),
                ],
            };
        }

        const announcements = await Announcement.find(query)
            .populate("recipient", "name employeeId")
            .sort({ createdAt: -1 });

        let filtered = announcements;
        if (user.role !== "admin") {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const day = String(today.getDate()).padStart(2, "0");
            const todayStr = `${year}-${month}-${day}`;

            filtered = announcements.filter((item) => {
                const rawEndDate = item.toDate || item.fromDate || item.createdAt;
                if (!rawEndDate) return true;
                const endObj = new Date(rawEndDate);
                if (Number.isNaN(endObj.getTime())) return true;

                const endYear = endObj.getFullYear();
                const endMonth = String(endObj.getMonth() + 1).padStart(2, "0");
                const endDay = String(endObj.getDate()).padStart(2, "0");
                const endDateStr = `${endYear}-${endMonth}-${endDay}`;
                if (endDateStr < todayStr) return false;

                return true;
            });
        }

        return res.status(200).json({ success: true, announcements: filtered });
    } catch (error) {
        console.error("Error in getAnnouncements:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/announcements/:id  (admin)
export const deleteAnnouncement = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid announcement id." });
        }
        const deleted = await Announcement.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Announcement not found." });
        }
        return res.status(200).json({ success: true, message: "Announcement deleted." });
    } catch (error) {
        console.error("Error in deleteAnnouncement:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
