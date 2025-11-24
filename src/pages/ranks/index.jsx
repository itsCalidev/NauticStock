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
    Delete as DeleteIcon
} from "@mui/icons-material";
import Header from "../../components/Header";
import { Token } from "../../theme";
import AppSnackbar from "../../components/AppSnackbar";
import SearchHighlighter from "../../components/SearchHighlighter";
import { useSearch } from "../../contexts/SearchContext";
import api from "../../api/axiosClient";

export default function Ranks() {
    const theme = useTheme();
    const colors = Token(theme.palette.mode);
    const [ranks, setRanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editingRank, setEditingRank] = useState(null);
    const [formData, setFormData] = useState({ name: "" });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    // Estado para diálogo de eliminación
    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        rankId: null,
        rankName: ''
    });

    // Contexto de búsqueda
    const { searchTerm, isSearching } = useSearch();

    // Filtro de rangos con búsqueda
    const filteredRanks = useMemo(() => {
        if (!Array.isArray(ranks)) return [];

        if (!isSearching || !searchTerm) {
            return ranks;
        }

        return ranks.filter((rank) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                rank.name?.toLowerCase().includes(searchLower)
            );
        });
    }, [ranks, isSearching, searchTerm]);

    const showSnackbar = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchRanks = useCallback(async ({ silent = false } = {}) => {
        try {
            if (!silent) setLoading(true);
            const endpoint = "/api/ranks";
            const { data } = await api.get(endpoint);
            const ranksData = Array.isArray(data) ? data : data?.data || [];
            setRanks(ranksData);
        } catch (error) {
            console.error('Error al cargar rangos:', error);
            setRanks([]);
            showSnackbar("Error al cargar rangos", "error");
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    const POLL_INTERVAL = 5000;

    useEffect(() => {
        fetchRanks();
        const intervalId = setInterval(() => fetchRanks({ silent: true }), POLL_INTERVAL);
        return () => clearInterval(intervalId);
    }, [fetchRanks]);

    // Escuchar eventos de otras ventanas/pestañas
    useEffect(() => {
        const handleReload = () => fetchRanks({ silent: true });

        window.addEventListener("rankCreated", handleReload);
        window.addEventListener("rankUpdated", handleReload);
        window.addEventListener("rankDeleted", handleReload);

        const handleStorageChange = (e) => {
            if (e.key === 'rankChanged') handleReload();
        };
        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("rankCreated", handleReload);
            window.removeEventListener("rankUpdated", handleReload);
            window.removeEventListener("rankDeleted", handleReload);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [fetchRanks]);

    const handleOpen = (rank = null) => {
        if (rank) {
            setEditingRank(rank);
            setFormData({ name: rank.name });
        } else {
            setEditingRank(null);
            setFormData({ name: "" });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingRank(null);
        setFormData({ name: "" });
    };

    const handleSubmit = async () => {
        try {
            if (!formData.name.trim()) {
                showSnackbar("El nombre es requerido", "warning");
                return;
            }

            if (editingRank) {
                await api.put(`/api/ranks/${editingRank.id}`, formData);
                showSnackbar("Rango actualizado exitosamente");
                window.dispatchEvent(new Event("rankUpdated"));
                localStorage.setItem('rankChanged', Date.now().toString());
            } else {
                await api.post("/api/ranks", formData);
                showSnackbar("Rango creado exitosamente");
                window.dispatchEvent(new Event("rankCreated"));
                localStorage.setItem('rankChanged', Date.now().toString());
            }

            handleClose();
            fetchRanks();
        } catch (error) {
            const message = error.response?.data?.error || "Error al procesar la solicitud";
            showSnackbar(message, "error");
        }
    };

    const handleDelete = (id, name) => {
        setDeleteDialog({
            open: true,
            rankId: id,
            rankName: name
        });
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/api/ranks/${deleteDialog.rankId}`);
            showSnackbar("Rango eliminado exitosamente");
            window.dispatchEvent(new Event("rankDeleted"));
            localStorage.setItem('rankChanged', Date.now().toString());
            fetchRanks();
        } catch (error) {
            const message = error.response?.data?.error || "Error al eliminar el rango";
            showSnackbar(message, "error");
        } finally {
            setDeleteDialog({ open: false, rankId: null, rankName: '' });
        }
    };

    const cancelDelete = () => {
        setDeleteDialog({ open: false, rankId: null, rankName: '' });
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

    if (loading) {
        return (
            <Box m="20px">
                <Header title="Rangos" subtitle="Cargando..." />
            </Box>
        );
    }

    return (
        <Box m="20px">
            <Header
                title="Gestión de Rangos"
                subtitle={`${ranks.length} rangos | ${filteredRanks.length} mostrados`}
            />

            <Box display="flex" justifyContent="flex-end" alignItems="center" mb="20px">
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                    sx={{ px: 3, py: 1.5 }}
                >
                    Nuevo Rango
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
                                    Creado
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
                        {Array.isArray(filteredRanks) && filteredRanks.map((rank) => (
                            <TableRow
                                key={rank.id}
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
                                                text={rank.name}
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
                                        {formatDate(rank.created_at)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        onClick={() => handleOpen(rank)}
                                        color="warning"
                                        size="small"
                                        sx={{ mr: 1 }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDelete(rank.id, rank.name)}
                                        color="error"
                                        size="small"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog para crear/editar */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingRank ? "Editar Rango" : "Nuevo Rango"}
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
                        {editingRank ? "Actualizar" : "Crear"}
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
                        ¿Estás seguro de que deseas eliminar el rango "{deleteDialog.rankName}"?
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
