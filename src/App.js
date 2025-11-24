import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import { SearchProvider } from './contexts/SearchContext';

import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
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
        {/* 👇 AGREGAR SearchProvider AQUÍ */}
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

              {/* Accesibles para todo usuario logueado */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="providers" element={<Providers />} />
              <Route path="profile" element={<Profile />} />
              <Route path="faq" element={<Faq />} />

              {/* Solo administradores */}
              <Route
                path="team"
                element={
                  <AdminRoute>
                    <Team />
                  </AdminRoute>
                }
              />
              <Route
                path="history"
                element={
                  <AdminRoute>
                    <History />
                  </AdminRoute>
                }
              />
              <Route
                path="categories"
                element={
                  <AdminRoute>
                    <Categories />
                  </AdminRoute>
                }
              />
              <Route
                path="locations"
                element={
                  <AdminRoute>
                    <Locations />
                  </AdminRoute>
                }
              />
              <Route
                path="brands"
                element={
                  <AdminRoute>
                    <Brands />
                  </AdminRoute>
                }
              />
              <Route
                path="ranks"
                element={
                  <AdminRoute>
                    <Ranks />
                  </AdminRoute>
                }
              />
              <Route
                path="roles"
                element={
                  <AdminRoute>
                    <Roles />
                  </AdminRoute>
                }
              />
              {/* Cualquier otra ruta privada → dashboard */}
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          </Routes>
        </SearchProvider>
        {/* 👆 CERRAR SearchProvider AQUÍ */}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}