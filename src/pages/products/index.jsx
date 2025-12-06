import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  CircularProgress
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  FileDownload as FileDownloadIcon
} from "@mui/icons-material";
import { Formik } from "formik";
import * as yup from "yup";
import Header from "../../components/Header";
import { Token } from "../../theme";
import AppSnackbar from "../../components/AppSnackbar";
import api from "../../api/axiosClient";
import usePermission from "../../hooks/usePermission";
import { useSocket } from "../../context/SocketContext";
import { useSearch } from "../../contexts/SearchContext";
import SearchHighlighter from "../../components/SearchHighlighter";
import { flexibleMatch } from "../../utils/searchUtils";
import { exportToExcel } from "../../utils/exportUtils";

const productSchema = yup.object().shape({
  part_number: yup.string().required("Requerido"),
  description: yup.string().required("Requerido"),
  price: yup.number().required("Requerido").positive("Debe ser positivo"),
  quantity: yup.number().required("Requerido").min(0, "No puede ser negativo"),
  min_stock: yup.number().required("Requerido").min(0, "No puede ser negativo"),
  max_stock: yup.number().required("Requerido").min(0, "No puede ser negativo"),
  categoryId: yup.string().required("Requerido"),
  brandId: yup.string().required("Requerido"),
  providerId: yup.string().required("Requerido"),
  locationId: yup.string().required("Requerido"),
});

export default function Products() {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [providers, setProviders] = useState([]);
  const [locations, setLocations] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const { can } = usePermission();
  const socket = useSocket();
  const { searchTerm, isSearching } = useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!can('product_read')) {
      navigate('/');
    }
  }, [can, navigate]);

  const [stockDialog, setStockDialog] = useState({
    open: false,
    productId: null,
    productName: '',
    currentStock: 0,
    operation: 'add', // 'add' or 'remove'
    amount: 1
  });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    productId: null,
    productName: ''
  });

  // Cargar datos auxiliares
  useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [cats, brs, provs, locs] = await Promise.all([
          api.get('/api/categories'),
          api.get('/api/brands'),
          api.get('/api/providers'),
          api.get('/api/locations')
        ]);
        setCategories(cats.data.data);
        setBrands(brs.data.data);
        setProviders(provs.data.data);
        setLocations(locs.data.data);
      } catch (err) {
        console.error("Error cargando datos auxiliares", err);
      }
    };
    fetchAuxData();
  }, []);

  // FilteredProducts useMemo
  const filteredProducts = useMemo(() => {
    let filtered = showInactive ? products : products.filter(product => product.status === 0);

    if (isSearching && searchTerm) {
      filtered = filtered.filter(product => {
        const searchableText = `${product.name} ${product.description} ${product.category} ${product.type} ${product.provider} ${product.location}`;
        return flexibleMatch(searchableText, searchTerm);
      });
    }

    return filtered;
  }, [products, showInactive, isSearching, searchTerm]);

  const loadProducts = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);

      const response = await api.get('/api/products');
      const transformedData = (response.data.data || []).map(product => ({
        id: product.id,
        name: product.part_number || 'Sin código',
        description: product.description || 'Sin descripción',
        category: product.category || 'Sin categoría',
        type: product.brand || 'Sin marca',
        provider: product.supplier || 'Sin proveedor',
        stock: product.quantity || 0,
        price: parseFloat(product.price) || 0,
        location: product.location || 'Sin ubicación',
        min_stock: product.min_stock || 0,
        max_stock: product.max_stock || 0,
        status: product.status || 0,
        // Guardar valores originales para edición
        original: product,
        category_id: product.category_id,
        brand_id: product.brand_id,
        provider_id: product.provider_id,
        location_id: product.location_id
      }));

      setProducts(transformedData);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
      console.error('Error al cargar productos: ' + errorMessage);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Escuchar eventos de Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleProductUpdate = (data) => {
      console.log('🔔 Product update received:', data);
      loadProducts({ silent: true });
    };

    socket.on('product_created', handleProductUpdate);
    socket.on('product_updated', handleProductUpdate);
    socket.on('product_deleted', handleProductUpdate);
    socket.on('product_status_changed', handleProductUpdate);
    socket.on('stock_updated', handleProductUpdate);

    return () => {
      socket.off('product_created', handleProductUpdate);
      socket.off('product_updated', handleProductUpdate);
      socket.off('product_deleted', handleProductUpdate);
      socket.off('product_status_changed', handleProductUpdate);
      socket.off('stock_updated', handleProductUpdate);
    };
  }, [socket, loadProducts]);

  const handleOpenDialog = useCallback((product = null) => {
    setEditingProduct(product);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
  };

  const handleFormSubmit = async (values, { resetForm }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.id}`, values);
        setSnackbar({ open: true, message: "Producto actualizado exitosamente", severity: "success" });
      } else {
        await api.post("/api/products", { ...values, status: 0 });
        setSnackbar({ open: true, message: "Producto creado exitosamente", severity: "success" });
      }

      handleCloseDialog();
      resetForm();
    } catch (err) {
      console.error('Error guardando producto:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || "Error al guardar producto";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockConfirm = useCallback(async () => {
    try {
      const { productId, operation, amount, currentStock } = stockDialog;
      const newStock = operation === 'add' ? currentStock + amount : currentStock - amount;

      if (newStock < 0) {
        setSnackbar({ open: true, message: "El stock no puede ser negativo", severity: "error" });
        return;
      }

      await api.put(`/api/products/${productId}`, { quantity: newStock });
      setSnackbar({ open: true, message: "Stock actualizado exitosamente", severity: "success" });
      setStockDialog(prev => ({ ...prev, open: false }));
    } catch (err) {
      console.error('Error actualizando stock:', err);
      setSnackbar({ open: true, message: "Error al actualizar stock", severity: "error" });
    }
  }, [stockDialog]);

  const handleToggleStatus = useCallback(async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 0 ? 1 : 0;
      await api.put(`/api/products/${id}`, { status: newStatus });
      setSnackbar({ open: true, message: `Producto ${newStatus === 0 ? 'habilitado' : 'deshabilitado'}`, severity: "success" });
    } catch (err) {
      console.error('Error cambiando estado:', err);
      setSnackbar({ open: true, message: "Error al cambiar estado", severity: "error" });
    }
  }, []);

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/products/${deleteDialog.productId}`);
      setSnackbar({ open: true, message: "Producto eliminado exitosamente", severity: "success" });
      setDeleteDialog({ open: false, productId: null, productName: '' });
    } catch (err) {
      console.error('Error eliminando producto:', err);
      setSnackbar({ open: true, message: "Error al eliminar producto", severity: "error" });
    }
  };

  const handleDeleteClick = async (product) => {
    try {
      const response = await api.get('/api/orders');
      const orders = Array.isArray(response.data) ? response.data : response.data.data || [];
      const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');
      const hasActiveOrders = activeOrders.some(o => o.product_id === product.id);

      if (hasActiveOrders) {
        setSnackbar({ open: true, message: `No se puede eliminar "${product.name}" porque tiene órdenes activas.`, severity: "error" });
        return;
      }

      setDeleteDialog({ open: true, productId: product.id, productName: product.name });
    } catch (err) {
      console.error('Error checking dependencies:', err);
      setSnackbar({ open: true, message: "Error al verificar dependencias", severity: "error" });
    }
  };

  const getStockStyle = useCallback((stock, minStock) => {
    const stockValue = Number(stock);
    if (stockValue <= 0) return { color: colors.redAccent[500], fontWeight: 'bold' };
    if (stockValue <= minStock) return { color: colors.blueAccent[500], fontWeight: 'bold' };
    return {};
  }, [colors]);

  if (loading && !products.length) {
    return (
      <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress size={60} />
        <Box ml={2} fontSize="1.2rem">Cargando productos...</Box>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header title="Inventario de Productos" subtitle={`${products.length} productos en almacén`} />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
              ? `${products.length} productos (${products.filter(p => p.status === 0).length} activos)`
              : `${filteredProducts.length} productos activos`
            }
          </Typography>
        </Box>

        {/* Botón Crear Producto */}
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="success"
            startIcon={<FileDownloadIcon />}
            onClick={() => exportToExcel(filteredProducts.map(p => ({
              Código: p.name,
              Descripción: p.description,
              Categoría: p.category,
              Marca: p.type,
              Proveedor: p.provider,
              Stock: p.stock,
              Precio: p.price,
              Ubicación: p.location,
              Estado: p.status === 0 ? 'Activo' : 'Inactivo'
            })), 'Inventario_Productos')}
            sx={{ fontWeight: 'bold' }}
          >
            Exportar Excel
          </Button>
          {can('product_create') && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ px: 3, py: 1.5, fontWeight: 'bold' }}
            >
              Crear Producto
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabla de Productos */}
      <TableContainer component={Paper} sx={{ backgroundColor: colors.primary[400], mt: "40px" }}>
        <Table>
          <TableHead sx={{ backgroundColor: colors.blueAccent[700] }}>
            <TableRow>
              <TableCell><Typography fontWeight="bold">Código</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Descripción</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Categoría</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Marca</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Proveedor</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight="bold">Stock</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight="bold">Estado de Stock</Typography></TableCell>
              <TableCell align="right"><Typography fontWeight="bold">Precio</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Ubicación</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight="bold">Estado</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight="bold">Acciones</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((product) => {
              const isActive = product.status === 0;

              // Lógica de Estado de Stock
              let stockStatus = { label: "Normal", color: "success" };
              const stock = Number(product.stock);
              const minStock = Number(product.min_stock);

              if (stock === 0) {
                stockStatus = { label: "Agotado", color: "error" }; // Rojo
              } else if (stock <= minStock * 0.5) {
                stockStatus = { label: "Crítico", color: "warning" }; // Naranja (usamos warning que es naranja/amarillo oscuro)
              } else if (stock <= minStock) {
                stockStatus = { label: "Bajo", color: "info" }; // Amarillo (usaremos un custom style o info si no hay amarillo directo)
              }

              return (
                <TableRow key={product.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', opacity: isActive ? 1 : 0.5, textDecoration: isActive ? 'none' : 'line-through' }}>
                      <SearchHighlighter text={product.name} searchTerm={searchTerm} />
                      {!isActive && (
                        <Box component="span" sx={{ ml: 1, px: 1, py: 0.2, bgcolor: 'error.main', color: 'white', borderRadius: 1, fontSize: '0.7rem' }}>
                          INACTIVO
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell><SearchHighlighter text={product.description} searchTerm={searchTerm} /></TableCell>
                  <TableCell><SearchHighlighter text={product.category} searchTerm={searchTerm} /></TableCell>
                  <TableCell><SearchHighlighter text={product.type} searchTerm={searchTerm} /></TableCell>
                  <TableCell><SearchHighlighter text={product.provider} searchTerm={searchTerm} /></TableCell>
                  <TableCell align="center">
                    <Typography sx={getStockStyle(product.stock, product.min_stock)}>
                      {product.stock}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: stockStatus.color === 'info' ? '#FBC02D' : `${stockStatus.color}.main`, // Amarillo custom para 'Bajo'
                        color: stockStatus.color === 'info' ? 'black' : 'white',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        display: 'inline-block',
                        minWidth: '80px'
                      }}
                    >
                      {stockStatus.label}
                    </Box>
                  </TableCell>
                  <TableCell align="right">${product.price.toFixed(2)}</TableCell>
                  <TableCell><SearchHighlighter text={product.location} searchTerm={searchTerm} /></TableCell>
                  <TableCell align="center">
                    {/* Estado Chip */}
                    <Box
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: isActive ? 'success.dark' : 'error.dark',
                        color: 'white',
                        fontSize: '0.75rem',
                        display: 'inline-block'
                      }}
                    >
                      {isActive ? 'Activo' : 'Inactivo'}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" gap={1}>
                      <Tooltip title={isActive ? "Editar producto" : "No se puede editar un producto inactivo"}>
                        <span>
                          {can('product_update') && (
                            <IconButton size="small" color="warning" onClick={() => handleOpenDialog(product)} disabled={!isActive}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                        </span>
                      </Tooltip>

                      {/* Botones de Stock */}
                      <Tooltip title={isActive ? "Agregar stock" : "Habilite el producto para gestionar stock"}>
                        <span>
                          {(can('product_update')) && (
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => setStockDialog({ open: true, productId: product.id, productName: product.name, currentStock: product.stock, operation: 'add', amount: 1 })}
                              disabled={!isActive}
                            >
                              <AddCircleIcon fontSize="small" />
                            </IconButton>
                          )}
                        </span>
                      </Tooltip>
                      <Tooltip title={isActive ? "Restar stock" : "Habilite el producto para gestionar stock"}>
                        <span>
                          {(can('product_update')) && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setStockDialog({ open: true, productId: product.id, productName: product.name, currentStock: product.stock, operation: 'remove', amount: 1 })}
                              disabled={!isActive}
                            >
                              <RemoveCircleIcon fontSize="small" />
                            </IconButton>
                          )}
                        </span>
                      </Tooltip>

                      <Tooltip title={isActive ? "Deshabilitar producto" : "Habilitar producto"}>
                        <span>
                          {can('product_update') && (
                            <IconButton size="small" color={isActive ? "error" : "success"} onClick={() => handleToggleStatus(product.id, product.status)}>
                              {isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          )}
                        </span>
                      </Tooltip>

                      {can('product_delete') && isActive && (
                        <Tooltip title="Eliminar producto">
                          <IconButton size="small" color="error" onClick={() => handleDeleteClick(product)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de Creación/Edición */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingProduct ? "Editar Producto" : "Crear Nuevo Producto"}</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{
              part_number: editingProduct?.part_number || "",
              description: editingProduct?.description || "",
              price: editingProduct?.price || 0,
              quantity: editingProduct?.quantity || 0,
              min_stock: editingProduct?.min_stock || 0,
              max_stock: editingProduct?.max_stock || 0,
              categoryId: editingProduct?.category_id || "",
              brandId: editingProduct?.brand_id || "",
              providerId: editingProduct?.provider_id || "",
              locationId: editingProduct?.location_id || "",
            }}
            validationSchema={productSchema}
            onSubmit={handleFormSubmit}
          >
            {({ values, errors, touched, handleBlur, handleChange, handleSubmit }) => (
              <form onSubmit={handleSubmit} id="product-form">
                <Box
                  display="grid"
                  gap="20px"
                  gridTemplateColumns="repeat(4, 1fr)"
                  sx={{
                    "& > div": { gridColumn: "span 4" },
                  }}
                >
                  <TextField
                    fullWidth
                    variant="filled"
                    type="text"
                    label="Código de Parte"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.part_number}
                    name="part_number"
                    error={!!touched.part_number && !!errors.part_number}
                    helperText={touched.part_number && errors.part_number}
                    sx={{ gridColumn: "span 2" }}
                  />
                  <TextField
                    fullWidth
                    variant="filled"
                    type="text"
                    label="Descripción"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.description}
                    name="description"
                    error={!!touched.description && !!errors.description}
                    helperText={touched.description && errors.description}
                    sx={{ gridColumn: "span 2" }}
                  />
                  <TextField
                    fullWidth
                    variant="filled"
                    type="number"
                    label="Precio"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.price}
                    name="price"
                    error={!!touched.price && !!errors.price}
                    helperText={touched.price && errors.price}
                    sx={{ gridColumn: "span 1" }}
                  />
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
                    sx={{ gridColumn: "span 1" }}
                  />
                  <TextField
                    fullWidth
                    variant="filled"
                    type="number"
                    label="Stock Mínimo"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.min_stock}
                    name="min_stock"
                    error={!!touched.min_stock && !!errors.min_stock}
                    helperText={touched.min_stock && errors.min_stock}
                    sx={{ gridColumn: "span 1" }}
                  />
                  <TextField
                    fullWidth
                    variant="filled"
                    type="number"
                    label="Stock Máximo"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.max_stock}
                    name="max_stock"
                    error={!!touched.max_stock && !!errors.max_stock}
                    helperText={touched.max_stock && errors.max_stock}
                    sx={{ gridColumn: "span 1" }}
                  />

                  <FormControl fullWidth variant="filled" sx={{ gridColumn: "span 2" }}>
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={values.categoryId}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name="categoryId"
                      error={!!touched.categoryId && !!errors.categoryId}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth variant="filled" sx={{ gridColumn: "span 2" }}>
                    <InputLabel>Marca</InputLabel>
                    <Select
                      value={values.brandId}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name="brandId"
                      error={!!touched.brandId && !!errors.brandId}
                    >
                      {brands.map((brand) => (
                        <MenuItem key={brand.id} value={brand.id}>{brand.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth variant="filled" sx={{ gridColumn: "span 2" }}>
                    <InputLabel>Proveedor</InputLabel>
                    <Select
                      value={values.providerId}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name="providerId"
                      error={!!touched.providerId && !!errors.providerId}
                    >
                      {providers.filter(p => p.status === 0).map((prov) => (
                        <MenuItem key={prov.id} value={prov.id}>{prov.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth variant="filled" sx={{ gridColumn: "span 2" }}>
                    <InputLabel>Ubicación</InputLabel>
                    <Select
                      value={values.locationId}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name="locationId"
                      error={!!touched.locationId && !!errors.locationId}
                    >
                      {locations.map((loc) => (
                        <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box display="flex" justifyContent="end" mt="20px">
                  <Button type="submit" color="secondary" variant="contained">
                    {editingProduct ? "Actualizar Producto" : "Crear Nuevo Producto"}
                  </Button>
                </Box>
              </form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Dialog Stock */}
      <Dialog open={stockDialog.open} onClose={() => setStockDialog({ ...stockDialog, open: false })}>
        <DialogTitle>
          {stockDialog.operation === 'add' ? 'Agregar Stock' : 'Restar Stock'} - {stockDialog.productName}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Cantidad"
            type="number"
            fullWidth
            variant="standard"
            value={stockDialog.amount}
            onChange={(e) => setStockDialog({ ...stockDialog, amount: parseInt(e.target.value) || 0 })}
          />
        </DialogContent>
        <Box display="flex" justifyContent="end" p={2}>
          <Button onClick={() => setStockDialog({ ...stockDialog, open: false })} color="inherit" sx={{ mr: 1 }}>
            Cancelar
          </Button>
          <Button onClick={handleStockConfirm} color={stockDialog.operation === 'add' ? "success" : "error"} variant="contained">
            Confirmar
          </Button>
        </Box>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el producto "{deleteDialog.productName}"?
          </Typography>
        </DialogContent>
        <Box display="flex" justifyContent="end" p={2}>
          <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })} color="inherit" sx={{ mr: 1 }}>
            Cancelar
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
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
    </Box>
  );
}
