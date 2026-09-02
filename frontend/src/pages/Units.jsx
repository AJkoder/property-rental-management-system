import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUnits, createUnit, updateUnit, archiveUnit, restoreUnit } from '../api/units';
import { Plus, Archive, RotateCcw, Pencil, X } from 'lucide-react';

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Units</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your property units</p>
        </div>
        {isManager && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Unit
          </button>
        )}
      </div>

      {isManager && (
        <label className="mb-4 flex w-fit items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-slate-300"
          />
          Show archived units
        </label>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading units...</p>
      ) : units.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">No units yet.</p>
          {isManager && (
            <button
              onClick={openCreateModal}
              className="mt-2 text-sm font-medium text-slate-900 hover:underline"
            >
              Add your first unit
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Unit</th>
                <th className="px-4 py-3 font-medium text-slate-500">Address</th>
                <th className="px-4 py-3 font-medium text-slate-500">Tenant</th>
                <th className="px-4 py-3 font-medium text-slate-500">Rent</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                {isManager && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{unit.unit_number}</td>
                  <td className="px-4 py-3 text-slate-600">{unit.address}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {unit.tenant_name || <span className="text-slate-400">Vacant</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    ₹{unit.rent_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        unit.is_archived
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {unit.is_archived ? 'Archived' : 'Active'}
                    </span>
                  </td>
                  {isManager && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(unit)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleArchiveToggle(unit)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title={unit.is_archived ? 'Restore' : 'Archive'}
                        >
                          {unit.is_archived ? (
                            <RotateCcw className="h-4 w-4" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {unit ? 'Edit Unit' : 'Add Unit'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Unit number
            </label>
            <input
              type="text"
              required
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="A101"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Address
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="123 Main Street"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Monthly rent (₹)
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="Leave blank if vacant"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}