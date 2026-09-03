import { useState, useEffect } from 'react';
import { getUnits } from '../api/units';
import { bulkRecordPayments, exportPaymentsCsv, getPayments } from '../api/payments';
import { Plus, Trash2, Download, CheckCircle2, AlertCircle, XCircle, IndianRupee } from 'lucide-react';

const STATUS_STYLE = {
  matched: { icon: CheckCircle2, text: 'text-[color:var(--green)]' },
  underpaid: { icon: AlertCircle, text: 'text-[color:var(--gold)]' },
  overpaid: { icon: AlertCircle, text: 'text-[color:var(--ink-soft)]' },
  unmatched: { icon: XCircle, text: 'text-[color:var(--red)]' },
};

const STATUS_LABEL = {
  matched: 'Matched',
  underpaid: 'Underpaid',
  overpaid: 'Overpaid',
  unmatched: 'Unmatched',
};

const currentMonth = new Date().toISOString().slice(0, 7);

export default function Payments() {
  const [units, setUnits] = useState([]);
  const [rows, setRows] = useState([{ unit_id: '', amount_paid: '', month_covered: currentMonth }]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getUnits().then((res) => setUnits(res.data.units));
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getPayments();
    setHistory(res.data.payments);
  };

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, { unit_id: '', amount_paid: '', month_covered: currentMonth }]);
  };

  const removeRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError('');
    setResult(null);
    setSubmitting(true);
    try {
      const validRows = rows.filter((r) => r.unit_id && r.amount_paid && r.month_covered);
      const res = await bulkRecordPayments(validRows);
      setResult(res.data);
      setRows([{ unit_id: '', amount_paid: '', month_covered: currentMonth }]);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payments.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportPaymentsCsv();
    } catch (err) {
      setError('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const totalCollected = history.reduce((s, p) => s + p.amount_paid, 0);
  const statusCounts = history.reduce((acc, p) => {
    acc[p.match_status] = (acc[p.match_status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="mb-7 flex items-end justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--brand)]">
            <IndianRupee className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-['Fraunces'] text-[28px] font-semibold leading-none text-[color:var(--ink)]">
              Rent
            </h1>
            <p className="mt-1.5 text-sm text-[color:var(--ink-soft)]">
              Record monthly payments and export the rent roll
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2.5 text-sm font-medium text-[color:var(--ink)] transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand)] disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Stat strip */}
      {history.length > 0 && (
        <div className="mb-7 grid grid-cols-4 gap-4">
          <StatCard label="Collected this period" value={`₹${totalCollected.toLocaleString('en-IN')}`} accent="gold" />
          <StatCard label="Matched" value={statusCounts.matched || 0} accent="green" />
          <StatCard label="Underpaid" value={statusCounts.underpaid || 0} accent="gold" />
          <StatCard label="Unmatched" value={statusCounts.unmatched || 0} accent="red" />
        </div>
      )}

      {/* Bulk entry — receipt card */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] pt-6">
        <div
          className="absolute inset-x-0 top-0 h-2 bg-[color:var(--brand)]"
          style={{
            maskImage: 'radial-gradient(circle at 6px 4px, transparent 3px, black 3.5px)',
            maskSize: '12px 8px',
            maskRepeat: 'repeat-x',
            WebkitMaskImage: 'radial-gradient(circle at 6px 4px, transparent 3px, black 3.5px)',
            WebkitMaskSize: '12px 8px',
            WebkitMaskRepeat: 'repeat-x',
          }}
        />
        <div className="px-6 pb-6">
          <h2 className="mb-4 font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">
            Bulk record rent
          </h2>

          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={row.unit_id}
                  onChange={(e) => updateRow(index, 'unit_id', e.target.value)}
                  className="flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
                >
                  <option value="">Select unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unit_number}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Amount paid"
                  value={row.amount_paid}
                  onChange={(e) => updateRow(index, 'amount_paid', e.target.value)}
                  className="w-36 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2.5 text-sm tabular-nums text-[color:var(--ink)] outline-none focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
                />
                <input
                  type="month"
                  value={row.month_covered}
                  onChange={(e) => updateRow(index, 'month_covered', e.target.value)}
                  className="w-40 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
                />
                <button
                  onClick={() => removeRow(index)}
                  disabled={rows.length === 1}
                  aria-label="Remove row"
                  className="rounded-lg p-2 text-[color:var(--ink-faint)] transition hover:bg-[color:var(--red-tint)] hover:text-[color:var(--red)] disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-dashed border-[color:var(--border)] pt-4">
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 text-sm font-medium text-[color:var(--brand)] hover:text-[color:var(--brand-dark)]"
            >
              <Plus className="h-4 w-4" />
              Add row
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-[color:var(--brand)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[color:var(--brand-dark)] disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record payments'}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-[color:var(--red-tint)] px-4 py-2.5 text-sm text-[color:var(--red)]">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 rounded-xl bg-[color:var(--brand-tint)] p-4">
              <p className="mb-2 text-sm font-medium text-[color:var(--ink)]">{result.message}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                {Object.entries(result.summary).map(([status, count]) => {
                  const { icon: Icon, text } = STATUS_STYLE[status];
                  return (
                    <div key={status} className="flex items-center gap-1.5">
                      <Icon className={`h-4 w-4 ${text}`} />
                      <span className="text-[color:var(--ink-soft)]">
                        {count} {STATUS_LABEL[status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History — ledger table */}
      <div>
        <h2 className="mb-3 font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">
          Payment history
        </h2>
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] py-14 text-center">
            <p className="text-sm text-[color:var(--ink-soft)]">No payments recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-2)]/60">
                  <th className="px-5 py-3 text-xs font-semibold text-[color:var(--ink-faint)]">Unit</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[color:var(--ink-faint)]">Month</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-[color:var(--ink-faint)]">Expected</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-[color:var(--ink-faint)]">Paid</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[color:var(--ink-faint)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p, i) => {
                  const { icon: Icon, text } = STATUS_STYLE[p.match_status];
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-[color:var(--border)] last:border-0 ${i % 2 === 1 ? 'bg-[color:var(--surface-2)]/40' : ''}`}
                    >
                      <td className="px-5 py-3.5 font-medium text-[color:var(--ink)]">{p.unit_number}</td>
                      <td className="px-5 py-3.5 text-[color:var(--ink-soft)]">{p.month_covered}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-[color:var(--ink-soft)]">
                        ₹{p.expected_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums font-medium text-[color:var(--ink)]">
                        ₹{p.amount_paid.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1.5">
                          <Icon className={`h-4 w-4 ${text}`} />
                          <span className="text-[color:var(--ink-soft)]">{STATUS_LABEL[p.match_status]}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  const accentColor = { green: 'var(--green)', gold: 'var(--gold)', red: 'var(--red)' }[accent];
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <p className="font-['Fraunces'] text-2xl font-semibold tabular-nums" style={{ color: accentColor }}>
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-[color:var(--ink-soft)]">{label}</p>
    </div>
  );
}