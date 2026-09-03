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
import { Plus, X, Clock, UserPlus, Trash2, Search, Wrench } from 'lucide-react';

const STATUS_STYLES = {
  Reported: 'bg-[color:var(--surface-2)] text-[color:var(--ink-soft)]',
  Triaged: 'bg-[color:var(--brand-tint)] text-[color:var(--brand)]',
  Scheduled: 'bg-[color:var(--gold-tint)] text-[color:var(--gold)]',
  Resolved: 'bg-[color:var(--green-tint)] text-[color:var(--green)]',
};

const STATUS_DOT = {
  Reported: 'bg-[color:var(--ink-faint)]',
  Triaged: 'bg-[color:var(--brand)]',
  Scheduled: 'bg-[color:var(--gold)]',
  Resolved: 'bg-green-600',
};

const PRIORITY_STYLES = {
  Low: 'bg-[color:var(--surface-2)] text-[color:var(--ink-faint)]',
  Medium: 'bg-[color:var(--brand-tint)] text-[color:var(--brand)]',
  High: 'bg-[color:var(--gold-tint)] text-[color:var(--gold)]',
  Urgent: 'bg-[color:var(--red-tint)] text-[color:var(--red)]',
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

  const statusOptions = ['', 'Reported', 'Triaged', 'Scheduled', 'Resolved'];

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-['Fraunces'] text-[28px] font-semibold text-[color:var(--ink)]">
            {isManager ? 'Maintenance Requests' : 'My Requests'}
          </h1>
          <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
            {isManager ? 'All reported issues across your properties' : 'Requests assigned to you'}
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[color:var(--brand)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[color:var(--brand-dark)]"
        >
          <Plus className="h-4 w-4" />
          Report Issue
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-faint)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description..."
            className="w-64 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] py-2 pl-9 pr-3 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-faint)] focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {statusOptions.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                statusFilter === s
                  ? 'bg-[color:var(--brand)] text-white'
                  : 'bg-[color:var(--surface)] text-[color:var(--ink-soft)] ring-1 ring-[color:var(--border)] hover:bg-[color:var(--surface-2)]'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-[color:var(--red-tint)] px-4 py-3 text-sm text-[color:var(--red)]">{error}</div>}

      {loading ? (
        <p className="text-sm text-[color:var(--ink-soft)]">Loading requests...</p>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] py-16 text-center">
          <Wrench className="mx-auto mb-3 h-8 w-8 text-[color:var(--ink-faint)]" />
          <p className="text-sm text-[color:var(--ink-soft)]">No requests found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
          {requests.map((req, i) => (
            <button
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className={`flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[color:var(--surface-2)]/50 ${
                i !== requests.length - 1 ? 'border-b border-[color:var(--border)]' : ''
              }`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[req.status]}`} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[color:var(--ink)]">{req.unit_number}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[req.priority]}`}>
                    {req.priority}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-[color:var(--ink-soft)]">{req.description}</p>
              </div>

              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[req.status]}`}>
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
          onUpdated={() => loadRequests()}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">Report an Issue</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-[color:var(--ink-faint)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--ink)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--ink)]">Unit</label>
            <select
              required
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
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
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--ink)]">Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-faint)] focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
              placeholder="Describe the issue..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--ink)]">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>

          {error && <div className="rounded-xl bg-[color:var(--red-tint)] px-4 py-2.5 text-sm text-[color:var(--red)]">{error}</div>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[color:var(--border)] px-4 py-2.5 text-sm font-medium text-[color:var(--ink-soft)] hover:bg-[color:var(--surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[color:var(--brand)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[color:var(--brand-dark)] disabled:opacity-50"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">{request.unit_number}</h2>
            <p className="mt-1 text-sm text-[color:var(--ink-soft)]">{request.description}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-[color:var(--ink-faint)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--ink)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[currentStatus]}`}>
            {currentStatus}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_STYLES[request.priority]}`}>
            {request.priority} priority
          </span>
        </div>

        {error && <div className="mb-4 rounded-xl bg-[color:var(--red-tint)] px-4 py-2.5 text-sm text-[color:var(--red)]">{error}</div>}

        {isManager && NEXT_STATUS[currentStatus]?.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-faint)]">Change status</p>
            <div className="flex flex-wrap gap-2">
              {NEXT_STATUS[currentStatus].map((s) => (
                <button
                  key={s}
                  disabled={busy}
                  onClick={() => handleStatusChange(s)}
                  className="rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm font-medium text-[color:var(--ink-soft)] transition hover:border-[color:var(--brand)] hover:bg-[color:var(--brand-tint)] hover:text-[color:var(--brand)] disabled:opacity-50"
                >
                  Move to {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {isManager && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-faint)]">Assigned contractors</p>
            {assignments.length === 0 ? (
              <p className="mb-2 text-sm text-[color:var(--ink-faint)]">No contractor assigned yet.</p>
            ) : (
              <div className="mb-2 space-y-1.5">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl bg-[color:var(--surface-2)] px-3.5 py-2 text-sm">
                    <span className="text-[color:var(--ink-soft)]">{a.contractor_name}</span>
                    <button
                      onClick={() => handleRemoveAssignment(a.id)}
                      aria-label={`Remove ${a.contractor_name}`}
                      className="rounded-md p-1 text-[color:var(--ink-faint)] transition hover:bg-[color:var(--red-tint)] hover:text-[color:var(--red)]"
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
                className="flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3.5 py-2 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
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
                className="flex items-center gap-1.5 rounded-xl bg-[color:var(--brand)] px-3.5 py-2 text-sm font-medium text-white hover:bg-[color:var(--brand-dark)] disabled:opacity-50"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Assign
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-faint)]">
            <Clock className="h-3.5 w-3.5" />
            Timeline
          </p>
          <div className="space-y-3 border-l-2 border-[color:var(--border)] pl-4">
            {timeline.map((entry) => (
              <div key={entry.id} className="relative text-sm">
                <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-[color:var(--brand)]" />
                <p className="text-[color:var(--ink-soft)]">
                  {entry.event_type === 'status_change'
                    ? entry.old_status
                      ? `${entry.old_status} → ${entry.new_status}`
                      : 'Reported'
                    : entry.detail}
                </p>
                <p className="text-xs text-[color:var(--ink-faint)]">
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