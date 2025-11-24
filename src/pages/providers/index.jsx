import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";
import Header from "../../components/Header";
import { Token } from "../../theme";
import AppSnackbar from "../../components/AppSnackbar";
import SearchHighlighter from "../../components/SearchHighlighter";
import { useSearch } from "../../contexts/SearchContext";
import api from "../../api/axiosClient";

export default function Providers() {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [showInactive, setShowInactive] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    address: "",
    registration: "",
    phone: "",
    website: "",
    contact_name: ""
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Estado para diálogo de eliminación
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    providerId: null,
    providerName: ''
  });

  // Contexto de búsqueda
  const { searchTerm, isSearching } = useSearch();

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

  const POLL_INTERVAL = 5000;

  useEffect(() => {
    fetchProviders();
    const intervalId = setInterval(() => fetchProviders({ silent: true }), POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchProviders]);

  // Escuchar eventos de otras ventanas/pestañas
  useEffect(() => {
    const handleReload = () => fetchProviders({ silent: true });

    window.addEventListener("providerCreated", handleReload);
    window.addEventListener("providerUpdated", handleReload);
    window.addEventListener("providerDeleted", handleReload);
    window.addEventListener("providerStatusChanged", handleReload);

    const handleStorageChange = (e) => {
      if (e.key === 'providerChanged') handleReload();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("providerCreated", handleReload);
      window.removeEventListener("providerUpdated", handleReload);
      window.removeEventListener("providerDeleted", handleReload);
      window.removeEventListener("providerStatusChanged", handleReload);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchProviders]);

  // Filtro de proveedores con búsqueda y estado
  const filteredProviders = useMemo(() => {
    if (!Array.isArray(providers)) return [];

    let filtered = showInactive ? providers : providers.filter(p => p.status === 0);

    if (isSearching && searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((provider) => {
        return (
          provider.name?.toLowerCase().includes(searchLower) ||
          provider.company?.toLowerCase().includes(searchLower) ||
          provider.email?.toLowerCase().includes(searchLower) ||
          provider.contact_name?.toLowerCase().includes(searchLower) ||
          provider.phone?.toLowerCase().includes(searchLower) ||
          provider.registration?.toLowerCase().includes(searchLower)
        );
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
        window.dispatchEvent(new Event("providerUpdated"));
        localStorage.setItem('providerChanged', Date.now().toString());
      } else {
        await api.post("/api/providers", dataToSubmit);
        showSnackbar("Proveedor creado exitosamente");
        window.dispatchEvent(new Event("providerCreated"));
        localStorage.setItem('providerChanged', Date.now().toString());
      }

      handleClose();
      fetchProviders();
    } catch (error) {
      const message = error.response?.data?.error || "Error al procesar la solicitud";
      showSnackbar(message, "error");
    }
  };

  const handleDelete = (id, name) => {
    setDeleteDialog({
      open: true,
      providerId: id,
      providerName: name
    });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/providers/${deleteDialog.providerId}`);
      showSnackbar("Proveedor eliminado exitosamente");
      window.dispatchEvent(new Event("providerDeleted"));
      localStorage.setItem('providerChanged', Date.now().toString());
      fetchProviders();
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
      window.dispatchEvent(new Event("providerStatusChanged"));
      localStorage.setItem('providerChanged', Date.now().toString());
      fetchProviders();
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
              ? `${providers.length} proveedores (${providers.filter(p => p.status === 0).length} activos, ${providers.filter(p => p.status === 1).length} inactivos)`
              : `${filteredProviders.length} proveedores activos`
            }
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{ px: 3, py: 1.5 }}
        >
          Nuevo Proveedor
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: colors.primary[400], mt: "40px" }}>
        <Table>
          <TableHead sx={{ backgroundColor: colors.blueAccent[700] }}>
            <TableRow>
              <TableCell><Typography fontWeight="bold">Nombre</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Empresa</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Email</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Teléfono</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Registro/RFC</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Sitio Web</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Contacto</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight="bold">Estado</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight="bold">Acciones</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProviders.map((row) => {
              const isActive = row.status === 0;
              return (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', fontWeight: 'bold', opacity: isActive ? 1 : 0.5 }}>
                      <SearchHighlighter text={row.name} searchTerm={searchTerm} />
                      {!isActive && (
                        <Box component="span" sx={{ ml: 1, px: 1, py: 0.2, bgcolor: 'error.main', color: 'white', borderRadius: 1, fontSize: '0.7rem' }}>
                          INACTIVO
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ opacity: isActive ? 1 : 0.5 }}>
                      <SearchHighlighter text={row.company || '-'} searchTerm={searchTerm} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ opacity: isActive ? 1 : 0.5 }}>
                      <SearchHighlighter text={row.email || '-'} searchTerm={searchTerm} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ opacity: isActive ? 1 : 0.5 }}>
                      <SearchHighlighter text={row.phone || '-'} searchTerm={searchTerm} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ opacity: isActive ? 1 : 0.5 }}>
                      <SearchHighlighter text={row.registration || '-'} searchTerm={searchTerm} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ opacity: isActive ? 1 : 0.5 }}>
                      {row.website ? (
                        <a href={row.website.startsWith('http') ? row.website : `http://${row.website}`} target="_blank" rel="noopener noreferrer" style={{ color: colors.greenAccent[500], textDecoration: 'underline' }}>
                          <SearchHighlighter text={row.website} searchTerm={searchTerm} />
                        </a>
                      ) : '-'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ opacity: isActive ? 1 : 0.5 }}>
                      <SearchHighlighter text={row.contact_name || '-'} searchTerm={searchTerm} />
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={isActive ? "Activo" : "Inactivo"}
                      color={isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box>
                      <IconButton onClick={() => handleOpen(row)} color="warning" size="small" title="Editar" disabled={!isActive}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleToggleStatus(row.id, row.status, row.name)} color={isActive ? "default" : "success"} size="small" title={isActive ? "Deshabilitar" : "Habilitar"}>
                        {isActive ? <BlockIcon /> : <CheckCircleIcon />}
                      </IconButton>
                      <IconButton onClick={() => handleDelete(row.id, row.name)} color="error" size="small" title="Eliminar">
                        <DeleteIcon />
                      </IconButton>
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