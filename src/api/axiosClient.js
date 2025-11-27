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

    // Solo cerrar sesión si es 401 (Token inválido/expirado)
    if (status === 401) {
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete api.defaults.headers.common.Authorization;
        window.dispatchEvent(new Event("auth:session-expired"));
      }, 2000);
    }

    // 403 Forbidden se manejará en los componentes (redirección o alerta)
    if (status === 403) {
      console.warn('⛔ Acceso denegado (403). El usuario mantiene su sesión.');
    }
    return Promise.reject(err);
  }
);

export default api;
