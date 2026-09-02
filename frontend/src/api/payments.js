import apiClient from "./client";

export const getPayments = (params = {}) =>
  apiClient.get("/payments", { params });

export const bulkRecordPayments = (payments) =>
  apiClient.post("/payments/bulk", { payments });

export const exportPaymentsCsv = async (month) => {
  const params = month ? { month } : {};
  const response = await apiClient.get("/payments/export", {
    params,
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "rent_roll.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
