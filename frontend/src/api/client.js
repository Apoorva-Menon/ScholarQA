import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export const uploadDocument = (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  });
};

export const listDocuments = () => api.get("/documents");
export const deleteDocument = (filename) => api.delete(`/documents/${filename}`);
export const getGraphStats = () => api.get("/graph/stats");
export const sendChat = (query, history, top_k = 5) =>
  api.post("/chat", { query, history, top_k });
export const getHealth = () => api.get("/health");