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

export default function Categories() {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
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
    categoryId: null,
    categoryName: ''
  });

  // Contexto de búsqueda
  const { searchTerm, isSearching } = useSearch();

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchCategories = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const endpoint = showDisabled ? "/api/categories/all/disabled" : "/api/categories";
      const { data } = await api.get(endpoint);
      // Asegurar que siempre sea un array
      const categoriesData = Array.isArray(data) ? data : data?.data || [];
      setCategories(categoriesData);
      console.log('Categorías cargadas:', categoriesData.length);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setCategories([]); // Asegurar array vacío en caso de error
      showSnackbar("Error al cargar categorías", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showDisabled]);

  const POLL_INTERVAL = 5000;

  useEffect(() => {
    fetchCategories();
    const intervalId = setInterval(() => fetchCategories({ silent: true }), POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchCategories]);

  // Escuchar eventos de otras ventanas/pestañas
  useEffect(() => {
    const handleReload = () => fetchCategories({ silent: true });

    window.addEventListener("categoryCreated", handleReload);
    window.addEventListener("categoryUpdated", handleReload);
    window.addEventListener("categoryDeleted", handleReload);
    window.addEventListener("categoryStatusChanged", handleReload);

    const handleStorageChange = (e) => {
      if (e.key === 'categoryChanged') handleReload();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("categoryCreated", handleReload);
      window.removeEventListener("categoryUpdated", handleReload);
      window.removeEventListener("categoryDeleted", handleReload);
      window.removeEventListener("categoryStatusChanged", handleReload);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchCategories]);

  // Filtro de categorías con búsqueda
  const filteredCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];

    if (!isSearching || !searchTerm) {
      return categories;
    }

    return categories.filter((category) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        category.name?.toLowerCase().includes(searchLower) ||
        category.description?.toLowerCase().includes(searchLower)
      );
    });
  }, [categories, isSearching, searchTerm]);

  const handleOpen = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, description: category.description || "" });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", description: "" });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        showSnackbar("El nombre es requerido", "warning");
        return;
      }

      if (editingCategory) {
        await api.put(`/api/categories/${editingCategory.id}`, formData);
        showSnackbar("Categoría actualizada exitosamente");
        window.dispatchEvent(new Event("categoryUpdated"));
        localStorage.setItem('categoryChanged', Date.now().toString());
      } else {
        await api.post("/api/categories", formData);
        showSnackbar("Categoría creada exitosamente");
        window.dispatchEvent(new Event("categoryCreated"));
        localStorage.setItem('categoryChanged', Date.now().toString());
      }

      handleClose();
      fetchCategories();
    } catch (error) {
      const message = error.response?.data?.error || "Error al procesar la solicitud";
      showSnackbar(message, "error");
    }
  };

  const handleDelete = (id, name) => {
    setDeleteDialog({
      open: true,
      categoryId: id,
      categoryName: name
    });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/categories/${deleteDialog.categoryId}`);
      showSnackbar("Categoría eliminada exitosamente");
      window.dispatchEvent(new Event("categoryDeleted"));
      localStorage.setItem('categoryChanged', Date.now().toString());
      fetchCategories();
    } catch (error) {
      const message = error.response?.data?.error || "Error al eliminar la categoría";
      showSnackbar(message, "error");
    } finally {
      setDeleteDialog({ open: false, categoryId: null, categoryName: '' });
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ open: false, categoryId: null, categoryName: '' });
  };

  const handleEnable = async (id, name) => {
    try {
      await api.put(`/api/categories/${id}/enable`);
      showSnackbar(`Categoría "${name}" rehabilitada exitosamente`);
      window.dispatchEvent(new Event("categoryStatusChanged"));
      localStorage.setItem('categoryChanged', Date.now().toString());
      fetchCategories();
    } catch (error) {
      const message = error.response?.data?.error || "Error al rehabilitar la categoría";
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
        <Header title="Categorías" subtitle="Cargando..." />
      </Box>
    );
  }

  return (<Box m="20px">
    <Header
      title="Gestión de Categorías"
      subtitle={`${categories.length} categorías | ${filteredCategories.length} mostradas`}
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
        Nueva Categoría
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
        </TableHead>          <TableBody>            {Array.isArray(filteredCategories) && filteredCategories.map((category) => (<TableRow
          key={category.id}
          sx={{
            "&:hover": {
              backgroundColor: theme.palette.mode === 'dark'
                ? colors.primary[300]
                : 'rgba(0, 0, 0, 0.04)' // Hover claro para modo claro
            },
            backgroundColor: colors.primary[400],
          }}
        ><TableCell>
            <Chip
              label={
                <SearchHighlighter
                  text={category.name}
                  searchTerm={searchTerm}
                />
              }
              color="secondary"
              variant="filled"
              sx={{
                fontWeight: 'bold',
                fontSize: '0.875rem',
                // Mejor visibilidad en modo oscuro
                backgroundColor: colors.greenAccent[600],
                color: colors.grey[100],
                '&:hover': {
                  backgroundColor: colors.greenAccent[500],
                }
              }}
            />
          </TableCell>
          <TableCell>
            <Typography variant="body2">
              <SearchHighlighter
                text={category.description || "Sin descripción"}
                searchTerm={searchTerm}
              />
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="body2" color="textSecondary">
              {formatDate(category.created_at)}
            </Typography>
          </TableCell>                <TableCell>
            <Typography variant="body2" color="textSecondary">
              {formatDate(category.updated_at)}
            </Typography>
          </TableCell>
          {showDisabled && (
            <TableCell>
              <Chip
                label={category.status === 0 ? "Activa" : "Deshabilitada"}
                color={category.status === 0 ? "success" : "error"}
                variant="filled"
                size="small"
              />
            </TableCell>
          )}
          <TableCell align="center">
            {category.status === 0 ? (
              <>
                <IconButton
                  onClick={() => handleOpen(category)}
                  color="warning"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleDelete(category.id, category.name)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </>
            ) : (
              <IconButton
                onClick={() => handleEnable(category.id, category.name)}
                color="success"
                size="small"
                title="Rehabilitar categoría"
              >
                <RestoreIcon />
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
        {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
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
          {editingCategory ? "Actualizar" : "Crear"}
        </Button>
      </DialogActions>      </Dialog>      {/* Dialog de confirmación de eliminación */}
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
          ¿Estás seguro de que deseas eliminar la categoría "{deleteDialog.categoryName}"?
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
