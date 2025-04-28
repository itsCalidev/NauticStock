import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import axios from "../../api/axiosClient";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AccessibilitySidebar from "./SidebarAccesibility";
import AppSnackbar from "../../components/AppSnackbar";

export default function AuthLayout() {
  const location = useLocation();
  const navigate  = useNavigate();
  const [snack, setSnack] = useState({
    open:     false,
    message:  "",
    severity: "warning",
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const me = JSON.parse(stored);

    const checkStatus = async () => {
      try {
        const { data } = await axios.get(`/users/${me.id}`);
        if (data.status === 1) {
          setSnack({
            open:     true,
            message:  "Tu cuenta ha sido inhabilitada por el administrador, favor de ponerte en contacto.",
            severity: "warning",
          });
          setTimeout(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            delete axios.defaults.headers.common["Authorization"];
            navigate("/login", { replace: true });
          }, 3000);
          clearInterval(intervalId);
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete axios.defaults.headers.common["Authorization"];
        navigate("/login", { replace: true });
      }
    };

    checkStatus(); 
    const intervalId = setInterval(checkStatus, 15000);
    return () => clearInterval(intervalId);
  }, [location.pathname, navigate]);

  return (
    <div className="app">
      <Sidebar />
      <main className="content">
        <Topbar />
        <Outlet />
      </main>
      <AccessibilitySidebar />
      <AppSnackbar
        open    ={snack.open}
        onClose ={() => setSnack(s => ({ ...s, open: false }))}
        message ={snack.message}
        severity={snack.severity}
      />
    </div>
  );
}
