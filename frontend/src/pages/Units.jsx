import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUnits, createUnit, updateUnit, archiveUnit, restoreUnit } from '../api/units';
import { Plus, Archive, RotateCcw, Pencil, X, Building2, MapPin } from 'lucide-react';

export default function Units() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  const loadUnits = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getUnits(showArchived);
      setUnits(res.data.units);
    } catch (err) {
      setError('Failed to load units.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, [showArchived]);

  const handleArchiveToggle = async (unit) => {
    try {
      if (unit.is_archived) {
        await restoreUnit(unit.id);
      } else {
        await archiveUnit(unit.id);
      }
      loadUnits();
    } catch (err) {
      setError('Action failed. Please try again.');
    }
  };

  const openCreateModal = () => {
    setEditingUnit(null);
    setModalOpen(true);
  };

  const openEditModal = (unit) => {
    setEditingUnit(unit);
    setModalOpen(true);
  };

  const activeCount = units.filter((u) => !u.is_archived).length;
  const totalRent = units.filter((u) => !u.is_archived).reduce((s, u) => s + u.rent_amount, 0);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Units</h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeCount} active {activeCount === 1 ? 'unit' : 'units'} · ₹{totalRent.toLocaleString('en-IN')} monthly rent roll
          </p>
        </div>
        {isManager && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-indigo-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-900"
          >
            <Plus className="h-4 w-4" />
            Add Unit
          </button>
        )}
      </div>

      <div className="mb-4 flex items-center gap-2">
        <FilterChip active={!showArchived} onClick={() => setShowArchived(false)}>
          Active
        </FilterChip>
        {isManager && (
          <FilterChip active={showArchived} onClick={() => setShowArchived(true)}>
            Show archived
          </FilterChip>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading units...</p>
      ) : units.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">No units yet.</p>
          {isManager && (
            <button onClick={openCreateModal} className="mt-2 text-sm font-medium text-indigo-700 hover:underline">
              Add your first unit
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Unit</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Tenant</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Rent</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                {isManager && <th className="px-5 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id} className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-700">
                        {unit.unit_number.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{unit.unit_number}</p>
                        <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {unit.address}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {unit.tenant_name || <span className="text-slate-400">Vacant</span>}
                  </td>
                  <td className="px-5 py-4 text-right font-medium tabular-nums text-slate-900">
                    ₹{unit.rent_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        unit.is_archived ? 'bg-slate-100 text-slate-500' : 'bg-green-50 text-green-700'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${unit.is_archived ? 'bg-slate-400' : 'bg-green-500'}`} />
                      {unit.is_archived ? 'Archived' : 'Active'}
                    </span>
                  </td>
                  {isManager && (
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(unit)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleArchiveToggle(unit)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          title={unit.is_archived ? 'Restore' : 'Archive'}
                        >
                          {unit.is_archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <UnitModal
          unit={editingUnit}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            loadUnits();
          }}
        />
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? 'bg-indigo-950 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

function UnitModal({ unit, onClose, onSaved }) {
  const [unitNumber, setUnitNumber] = useState(unit?.unit_number || '');
  const [address, setAddress] = useState(unit?.address || '');
  const [rentAmount, setRentAmount] = useState(unit?.rent_amount || '');
  const [tenantName, setTenantName] = useState(unit?.tenant_name || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      unit_number: unitNumber,
      address,
      rent_amount: parseFloat(rentAmount),
      tenant_name: tenantName || null,
    };

    try {
      if (unit) {
        await updateUnit(unit.id, payload);
      } else {
        await createUnit(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save unit.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{unit ? 'Edit Unit' : 'Add Unit'}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Unit number</label>
            <input
              type="text"
              required
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              placeholder="A101"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              placeholder="123 Main Street"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Monthly rent (₹)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              placeholder="15000"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Tenant name <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Leave blank if vacant"
            />
          </div>

          {error && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-indigo-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-900 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}