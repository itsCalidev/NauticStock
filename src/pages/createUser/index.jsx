import React, { useState } from "react";
import { Box, Button, TextField, useTheme, FormControl, InputLabel, Select, MenuItem, CircularProgress } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { Token } from "../../theme";
import AppSnackbar from "../../components/AppSnackbar";
import api from "../../api/axiosClient";

const checkoutSchema = yup.object().shape({
  name:     yup.string().required("Requerido"),
  password: yup.string().required("Requerido").min(8, "Mínimo 8 caracteres"),
  account:  yup.string()
    .required("Requerido")
    .matches(/^\d+$/, "La matrícula solo debe contener números")
    .max(10, "La matrícula no puede tener más de 10 caracteres"),
  email:    yup.string().email("Correo inválido").required("Requerido"),
  ranks:    yup.string().required("Requerido"),
  roleId:   yup.number().required("Requerido"),
});

const initialValues = {
  name:     "",
  password: "",
  account:  "",
  email:    "",
  ranks:    "",
  roleId:   "",  // 1, 2 ó 3
};

export default function CreateUser() {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme       = useTheme();
  const colors      = Token(theme.palette.mode);
  const navigate    = useNavigate();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // 👇 NUEVO: Estado para controlar envío
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (values, { resetForm }) => {
    // 👇 NUEVO: Prevenir envíos múltiples
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const payload = { ...values, status: 0 };

    try {
      // 👇 CORREGIR: Usar /api/users en lugar de /users
      const { data } = await api.post("/api/users", payload);

      setSnackbar({
        open:    true,
        message: "Usuario creado exitosamente",
        severity:"success",
      });

      // 1) Resetea el formulario
      resetForm();

      // 2) Dispara un evento global para quien lo escuche
      window.dispatchEvent(new Event("userCreated"));

      // 3) Redirige después de 2 segundos
      setTimeout(() => {
        navigate("/team", { replace: true });
      }, 2000);

    } catch (err) {
      console.error('Error creando usuario:', err);
      
      if (err.response) {
        const { status, data } = err.response;

        const msg =
          status === 400 || status === 409
            ? data.error || data.message || "Ya existe un usuario con esos datos"
            : data.error || "Error inesperado al crear el usuario";

        setSnackbar({
          open:    true,
          message: msg,
          severity: status === 400 || status === 409 ? "warning" : "error",
        });
      } else {
        console.error("Axios error:", err);
        setSnackbar({
          open:    true,
          message: "Fallo de conexión con el servidor",
          severity:"error",
        });
      }
    } finally {
      // 👇 NUEVO: Rehabilitar botón
      setIsSubmitting(false);
    }
  };

  return (
    <Box m="20px">
      <Header
        title="Crear Usuario"
        subtitle="Completa el formulario para registrar un nuevo usuario"
      />

      <Box
        m="40px auto"
        p="30px"
        borderRadius="12px"
        maxWidth="800px"
        boxShadow={4}
        sx={{ backgroundColor: colors.primary[400] }}
      >
        <Formik
          onSubmit={handleFormSubmit}
          initialValues={initialValues}
          validationSchema={checkoutSchema}
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit }) => (
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
                <TextField
                  fullWidth variant="filled" label="Nombre completo"
                  name="name" onBlur={handleBlur} onChange={handleChange}
                  value={values.name}
                  error={!!touched.name && !!errors.name}
                  helperText={touched.name && errors.name}
                  disabled={isSubmitting} // 👈 NUEVO: Deshabilitar durante envío
                />                <TextField
                  fullWidth variant="filled" label="Matrícula"
                  name="account" 
                  onBlur={handleBlur} 
                  onChange={(e) => {
                    // Solo permitir números y máximo 10 caracteres
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    e.target.value = value;
                    handleChange(e);
                  }}
                  value={values.account}
                  error={!!touched.account && !!errors.account}
                  helperText={touched.account && errors.account}
                  disabled={isSubmitting} // 👈 NUEVO
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    maxLength: 10
                  }}
                />

                <TextField
                  fullWidth variant="filled" label="Correo electrónico"
                  name="email" onBlur={handleBlur} onChange={handleChange}
                  value={values.email}
                  error={!!touched.email && !!errors.email}
                  helperText={touched.email && errors.email}
                  disabled={isSubmitting} // 👈 NUEVO
                />

                <TextField
                  fullWidth variant="filled" type="password" label="Contraseña"
                  name="password" onBlur={handleBlur} onChange={handleChange}
                  value={values.password}
                  error={!!touched.password && !!errors.password}
                  helperText={touched.password && errors.password}
                  disabled={isSubmitting} // 👈 NUEVO
                />

                <TextField
                  fullWidth variant="filled" label="Rango"
                  name="ranks" onBlur={handleBlur} onChange={handleChange}
                  value={values.ranks}
                  error={!!touched.ranks && !!errors.ranks}
                  helperText={touched.ranks && errors.ranks}
                  disabled={isSubmitting} // 👈 NUEVO
                />

                <FormControl fullWidth variant="filled" error={!!touched.roleId && !!errors.roleId}>
                  <InputLabel id="role-label">Rol</InputLabel>
                  <Select
                    labelId="role-label"
                    label="Rol"
                    name="roleId"
                    value={values.roleId}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    disabled={isSubmitting} // 👈 NUEVO
                  >
                    <MenuItem value={1}>Administrador</MenuItem>
                    <MenuItem value={2}>Capturista</MenuItem>
                    <MenuItem value={3}>Consultor</MenuItem>
                  </Select>
                  {touched.roleId && errors.roleId && (
                    <Box mt={1} color="error.main" fontSize="0.75rem">
                      {errors.roleId}
                    </Box>
                  )}
                </FormControl>
              </Box>

              {/* 👇 BOTONES MEJORADOS */}
              <Box display="flex" justifyContent="end" mt="30px" gap="10px">
                <Button
                  type="button"
                  color="secondary"
                  variant="outlined"
                  onClick={() => navigate("/team")}
                  disabled={isSubmitting} // 👈 NUEVO
                  sx={{ px: 4, py: 1.5 }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  color="secondary"
                  variant="contained"
                  disabled={isSubmitting} // 👈 NUEVO
                  sx={{ px: 4, py: 1.5 }}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Creando...
                    </>
                  ) : (
                    "Crear Usuario"
                  )}
                </Button>
              </Box>
            </form>
          )}
        </Formik>
      </Box>

      <AppSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}