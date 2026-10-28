// Stores the signed-in employee ({ token, id, name, email, role, employeeId, joiningDate })
// in localStorage. The key matches the one App.jsx clears on a 401 response.
const STORAGE_KEY = "employee_panel_auth";

export const getEmployeeUser = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.token ? parsed : null;
  } catch {
    return null;
  }
};

export const setEmployeeUser = (user) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const clearEmployeeUser = () => {
  window.localStorage.removeItem(STORAGE_KEY);
};
