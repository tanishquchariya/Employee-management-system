import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  Check,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import EmployeeToast from "../EmployeePage/EmployeeToast";
import StatusPill from "../EmployeePage/StatusPill";
import { leavesPageStyles as s } from "../../assets/dummyStyles";

const BASE = "http://localhost:5000";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
};

const LeavesPage = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [decidingId, setDecidingId] = useState(null);
  const [decidingAction, setDecidingAction] = useState(null);

  const [toast, setToast] = useState(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastProgress, setToastProgress] = useState(false);
  const toastTimer = useRef(null);
  const toastFrame = useRef(null);
  const toastExitTimer = useRef(null);

  const closeToast = () => {
    window.clearTimeout(toastTimer.current);
    window.clearTimeout(toastFrame.current);
    window.clearTimeout(toastExitTimer.current);
    setToastOpen(false);
    toastExitTimer.current = window.setTimeout(() => setToast(null), 220);
  };

  const showToast = ({ title, message, tone = "success" }) => {
    window.clearTimeout(toastTimer.current);
    window.clearTimeout(toastFrame.current);
    window.clearTimeout(toastExitTimer.current);
    setToast({ title, message, tone, confirmEmployee: null });
    setToastOpen(false);
    setToastProgress(false);
    toastFrame.current = window.setTimeout(() => {
      setToastOpen(true);
      window.setTimeout(() => setToastProgress(true), 60);
    }, 20);
    toastTimer.current = window.setTimeout(closeToast, 3600);
  };

  // GET /api/admin/attendance/leave -> { success, leaves: [{ _id, employee: { name, employeeId },
  //   fromDate, toDate, reason, status, createdAt, updatedAt }] }
  const fetchLeavesData = useCallback(
    async (silent = false) => {
      if (!user?.token) return;
      if (!silent) setLoading(true);
      try {
        const response = await fetch(`${BASE}/api/admin/attendance/leave`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setLeaves(Array.isArray(data.leaves) ? data.leaves : []);
        }
      } catch (err) {
        console.error("Error fetching leave requests:", err);
      } finally {
        setLoading(false);
      }
    },
    [user?.token],
  );

  useEffect(() => {
    fetchLeavesData();
    const interval = setInterval(() => fetchLeavesData(true), 8000);
    return () => {
      clearInterval(interval);
      window.clearTimeout(toastTimer.current);
      window.clearTimeout(toastFrame.current);
      window.clearTimeout(toastExitTimer.current);
    };
  }, [fetchLeavesData]);

  const handleDecideLeave = async (leaveId, employeeName, nextStatus) => {
    setDecidingId(leaveId);
    setDecidingAction(nextStatus);
    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/attendance/leave/${leaveId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const data = await response.json();
      if (response.ok && data.success) {
        showToast({
          title:
            nextStatus === "Approved" ? "Leave Approved" : "Leave Rejected",
          message: `${employeeName}'s leave request was ${nextStatus.toLowerCase()} successfully.`,
          tone: nextStatus === "Approved" ? "success" : "danger",
        });
        fetchLeavesData(true);
      } else {
        showToast({
          title: "Action failed",
          message: data.message || "Could not update leave request.",
          tone: "danger",
        });
      }
    } catch (err) {
      console.error("Error updating leave:", err);
      showToast({
        title: "Connection error",
        message: "Failed to update leave status.",
        tone: "danger",
      });
    } finally {
      setDecidingId(null);
      setDecidingAction(null);
    }
  };

  const stats = useMemo(() => {
    const counts = { pending: 0, approved: 0, rejected: 0 };
    leaves.forEach((leave) => {
      if (leave.status === "Pending") counts.pending++;
      else if (leave.status === "Approved") counts.approved++;
      else if (leave.status === "Rejected") counts.rejected++;
    });
    return counts;
  }, [leaves]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      if (filterDate) {
        const fromStr = new Date(leave.fromDate).toISOString().split("T")[0];
        const toStr = new Date(leave.toDate).toISOString().split("T")[0];
        if (filterDate < fromStr || filterDate > toStr) return false;
      }
      if (statusFilter !== "All" && leave.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const empName = leave.employee?.name?.toLowerCase() || "";
        const empId = leave.employee?.employeeId?.toLowerCase() || "";
        const reason = leave.reason?.toLowerCase() || "";
        if (!empName.includes(query) && !empId.includes(query) && !reason.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [leaves, filterDate, searchTerm, statusFilter]);

  const resetFilters = () => {
    setFilterDate("");
    setStatusFilter("All");
    setSearchTerm("");
  };

  const statCards = [
    { label: "Pending Requests", value: stats.pending, helper: "Waiting for a decision", tone: "pending", icon: CalendarClock },
    { label: "Approved Leaves", value: stats.approved, helper: "Accepted requests", tone: "approved", icon: CalendarCheck },
    { label: "Rejected Leaves", value: stats.rejected, helper: "Declined requests", tone: "rejected", icon: CalendarX },
  ];

  return (
    <main className={s.mainContainer}>
      <div className={s.sectionWrapper}>
        <section className={s.headerCard}>
          <span className={s.headerBadge}>Leave Management</span>
          <h1 className={s.headerTitle}>Leave Requests</h1>
          <p className={s.headerDescription}>
            Review, approve or reject leave applications from employees.
          </p>
        </section>

        <section className={s.statsGrid}>
          {statCards.map(({ label, value, helper, tone, icon: Icon }) => (
            <article key={label} className={s.statCard}>
              <div className={s.statCardTop}>
                <span className={s.getStatIconClass(tone)}>
                  <Icon className={s.statIconSvg} />
                </span>
                <span className={s.getStatBadgeClass(tone)}>{tone}</span>
              </div>
              <p className={s.statLabel}>{label}</p>
              <p className={s.statValue}>{value}</p>
              <p className={s.statHelper}>{helper}</p>
            </article>
          ))}
        </section>

        <section className={s.filterPanel}>
          <div>
            <h2 className={s.filterTitle}>Filter Requests</h2>
            <p className={s.filterSubtitle}>Search by employee, date or status.</p>
          </div>
          <div className={s.filterControls}>
            <label className={s.searchLabel}>
              <Search className={s.filterIcon} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className={s.searchInput}
                placeholder="Search name, ID or reason"
              />
            </label>
            <label className={s.filterLabel}>
              <Calendar className={s.filterIcon} />
              <input
                type="date"
                value={filterDate}
                onChange={(event) => setFilterDate(event.target.value)}
                className={s.filterInput}
              />
            </label>
            <label className={s.filterLabel}>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className={s.filterSelect}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </label>
            <button type="button" onClick={resetFilters} className={s.resetButton}>
              <RotateCcw className={s.resetIcon} />
              Reset
            </button>
          </div>
        </section>

        {/* Leaves Table */}
        <section className={s.tableSection}>
          <div className={s.tableWrapper}>
            <table className={s.table}>
              <thead className={s.tableHead}>
                <tr>
                  <th className={s.tableHeader}>Employee</th>
                  <th className={s.tableHeader}>Applied Date</th>
                  <th className={s.tableHeader}>Leave Duration</th>
                  <th className={s.tableHeader}>Reason</th>
                  <th className={`${s.tableHeader} ${s.tableHeaderCenter}`}>
                    Status
                  </th>
                  <th className={`${s.tableHeader} ${s.tableHeaderRight}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={s.tableBody}>
                {loading ? (
                  <tr>
                    <td colSpan="6" className={s.loadingCell}>
                      <div className={s.loadingSpinner} />
                      <p className={s.loadingText}>Loading leave requests...</p>
                    </td>
                  </tr>
                ) : filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={s.emptyCell}>
                      <AlertCircle className={s.emptyIcon} />
                      <p className={s.emptyTitle}>No leave applications found</p>
                      <p className={s.emptySubtitle}>
                        Try adjusting your filters or dates.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((leave) => {
                    const employeeName = leave.employee?.name || "Unknown";
                    const employeeId = leave.employee?.employeeId || "N/A";
                    const isPending = leave.status === "Pending";

                    return (
                      <tr key={leave._id} className={s.tableRow}>
                        <td className={s.cell}>
                          <div>
                            <p className={s.employeeName}>{employeeName}</p>
                            <p className={s.employeeId}>ID: {employeeId}</p>
                          </div>
                        </td>

                        <td className={`${s.cell} ${s.appliedDate}`}>
                          {formatDate(leave.createdAt)}
                        </td>

                        <td className={s.cell}>
                          <p className={s.durationFrom}>
                            {formatDate(leave.fromDate)}
                          </p>
                          <p className={s.durationTo}>
                            to {formatDate(leave.toDate)}
                          </p>
                        </td>

                        <td
                          className={s.reasonCell}
                          title={leave.reason}
                        >
                          {leave.reason}
                        </td>

                        <td className={`${s.cell} ${s.statusCell}`}>
                          <StatusPill
                            label={
                              leave.status === "Pending"
                                ? "Leave Applied"
                                : leave.status === "Approved"
                                  ? "Leave Approved"
                                  : leave.status === "Rejected"
                                    ? "Leave Rejected"
                                    : leave.status
                            }
                          />
                        </td>

                        <td className={`${s.cell} ${s.actionsCell}`}>
                          {isPending ? (
                            <div className={s.actionButtonsWrapper}>
                              <button
                                type="button"
                                disabled={decidingId !== null}
                                onClick={() =>
                                  handleDecideLeave(
                                    leave._id,
                                    employeeName,
                                    "Approved",
                                  )
                                }
                                className={s.approveButton}
                                title="Approve Leave"
                              >
                                {decidingId === leave._id &&
                                decidingAction === "Approved" ? (
                                  <svg className={s.actionSpinner} fill="none" viewBox="0 0 24 24">
                                    <circle
                                      className={s.spinnerCircle}
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className={s.spinnerPath}
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                ) : (
                                  <Check className={s.actionIconSvg} />
                                )}
                              </button>
                              <button
                                type="button"
                                disabled={decidingId !== null}
                                onClick={() =>
                                  handleDecideLeave(
                                    leave._id,
                                    employeeName,
                                    "Rejected",
                                  )
                                }
                                className={s.rejectButton}
                                title="Reject Leave"
                              >
                                {decidingId === leave._id &&
                                decidingAction === "Rejected" ? (
                                  <svg className={s.actionSpinner} fill="none" viewBox="0 0 24 24">
                                    <circle
                                      className={s.spinnerCircle}
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className={s.spinnerPath}
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                ) : (
                                  <X className={s.actionIconSvg} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className={s.decidedText}>
                              Decided on {formatDate(leave.updatedAt)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      <EmployeeToast
        toast={toast}
        open={toastOpen}
        progress={toastProgress}
        onClose={closeToast}
      />
    </main>
  );
};

export default LeavesPage;
