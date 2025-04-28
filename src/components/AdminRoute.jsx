// src/components/AdminRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  let user = null;
  try { user = JSON.parse(localStorage.getItem("user")); }
  catch {}
  if (!user || user.roleId !== 1) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default AdminRoute;
