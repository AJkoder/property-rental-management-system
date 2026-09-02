import { useState, useEffect } from 'react';
import { getDashboardSummary } from '../api/dashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Building2, Wrench, CheckCircle2, AlertTriangle } from 'lucide-react';

const STATUS_COLORS = {
  Reported: '#94a3b8',
  Triaged: '#3b82f6',
  Scheduled: '#f59e0b',
  Resolved: '#22c55e',
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
    return <p className="text-sm text-slate-400">Loading dashboard...</p>;
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || 'No data available.'}
      </div>
    );
  }

  const statusChartData = Object.entries(data.maintenance.by_status).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Portfolio overview</p>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Total Units"
          value={data.units.total}
          sub={`${data.units.occupied} occupied · ${data.units.vacant} vacant`}
        />
        <StatCard
          icon={<Wrench className="h-5 w-5" />}
          label="Open Requests"
          value={data.maintenance.open_requests}
          sub="Reported, Triaged, or Scheduled"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Resolved This Week"
          value={data.maintenance.resolved_this_week}
          sub="Last 7 days"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Rent Issues"
          value={data.rent.underpaid_count + data.rent.units_with_no_payment_recorded}
          sub={`${data.rent.current_month} · underpaid or unrecorded`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Requests by Status</h2>
          {statusChartData.length === 0 ? (
            <p className="text-sm text-slate-400">No requests yet.</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {statusChartData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {statusChartData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[entry.name] }}
                    />
                    <span className="text-slate-600">{entry.name}</span>
                    <span className="font-medium text-slate-900">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Open Requests by Priority</h2>
          {Object.keys(data.maintenance.by_priority_open_only).length === 0 ? (
            <p className="text-sm text-slate-400">No open requests.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.maintenance.by_priority_open_only).map(([priority, count]) => {
                const max = Math.max(...Object.values(data.maintenance.by_priority_open_only));
                const pct = (count / max) * 100;
                return (
                  <div key={priority}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-600">{priority}</span>
                      <span className="font-medium text-slate-900">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-slate-400">{icon}</div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
    </div>
  );
}