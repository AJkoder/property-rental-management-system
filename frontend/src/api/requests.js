import apiClient from "./client";

export const getRequests = (params = {}) =>
  apiClient.get("/requests", { params });

export const createRequest = (data) => apiClient.post("/requests", data);

export const updateRequestStatus = (id, status) =>
  apiClient.patch(`/requests/${id}/status`, { status });

export const getRequestTimeline = (id) =>
  apiClient.get(`/requests/${id}/timeline`);

export const assignContractor = (requestId, contractorId) =>
  apiClient.post("/assignments", {
    request_id: requestId,
    contractor_id: contractorId,
  });

export const removeAssignment = (assignmentId) =>
  apiClient.delete(`/assignments/${assignmentId}`);

export const getAssignmentsForRequest = (requestId) =>
  apiClient.get(`/assignments/request/${requestId}`);
