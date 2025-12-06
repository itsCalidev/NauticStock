import React, { useState, useEffect, useMemo } from "react";
import {
    Box,
    Typography,
    useTheme,
    Grid,
    Paper,
    CircularProgress,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip
} from "@mui/material";
import {
    Inventory as InventoryIcon,
    AttachMoney as MoneyIcon,
    Warning as WarningIcon,
    PendingActions as PendingIcon,
    PictureAsPdf as PdfIcon
} from "@mui/icons-material";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import Header from "../../components/Header";
import { Token } from "../../theme";
import api from "../../api/axiosClient";
import usePermission from "../../hooks/usePermission";
import { useNavigate } from "react-router-dom";
import { generateDashboardReport } from "../../utils/pdfUtils";

const StatCard = ({ title, value, icon, color, subtext }) => {
    const theme = useTheme();
    const colors = Token(theme.palette.mode);

    return (
        <Card sx={{ bgcolor: colors.primary[400], height: '100%' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: color }}>
                            {value}
                        </Typography>
                    </Box>
                    <Box p={1} bgcolor={color} borderRadius="50%" display="flex" alignItems="center" justifyContent="center">
                        {icon}
                    </Box>
                </Box>
                {subtext && (
                    <Typography variant="body2" color={colors.grey[300]} sx={{ mt: 1 }}>
                        {subtext}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

const Reports = () => {
    const theme = useTheme();
    const colors = Token(theme.palette.mode);
    const { can } = usePermission();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!can('report_view')) {
            navigate('/');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [can, navigate]);

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            try {
                if (mounted) setLoading(true);
                const [prodRes, ordRes] = await Promise.all([
                    api.get('/api/products'),
                    api.get('/api/orders')
                ]);

                if (mounted) {
                    setProducts(prodRes.data.data || []);
                    setOrders(Array.isArray(ordRes.data) ? ordRes.data : ordRes.data?.data || []);
                }
            } catch (error) {
                console.error("Error fetching report data:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (can('report_view')) {
            fetchData();
        } else {
            setLoading(false);
        }

        return () => {
            mounted = false;
        };
    }, [can]);

    // --- DATA PROCESSING ---

    // KPIs
    const kpiData = useMemo(() => {
        const totalProducts = products.length;
        const totalValue = products.reduce((acc, p) => acc + ((parseFloat(p.price) || 0) * (p.quantity || 0)), 0);
        const lowStockCount = products.filter(p => (p.quantity || 0) <= (p.min_stock || 0)).length;
        const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

        return [
            {
                title: "Total Productos",
                value: totalProducts,
                icon: <InventoryIcon sx={{ color: "white" }} />,
                color: colors.greenAccent[500],
                subtext: "Items únicos en inventario"
            },
            {
                title: "Valor Inventario",
                value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                icon: <MoneyIcon sx={{ color: "white" }} />,
                color: colors.blueAccent[500],
                subtext: "Costo total estimado"
            },
            {
                title: "Stock Bajo/Crítico",
                value: lowStockCount,
                icon: <WarningIcon sx={{ color: "white" }} />,
                color: colors.redAccent[500],
                subtext: "Requieren atención inmediata"
            },
            {
                title: "Órdenes Pendientes",
                value: pendingOrdersCount,
                icon: <PendingIcon sx={{ color: "white" }} />,
                color: "#f39c12", // Orange
                subtext: "En espera de recepción"
            }
        ];
    }, [products, orders, colors]);

    // Low Stock Items
    const lowStockItems = useMemo(() => {
        return products
            .filter(p => (p.quantity || 0) <= (p.min_stock || 0))
            .map(p => ({
                ...p,
                name: p.part_number || 'Sin Nombre',
                provider: p.supplier || 'Sin Proveedor'
            }))
            .sort((a, b) => (a.quantity || 0) - (b.quantity || 0)) // Ascending by stock
            .slice(0, 10); // Top 10 critical
    }, [products]);

    // Pending Orders List
    const pendingOrdersList = useMemo(() => {
        return orders.filter(o => o.status === 'pending');
    }, [orders]);

    // Charts Data
    const productsByCategory = useMemo(() => {
        const counts = {};
        products.forEach(p => {
            const cat = p.category || 'Sin Categoría';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({
            id: key,
            label: key,
            value: counts[key],
        }));
    }, [products]);

    const stockValueByCategory = useMemo(() => {
        const values = {};
        products.forEach(p => {
            const cat = p.category || 'Sin Categoría';
            const value = (parseFloat(p.price) || 0) * (p.quantity || 0);
            values[cat] = (values[cat] || 0) + value;
        });
        return Object.keys(values).map(key => ({
            category: key,
            value: Math.round(values[key] * 100) / 100
        })).sort((a, b) => b.value - a.value).slice(0, 10);
    }, [products]);

    const ordersByStatus = useMemo(() => {
        const counts = {};
        orders.forEach(o => {
            const status = o.status || 'Desconocido';
            counts[status] = (counts[status] || 0) + 1;
        });

        const statusTranslations = {
            pending: 'Pendiente',
            received: 'Recibido',
            cancelled: 'Cancelado',
            processing: 'Procesando',
            unknown: 'Desconocido'
        };

        return Object.keys(counts).map(key => ({
            id: statusTranslations[key] || key,
            label: statusTranslations[key] || key,
            value: counts[key],
        }));
    }, [orders]);

    const topProviders = useMemo(() => {
        const counts = {};
        orders.forEach(o => {
            const prov = o.provider_name || 'Desconocido';
            counts[prov] = (counts[prov] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({
            provider: key,
            orders: counts[key]
        })).sort((a, b) => b.orders - a.orders).slice(0, 5);
    }, [orders]);

    const handleDownloadPDF = () => {
        const data = {
            kpiData,
            lowStockItems,
            pendingOrders: pendingOrdersList,
            topProviders,
            stockValueByCategory
        };
        generateDashboardReport(data);
    };

    if (loading) {
        return (
            <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box m="20px" pb={5}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Header title="REPORTES Y ESTADÍSTICAS" subtitle="Visión general e indicadores clave" />
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<PdfIcon />}
                    onClick={handleDownloadPDF}
                    sx={{ fontWeight: 'bold' }}
                >
                    Descargar Reporte PDF
                </Button>
            </Box>

            {/* KPI CARDS */}
            <Grid container spacing={2} mb={3}>
                {kpiData.map((kpi, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <StatCard {...kpi} />
                    </Grid>
                ))}
            </Grid>

            {/* LOW STOCK TABLE */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: colors.primary[400], borderRadius: 2, boxShadow: 3, overflow: 'auto' }}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <WarningIcon color="error" />
                            <Typography variant="h6" fontWeight="bold" color={colors.grey[100]}>
                                Alerta de Stock Bajo (Top 10 Críticos)
                            </Typography>
                        </Box>
                        <TableContainer>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: colors.redAccent[700], color: "white", fontWeight: "bold" }}>Producto</TableCell>
                                        <TableCell sx={{ bgcolor: colors.redAccent[700], color: "white", fontWeight: "bold" }}>Categoría</TableCell>
                                        <TableCell align="center" sx={{ bgcolor: colors.redAccent[700], color: "white", fontWeight: "bold" }}>Stock</TableCell>
                                        <TableCell align="center" sx={{ bgcolor: colors.redAccent[700], color: "white", fontWeight: "bold" }}>Mínimo</TableCell>
                                        <TableCell sx={{ bgcolor: colors.redAccent[700], color: "white", fontWeight: "bold" }}>Proveedor</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lowStockItems.map((row) => (
                                        <TableRow key={row.id} hover>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell>{row.category}</TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={row.quantity}
                                                    color="error"
                                                    size="small"
                                                    variant={row.quantity === 0 ? "filled" : "outlined"}
                                                />
                                            </TableCell>
                                            <TableCell align="center">{row.min_stock}</TableCell>
                                            <TableCell>{row.provider}</TableCell>
                                        </TableRow>
                                    ))}
                                    {lowStockItems.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                <Typography color="success.main" sx={{ py: 2 }}>
                                                    ¡Todo en orden! No hay productos con stock bajo.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* CHARTS GRID */}
            <Grid container spacing={3}>
                {/* Inventory Value */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: "450px", bgcolor: colors.primary[400], borderRadius: 2, boxShadow: 3 }}>
                        <Typography variant="h6" fontWeight="bold" mb={2} color={colors.grey[100]}>Valor de Inventario (Top 10 Categorías)</Typography>
                        <ResponsiveBar
                            data={stockValueByCategory}
                            keys={['value']}
                            indexBy="category"
                            layout="vertical"
                            theme={{
                                axis: { domain: { line: { stroke: colors.grey[100] } }, legend: { text: { fill: colors.grey[100] } }, ticks: { line: { stroke: colors.grey[100], strokeWidth: 1 }, text: { fill: colors.grey[100] } } },
                                legends: { text: { fill: colors.grey[100] } },
                                tooltip: { container: { color: "#000" } }
                            }}
                            margin={{ top: 20, right: 30, bottom: 100, left: 80 }}
                            padding={0.3}
                            valueScale={{ type: 'linear' }}
                            indexScale={{ type: 'band', round: true }}
                            colors={{ scheme: 'spectral' }}
                            borderRadius={4}
                            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: -45,
                                legend: 'Categoría',
                                legendPosition: 'middle',
                                legendOffset: 80
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legend: 'Valor ($)',
                                legendPosition: 'middle',
                                legendOffset: -60,
                                format: value => `$${value.toLocaleString()}`
                            }}
                            enableGridY={true}
                            enableGridX={false}
                            enableLabel={true}
                            labelSkipWidth={12}
                            labelSkipHeight={12}
                            labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                            role="application"
                            ariaLabel="Gráfico de barras de valor de inventario por categoría"
                        />
                    </Paper>
                </Grid>

                {/* Top Providers */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: "450px", bgcolor: colors.primary[400], borderRadius: 2, boxShadow: 3 }}>
                        <Typography variant="h6" fontWeight="bold" mb={2} color={colors.grey[100]}>Top 5 Proveedores por Volumen</Typography>
                        <ResponsiveBar
                            data={topProviders}
                            keys={['orders']}
                            indexBy="provider"
                            layout="vertical"
                            theme={{
                                axis: { domain: { line: { stroke: colors.grey[100] } }, legend: { text: { fill: colors.grey[100] } }, ticks: { line: { stroke: colors.grey[100], strokeWidth: 1 }, text: { fill: colors.grey[100] } } },
                                legends: { text: { fill: colors.grey[100] } },
                                tooltip: { container: { color: "#000" } }
                            }}
                            margin={{ top: 20, right: 30, bottom: 100, left: 60 }}
                            padding={0.3}
                            valueScale={{ type: 'linear' }}
                            indexScale={{ type: 'band', round: true }}
                            colors={{ scheme: 'dark2' }}
                            borderRadius={4}
                            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: -45,
                                legend: 'Proveedor',
                                legendPosition: 'middle',
                                legendOffset: 80
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legend: 'Órdenes',
                                legendPosition: 'middle',
                                legendOffset: -50
                            }}
                            enableGridY={true}
                            enableGridX={false}
                            enableLabel={true}
                            labelSkipWidth={12}
                            labelSkipHeight={12}
                            labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                            role="application"
                            ariaLabel="Gráfico de barras de top proveedores"
                        />
                    </Paper>
                </Grid>

                {/* Products Pie */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: "450px", bgcolor: colors.primary[400], borderRadius: 2, boxShadow: 3 }}>
                        <Typography variant="h6" fontWeight="bold" mb={2} color={colors.grey[100]}>Productos por Categoría</Typography>
                        <ResponsivePie
                            data={productsByCategory}
                            theme={{
                                axis: { domain: { line: { stroke: colors.grey[100] } }, legend: { text: { fill: colors.grey[100] } }, ticks: { line: { stroke: colors.grey[100], strokeWidth: 1 }, text: { fill: colors.grey[100] } } },
                                legends: { text: { fill: colors.grey[100] } },
                                tooltip: { container: { color: "#000" } }
                            }}
                            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                            innerRadius={0.6}
                            padAngle={0.7}
                            cornerRadius={5}
                            activeOuterRadiusOffset={8}
                            colors={{ scheme: 'category10' }}
                            borderWidth={1}
                            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                            arcLinkLabelsSkipAngle={10}
                            arcLinkLabelsTextColor={colors.grey[100]}
                            arcLinkLabelsThickness={2}
                            arcLinkLabelsColor={{ from: 'color' }}
                            enableArcLabels={true}
                            arcLabelsSkipAngle={10}
                            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                            legends={[
                                {
                                    anchor: 'bottom',
                                    direction: 'row',
                                    justify: false,
                                    translateX: 0,
                                    translateY: 56,
                                    itemsSpacing: 0,
                                    itemWidth: 85,
                                    itemHeight: 18,
                                    itemTextColor: colors.grey[100],
                                    itemDirection: 'left-to-right',
                                    itemOpacity: 1,
                                    symbolSize: 12,
                                    symbolShape: 'circle',
                                }
                            ]}
                        />
                    </Paper>
                </Grid>

                {/* Orders Pie */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: "450px", bgcolor: colors.primary[400], borderRadius: 2, boxShadow: 3 }}>
                        <Typography variant="h6" fontWeight="bold" mb={2} color={colors.grey[100]}>Estado de Órdenes</Typography>
                        <ResponsivePie
                            data={ordersByStatus}
                            theme={{
                                axis: { domain: { line: { stroke: colors.grey[100] } }, legend: { text: { fill: colors.grey[100] } }, ticks: { line: { stroke: colors.grey[100], strokeWidth: 1 }, text: { fill: colors.grey[100] } } },
                                legends: { text: { fill: colors.grey[100] } },
                                tooltip: { container: { color: "#000" } }
                            }}
                            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                            innerRadius={0.6}
                            padAngle={0.7}
                            cornerRadius={5}
                            activeOuterRadiusOffset={8}
                            colors={{ scheme: 'set2' }}
                            borderWidth={1}
                            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                            arcLinkLabelsSkipAngle={10}
                            arcLinkLabelsTextColor={colors.grey[100]}
                            arcLinkLabelsThickness={2}
                            arcLinkLabelsColor={{ from: 'color' }}
                            enableArcLabels={true}
                            arcLabelsSkipAngle={10}
                            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                            legends={[
                                {
                                    anchor: 'bottom',
                                    direction: 'row',
                                    justify: false,
                                    translateX: 0,
                                    translateY: 56,
                                    itemsSpacing: 0,
                                    itemWidth: 85,
                                    itemHeight: 18,
                                    itemTextColor: colors.grey[100],
                                    itemDirection: 'left-to-right',
                                    itemOpacity: 1,
                                    symbolSize: 12,
                                    symbolShape: 'circle',
                                }
                            ]}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Reports;
