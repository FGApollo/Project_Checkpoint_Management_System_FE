import api from './api';

export const listProjectDocuments = (groupId) => api.get(`/documents/group/${groupId}`);
export const uploadProjectDocument = (groupId, file, onUploadProgress) => {
  const form = new FormData();
  form.append('groupId', String(groupId)); form.append('file', file);
  return api.post('/documents', form, { onUploadProgress });
};
export const downloadProjectDocument = (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' });
export const generateProjectDocumentSuggestions = (id) => api.post(`/documents/${id}/suggestions`);
export const listDocumentComments = (id) => api.get(`/documents/${id}/comments`);
export const createDocumentComment = (id, data) => api.post(`/documents/${id}/comments`, data);
