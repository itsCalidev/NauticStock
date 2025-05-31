import React, { useState, useEffect, useMemo } from "react";
import { 
  Button, 
  Box, 
  Alert, 
  CircularProgress, 
  IconButton, 
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Token } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from '../../api/axiosClient';
// 👇 NUEVOS IMPORTS PARA BÚSQUEDA
import { useSearch } from '../../contexts/SearchContext';
import SearchHighlighter from '../../components/SearchHighlighter';

const Products = () => {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  const navigate = useNavigate();

  const safeColors = colors || {
    primary: { 400: '#f5f5f5', 300: '#424242' },
    greenAccent: { 300: '#4caf50', 200: '#4caf50' },
    blueAccent: { 700: '#1976d2' },
    grey: { 100: '#f5f5f5', 100: '#ffffff' }
  };
  
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  const [isAdmin, setIsAdmin] = useState(false);
  const [showInactive, setShowInactive] = useState(true);

  // 👇 NUEVO: Contexto de búsqueda
  const { searchTerm, isSearching } = useSearch();

  // 👇 CORREGIR el filteredProducts useMemo
const filteredProducts = useMemo(() => {
  let filtered = showInactive ? products : products.filter(product => product.status === 0);
  
  // 👇 NUEVO: Aplicar filtro de búsqueda CON VALIDACIONES SEGURAS
  if (isSearching && searchTerm) {
    filtered = filtered.filter(product => 
      (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.type && product.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.provider && product.provider.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.location && product.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
  
  return filtered;
}, [products, showInactive, isSearching, searchTerm]);
  
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setIsAdmin(user.roleId === 1);
  }, []);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const handleProductCreated = () => {
      loadProducts();
    };

    window.addEventListener("productCreated", handleProductCreated);
    return () => {
      window.removeEventListener("productCreated", handleProductCreated);
    };
  }, []);

    const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Frontend: Cargando productos...');
      const response = await api.get('/api/products');
      console.log('Frontend: Respuesta recibida:', response.data);
      
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
        status: product.status || 0
      }));
      
      console.log('Frontend: Datos transformados:', transformedData.length, 'productos');
      setProducts(transformedData);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
      setError('Error al cargar productos: ' + errorMessage);
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  // 👇 NUEVO: Agregar polling automático para sincronizar entre sesiones
  useEffect(() => {
    loadProducts(); // Carga inicial    
  }, []);

  // 👇 NUEVO: Escuchar eventos de otras ventanas/pestañas
  useEffect(() => {
    const handleProductCreated = () => {
      console.log('📢 Evento recibido: productCreated');
      loadProducts();
    };

    const handleProductUpdated = () => {
      console.log('📢 Evento recibido: productUpdated');
      loadProducts();
    };

    const handleProductDeleted = () => {
      console.log('📢 Evento recibido: productDeleted');
      loadProducts();
    };

    const handleProductStatusChanged = () => {
      console.log('📢 Evento recibido: productStatusChanged');
      loadProducts();
    };

    const handleStockChanged = () => {
      console.log('📢 Evento recibido: stockChanged');
      loadProducts();
    };

    // 👇 Eventos de ventana (para otras pestañas del mismo navegador)
    window.addEventListener("productCreated", handleProductCreated);
    window.addEventListener("productUpdated", handleProductUpdated);
    window.addEventListener("productDeleted", handleProductDeleted);
    window.addEventListener("productStatusChanged", handleProductStatusChanged);
    window.addEventListener("stockChanged", handleStockChanged);

    // 👇 Eventos de storage (para otros navegadores/dispositivos)
    const handleStorageChange = (e) => {
      if (e.key === 'productChanged' && e.newValue !== e.oldValue) {
        console.log('📢 Storage event: productChanged');
        loadProducts();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("productCreated", handleProductCreated);
      window.removeEventListener("productUpdated", handleProductUpdated);
      window.removeEventListener("productDeleted", handleProductDeleted);
      window.removeEventListener("productStatusChanged", handleProductStatusChanged);
      window.removeEventListener("stockChanged", handleStockChanged);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleEdit = (productId) => {
    navigate(`/products/${productId}/edit`);
  };

  const handleStockChange = (productId, productName, currentStock, operation) => {
    setStockDialog({
      open: true,
      productId,
      productName,
      currentStock,
      operation,
      amount: 1
    });
  };

  const handleStockConfirm = async () => {
    try {
      const { productId, operation, amount, currentStock } = stockDialog;
      
      let newStock;
      if (operation === 'add') {
        newStock = currentStock + parseInt(amount);
      } else {
        newStock = Math.max(0, currentStock - parseInt(amount));
      }

      await api.put(`/api/products/${productId}`, {
        quantity: newStock
      });

      setStockDialog({ open: false, productId: null, productName: '', currentStock: 0, operation: 'add', amount: 1 });
      loadProducts();
      
      // 👇 NUEVO: Disparar eventos para sincronización
      window.dispatchEvent(new Event("stockChanged"));
      localStorage.setItem('productChanged', Date.now().toString());
      
    } catch (err) {
      console.error('Error al actualizar stock:', err);
      setError('Error al actualizar stock: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      const newStatus = currentStatus === 0 ? 1 : 0;
      const action = newStatus === 0 ? 'rehabilitó' : 'deshabilitó';
      
      console.log(`${action} producto ${productId}: ${currentStatus} → ${newStatus}`);
      
      await api.put(`/api/products/${productId}`, {
        status: newStatus
      });
      
      setError(null);
      loadProducts();
      
      // 👇 NUEVO: Disparar eventos para sincronización
      window.dispatchEvent(new Event("productStatusChanged"));
      localStorage.setItem('productChanged', Date.now().toString());
      
      console.log(`Producto ${action} exitosamente`);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      setError(`Error al ${currentStatus === 0 ? 'deshabilitar' : 'rehabilitar'} producto: ` + (err.response?.data?.error || err.message));
    }
  };

const handleDeleteConfirm = async () => {
  try {
    const { productId } = deleteDialog;
    console.log('🗑️ Eliminando producto:', productId);
    
    await api.delete(`/api/products/${productId}`);
    
    console.log('✅ Producto eliminado exitosamente');
    setDeleteDialog({ open: false, productId: null, productName: '' });
    
    // Recargar productos
    loadProducts();
    
    // 👇 MEJORADO: Disparar múltiples eventos para sincronización
    window.dispatchEvent(new Event("productDeleted"));
    localStorage.setItem('productChanged', Date.now().toString());
    
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    setError('Error al eliminar producto: ' + (err.response?.data?.error || err.message));
  }
};

  const getStockStyle = (stockValue, minStock) => {
    const safeColors = colors || {};
    
    let color = safeColors.greenAccent?.[500] || '#4caf50';
    let backgroundColor = 'transparent';
    
    if (stockValue <= 0) {
      color = safeColors.redAccent?.[500] || '#f44336';
      backgroundColor = safeColors.redAccent?.[900] || '#b71c1c';
    } else if (stockValue <= minStock) {
      color = safeColors.orangeAccent?.[500] || '#ff9800';
      backgroundColor = safeColors.orangeAccent?.[900] || '#e65100';
    }
    
    return { color, backgroundColor };
  };

  // 👇 MODIFICADO: Columnas con SearchHighlighter
  const columns = useMemo(() => [
    { 
      field: "id", 
      headerName: "ID", 
      width: 70,
      minWidth: 50,
      headerAlign: 'center',
      align: 'center',
    },
    { 
      field: "name", 
      headerName: "Código/Parte", 
      width: 150,
      minWidth: 120,
      flex: 0.8,
      cellClassName: "name-column--cell",
      renderCell: (params) => {
        const isActive = params.row.status === 0;
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            fontWeight: 'bold',
            opacity: isActive ? 1 : 0.5,
            textDecoration: isActive ? 'none' : 'line-through'
          }}>
            {/* 👇 NUEVO: Usar SearchHighlighter */}
            <SearchHighlighter 
              text={params.value} 
              searchTerm={searchTerm}
            />
            {!isActive && (
              <Box 
                component="span" 
                sx={{ 
                  ml: 1, 
                  px: 1, 
                  py: 0.2, 
                  bgcolor: 'error.main', 
                  color: 'white', 
                  borderRadius: 1, 
                  fontSize: '0.7rem' 
                }}
              >
                INACTIVO
              </Box>
            )}
          </Box>
        );
      }
    },
    { 
      field: "description", 
      headerName: "Descripción", 
      width: 300,
      minWidth: 200,
      flex: 1.5,
      renderCell: (params) => {
        const isActive = params.row.status === 0;
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            padding: '8px 4px',
            whiteSpace: 'normal', 
            wordWrap: 'break-word',
            lineHeight: 1.3,
            fontSize: '0.875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: isActive ? 1 : 0.5
          }}>
            {/* 👇 NUEVO: Usar SearchHighlighter */}
            <SearchHighlighter 
              text={params.value} 
              searchTerm={searchTerm}
            />
          </Box>
        );
      }
    },
    { 
      field: "category", 
      headerName: "Categoría", 
      width: 120,
      minWidth: 100,
      flex: 0.6,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const isActive = params.row.status === 0;
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            fontSize: '0.875rem',
            opacity: isActive ? 1 : 0.5
          }}>
            {/* 👇 NUEVO: Usar SearchHighlighter */}
            <SearchHighlighter 
              text={params.value} 
              searchTerm={searchTerm}
            />
          </Box>
        );
      }
    },
    { 
      field: "type", 
      headerName: "Marca", 
      width: 120,
      minWidth: 100,
      flex: 0.6,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const isActive = params.row.status === 0;
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            fontSize: '0.875rem',
            opacity: isActive ? 1 : 0.5
          }}>
            {/* 👇 NUEVO: Usar SearchHighlighter */}
            <SearchHighlighter 
              text={params.value} 
              searchTerm={searchTerm}
            />
          </Box>
        );
      }
    },
    { 
      field: "provider", 
      headerName: "Proveedor", 
      width: 150,
      minWidth: 120,
      flex: 0.8,
      renderCell: (params) => {
        const isActive = params.row.status === 0;
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            fontSize: '0.875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: isActive ? 1 : 0.5
          }}>
            {/* 👇 NUEVO: Usar SearchHighlighter */}
            <SearchHighlighter 
              text={params.value} 
              searchTerm={searchTerm}
            />
          </Box>
        );
      }
    },
    { 
      field: "stock", 
      headerName: "Stock", 
      type: "number", 
      width: 90,
      minWidth: 80,
      flex: 0.4,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const stockValue = params.value || 0;
        const minStock = params.row?.min_stock || 0;
        const isActive = params.row.status === 0;
        const { color, backgroundColor } = getStockStyle(stockValue, minStock);
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            opacity: isActive ? 1 : 0.5
          }}>
            <Box sx={{ 
              color: color, 
              fontWeight: 'bold',
              backgroundColor: backgroundColor,
              padding: '4px 8px',
              borderRadius: '4px',
              textAlign: 'center',
              minWidth: '40px'
            }}>
              {stockValue}
            </Box>
          </Box>
        );
      }
    },
    { 
      field: "price", 
      headerName: "Precio", 
      type: "number", 
      width: 110,
      minWidth: 100,
      flex: 0.5,
      headerAlign: 'center',
      align: 'right',
      renderCell: (params) => {
        const price = params.value || 0;
        const isActive = params.row.status === 0;
        const safeColors = colors || {};
        const priceColor = safeColors.greenAccent?.[400] || '#4caf50';
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            height: '100%',
            fontWeight: 'bold', 
            color: priceColor,
            fontSize: '0.875rem',
            opacity: isActive ? 1 : 0.5
          }}>
            ${price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </Box>
        );
      }
    },
    { 
      field: "location", 
      headerName: "Ubicación", 
      width: 150,
      minWidth: 120,
      flex: 0.8,
      renderCell: (params) => {
        const isActive = params.row.status === 0;
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            fontSize: '0.875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: isActive ? 1 : 0.5
          }}>
            {/* 👇 NUEVO: Usar SearchHighlighter */}
            <SearchHighlighter 
              text={params.value} 
              searchTerm={searchTerm}
            />
          </Box>
        );
      }
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 350,
      minWidth: 300,
      sortable: false,
      renderCell: (params) => {
        const { row } = params;
        const isActive = row.status === 0;
        
        return (
          <Box display="flex" alignItems="center" gap={0.5} height="100%" flexWrap="wrap">
            <Tooltip title={isActive ? "Editar producto" : "No se puede editar un producto inactivo"}>
              <span>
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => handleEdit(row.id)}
                  disabled={!isAdmin || !isActive}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={isActive ? "Agregar stock" : "No se puede modificar stock de producto inactivo"}>
              <span>
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleStockChange(row.id, row.name, row.stock, 'add')}
                  disabled={!isActive}
                >
                  <AddCircleIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={isActive ? "Restar stock" : "No se puede modificar stock de producto inactivo"}>
              <span>
                <IconButton
                  size="small"
                  color="info"
                  onClick={() => handleStockChange(row.id, row.name, row.stock, 'remove')}
                  disabled={!isActive}
                >
                  <RemoveCircleIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={isActive ? "Deshabilitar producto" : "Rehabilitar producto"}>
              <span>
                <IconButton
                  size="small"
                  color={isActive ? "error" : "success"}
                  onClick={() => handleToggleStatus(row.id, row.status)}
                  disabled={!isAdmin}
                >
                  {isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>

            {isAdmin && isActive && (
              <Tooltip title="Eliminar producto">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setDeleteDialog({ 
                    open: true, 
                    productId: row.id, 
                    productName: row.name 
                  })}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      }
    }
  ], [colors, isAdmin, searchTerm]); // 👈 AGREGAR searchTerm

  if (loading) {
    return (
      <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress size={60} />
        <Box ml={2} fontSize="1.2rem">Cargando productos...</Box>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header
        title="Inventario de Productos"
        subtitle={`${products.length} productos en almacén`}
      />
      
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
              ? `${products.length} productos (${products.filter(p => p.status === 0).length} activos, ${products.filter(p => p.status === 1).length} inactivos)`
              : `${filteredProducts.length} productos activos`
            }
          </Typography>
        </Box>
        
        {isAdmin && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => navigate("/createProduct")}
            sx={{ px: 3, py: 1.5, fontWeight: 'bold' }}
          >
            Crear Producto
          </Button>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        m="40px 0 0 0"
        height={{ xs: "70vh", sm: "75vh", md: "80vh" }}
        width="100%"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
          },
          "& .name-column--cell": {
            color: safeColors.greenAccent?.[300] || '#4caf50',
            fontWeight: 'bold'
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: safeColors.blueAccent?.[700] || '#1976d2',
            borderBottom: "none",
            fontSize: '0.95rem',
            fontWeight: 'bold'
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: safeColors.primary?.[400] || '#f5f5f5',
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: safeColors.blueAccent?.[700] || '#1976d2',
          },
          "& .MuiCheckbox-root": {
            color: `${safeColors.greenAccent?.[200] || '#4caf50'} !important`,
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${safeColors.grey?.[100] || '#ffffff'} !important`,
          },
      "& .MuiDataGrid-row": {
        minHeight: '60px !important',
        "&:hover": {
         backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.08) !important'  // Hover claro para modo oscuro
          : 'rgba(0, 0, 0, 0.04) !important',       // Hover oscuro para modo claro
        },
      },
        }}
      >
        <DataGrid
          rows={filteredProducts}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          loading={loading}
          rowHeight={60}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 }
            }
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          hideFooterSelectedRowCount
        />
      </Box>

      <Dialog open={stockDialog.open} onClose={() => setStockDialog({ ...stockDialog, open: false })}>
        <DialogTitle>
          {stockDialog.operation === 'add' ? 'Agregar Stock' : 'Restar Stock'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Producto: <strong>{stockDialog.productName}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Stock actual: <strong>{stockDialog.currentStock}</strong>
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label={`Cantidad a ${stockDialog.operation === 'add' ? 'agregar' : 'restar'}`}
            type="number"
            fullWidth
            variant="outlined"
            value={stockDialog.amount}
            onChange={(e) => setStockDialog({ ...stockDialog, amount: Math.max(1, parseInt(e.target.value) || 1) })}
            inputProps={{ min: 1 }}
          />
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Nuevo stock: <strong>
              {stockDialog.operation === 'add' 
                ? stockDialog.currentStock + parseInt(stockDialog.amount)
                : Math.max(0, stockDialog.currentStock - parseInt(stockDialog.amount))
              }
            </strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockDialog({ ...stockDialog, open: false })}>
            Cancelar
          </Button>
          <Button onClick={handleStockConfirm} variant="contained">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el producto "{deleteDialog.productName}"?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            autoFocus
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;