import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import api from "../../api/axiosClient";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AccessibilitySidebar from "./SidebarAccesibility";
import AppSnackbar from "../../components/AppSnackbar";

export default function AuthLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "warning",
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored || stored === "undefined") return;

    let me;
    try {
      me = JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing user in AuthLayout", e);
      localStorage.removeItem("user");
      navigate("/login");
      return;
    }

    const checkUserStatus = async () => {
      try {
        console.log('🔍 Verificando estado del usuario:', me.id);

        // Verificar estado del usuario
        const response = await api.get(`/api/users/${me.id}`);

        // 👇 NUEVO: Log detallado de la respuesta
        console.log('📡 Respuesta completa:', response);
        console.log('📡 response.data:', response.data);
        console.log('📡 Tipo de response.data:', typeof response.data);
        console.log('📡 Es array response.data:', Array.isArray(response.data));

        // 👇 CORREGIR: Verificar diferentes estructuras de respuesta
        let userData = null;

        // Opción 1: La respuesta directa es el usuario
        if (response.data && response.data.id) {
          userData = response.data;
          console.log('✅ Estructura: Datos directos');
        }
        // Opción 2: Los datos están en response.data.data
        else if (response.data && response.data.data && response.data.data.id) {
          userData = response.data.data;
          console.log('✅ Estructura: data.data');
        }
        // Opción 3: Los datos están en response.data[0] (si es array)
        else if (response.data && Array.isArray(response.data) && response.data[0] && response.data[0].id) {
          userData = response.data[0];
          console.log('✅ Estructura: Array[0]');
        }

        if (!userData || !userData.id) {
          console.log('❌ Usuario no encontrado en ninguna estructura');
          console.log('❌ response.data completo:', JSON.stringify(response.data, null, 2));
          handleLogout("Tu cuenta ha sido eliminada. Serás redirigido al login.");
          return;
        }

        console.log('📋 Datos del usuario encontrados:', userData);

        // Si el usuario fue deshabilitado (status = 1)
        if (userData.status === 1) {
          console.log('🚫 Usuario deshabilitado - cerrando sesión');
          handleLogout("Tu cuenta ha sido deshabilitada por el administrador. Contacta al equipo de soporte.");
          return;
        }

        console.log('✅ Estado del usuario verificado correctamente');

      } catch (err) {
        console.error('❌ Error verificando estado del usuario:', err);
        console.error('❌ Error response:', err.response);
        console.error('❌ Error response data:', err.response?.data);

        // Si es error 404, el usuario fue eliminado
        if (err.response?.status === 404) {
          handleLogout("Tu cuenta ha sido eliminada. Serás redirigido al login.");
          return;
        }

        // Si es error 403, sin permisos (usuario deshabilitado)
        if (err.response?.status === 403) {
          handleLogout("No tienes permisos para acceder. Tu cuenta puede haber sido deshabilitada.");
          return;
        }

        // Si es error 401, token inválido
        if (err.response?.status === 401) {
          handleLogout("Tu sesión ha expirado. Inicia sesión nuevamente.");
          return;
        }

        // Para otros errores, no cerrar sesión automáticamente
        // pero mostrar mensaje informativo
        console.warn('⚠️ Error al verificar estado (no cerrando sesión):', err.response?.data?.error || err.message);
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
      console.log('📢 Evento recibido: userUpdated - verificando mi estado');
      checkUserStatus();
    };

    const handleUserDeleted = () => {
      console.log('📢 Evento recibido: userDeleted - verificando mi estado');
      checkUserStatus();
    };

    const handleUserStatusChanged = () => {
      console.log('📢 Evento recibido: userStatusChanged - verificando mi estado');
      checkUserStatus();
    };

    // 👇 STORAGE EVENTS: Para sincronización entre pestañas/navegadores
    const handleStorageChange = (e) => {
      if (e.key === 'userChanged' && e.newValue !== e.oldValue) {
        console.log('📢 Storage event: userChanged - verificando mi estado');
        checkUserStatus();
      }

      // Si otra pestaña cerró sesión, cerrar esta también
      if (e.key === 'userSessionClosed' && e.newValue !== e.oldValue) {
        console.log('📢 Storage event: Sesión cerrada en otra pestaña');
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

    // Cleanup
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("userUpdated", handleUserUpdated);
      window.removeEventListener("userDeleted", handleUserDeleted);
      window.removeEventListener("userStatusChanged", handleUserStatusChanged);
      window.removeEventListener("storage", handleStorageChange);
    };
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
        open={snack.open}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        message={snack.message}
        severity={snack.severity}
      />
    </div>
  );
}