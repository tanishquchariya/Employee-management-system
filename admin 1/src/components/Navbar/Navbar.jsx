import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BadgeDollarSign,
  Bell,
  Building2,
  CalendarCheck,
  CalendarOff,
  LayoutDashboard,
  LogOut,
  Menu,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { adminNavbarStyles as s } from "../../assets/dummyStyles";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Employee", icon: UsersRound, href: "/employees" },
  { label: "Attendance", icon: CalendarCheck, href: "/attendance" },
  { label: "Leave", icon: CalendarOff, href: "/leaves" },
  { label: "Payroll", icon: BadgeDollarSign, href: "/payroll" },
  { label: "Announcements", icon: Bell, href: "/announcements" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
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
      <div className={s.headerGlow} />
      <div className={s.headerLine} />

      <nav className={s.nav}>
        <NavLink to="/" className={s.logoLink} onClick={() => setMenuOpen(false)}>
          <span className={s.logoIconWrapper}>
            <Building2 className={s.logoIcon} />
          </span>
          <span className={s.logoTextWrapper}>
            <span className={s.logoText}>EMS Admin</span>
            <span className={s.logoSubtext}>Employee Management</span>
          </span>
        </NavLink>

        <div className={s.desktopNavWrapper}>
          {navItems.map(({ label, icon: Icon, href }) => (
            <NavLink key={href} to={href} end={href === "/"}>
              {({ isActive }) => (
                <span className={s.getDesktopNavLinkClass(isActive)}>
                  <Icon className={s.getDesktopIconClass(isActive)} />
                  {label}
                  {isActive && <span className={s.activeDotDesktop} />}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div className={s.actionWrapper}>
          <button type="button" onClick={handleLogout} className={s.logoutDesktop}>
            <LogOut className={s.logoutIcon} />
            Logout
          </button>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className={s.menuToggle}
          >
            {menuOpen ? <X className={s.menuIcon} /> : <Menu className={s.menuIcon} />}
          </button>
        </div>
      </nav>

      <div className={s.getMobileMenuClass(menuOpen)}>
        <div className={s.mobileMenuGrid}>
          {navItems.map(({ label, icon: Icon, href }) => (
            <NavLink
              key={href}
              to={href}
              end={href === "/"}
              onClick={() => setMenuOpen(false)}
            >
              {({ isActive }) => (
                <span className={s.getMobileNavLinkClass(isActive)}>
                  <Icon className={s.getMobileIconClass(isActive)} />
                  {label}
                  {isActive && <span className={s.activeDotMobile} />}
                </span>
              )}
            </NavLink>
          ))}
          <button type="button" onClick={handleLogout} className={s.logoutMobile}>
            <LogOut className={s.logoutIcon} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
