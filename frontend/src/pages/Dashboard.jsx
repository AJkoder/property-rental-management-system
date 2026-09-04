import { useState, useEffect } from 'react';
import { getDashboardSummary } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Building2,
  Wrench,
  CheckCircle2,
  IndianRupee,
  AlertTriangle,
  Users,
  ChevronRight,
  TrendingUp,
  Home,
  Clock3,
} from 'lucide-react';

const STATUS_COLORS = {
  Reported: '#8b8792',
  Triaged: '#8177d8',
  Scheduled: '#d6ad4d',
  Resolved: '#54b889',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'manager') {
      setLoading(false);
      return;
    }

    getDashboardSummary()
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-[color:var(--ink-soft)]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--brand)] border-t-transparent" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (user?.role !== 'manager') {
    return <Navigate to="/requests" replace />;
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-[color:var(--red)]/20 bg-[color:var(--red-tint)] px-5 py-4 text-sm text-[color:var(--red)]">
        {error || 'No dashboard data available.'}
      </div>
    );
  }

  const statusChartData = Object.entries(
    data.maintenance.by_status || {}
  ).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const weeklyChartData = (
    data.maintenance.resolved_per_week_last_8_weeks || []
  ).map((item) => ({
    week: item.week_ending.slice(5),
    resolved: item.count,
  }));

  const contractorEntries = Object.entries(
    data.maintenance.by_contractor_open_only || {}
  );

  const priorityEntries = Object.entries(
    data.maintenance.by_priority_open_only || {}
  );

  const totalStatusCount = statusChartData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const occupancyPct =
    data.units.total > 0
      ? Math.round((data.units.occupied / data.units.total) * 100)
      : 0;

  const overdueCount = data.rent.units_overdue_this_month || 0;
  const underpaidCount = data.rent.underpaid_count || 0;
  const vacantCount = data.units.vacant || 0;
  const openRequests = data.maintenance.open_requests || 0;
  const resolvedThisWeek = data.maintenance.resolved_this_week || 0;

  const urgentEntry = priorityEntries.find(
    ([priority]) => priority.toLowerCase() === 'urgent'
  );

  const urgentCount = urgentEntry ? urgentEntry[1] : 0;

  const attentionCount = overdueCount + urgentCount + vacantCount;

  const healthGood =
    overdueCount === 0 && urgentCount === 0 && underpaidCount === 0;

  const currentHour = new Date().getHours();

  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 17
        ? 'Good afternoon'
        : 'Good evening';

  return (
    <div className="mx-auto w-full max-w-[1500px] pb-8">
      <section className="mb-6 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
        <div className="flex flex-col gap-6 px-6 py-6 sm:px-7 sm:py-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[color:var(--brand)]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-faint)]">
                Portfolio overview
              </span>
            </div>

            <h1 className="font-['Fraunces'] text-[30px] font-semibold leading-tight tracking-tight text-[color:var(--ink)]">
              {greeting}
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-5 text-[color:var(--ink-soft)]">
              A quick view of your properties, rent collection, and
              maintenance activity.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3.5 py-2.5">
            <span
              className={`h-2 w-2 rounded-full ${
                healthGood
                  ? 'bg-[color:var(--green)]'
                  : 'bg-[color:var(--gold)]'
              }`}
            />

            <span className="text-xs font-medium text-[color:var(--ink)]">
              {healthGood ? 'Portfolio healthy' : 'Attention required'}
            </span>

            <span className="h-4 w-px bg-[color:var(--border)]" />

            <span className="text-xs text-[color:var(--ink-soft)]">
              {data.rent.current_month}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-[color:var(--border)] sm:grid-cols-4">
          <HeroStat
            value={data.units.total}
            label="Total units"
          />

          <HeroStat
            value={data.units.occupied}
            label="Occupied"
          />

          <HeroStat
            value={vacantCount}
            label="Vacant"
            warning={vacantCount > 0}
          />

          <HeroStat
            value={`${occupancyPct}%`}
            label="Occupancy"
          />
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<IndianRupee className="h-5 w-5" />}
          value={`₹${data.rent.total_collected_this_month.toLocaleString(
            'en-IN'
          )}`}
          label="Rent collected"
          sub={
            overdueCount > 0
              ? `${overdueCount} unit${overdueCount === 1 ? '' : 's'} overdue`
              : 'No overdue units'
          }
          accent="green"
        />

        <MetricCard
          icon={<Building2 className="h-5 w-5" />}
          value={`${occupancyPct}%`}
          label="Occupancy rate"
          sub={`${data.units.occupied} of ${data.units.total} units occupied`}
          accent="brand"
        />

        <MetricCard
          icon={<AlertTriangle className="h-5 w-5" />}
          value={overdueCount}
          label="Overdue rent"
          sub={
            overdueCount > 0
              ? 'Requires follow-up'
              : 'Everything is up to date'
          }
          accent={overdueCount > 0 ? 'red' : 'green'}
        />

        <MetricCard
          icon={<Wrench className="h-5 w-5" />}
          value={openRequests}
          label="Open maintenance"
          sub={
            urgentCount > 0
              ? `${urgentCount} urgent request${
                  urgentCount === 1 ? '' : 's'
                }`
              : 'Requests needing attention'
          }
          accent={urgentCount > 0 ? 'red' : 'gold'}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="min-w-0 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm sm:p-6 xl:col-span-3">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--red-tint)]">
                <AlertTriangle className="h-4 w-4 text-[color:var(--red)]" />
              </div>

              <div className="min-w-0">
                <h2 className="font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">
                  Needs your attention
                </h2>

                <p className="mt-0.5 text-xs text-[color:var(--ink-faint)]">
                  Items that may need action
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-lg bg-[color:var(--surface-2)] px-2.5 py-1 text-xs font-semibold tabular-nums text-[color:var(--ink-soft)]">
              {attentionCount}
            </span>
          </div>

          <div className="divide-y divide-[color:var(--border)]">
            <AttentionRow
              icon={<IndianRupee className="h-4 w-4" />}
              title="Overdue rent"
              description={
                overdueCount > 0
                  ? `${overdueCount} unit${
                      overdueCount === 1 ? '' : 's'
                    } have overdue rent`
                  : 'No units currently have overdue rent'
              }
              value={overdueCount}
              tone={overdueCount > 0 ? 'red' : 'green'}
              action={overdueCount > 0 ? 'Review payments' : 'All clear'}
              onClick={overdueCount > 0 ? () => navigate('/payments') : undefined}
            />

            <AttentionRow
              icon={<Wrench className="h-4 w-4" />}
              title="Open maintenance"
              description={
                openRequests > 0
                  ? `${openRequests} request${
                      openRequests === 1 ? '' : 's'
                    } still need attention`
                  : 'No open maintenance requests'
              }
              value={openRequests}
              tone={openRequests > 0 ? 'gold' : 'green'}
              action={openRequests > 0 ? 'View requests' : 'All clear'}
              onClick={openRequests > 0 ? () => navigate('/requests') : undefined}
            />

            <AttentionRow
              icon={<Clock3 className="h-4 w-4" />}
              title="Urgent maintenance"
              description={
                urgentCount > 0
                  ? `${urgentCount} request${
                      urgentCount === 1 ? '' : 's'
                    } marked urgent`
                  : 'No urgent maintenance requests'
              }
              value={urgentCount}
              tone={urgentCount > 0 ? 'red' : 'green'}
              action={urgentCount > 0 ? 'View urgent requests' : 'All clear'}
              onClick={urgentCount > 0 ? () => navigate('/requests') : undefined}
            />

            <AttentionRow
              icon={<Home className="h-4 w-4" />}
              title="Vacant units"
              description={
                vacantCount > 0
                  ? `${vacantCount} unit${
                      vacantCount === 1 ? '' : 's'
                    } currently vacant`
                  : 'All units are occupied'
              }
              value={vacantCount}
              tone={vacantCount > 0 ? 'gold' : 'green'}
              action={vacantCount > 0 ? 'View units' : 'Fully occupied'}
              onClick={vacantCount > 0 ? () => navigate('/units') : undefined}
            />
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-tint)]">
              <Building2 className="h-4 w-4 text-[color:var(--brand)]" />
            </div>

            <div>
              <h2 className="font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">
                Portfolio health
              </h2>

              <p className="mt-0.5 text-xs text-[color:var(--ink-faint)]">
                Occupancy at a glance
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-5">
            <div>
              <p className="font-['Fraunces'] text-[40px] font-semibold leading-none tabular-nums text-[color:var(--ink)]">
                {occupancyPct}%
              </p>

              <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                occupancy rate
              </p>
            </div>

            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[9px] border-[color:var(--surface-2)]">
              <div className="text-center">
                <p className="text-lg font-bold tabular-nums text-[color:var(--ink)]">
                  {data.units.occupied}
                </p>

                <p className="text-[10px] text-[color:var(--ink-faint)]">
                  occupied
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-[color:var(--ink-soft)]">
                Occupancy
              </span>

              <span className="font-semibold tabular-nums text-[color:var(--ink)]">
                {data.units.occupied} / {data.units.total}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-[color:var(--surface-2)]">
              <div
                className="h-full rounded-full bg-[color:var(--brand)] transition-all"
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <PortfolioStat
              value={data.units.total}
              label="Total units"
            />

            <PortfolioStat
              value={vacantCount}
              label="Vacant"
              tone={vacantCount > 0 ? 'gold' : 'green'}
            />
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--gold-tint)]">
              <Wrench className="h-4 w-4 text-[color:var(--gold)]" />
            </div>

            <div>
              <h2 className="font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">
                Maintenance overview
              </h2>

              <p className="mt-0.5 text-xs text-[color:var(--ink-faint)]">
                Current workload and resolution activity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[color:var(--ink-faint)]">
            <TrendingUp className="h-3.5 w-3.5" />
            Last 8 weeks
          </div>
        </div>

        <div className="mb-7 grid grid-cols-2 overflow-hidden rounded-xl border border-[color:var(--border)] sm:grid-cols-4">
          <MaintenanceStat
            value={openRequests}
            label="Open"
            tone="red"
          />

          <MaintenanceStat
            value={urgentCount}
            label="Urgent"
            tone="red"
          />

          <MaintenanceStat
            value={data.maintenance.by_status?.Scheduled || 0}
            label="Scheduled"
            tone="gold"
          />

          <MaintenanceStat
            value={resolvedThisWeek}
            label="Resolved this week"
            tone="green"
          />
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <div className="min-w-0">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[color:var(--ink)]">
                Request status
              </h3>

              <p className="mt-1 text-xs text-[color:var(--ink-faint)]">
                Distribution of current requests
              </p>
            </div>

            {statusChartData.length === 0 ? (
              <EmptyChart message="No maintenance requests yet." />
            ) : (
              <div className="flex flex-col items-center gap-7 sm:flex-row">
                <div className="relative shrink-0">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={82}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {statusChartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={STATUS_COLORS[entry.name] || '#8b8792'}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          fontSize: 12,
                          color: 'var(--ink)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-['Fraunces'] text-2xl font-semibold tabular-nums text-[color:var(--ink)]">
                      {totalStatusCount}
                    </span>

                    <span className="text-[10px] font-medium text-[color:var(--ink-faint)]">
                      requests
                    </span>
                  </div>
                </div>

                <div className="w-full min-w-0 space-y-3">
                  {statusChartData.map((entry) => {
                    const percentage =
                      totalStatusCount > 0
                        ? Math.round(
                            (entry.value / totalStatusCount) * 100
                          )
                        : 0;

                    return (
                      <div key={entry.name}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                          <span className="flex min-w-0 items-center gap-2 truncate text-[color:var(--ink-soft)]">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  STATUS_COLORS[entry.name] || '#8b8792',
                              }}
                            />
                            {entry.name}
                          </span>

                          <span className="shrink-0 font-semibold tabular-nums text-[color:var(--ink)]">
                            {entry.value}
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--surface-2)]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor:
                                STATUS_COLORS[entry.name] || '#8b8792',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[color:var(--ink)]">
                Resolution trend
              </h3>

              <p className="mt-1 text-xs text-[color:var(--ink-faint)]">
                Maintenance requests resolved each week
              </p>
            </div>

            {weeklyChartData.length === 0 ? (
              <EmptyChart message="No resolution history yet." />
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart
                  data={weeklyChartData}
                  barCategoryGap="30%"
                >
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 10, fill: '#77747f' }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#77747f' }}
                    axisLine={false}
                    tickLine={false}
                    width={24}
                  />

                  <Tooltip
                    cursor={{ fill: '#f3f2f7' }}
                    contentStyle={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      fontSize: 12,
                      color: 'var(--ink)',
                    }}
                  />

                  <Bar
                    dataKey="resolved"
                    fill="#54b889"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={26}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--green-tint)]">
              <IndianRupee className="h-4 w-4 text-[color:var(--green)]" />
            </div>

            <div>
              <h2 className="font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">
                Rent health
              </h2>

              <p className="mt-0.5 text-xs text-[color:var(--ink-faint)]">
                Payment activity for {data.rent.current_month}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <RentRow
              label="Collected this month"
              value={`₹${data.rent.total_collected_this_month.toLocaleString(
                'en-IN'
              )}`}
              tone="green"
            />

            <RentRow
              label="Units overdue"
              value={overdueCount}
              tone={overdueCount > 0 ? 'red' : 'green'}
            />

            <RentRow
              label="Underpaid units"
              value={underpaidCount}
              tone={underpaidCount > 0 ? 'gold' : 'green'}
            />
          </div>

          <div
            className={`mt-4 rounded-xl px-4 py-3 ${
              overdueCount > 0 || underpaidCount > 0
                ? 'bg-[color:var(--gold-tint)]'
                : 'bg-[color:var(--green-tint)]'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {overdueCount > 0 || underpaidCount > 0 ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--gold)]" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--green)]" />
              )}

              <p className="text-xs leading-5 text-[color:var(--ink-soft)]">
                {overdueCount > 0
                  ? `${overdueCount} unit${
                      overdueCount === 1 ? '' : 's'
                    } need rent follow-up.`
                  : underpaidCount > 0
                    ? `${underpaidCount} unit${
                        underpaidCount === 1 ? '' : 's'
                      } have an underpayment to review.`
                    : 'Rent collection looks clear for this month.'}
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-tint)]">
              <Users className="h-4 w-4 text-[color:var(--brand)]" />
            </div>

            <div>
              <h2 className="font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">
                Open workload
              </h2>

              <p className="mt-0.5 text-xs text-[color:var(--ink-faint)]">
                Current maintenance workload
              </p>
            </div>
          </div>

          {priorityEntries.length === 0 &&
          contractorEntries.length === 0 ? (
            <div className="flex min-h-[190px] flex-col items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--green-tint)]">
                <CheckCircle2 className="h-5 w-5 text-[color:var(--green)]" />
              </div>

              <p className="mt-3 text-sm font-semibold text-[color:var(--ink)]">
                No open workload
              </p>

              <p className="mt-1 max-w-xs text-xs leading-5 text-[color:var(--ink-soft)]">
                Everything is currently under control.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {priorityEntries.length > 0 && (
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-faint)]">
                    By priority
                  </p>

                  <div className="space-y-3">
                    {priorityEntries.map(([priority, count]) => {
                      const max = Math.max(
                        ...priorityEntries.map(([, value]) => value),
                        1
                      );

                      return (
                        <MiniBar
                          key={priority}
                          label={priority}
                          value={count}
                          max={max}
                          color={
                            priority.toLowerCase() === 'urgent'
                              ? '#e06b68'
                              : '#8177d8'
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {contractorEntries.length > 0 && (
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-faint)]">
                    By contractor
                  </p>

                  <div className="space-y-3">
                    {contractorEntries.slice(0, 4).map(([name, count]) => {
                      const max = Math.max(
                        ...contractorEntries.map(([, value]) => value),
                        1
                      );

                      return (
                        <MiniBar
                          key={name}
                          label={name}
                          value={count}
                          max={max}
                          color="#d6ad4d"
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HeroStat({ value, label, warning = false }) {
  return (
    <div className="border-r border-[color:var(--border)] px-5 py-4 last:border-r-0 sm:px-6">
      <p
        className={`font-['Fraunces'] text-2xl font-semibold tabular-nums ${
          warning
            ? 'text-[color:var(--gold)]'
            : 'text-[color:var(--ink)]'
        }`}
      >
        {value}
      </p>

      <p className="mt-1 truncate text-xs text-[color:var(--ink-faint)]">
        {label}
      </p>
    </div>
  );
}

function MetricCard({ icon, value, label, sub, accent }) {
  const styles = {
    brand: {
      box: 'bg-[color:var(--brand-tint)]',
      text: 'text-[color:var(--brand)]',
    },
    red: {
      box: 'bg-[color:var(--red-tint)]',
      text: 'text-[color:var(--red)]',
    },
    green: {
      box: 'bg-[color:var(--green-tint)]',
      text: 'text-[color:var(--green)]',
    },
    gold: {
      box: 'bg-[color:var(--gold-tint)]',
      text: 'text-[color:var(--gold)]',
    },
  };

  const style = styles[accent] || styles.brand;

  return (
    <div className="min-w-0 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm transition hover:shadow-md">
      <div
        className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl ${style.box} ${style.text}`}
      >
        {icon}
      </div>

      <p className="truncate font-['Fraunces'] text-[26px] font-semibold tabular-nums text-[color:var(--ink)]">
        {value}
      </p>

      <p className="mt-1 text-sm font-semibold text-[color:var(--ink-soft)]">
        {label}
      </p>

      <p className="mt-1 truncate text-xs text-[color:var(--ink-faint)]">
        {sub}
      </p>
    </div>
  );
}

function AttentionRow({
  icon,
  title,
  description,
  value,
  tone,
  action,
  onClick,
}) {
  const styles = {
    red: {
      icon: 'bg-[color:var(--red-tint)] text-[color:var(--red)]',
      value: 'bg-[color:var(--red-tint)] text-[color:var(--red)]',
      action: 'text-[color:var(--red)]',
    },
    gold: {
      icon: 'bg-[color:var(--gold-tint)] text-[color:var(--gold)]',
      value: 'bg-[color:var(--gold-tint)] text-[color:var(--gold)]',
      action: 'text-[color:var(--gold)]',
    },
    green: {
      icon: 'bg-[color:var(--green-tint)] text-[color:var(--green)]',
      value: 'bg-[color:var(--green-tint)] text-[color:var(--green)]',
      action: 'text-[color:var(--green)]',
    },
  };

  const style = styles[tone] || styles.green;

  return (
    <div className="flex min-w-0 items-center gap-3 py-3.5">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.icon}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[color:var(--ink)]">
          {title}
        </p>

        <p className="mt-0.5 truncate text-xs text-[color:var(--ink-soft)]">
          {description}
        </p>
      </div>

      <span
        className={`hidden min-w-8 rounded-lg px-2 py-1 text-center text-xs font-bold tabular-nums sm:inline-block ${style.value}`}
      >
        {value}
      </span>

      {onClick && action ? (
        <button
          type="button"
          onClick={onClick}
          className={`hidden shrink-0 items-center gap-1 text-xs font-semibold transition hover:opacity-70 sm:flex ${style.action}`}
        >
          {action}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function PortfolioStat({ value, label, tone = 'default' }) {
  const valueClass =
    tone === 'gold'
      ? 'text-[color:var(--gold)]'
      : tone === 'green'
        ? 'text-[color:var(--green)]'
        : 'text-[color:var(--ink)]';

  return (
    <div className="rounded-xl bg-[color:var(--surface-2)] px-3.5 py-3">
      <p
        className={`font-['Fraunces'] text-xl font-semibold tabular-nums ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-0.5 text-xs text-[color:var(--ink-soft)]">
        {label}
      </p>
    </div>
  );
}

function MaintenanceStat({ value, label, tone }) {
  const styles = {
    red: 'text-[color:var(--red)]',
    gold: 'text-[color:var(--gold)]',
    green: 'text-[color:var(--green)]',
  };

  return (
    <div className="min-w-0 border-b border-[color:var(--border)] px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p
        className={`font-['Fraunces'] text-2xl font-semibold tabular-nums ${
          styles[tone] || 'text-[color:var(--ink)]'
        }`}
      >
        {value}
      </p>

      <p className="mt-1 truncate text-xs text-[color:var(--ink-soft)]">
        {label}
      </p>
    </div>
  );
}

function RentRow({ label, value, tone }) {
  const valueClass =
    tone === 'red'
      ? 'text-[color:var(--red)]'
      : tone === 'gold'
        ? 'text-[color:var(--gold)]'
        : 'text-[color:var(--green)]';

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[color:var(--surface-2)] px-4 py-3.5">
      <span className="min-w-0 truncate text-sm text-[color:var(--ink-soft)]">
        {label}
      </span>

      <span className={`shrink-0 font-semibold tabular-nums ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="min-w-0 truncate text-[color:var(--ink-soft)]">
          {label}
        </span>

        <span className="shrink-0 font-semibold tabular-nums text-[color:var(--ink)]">
          {value}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--surface-2)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-[190px] items-center justify-center rounded-xl bg-[color:var(--surface-2)]">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-6 w-6 text-[color:var(--ink-faint)]" />

        <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
          {message}
        </p>
      </div>
    </div>
  );
}