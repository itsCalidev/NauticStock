// pages/login.jsx
import React, { useState, useContext } from "react";
import api from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { Token, ColorModeContext } from "../theme";
import AppSnackbar from "../components/AppSnackbar";
import AccessibilitySidebar from "../pages/layouts/SidebarAccesibility";
import LoginImage from "../assets/Mantenimiento_Elect.png";
import LogoImage from "../assets/SEMAR.png";
import Hojas from "../assets/Hojitas.png";

const Login = () => {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const isNonMobile = useMediaQuery("(min-width:900px)");
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const handleLogin = async () => {
    const { email, password } = credentials;
    if (!email || !password) {
      setSnackbar({
        open: true,
        message: "Por favor, completa todos los campos.",
        severity: "warning",
      });
      return;
    }

    try {
      const response = await api.post("/login", { email, password });
      const { token, user } = response.data.data;

      // guardar token y datos del usuario
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      // configurar axios para enviar el token en futuras peticiones
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      setSnackbar({
        open: true,
        message: "¡Bienvenido!",
        severity: "success",
      });
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || err.message,
        severity: "error",
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: isNonMobile ? "row" : "column",
        backgroundColor: isDark ? "#1f1f1f" : "#fff",
        transition: "background-color 0.3s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Fondo institucional con hojitas */}
      <Box
        component="img"
        src={Hojas}
        alt="decoracion institucional"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "50%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.7,
          zIndex: 0,
        }}
      />

      {/* Barras institucionales */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "40px",
          height: "100vh",
          backgroundColor: "#8B1F3B",
        }}
      />
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100vw",
          height: "40px",
          backgroundColor: "#8B1F3B",
        }}
      />

      {/* Panel izquierdo - Formulario */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 5,
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "450px",
            backgroundColor: isDark ? "#141b2d" : "#d5d5d5",
            padding: "40px",
            borderRadius: "24px",
            boxShadow: 3,
            position: "relative",
          }}
        >
          <IconButton
            onClick={colorMode.toggleColorMode}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: isDark ? "#fff" : "#000"
            }}
          >
            {isDark ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          <Typography
            variant="h2"
            fontWeight="bold"
            textAlign="center"
            mb={4}
            color={isDark ? colors.grey[100] : "#000"}
          >
            Inicio de Sesión
          </Typography>

          <TextField
            fullWidth
            variant="filled"
            label="Correo electrónico"
            sx={{
              mb: 3,
              backgroundColor: isDark ? "#2e3b55" : "#fff",
              borderRadius: "12px",
              input: { color: isDark ? "#fff" : "#000" },
            }}
            InputProps={{ disableUnderline: true }}
            value={credentials.email}
            onChange={(e) =>
              setCredentials({ ...credentials, email: e.target.value })
            }
          />

          <TextField
            fullWidth
            variant="filled"
            label="Contraseña"
            type="password"
            sx={{
              mb: 3,
              backgroundColor: isDark ? "#2e3b55" : "#fff",
              borderRadius: "12px",
              input: { color: isDark ? "#fff" : "#000" },
            }}
            InputProps={{ disableUnderline: true }}
            value={credentials.password}
            onChange={(e) =>
              setCredentials({ ...credentials, password: e.target.value })
            }
          />

          <Button
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: "#8B1F3B",
              color: "#fff",
              borderRadius: "10px",
              py: 1.5,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "16px",
              boxShadow: 3,
              "&:hover": {
                backgroundColor: "#6f182e",
              },
            }}
            onClick={handleLogin}
          >
            Iniciar sesión
          </Button>
        </Box>
      </Box>

      {/* Panel derecho - Imagen y logo */}
      <Box
        sx={{
          flex: 1,
          backgroundColor: isDark ? "#1f1f1f" : "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transition: "background-color 0.3s",
          p: 4,
          gap: 8,
        }}
      >
        <Box
          component="img"
          src={LogoImage}
          alt="logo"
          sx={{
            width: "300px",
            objectFit: "contain",
          }}
        />
        <Box
          component="img"
          src={LoginImage}
          alt="escudo"
          sx={{
            maxWidth: "50%",
            height: "auto",
            filter: isDark ? "none" : "grayscale(0.2)",
          }}
        />
      </Box>


      <AccessibilitySidebar />

      <AppSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default Login;
