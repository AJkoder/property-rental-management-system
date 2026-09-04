import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

import {
  getRequests,
  createRequest,
  updateRequest,
  updateRequestStatus,
  getRequestTimeline,
  addRequestNote,
  assignContractor,
  removeAssignment,
  getAssignmentsForRequest,
} from '../api/requests';

import { getUnits, getRequestUnitOptions } from '../api/units';
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
  ChevronLeft,
  ChevronRight,
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
  const [priorityFilter, setPriorityFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [contractorFilter, setContractorFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
  });
  const [units, setUnits] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page,
        per_page: 10,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (search) {
        params.search = search;
      }

      if (priorityFilter) {
        params.priority = priorityFilter;
      }

      if (unitFilter) {
        params.unit_id = unitFilter;
      }

      if (contractorFilter) {
        params.contractor_id = contractorFilter;
      }

      const res = await getRequests(params);
      setRequests(res.data.requests);
      setPagination(res.data.pagination);
    } catch (err) {
      setError('Failed to load maintenance requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(loadRequests, 300);

    return () => clearTimeout(timeout);
  }, [statusFilter, priorityFilter, unitFilter, contractorFilter, sortBy, sortOrder, search, page]);

  useEffect(() => {
    if (!isManager) {
      return;
    }

    Promise.all([getUnits(), getContractors()])
      .then(([unitsRes, contractorsRes]) => {
        setUnits(unitsRes.data.units || []);
        setContractors(contractorsRes.data.contractors || []);
      })
      .catch(() => {
        setUnits([]);
        setContractors([]);
      });
  }, [isManager]);

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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search description..."
            className="w-64 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] py-2 pl-9 pr-3 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-faint)] focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {statusOptions.map((s) => (
            <button
              type="button"
              key={s || 'all'}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
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

        <select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by priority"
          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--ink-soft)] outline-none focus:border-[color:var(--brand)]"
        >
          <option value="">All priorities</option>
          {['Low', 'Medium', 'High', 'Urgent'].map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>

        {isManager && (
          <select
            value={unitFilter}
            onChange={(e) => {
              setUnitFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by unit"
            className="max-w-44 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--ink-soft)] outline-none focus:border-[color:var(--brand)]"
          >
            <option value="">All units</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.unit_number}</option>
            ))}
          </select>
        )}

        {isManager && (
          <select
            value={contractorFilter}
            onChange={(e) => {
              setContractorFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by contractor"
            className="max-w-48 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--ink-soft)] outline-none focus:border-[color:var(--brand)]"
          >
            <option value="">All contractors</option>
            {contractors.map((contractor) => (
              <option key={contractor.id} value={contractor.id}>{contractor.name}</option>
            ))}
          </select>
        )}

        <select
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            const [nextSortBy, nextSortOrder] = e.target.value.split(':');
            setSortBy(nextSortBy);
            setSortOrder(nextSortOrder);
            setPage(1);
          }}
          aria-label="Sort requests"
          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--ink-soft)] outline-none focus:border-[color:var(--brand)]"
        >
          <option value="created_at:desc">Newest first</option>
          <option value="created_at:asc">Oldest first</option>
          <option value="priority:desc">Priority: high to low</option>
          <option value="priority:asc">Priority: low to high</option>
          <option value="status:asc">Status: A–Z</option>
        </select>
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
        <>
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

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-[color:var(--ink-soft)]">
              Showing {requests.length} of {pagination.total} requests
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={pagination.page <= 1}
                aria-label="Previous page"
                className="rounded-lg border border-[color:var(--border)] p-2 text-[color:var(--ink-soft)] transition hover:bg-[color:var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm tabular-nums text-[color:var(--ink-soft)]">
                {pagination.page} / {pagination.total_pages || 1}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pagination.total_pages, current + 1))}
                disabled={pagination.page >= pagination.total_pages}
                aria-label="Next page"
                className="rounded-lg border border-[color:var(--border)] p-2 text-[color:var(--ink-soft)] transition hover:bg-[color:var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
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
          onUpdated={(updatedRequest) => {
            if (updatedRequest) {
              setSelectedRequest(updatedRequest);
            }
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
    getRequestUnitOptions()
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
  const [note, setNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [selectedContractor, setSelectedContractor] = useState('');
  const [currentStatus, setCurrentStatus] = useState(request.status);
  const [editingDetails, setEditingDetails] = useState(false);
  const [description, setDescription] = useState(request.description);
  const [priority, setPriority] = useState(request.priority);

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

  const handleAddNote = async (e) => {
    e.preventDefault();

    const trimmedNote = note.trim();
    if (!trimmedNote) {
      return;
    }

    setError('');
    setAddingNote(true);

    try {
      await addRequestNote(request.id, trimmedNote);
      setNote('');
      await loadDetails();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add note.');
    } finally {
      setAddingNote(false);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
      setError('Description cannot be empty.');
      return;
    }

    setError('');
    setBusy(true);

    try {
      const response = await updateRequest(request.id, {
        description: trimmedDescription,
        priority,
      });
      setEditingDetails(false);
      await loadDetails();
      onUpdated(response.data.request);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update request details.');
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

            {!editingDetails && (
              <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                {description}
              </p>
            )}
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

        {!editingDetails && (
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
              PRIORITY_STYLES[priority]
            }`}
          >
            {priority} priority
          </span>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-[color:var(--red-tint)] px-4 py-2.5 text-sm text-[color:var(--red)]">
            {error}
          </div>
        )}

        {editingDetails ? (
          <form onSubmit={handleSaveDetails} className="mb-5 space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--ink)]" htmlFor="request-description">
                Description
              </label>
              <textarea
                id="request-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                className="w-full resize-y rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--ink)]" htmlFor="request-priority">
                Priority
              </label>
              <select
                id="request-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
              >
                {['Low', 'Medium', 'High', 'Urgent'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDescription(request.description);
                  setPriority(request.priority);
                  setEditingDetails(false);
                }}
                className="rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm font-medium text-[color:var(--ink-soft)] hover:bg-[color:var(--surface)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-[color:var(--brand)] px-3 py-2 text-sm font-medium text-white hover:bg-[color:var(--brand-dark)] disabled:opacity-50"
              >
                {busy ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : isManager ? (
          <button
            type="button"
            onClick={() => setEditingDetails(true)}
            className="mb-5 text-sm font-medium text-[color:var(--brand)] hover:text-[color:var(--brand-dark)]"
          >
            Edit description and priority
          </button>
        ) : null}

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

          <form onSubmit={handleAddNote} className="mb-4">
            <label className="sr-only" htmlFor="request-note">
              Add a note
            </label>
            <textarea
              id="request-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={255}
              rows={2}
              placeholder="Add a note to the timeline..."
              className="w-full resize-none rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-faint)] focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-[color:var(--ink-faint)]">
                {note.length}/255
              </span>
              <button
                type="submit"
                disabled={!note.trim() || addingNote}
                className="rounded-lg bg-[color:var(--brand)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[color:var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingNote ? 'Adding...' : 'Add note'}
              </button>
            </div>
          </form>

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
                    : entry.event_type === 'note_added'
                      ? `Note: ${entry.detail}`
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
