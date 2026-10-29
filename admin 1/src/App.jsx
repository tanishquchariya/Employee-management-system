import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./auth/useAuth";
import { DataProvider } from "./context/DataContext";
import Navbar from "./components/Navbar/Navbar";
import LoginPage from "./components/LoginPage/LoginPage";
import DashboardPage from "./components/DashboardPage/DashboardPage";
import EmployeePage from "./components/EmployeePage/EmployeePage";
import AttendancePage from "./components/AttendancePage/AttendancePage";
import LeavesPage from "./components/LeavesPage/LeavesPage";
import PayRollPage from "./components/PayRollPage/PayRollPage";
import AnnouncementPage from "./components/AnnouncementPage/AnnouncementPage";
import EmployeeFormModal2 from "./components/EmployeePage/EmployeeFormModal2";

// Everything except /login requires a signed-in admin.
const ProtectedLayout = () => {
  const { user } = useAuth();
  if (!user?.token) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

const App = () => (
  <AuthProvider>
    <DataProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeePage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/leaves" element={<LeavesPage />} />
          <Route path="/payroll" element={<PayRollPage />} />
          <Route path="/announcements" element={<AnnouncementPage />} />

          {/* React Hook Form practice page */}
          {/* <Route path="/rhf-practice" element={<EmployeeFormModal2 />} /> */}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
  </AuthProvider>
);

export default App;
