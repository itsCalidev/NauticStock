import React, { useEffect, useState } from "react";
import api from "../../api/axiosClient";
import { 
  Box, 
  TextField, 
  Button, 
  useTheme, 
  Alert,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { Token } from "../../theme";

const schema = yup.object().shape({
  name: yup.string().required("Requerido"),
  account: yup.string()
    .required("Requerido")
    .matches(/^\d+$/, "La matrícula solo debe contener números")
    .max(10, "La matrícula no puede tener más de 10 caracteres"),
  email: yup.string().email("Inválido").required("Requerido"),
  ranks: yup.string().required("Requerido"),
  roleId: yup.number().required("Rol es requerido"),
  password: yup.string().min(8, "Mínimo 8 caracteres"),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("password"), null], "Las contraseñas no coinciden")
});

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  
  const [initVals, setInitVals] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Para verificar permisos

  useEffect(() => {
    // Verificar usuario actual
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get(`/api/users/${id}`);
        
        console.log('📡 Respuesta completa:', response);
        console.log('📡 response.data:', response.data);
        
        let userData = null;
        
        if (response.data && response.data.data) {
          userData = response.data.data;
          console.log('✅ Estructura: data.data');
        } else if (response.data && response.data.id) {
          userData = response.data;
          console.log('✅ Estructura: datos directos');
        }
        
        if (!userData) {
          throw new Error('No se pudieron obtener los datos del usuario');
        }
        
        console.log('📋 Datos del usuario:', userData);
        
        const formData = {
          name: userData.name || '',
          account: userData.account || '',
          email: userData.email || '',
          ranks: userData.ranks || '',
          roleId: userData.roleId || 2, // Default a capturista
          password: "",
          confirm_password: ""
        };
        
        setInitVals(formData);
        
        // Guardar datos originales para comparación
        setOriginalData({
          name: userData.name || '',
          account: userData.account || '',
          email: userData.email || '',
          ranks: userData.ranks || '',
          roleId: userData.roleId || 2
        });
        
      } catch (err) {
        console.error('❌ Error completo:', err);
        console.error('❌ Error response:', err.response);
        setError(err.response?.data?.error || 'Error al cargar usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  // Verificar si hay cambios
  const hasChanges = (values) => {
    if (!originalData) return false;
    
    const basicFieldsChanged = 
      values.name !== originalData.name ||
      values.account !== originalData.account ||
      values.email !== originalData.email ||
      values.ranks !== originalData.ranks ||
      parseInt(values.roleId) !== parseInt(originalData.roleId); // Comparar rol
    
    const passwordChanged = values.password && values.password.length > 0;
    
    return basicFieldsChanged || passwordChanged;
  };

  const handleSubmit = async (values) => {
    // Validar permisos para cambiar rol
    if (parseInt(values.roleId) !== parseInt(originalData.roleId)) {
      if (!currentUser || currentUser.roleId !== 1) {
        setError("Solo los administradores pueden cambiar roles de usuario");
        return;
      }
      
      // Verificar que no se esté auto-degradando
      if (parseInt(id) === currentUser.id && parseInt(values.roleId) !== 1) {
        setError("No puedes cambiar tu propio rol de administrador");
        return;
      }
    }

    if (!hasChanges(values)) {
      setError("No se han realizado cambios para guardar");
      return;
    }

    // Validar contraseñas si se están cambiando
    if (values.password || values.confirm_password) {
      if (!values.password) {
        setError("Debes ingresar una nueva contraseña");
        return;
      }
      if (values.password !== values.confirm_password) {
        setError("Las contraseñas no coinciden");
        return;
      }
      if (values.password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres");
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      // Preparar payload solo con campos modificados
      const payload = {};
      
      if (values.name !== originalData.name) payload.name = values.name;
      if (values.account !== originalData.account) payload.account = values.account;
      if (values.email !== originalData.email) payload.email = values.email;
      if (values.ranks !== originalData.ranks) payload.ranks = values.ranks;
      if (parseInt(values.roleId) !== parseInt(originalData.roleId)) payload.roleId = parseInt(values.roleId);
      
      if (values.password) payload.password = values.password;

      console.log('Enviando payload:', payload);

      await api.put(`/api/users/${id}`, payload);

      // Disparar eventos para sincronización
      window.dispatchEvent(new Event("userUpdated"));
      localStorage.setItem('userChanged', Date.now().toString());
      
      // Redirigir con éxito
      navigate("/team", { 
        state: { 
          message: "Usuario actualizado exitosamente",
          severity: "success" 
        }
      });
      
    } catch (err) {
      console.error('Error actualizando usuario:', err);
      setError(err.response?.data?.error || 'Error al actualizar usuario');
    } finally {
      setSubmitting(false);
    }
  };

  // Obtener el nombre del rol
  const getRoleName = (roleId) => {
    switch(parseInt(roleId)) {
      case 1: return "Administrador";
      case 2: return "Capturista";
      case 3: return "Consultor";
      default: return "Desconocido";
    }
  };

  // Verificar si es admin
  const isAdmin = currentUser?.roleId === 1;

  // Pantalla de carga
  if (loading) {
    return (
      <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress size={60} />
        <Box ml={2} fontSize="1.2rem">Cargando usuario...</Box>
      </Box>
    );
  }

  // Pantalla de error
  if (error && !initVals) {
    return (
      <Box m="20px">
        <Header title="Error" subtitle="No se pudo cargar el usuario" />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => navigate("/team")}
          sx={{ mt: 2 }}
        >
          Volver al Equipo
        </Button>
      </Box>
    );
  }

  if (!initVals) return null;

  return (
    <Box m="20px">
      <Header title="Editar Usuario" subtitle={`ID ${id} - ${initVals.name}`} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box
        m="40px auto"
        p="30px"
        borderRadius="12px"
        maxWidth="800px"
        boxShadow={4}
        sx={{ backgroundColor: colors.primary[400] }}
      >
        <Formik
          initialValues={initVals}
          validationSchema={schema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <Box 
                display="grid" 
                gap="20px" 
                gridTemplateColumns="repeat(12,1fr)"
                sx={{ "& > div": { gridColumn: "span 6" } }}
              >
                <TextField
                  fullWidth 
                  variant="filled" 
                  label="Nombre"
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
                  onChange={(e) => {
                    // Solo permitir números y máximo 10 caracteres
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    e.target.value = value;
                    handleChange(e);
                  }}
                  value={values.account}
                  error={!!touched.account && !!errors.account}
                  helperText={touched.account && errors.account}
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    maxLength: 10
                  }}
                />
                
                <TextField
                  fullWidth 
                  variant="filled" 
                  label="Email"
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
                  label="Rango"
                  name="ranks" 
                  onBlur={handleBlur} 
                  onChange={handleChange}
                  value={values.ranks}
                  error={!!touched.ranks && !!errors.ranks}
                  helperText={touched.ranks && errors.ranks}
                />

                {/* 👇 NUEVO: Campo de Rol */}
                <FormControl 
                  fullWidth 
                  variant="filled" 
                  error={!!touched.roleId && !!errors.roleId}
                  sx={{ gridColumn: "span 6" }}
                >
                  <InputLabel id="role-label">Rol del Usuario</InputLabel>
                  <Select
                    labelId="role-label"
                    label="Rol del Usuario"
                    name="roleId"
                    value={values.roleId}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    disabled={!isAdmin || (parseInt(id) === currentUser?.id)} // Deshabilitar si no es admin o se edita a sí mismo
                  >
                    <MenuItem value={1}>Administrador</MenuItem>
                    <MenuItem value={2}>Capturista</MenuItem>
                    <MenuItem value={3}>Consultor</MenuItem>
                  </Select>
                  {touched.roleId && errors.roleId && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.roleId}
                    </Typography>
                  )}
                  {(!isAdmin || parseInt(id) === currentUser?.id) && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      {!isAdmin ? "Solo administradores pueden cambiar roles" : "No puedes cambiar tu propio rol"}
                    </Typography>
                  )}
                </FormControl>

                {/* Información adicional */}
                <Box sx={{ gridColumn: "span 6" }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Rol actual:</strong> {getRoleName(originalData?.roleId)}
                  </Typography>
                  {parseInt(values.roleId) !== parseInt(originalData?.roleId) && (
                    <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                      ⚠️ <strong>Cambiando a:</strong> {getRoleName(values.roleId)}
                    </Typography>
                  )}
                </Box>

                {/* Sección de contraseña */}
                <Box sx={{ gridColumn: "span 12", mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Cambiar Contraseña (Opcional)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Deja estos campos vacíos si no deseas cambiar la contraseña
                  </Typography>
                </Box>

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

              {/* Botones */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mt="30px">
                <Typography variant="body2" color="text.secondary">
                  {hasChanges(values) ? 
                    "✓ Hay cambios pendientes por guardar" : 
                    "Sin cambios"
                  }
                </Typography>
                
                <Box display="flex" gap="10px">
                  <Button
                    type="button"
                    color="secondary"
                    variant="outlined"
                    onClick={() => navigate("/team")}
                    disabled={submitting}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    Cancelar
                  </Button>
                  
                  <Button
                    type="submit"
                    color="secondary"
                    variant="contained"
                    disabled={!hasChanges(values) || submitting}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    {submitting ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </Button>
                </Box>
              </Box>
            </form>
          )}
        </Formik>
      </Box>
    </Box>
  );
};

export default EditUser;