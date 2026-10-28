import mongoose from "mongoose";
import Payroll from "../model/Payroll.js";
import Employee from "../model/Employee.js";
import { getEmployeeForUser } from "../utils/employeeLookup.js";

// POST /api/payroll  (admin) - generates one payslip
export const createPayroll = async (req, res) => {
    try {
        const {
            employeeId,
            empId,
            name,
            role,
            department,
            payDate,
            salaryPeriod,
            month,
            baseSalary,
            bonus,
            overtime,
            deduction,
            netSalary,
            status
        } = req.body;

        if (!employeeId || !empId || !name || !role || !department || !payDate || !salaryPeriod || !month || baseSalary === undefined || netSalary === undefined) {
            return res.status(400).json({ success: false, message: "All required payroll fields must be provided." });
        }

        if (!mongoose.isValidObjectId(employeeId)) {
            return res.status(400).json({ success: false, message: "Invalid employee." });
        }

        const amounts = [baseSalary, bonus || 0, overtime || 0, deduction || 0, netSalary].map(Number);
        if (amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
            return res.status(400).json({ success: false, message: "Salary amounts must be valid, non-negative numbers." });
        }

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found." });
        }

        if (employee.salaryPeriod === "year") {
            const yearPart = salaryPeriod.substring(0, 4);
            const existingYearly = await Payroll.findOne({
                employeeId,
                salaryPeriod: { $regex: `^${yearPart}-` }
            });
            if (existingYearly) {
                return res.status(400).json({ success: false, message: "Payslip already generated for this employee in this calendar year." });
            }
        } else {
            const existing = await Payroll.findOne({ employeeId, salaryPeriod });
            if (existing) {
                return res.status(400).json({ success: false, message: "Payslip already generated for this employee and period." });
            }
        }

        let payrollId = "";
        let unique = false;
        while (!unique) {
            const num = Math.floor(1000 + Math.random() * 9000);
            payrollId = `PAY-${num}`;
            const check = await Payroll.findOne({ payrollId });
            if (!check) {
                unique = true;
            }
        }

        const record = await Payroll.create({
            payrollId,
            employeeId,
            empId,
            name,
            role,
            department,
            payDate,
            salaryPeriod,
            month,
            baseSalary,
            bonus: bonus || 0,
            overtime: overtime || 0,
            deduction: deduction || 0,
            netSalary,
            status: status || "Paid",
            createdBy: req.user.id
        });

        return res.status(201).json({ success: true, message: "Payslip generated successfully.", record });
    } catch (error) {
        console.error("Error in createPayroll:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Employee fields the payslip views need (the list populates employeeId with these).
const EMPLOYEE_FIELDS =
    "employeeId name salaryPeriod workEmail email phone bankName accountNumber ifscCode joiningDate designation department";

// GET /api/payroll - admin: every payslip; employee: only their own
export const getPayrolls = async (req, res) => {
    try {
        const filter = {};
        if (req.user.role !== "admin") {
            const employee = await getEmployeeForUser(req.user);
            if (!employee) {
                return res.status(200).json({ success: true, records: [] });
            }
            filter.employeeId = employee._id;
        }

        const records = await Payroll.find(filter)
            .populate("employeeId", EMPLOYEE_FIELDS)
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, records });
    } catch (error) {
        console.error("Error in getPayrolls:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
