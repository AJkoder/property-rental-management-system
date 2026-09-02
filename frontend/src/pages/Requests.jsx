import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getRequests,
  createRequest,
  updateRequestStatus,
  getRequestTimeline,
  assignContractor,
  removeAssignment,
  getAssignmentsForRequest,
} from '../api/requests';
import { getUnits } from '../api/units';
import { getContractors } from '../api/users';
import { Plus, X, Clock, UserPlus, Trash2 } from 'lucide-react';

const STATUS_STYLES = {
  Reported: 'bg-slate-100 text-slate-700',
  Triaged: 'bg-blue-50 text-blue-700',
  Scheduled: 'bg-amber-50 text-amber-700',
  Resolved: 'bg-green-50 text-green-700',
};

const PRIORITY_STYLES = {
  Low: 'text-slate-500',
  Medium: 'text-blue-600',
  High: 'text-amber-600',
  Urgent: 'text-red-600',
};

const NEXT_STATUS = {
  Reported: ['Triaged'],
  Triaged: ['Scheduled', 'Reported'],
  Scheduled: ['Resolved', 'Triaged'],
  Resolved: ['Triaged'],
};

export default function Requests() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await getRequests(params);
      setRequests(res.data.requests);
    } catch (err) {
      setError('Failed to load maintenance requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(loadRequests, 300);
    return () => clearTimeout(timeout);
  }, [statusFilter, search]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isManager ? 'Maintenance Requests' : 'My Requests'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isManager ? 'All reported issues across your properties' : 'Requests assigned to you'}
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Report Issue
        </button>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search description..."
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
        >
          <option value="">All statuses</option>
          <option value="Reported">Reported</option>
          <option value="Triaged">Triaged</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading requests...</p>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">No requests found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <button
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{req.unit_number}</span>
                  <span className={`text-xs font-medium ${PRIORITY_STYLES[req.priority]}`}>
                    {req.priority}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-500">{req.description}</p>
              </div>
              <span
                className={`ml-4 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[req.status]}`}
              >
                {req.status}
              </span>
            </button>
          ))}
        </div>
      )}

      {createModalOpen && (
        <CreateRequestModal
          onClose={() => setCreateModalOpen(false)}
          onCreated={() => {
            setCreateModalOpen(false);
            loadRequests();
          }}
        />
      )}

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          isManager={isManager}
          onClose={() => setSelectedRequest(null)}
          onUpdated={() => {
            loadRequests();
          }}
        />
      )}
    </div>
  );
}

function CreateRequestModal({ onClose, onCreated }) {
  const [units, setUnits] = useState([]);
  const [unitId, setUnitId] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUnits().then((res) => setUnits(res.data.units));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createRequest({ unit_id: unitId, description, priority });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Report an Issue</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Unit</label>
            <select
              required
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            >
              <option value="">Select a unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_number} — {u.address}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="Describe the issue..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
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
              {saving ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RequestDetailModal({ request, isManager, onClose, onUpdated }) {
  const [timeline, setTimeline] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [selectedContractor, setSelectedContractor] = useState('');
  const [currentStatus, setCurrentStatus] = useState(request.status);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadDetails = async () => {
    const [timelineRes, assignmentsRes] = await Promise.all([
      getRequestTimeline(request.id),
      getAssignmentsForRequest(request.id),
    ]);
    setTimeline(timelineRes.data.timeline);
    setAssignments(assignmentsRes.data.assignments);
  };

  useEffect(() => {
    loadDetails();
    if (isManager) {
      getContractors().then((res) => setContractors(res.data.contractors));
    }
  }, []);

  const handleStatusChange = async (newStatus) => {
    setError('');
    setBusy(true);
    try {
      await updateRequestStatus(request.id, newStatus);
      setCurrentStatus(newStatus);
      await loadDetails();
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.error || 'Status change failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedContractor) return;
    setError('');
    setBusy(true);
    try {
      await assignContractor(request.id, selectedContractor);
      setSelectedContractor('');
      await loadDetails();
    } catch (err) {
      setError(err.response?.data?.error || 'Assignment failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    setBusy(true);
    try {
      await removeAssignment(assignmentId);
      await loadDetails();
    } catch (err) {
      setError('Failed to remove assignment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{request.unit_number}</h2>
            <p className="mt-1 text-sm text-slate-600">{request.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[currentStatus]}`}>
            {currentStatus}
          </span>
          <span className={`text-xs font-medium ${PRIORITY_STYLES[request.priority]}`}>
            {request.priority} priority
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {isManager && NEXT_STATUS[currentStatus]?.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Change status
            </p>
            <div className="flex gap-2">
              {NEXT_STATUS[currentStatus].map((s) => (
                <button
                  key={s}
                  disabled={busy}
                  onClick={() => handleStatusChange(s)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Move to {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {isManager && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Assigned contractors
            </p>
            {assignments.length === 0 ? (
              <p className="mb-2 text-sm text-slate-400">No contractor assigned yet.</p>
            ) : (
              <div className="mb-2 space-y-1.5">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm"
                  >
                    <span className="text-slate-700">{a.contractor_name}</span>
                    <button
                      onClick={() => handleRemoveAssignment(a.id)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <select
                value={selectedContractor}
                onChange={(e) => setSelectedContractor(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              >
                <option value="">Select contractor...</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={!selectedContractor || busy}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Assign
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            Timeline
          </p>
          <div className="space-y-2 border-l-2 border-slate-100 pl-4">
            {timeline.map((entry) => (
              <div key={entry.id} className="relative text-sm">
                <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-slate-300" />
                <p className="text-slate-700">
                  {entry.old_status ? `${entry.old_status} → ${entry.new_status}` : `Reported`}
                </p>
                <p className="text-xs text-slate-400">
                  {entry.changed_by_name} · {new Date(entry.changed_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}