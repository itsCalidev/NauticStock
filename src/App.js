import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";

import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import AuthLayout from "./pages/layouts/AuthLayout";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Team from "./pages/team";
import Products from "./pages/products";
import Providers from "./pages/providers";
import Profile from "./pages/profile";
import CreateUser from "./pages/createUser";
import EditUser from "./pages/editUser";

export default function App() {
  const [theme, ColorMode] = useMode();

  return (
    <ColorModeContext.Provider value={ColorMode}>
      <ThemeProvider theme={theme}>
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
              path="createUser"
              element={
                <AdminRoute>
                  <CreateUser />
                </AdminRoute>
              }
            />
            <Route
              path="users/:id/edit"
              element={
                <AdminRoute>
                  <EditUser />
                </AdminRoute>
              }
            />

            {/* Cualquier otra ruta privada → dashboard */}
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
