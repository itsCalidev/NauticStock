import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosClient";
import {
  Box,
  Button,
  Chip,
  Typography,
  useTheme,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Header from "../../components/Header";
import { Token } from "../../theme";
import { useSearch } from '../../contexts/SearchContext';
import SearchHighlighter from '../../components/SearchHighlighter';
import AppSnackbar from "../../components/AppSnackbar";
import { Formik } from "formik";
import * as yup from "yup";
import { useSocket } from "../../context/SocketContext";
import usePermission from "../../hooks/usePermission";
import { flexibleMatch } from "../../utils/searchUtils";
import { exportToExcel } from "../../utils/exportUtils";

const userSchema = yup.object().shape({
  name: yup.string().required("Requerido"),
  password: yup.string().min(8, "Mínimo 8 caracteres").when('isEditing', {
    is: false,
    then: () => yup.string().required("Requerido"),
    otherwise: () => yup.string().notRequired()
  }),
  account: yup.string()
    .required("Requerido")
    .matches(/^\d+$/, "La matrícula solo debe contener números")
    .max(10, "La matrícula no puede tener más de 10 caracteres"),
  email: yup.string().email("Correo inválido").required("Requerido"),
  ranks: yup.number().required("Requerido"), // Changed to number
  roleId: yup.number().required("Requerido"),
});

export default function Team() {
  const theme = useTheme();
  const colors = useMemo(() => Token(theme.palette.mode), [theme.palette.mode]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { can } = usePermission();

  // Estados para el diálogo de creación/edición
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [ranks, setRanks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const socket = useSocket();

  // Estado para diálogo de eliminación
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    userId: null,
    userName: ''
  });

  // Estado para filtros
  const [showInactive, setShowInactive] = useState(true);

  // Contexto de búsqueda
  const { searchTerm, isSearching } = useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !can('user_read')) {
      navigate('/');
    }
  }, [isAuthenticated, can, navigate]);

  // Cargar rangos
  useEffect(() => {
    const fetchRanks = async () => {
      try {
        const response = await api.get("/api/ranks");
        const ranksData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setRanks(ranksData);
      } catch (err) {
        console.error("Error cargando rangos:", err);
      }
    };
    fetchRanks();
  }, []);

  // 👇 FILTRO ULTRA SEGURO CON VALIDACIONES REFORZADAS
  const filteredUsers = useMemo(() => {
    let filtered = showInactive ? rows : rows.filter(user => user.status === 0);

    // Aplicar filtro de búsqueda con validaciones ultra seguras
    if (isSearching && searchTerm && searchTerm.trim() !== '') {
      filtered = filtered.filter(user => {
        const searchableText = `${user.name} ${user.email} ${user.matricula} ${user.grado} ${user.access}`;
        return flexibleMatch(searchableText, searchTerm);
      });
    }

    return filtered;
  }, [rows, showInactive, isSearching, searchTerm]);

  // Manejo seguro de colores con fallbacks
  const safeColors = useMemo(() => colors || {
    primary: { 400: '#f5f5f5', 300: '#424242' },
    greenAccent: { 300: '#4caf50', 200: '#4caf50' },
    blueAccent: { 700: '#1976d2' },
    grey: { 100: '#f5f5f5' }
  }, [colors]);


  // Verificar autenticación y permisos al montar
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      console.log('Team: Verificando auth...', { token: !!token, user });

      if (!token) {
        setError("No se encontró token de autenticación");
        setLoading(false);
        return;
      }

      if (!user || !user.id) {
        setError("No se encontró información de usuario");
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
    };

    // Verificar inmediatamente
    checkAuth();

    // Si no está autenticado, reintentamos después de un momento
    const timeoutId = setTimeout(checkAuth, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  const fetchUsers = useCallback(async ({ silent = false } = {}) => {
    if (!isAuthenticated) {
      console.log('Team: No autenticado, saltando fetchUsers');
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);


      const response = await api.get("/api/users");
      // 👇 CORRECCIÓN: Extraer el array de usuarios de response.data.data
      const usersList = response.data.data || [];

      const me = JSON.parse(localStorage.getItem("user") || "{}");

      // 👇 MAPEO ULTRA SEGURO CON CONVERSIÓN A STRING
      const mappedUsers = usersList
        .filter(u => u.id !== me.id)
        .map(u => ({
          id: u.id,
          name: String(u.name || ''),           // Convertir a string seguro
          email: String(u.email || ''),         // Convertir a string seguro
          matricula: String(u.account || ''),   // Convertir a string seguro
          grado: String(u.ranks || ''),         // Convertir a string seguro
          rankId: u.rank_id,                    // 👈 Added rankId
          access: String(u.access || ''),       // Convertir a string seguro
          roleId: u.roleId,                     // Guardar roleId original
          status: u.status,
          lastAccess: u.last_access ?? null,
        }));

      setRows(mappedUsers);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
      setError('Error al cargar el equipo: ' + errorMessage);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  // Ejecutar fetchUsers solo cuando esté autenticado
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [fetchUsers, isAuthenticated]);

  // Escuchar eventos de Socket.io
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleUserUpdate = (data) => {
      console.log('🔔 User update received:', data);
      fetchUsers({ silent: true });
    };

    socket.on('user_created', handleUserUpdate);
    socket.on('user_updated', handleUserUpdate);
    socket.on('user_deleted', handleUserUpdate);
    socket.on('user_status_changed', handleUserUpdate);

    return () => {
      socket.off('user_created', handleUserUpdate);
      socket.off('user_updated', handleUserUpdate);
      socket.off('user_deleted', handleUserUpdate);
      socket.off('user_status_changed', handleUserUpdate);
    };
  }, [socket, fetchUsers, isAuthenticated]);

  const handleToggleStatus = useCallback(async (id, current) => {
    if (!can('user_update')) {
      setError("No tienes permisos para modificar usuarios");
      return;
    }

    try {
      const newStatus = current === 0 ? 1 : 0;
      console.log(`${newStatus === 0 ? 'Rehabilitando' : 'Deshabilitando'} usuario ${id}`);

      await api.put(`/api/users/${id}`, { status: newStatus });
      // fetchUsers({ silent: true }); // Socket will handle update

      console.log(`Usuario ${newStatus === 0 ? 'rehabilitado' : 'deshabilitado'} exitosamente`);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
      setError('Error al cambiar estado: ' + errorMessage);
    }
  }, [can]);

  const handleOpenDialog = (user = null) => {
    setEditingUser(user);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleFormSubmit = async (values, { resetForm }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Actualizar usuario
        const payload = { ...values };
        if (!payload.password) delete payload.password; // No enviar password si está vacío en edición

        await api.put(`/api/users/${editingUser.id}`, payload);
        setSnackbar({ open: true, message: "Usuario actualizado exitosamente", severity: "success" });
      } else {
        // Crear usuario
        await api.post("/api/users", { ...values, status: 0 });
        setSnackbar({ open: true, message: "Usuario creado exitosamente", severity: "success" });
      }

      handleCloseDialog();
      resetForm();
      // fetchUsers(); // Socket will handle update

    } catch (err) {
      console.error('Error guardando usuario:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || "Error al guardar usuario";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = useCallback(async () => {
    try {
      const { userId } = deleteDialog;
      console.log('🗑️ Eliminando usuario:', userId);

      await api.delete(`/api/users/${userId}`);

      console.log('✅ Usuario eliminado exitosamente');

      setDeleteDialog({ open: false, userId: null, userName: '' });
      // fetchUsers({ silent: true }); // Socket will handle update

    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      setError('Error al eliminar usuario: ' + (err.response?.data?.error || err.message));
    }
  }, [deleteDialog]);

  // Pantalla de carga inicial
  if (loading && !isAuthenticated) {
    return (
      <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress size={60} />
        <Box ml={2} fontSize="1.2rem">Verificando permisos...</Box>
      </Box>
    );
  }

  // Error de autenticación o permisos
  if (error && !isAuthenticated) {
    return (
      <Box m="20px">
        <Header
          title="EQUIPO"
          subtitle="Gestión de miembros del equipo"
        />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header title="EQUIPO" subtitle={`${rows.length} miembros del equipo`} />

      {/* CONTROLES Y FILTROS */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant={showInactive ? "contained" : "outlined"}
            color="info"
            onClick={() => setShowInactive(!showInactive)}
            size="small"
          >
            {showInactive ? "Ocultar Inactivos" : "Mostrar Inactivos"}
          </Button>
          <Typography variant="body2" color="text.secondary">
            {showInactive
              ? `${rows.length} usuarios(${rows.filter(u => u.status === 0).length} activos, ${rows.filter(u => u.status === 1).length} inactivos)`
              : `${filteredUsers.length} usuarios activos`
            }
          </Typography>
        </Box>

      </Box>

      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          color="success"
          startIcon={<FileDownloadIcon />}
          onClick={() => exportToExcel(filteredUsers.map(u => ({
            Nombre: u.name,
            Email: u.email,
            Matrícula: u.matricula,
            Grado: u.grado,
            Acceso: u.access,
            Estado: u.status === 0 ? 'Activo' : 'Inactivo',
            'Último Acceso': u.lastAccess ? new Date(u.lastAccess).toLocaleString() : 'Nunca'
          })), 'Equipo_Usuarios')}
          sx={{ fontWeight: 'bold' }}
        >
          Exportar Excel
        </Button>
        {/* Botón Crear Usuario */}
        {can('user_create') && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              px: 3,
              py: 1.5,
              fontWeight: 'bold'
            }}
          >
            Crear Usuario
          </Button>
        )}
      </Box>


      {
        error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )
      }

      <TableContainer component={Paper} sx={{ backgroundColor: safeColors.primary[400], mt: "40px" }}>
        <Table>
          <TableHead sx={{ backgroundColor: safeColors.blueAccent[700] }}>
            <TableRow>
              <TableCell><Typography fontWeight="bold">Nombre</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Email</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Matrícula</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Grado</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Nivel de Acceso</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight="bold">Estado</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Último Acceso</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight="bold">Acciones</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((row) => {
              const isActive = row.status === 0;
              return (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', opacity: isActive ? 1 : 0.5, textDecoration: isActive ? 'none' : 'line-through' }}>
                      <SearchHighlighter text={row.name} searchTerm={searchTerm} />
                      {!isActive && (
                        <Box component="span" sx={{ ml: 1, px: 1, py: 0.2, bgcolor: 'error.main', color: 'white', borderRadius: 1, fontSize: '0.7rem' }}>
                          INACTIVO
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <SearchHighlighter text={row.email} searchTerm={searchTerm} />
                  </TableCell>
                  <TableCell>
                    <SearchHighlighter text={row.matricula} searchTerm={searchTerm} />
                  </TableCell>
                  <TableCell>
                    <SearchHighlighter text={row.grado} searchTerm={searchTerm} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: row.access === "Administrador" ? safeColors.greenAccent?.[600] : safeColors.greenAccent?.[700], color: safeColors.grey?.[100], display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: '0.875rem' }}>
                      {row.access === "Administrador" && "👑"}
                      {row.access === "Capturista" && "🔓"}
                      {row.access === "Consultor" && "🔒"}
                      <SearchHighlighter text={row.access} searchTerm={searchTerm} />
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={row.status === 0 ? "Activo" : "Inactivo"} color={row.status === 0 ? "success" : "default"} size="small" />
                  </TableCell>
                  <TableCell>
                    {row.lastAccess ? new Date(row.lastAccess).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" gap={1}>
                      <Tooltip title={isActive ? "Editar usuario" : "No se puede editar un usuario inactivo"}>
                        <span>
                          {can('user_update') && (
                            <IconButton size="small" color="warning" onClick={() => handleOpenDialog(row)} disabled={!isActive}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                        </span>
                      </Tooltip>
                      <Tooltip title={isActive ? "Deshabilitar usuario" : "Rehabilitar usuario"}>
                        <span>
                          {can('user_update') && (
                            <IconButton size="small" color={isActive ? "error" : "success"} onClick={() => handleToggleStatus(row.id, row.status)}>
                              {isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          )}
                        </span>
                      </Tooltip>
                      {can('user_delete') && isActive && (
                        <Tooltip title="Eliminar usuario">
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, userId: row.id, userName: row.name })}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar usuario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? "Editar Usuario" : "Crear Usuario"}
        </DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{
              name: editingUser?.name || "",
              email: editingUser?.email || "",
              account: editingUser?.matricula || "",
              ranks: editingUser?.rankId || "", // 👈 Use rankId
              roleId: editingUser?.roleId || "",
              password: "",
              isEditing: !!editingUser
            }}
            validationSchema={userSchema}
            onSubmit={handleFormSubmit}
          >
            {({ values, errors, touched, handleBlur, handleChange, handleSubmit }) => (
              <form onSubmit={handleSubmit} id="user-form">
                <Box
                  display="grid"
                  gap="20px"
                  gridTemplateColumns="repeat(2, 1fr)"
                  sx={{
                    "& > div": { gridColumn: "span 1" },
                    "@media (max-width: 600px)": {
                      gridTemplateColumns: "repeat(1, 1fr)",
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
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      e.target.value = value;
                      handleChange(e);
                    }}
                    value={values.account}
                    error={!!touched.account && !!errors.account}
                    helperText={touched.account && errors.account}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 }}
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
                    label={editingUser ? "Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
                    name="password"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.password}
                    error={!!touched.password && !!errors.password}
                    helperText={touched.password && errors.password}
                  />
                  <FormControl fullWidth variant="filled" error={!!touched.ranks && !!errors.ranks}>
                    <InputLabel id="ranks-label">Rango</InputLabel>
                    <Select
                      labelId="ranks-label"
                      name="ranks"
                      value={values.ranks}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    >
                      {ranks.map((rank) => (
                        <MenuItem key={rank.id} value={rank.id}>
                          {rank.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {touched.ranks && errors.ranks && (
                      <Typography color="error" variant="caption">{errors.ranks}</Typography>
                    )}
                  </FormControl>
                  <FormControl fullWidth variant="filled" error={!!touched.roleId && !!errors.roleId}>
                    <InputLabel id="role-label">Rol</InputLabel>
                    <Select
                      labelId="role-label"
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
                      <Typography color="error" variant="caption">{errors.roleId}</Typography>
                    )}
                  </FormControl>
                </Box>
              </form>
            )}
          </Formik>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">Cancelar</Button>
          <Button type="submit" form="user-form" color="secondary" variant="contained">
            {editingUser ? "Guardar Cambios" : "Crear Usuario"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, userId: null, userName: '' })}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar al usuario <strong>{deleteDialog.userName}</strong>?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, userId: null, userName: '' })}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box >
  );
}
