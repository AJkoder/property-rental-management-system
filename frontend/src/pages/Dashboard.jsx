import { useState, useEffect } from 'react';
import { getDashboardSummary } from '../api/dashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import {
  Building2,
  Wrench,
  CheckCircle2,
  IndianRupee,
  AlertTriangle,
  Users,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

const STATUS_COLORS = {
  Reported: '#9b9fa6',
  Triaged: '#6153bd',
  Scheduled: '#6fcf9f',
  Resolved: '#1dbf73',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardSummary()
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[color:var(--ink-soft)]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--brand)] border-t-transparent" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-[color:var(--coral-tint)] px-4 py-3 text-sm text-[color:var(--coral)]">
        {error || 'No data available.'}
      </div>
    );
  }

  const statusChartData = Object.entries(data.maintenance.by_status).map(([status, count]) => ({
    name: status,
    value: count,
  }));
  const weeklyChartData = data.maintenance.resolved_per_week_last_8_weeks.map((w) => ({
    week: w.week_ending.slice(5),
    resolved: w.count,
  }));
  const contractorEntries = Object.entries(data.maintenance.by_contractor_open_only);
  const priorityEntries = Object.entries(data.maintenance.by_priority_open_only);
  const totalStatusCount = statusChartData.reduce((s, x) => s + x.value, 0);
  const occupancyPct = data.units.total > 0 ? Math.round((data.units.occupied / data.units.total) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-['Fraunces'] text-[28px] font-semibold leading-none text-[color:var(--ink)]">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
            Here&apos;s how your portfolio is doing this month.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--gold-tint)] px-3.5 py-1.5 text-xs font-semibold text-[color:var(--gold)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--gold)]" />
          {data.rent.current_month}
        </span>
      </div>

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Building2 className="h-5 w-5" />}
          value={data.units.total}
          label="Total Units"
          sub={`${occupancyPct}% occupied`}
          accent="gold"
        />
        <KpiCard
          icon={<Wrench className="h-5 w-5" />}
          value={data.maintenance.open_requests}
          label="Open Requests"
          sub="need attention"
          accent="coral"
        />
        <KpiCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          value={data.maintenance.resolved_this_week}
          label="Resolved"
          sub="last 7 days"
          accent="brand"
        />
        <KpiCard
          icon={<IndianRupee className="h-5 w-5" />}
          value={`₹${data.rent.total_collected_this_month.toLocaleString('en-IN')}`}
          label="Rent Collected"
          sub={`${data.rent.units_overdue_this_month} overdue`}
          accent="neutral"
        />
      </div>

      {/* Bento grid */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-[color:var(--ink)]/8 bg-[color:var(--surface)] p-6 shadow-[0_1px_2px_rgba(23,36,29,0.04)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">Portfolio Health</h2>
              <p className="text-sm text-[color:var(--ink-soft)]">Maintenance status distribution</p>
            </div>
            <TrendingUp className="h-4 w-4 text-[color:var(--ink-faint)]" />
          </div>

          {statusChartData.length === 0 ? (
            <p className="py-16 text-center text-sm text-[color:var(--ink-soft)]">No requests yet.</p>
          ) : (
            <div className="flex flex-col items-center gap-8 sm:flex-row">
              <div className="relative shrink-0">
                <ResponsiveContainer width={190} height={190}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {statusChartData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(23,36,29,0.08)',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-['Fraunces'] text-2xl font-semibold tabular-nums text-[color:var(--ink)]">
                    {totalStatusCount}
                  </span>
                  <span className="text-[11px] font-medium text-[color:var(--ink-faint)]">requests</span>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-3.5">
                {statusChartData.map((entry) => (
                  <div key={entry.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-[color:var(--ink)]/80">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name] }} />
                        {entry.name}
                      </span>
                      <span className="font-semibold tabular-nums text-[color:var(--ink)]">
                        {Math.round((entry.value / totalStatusCount) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--paper)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(entry.value / totalStatusCount) * 100}%`,
                          backgroundColor: STATUS_COLORS[entry.name],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-[color:var(--ink)]/8 bg-[color:var(--surface)] p-6 shadow-[0_1px_2px_rgba(23,36,29,0.04)]">
          <h2 className="mb-4 font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">Activity</h2>

          {data.rent.units_overdue_this_month > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-[color:var(--coral-tint)] px-3.5 py-3">
              <span className="flex items-center gap-2 text-sm font-medium text-[color:var(--coral)]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {data.rent.units_overdue_this_month} unit(s) overdue
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[color:var(--coral)]" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <ActivityStat value={`${occupancyPct}%`} label="Occupancy" />
            <ActivityStat value={data.rent.underpaid_count} label="Underpaid" />
            <ActivityStat value={data.units.vacant} label="Vacant" />
            <ActivityStat value={contractorEntries.length} label="Contractors" />
          </div>
        </div>
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-[color:var(--ink)]/8 bg-[color:var(--surface)] p-6 shadow-[0_1px_2px_rgba(23,36,29,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[color:var(--ink)]">Resolved per Week</h2>
            <span className="text-xs text-[color:var(--ink-faint)]">Last 8 weeks</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyChartData} barCategoryGap="30%">
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9b9fa6' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9b9fa6' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip
                cursor={{ fill: '#f6f4fb' }}
                contentStyle={{ borderRadius: 12, border: '1px solid rgba(23,36,29,0.08)', fontSize: 12 }}
              />
              <Bar dataKey="resolved" fill="#1dbf73" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-[color:var(--ink)]/8 bg-[color:var(--surface)] p-6 shadow-[0_1px_2px_rgba(23,36,29,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[color:var(--ink)]">By Priority &amp; Contractor</h2>
            <Users className="h-4 w-4 text-[color:var(--ink-faint)]" />
          </div>
          {priorityEntries.length === 0 && contractorEntries.length === 0 ? (
            <p className="py-8 text-center text-sm text-[color:var(--ink-soft)]">No open requests.</p>
          ) : (
            <div className="space-y-3">
              {priorityEntries.map(([priority, count]) => {
                const max = Math.max(...priorityEntries.map(([, c]) => c), ...contractorEntries.map(([, c]) => c), 1);
                return <MiniBar key={priority} label={priority} value={count} max={max} colorFrom="#6153bd" colorTo="#8a7dd4" />;
              })}
              {contractorEntries.map(([name, count]) => {
                const max = Math.max(...priorityEntries.map(([, c]) => c), ...contractorEntries.map(([, c]) => c), 1);
                return <MiniBar key={name} label={name} value={count} max={max} colorFrom="#1dbf73" colorTo="#6fcf9f" />;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, value, label, sub, accent }) {
  const styles = {
    neutral: 'bg-[color:var(--paper)] text-[color:var(--ink-soft)]',
    coral: 'bg-[color:var(--coral-tint)] text-[color:var(--coral)]',
    brand: 'bg-[color:var(--brand-tint)] text-[color:var(--brand-dark)]',
    gold: 'bg-[color:var(--gold-tint)] text-[color:var(--gold)]',
  };
  return (
    <div className="group rounded-2xl border border-[color:var(--ink)]/8 bg-[color:var(--surface)] p-5 shadow-[0_1px_2px_rgba(23,36,29,0.04)] transition hover:-translate-y-0.5 hover:border-[color:var(--ink)]/15 hover:shadow-[0_8px_24px_rgba(23,36,29,0.08)]">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${styles[accent]}`}>{icon}</div>
      <p className="truncate font-['Fraunces'] text-2xl font-semibold tabular-nums text-[color:var(--ink)]">{value}</p>
      <p className="mt-1 text-sm font-medium text-[color:var(--ink)]/80">{label}</p>
      <p className="mt-0.5 text-xs text-[color:var(--ink-faint)]">{sub}</p>
    </div>
  );
}

function ActivityStat({ value, label }) {
  return (
    <div className="rounded-xl bg-[color:var(--paper)] p-3">
      <p className="font-['Fraunces'] text-xl font-semibold tabular-nums text-[color:var(--ink)]">{value}</p>
      <p className="text-xs text-[color:var(--ink-soft)]">{label}</p>
    </div>
  );
}

function MiniBar({ label, value, max, colorFrom, colorTo }) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="truncate text-[color:var(--ink-soft)]">{label}</span>
        <span className="ml-2 shrink-0 font-semibold tabular-nums text-[color:var(--ink)]">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[color:var(--paper)]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundImage: `linear-gradient(to right, ${colorFrom}, ${colorTo})` }}
        />
      </div>
    </div>
  );
}