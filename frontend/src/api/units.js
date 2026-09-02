import apiClient from "./client";

export const getUnits = (includeArchived = false) =>
  apiClient.get("/units", { params: { include_archived: includeArchived } });

export const createUnit = (data) => apiClient.post("/units", data);

export const updateUnit = (id, data) => apiClient.put(`/units/${id}`, data);

export const archiveUnit = (id) => apiClient.patch(`/units/${id}/archive`);

export const restoreUnit = (id) => apiClient.patch(`/units/${id}/restore`);
