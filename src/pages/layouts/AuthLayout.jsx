import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import api from "../../api/axiosClient";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AccessibilitySidebar from "./SidebarAccesibility";
import AppSnackbar from "../../components/AppSnackbar";
import { useSocket } from "../../context/SocketContext";

export default function AuthLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "warning",
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored || stored === "undefined") return;

    try {
      JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing user in AuthLayout", e);
      localStorage.removeItem("user");
      navigate("/login");
      return;
    }

    const checkUserStatus = async () => {
      try {
        // Read fresh user data from localStorage to avoid closure staleness
        const currentStored = localStorage.getItem("user");
        if (!currentStored) return;
        const currentUser = JSON.parse(currentStored);

        // Verificar estado del usuario
        const response = await api.get(`/api/users/${currentUser.id}`);

        let userData = null;

        // Opción 1: La respuesta directa es el usuario
        if (response.data && response.data.id) {
          userData = response.data;
        }
        // Opción 2: Los datos están en response.data.data
        else if (response.data && response.data.data && response.data.data.id) {
          userData = response.data.data;
        }
        // Opción 3: Los datos están en response.data[0] (si es array)
        else if (response.data && Array.isArray(response.data) && response.data[0] && response.data[0].id) {
          userData = response.data[0];
        }

        if (!userData || !userData.id) {
          handleLogout("Tu cuenta ha sido eliminada. Serás redirigido al login.");
          return;
        }

        // Si el usuario fue deshabilitado (status = 1)
        if (userData.status === 1) {
          handleLogout("Tu cuenta ha sido deshabilitada por el administrador. Contacta al equipo de soporte.");
          return;
        }

        // ✅ ACTUALIZAR LOCALSTORAGE CON NUEVOS DATOS (PERMISOS, ROL, ETC.)
        // Esto permite que los cambios de permisos se reflejen sin relogin

        // Crear copias para comparar sin last_access (que cambia en cada request)
        const currentUserCompare = { ...currentUser };
        const userDataCompare = { ...userData };
        delete currentUserCompare.last_access;
        delete userDataCompare.last_access;

        if (JSON.stringify(currentUserCompare) !== JSON.stringify(userDataCompare)) {
          localStorage.setItem("user", JSON.stringify(userData));

          // Disparar evento para que otros componentes se actualicen
          window.dispatchEvent(new Event("userUpdated"));
        }

      } catch (err) {
        console.error('❌ Error verificando estado del usuario:', err);

        // Si es error 404, el usuario fue eliminado
        if (err.response?.status === 404) {
          handleLogout("Tu cuenta ha sido eliminada. Serás redirigido al login.");
          return;
        }

        // Si es error 403, NO cerrar sesión automáticamente (Graceful Handling)
        if (err.response?.status === 403) {
          console.warn("⛔ Acceso denegado (403) al verificar estado. Manteniendo sesión.");
          return;
        }

        // Si es error 401, token inválido
        if (err.response?.status === 401) {
          handleLogout("Tu sesión ha expirado. Inicia sesión nuevamente.");
          return;
        }
      }
    };

    const handleLogout = (message) => {
      // Mostrar mensaje al usuario
      setSnack({
        open: true,
        message: message,
        severity: "warning",
      });

      // Esperar 3 segundos para que el usuario lea el mensaje
      setTimeout(() => {
        // Limpiar datos de sesión
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete api.defaults.headers.common["Authorization"];

        // Disparar eventos para sincronización
        window.dispatchEvent(new Event("userLoggedOut"));
        localStorage.setItem('userSessionClosed', Date.now().toString());

        // Redirigir al login
        navigate("/login", { replace: true });
      }, 3000);
    };

    // 👇 NUEVOS EVENTOS: Escuchar cuando otros usuarios son modificados
    const handleUserUpdated = () => {
      checkUserStatus();
    };

    const handleUserDeleted = () => {
      checkUserStatus();
    };

    const handleUserStatusChanged = () => {
      checkUserStatus();
    };

    // 👇 SOCKET EVENTS: Actualización en tiempo real
    const handleRoleUpdated = (data) => {
      const currentStored = localStorage.getItem("user");
      if (!currentStored) return;
      const currentUser = JSON.parse(currentStored);

      // Si el rol actualizado es el mío, refrescar permisos
      // NOTA: El backend envía { id, name, permissions }, por eso usamos data.id
      // Usamos String() para permitir comparación segura entre string y number
      if (String(data.id) === String(currentUser.roleId)) {
        checkUserStatus();
      }
    };

    // 👇 STORAGE EVENTS: Para sincronización entre pestañas/navegadores
    const handleStorageChange = (e) => {
      if (e.key === 'userChanged' && e.newValue !== e.oldValue) {
        checkUserStatus();
      }

      // Si otra pestaña cerró sesión, cerrar esta también
      if (e.key === 'userSessionClosed' && e.newValue !== e.oldValue) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete api.defaults.headers.common["Authorization"];
        navigate("/login", { replace: true });
      }
    };

    // Verificación inicial
    checkUserStatus();

    // Verificación periódica cada 30 segundos
    const intervalId = setInterval(checkUserStatus, 30000);

    // Escuchar eventos de usuarios
    window.addEventListener("userUpdated", handleUserUpdated);
    window.addEventListener("userDeleted", handleUserDeleted);
    window.addEventListener("userStatusChanged", handleUserStatusChanged);
    window.addEventListener("storage", handleStorageChange);

    // Escuchar eventos de socket
    if (socket) {
      socket.on('role_updated', handleRoleUpdated);
    }

    // Cleanup
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("userUpdated", handleUserUpdated);
      window.removeEventListener("userDeleted", handleUserDeleted);
      window.removeEventListener("userStatusChanged", handleUserStatusChanged);
      window.removeEventListener("storage", handleStorageChange);

      if (socket) {
        socket.off('role_updated', handleRoleUpdated);
      }
    };
  }, [location.pathname, navigate, socket]);

  return (
    <div className="app">
      <Sidebar />
      <main className="content">
        <Topbar />
        <Outlet />
      </main>
      <AccessibilitySidebar />
      <AppSnackbar
        open={snack.open}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        message={snack.message}
        severity={snack.severity}
      />
    </div>
  );
}