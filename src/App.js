import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import { SearchProvider } from './contexts/SearchContext';
import { SocketProvider } from './context/SocketContext';

import PrivateRoute from "./components/PrivateRoute";
import PermissionRoute from "./components/PermissionRoute";
import AuthLayout from "./pages/layouts/AuthLayout";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Team from "./pages/team";
import Products from "./pages/products";
import Providers from "./pages/providers";
import Profile from "./pages/profile";
import History from "./pages/history";
import Categories from "./pages/categories";
import Locations from "./pages/locations";
import Brands from "./pages/brands";
import Ranks from "./pages/ranks";
import Faq from "./pages/faq";
import Roles from "./pages/roles";
import Orders from "./pages/orders";
import Calendar from "./pages/calendar";
import Reports from "./pages/reports";

export default function App() {
  const [theme, ColorMode] = useMode();
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionExpired = () => {
      navigate("/login");
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, [navigate]);

  return (
    <ColorModeContext.Provider value={ColorMode}>
      <ThemeProvider theme={theme}>
        <SocketProvider>
          <SearchProvider>
            <CssBaseline />

            <Routes>
              {/* Ruta pública */}
              <Route path="/login" element={<Login />} />

              {/* Rutas privadas envueltas por AuthLayout */}
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <AuthLayout />
                  </PrivateRoute>
                }
              >
                {/* / → dashboard */}
                <Route index element={<Navigate to="dashboard" replace />} />

                {/* Accesibles para todo usuario logueado (Dashboard controla su propio contenido) */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />

                {/* Rutas con permisos específicos */}
                <Route
                  path="products"
                  element={
                    <PermissionRoute permission={['product_read', 'product_create', 'product_update', 'product_delete']}>
                      <Products />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="providers"
                  element={
                    <PermissionRoute permission={['provider_read', 'provider_create', 'provider_update', 'provider_delete']}>
                      <Providers />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="orders"
                  element={
                    <PermissionRoute permission={['order_read', 'order_create', 'order_update', 'order_delete']}>
                      <Orders />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="faq"
                  element={
                    <PermissionRoute permission={['faq_read', 'faq_create', 'faq_update', 'faq_delete']}>
                      <Faq />
                    </PermissionRoute>
                  }
                />

                {/* Rutas administrativas (ahora con permisos granulares) */}
                <Route
                  path="team"
                  element={
                    <PermissionRoute permission={['user_read', 'user_create', 'user_update', 'user_delete']}>
                      <Team />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="history"
                  element={
                    <PermissionRoute permission="history_view">
                      <History />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="categories"
                  element={
                    <PermissionRoute permission={['category_read', 'category_create', 'category_update', 'category_delete']}>
                      <Categories />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="locations"
                  element={
                    <PermissionRoute permission={['location_read', 'location_create', 'location_update', 'location_delete']}>
                      <Locations />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="brands"
                  element={
                    <PermissionRoute permission={['brand_read', 'brand_create', 'brand_update', 'brand_delete']}>
                      <Brands />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="ranks"
                  element={
                    <PermissionRoute permission={['rank_read', 'rank_create', 'rank_update', 'rank_delete']}>
                      <Ranks />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="roles"
                  element={
                    <PermissionRoute permission={['role_read', 'role_create', 'role_update', 'role_delete']}>
                      <Roles />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="calendar"
                  element={
                    <PermissionRoute permission="calendar_read">
                      <Calendar />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <PermissionRoute permission="report_view">
                      <Reports />
                    </PermissionRoute>
                  }
                />
                {/* Cualquier otra ruta privada → dashboard */}
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Route>
            </Routes>
          </SearchProvider>
        </SocketProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}