// src/pages/createUser.jsx
import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import { Token } from "../../theme";
import AppSnackbar from "../../components/AppSnackbar";

const checkoutSchema = yup.object().shape({
  name:     yup.string().required("Requerido"),
  password: yup.string().required("Requerido").min(8, "Mínimo 8 caracteres"),
  account:  yup.string().required("Requerido"),
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

const CreateUser = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme       = useTheme();
  const colors      = Token(theme.palette.mode);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleFormSubmit = async (values, { resetForm }) => {
    try {
      // Forzamos status: 0 (activo)
      const payload = { ...values, status: 0 };
      const response = await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: "Usuario creado exitosamente",
          severity: "success",
        });
        resetForm();
      } else if (response.status === 400 || response.status === 409) {
        setSnackbar({
          open: true,
          message: data.message || "Ya existe un usuario con esos datos",
          severity: "warning",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Error inesperado al crear el usuario",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setSnackbar({
        open: true,
        message: "Fallo de conexión con el servidor",
        severity: "error",
      });
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
                <TextField
                  fullWidth
                  variant="filled"
                  label="Nombre completo"
                  name="name"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.name}
                  error={!!touched.name && !!errors.name}
                  helperText={touched.name && errors.name}
                />

                <TextField
                  fullWidth
                  variant="filled"
                  label="Matrícula"
                  name="account"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.account}
                  error={!!touched.account && !!errors.account}
                  helperText={touched.account && errors.account}
                />

                <TextField
                  fullWidth
                  variant="filled"
                  label="Correo electrónico"
                  name="email"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.email}
                  error={!!touched.email && !!errors.email}
                  helperText={touched.email && errors.email}
                />

                <TextField
                  fullWidth
                  variant="filled"
                  type="password"
                  label="Contraseña"
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
                  label="Rango"
                  name="ranks"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.ranks}
                  error={!!touched.ranks && !!errors.ranks}
                  helperText={touched.ranks && errors.ranks}
                />

                {/* Select para el rol */}
                <FormControl
                  fullWidth
                  variant="filled"
                  error={!!touched.roleId && !!errors.roleId}
                >
                  <InputLabel id="role-label">Rol</InputLabel>
                  <Select
                    labelId="role-label"
                    label="Rol"
                    name="roleId"
                    value={values.roleId}
                    onBlur={handleBlur}
                    onChange={handleChange}
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

              <Box display="flex" justifyContent="flex-end" mt="30px">
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  sx={{ px: "40px", py: "10px", fontSize: "16px" }}
                >
                  Crear Usuario
                </Button>
              </Box>
            </form>
          )}
        </Formik>
      </Box>

      <AppSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default CreateUser;
