import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  useTheme,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Tooltip,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from "@mui/icons-material";
import TablePagination from "@mui/material/TablePagination";
import { Formik } from "formik";
import * as yup from "yup";
import Header from "../../components/Header";
import { Token } from "../../theme";
import AppSnackbar from "../../components/AppSnackbar";
import api from "../../api/axiosClient";
import usePermission from "../../hooks/usePermission";
import { useSearch } from "../../contexts/SearchContext";
import SearchHighlighter from "../../components/SearchHighlighter";
import { flexibleMatch } from "../../utils/searchUtils";
import { exportToExcel } from "../../utils/exportUtils";
import { generateOrderPDF } from "../../utils/pdfUtils";

const orderSchema = yup.object().shape({
  product_id: yup.string().required("Requerido"),
  provider_id: yup.string().required("Requerido"),
  quantity: yup.number().required("Requerido").min(1, "Debe ser al menos 1"),
  
  expected_date: yup.date().nullable()
    .min(new Date(new Date().setHours(0,0,0,0)), "La fecha no puede ser anterior a hoy"),
  notes: yup.string().nullable(),
});

export default function Orders() {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const viewLabels = {
    product: "Producto",
    provider: "Proveedor",
    quantity: "Cantidad",
    status: "Estado",
    orderDate: "Fecha de creación",
    expectedDate: "Fecha esperada",
    notes: "Notas",
    actions: "Acciones",
  };

  const formatKey = (key) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

  const [viewConfig, setViewConfig] = useState({
    product: true,
    provider: true,
    quantity: true,
    status: true,
    orderDate: true,
    expectedDate: true,
    notes: true,
    actions: true,
  });

  const [openViewDialog, setOpenViewDialog] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // volver a la primera página
  };

  const { can } = usePermission();
  const { searchTerm } = useSearch();

  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.order_date).toLocaleDateString();
    const expectedDate = order.expected_date
      ? new Date(order.expected_date).toLocaleDateString()
      : "";
    const searchableText = `${order.product_name} ${order.provider_name} ${order.id} ${order.notes} ${orderDate} ${expectedDate}`;
    return flexibleMatch(searchableText, searchTerm);
  });

  const paginatedOrders = useMemo(() => {
    return rowsPerPage > 0
      ? filteredOrders.slice(
          page * rowsPerPage,
          page * rowsPerPage + rowsPerPage,
        )
      : filteredOrders; // -1 = todos
  }, [filteredOrders, page, rowsPerPage]);

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    orderId: null,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersRes, productsRes, providersRes] = await Promise.all([
        api.get("/api/orders"),
        api.get("/api/products"),
        api.get("/api/providers"),
      ]);

      setOrders(ordersRes.data.data || []);
      setProducts(productsRes.data.data || []);
      setProviders(providersRes.data.data || []);
    } catch (err) {
      console.error("Error cargando datos", err);
      setSnackbar({
        open: true,
        message: "Error al cargar datos",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const savedConfig = localStorage.getItem("orders_view_config");
    if (savedConfig) {
      setViewConfig(JSON.parse(savedConfig));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("orders_view_config", JSON.stringify(viewConfig));
  }, [viewConfig]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const handleOpenDialog = (order = null) => {
    setEditingOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingOrder(null);
  };

  const handleFormSubmit = async (values, { resetForm }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (editingOrder) {
        await api.put(`/api/orders/${editingOrder.id}`, values);
        setSnackbar({
          open: true,
          message: "Orden actualizada exitosamente",
          severity: "success",
        });
      } else {
        await api.post("/api/orders", values);
        setSnackbar({
          open: true,
          message: "Orden creada exitosamente",
          severity: "success",
        });
      }

      handleCloseDialog();
      resetForm();
      loadData();
    } catch (err) {
      console.error("Error guardando orden:", err);
      setSnackbar({
        open: true,
        message: "Error al guardar orden",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/orders/${deleteDialog.orderId}`);
      setSnackbar({
        open: true,
        message: "Orden eliminada exitosamente",
        severity: "success",
      });
      setDeleteDialog({ open: false, orderId: null });
      loadData();
    } catch (err) {
      console.error("Error eliminando orden:", err);
      setSnackbar({
        open: true,
        message: "Error al eliminar orden",
        severity: "error",
      });
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    if (currentStatus !== "pending") return;
    try {
      await api.put(`/api/orders/${id}`, { status: "received" });
      setSnackbar({
        open: true,
        message: "Orden marcada como recibida",
        severity: "success",
      });
      loadData();
    } catch (err) {
      console.error("Error actualizando estado:", err);
      setSnackbar({
        open: true,
        message: "Error al actualizar estado",
        severity: "error",
      });
    }
  };

  if (loading) {
    return (
      <Box
        m="20px"
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="50vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header
        title="Ordenes de Compra"
        subtitle="Gestión de pedidos a proveedores"
      />

      <Box display="flex" justifyContent="flex-end" mb={2} gap={2}>
        <Button
          variant="outlined"
          color="info"
          onClick={() => setOpenViewDialog(true)}
        >
          Personalizar vista
        </Button>

        <Button
          variant="contained"
          color="success"
          startIcon={<FileDownloadIcon />}
          onClick={() =>
            exportToExcel(
              filteredOrders.map((o) => ({
                ID: o.id,
                Producto: o.product_name,
                Proveedor: o.provider_name,
                Cantidad: o.quantity,
                Estado:
                  o.status === "pending"
                    ? "Pendiente"
                    : o.status === "received"
                      ? "Recibido"
                      : "Cancelado",
                "Fecha Creación": new Date(o.order_date).toLocaleDateString(),
                "Fecha Esperada": o.expected_date
                  ? new Date(o.expected_date).toLocaleDateString()
                  : "-",
                Notas: o.notes || "-",
              })),
              "Ordenes_Compra",
            )
          }
          sx={{ fontWeight: "bold" }}
        >
          Exportar Excel
        </Button>
        {can("order_create") && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ px: 3, py: 1.5, fontWeight: "bold" }}
          >
            Crear Orden
          </Button>
        )}
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: colors.primary[400],
          mt: "40px",
          maxHeight: "60vh",
          overflowY: "auto",
        }}
      >
        <Table stickyHeader>
          {/* HEADER */}
          <TableHead sx={{ backgroundColor: colors.blueAccent[700] }}>
            <TableRow>
              {viewConfig.product && <TableCell>Producto</TableCell>}
              {viewConfig.provider && <TableCell>Proveedor</TableCell>}
              {viewConfig.quantity && (
                <TableCell align="center">Cantidad</TableCell>
              )}
              {viewConfig.status && (
                <TableCell align="center">Estado</TableCell>
              )}
              {viewConfig.orderDate && <TableCell>Fecha Creación</TableCell>}
              {viewConfig.expectedDate && <TableCell>Fecha Esperada</TableCell>}
              {viewConfig.notes && <TableCell>Notas</TableCell>}
              {viewConfig.actions && (
                <TableCell align="center">Acciones</TableCell>
              )}
            </TableRow>
          </TableHead>

          {/* BODY */}
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order.id} hover>
                {viewConfig.product && (
                  <TableCell>
                    <SearchHighlighter
                      text={order.product_name}
                      searchTerm={searchTerm}
                    />
                  </TableCell>
                )}

                {viewConfig.provider && (
                  <TableCell>
                    <SearchHighlighter
                      text={order.provider_name}
                      searchTerm={searchTerm}
                    />
                  </TableCell>
                )}

                {viewConfig.quantity && (
                  <TableCell align="center">{order.quantity}</TableCell>
                )}

                {viewConfig.status && (
                  <TableCell align="center">
                    <Chip
                      label={
                        order.status === "pending"
                          ? "Pendiente"
                          : order.status === "received"
                            ? "Recibido"
                            : "Cancelado"
                      }
                      color={
                        order.status === "received"
                          ? "success"
                          : order.status === "pending"
                            ? "warning"
                            : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                )}

                {viewConfig.orderDate && (
                  <TableCell>
                    {new Date(order.order_date).toLocaleDateString()}
                  </TableCell>
                )}

                {viewConfig.expectedDate && (
                  <TableCell>
                    {order.expected_date
                      ? new Date(order.expected_date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                )}

                {viewConfig.notes && (
                  <TableCell>
                    <SearchHighlighter
                      text={order.notes || "-"}
                      searchTerm={searchTerm}
                    />
                  </TableCell>
                )}

                {viewConfig.actions && (
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" gap={1}>
                      <Tooltip title="Descargar PDF">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => generateOrderPDF(order)}
                        >
                          <PictureAsPdfIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {order.status === "pending" && can("order_update") && (
                        <Tooltip title="Marcar como Recibido">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() =>
                              handleStatusChange(order.id, order.status)
                            }
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {can("order_update") && (
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleOpenDialog(order)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {can("order_delete") && (
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setDeleteDialog({ open: true, orderId: order.id })
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filteredOrders.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[25, 50, 100, { label: "Todos", value: -1 }]}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />

      {/* Modal Creación/Edición */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingOrder ? "Editar Orden" : "Crear Nueva Orden"}
        </DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{
              product_id: editingOrder?.product_id || "",
              provider_id: editingOrder?.provider_id || "",
              quantity: editingOrder?.quantity || "",
              expected_date: editingOrder?.expected_date
                ? new Date(editingOrder.expected_date)
                    .toISOString()
                    .split("T")[0]
                : "",
              notes: editingOrder?.notes || "",
            }}
            validationSchema={orderSchema}
            onSubmit={handleFormSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleBlur,
              handleChange,
              handleSubmit,
            }) => (
              <form onSubmit={handleSubmit}>
                <Box
                  display="grid"
                  gap="20px"
                  gridTemplateColumns="repeat(2, 1fr)"
                  sx={{ mt: 2 }}
                >
                  <FormControl fullWidth variant="filled">
                    <InputLabel>Producto</InputLabel>
                    <Select
                      value={values.product_id}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name="product_id"
                      error={!!touched.product_id && !!errors.product_id}
                    >
                      {products.map((prod) => (
                        <MenuItem key={prod.id} value={prod.id}>
                          {prod.part_number} - {prod.description}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth variant="filled">
                    <InputLabel>Proveedor</InputLabel>
                    <Select
                      value={values.provider_id}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name="provider_id"
                      error={!!touched.provider_id && !!errors.provider_id}
                    >
                      {providers.map((prov) => (
                        <MenuItem key={prov.id} value={prov.id}>
                          {prov.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    variant="filled"
                    type="number"
                    label="Cantidad"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.quantity}
                    name="quantity"
                    error={!!touched.quantity && !!errors.quantity}
                    helperText={touched.quantity && errors.quantity}
                  />

                  <TextField
                    fullWidth
                    variant="filled"
                    type="date"
                    label="Fecha Esperada"
                    InputLabelProps={{ shrink: true }}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.expected_date}
                    name="expected_date"
                    error={!!touched.expected_date && !!errors.expected_date}
                    helperText={touched.expected_date && errors.expected_date}
                  />

                  <TextField
                    fullWidth
                    variant="filled"
                    multiline
                    rows={3}
                    label="Notas"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.notes}
                    name="notes"
                    sx={{ gridColumn: "span 2" }}
                  />
                </Box>
                <Box display="flex" justifyContent="end" mt="20px">
                  <Button type="submit" color="secondary" variant="contained">
                    {editingOrder ? "Actualizar Orden" : "Crear Orden"}
                  </Button>
                </Box>
              </form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar esta orden?
          </Typography>
        </DialogContent>
        <Box display="flex" justifyContent="end" p={2}>
          <Button
            onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
            color="inherit"
            sx={{ mr: 1 }}
          >
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </Box>
      </Dialog>

      <AppSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)}>
        <DialogTitle>Personalizar vista</DialogTitle>
        <DialogContent>
          {Object.keys(viewConfig).map((key) => (
            <Box key={key} display="flex" alignItems="center" gap={1} my={1}>
              <input
                type="checkbox"
                checked={viewConfig[key]}
                onChange={() =>
                  setViewConfig((prev) => ({
                    ...prev,
                    [key]: !prev[key],
                  }))
                }
              />
              <Typography>{viewLabels[key] ?? formatKey(key)}</Typography>
            </Box>
          ))}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
