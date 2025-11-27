import React, { useState, useEffect, useCallback } from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Button, CircularProgress, Alert, Chip, Card, CardContent, Grid } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosClient";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from "recharts";
import { useSocket } from "../../context/SocketContext";
import usePermission from "../../hooks/usePermission";
import { useSearch } from "../../contexts/SearchContext";
import SearchHighlighter from "../../components/SearchHighlighter";
import { flexibleMatch } from "../../utils/searchUtils";

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { can } = usePermission();

  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para gráficas
  const [inventoryData, setInventoryData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const [chartsLoading, setChartsLoading] = useState(true);
  const socket = useSocket();
  const { searchTerm } = useSearch();

  const filteredHistory = historyData.filter(log => {
    const searchableText = `${log.fecha} ${log.accion} ${log.quien} ${log.descripcion}`;
    return flexibleMatch(searchableText, searchTerm);
  });

  // Colores adaptativos para gráficas
  const chartColors = isDarkMode
    ? {
      primary: '#90caf9',
      secondary: '#f48fb1',
      grid: '#555555',
      text: '#ffffff',
      background: 'rgba(255,255,255,0.05)',
      tooltipBg: '#424242',
      lineColor: '#81c784',
      activeDot: '#a5d6a7'
    }
    : {
      primary: '#3f51b5',
      secondary: '#f50057',
      grid: '#e0e0e0',
      text: '#333333',
      background: 'rgba(0,0,0,0.05)',
      tooltipBg: '#ffffff',
      lineColor: '#4caf50',
      activeDot: '#2e7d32'
    };

  const fetchChartData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setChartsLoading(true);

      console.log('[Dashboard] Cargando datos... (' + (silent ? 'silencioso' : 'completo') + ')');

      // Obtener datos de las APIs en paralelo
      const [inventoryResponse, activityResponse, summaryResponse] = await Promise.all([
        api.get('/api/dashboard/inventory-stats'),
        api.get('/api/dashboard/activity-stats'),
        api.get('/api/dashboard/summary')
      ]);

      // Procesar datos de inventario
      const inventoryStats = inventoryResponse.data?.data || [];
      setInventoryData(inventoryStats);

      // Procesar datos de actividad
      const activityStats = activityResponse.data?.data || [];
      setActivityData(activityStats);

      // Procesar resumen
      const summary = summaryResponse.data?.data || {};
      setSummaryData(summary);

    } catch (err) {
      console.error('❌ Error cargando datos de dashboard:', err);
      if (!silent) setError('Error al cargar datos del dashboard: ' + (err.response?.data?.error || err.message));
    } finally {
      if (!silent) setChartsLoading(false);
    }
  }, []);

  const fetchRecentHistory = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      if (!silent) setError(null);

      console.log('[Dashboard] Obteniendo historial reciente... (' + (silent ? 'silencioso' : 'completo') + ')');
      const response = await api.get('/api/history');

      // Procesar respuesta
      let dataArray = [];
      if (Array.isArray(response.data)) {
        dataArray = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        dataArray = response.data.data;
      }

      // Tomar solo los últimos 10 registros y mapear
      const recent = dataArray.slice(0, 10).map(log => ({
        id: log.id,
        fecha: new Date(log.created_at).toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        accion: log.action_type || 'Sin acción',
        quien: log.performed_by_name || 'Sistema',
        descripcion: log.description || 'Sin descripción'
      }));

      setHistoryData(recent);

    } catch (err) {
      console.error('Error cargando historial:', err);
      if (!silent) setError('Error al cargar el historial');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Carga inicial
  const hasViewPermission = can('dashboard_view');

  useEffect(() => {
    // Si tiene permiso de ver dashboard, cargar datos
    if (hasViewPermission) {
      fetchRecentHistory();
      fetchChartData();
    } else {
      // Si no tiene permiso, redirigir a la primera ruta permitida
      // Esto es un fallback por si PermissionRoute no lo atrapó (ej. acceso directo a /dashboard)
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const permissions = user.permissions || [];

        // Mapa de permisos a rutas
        const routeMap = [
          { permission: 'user_read', path: '/team' },
          { permission: 'product_read', path: '/products' },
          { permission: 'provider_read', path: '/providers' },
          { permission: 'category_read', path: '/categories' },
          { permission: 'location_read', path: '/locations' },
          { permission: 'brand_read', path: '/brands' },
          { permission: 'rank_read', path: '/ranks' },
          { permission: 'role_read', path: '/roles' },
          { permission: 'history_view', path: '/history' },
          { permission: 'view_faq', path: '/faq' }
        ];

        const firstAllowed = routeMap.find(r => permissions.includes(r.permission));
        if (firstAllowed) {
          console.log(`[Dashboard] Redirigiendo a ${firstAllowed.path} por falta de permisos en dashboard`);
          navigate(firstAllowed.path, { replace: true });
        }
      }

      setLoading(false);
      setChartsLoading(false);
    }
  }, [fetchChartData, fetchRecentHistory, hasViewPermission, navigate]);

  // Escuchar eventos de Socket.io
  useEffect(() => {
    if (!socket || !hasViewPermission) return;

    const handleDashboardUpdate = (data) => {
      console.log('🔔 Dashboard update received:', data);
      fetchRecentHistory({ silent: true });
      fetchChartData({ silent: true });
    };

    // Listen for history updates which cover most actions
    socket.on('history_updated', handleDashboardUpdate);

    // Also listen for specific events that might affect charts but not history directly (though usually they do)
    socket.on('product_created', handleDashboardUpdate);
    socket.on('product_updated', handleDashboardUpdate);
    socket.on('product_deleted', handleDashboardUpdate);
    socket.on('stock_updated', handleDashboardUpdate);

    return () => {
      socket.off('history_updated', handleDashboardUpdate);
      socket.off('product_created', handleDashboardUpdate);
      socket.off('product_updated', handleDashboardUpdate);
      socket.off('product_deleted', handleDashboardUpdate);
      socket.off('stock_updated', handleDashboardUpdate);
    };
  }, [socket, fetchRecentHistory, fetchChartData, hasViewPermission]);


  // Función mejorada para colores de acciones con mejor contraste
  const getActionColor = (accion) => {
    const actionLower = accion.toLowerCase();

    if (actionLower.includes('crear')) return 'success';
    if (actionLower.includes('actualizar') || actionLower.includes('editar')) return isDarkMode ? 'info' : 'primary';
    if (actionLower.includes('eliminar')) return 'error';
    if (actionLower.includes('login') || actionLower.includes('logout')) return 'secondary';
    if (actionLower.includes('stock')) return 'warning';
    if (actionLower.includes('habilitar') || actionLower.includes('rehabilitar')) return 'info';

    return 'default';
  };

  const handleVerMas = () => {
    navigate('/history');
  };

  return (
    <Box m="20px">
      {/* MAIN LAYOUT - Full height flex container */}
      <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap="20px">

        {/* LEFT COLUMN: HEADER + CARDS + CHARTS */}
        <Box flex={1} display="flex" flexDirection="column" gap="20px">

          {/* HEADER */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Header title="DASHBOARD" subtitle="Resumen del sistema NauticStock" />
          </Box>

          {/* TARJETAS DE RESUMEN */}
          {hasViewPermission && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total de Productos
                    </Typography>
                    <Typography variant="h4">
                      {chartsLoading ? <CircularProgress size={24} /> : summaryData.productos_total || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total de Stock
                    </Typography>
                    <Typography variant="h4">
                      {chartsLoading ? <CircularProgress size={24} /> : summaryData.stock_total || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Usuarios Activos
                    </Typography>
                    <Typography variant="h4">
                      {chartsLoading ? <CircularProgress size={24} /> : (summaryData.usuarios_activos || 0) + '/' + (summaryData.usuarios_total || 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Actividad (7 días)
                    </Typography>
                    <Typography variant="h4">
                      {chartsLoading ? <CircularProgress size={24} /> : summaryData.actividad_semanal || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* GRÁFICAS */}
          <Box display="flex" flexDirection="column" gap="20px">

            {/* 📊 GRÁFICA DE INVENTARIO POR CATEGORÍA */}
            <Box height="450px" display="flex" flexDirection="column" alignItems="center">
              <Typography variant="h6" gutterBottom sx={{ color: chartColors.text, fontWeight: 'bold' }}>
                Inventario por Categoría
              </Typography>
              {!hasViewPermission ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography variant="body2" color="text.secondary">
                    No tienes permisos para ver las estadísticas
                  </Typography>
                </Box>
              ) : chartsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress size={40} />
                </Box>
              ) : inventoryData.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography variant="body2" color="text.secondary">
                    No hay datos de inventario disponibles
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={inventoryData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis
                      dataKey="categoria"
                      tick={{ fontSize: 11, fill: chartColors.text }}
                      angle={-45}
                      textAnchor="end"
                      height={120}
                      stroke={chartColors.text}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: chartColors.text }}
                      stroke={chartColors.text}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: '8px',
                        color: chartColors.text,
                        fontSize: '14px'
                      }}
                      formatter={(value, name) => [
                        name === 'Total en Stock' ? `${value} unidades` : `${value} productos`,
                        name
                      ]}
                      labelFormatter={(label) => `Categoría: ${label}`}
                    />
                    <Legend
                      wrapperStyle={{
                        color: chartColors.text,
                        fontSize: '14px',
                        paddingTop: '10px'
                      }}
                    />
                    <Bar
                      dataKey="cantidad"
                      fill={chartColors.primary}
                      name="Total en Stock"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                    />
                    <Bar
                      dataKey="productos"
                      fill={chartColors.secondary}
                      name="Productos Distintos"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>

            {/* 📈 GRÁFICA DE ACTIVIDAD DEL SISTEMA */}
            <Box height="350px" display="flex" flexDirection="column" alignItems="center">
              <Typography variant="h6" gutterBottom sx={{ color: chartColors.text, fontWeight: 'bold' }}>
                Actividad del Sistema (Últimos 30 días)
              </Typography>
              {!hasViewPermission ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography variant="body2" color="text.secondary">
                    No tienes permisos para ver las estadísticas
                  </Typography>
                </Box>
              ) : chartsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress size={40} />
                </Box>
              ) : activityData.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography variant="body2" color="text.secondary">
                    No hay datos de actividad disponibles
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis
                      dataKey="fecha"
                      tick={{ fontSize: 10, fill: chartColors.text }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      stroke={chartColors.text}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: chartColors.text }}
                      stroke={chartColors.text}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: '8px',
                        color: chartColors.text,
                        fontSize: '13px'
                      }}
                      formatter={(value, name) => [`${value} operaciones`, 'Actividad']}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Legend
                      wrapperStyle={{
                        color: chartColors.text,
                        fontSize: '13px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actividad"
                      stroke={chartColors.lineColor}
                      strokeWidth={2}
                      dot={{ fill: chartColors.lineColor, strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, fill: chartColors.activeDot }}
                      name="Operaciones"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Box>
        </Box>

        {/* RIGHT COLUMN: RECENT ACTIVITY TABLE */}
        <Box
          width={{ xs: '100%', lg: '50%' }}
          minWidth="450px"
          bgcolor="rgba(0, 0, 0, 0.7)"
          borderRadius="20px"
          p="20px"
          color="#A5D6A7"
          boxShadow="0 4px 15px rgba(0, 0, 0, 0.5)"
          fontFamily="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          display="flex"
          flexDirection="column"
          height="auto"
          alignSelf="flex-start" // Fix empty space by not stretching
          sx={{ overflowY: 'hidden' }} // Let the table container handle scroll
        >
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Actividad Reciente del Sistema
          </Typography>

          {/* Mostrar contenido según el estado */}
          {
            !hasViewPermission ? (
              <Box display="flex" justifyContent="center" alignItems="center" flex={1} minHeight="200px">
                <Typography variant="body2" color="#888">
                  No tienes permisos para ver el historial de actividades
                </Typography>
              </Box>
            ) : loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" flex={1} minHeight="200px">
                <CircularProgress size={30} sx={{ color: "#A5D6A7" }} />
                <Typography variant="body2" ml={2}>
                  Cargando historial...
                </Typography>
              </Box>
            ) : error ? (
              <Box flex={1}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
                <Button
                  onClick={fetchRecentHistory}
                  variant="contained"
                  color="primary"
                  size="small"
                >
                  Reintentar
                </Button>
              </Box>
            ) : historyData.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" flex={1} minHeight="200px">
                <Typography variant="body2" color="#888">
                  No hay actividades registradas
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer
                  component={Paper}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    flexGrow: 1,
                    overflowY: "auto",
                    overflowX: "hidden", // Hide horizontal scroll if content fits
                    mb: 2,
                    maxHeight: '600px'
                  }}
                >
                  <Table stickyHeader size="small" aria-label="historial reciente">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: "#A5D6A7", fontWeight: "bold", fontSize: "0.8rem" }}>
                          Fecha
                        </TableCell>
                        <TableCell sx={{ color: "#A5D6A7", fontWeight: "bold", fontSize: "0.8rem" }}>
                          Acción
                        </TableCell>
                        <TableCell sx={{ color: "#A5D6A7", fontWeight: "bold", fontSize: "0.8rem" }}>
                          Usuario
                        </TableCell>
                        <TableCell sx={{ color: "#A5D6A7", fontWeight: "bold", fontSize: "0.8rem" }}>
                          Descripción
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredHistory.map((row) => (
                        <TableRow
                          key={row.id}
                          hover
                          sx={{
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: "rgba(255,255,255,0.1)"
                            }
                          }}
                        >
                          <TableCell sx={{
                            color: "#C8E6C9",
                            fontSize: "0.7rem",
                            fontFamily: "monospace",
                            minWidth: "110px"
                          }}>
                            {row.fecha}
                          </TableCell>
                          <TableCell sx={{
                            color: "#C8E6C9",
                            fontSize: "0.7rem",
                            minWidth: "100px"
                          }}>
                            <Chip
                              label={<SearchHighlighter text={row.accion} searchTerm={searchTerm} />}
                              color={getActionColor(row.accion)}
                              size="small"
                              sx={{
                                fontSize: "0.65rem",
                                height: "22px",
                                fontWeight: "bold",
                                '& .MuiChip-label': {
                                  color: '#ffffff',
                                  fontWeight: 'bold',
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{
                            color: "#C8E6C9",
                            fontSize: "0.7rem",
                            fontWeight: "bold"
                          }}>
                            <SearchHighlighter text={row.quien} searchTerm={searchTerm} />
                          </TableCell>
                          <TableCell sx={{
                            color: "#C8E6C9",
                            fontSize: "0.7rem",
                            whiteSpace: "normal", // Allow wrapping
                            wordBreak: "break-word"
                          }}>
                            <SearchHighlighter text={row.descripcion} searchTerm={searchTerm} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Botón Ver Más */}
                <Box display="flex" justifyContent="center">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleVerMas}
                    size="small"
                    sx={{
                      bgcolor: "#4caf50",
                      color: "white",
                      fontWeight: "bold",
                      px: 2,
                      py: 0.5,
                      "&:hover": {
                        bgcolor: "#45a049"
                      }
                    }}
                  >
                    Ver Historial Completo
                  </Button>
                </Box>
              </>
            )
          }
        </Box >
      </Box >
    </Box >
  );
};

export default Dashboard;
