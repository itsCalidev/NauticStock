
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  useTheme,
  IconButton,
  Tooltip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import Header from "../../components/Header";
import { Token } from "../../theme";
import api from '../../api/axiosClient';
import { useSearch } from '../../contexts/SearchContext';
import SearchHighlighter from '../../components/SearchHighlighter';
import AppSnackbar from "../../components/AppSnackbar";
import { Formik } from "formik";
import * as yup from "yup";

const POLL_INTERVAL = 5000; // cada 5 segundos

const productSchema = yup.object().shape({
  part_number: yup.string().required("Requerido"),
  description: yup.string().required("Requerido"),
  price: yup.number().required("Requerido").positive("Debe ser positivo"),
  quantity: yup.number().required("Requerido").min(0, "No puede ser negativo"), // Renamed from stock
  min_stock: yup.number().required("Requerido").min(0, "No puede ser negativo"),
  max_stock: yup.number().required("Requerido").moreThan(yup.ref('min_stock'), "Debe ser mayor al stock mínimo"),
  categoryId: yup.number().required("Requerido"),
  brandId: yup.number().required("Requerido"),
  providerId: yup.number().required("Requerido"),
  locationId: yup.number().required("Requerido"),
});

export default function Products() {
  const theme = useTheme();
  const colors = useMemo(() => Token(theme.palette.mode), [theme.palette.mode]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showInactive, setShowInactive] = useState(true);

  // Estados para dropdowns
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [providers, setProviders] = useState([]);
  const [locations, setLocations] = useState([]);

  // Estados para diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stockDialog, setStockDialog] = useState({
    open: false,
    productId: null,
    productName: '',
    currentStock: 0,
    operation: 'add',
    amount: 1
  });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    productId: null,
    productName: ''
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Contexto de búsqueda
  const { searchTerm, isSearching } = useSearch();

  // Cargar datos auxiliares (dropdowns)
  useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [catsRes, brandsRes, provsRes, locsRes] = await Promise.all([
          api.get("/api/categories"),
          api.get("/api/brands"),
          api.get("/api/providers"),
          api.get("/api/locations")
        ]);

        setCategories(Array.isArray(catsRes.data) ? catsRes.data : catsRes.data?.data || []);
        setBrands(Array.isArray(brandsRes.data) ? brandsRes.data : brandsRes.data?.data || []);
        setProviders(Array.isArray(provsRes.data) ? provsRes.data : provsRes.data?.data || []);
        setLocations(Array.isArray(locsRes.data) ? locsRes.data : locsRes.data?.data || []);

      } catch (err) {
        console.error("Error cargando datos auxiliares:", err);
      }
    };
    fetchAuxData();
  }, []);

  // FilteredProducts useMemo
  const filteredProducts = useMemo(() => {
    let filtered = showInactive ? products : products.filter(product => product.status === 0);

    if (isSearching && searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        (product.name && product.name.toLowerCase().includes(lowerTerm)) ||
        (product.description && product.description.toLowerCase().includes(lowerTerm)) ||
        (product.category && product.category.toLowerCase().includes(lowerTerm)) ||
        (product.type && product.type.toLowerCase().includes(lowerTerm)) ||
        (product.provider && product.provider.toLowerCase().includes(lowerTerm)) ||
        (product.location && product.location.toLowerCase().includes(lowerTerm))
      );
    }

    return filtered;
  }, [products, showInactive, isSearching, searchTerm]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setIsAdmin(user.roleId === 1);
  }, []);

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
        original: product
      }));

      setProducts(transformedData);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
      console.error('Error al cargar productos: ' + errorMessage);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Carga inicial y polling
  useEffect(() => {
    loadProducts();
    const intervalId = setInterval(() => loadProducts({ silent: true }), POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [loadProducts]);

  // Escuchar eventos de otras ventanas/pestañas
  useEffect(() => {
    const handleReload = () => loadProducts({ silent: true });

    window.addEventListener("productCreated", handleReload);
    window.addEventListener("productUpdated", handleReload);
    window.addEventListener("productDeleted", handleReload);
    window.addEventListener("productStatusChanged", handleReload);
    window.addEventListener("stockChanged", handleReload);

    const handleStorageChange = (e) => {
      if (e.key === 'productChanged') handleReload();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("productCreated", handleReload);
      window.removeEventListener("productUpdated", handleReload);
      window.removeEventListener("productDeleted", handleReload);
      window.removeEventListener("productStatusChanged", handleReload);
      window.removeEventListener("stockChanged", handleReload);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadProducts]);

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
      loadProducts();
      window.dispatchEvent(new Event(editingProduct ? "productUpdated" : "productCreated"));

    } catch (err) {
      console.error('Error guardando producto:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || "Error al guardar producto";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockChange = useCallback((productId, productName, currentStock, operation) => {
    setStockDialog({
      open: true,
      productId,
      productName,
      currentStock,
      operation,
      amount: 1
    });
  }, []);

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
      loadProducts();
      window.dispatchEvent(new Event("stockChanged"));
    } catch (err) {
      console.error('Error actualizando stock:', err);
      setSnackbar({ open: true, message: "Error al actualizar stock", severity: "error" });
    }
  }, [stockDialog, loadProducts]);

  const handleToggleStatus = useCallback(async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 0 ? 1 : 0;
      await api.put(`/api/products/${id}`, { status: newStatus });
      setSnackbar({ open: true, message: `Producto ${newStatus === 0 ? 'habilitado' : 'deshabilitado'}`, severity: "success" });
      loadProducts();
      window.dispatchEvent(new Event("productStatusChanged"));
    } catch (err) {
      console.error('Error cambiando estado:', err);
      setSnackbar({ open: true, message: "Error al cambiar estado", severity: "error" });
    }
  }, [loadProducts]);

  const handleDelete = async () => {
    try {
      await api.delete(`/api/products/${deleteDialog.productId}`);
      setSnackbar({ open: true, message: "Producto eliminado exitosamente", severity: "success" });
      setDeleteDialog({ open: false, productId: null, productName: '' });
      loadProducts();
      window.dispatchEvent(new Event("productDeleted"));
    } catch (err) {
      console.error('Error eliminando producto:', err);
      setSnackbar({ open: true, message: "Error al eliminar producto", severity: "error" });
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

        {isAdmin && (
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

      <TableContainer component={Paper} sx={{ backgroundColor: colors.primary[400] }}>
        <Table>
          <TableHead sx={{ backgroundColor: colors.blueAccent[700] }}>
            <TableRow>
              <TableCell><Typography fontWeight="bold">Código / Nombre</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Descripción</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Categoría</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Marca</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Proveedor</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight="bold">Stock</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight="bold">Precio</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Ubicación</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight="bold">Acciones</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((row) => {
              const isActive = row.status === 0;
              return (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <SearchHighlighter text={row.name} searchTerm={searchTerm} />
                  </TableCell>
                  <TableCell>
                    <SearchHighlighter text={row.description} searchTerm={searchTerm} />
                  </TableCell>
                  <TableCell>
                    <SearchHighlighter text={row.category} searchTerm={searchTerm} />
                  </TableCell>
                  <TableCell>
                    <SearchHighlighter text={row.type} searchTerm={searchTerm} />
                  </TableCell>
                  <TableCell>
                    <SearchHighlighter text={row.provider} searchTerm={searchTerm} />
                  </TableCell>
                  <TableCell align="center">
                    <span style={getStockStyle(row.stock, row.min_stock)}>{row.stock}</span>
                  </TableCell>
                  <TableCell align="center">
                    <Typography color={colors.greenAccent[500]}>
                      ${row.price}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <SearchHighlighter text={row.location} searchTerm={searchTerm} />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" gap={1}>
                      <Tooltip title="Editar">
                        <span>
                          <IconButton size="small" color="warning" onClick={() => handleOpenDialog(row.original)} disabled={!isAdmin || !isActive}>
                            <EditIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Agregar Stock">
                        <span>
                          <IconButton size="small" color="success" onClick={() => handleStockChange(row.id, row.name, row.stock, 'add')} disabled={!isActive}>
                            <AddCircleIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Restar Stock">
                        <span>
                          <IconButton size="small" color="info" onClick={() => handleStockChange(row.id, row.name, row.stock, 'remove')} disabled={!isActive}>
                            <RemoveCircleIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={isActive ? "Deshabilitar" : "Habilitar"}>
                        <span>
                          <IconButton size="small" color={isActive ? "error" : "success"} onClick={() => handleToggleStatus(row.id, row.status)} disabled={!isAdmin}>
                            {isActive ? <BlockIcon /> : <CheckCircleIcon />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      {isAdmin && isActive && (
                        <Tooltip title="Eliminar">
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, productId: row.id, productName: row.name })}>
                            <DeleteIcon />
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
              part_number: editingProduct?.part_number || "", // Fixed: use part_number
              description: editingProduct?.description || "",
              price: editingProduct?.price || 0,
              quantity: editingProduct?.quantity || 0, // Fixed: use quantity and renamed
              min_stock: editingProduct?.min_stock || 0,
              max_stock: editingProduct?.max_stock || 0,
              categoryId: editingProduct?.category_id || "", // Fixed: remove .original
              brandId: editingProduct?.brand_id || "", // Fixed: remove .original
              providerId: editingProduct?.provider_id || "", // Fixed: remove .original
              locationId: editingProduct?.location_id || "", // Fixed: remove .original
            }}
            validationSchema={productSchema}
            onSubmit={handleFormSubmit}
          >
            {({ values, errors, touched, handleBlur, handleChange, handleSubmit }) => (
              <form onSubmit={handleSubmit} id="product-form">
                <Box display="grid" gap="30px" gridTemplateColumns="repeat(4, minmax(0, 1fr))" sx={{ "& > div": { gridColumn: "span 4" } }}>
                  <TextField
                    fullWidth
                    variant="filled"
                    type="text"
                    label="Número de Parte / Código"
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
                    sx={{ gridColumn: "span 2" }}
                  />
                  <TextField
                    fullWidth
                    variant="filled"
                    type="number"
                    label="Stock Inicial"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.quantity} // Renamed from stock
                    name="quantity" // Renamed from stock
                    error={!!touched.quantity && !!errors.quantity} // Renamed from stock
                    helperText={touched.quantity && errors.quantity} // Renamed from stock
                    sx={{ gridColumn: "span 2" }}
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
                    sx={{ gridColumn: "span 2" }}
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
                    sx={{ gridColumn: "span 2" }}
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
                      {providers.map((prov) => (
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
              </form>
            )}
          </Formik>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">Cancelar</Button>
          <Button type="submit" form="product-form" color="secondary" variant="contained">
            {editingProduct ? "Guardar Cambios" : "Crear Producto"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Stock */}
      <Dialog open={stockDialog.open} onClose={() => setStockDialog(prev => ({ ...prev, open: false }))}>
        <DialogTitle>{stockDialog.operation === 'add' ? 'Agregar Stock' : 'Restar Stock'}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Producto: <strong>{stockDialog.productName}</strong>
          </Typography>
          <Typography variant="body2" gutterBottom>
            Stock Actual: {stockDialog.currentStock}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Cantidad"
            type="number"
            fullWidth
            variant="outlined"
            value={stockDialog.amount}
            onChange={(e) => setStockDialog(prev => ({ ...prev, amount: Number(e.target.value) }))}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockDialog(prev => ({ ...prev, open: false }))}>Cancelar</Button>
          <Button onClick={handleStockConfirm} color="primary" variant="contained">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, productId: null, productName: '' })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el producto <strong>{deleteDialog.productName}</strong>?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, productId: null, productName: '' })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
}