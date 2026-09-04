import { useState, useEffect } from 'react';
import { generateAlerts, getAlerts, dismissAlert } from '../api/alerts';
import { AlertTriangle, RefreshCw, X, Bell } from 'lucide-react';

const REASON_LABEL = {
  no_payment: 'No payment recorded',
  underpaid: 'Underpaid',
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await getAlerts();
      setAlerts(res.data.alerts);
    } catch {
      setError('Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setMessage('');

    try {
      const res = await generateAlerts();
      setMessage(res.data.message);
      loadAlerts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate alerts.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await dismissAlert(id);
      setAlerts(alerts.filter((a) => a.id !== id));
    } catch {
      setError('Failed to dismiss alert.');
    }
  };

  return (
    <div>
      <div className="mb-7 flex items-end justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600">
            <Bell className="h-5 w-5 text-white" />
          </div>

          <div>
            <h1 className="font-['Fraunces'] text-[28px] font-semibold leading-none text-[color:var(--ink)]">
              Alerts
            </h1>

            <p className="mt-1.5 text-sm text-[color:var(--ink-soft)]">
              Rent issues that need attention
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 rounded-xl bg-[color:var(--brand)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[color:var(--brand-dark)] disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`}
          />
          {generating ? 'Checking...' : 'Check for new alerts'}
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-xl bg-[color:var(--brand-tint)] px-4 py-3 text-sm text-[color:var(--brand)]">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-[color:var(--red-tint)] px-4 py-3 text-sm text-[color:var(--red)]">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[color:var(--ink-soft)]">
          Loading alerts...
        </p>
      ) : alerts.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] text-center">
          <ClearStamp />

          <p className="mt-4 text-sm text-[color:var(--ink-soft)]">
            No active alerts. Everything looks good.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-[color:var(--red)]/25 bg-[color:var(--red-tint)] py-3.5 pl-8 pr-4"
            >
              <div
                className="absolute inset-y-0 left-0 w-2 bg-[color:var(--red)]"
                style={{
                  maskImage:
                    'radial-gradient(circle at 4px 6px, transparent 3px, black 3.5px)',
                  maskSize: '8px 12px',
                  maskRepeat: 'repeat-y',
                  WebkitMaskImage:
                    'radial-gradient(circle at 4px 6px, transparent 3px, black 3.5px)',
                  WebkitMaskSize: '8px 12px',
                  WebkitMaskRepeat: 'repeat-y',
                }}
              />

              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-[color:var(--red)]" />

                <div>
                  <p className="text-sm font-medium text-[color:var(--ink)]">
                    {alert.unit_number} — {REASON_LABEL[alert.reason]}
                  </p>

                  <p className="text-xs text-[color:var(--ink-soft)]">
                    {alert.month_covered}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDismiss(alert.id)}
                className="rounded-lg p-1.5 text-[color:var(--ink-faint)] transition hover:bg-[color:var(--surface)] hover:text-[color:var(--red)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--red)]/40"
                title="Dismiss"
                aria-label={`Dismiss alert for ${alert.unit_number}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClearStamp() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      className="opacity-90"
      style={{ transform: 'rotate(-6deg)' }}
    >
      <circle
        cx="32"
        cy="32"
        r="30"
        stroke="var(--green)"
        strokeWidth="2"
      />

      <circle
        cx="32"
        cy="32"
        r="24"
        stroke="var(--green)"
        strokeWidth="1.5"
        strokeDasharray="3 4"
      />

      <path
        d="M21 33.5L28 40L43 24"
        stroke="var(--green)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
