import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  useTheme,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Restore as RestoreIcon
} from "@mui/icons-material";
import Header from "../../components/Header";
import { Token } from "../../theme";
import AppSnackbar from "../../components/AppSnackbar";
import SearchHighlighter from "../../components/SearchHighlighter";
import { useSearch } from "../../contexts/SearchContext";
import api from "../../api/axiosClient";

export default function Locations() {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [showDisabled, setShowDisabled] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Estado para diálogo de eliminación
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    locationId: null,
    locationName: ''
  });

  // Contexto de búsqueda
  const { searchTerm, isSearching } = useSearch();

  // Filtro de ubicaciones con búsqueda
  const filteredLocations = useMemo(() => {
    if (!Array.isArray(locations)) return [];

    if (!isSearching || !searchTerm) {
      return locations;
    }

    return locations.filter((location) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        location.name?.toLowerCase().includes(searchLower) ||
        location.description?.toLowerCase().includes(searchLower)
      );
    });
  }, [locations, isSearching, searchTerm]);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchLocations = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const endpoint = showDisabled ? "/api/locations/all/disabled" : "/api/locations";
      const { data } = await api.get(endpoint);
      // Asegurar que siempre sea un array
      const locationsData = Array.isArray(data) ? data : data?.data || [];
      setLocations(locationsData);
      console.log('Ubicaciones cargadas:', locationsData.length);
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      setLocations([]); // Asegurar array vacío en caso de error
      showSnackbar("Error al cargar ubicaciones", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showDisabled]);

  const POLL_INTERVAL = 5000;

  useEffect(() => {
    fetchLocations();
    const intervalId = setInterval(() => fetchLocations({ silent: true }), POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchLocations]);

  // Escuchar eventos de otras ventanas/pestañas
  useEffect(() => {
    const handleReload = () => fetchLocations({ silent: true });

    window.addEventListener("locationCreated", handleReload);
    window.addEventListener("locationUpdated", handleReload);
    window.addEventListener("locationDeleted", handleReload);
    window.addEventListener("locationStatusChanged", handleReload);

    const handleStorageChange = (e) => {
      if (e.key === 'locationChanged') handleReload();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("locationCreated", handleReload);
      window.removeEventListener("locationUpdated", handleReload);
      window.removeEventListener("locationDeleted", handleReload);
      window.removeEventListener("locationStatusChanged", handleReload);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchLocations]);

  const handleOpen = (location = null) => {
    if (location) {
      setEditingLocation(location);
      setFormData({ name: location.name, description: location.description || "" });
    } else {
      setEditingLocation(null);
      setFormData({ name: "", description: "" });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingLocation(null);
    setFormData({ name: "", description: "" });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        showSnackbar("El nombre es requerido", "warning");
        return;
      }

      if (editingLocation) {
        await api.put(`/api/locations/${editingLocation.id}`, formData);
        showSnackbar("Ubicación actualizada exitosamente");
        window.dispatchEvent(new Event("locationUpdated"));
        localStorage.setItem('locationChanged', Date.now().toString());
      } else {
        await api.post("/api/locations", formData);
        showSnackbar("Ubicación creada exitosamente");
        window.dispatchEvent(new Event("locationCreated"));
        localStorage.setItem('locationChanged', Date.now().toString());
      }

      handleClose();
      fetchLocations();
    } catch (error) {
      const message = error.response?.data?.error || "Error al procesar la solicitud";
      showSnackbar(message, "error");
    }
  };
  const handleDelete = (id, name) => {
    setDeleteDialog({
      open: true,
      locationId: id,
      locationName: name
    });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/locations/${deleteDialog.locationId}`);
      showSnackbar("Ubicación eliminada exitosamente");
      window.dispatchEvent(new Event("locationDeleted"));
      localStorage.setItem('locationChanged', Date.now().toString());
      fetchLocations();
    } catch (error) {
      const message = error.response?.data?.error || "Error al eliminar la ubicación";
      showSnackbar(message, "error");
    } finally {
      setDeleteDialog({ open: false, locationId: null, locationName: '' });
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ open: false, locationId: null, locationName: '' });
  };

  const handleEnable = async (id, name) => {
    try {
      await api.put(`/api/locations/${id}/enable`);
      showSnackbar(`Ubicación "${name}" rehabilitada exitosamente`);
      window.dispatchEvent(new Event("locationStatusChanged"));
      localStorage.setItem('locationChanged', Date.now().toString());
      fetchLocations();
    } catch (error) {
      const message = error.response?.data?.error || "Error al rehabilitar la ubicación";
      showSnackbar(message, "error");
    }
  };

  const toggleShowDisabled = () => {
    setShowDisabled(!showDisabled);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box m="20px">
        <Header title="Ubicaciones" subtitle="Cargando..." />
      </Box>
    );
  }

  return (
    <Box m="20px">      <Header
      title="Gestión de Ubicaciones"
      subtitle={`Administra las ubicaciones del almacén (${filteredLocations.length} ubicaciones)`}
    />      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Button
          variant="outlined"
          startIcon={showDisabled ? <VisibilityOffIcon /> : <VisibilityIcon />}
          onClick={toggleShowDisabled}
          sx={{ px: 3, py: 1.5 }}
        >
          {showDisabled ? "Ocultar Deshabilitadas" : "Mostrar Deshabilitadas"}
        </Button>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{ px: 3, py: 1.5 }}
        >
          Nueva Ubicación
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: colors.primary[400] }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: colors.blueAccent[700] }}>
              <TableCell>
                <Typography variant="h6" fontWeight="bold">
                  Nombre
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="h6" fontWeight="bold">
                  Descripción
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="h6" fontWeight="bold">
                  Creada
                </Typography>
              </TableCell>              <TableCell>
                <Typography variant="h6" fontWeight="bold">
                  Actualizada
                </Typography>
              </TableCell>
              {showDisabled && (
                <TableCell>
                  <Typography variant="h6" fontWeight="bold">
                    Estado
                  </Typography>
                </TableCell>
              )}
              <TableCell align="center">
                <Typography variant="h6" fontWeight="bold">
                  Acciones
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>          <TableBody>
            {Array.isArray(filteredLocations) && filteredLocations.map((location) => (<TableRow
              key={location.id}
              sx={{
                "&:hover": {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? colors.primary[300]
                    : 'rgba(0, 0, 0, 0.04)' // Hover claro para modo claro
                },
                backgroundColor: colors.primary[400],
              }}
            >                <TableCell>
                <Chip
                  label={
                    <SearchHighlighter
                      text={location.name}
                      searchTerm={searchTerm}
                    />
                  }
                  color="secondary"
                  variant="filled"
                  icon={<LocationIcon />}
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    // Mejor visibilidad en modo oscuro  
                    backgroundColor: colors.blueAccent[600],
                    color: colors.grey[100],
                    '&:hover': {
                      backgroundColor: colors.blueAccent[500],
                    },
                    '& .MuiChip-icon': {
                      color: colors.grey[100]
                    }
                  }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  <SearchHighlighter
                    text={location.description || "Sin descripción"}
                    searchTerm={searchTerm}
                  />
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="textSecondary">
                  {formatDate(location.created_at)}
                </Typography>
              </TableCell>                <TableCell>
                <Typography variant="body2" color="textSecondary">
                  {formatDate(location.updated_at)}
                </Typography>
              </TableCell>
              {showDisabled && (
                <TableCell>
                  <Chip
                    label={location.status === 0 ? "Activa" : "Deshabilitada"}
                    color={location.status === 0 ? "success" : "error"}
                    variant="filled"
                    size="small"
                  />
                </TableCell>
              )}
              <TableCell align="center">
                {location.status === 0 ? (
                  <>
                    <IconButton
                      onClick={() => handleOpen(location)}
                      color="warning"
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(location.id, location.name)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                ) : (
                  <IconButton
                    onClick={() => handleEnable(location.id, location.name)}
                    color="success"
                    size="small"
                    title="Rehabilitar ubicación"
                  >                      <RestoreIcon />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingLocation ? "Editar Ubicación" : "Nueva Ubicación"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción (opcional)"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="secondary">
            {editingLocation ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>      </Dialog>

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
            ¿Estás seguro de que deseas eliminar la ubicación "{deleteDialog.locationName}"?
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
