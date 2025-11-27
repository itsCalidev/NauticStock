// src/pages/profile/index.jsx
import React, { useEffect, useState, useRef } from "react";
import api from "../../api/axiosClient";

import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  Paper,
} from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { Token } from "../../theme";
import AppSnackbar from "../../components/AppSnackbar";
import defaultPic from "../../assets/default.png";
import { useSocket } from "../../context/SocketContext";

const schema = yup.object().shape({
  password: yup.string().min(8, "Mínimo 8 caracteres").required("Requerido"),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("password"), null], "Las contraseñas no coinciden")
    .required("Requerido"),
});

const Profile = () => {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const navigate = useNavigate();
  const socket = useSocket();

  const [user, setUser] = useState(null);
  const [initialValues, setInitialValues] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false, message: "", severity: "info"
  });

  // para revocar URLs temporales
  const prevUrlRef = useRef();

  useEffect(() => {
    const fetchUserData = async () => {
      const stored = localStorage.getItem("user");
      if (stored) {
        const localUser = JSON.parse(stored);
        setUser(localUser);

        // Initial set from local storage
        setInitialValues({
          name: localUser.name || "",
          email: localUser.email || "",
          account: localUser.account || "",
          rank: localUser.ranks || localUser.rank || "",
          password: "",
          confirm_password: ""
        });

        try {
          // Fetch latest data
          const { data } = await api.get(`/api/users/${localUser.id}`);
          const remoteUser = data.data || data;

          // Update local storage and state
          localStorage.setItem("user", JSON.stringify(remoteUser));
          setUser(remoteUser);
          setInitialValues({
            name: remoteUser.name || "",
            email: remoteUser.email || "",
            account: remoteUser.account || "",
            rank: remoteUser.ranks || remoteUser.rank || "",
            password: "",
            confirm_password: ""
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    fetchUserData();

    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
    };
  }, []);

  // Escuchar eventos de Socket.io para actualizar el perfil si cambia desde otro lado (ej: admin cambia rol)
  useEffect(() => {
    if (!socket || !user) return;

    const handleUserUpdate = (data) => {
      // Si el usuario actualizado es el usuario actual
      if (data.id === user.id || (data.data && data.data.id === user.id)) {
        console.log('🔔 Profile update received:', data);
        // Refrescar datos del usuario
        api.get(`/api/users/${user.id}`).then(res => {
          const updatedUser = res.data.data || res.data;
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
          setInitialValues({
            name: updatedUser.name || "",
            email: updatedUser.email || "",
            account: updatedUser.account || "",
            rank: updatedUser.ranks || updatedUser.rank || "",
            password: "",
            confirm_password: ""
          });
          showSnackbar("Tu perfil ha sido actualizado remotamente", "info");
        }).catch(err => console.error("Error refreshing profile", err));
      }
    };

    socket.on('user_updated', handleUserUpdate);
    socket.on('user_status_changed', handleUserUpdate);

    return () => {
      socket.off('user_updated', handleUserUpdate);
      socket.off('user_status_changed', handleUserUpdate);
    };
  }, [socket, user]);

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAvatarChange = e => {
    const file = e.target.files?.[0];
    if (file) {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      prevUrlRef.current = url;
      setPreviewUrl(url);
      setAvatarFile(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("avatar", avatarFile);
      const { data } = await api.post(
        `/users/${user.id}/avatar`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updated = { ...user, profile_pic: data.profile_pic };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setPreviewUrl(null);
      setAvatarFile(null);
      // window.dispatchEvent(new Event("userUpdated")); // Socket will handle this if needed, but local update is faster
      showSnackbar("Foto de perfil actualizada", "success");
    } catch (err) {
      showSnackbar(err.message || "Error subiendo la imagen", "error");
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordSubmit = async values => {
    if (!values.password || !values.confirm_password) {
      showSnackbar("Por favor ingresa y confirma la contraseña.", "warning");
      return;
    }
    if (values.password !== values.confirm_password) {
      showSnackbar("Las contraseñas no coinciden.", "error");
      return;
    }
    try {
      // 👇 CAMBIAR LA RUTA: usar /api/users/me/password en lugar de /users/${user.id}
      await api.put(`/api/users/me/password`, { password: values.password });
      showSnackbar(
        "La contraseña ha sido actualizada. Por razones de seguridad se cerrará la sesión.",
        "info"
      );
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete api.defaults.headers.common["Authorization"];
        navigate("/login", { replace: true });
      }, 3500);
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Error al actualizar.", "error");
    }
  };

  if (!initialValues) return null;

  return (
    <Box m="20px">
      <Header
        title="Actualizar Perfil"
        subtitle="Puedes cambiar foto, ver tus datos y actualizar contraseña"
      />

      {/* Avatar upload */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          display: "flex",
          alignItems: "center",
          gap: 3,
          backgroundColor: colors.primary[500],
        }}
      >
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Foto de perfil
          </Typography>
          <img
            src={previewUrl || user.profile_pic || defaultPic}
            alt="avatar"
            width={100}
            height={100}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              border: `2px solid ${colors.grey[300]}`,
            }}
          />
        </Box>
        <Box>
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="avatar-upload"
            type="file"
            onChange={handleAvatarChange}
          />
          <label htmlFor="avatar-upload">
            <Button variant="contained" color="secondary" component="span">
              Seleccionar archivo
            </Button>
          </label>
          {avatarFile && (
            <Typography variant="body2" mt={1}>
              Seleccionado: {avatarFile.name}
            </Typography>
          )}
          <Box mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAvatarUpload}
              disabled={!avatarFile || uploading}
            >
              {uploading ? "Subiendo…" : "Subir foto"}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* User info & password form */}
      <Box
        m="0 auto"
        p="30px"
        borderRadius="12px"
        maxWidth="900px"
        boxShadow={4}
        sx={{ backgroundColor: colors.primary[400] }}
      >
        <Formik
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={handlePasswordSubmit}
          enableReinitialize
        >
          {({
            values,
            errors,
            touched,
            handleBlur,
            handleChange,
            handleSubmit,
          }) => (
            <form onSubmit={handleSubmit}>
              <Box
                display="grid"
                gap="20px"
                gridTemplateColumns="repeat(12, 1fr)"
                sx={{
                  "& > div": {
                    gridColumn: isNonMobile ? "span 6" : "span 12",
                  },
                }}
              >

                {/** Campos read-only con alerta **/}
                {[
                  ["Nombre completo", "name"],
                  ["Correo electrónico", "email"],
                  ["Matrícula", "account"],
                  ["Rango", "rank"],
                ].map(([label, field]) => (
                  <TextField
                    key={field}
                    fullWidth
                    variant="filled"
                    label={label}
                    value={values[field]}
                    InputProps={{ readOnly: true }}
                    inputProps={{
                      style: { cursor: "pointer" },
                      onClick: () => showSnackbar(`Si deseas cambiar tu ${label}, contacta al Administrador.`),
                      onSelect: () => showSnackbar(`Si deseas cambiar tu ${label}, contacta al Administrador.`),
                    }}
                  />
                ))}

                {/** Campos de contraseña **/}
                <TextField
                  fullWidth
                  variant="filled"
                  type="password"
                  label="Nueva contraseña"
                  name="password"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.password}
                  error={!!touched.password && !!errors.password}
                  helperText={touched.password && errors.password}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="password"
                  label="Confirmar contraseña"
                  name="confirm_password"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.confirm_password}
                  error={!!touched.confirm_password && !!errors.confirm_password}
                  helperText={touched.confirm_password && errors.confirm_password}
                />
              </Box>

              <Box display="flex" justifyContent="flex-end" mt="30px">
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  sx={{ px: 5, py: 1.5 }}
                >
                  Actualizar mi contraseña
                </Button>
              </Box>
            </form>
          )}
        </Formik>
      </Box>

      <AppSnackbar
        key={snackbar.message}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default Profile;
