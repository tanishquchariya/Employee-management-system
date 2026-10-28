import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  UserRound,
} from "lucide-react";
import { getEmployeeUser, setEmployeeUser } from "../../auth/employeeAuth";
import { loginPageStyles as s } from "../../assets/dummyStyles";

const BASE = "http://localhost:5000";

const features = [
  { icon: CalendarCheck, text: "Mark attendance and apply for leave" },
  { icon: FileText, text: "View and download your payslips" },
];

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (getEmployeeUser()) return <Navigate to="/" replace />;

  // Expected backend contract: POST /api/auth/login { email, password }
  // -> { success, token, user: { id, name, email, role, employeeId, joiningDate } }
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.token) {
        setError(data.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      const profile = data.user || data;
      if (profile.role === "admin") {
        setError("Admin accounts must sign in through the admin panel.");
        setLoading(false);
        return;
      }

      setEmployeeUser({
        token: data.token,
        id: profile.id || profile._id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        employeeId: profile.employeeId,
        joiningDate: profile.joiningDate,
      });
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(
        "Unable to connect to the server. Please check your connection.",
      );
      setLoading(false);
    }
  };

  return (
    <main className={s.mainContainer}>
      <section className={s.section}>
        <div className={s.leftPanel}>
          <span className={s.leftPanelIcon}>
            <Building2 size={28} />
          </span>
          <p className={s.leftPanelLabel}>Employee Panel</p>
          <h1 className={s.leftPanelTitle}>Your work life, all in one place.</h1>
          <div className={s.leftPanelFeatures}>
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className={s.featureItem}>
                <Icon size={18} className="mb-2" />
                {text}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          <span className={s.formIcon}>
            <UserRound size={22} />
          </span>
          <p className={s.formLabel}>Welcome back</p>
          <h2 className={s.formTitle}>Employee Login</h2>

          {error && <div className={s.errorBox}>{error}</div>}

          <label className={s.inputLabel}>
            <span className={s.inputLabelText}>Work Email</span>
            <div className={s.inputWrapper}>
              <Mail className={s.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={s.inputField}
                placeholder="you@company.com"
                autoComplete="username"
              />
            </div>
          </label>

          <label className={s.inputLabel}>
            <span className={s.inputLabelText}>Password</span>
            <div className={s.inputWrapper}>
              <Lock className={s.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={s.inputField}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className={s.passwordToggle}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button
            disabled={loading}
            className={s.submitButton}
          >
            {loading ? (
              <>
                <svg
                  className={s.spinner}
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
                Logging in...
              </>
            ) : (
              <>
                Login
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
};

export default Login;
