import { useState, useEffect } from 'react';
import { getUnits } from '../api/units';
import { bulkRecordPayments, exportPaymentsCsv, getPayments } from '../api/payments';
import { Plus, Trash2, Download, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

const STATUS_ICON = {
  matched: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  underpaid: <AlertCircle className="h-4 w-4 text-amber-600" />,
  overpaid: <AlertCircle className="h-4 w-4 text-blue-600" />,
  unmatched: <XCircle className="h-4 w-4 text-red-600" />,
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Rent</h1>
          <p className="mt-1 text-sm text-slate-500">Record monthly payments and export rent roll</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Bulk record rent</h2>

        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={row.unit_id}
                onChange={(e) => updateRow(index, 'unit_id', e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
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
                className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
              <input
                type="month"
                value={row.month_covered}
                onChange={(e) => updateRow(index, 'month_covered', e.target.value)}
                className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
              <button
                onClick={() => removeRow(index)}
                disabled={rows.length === 1}
                className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <Plus className="h-4 w-4" />
            Add row
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? 'Recording...' : 'Record Payments'}
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {result && (
          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <p className="mb-2 text-sm font-medium text-slate-900">{result.message}</p>
            <div className="flex gap-4 text-sm">
              {Object.entries(result.summary).map(([status, count]) => (
                <div key={status} className="flex items-center gap-1.5">
                  {STATUS_ICON[status]}
                  <span className="text-slate-600">
                    {count} {STATUS_LABEL[status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Payment history</h2>
        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
            <p className="text-sm text-slate-500">No payments recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-500">Unit</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Month</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Expected</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Paid</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{p.unit_number}</td>
                    <td className="px-4 py-3 text-slate-600">{p.month_covered}</td>
                    <td className="px-4 py-3 text-slate-600">
                      ₹{p.expected_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      ₹{p.amount_paid.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        {STATUS_ICON[p.match_status]}
                        <span className="text-slate-600">{STATUS_LABEL[p.match_status]}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}