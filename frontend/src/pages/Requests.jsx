import { useState, useEffect, useRef } from 'react';
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

import {
  uploadAttachment,
  getAttachments,
  getAttachmentDetail,
  deleteAttachment,
} from '../api/attachments';

import {
  Plus,
  X,
  Clock,
  UserPlus,
  Trash2,
  Search,
  Wrench,
  Image,
  Upload,
} from 'lucide-react';

const STATUS_STYLES = {
  Reported:
    'bg-[color:var(--surface-2)] text-[color:var(--ink-soft)]',
  Triaged:
    'bg-[color:var(--brand-tint)] text-[color:var(--brand)]',
  Scheduled:
    'bg-[color:var(--gold-tint)] text-[color:var(--gold)]',
  Resolved:
    'bg-[color:var(--green-tint)] text-[color:var(--green)]',
};

const STATUS_DOT = {
  Reported: 'bg-[color:var(--ink-faint)]',
  Triaged: 'bg-[color:var(--brand)]',
  Scheduled: 'bg-[color:var(--gold)]',
  Resolved: 'bg-[color:var(--green)]',
};

const PRIORITY_STYLES = {
  Low:
    'bg-[color:var(--surface-2)] text-[color:var(--ink-faint)]',
  Medium:
    'bg-[color:var(--brand-tint)] text-[color:var(--brand)]',
  High:
    'bg-[color:var(--gold-tint)] text-[color:var(--gold)]',
  Urgent:
    'bg-[color:var(--red-tint)] text-[color:var(--red)]',
};

const NEXT_STATUS = {
  Reported: ['Triaged'],
  Triaged: ['Scheduled'],
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

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (search) {
        params.search = search;
      }

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

  const statusOptions = [
    '',
    'Reported',
    'Triaged',
    'Scheduled',
    'Resolved',
  ];

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-['Fraunces'] text-[28px] font-semibold text-[color:var(--ink)]">
            {isManager ? 'Maintenance Requests' : 'My Requests'}
          </h1>

          <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
            {isManager
              ? 'All reported issues across your properties'
              : 'Requests assigned to you'}
          </p>
        </div>

        <button
          type="button"
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
              type="button"
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

      {error && (
        <div className="mb-4 rounded-xl bg-[color:var(--red-tint)] px-4 py-3 text-sm text-[color:var(--red)]">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[color:var(--ink-soft)]">
          Loading requests...
        </p>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] py-16 text-center">
          <Wrench className="mx-auto mb-3 h-8 w-8 text-[color:var(--ink-faint)]" />

          <p className="text-sm text-[color:var(--ink-soft)]">
            No requests found.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
          {requests.map((req, i) => (
            <button
              type="button"
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className={`flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[color:var(--surface-2)]/50 ${
                i !== requests.length - 1
                  ? 'border-b border-[color:var(--border)]'
                  : ''
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  STATUS_DOT[req.status]
                }`}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[color:var(--ink)]">
                    {req.unit_number}
                  </span>

                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      PRIORITY_STYLES[req.priority]
                    }`}
                  >
                    {req.priority}
                  </span>
                </div>

                <p className="mt-0.5 truncate text-sm text-[color:var(--ink-soft)]">
                  {req.description}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  STATUS_STYLES[req.status]
                }`}
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
    getUnits()
      .then((res) => {
        setUnits(res.data.units || []);
      })
      .catch(() => {
        setError('Failed to load units.');
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await createRequest({
        unit_id: unitId,
        description,
        priority,
      });

      onCreated();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Failed to create request.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">
            Report an Issue
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-[color:var(--ink-faint)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--ink)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--ink)]">
              Unit
            </label>

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
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--ink)]">
              Description
            </label>

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
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--ink)]">
              Priority
            </label>

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

          {error && (
            <div className="rounded-xl bg-[color:var(--red-tint)] px-4 py-2.5 text-sm text-[color:var(--red)]">
              {error}
            </div>
          )}

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

function RequestDetailModal({
  request,
  isManager,
  onClose,
  onUpdated,
}) {
  const [timeline, setTimeline] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [selectedContractor, setSelectedContractor] = useState('');
  const [currentStatus, setCurrentStatus] = useState(request.status);

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);

  const fileInputRef = useRef(null);

  const loadDetails = async () => {
    try {
      const [
        timelineRes,
        assignmentsRes,
        attachmentsRes,
      ] = await Promise.all([
        getRequestTimeline(request.id),
        getAssignmentsForRequest(request.id),
        getAttachments(request.id),
      ]);

      const attachmentList = (
        attachmentsRes.data.attachments || []
      ).filter(Boolean);

      /*
       * The attachment list intentionally does not contain
       * the large Base64 image data.
       *
       * Fetch each image separately so the request-detail
       * response stays lightweight.
       */
      const attachmentResults = await Promise.allSettled(
        attachmentList.map((attachment) =>
          getAttachmentDetail(attachment.id)
        )
      );

      const attachmentsWithData = attachmentList.map(
        (attachment, index) => {
          const result = attachmentResults[index];

          if (result.status === 'fulfilled') {
            return {
              ...attachment,
              ...result.value.data.attachment,
            };
          }

          return attachment;
        }
      );

      setTimeline(
        (timelineRes.data.timeline || []).filter(Boolean)
      );

      setAssignments(
        (assignmentsRes.data.assignments || []).filter(Boolean)
      );

      setAttachments(attachmentsWithData);
    } catch (err) {
      setError('Failed to load request details.');
    }
  };

  useEffect(() => {
    loadDetails();

    if (isManager) {
      getContractors()
        .then((res) => {
          setContractors(res.data.contractors || []);
        })
        .catch(() => {
          setContractors([]);
        });
    }
  }, [request.id, isManager]);

  const handleStatusChange = async (newStatus) => {
    setError('');
    setBusy(true);

    try {
      await updateRequestStatus(request.id, newStatus);

      setCurrentStatus(newStatus);

      await loadDetails();

      onUpdated();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Status change failed.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedContractor) {
      return;
    }

    setError('');
    setBusy(true);

    try {
      await assignContractor(
        request.id,
        selectedContractor
      );

      setSelectedContractor('');

      await loadDetails();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Assignment failed.'
      );
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

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        'Only JPEG, PNG, WEBP, or GIF images are allowed.'
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError('File too large. Maximum size is 3MB.');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      return;
    }

    setError('');
    setUploading(true);

    try {
      const base64 = await fileToBase64(file);

      await uploadAttachment(
        request.id,
        file.name,
        file.type,
        base64
      );

      await loadDetails();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Upload failed.'
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleViewImage = (attachment) => {
    if (!attachment.file_data) {
      setError('Unable to display this image.');
      return;
    }

    setViewingImage(attachment);
  };

  const handleDeleteAttachment = async (attachment) => {
    const confirmed = window.confirm(
      `Delete "${attachment.file_name}"?`
    );

    if (!confirmed) {
      return;
    }

    setError('');
    setUploading(true);

    try {
      await deleteAttachment(attachment.id);

      if (viewingImage?.id === attachment.id) {
        setViewingImage(null);
      }

      await loadDetails();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Failed to delete photo.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">
              {request.unit_number}
            </h2>

            <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
              {request.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-[color:var(--ink-faint)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--ink)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              STATUS_STYLES[currentStatus]
            }`}
          >
            {currentStatus}
          </span>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              PRIORITY_STYLES[request.priority]
            }`}
          >
            {request.priority} priority
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-[color:var(--red-tint)] px-4 py-2.5 text-sm text-[color:var(--red)]">
            {error}
          </div>
        )}

        {isManager &&
          NEXT_STATUS[currentStatus]?.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-faint)]">
                Change status
              </p>

              <div className="flex flex-wrap gap-2">
                {NEXT_STATUS[currentStatus].map((s) => (
                  <button
                    type="button"
                    key={s}
                    disabled={busy}
                    onClick={() =>
                      handleStatusChange(s)
                    }
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
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-faint)]">
              Assigned contractors
            </p>

            {assignments.length === 0 ? (
              <p className="mb-2 text-sm text-[color:var(--ink-faint)]">
                No contractor assigned yet.
              </p>
            ) : (
              <div className="mb-2 space-y-1.5">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl bg-[color:var(--surface-2)] px-3.5 py-2 text-sm"
                  >
                    <span className="text-[color:var(--ink-soft)]">
                      {a.contractor_name}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveAssignment(a.id)
                      }
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
                onChange={(e) =>
                  setSelectedContractor(e.target.value)
                }
                className="flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3.5 py-2 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
              >
                <option value="">
                  Select contractor...
                </option>

                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
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

        {/* Photos */}
        <div className="mb-5">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-faint)]">
            <Image className="h-3.5 w-3.5" />
            Photos
          </p>

          {attachments.length > 0 ? (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleViewImage(attachment)
                    }
                    className="group relative block aspect-square w-full overflow-hidden bg-[color:var(--surface-2)]"
                    title={`View ${attachment.file_name}`}
                  >
                    {attachment.file_data ? (
                      <img
                        src={
                          `data:${attachment.content_type};base64,` +
                          attachment.file_data
                            .split(',')
                            .pop()
                        }
                        alt={attachment.file_name}
                        className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Image className="h-7 w-7 text-[color:var(--ink-faint)]" />
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                      <span className="rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                        View
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <p
                      className="min-w-0 truncate text-xs text-[color:var(--ink-soft)]"
                      title={attachment.file_name}
                    >
                      {attachment.file_name}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteAttachment(
                          attachment
                        )
                      }
                      disabled={uploading}
                      aria-label={`Delete ${attachment.file_name}`}
                      title="Delete photo"
                      className="shrink-0 rounded-lg p-1.5 text-[color:var(--ink-faint)] transition hover:bg-[color:var(--red-tint)] hover:text-[color:var(--red)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-4 rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-6 text-center">
              <Image className="mx-auto mb-2 h-6 w-6 text-[color:var(--ink-faint)]" />

              <p className="text-xs text-[color:var(--ink-soft)]">
                No photos attached yet.
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[color:var(--border)] py-2.5 text-sm font-medium text-[color:var(--ink-soft)] transition hover:border-[color:var(--brand)] hover:bg-[color:var(--brand-tint)] hover:text-[color:var(--brand)] disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Processing...' : 'Add photo'}
          </button>
        </div>

        {/* Timeline */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-faint)]">
            <Clock className="h-3.5 w-3.5" />
            Timeline
          </p>

          <div className="space-y-3 border-l-2 border-[color:var(--border)] pl-4">
            {timeline.map((entry) => (
              <div
                key={entry.id}
                className="relative text-sm"
              >
                <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-[color:var(--brand)]" />

                <p className="text-[color:var(--ink-soft)]">
                  {entry.event_type ===
                  'status_change'
                    ? entry.old_status
                      ? `${entry.old_status} → ${entry.new_status}`
                      : 'Reported'
                    : entry.detail}
                </p>

                <p className="text-xs text-[color:var(--ink-faint)]">
                  {entry.changed_by_name} ·{' '}
                  {new Date(
                    entry.changed_at
                  ).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full-size image viewer */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-6"
          onClick={() => setViewingImage(null)}
        >
          <div
            className="relative flex max-h-full max-w-full items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={
                `data:${viewingImage.content_type};base64,` +
                viewingImage.file_data
                  .split(',')
                  .pop()
              }
              alt={viewingImage.file_name}
              className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            />

            <button
              type="button"
              onClick={() => setViewingImage(null)}
              aria-label="Close image"
              className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}