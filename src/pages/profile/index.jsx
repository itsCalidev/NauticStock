import { Box, Button, TextField, useTheme } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import { Token } from "../../theme";

const Profile = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme = useTheme();
  const colors = Token(theme.palette.mode);

  const handleFormSubmit = (values) => {
    console.log("Perfil actualizado:", values);
  };

  return (
    <Box m="20px">
      <Header title="Actualizar Perfil" subtitle="Modifica tu información personal" />

      <Box
        m="40px auto"
        p="30px"
        borderRadius="12px"
        maxWidth="900px"
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
                  "& > div": { gridColumn: isNonMobile ? "span 6" : "span 12" },
                }}
              >
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
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
                  type="email"
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
                  type="password"
                  label="Confirmar contraseña"
                  name="confirm_password"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.confirm_password}
                  error={!!touched.confirm_password && !!errors.confirm_password}
                  helperText={touched.confirm_password && errors.confirm_password}
                />

                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
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
                  type="text"
                  label="Rango"
                  name="rank"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.rank}
                  error={!!touched.rank && !!errors.rank}
                  helperText={touched.rank && errors.rank}
                />
              </Box>

              <Box display="flex" justifyContent="flex-end" mt="30px">
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  sx={{ px: 5, py: 1.5 }}
                >
                  Actualizar mi perfil
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
  email: yup.string().email("Correo inválido").required("Requerido"),
  password: yup.string().min(8, "Mínimo 8 caracteres"),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("password"), null], "Las contraseñas no coinciden"),
  account: yup.string().required("Requerido"),
  rank: yup.string().required("Requerido"),
});

const initialValues = {
  name: "",
  email: "",
  password: "",
  confirm_password: "",
  account: "",
  rank: "",
};

export default Profile;
