import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    CircularProgress,
    Alert,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Button
} from '@mui/material';
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useTheme } from "@mui/material";
import { Token } from "../../theme";
import api from '../../api/axiosClient';
import Header from '../../components/Header';
import { useSearch } from '../../contexts/SearchContext';
import SearchHighlighter from '../../components/SearchHighlighter';
import { useSocket } from "../../context/SocketContext";
import { flexibleMatch } from "../../utils/searchUtils";
import { exportToExcel } from "../../utils/exportUtils";

const History = () => {
    const theme = useTheme();
    const colors = Token(theme.palette.mode);
    const { searchTerm, isSearching } = useSearch();
    const socket = useSocket();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Memoizar colors para evitar re-renders innecesarios
    // Manejo seguro de colores con fallbacks
    const safeColors = useMemo(() => colors || {
        primary: { 400: '#f5f5f5', 300: '#424242' },
        greenAccent: { 300: '#4caf50', 200: '#4caf50' },
        blueAccent: { 700: '#1976d2' },
        grey: { 100: '#f5f5f5' }
    }, [colors]);


    // FilteredRows useMemo
    const filteredRows = useMemo(() => {
        if (!isSearching || !searchTerm) {
            return rows;
        }

        return rows.filter(row => {
            const searchableText = `${row.accion} ${row.quien} ${row.objetivo} ${row.descripcion} ${row.fecha}`;
            return flexibleMatch(searchableText, searchTerm);
        });
    }, [rows, isSearching, searchTerm]);

    // Verificar autenticación y permisos al montar
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            const user = JSON.parse(localStorage.getItem("user") || "{}");

            console.log('History: Verificando auth...', { token: !!token, user });

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

            // Verificar permiso de historial (Admin o permiso explícito)
            const hasPermission = user.roleId === 1 || (user.permissions && user.permissions.includes('history_view'));

            if (!hasPermission) {
                setError("No tienes permisos para ver el historial");
                setLoading(false);
                return;
            }

            setIsAuthenticated(true);
        };

        checkAuth();

        // Si no está autenticado, reintentamos después de un momento
        const timeoutId = setTimeout(checkAuth, 100);

        return () => clearTimeout(timeoutId);
    }, []);

    const fetchLogs = useCallback(async ({ silent = false } = {}) => {
        if (!isAuthenticated) {
            console.log('History: No autenticado, saltando fetchLogs');
            return;
        }

        try {
            if (!silent) {
                setLoading(true);
            }
            setError(null);

            console.log(`History: Obteniendo historial... (${silent ? 'silencioso' : 'completo'})`);
            const response = await api.get('/api/history');

            let dataArray = [];
            if (Array.isArray(response.data)) {
                dataArray = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                // Si viene envuelto en un objeto con propiedad data
                dataArray = response.data.data;
            } else if (response.data && typeof response.data === 'object') {
                console.warn('History: Respuesta no es un array, intentando convertir:', response.data);
                dataArray = [];
            } else {
                console.error('History: Formato de respuesta inválido:', response.data);
                dataArray = [];
            }

            const mapped = dataArray.map(log => ({
                id: log.id,
                fecha: new Date(log.created_at).toLocaleString(),
                accion: log.action_type || 'Sin acción',
                quien: log.performed_by_name || 'Sistema',
                objetivo: log.target_user_name || '-',
                descripcion: log.description || 'Sin descripción'
            }));

            setRows(mapped);
        } catch (err) {
            console.error('Error cargando historial:', err);
            const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
            setError('Error al cargar el historial: ' + errorMessage);
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [isAuthenticated]);

    // Ejecutar fetchLogs solo cuando esté autenticado
    useEffect(() => {
        if (isAuthenticated) {
            fetchLogs();
        }
    }, [fetchLogs, isAuthenticated]);

    // Escuchar eventos de Socket.io
    useEffect(() => {
        if (!socket || !isAuthenticated) return;

        const handleHistoryUpdate = (data) => {
            console.log('🔔 History update received:', data);
            fetchLogs({ silent: true });
        };

        socket.on('history_updated', handleHistoryUpdate);

        return () => {
            socket.off('history_updated', handleHistoryUpdate);
        };
    }, [socket, fetchLogs, isAuthenticated]);

    // Función helper para obtener el color de la acción
    const getActionColor = useCallback((accion) => {
        const actionLower = accion.toLowerCase();

        // Colores adaptativos según el tema actual
        const actionColors = theme.palette.mode === 'dark'
            ? {
                // MODO OSCURO
                'login': '#64b5f6', // Blue
                'logout': '#ffb74d', // Orange
                'creado': '#81c784', // Green
                'creada': '#81c784', // Green
                'crear': '#81c784', // Green
                'actualizado': '#ffb74d', // Orange (Better than yellow)
                'actualizada': '#ffb74d', // Orange
                'actualizar': '#ffb74d', // Orange
                'modificado': '#ffb74d', // Orange
                'eliminado': '#e57373', // Red
                'eliminada': '#e57373', // Red
                'eliminó': '#e57373', // Red
                'eliminar': '#e57373', // Red
                'habilitado': '#4fc3f7', // Light Blue
                'rehabilitado': '#4fc3f7', // Light Blue
                'deshabilitado': '#f06292', // Pink
                'rol': '#ce93d8', // Purple
                'contraseña': '#ffd54f', // Amber
                'stock': '#ba68c8', // Purple
                'default': '#90a4ae' // Grey
            }
            : {
                // MODO CLARO
                'login': '#1976d2', // Dark Blue
                'logout': '#f57c00', // Dark Orange
                'creado': '#388e3c', // Dark Green
                'creada': '#388e3c', // Dark Green
                'crear': '#388e3c', // Dark Green
                'actualizado': '#f57c00', // Dark Orange (Readable on white)
                'actualizada': '#f57c00', // Dark Orange
                'actualizar': '#f57c00', // Dark Orange
                'modificado': '#f57c00', // Dark Orange
                'eliminado': '#d32f2f', // Dark Red
                'eliminada': '#d32f2f', // Dark Red
                'eliminó': '#d32f2f', // Dark Red
                'eliminar': '#d32f2f', // Dark Red
                'habilitado': '#0288d1', // Blue
                'rehabilitado': '#0288d1', // Blue
                'deshabilitado': '#c2185b', // Pink/Red
                'rol': '#7b1fa2', // Purple
                'contraseña': '#fbc02d', // Dark Yellow/Amber
                'stock': '#7b1fa2', // Purple
                'default': '#616161' // Dark Grey
            };

        // Buscar coincidencias en el texto de la acción
        // Orden de prioridad: Eliminado > Actualizado > Creado > Otros
        if (actionLower.includes('elimin') || actionLower.includes('borrar')) return actionColors['eliminado'];
        if (actionLower.includes('actualiz') || actionLower.includes('modific') || actionLower.includes('edit')) return actionColors['actualizado'];
        if (actionLower.includes('crea') || actionLower.includes('registra') || actionLower.includes('nuevo')) return actionColors['creado'];

        for (const [key, color] of Object.entries(actionColors)) {
            if (actionLower.includes(key)) {
                return color;
            }
        }

        return actionColors.default;
    }, [theme.palette.mode]);

    if (loading && !isAuthenticated) {
        return (
            <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress size={60} />
                <Box ml={2} fontSize="1.2rem">Verificando permisos...</Box>
            </Box>
        );
    }

    if (error && !isAuthenticated) {
        return (
            <Box m="20px">
                <Header title="HISTORIAL" subtitle="Registro de actividades del sistema" />
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            </Box>
        );
    }

    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Header title="HISTORIAL" subtitle="Registro de actividades del sistema" />
                <Button
                    variant="contained"
                    color="success"
                    startIcon={<FileDownloadIcon />}
                    onClick={() => exportToExcel(filteredRows.map(row => ({
                        ID: row.id,
                        Fecha: row.fecha,
                        Acción: row.accion,
                        'Realizado por': row.quien,
                        Objetivo: row.objetivo,
                        Descripción: row.descripcion
                    })), 'Historial_Actividades')}
                    sx={{ fontWeight: 'bold' }}
                >
                    Exportar Excel
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper} sx={{ backgroundColor: safeColors.primary[400], mt: "40px" }}>
                <Table>
                    <TableHead sx={{ backgroundColor: safeColors.blueAccent[700] }}>
                        <TableRow>
                            <TableCell align="center"><Typography fontWeight="bold">ID</Typography></TableCell>
                            <TableCell><Typography fontWeight="bold">Fecha y Hora</Typography></TableCell>
                            <TableCell align="center"><Typography fontWeight="bold">Acción</Typography></TableCell>
                            <TableCell><Typography fontWeight="bold">Realizado por</Typography></TableCell>
                            <TableCell><Typography fontWeight="bold">Objetivo</Typography></TableCell>
                            <TableCell><Typography fontWeight="bold">Descripción</Typography></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRows.map((row) => (
                            <TableRow key={row.id} hover>
                                <TableCell align="center">
                                    <SearchHighlighter text={row.id?.toString()} searchTerm={searchTerm} />
                                </TableCell>
                                <TableCell>
                                    <SearchHighlighter text={row.fecha} searchTerm={searchTerm} />
                                </TableCell>
                                <TableCell align="center">
                                    <Box
                                        m="0 auto"
                                        p="5px"
                                        display="flex"
                                        justifyContent="center"
                                        backgroundColor={getActionColor(row.accion)}
                                        borderRadius="4px"
                                        width="100%"
                                    >
                                        <SearchHighlighter
                                            text={row.accion}
                                            searchTerm={searchTerm}
                                            style={{ color: '#fff', fontWeight: 'bold' }}
                                        />
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <SearchHighlighter text={row.quien} searchTerm={searchTerm} />
                                </TableCell>
                                <TableCell>
                                    <SearchHighlighter text={row.objetivo} searchTerm={searchTerm} />
                                </TableCell>
                                <TableCell>
                                    <SearchHighlighter text={row.descripcion} searchTerm={searchTerm} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default History;