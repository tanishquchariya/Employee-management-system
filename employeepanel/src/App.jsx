import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import { getEmployeeUser } from "./auth/employeeAuth";

// Everything except /login requires a signed-in employee.
const RequireAuth = ({ children }) =>
  getEmployeeUser() ? children : <Navigate to="/login" replace />;

// const RequireAuth = ({ children }) => children;

const App = () => {
  // An expired or invalid token (401) on any API call signs the employee out.
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const url = String(args[0]?.url || args[0]);
      if (response.status === 401 && !url.includes("/api/auth/login")) {
        localStorage.removeItem("employee_panel_auth");
        window.location.href = "/login";
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="*"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
    </Routes>
  );
};

export default App;
