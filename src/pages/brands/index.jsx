import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
    Delete as DeleteIcon
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

export default function Brands() {
    const theme = useTheme();
    const colors = Token(theme.palette.mode);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [formData, setFormData] = useState({ name: "" });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });
    const socket = useSocket();
    const { can } = usePermission();

    // Estado para diálogo de eliminación
    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        brandId: null,
        brandName: ''
    });

    // Contexto de búsqueda
    const { searchTerm, isSearching } = useSearch();
    const navigate = useNavigate();

    useEffect(() => {
        if (!can('brand_read')) {
            navigate('/');
        }
    }, [can, navigate]);

    const showSnackbar = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchBrands = useCallback(async ({ silent = false } = {}) => {
        try {
            if (!silent) setLoading(true);
            const endpoint = "/api/brands";
            const { data } = await api.get(endpoint);
            const brandsData = Array.isArray(data) ? data : data?.data || [];
            setBrands(brandsData);
        } catch (error) {
            console.error('Error al cargar marcas:', error);
            setBrands([]);
            showSnackbar("Error al cargar marcas", "error");
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    // Escuchar eventos de Socket.io
    useEffect(() => {
        if (!socket) return;

        const handleBrandUpdate = (data) => {
            console.log('🔔 Brand update received:', data);
            fetchBrands({ silent: true });
        };

        socket.on('brand_created', handleBrandUpdate);
        socket.on('brand_updated', handleBrandUpdate);
        socket.on('brand_deleted', handleBrandUpdate);

        return () => {
            socket.off('brand_created', handleBrandUpdate);
            socket.off('brand_updated', handleBrandUpdate);
            socket.off('brand_deleted', handleBrandUpdate);
        };
    }, [socket, fetchBrands]);

    // Filtro de marcas con búsqueda
    const filteredBrands = useMemo(() => {
        if (!Array.isArray(brands)) return [];

        if (!isSearching || !searchTerm) {
            return brands;
        }

        return brands.filter((brand) => {
            const searchableText = `${brand.name}`;
            return flexibleMatch(searchableText, searchTerm);
        });
    }, [brands, isSearching, searchTerm]);

    const handleOpen = (brand = null) => {
        if (brand) {
            setEditingBrand(brand);
            setFormData({ name: brand.name });
        } else {
            setEditingBrand(null);
            setFormData({ name: "" });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingBrand(null);
        setFormData({ name: "" });
    };

    const handleSubmit = async () => {
        try {
            if (!formData.name.trim()) {
                showSnackbar("El nombre es requerido", "warning");
                return;
            }

            if (editingBrand) {
                await api.put(`/api/brands/${editingBrand.id}`, formData);
                showSnackbar("Marca actualizada exitosamente");
            } else {
                await api.post("/api/brands", formData);
                showSnackbar("Marca creada exitosamente");
            }

            handleClose();
            // fetchBrands(); // Socket will handle update
        } catch (error) {
            const message = error.response?.data?.error || "Error al procesar la solicitud";
            showSnackbar(message, "error");
        }
    };

    const handleDelete = (id, name) => {
        setDeleteDialog({
            open: true,
            brandId: id,
            brandName: name
        });
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/api/brands/${deleteDialog.brandId}`);
            showSnackbar("Marca eliminada exitosamente");
            // fetchBrands(); // Socket will handle update
        } catch (error) {
            const message = error.response?.data?.error || "Error al eliminar la marca";
            showSnackbar(message, "error");
        } finally {
            setDeleteDialog({ open: false, brandId: null, brandName: '' });
        }
    };

    const cancelDelete = () => {
        setDeleteDialog({ open: false, brandId: null, brandName: '' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && !brands.length) {
        return (
            <Box m="20px">
                <Header title="Marcas" subtitle="Cargando..." />
            </Box>
        );
    }

    return (
        <Box m="20px">
            <Header
                title="Gestión de Marcas"
                subtitle={`${brands.length} marcas | ${filteredBrands.length} mostradas`}
            />

            <Box display="flex" justifyContent="flex-end" alignItems="center" mb="20px">
                {can('brand_create') && (
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpen()}
                        sx={{ px: 3, py: 1.5 }}
                    >
                        Nueva Marca
                    </Button>
                )}
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
                                    Creada
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Typography variant="h6" fontWeight="bold">
                                    Acciones
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Array.isArray(filteredBrands) && filteredBrands.map((brand) => (
                            <TableRow
                                key={brand.id}
                                sx={{
                                    "&:hover": {
                                        backgroundColor: theme.palette.mode === 'dark'
                                            ? colors.primary[300]
                                            : 'rgba(0, 0, 0, 0.04)'
                                    },
                                    backgroundColor: colors.primary[400],
                                }}
                            >
                                <TableCell>
                                    <Chip
                                        label={
                                            <SearchHighlighter
                                                text={brand.name}
                                                searchTerm={searchTerm}
                                            />
                                        }
                                        color="secondary"
                                        variant="filled"
                                        sx={{
                                            fontWeight: 'bold',
                                            fontSize: '0.875rem',
                                            backgroundColor: colors.greenAccent[600],
                                            color: colors.grey[100],
                                            '&:hover': {
                                                backgroundColor: colors.greenAccent[500],
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="textSecondary">
                                        {formatDate(brand.created_at)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    {can('brand_update') && (
                                        <IconButton
                                            onClick={() => handleOpen(brand)}
                                            color="warning"
                                            size="small"
                                            sx={{ mr: 1 }}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    )}
                                    {can('brand_delete') && (
                                        <IconButton
                                            onClick={() => handleDelete(brand.id, brand.name)}
                                            color="error"
                                            size="small"
                                        >
                                            <DeleteIcon />
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
                    {editingBrand ? "Editar Marca" : "Nueva Marca"}
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
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="inherit">
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" color="secondary">
                        {editingBrand ? "Actualizar" : "Crear"}
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
                        ¿Estás seguro de que deseas eliminar la marca "{deleteDialog.brandName}"?
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
