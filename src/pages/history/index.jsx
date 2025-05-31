import React, { useState, useEffect, useMemo } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useTheme } from "@mui/material";
import { Token } from "../../theme";
import api from '../../api/axiosClient';
import Header from '../../components/Header';
import { useSearch } from '../../contexts/SearchContext'; // 👈 NUEVO IMPORT
import SearchHighlighter from '../../components/SearchHighlighter'; // 👈 NUEVO IMPORT

const POLL_INTERVAL = 5000; // ms

const History = () => {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 👇 NUEVO: Contexto de búsqueda
  const { searchTerm, isSearching } = useSearch();

  // Manejo seguro de colores con fallbacks
  const safeColors = colors || {
    primary: { 400: '#f5f5f5', 300: '#424242' },
    greenAccent: { 300: '#4caf50', 200: '#4caf50' },
    blueAccent: { 700: '#1976d2' },
    grey: { 100: '#f5f5f5', 100: '#ffffff' }
  };
  

  // 👇 CORREGIR el filteredRows useMemo
const filteredRows = useMemo(() => {
  if (!isSearching || !searchTerm) {
    return rows;
  }
  
  return rows.filter(row => 
    (row.accion && row.accion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (row.quien && row.quien.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (row.objetivo && row.objetivo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (row.descripcion && row.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (row.fecha && row.fecha.toLowerCase().includes(searchTerm.toLowerCase()))
  );
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
      
      // Verificar si es admin (roleId === 1)
      if (user.roleId !== 1) {
        setError("No tienes permisos para ver el historial (solo administradores)");
        setLoading(false);
        return;
      }
      
      setIsAuthenticated(true);
      setIsAdmin(true);
    };
    
    // Verificar inmediatamente
    checkAuth();
    
    // Si no está autenticado, reintentamos después de un momento
    const timeoutId = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

 const fetchLogs = async () => {
    if (!isAuthenticated || !isAdmin) {
      console.log('History: No autenticado o no es admin, saltando fetchLogs');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('History: Obteniendo historial...');
      const response = await api.get('/api/history');
      console.log('History: Respuesta completa:', response);
      console.log('History: Tipo de response.data:', typeof response.data);
      console.log('History: Es array response.data:', Array.isArray(response.data));
      
      // 👇 VERIFICAR QUE LA RESPUESTA SEA UN ARRAY
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
      
      console.log('History: Datos a mapear:', dataArray.length || 0);
      
      const mapped = dataArray.map(log => ({
        id:          log.id,
        fecha:       new Date(log.created_at).toLocaleString(),
        accion:      log.action_type || 'Sin acción',
        quien:       log.performed_by_name || 'Sistema',
        objetivo:    log.target_user_name || '-',
        descripcion: log.description || 'Sin descripción'
      }));
      
      setRows(mapped);
    } catch (err) {
      console.error('Error cargando historial:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
      setError('Error al cargar el historial: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar fetchLogs solo cuando esté autenticado y sea admin
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchLogs();
      const intervalId = setInterval(fetchLogs, POLL_INTERVAL);
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated, isAdmin]);
  // Función helper para obtener el color de la acción
  const getActionColor = (accion) => {
    const actionLower = accion.toLowerCase();
    
    // Colores adaptativos según el tema actual
    const actionColors = theme.palette.mode === 'dark' 
      ? {
          // MODO OSCURO - Colores más claros y vibrantes
          'login': '#64b5f6',
          'logout': '#ffb74d', 
          'usuario creado': '#81c784',
          'usuario actualizado': '#fff176',
          'usuario eliminado': '#e57373',
          'usuario habilitado': '#4fc3f7',
          'usuario deshabilitado': '#f06292',
          'usuario rehabilitado': '#4fc3f7',
          'rol cambiado': '#ce93d8',
          'contraseña cambiada': '#ffd54f',
          'contraseña propia cambiada': '#ffcc02',
          'producto creado': '#81c784',
          'producto actualizado': '#fff176',
          'producto eliminado': '#e57373',
          'stock actualizado': '#ba68c8',
          // 🆕 NUEVOS: Colores para categorías (tonos azules)
          'categoría creada': '#4fc3f7',
          'categoría actualizada': '#29b6f6',
          'categoría eliminada': '#e1f5fe',
          // 🆕 NUEVOS: Colores para ubicaciones (tonos naranjas)
          'ubicación creada': '#ffab40',
          'ubicación actualizada': '#ff9800',
          'ubicación eliminada': '#ff7043',
          'crear': '#81c784',
          'actualizar': '#fff176',
          'eliminar': '#e57373',
          'habilitar': '#4fc3f7',
          'deshabilitar': '#f06292',
          'default': '#90a4ae'
        }
      : {
          // MODO CLARO - Colores más oscuros y contrastantes
          'login': '#1976d2',
          'logout': '#f57c00',
          'usuario creado': '#388e3c',
          'usuario actualizado': '#f57f17',
          'usuario eliminado': '#d32f2f',
          'usuario habilitado': '#0288d1',
          'usuario deshabilitado': '#c2185b',
          'usuario rehabilitado': '#0288d1',
          'rol cambiado': '#8e24aa',
          'contraseña cambiada': '#f9a825',
          'contraseña propia cambiada': '#ff8f00',
          'producto creado': '#388e3c',
          'producto actualizado': '#f57f17',
          'producto eliminado': '#d32f2f',
          'stock actualizado': '#7b1fa2',
          // 🆕 NUEVOS: Colores para categorías (tonos azules)
          'categoría creada': '#0277bd',
          'categoría actualizada': '#0288d1',
          'categoría eliminada': '#0277bd',
          // 🆕 NUEVOS: Colores para ubicaciones (tonos naranjas)
          'ubicación creada': '#ef6c00',
          'ubicación actualizada': '#f57c00',
          'ubicación eliminada': '#e64a19',
          'crear': '#388e3c',
          'actualizar': '#f57f17',
          'eliminar': '#d32f2f',
          'habilitar': '#0288d1',
          'deshabilitar': '#c2185b',
          'default': '#616161'
        };

    // Buscar coincidencias en el texto de la acción
    for (const [key, color] of Object.entries(actionColors)) {
      if (actionLower.includes(key)) {
        return color;
      }
    }
    
    return actionColors.default;
  };

  // Memoizar columnas para evitar re-renders
  const columns = useMemo(() => [
    { 
      field: 'id',
      headerName: 'ID',
      width: 70,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          fontSize: '0.875rem'
        }}>
          {params.value}
        </Box>
      )
    },
    { 
      field: 'fecha', 
      headerName: 'Fecha y Hora', 
      width: 180,
      flex: 0.8,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          fontSize: '0.875rem',
          fontFamily: 'monospace'
        }}>
          {/* 👇 NUEVO: Resaltar fecha */}
          <SearchHighlighter 
            text={params.value} 
            searchTerm={searchTerm}
          />
        </Box>
      )
    },
    { 
      field: 'accion', 
      headerName: 'Acción', 
      width: 160,
      flex: 0.7,      renderCell: (params) => {
        const actionColor = getActionColor(params.value);
        const actionLower = params.value.toLowerCase();
        
        // Iconos para diferentes tipos de acciones
        const getActionIcon = () => {
          if (actionLower.includes('creado') || actionLower.includes('crear')) return '➕';
          if (actionLower.includes('actualizado') || actionLower.includes('actualizar')) return '✏️';
          if (actionLower.includes('eliminado') || actionLower.includes('eliminar')) return '🗑️';
          if (actionLower.includes('deshabilitado')) return '🚫';
          if (actionLower.includes('rehabilitado') || actionLower.includes('habilitado')) return '✅';
          if (actionLower.includes('login')) return '🔐';
          if (actionLower.includes('logout')) return '🚪';
          if (actionLower.includes('contraseña')) return '🔑';
          if (actionLower.includes('rol')) return '👤';
          if (actionLower.includes('categoría')) return '🏷️';
          if (actionLower.includes('ubicación')) return '📍';
          if (actionLower.includes('producto')) return '📦';
          if (actionLower.includes('stock')) return '📊';
          return '📝';
        };

        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            height: '100%'
          }}>
            <Box sx={{
              backgroundColor: theme.palette.mode === 'dark' 
                ? `${actionColor}25` // 25% opacity en modo oscuro
                : `${actionColor}20`, // 20% opacity en modo claro
              color: actionColor,
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '0.875rem',
              fontWeight: '600',
              border: `2px solid ${actionColor}60`,
              minWidth: 'fit-content',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              // Mejorar la sombra y el contraste
              boxShadow: theme.palette.mode === 'light' 
                ? `0 2px 4px ${actionColor}25, 0 1px 2px ${actionColor}15`
                : `0 1px 3px rgba(0,0,0,0.3)`,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: theme.palette.mode === 'light' 
                  ? `0 4px 8px ${actionColor}30, 0 2px 4px ${actionColor}20`
                  : `0 2px 6px rgba(0,0,0,0.4)`
              }
            }}>
              <span style={{ fontSize: '0.75rem' }}>{getActionIcon()}</span>
              <SearchHighlighter 
                text={params.value} 
                searchTerm={searchTerm}
              />
            </Box>
          </Box>
        );
      }
    },
    { 
      field: 'quien', 
      headerName: 'Realizado por', 
      width: 200,
      flex: 1,
      cellClassName: "name-column--cell",
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}>
          {/* 👇 NUEVO: Resaltar quien */}
          <SearchHighlighter 
            text={params.value} 
            searchTerm={searchTerm}
          />
        </Box>
      )
    },
    { 
      field: 'objetivo', 
      headerName: 'Usuario Afectado', 
      width: 200,
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          fontSize: '0.875rem',
          fontStyle: params.value === '-' ? 'italic' : 'normal',
          color: params.value === '-' ? safeColors.grey?.[500] || '#9e9e9e' : 'inherit'
        }}>
          {/* 👇 NUEVO: Resaltar objetivo */}
          <SearchHighlighter 
            text={params.value} 
            searchTerm={searchTerm}
          />
        </Box>
      )
    },
    { 
      field: 'descripcion', 
      headerName: 'Descripción', 
      width: 300,
      flex: 1.5,
      renderCell: (params) => (
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
          textOverflow: 'ellipsis'
        }}>
          {/* 👇 NUEVO: Resaltar descripción */}
          <SearchHighlighter 
            text={params.value} 
            searchTerm={searchTerm}
          />
        </Box>
      )
    },
  ], [safeColors, searchTerm]); // 👈 AGREGAR searchTerm a las dependencias

  // Pantalla de carga inicial
  if (loading && !isAuthenticated) {
    return (
      <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress size={60} />
        <Box ml={2} fontSize="1.2rem">Verificando permisos...</Box>
      </Box>
    );
  }

  // Error de autenticación o permisos
  if (error && !isAuthenticated) {
    return (
      <Box m="20px">
        <Header
          title="Historial de Operaciones"
          subtitle="Registro de actividad del sistema"
        />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header
        title="Historial de Operaciones"
        subtitle={`${rows.length} registros de actividad del sistema`}
      />
      
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
          },          "& .MuiDataGrid-row": {
            minHeight: '60px !important',
            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            transition: 'all 0.2s ease-in-out',
            "&:hover": {
              backgroundColor: theme.palette.mode === 'dark' 
               ? 'rgba(255, 255, 255, 0.08) !important'
               : 'rgba(0, 0, 0, 0.04) !important',
              transform: 'translateX(2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '2px 0 8px rgba(255,255,255,0.1)'
                : '2px 0 8px rgba(0,0,0,0.1)',
            },
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
            display: 'flex',
            alignItems: 'center',
            padding: '12px 8px',
            transition: 'all 0.2s ease-in-out',
          },
          // Responsividad
          [theme.breakpoints.down('md')]: {
            "& .MuiDataGrid-columnHeader": {
              fontSize: '0.8rem',
            },
            "& .MuiDataGrid-cell": {
              fontSize: '0.8rem',
              padding: '4px',
            },
          },
          [theme.breakpoints.down('sm')]: {
            "& .MuiDataGrid-toolbarContainer": {
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 1,
            },
            "& .MuiDataGrid-cell[data-field='id']": {
              display: 'none',
            },
            "& .MuiDataGrid-columnHeader[data-field='id']": {
              display: 'none',
            },
          },
        }}
      >
        <DataGrid
          rows={filteredRows} // 👈 CAMBIAR DE rows A filteredRows
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          loading={loading}
          rowHeight={60}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 }
            },
            columns: {
              columnVisibilityModel: {
                id: window.innerWidth > 768,
              },
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          disableColumnMenu={window.innerWidth < 768}
          hideFooterSelectedRowCount
          sx={{
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
            '& .MuiDataGrid-renderingZone': {
              maxHeight: 'none !important',
            },
            '& .MuiDataGrid-cell .MuiDataGrid-cellContent': {
              display: 'flex',
              alignItems: 'center',
              height: '100%',
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default History;