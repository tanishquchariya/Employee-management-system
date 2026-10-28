import { useMemo } from "react";
import { displayDate } from "../EmployeePanel/employeePanelData";
import Status from "../EmployeePanel/Status";
import { leavePageStyles as s } from "../../assets/dummyStyles";

// Lists the signed-in employee's leave requests (newest first).
const LeavePage = ({ records }) => {
  const leaves = useMemo(
    () =>
      records
        .filter((record) => record.type === "Leave")
        .sort((a, b) => b.from.localeCompare(a.from)),
    [records],
  );

  return (
    <section className={s.container}>
      <div className={s.innerWrapper}>
        <div className={s.header}>
          <span>Employee</span>
          <span>From</span>
          <span>To</span>
          <span>Reason</span>
          <span className={s.headerAction}>Status</span>
        </div>

        {leaves.length === 0 ? (
          <p className={s.emptyState}>
            No leave requests yet. Apply for leave from the Attendance page.
          </p>
        ) : (
          leaves.map((leave) => (
            <div key={leave.id} className={s.row}>
              <div className={s.employeeColumn}>
                <span className={s.employeeName}>{leave.name}</span>
                <span className={s.employeeId}>{leave.empId}</span>
              </div>
              <span>{displayDate(leave.from)}</span>
              <span>{displayDate(leave.to)}</span>
              <span className={s.reason}>{leave.reason}</span>
              <Status s={leave.status} />
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default LeavePage;
