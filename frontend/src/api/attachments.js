import apiClient from './client';

export const uploadAttachment = (requestId, fileName, contentType, fileData) =>
  apiClient.post(`/attachments/request/${requestId}`, {
    file_name: fileName,
    content_type: contentType,
    file_data: fileData,
  });

export const getAttachments = (requestId) =>
  apiClient.get(`/attachments/request/${requestId}`);

export const getAttachmentDetail = (attachmentId) =>
  apiClient.get(`/attachments/${attachmentId}`);

export const deleteAttachment = (attachmentId) =>
  apiClient.delete(`/attachments/${attachmentId}`);
