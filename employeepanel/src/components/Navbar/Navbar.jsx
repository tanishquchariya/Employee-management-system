import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Send,
  X,
} from "lucide-react";
import { clearEmployeeUser } from "../../auth/employeeAuth";
import { navbarStyles as s } from "../../assets/dummyStyles";

const tabs = [
  ["Dashboard", "/", LayoutDashboard],
  ["Attendance", "/attendance", CalendarCheck],
  ["Payslip", "/payslip", FileText],
  ["Leave", "/leave", Send],
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    setMenuOpen(false);
    clearEmployeeUser();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("touchstart", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("touchstart", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <header className={s.header} ref={menuRef}>
      <div className={s.container}>
        <NavLink to="/" className={s.logoLink} onClick={() => setMenuOpen(false)}>
          <span className={s.logoIconWrapper}>
            <Building2 className={s.logoIcon} />
          </span>
          <span className={s.logoTextWrapper}>
            <span className={s.logoText}>Employee Panel</span>
            <span className={s.logoSubtext}>Attendance & Payslips</span>
          </span>
        </NavLink>

        <nav className={s.desktopNav}>
          {tabs.map(([label, path, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) => s.getDesktopNavLinkClass(isActive)}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={s.actionWrapper}>
          <button type="button" onClick={handleLogout} className={s.logoutDesktop}>
            <LogOut size={16} />
            Logout
          </button>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className={s.menuToggle}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav
          className={`${s.mobileNavBase} ${menuOpen ? s.mobileNavOpen : s.mobileNavClosed}`}
        >
          {tabs.map(([label, path, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => s.getMobileNavLinkClass(isActive)}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          <button type="button" onClick={handleLogout} className={s.logoutMobile}>
            <LogOut size={16} />
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
