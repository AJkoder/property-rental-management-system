import apiClient from "./client";

export const generateAlerts = () => apiClient.post("/alerts/generate");

export const getAlerts = (includeDismissed = false) =>
  apiClient.get("/alerts", { params: { include_dismissed: includeDismissed } });

export const dismissAlert = (id) => apiClient.patch(`/alerts/${id}/dismiss`);
