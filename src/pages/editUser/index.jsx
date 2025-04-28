// src/pages/editUser/index.jsx
import React, { useEffect, useState } from "react";
import axios from "../../api/axiosClient";
import { Box, TextField, Button, useTheme } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { Token } from "../../theme";

const schema = yup.object().shape({
  name:   yup.string().required("Requerido"),
  account: yup.string().required("Requerido"),
  email:   yup.string().email("Inválido").required("Requerido"),
  ranks:   yup.string().required("Requerido"),
  password: yup.string().min(8, "Mínimo 8 caracteres"),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("password"), null], "No coinciden")
});

const EditUser = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const theme        = useTheme();
  const colors       = Token(theme.palette.mode);
  const [initVals, setInitVals] = useState(null);

  useEffect(() => {
    axios.get(`/users/${id}`)
      .then(({ data }) => {
        setInitVals({
          name: data.name,
          account: data.account,
          email: data.email,
          ranks: data.ranks,
          password: "",
          confirm_password: ""
        });
      })
      .catch(console.error);
  }, [id]);

  if (!initVals) return null;

  const handleSubmit = async values => {
    const payload = {
      name: values.name,
      account: values.account,
      email: values.email,
      ranks: values.ranks
    };
    if (values.password) payload.password = values.password;

    await axios.put(`/users/${id}`, payload);
    navigate("/team");
  };

  return (
    <Box m="20px">
      <Header title="Editar Usuario" subtitle={`ID ${id}`} />
      <Box
        m="40px auto"
        p="30px"
        borderRadius="12px"
        maxWidth="600px"
        boxShadow={4}
        sx={{ backgroundColor: colors.primary[400] }}
      >
        <Formik
          initialValues={initVals}
          validationSchema={schema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <Box display="grid" gap="20px" gridTemplateColumns="repeat(12,1fr)"
                   sx={{ "& > div": { gridColumn: "span 6" } }}>
                <TextField
                  fullWidth variant="filled" label="Nombre"
                  name="name" onBlur={handleBlur} onChange={handleChange}
                  value={values.name}
                  error={!!touched.name && !!errors.name}
                  helperText={touched.name && errors.name}
                />
                <TextField
                  fullWidth variant="filled" label="Matrícula"
                  name="account" onBlur={handleBlur} onChange={handleChange}
                  value={values.account}
                  error={!!touched.account && !!errors.account}
                  helperText={touched.account && errors.account}
                />
                <TextField
                  fullWidth variant="filled" label="Email"
                  name="email" onBlur={handleBlur} onChange={handleChange}
                  value={values.email}
                  error={!!touched.email && !!errors.email}
                  helperText={touched.email && errors.email}
                />
                <TextField
                  fullWidth variant="filled" label="Rango"
                  name="ranks" onBlur={handleBlur} onChange={handleChange}
                  value={values.ranks}
                  error={!!touched.ranks && !!errors.ranks}
                  helperText={touched.ranks && errors.ranks}
                />

                {/* Sólo cambia contraseña si el Admin lo rellena */}
                <TextField
                  fullWidth variant="filled" type="password"
                  label="Nueva contraseña"
                  name="password" onBlur={handleBlur} onChange={handleChange}
                  value={values.password}
                  error={!!touched.password && !!errors.password}
                  helperText={touched.password && errors.password}
                />
                <TextField
                  fullWidth variant="filled" type="password"
                  label="Confirmar contraseña"
                  name="confirm_password"
                  onBlur={handleBlur} onChange={handleChange}
                  value={values.confirm_password}
                  error={!!touched.confirm_password && !!errors.confirm_password}
                  helperText={touched.confirm_password && errors.confirm_password}
                />
              </Box>

              <Box display="flex" justifyContent="flex-end" mt="30px">
                <Button type="submit" variant="contained" color="secondary">
                  Guardar cambios
                </Button>
              </Box>
            </form>
          )}
        </Formik>
      </Box>
    </Box>
  );
};

export default EditUser;
