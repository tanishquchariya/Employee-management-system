import { useEffect, useMemo } from "react";
import { Bell, UsersRound, Wallet } from "lucide-react";
import { useData } from "../../context/DataContext";
import ChartsPage from "../ChartsPage/ChartsPage";
import {
  dashboardFilterOptions,
  dashboardStats,
  getDashboardValues,
} from "../../data/dashboardData";
import { dashboardPageStyles as s } from "../../assets/dummyStyles";

const icons = { employees: UsersRound, salary: Wallet, announcements: Bell };

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const DashboardPage = () => {
  const {
    employees,
    employeesLoading,
    fetchEmployees,
    payrolls,
    payrollsLoading,
    fetchPayrolls,
    announcements,
    announcementsLoading,
    fetchAnnouncements,
  } = useData();

  useEffect(() => {
    fetchEmployees();
    fetchPayrolls();
    fetchAnnouncements();
  }, [fetchEmployees, fetchPayrolls, fetchAnnouncements]);

  const filter = "monthly";
  const filterLabel =
    dashboardFilterOptions.find((option) => option.key === filter)?.label || "";

  // Salary expense = net salary of payslips generated for the current month.
  const salaryTotal = useMemo(() => {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return payrolls
      .filter((record) => String(record.salaryPeriod || record.payDate || "").startsWith(period))
      .reduce((sum, record) => sum + Number(record.netSalary || 0), 0);
  }, [payrolls]);

  const values = getDashboardValues({
    employeeCount: employees.length,
    salaryTotal,
    announcementCount: announcements.length,
    filter,
  });

  const loading = employeesLoading || payrollsLoading || announcementsLoading;

  const display = {
    employees: values.employees,
    salary: formatMoney(values.salary),
    announcements: values.announcements,
  };

  return (
    <>
      <main className={s.main}>
        <section className={s.section}>
          <div className={s.header}>
            <div>
              <p className={s.headerLabel}>Overview</p>
              <h1 className={s.headerTitle}>Dashboard</h1>
            </div>
          </div>

          {loading ? (
            <div className={s.skeletonGrid}>
              {dashboardStats.map((stat) => (
                <div key={stat.id} className={s.skeletonCard}>
                  <div className={s.skeletonTop}>
                    <div className={s.skeletonIcon} />
                    <div className={s.skeletonBadge} />
                  </div>
                  <div className={s.skeletonLine} />
                  <div className={s.skeletonValue} />
                  <div className={s.skeletonHelper} />
                </div>
              ))}
            </div>
          ) : (
            <div className={s.statsGrid}>
              {dashboardStats.map((stat, index) => {
                const Icon = icons[stat.icon] || UsersRound;
                return (
                  <article
                    key={stat.id}
                    className={s.statCard}
                    style={s.getAnimationDelay(index)}
                  >
                    <div className={s.statCardTop}>
                      <span className={s.statIcon}>
                        <Icon className={s.statIconSvg} />
                      </span>
                      <span className={s.statBadge}>{filterLabel}</span>
                    </div>
                    <p className={s.statLabel}>{stat.label}</p>
                    <p className={s.statValue}>{display[stat.id]}</p>
                    <p className={s.statHelper}>{stat.helper}</p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <ChartsPage loading={loading} />
    </>
  );
};

export default DashboardPage;
