import { statusStyles } from "../../assets/dummyStyles";

// Pill for an attendance/leave status: Present, Absent, Leave Applied, Approved, Rejected.
const Status = ({ s }) => (
  <span className={statusStyles.getStatusClass(s)}>{s}</span>
);

export default Status;
