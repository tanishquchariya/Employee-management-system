import { useContext } from "react";
import { AuthContext } from "./AuthContext";

// Returns { user, login, logout }. `user` is null when logged out, otherwise
// { token, id, name, email, role }.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
};
