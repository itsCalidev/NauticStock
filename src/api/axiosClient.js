// src/api/axiosClient.js
import axios from "axios";

// axios.defaults.baseURL = process.env.REACT_APP_API_URL;

axios.interceptors.response.use(
  resp => resp,
  err => {
    const msg = err.response?.data?.error;{
      // luego deja 2s para que el usuario lo lea y limpia sesión
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete axios.defaults.headers.common["Authorization"];
        window.location.href = "/login";
      }, 3000);
    }
    return Promise.reject(err);
  }
);

export default axios;
