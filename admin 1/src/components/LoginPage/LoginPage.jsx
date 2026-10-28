import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  UsersRound,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { adminLoginPageStyles as s } from "../../assets/dummyStyles";

const features = [
  { icon: UsersRound, text: "Manage employee records" },
  { icon: CalendarCheck, text: "Track attendance and leaves" },
  { icon: Wallet, text: "Generate payroll and payslips" },
];

const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user?.token) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!email.trim()  || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.success) {
      navigate("/", { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <main className={s.main}>
      <div className={s.gradientBg} style={s.gradientStyle} />

      <section className={s.section}>
        <div className={s.leftPanel}>
          <div className={s.leftPanelHeader}>
            <span className={s.leftPanelLogo}>
              <Building2 className={s.logoIcon} />
            </span>
            <div>
              <p className={s.leftPanelTitle}>EMS Admin</p>
              <p className={s.leftPanelSubtitle}>Employee Management System</p>
            </div>
          </div>
          <h1 className={s.leftPanelHeading}>Run your workforce from one place.</h1>
          <p className={s.leftPanelDescription}>
            Sign in with your administrator account to manage employees,
            attendance, payroll and announcements.
          </p>
          <div className={s.featureGrid}>
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className={s.featureCard}>
                <Icon className={s.featureIcon} />
                <span className={s.featureText}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.formHeader}>
            <div className={s.formHeaderLeft}>
              <span className={s.formHeaderIcon}>
                <ShieldCheck className={s.formHeaderIconSvg} />
              </span>
              <div>
                <p className={s.formHeaderLabel}>Welcome back</p>
                <h2 className={s.formHeaderTitle}>Admin Login</h2>
              </div>
            </div>
            <span className={s.adminBadge}>Admin</span>
          </div>

          {error && <div className={s.errorBox}>{error}</div>}

          <label className={s.inputLabel}>
            <span className={s.inputLabelText}>Email</span>
            <div className={s.inputWrapper}>
              <Mail className={s.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={s.inputField}
                placeholder="admin@company.com"
                autoComplete="username"
              />
            </div>
          </label>

          <label className={s.passwordLabel}>
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
                {showPassword ? (
                  <EyeOff className={s.passwordToggleIcon} />
                ) : (
                  <Eye className={s.passwordToggleIcon} />
                )}
              </button>
            </div>
          </label>

          <button type="submit" disabled={loading} className={s.submitButton}>
            {loading ? (
              <>
                <svg className={s.spinner} fill="none" viewBox="0 0 24 24">
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
                <ArrowRight className={s.submitIcon} />
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
};

export default LoginPage;
