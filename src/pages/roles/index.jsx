import React, { useState, useEffect, useCallback } from "react";
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
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Checkbox,
    FormControlLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    Security as SecurityIcon
} from "@mui/icons-material";
import Header from "../../components/Header";
import { Token } from "../../theme";
import AppSnackbar from "../../components/AppSnackbar";
import api from "../../api/axiosClient";

export default function Roles() {
    const theme = useTheme();
    const colors = Token(theme.palette.mode);
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        permissions: [] // Array of permission IDs
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        roleId: null,
        roleName: ''
    });

    const showSnackbar = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchData = useCallback(async ({ silent = false } = {}) => {
        try {
            if (!silent) setLoading(true);
            const [rolesRes, permsRes] = await Promise.all([
                api.get("/api/roles"),
                api.get("/api/roles/permissions")
            ]);
            setRoles(rolesRes.data.data);
            setAllPermissions(permsRes.data.data);
        } catch (error) {
            console.error("Error fetching roles data:", error);
            showSnackbar("Error al cargar datos de roles", "error");
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    const POLL_INTERVAL = 5000;

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(() => fetchData({ silent: true }), POLL_INTERVAL);
        return () => clearInterval(intervalId);
    }, [fetchData]);

    // Escuchar eventos de otras ventanas/pestañas
    useEffect(() => {
        const handleReload = () => fetchData({ silent: true });

        window.addEventListener("roleCreated", handleReload);
        window.addEventListener("roleUpdated", handleReload);
        window.addEventListener("roleDeleted", handleReload);

        const handleStorageChange = (e) => {
            if (e.key === 'roleChanged') handleReload();
        };
        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("roleCreated", handleReload);
            window.removeEventListener("roleUpdated", handleReload);
            window.removeEventListener("roleDeleted", handleReload);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [fetchData]);

    const handleOpen = (role = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.role,
                permissions: role.permissions ? role.permissions.map(p => p.id) : []
            });
        } else {
            setEditingRole(null);
            setFormData({
                name: "",
                permissions: []
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingRole(null);
        setFormData({ name: "", permissions: [] });
    };

    const handlePermissionChange = (permId) => {
        setFormData(prev => {
            const newPerms = prev.permissions.includes(permId)
                ? prev.permissions.filter(id => id !== permId)
                : [...prev.permissions, permId];
            return { ...prev, permissions: newPerms };
        });
    };

    const handleSelectAllModule = (modulePerms, checked) => {
        const moduleIds = modulePerms.map(p => p.id);
        setFormData(prev => {
            let newPerms = [...prev.permissions];
            if (checked) {
                // Add all missing IDs
                moduleIds.forEach(id => {
                    if (!newPerms.includes(id)) newPerms.push(id);
                });
            } else {
                // Remove all IDs
                newPerms = newPerms.filter(id => !moduleIds.includes(id));
            }
            return { ...prev, permissions: newPerms };
        });
    };

    const handleSubmit = async () => {
        try {
            if (!formData.name.trim()) {
                showSnackbar("El nombre del rol es requerido", "warning");
                return;
            }

            if (editingRole) {
                await api.put(`/api/roles/${editingRole.id}`, formData);
                showSnackbar("Rol actualizado exitosamente");
                window.dispatchEvent(new Event("roleUpdated"));
                localStorage.setItem('roleChanged', Date.now().toString());
            } else {
                await api.post("/api/roles", formData);
                showSnackbar("Rol creado exitosamente");
                window.dispatchEvent(new Event("roleCreated"));
                localStorage.setItem('roleChanged', Date.now().toString());
            }
            handleClose();
            fetchData();
        } catch (error) {
            const message = error.response?.data?.error || "Error al guardar el rol";
            showSnackbar(message, "error");
        }
    };

    const handleDelete = (id, name) => {
        setDeleteDialog({ open: true, roleId: id, roleName: name });
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/api/roles/${deleteDialog.roleId}`);
            showSnackbar("Rol eliminado exitosamente");
            window.dispatchEvent(new Event("roleDeleted"));
            localStorage.setItem('roleChanged', Date.now().toString());
            fetchData();
        } catch (error) {
            const message = error.response?.data?.error || "Error al eliminar el rol";
            showSnackbar(message, "error");
        } finally {
            setDeleteDialog({ open: false, roleId: null, roleName: '' });
        }
    };

    if (loading) {
        return (
            <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Box m="20px">
            <Header title="Gestión de Roles y Permisos" subtitle="Administra los roles de usuario y sus accesos" />

            <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Nuevo Rol
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ backgroundColor: colors.primary[400] }}>
                <Table>
                    <TableHead sx={{ backgroundColor: colors.blueAccent[700] }}>
                        <TableRow>
                            <TableCell>Rol</TableCell>
                            <TableCell>Permisos Asignados</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {roles.map((role) => (
                            <TableRow key={role.id} hover>
                                <TableCell sx={{ fontWeight: 'bold' }}>{role.role}</TableCell>
                                <TableCell>
                                    {role.permissions && role.permissions.length > 0 ? (
                                        <Typography variant="body2">
                                            {role.permissions.length} permisos asignados
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            Sin permisos
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton onClick={() => handleOpen(role)} color="warning">
                                        <EditIcon />
                                    </IconButton>
                                    {role.id !== 1 && ( // No permitir borrar admin
                                        <IconButton onClick={() => handleDelete(role.id, role.role)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog Crear/Editar */}
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{editingRole ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
                <DialogContent dividers>
                    <TextField
                        label="Nombre del Rol"
                        fullWidth
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        sx={{ mb: 3, mt: 1 }}
                    />

                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SecurityIcon color="secondary" /> Permisos del Sistema
                    </Typography>

                    <Box sx={{ maxHeight: '400px', overflowY: 'auto', pr: 1 }}>
                        {Object.entries(allPermissions).map(([module, perms]) => {
                            const allChecked = perms.every(p => formData.permissions.includes(p.id));
                            const someChecked = perms.some(p => formData.permissions.includes(p.id));

                            return (
                                <Accordion key={module} defaultExpanded>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={allChecked}
                                                    indeterminate={someChecked && !allChecked}
                                                    onChange={(e) => handleSelectAllModule(perms, e.target.checked)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    sx={{
                                                        color: colors.greenAccent[200],
                                                        '&.Mui-checked': {
                                                            color: colors.greenAccent[500],
                                                        },
                                                    }}
                                                />
                                            }
                                            label={<Typography fontWeight="bold" sx={{ textTransform: 'capitalize' }}>{module}</Typography>}
                                        />
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={1}>
                                            {perms.map((perm) => (
                                                <Grid item xs={12} sm={6} md={4} key={perm.id}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={formData.permissions.includes(perm.id)}
                                                                onChange={() => handlePermissionChange(perm.id)}
                                                                size="small"
                                                                sx={{
                                                                    color: colors.greenAccent[200],
                                                                    '&.Mui-checked': {
                                                                        color: colors.greenAccent[500],
                                                                    },
                                                                }}
                                                            />
                                                        }
                                                        label={
                                                            <Box>
                                                                <Typography variant="body2" fontWeight="medium">{perm.description}</Typography>
                                                                <Typography variant="caption" color="text.secondary">{perm.name}</Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="inherit">Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained" color="secondary">
                        {editingRole ? "Actualizar" : "Crear"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Eliminar */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que deseas eliminar el rol "{deleteDialog.roleName}"?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })} color="inherit">Cancelar</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">Eliminar</Button>
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
