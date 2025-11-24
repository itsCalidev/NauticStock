// src/api/axiosClient.js
import axios from "axios";

const api = axios.create();

// Request interceptor (token)
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  return config;
});

// Response interceptor: limpia sesión solo en 401/403
api.interceptors.response.use(
  resp => resp,
  err => {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      // mostramos el mensaje y luego limpiamos
      // const msg = err.response.data?.error || "No autorizado";
      // opcional: podrías setear un snackbar global aquí
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete api.defaults.headers.common.Authorization;
        // Emitir evento personalizado en lugar de recargar
        window.dispatchEvent(new Event("auth:session-expired"));
      }, 2000);
    }
    return Promise.reject(err);
  }
);

export default api;
