import React, { useState, useEffect } from "react";
import api from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography, useTheme } from "@mui/material";
import { Token } from "../theme";
import AppSnackbar from "../components/AppSnackbar";
import LogoImage from "../assets/SEMAR.png";

const CambioObligatorio = () => {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const tempToken = sessionStorage.getItem("temp_restricted_token");

  useEffect(() => {
    if (!tempToken) {
      navigate("/login");
    }
  }, [tempToken, navigate]);

  const handleSubmit = async () => {
    if (!passwords.newPassword || !passwords.confirmPassword) {
      return setSnackbar({ open: true, message: "Llena ambos campos", severity: "warning" });
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setSnackbar({ open: true, message: "Las contraseñas no coinciden", severity: "error" });
    }

    try {
      const response = await api.post(
        "/api/users/force-password-change",
        { new_password: passwords.newPassword },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );

      if (response.status === 200) {
        sessionStorage.removeItem("temp_restricted_token");
        setSnackbar({ open: true, message: "Contraseña actualizada con éxito. Redirigiendo...", severity: "success" });
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.response?.data?.error || "Error al actualizar",
        severity: "error",
      });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" }}>
      <Box sx={{ width: "100%", maxWidth: "450px", backgroundColor: isDark ? "#141b2d" : "#fff", padding: "40px", borderRadius: "12px", boxShadow: 3 }}>
        <Box display="flex" justifyContent="center" mb={3}>
          <img src={LogoImage} alt="logo" style={{ width: "150px" }} />
        </Box>

        <Typography variant="h4" fontWeight="bold" textAlign="center" mb={1} color={colors.grey[100]}>
          Cambio Obligatorio
        </Typography>
        <Typography variant="body2" textAlign="center" mb={4} color={colors.grey[300]}>
          Por razones de seguridad, debes actualizar tu contraseña temporal antes de continuar.
        </Typography>

        <TextField
          fullWidth variant="filled" type="password" label="Nueva Contraseña" sx={{ mb: 3 }}
          value={passwords.newPassword}
          onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
        />
        <TextField
          fullWidth variant="filled" type="password" label="Confirmar Nueva Contraseña" sx={{ mb: 4 }}
          value={passwords.confirmPassword}
          onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
        />

        <Button fullWidth variant="contained" color="secondary" sx={{ py: 1.5, fontWeight: "bold" }} onClick={handleSubmit}>
          Actualizar Contraseña
        </Button>
      </Box>
      <AppSnackbar open={snackbar.open} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} severity={snackbar.severity} />
    </Box>
  );
};

export default CambioObligatorio;