import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import DashboardPage from "../../components/DashboardPage/DashboardPage";
import AttendancePage from "../../components/AttendancePage/AttendancePage";
import PaySlipPage from "../../components/PaySlipPage/PaySlipPage";
import LeavePage from "../../components/LeavePage/LeavePage";
import { getEmployeeUser } from "../../auth/employeeAuth";
import { dashboardPageStyles as toastStyles, homePageStyles as s } from "../../assets/dummyStyles";

const BASE = "http://localhost:5000";

const pageTitles = {
  "/": "Dashboard",
  "/attendance": "Attendance",
  "/payslip": "Payslip",
  "/leave": "Leave",
};

const Home = () => {
  const { pathname } = useLocation();
  const [records, setRecords] = useState([]);
  const [joiningDate, setJoiningDate] = useState(getEmployeeUser()?.joiningDate || "");
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  }, []);

  // Loads this employee's attendance and leave requests and merges them into one list.
  // Expected endpoints: GET /api/attendance/my -> { success, attendance, joiningDate? }
  //                     GET /api/leave/my      -> { success, leaves }
  const fetchRecords = useCallback(async () => {
    const user = getEmployeeUser();
    if (!user?.token) return;
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const [attResponse, leaveResponse] = await Promise.all([
        fetch(`${BASE}/api/attendance/my`, { headers }),
        fetch(`${BASE}/api/leave/my`, { headers }),
      ]);
      const attData = await attResponse.json();
      const leaveData = await leaveResponse.json();

        const attendanceList =
          attData.success && Array.isArray(attData.attendance)
            ? attData.attendance
            : [];
        const leaveList =
          leaveData.success && Array.isArray(leaveData.leaves)
            ? leaveData.leaves
            : [];

        const mappedAttendance = attendanceList.map((att) => ({
          id: att._id,
          type: "Present",
          name: att.employee?.name || user.name || "Employee",
          empId: att.employee?.employeeId || user.employeeId || "",
          from: att.date.split("T")[0],
          to: att.date.split("T")[0],
          reason: "-",
          status: att.status || "Present",
        }));

        const mappedLeaves = leaveList.map((leave) => ({
          id: leave._id,
          type: "Leave",
          name: leave.employee?.name || user.name || "Employee",
          empId: leave.employee?.employeeId || user.employeeId || "",
          from: leave.fromDate.split("T")[0],
          to: leave.toDate.split("T")[0],
          reason: leave.reason,
          status:
            leave.status === "Pending"
              ? "Leave Applied"
              : leave.status === "Approved"
                ? "Approved"
                : "Rejected",
        }));

      setRecords([...mappedAttendance, ...mappedLeaves]);
      if (attData.joiningDate) setJoiningDate(attData.joiningDate);
    } catch (err) {
      console.error("Error fetching attendance/leave records:", err);
    }
  }, []);

  useEffect(() => {
    fetchRecords();

    const interval = setInterval(() => {
      fetchRecords();
    }, 5000);

    const handleFocus = () => {
      fetchRecords();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const title = pageTitles[pathname];
  if (!title) return <Navigate to="/" replace />;

  return (
    <>
      <Navbar />
      {toast && (
        <div className={toastStyles.toastContainer}>
          <CheckCircle2 size={16} className={toastStyles.toastIcon} />
          {toast}
        </div>
      )}
      <main className={s.main}>
        <div className={s.container}>
          <h1 className={s.heading}>{title}</h1>

          {pathname === "/" && (
            <DashboardPage records={records} joiningDate={joiningDate} />
          )}
          {pathname === "/attendance" && (
            <AttendancePage
              records={records}
              setRecords={setRecords}
              notify={notify}
              fetchRecords={fetchRecords}
              joiningDate={joiningDate}
            />
          )}
          {pathname === "/payslip" && <PaySlipPage notify={notify} />}
          {pathname === "/leave" && <LeavePage records={records} />}
        </div>
      </main>
    </>
  );
};

export default Home;
