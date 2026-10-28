import Employee from "../model/Employee.js";

// The logged-in User and their Employee record are linked by work email.
export const getEmployeeForUser = (user) => Employee.findOne({ workEmail: user.email });
