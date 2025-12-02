import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  useTheme,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  FileDownload as FileDownloadIcon
} from "@mui/icons-material";
import Header from "../../components/Header";
import { Token } from "../../theme";
import AppSnackbar from "../../components/AppSnackbar";
import SearchHighlighter from "../../components/SearchHighlighter";
import { useSearch } from "../../contexts/SearchContext";
import api from "../../api/axiosClient";
import { useSocket } from "../../context/SocketContext";
import usePermission from "../../hooks/usePermission";
import { flexibleMatch } from "../../utils/searchUtils";
import { exportToExcel } from "../../utils/exportUtils";

export default function Providers() {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [showInactive, setShowInactive] = useState(true);

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    providerId: null,
    providerName: ''
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    address: "",
    registration: "",
    phone: "",
    website: "",
    providerName: ''
  });

  // Contexto de búsqueda
  const { searchTerm, isSearching } = useSearch();
  const { can } = usePermission();
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!can('provider_read')) {
      navigate('/');
    }
  }, [can, navigate]);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchProviders = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      // Siempre traemos todos para poder contar activos/inactivos en el frontend
      const endpoint = `/api/providers?showInactive=true`;
      const { data } = await api.get(endpoint);
      const providersData = Array.isArray(data) ? data : data?.data || [];
      setProviders(providersData);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      setProviders([]);
      showSnackbar("Error al cargar proveedores", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Escuchar eventos de Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleProviderUpdate = (data) => {
      console.log('🔔 Provider update received:', data);
      fetchProviders({ silent: true });
    };

    socket.on('provider_created', handleProviderUpdate);
    socket.on('provider_updated', handleProviderUpdate);
    socket.on('provider_deleted', handleProviderUpdate);
    socket.on('provider_status_changed', handleProviderUpdate);

    return () => {
      socket.off('provider_created', handleProviderUpdate);
      socket.off('provider_updated', handleProviderUpdate);
      socket.off('provider_deleted', handleProviderUpdate);
      socket.off('provider_status_changed', handleProviderUpdate);
    };
  }, [socket, fetchProviders]);

  // Filtro de proveedores con búsqueda y estado
  const filteredProviders = useMemo(() => {
    if (!Array.isArray(providers)) return [];

    let filtered = showInactive ? providers : providers.filter(p => p.status === 0);

    if (isSearching && searchTerm) {
      filtered = filtered.filter((provider) => {
        const searchableText = `${provider.name} ${provider.company} ${provider.email} ${provider.contact_name} ${provider.phone} ${provider.registration}`;
        return flexibleMatch(searchableText, searchTerm);
      });
    }
    return filtered;
  }, [providers, isSearching, searchTerm, showInactive]);

  const handleOpen = (provider = null) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        name: provider.name || "",
        company: provider.company || "",
        email: provider.email || "",
        address: provider.address || "",
        registration: provider.registration || "",
        phone: provider.phone || "",
        website: provider.website || "",
        contact_name: provider.contact_name || ""
      });
    } else {
      setEditingProvider(null);
      setFormData({
        name: "",
        company: "",
        email: "",
        address: "",
        registration: "",
        phone: "",
        website: "",
        contact_name: ""
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProvider(null);
    setFormData({
      name: "",
      company: "",
      email: "",
      address: "",
      registration: "",
      phone: "",
      website: "",
      contact_name: ""
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        showSnackbar("El nombre es requerido", "warning");
        return;
      }

      // Validación de RFC
      if (formData.registration) {
        const rfcRegex = /^([A-ZÑ&]{3,4})\d{6}[A-Z0-9]{3}$/;
        const cleanRFC = formData.registration.trim().toUpperCase();

        if (!rfcRegex.test(cleanRFC)) {
          showSnackbar("El RFC no tiene un formato válido (12 o 13 caracteres)", "warning");
          return;
        }
      }

      const dataToSubmit = {
        ...formData,
        registration: formData.registration ? formData.registration.toUpperCase().trim() : ""
      };

      if (editingProvider) {
        await api.put(`/api/providers/${editingProvider.id}`, dataToSubmit);
        showSnackbar("Proveedor actualizado exitosamente");
      } else {
        await api.post("/api/providers", dataToSubmit);
        showSnackbar("Proveedor creado exitosamente");
      }

      handleClose();
    } catch (error) {
      const message = error.response?.data?.error || "Error al procesar la solicitud";
      showSnackbar(message, "error");
    }
  };

  const handleDelete = async (id, name) => {
    try {
      // Verificar productos asociados
      const productsRes = await api.get('/api/products');
      const products = productsRes.data.data || [];
      const hasProducts = products.some(p => p.provider_id === id);

      if (hasProducts) {
        showSnackbar(`No se puede eliminar el proveedor "${name}" porque tiene productos asociados.`, "error");
        return;
      }

      // Verificar órdenes activas
      const ordersRes = await api.get('/api/orders');
      const orders = ordersRes.data.data || [];
      const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');
      const hasActiveOrders = activeOrders.some(o => o.provider_id === id);

      if (hasActiveOrders) {
        showSnackbar(`No se puede eliminar el proveedor "${name}" porque tiene órdenes activas.`, "error");
        return;
      }

      setDeleteDialog({
        open: true,
        providerId: id,
        providerName: name
      });
    } catch (error) {
      console.error("Error checking dependencies:", error);
      showSnackbar("Error al verificar dependencias", "error");
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/providers/${deleteDialog.providerId}`);
      showSnackbar("Proveedor eliminado exitosamente");
    } catch (error) {
      const message = error.response?.data?.error || "Error al eliminar el proveedor";
      showSnackbar(message, "error");
    } finally {
      setDeleteDialog({ open: false, providerId: null, providerName: '' });
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ open: false, providerId: null, providerName: '' });
  };

  const handleToggleStatus = async (id, currentStatus, name) => {
    try {
      await api.put(`/api/providers/${id}/status`);
      const action = currentStatus === 0 ? "deshabilitado" : "habilitado";
      showSnackbar(`Proveedor ${name} ${action} exitosamente`);
    } catch (error) {
      const message = error.response?.data?.error || "Error al cambiar estado";
      showSnackbar(message, "error");
    }
  };

  if (loading && !providers.length) {
    return (
      <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header
        title="Gestión de Proveedores"
        subtitle={`${providers.length} proveedores registrados`}
      />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
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
              ? `${providers.length} proveedores (${providers.filter(p => p.status === 0).length} activos)`
              : `${filteredProviders.length} proveedores activos`
            }
          </Typography>
        </Box>

        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="success"
            startIcon={<FileDownloadIcon />}
            onClick={() => exportToExcel(filteredProviders.map(p => ({
              Nombre: p.name,
              Empresa: p.company,
              Email: p.email,
              Teléfono: p.phone,
              Contacto: p.contact_name,
              RFC: p.registration,
              Estado: p.status === 0 ? 'Activo' : 'Inactivo'
            })), 'Proveedores')}
            sx={{ fontWeight: 'bold' }}
          >
            Exportar Excel
          </Button>
          {can('provider_create') && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => handleOpen()}
            >
              Nuevo Proveedor
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: colors.primary[400] }}>
        <Table>
          <TableHead sx={{ backgroundColor: colors.blueAccent[700] }}>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Empresa</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>RFC</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProviders.map((provider) => {
              const isActive = provider.status === 0;
              return (
                <TableRow key={provider.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', opacity: isActive ? 1 : 0.5 }}>
                      <SearchHighlighter text={provider.name} searchTerm={searchTerm} />
                      {!isActive && (
                        <Box component="span" sx={{ ml: 1, px: 1, py: 0.2, bgcolor: 'error.main', color: 'white', borderRadius: 1, fontSize: '0.7rem' }}>
                          INACTIVO
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell><SearchHighlighter text={provider.company} searchTerm={searchTerm} /></TableCell>
                  <TableCell><SearchHighlighter text={provider.email} searchTerm={searchTerm} /></TableCell>
                  <TableCell><SearchHighlighter text={provider.phone} searchTerm={searchTerm} /></TableCell>
                  <TableCell><SearchHighlighter text={provider.contact_name} searchTerm={searchTerm} /></TableCell>
                  <TableCell><SearchHighlighter text={provider.registration} searchTerm={searchTerm} /></TableCell>
                  <TableCell align="center">
                    <Chip
                      label={isActive ? "Activo" : "Inactivo"}
                      color={isActive ? "success" : "error"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" gap={1}>
                      {can('provider_update') && (
                        <IconButton
                          color="warning"
                          size="small"
                          onClick={() => handleOpen(provider)}
                          disabled={!isActive}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}

                      {can('provider_update') && (
                        <IconButton
                          color={isActive ? "error" : "success"}
                          size="small"
                          onClick={() => handleToggleStatus(provider.id, provider.status, provider.name)}
                        >
                          {isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                        </IconButton>
                      )}

                      {can('provider_delete') && isActive && (
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(provider.id, provider.name)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProvider ? "Editar Proveedor" : "Nuevo Proveedor"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Empresa"
                fullWidth
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                fullWidth
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Teléfono"
                fullWidth
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contacto"
                fullWidth
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Registro/RFC"
                fullWidth
                value={formData.registration}
                onChange={(e) => setFormData({ ...formData, registration: e.target.value.toUpperCase() })}
                helperText="Formato: 3-4 letras, 6 números, 3 homoclave"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Sitio Web"
                fullWidth
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Dirección"
                fullWidth
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="secondary">
            {editingProvider ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={deleteDialog.open}
        onClose={cancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el proveedor "{deleteDialog.providerName}"?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            autoFocus
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}