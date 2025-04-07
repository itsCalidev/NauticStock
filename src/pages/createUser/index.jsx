import { Box, Button, TextField, useTheme, Typography } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import { Token } from "../../theme";

const CreateUser = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme = useTheme();
  const colors = Token(theme.palette.mode);

  const handleFormSubmit = async (values) => {
    try {
      const response = await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      console.log("Usuario registrado:", data);
    } catch (error) {
      console.error("Error al registrar el usuario:", error);
    }
  };

  return (
    <Box m="20px">
      <Header title="Crear Usuario" subtitle="Completa el formulario para registrar un nuevo usuario" />

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
                  "& > div": { gridColumn: isNonMobile ? "span 6" : "span 12" },
                }}
              >
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Nombre completo"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.name}
                  name="name"
                  error={!!touched.name && !!errors.name}
                  helperText={touched.name && errors.name}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Cuenta"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.account}
                  name="account"
                  error={!!touched.account && !!errors.account}
                  helperText={touched.account && errors.account}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="email"
                  label="Correo electrónico"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.email}
                  name="email"
                  error={!!touched.email && !!errors.email}
                  helperText={touched.email && errors.email}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="password"
                  label="Contraseña"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.password}
                  name="password"
                  error={!!touched.password && !!errors.password}
                  helperText={touched.password && errors.password}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Rango"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.ranks}
                  name="ranks"
                  error={!!touched.ranks && !!errors.ranks}
                  helperText={touched.ranks && errors.ranks}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Estado"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.status}
                  name="status"
                  error={!!touched.status && !!errors.status}
                  helperText={touched.status && errors.status}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="number"
                  label="Rol ID"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.roleId}
                  name="roleId"
                  error={!!touched.roleId && !!errors.roleId}
                  helperText={touched.roleId && errors.roleId}
                />
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
    </Box>
  );
};

const checkoutSchema = yup.object().shape({
  name: yup.string().required("Requerido"),
  password: yup.string().required("Requerido").min(8, "Mínimo 8 caracteres"),
  account: yup.string().required("Requerido"),
  email: yup.string().email("Correo inválido").required("Requerido"),
  ranks: yup.string().required("Requerido"),
  status: yup.string().required("Requerido"),
  roleId: yup.number().required("Requerido"),
});

const initialValues = {
  name: "",
  password: "",
  account: "",
  email: "",
  ranks: "",
  status: "",
  roleId: "",
};

export default CreateUser;
