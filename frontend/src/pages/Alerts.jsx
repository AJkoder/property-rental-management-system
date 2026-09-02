import { useState, useEffect } from 'react';
import { generateAlerts, getAlerts, dismissAlert } from '../api/alerts';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

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
    } catch (err) {
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
    } catch (err) {
      setError('Failed to dismiss alert.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Alerts</h1>
          <p className="mt-1 text-sm text-slate-500">Rent issues that need attention</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Checking...' : 'Check for new alerts'}
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading alerts...</p>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">No active alerts. Everything looks good.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {alert.unit_number} — {REASON_LABEL[alert.reason]}
                  </p>
                  <p className="text-xs text-slate-500">{alert.month_covered}</p>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(alert.id)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
                title="Dismiss"
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