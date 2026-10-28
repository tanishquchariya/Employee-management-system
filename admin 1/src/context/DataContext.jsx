import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "../auth/useAuth";

const BASE = "http://localhost:5000";

const DataContext = createContext(null);

// Shared, cached server data for the admin pages (employees, payrolls,
// announcements) so pages don't refetch everything each time you navigate.
export const DataProvider = ({ children }) => {
  const { user } = useAuth();

  // Employees
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesFetched, setEmployeesFetched] = useState(false);
  const employeesFetchingRef = useRef(false);

  const fetchEmployees = useCallback(
    async (force = false, silent = false) => {
      if (!user?.token) return;
      if (!force && employeesFetched) return;
      if (employeesFetchingRef.current) return;
      employeesFetchingRef.current = true;
      if (!silent) setEmployeesLoading(true);
      try {
        const res = await fetch(`${BASE}/api/employee`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const mapped = data.employee.map((emp) => ({
            ...emp,
            id: emp.employeeId,
            profileImage: emp.profileImage
              ? emp.profileImage.startsWith("http") ||
                emp.profileImage.startsWith("data:")
                ? emp.profileImage
                : `${BASE}/${emp.profileImage.replace(/\\/g, "/")}`
              : "",
            joiningDate: emp.joiningDate ? emp.joiningDate.split("T")[0] : "",
          }));
          setEmployees(mapped);
          setEmployeesFetched(true);
        }
      } catch (err) {
        console.error("DataContext: fetchEmployees error", err);
      } finally {
        if (!silent) setEmployeesLoading(false);
        employeesFetchingRef.current = false;
      }
    },
    [user?.token, employeesFetched],
  );

  // Payrolls
  const [payrolls, setPayrolls] = useState([]);
  const [payrollsLoading, setPayrollsLoading] = useState(false);
  const [payrollsFetched, setPayrollsFetched] = useState(false);
  const payrollsFetchingRef = useRef(false);

  const fetchPayrolls = useCallback(
    async (force = false, silent = false) => {
      if (!user?.token) return;
      if (!force && payrollsFetched) return;
      if (payrollsFetchingRef.current) return;
      payrollsFetchingRef.current = true;
      if (!silent) setPayrollsLoading(true);
      try {
        const res = await fetch(`${BASE}/api/payroll`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setPayrolls(
            (data.records || []).map((rec) => ({ ...rec, id: rec.payrollId })),
          );
          setPayrollsFetched(true);
        }
      } catch (err) {
        console.error("DataContext: fetchPayrolls error", err);
      } finally {
        if (!silent) setPayrollsLoading(false);
        payrollsFetchingRef.current = false;
      }
    },
    [user?.token, payrollsFetched],
  );

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsFetched, setAnnouncementsFetched] = useState(false);
  const announcementsFetchingRef = useRef(false);

  const fetchAnnouncements = useCallback(
    async (force = false, silent = false) => {
      if (!user?.token) return;
      if (!force && announcementsFetched) return;
      if (announcementsFetchingRef.current) return;
      announcementsFetchingRef.current = true;
      if (!silent) setAnnouncementsLoading(true);
      try {
        const res = await fetch(`${BASE}/api/announcements`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setAnnouncements(data.announcements || []);
          setAnnouncementsFetched(true);
        }
      } catch (err) {
        console.error("DataContext: fetchAnnouncements error", err);
      } finally {
        if (!silent) setAnnouncementsLoading(false);
        announcementsFetchingRef.current = false;
      }
    },
    [user?.token, announcementsFetched],
  );

  // Clear cached data when the admin logs out so the next login starts clean.
  useEffect(() => {
    if (user?.token) return;
    setEmployees([]);
    setEmployeesFetched(false);
    setPayrolls([]);
    setPayrollsFetched(false);
    setAnnouncements([]);
    setAnnouncementsFetched(false);
  }, [user?.token]);

  const value = useMemo(
    () => ({
      employees,
      setEmployees,
      employeesLoading,
      fetchEmployees,
      payrolls,
      setPayrolls,
      payrollsLoading,
      fetchPayrolls,
      announcements,
      setAnnouncements,
      announcementsLoading,
      fetchAnnouncements,
    }),
    [
      employees,
      employeesLoading,
      fetchEmployees,
      payrolls,
      payrollsLoading,
      fetchPayrolls,
      announcements,
      announcementsLoading,
      fetchAnnouncements,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used inside <DataProvider>");
  }
  return context;
};
