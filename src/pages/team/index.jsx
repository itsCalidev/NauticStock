import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../api/axiosClient";
import { 
  Box, 
  Button, 
  Chip, 
  Typography, 
  useTheme, 
  CircularProgress, 
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Header from "../../components/Header";
import { Token } from "../../theme";
import { useNavigate } from "react-router-dom";
import { useSearch } from '../../contexts/SearchContext';
import SearchHighlighter from '../../components/SearchHighlighter';

const POLL_INTERVAL = 5000; // cada 5 segundos

export default function Team() {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Estado para diálogo de eliminación
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    userId: null,
    userName: ''
  });

  // Estado para filtros
  const [showInactive, setShowInactive] = useState(true);

  // Contexto de búsqueda
  const { searchTerm, isSearching } = useSearch();

  // 👇 FILTRO ULTRA SEGURO CON VALIDACIONES REFORZADAS
  const filteredUsers = useMemo(() => {
    let filtered = showInactive ? rows : rows.filter(user => user.status === 0);
    
    // Aplicar filtro de búsqueda con validaciones ultra seguras
    if (isSearching && searchTerm && searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      
      filtered = filtered.filter(user => {
        // Función helper para verificar si un campo contiene el término
        const contains = (field) => {
          return field && 
                 typeof field === 'string' && 
                 field.toLowerCase().includes(searchLower);
        };
        
        return contains(user.name) ||
               contains(user.email) ||
               contains(user.matricula) ||
               contains(user.grado) ||
               contains(user.access);
      });
    }
    
    return filtered;
  }, [rows, showInactive, isSearching, searchTerm]);

  // Manejo seguro de colores con fallbacks
  const safeColors = colors || {
    primary: { 400: '#f5f5f5', 300: '#424242' },
    greenAccent: { 300: '#4caf50', 200: '#4caf50' },
    blueAccent: { 700: '#1976d2' },
    grey: { 100: '#f5f5f5', 100: '#ffffff' }
  };


  // Verificar autenticación y permisos al montar
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      console.log('Team: Verificando auth...', { token: !!token, user });
      
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
        setError("No tienes permisos para ver el equipo (solo administradores)");
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

  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) {
      console.log('Team: No autenticado o no es admin, saltando fetchUsers');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Team: Obteniendo usuarios...');
      const { data } = await api.get("/api/users");
      console.log('Team: Usuarios recibidos:', data?.length || 0);
      
      const me = JSON.parse(localStorage.getItem("user") || "{}");
      
      // 👇 MAPEO ULTRA SEGURO CON CONVERSIÓN A STRING
      const mappedUsers = data
        .filter(u => u.id !== me.id)
        .map(u => ({
          id: u.id,
          name: String(u.name || ''),           // Convertir a string seguro
          email: String(u.email || ''),         // Convertir a string seguro
          matricula: String(u.account || ''),   // Convertir a string seguro
          grado: String(u.ranks || ''),         // Convertir a string seguro
          access: String(u.access || ''),       // Convertir a string seguro
          status: u.status,
          lastAccess: u.last_access ?? null,
        }));
      
      console.log('Team: Usuarios mapeados:', mappedUsers.length);
      setRows(mappedUsers);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
      setError('Error al cargar el equipo: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin]);

  // Ejecutar fetchUsers solo cuando esté autenticado y sea admin
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers();
      const intervalId = setInterval(fetchUsers, POLL_INTERVAL);
      return () => clearInterval(intervalId);
    }
  }, [fetchUsers, isAuthenticated, isAdmin]);

   const handleToggleStatus = async (id, current) => {
    if (!isAdmin) {
      setError("No tienes permisos para modificar usuarios");
      return;
    }
    
    try {
      const newStatus = current === 0 ? 1 : 0;
      console.log(`${newStatus === 0 ? 'Rehabilitando' : 'Deshabilitando'} usuario ${id}`);
      
      await api.put(`/api/users/${id}`, { status: newStatus });
      
      // 👇 NUEVO: Disparar eventos para sincronización
      window.dispatchEvent(new Event("userStatusChanged"));
      window.dispatchEvent(new Event("userUpdated"));
      localStorage.setItem('userChanged', Date.now().toString());
      
      fetchUsers();
      
      console.log(`Usuario ${newStatus === 0 ? 'rehabilitado' : 'deshabilitado'} exitosamente`);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
      setError('Error al cambiar estado: ' + errorMessage);
    }
  };

  const handleEdit = (id) => {
    if (!isAdmin) {
      setError("No tienes permisos para editar usuarios");
      return;
    }
    navigate(`/users/${id}/edit`);
  };

    const handleDeleteConfirm = async () => {
    try {
      const { userId, userName } = deleteDialog;
      console.log('🗑️ Eliminando usuario:', userId);
      
      await api.delete(`/api/users/${userId}`);
      
      console.log('✅ Usuario eliminado exitosamente');
      
      // 👇 NUEVO: Disparar eventos para sincronización
      window.dispatchEvent(new Event("userDeleted"));
      localStorage.setItem('userChanged', Date.now().toString());
      
      setDeleteDialog({ open: false, userId: null, userName: '' });
      fetchUsers(); // Recargar lista
      
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      setError('Error al eliminar usuario: ' + (err.response?.data?.error || err.message));
    }
  };

  // Memoizar columnas para evitar re-renders
  const columns = useMemo(() => [
    { 
      field: "name", 
      headerName: "Nombre", 
      flex: 1, 
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
      field: "email", 
      headerName: "Email", 
      flex: 1,
      renderCell: (params) => {
        const isActive = params.row.status === 0;
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            fontSize: '0.875rem',
            opacity: isActive ? 1 : 0.5
          }}>
            <SearchHighlighter 
              text={params.value} 
              searchTerm={searchTerm}
            />
          </Box>
        );
      }
    },
    { 
      field: "matricula", 
      headerName: "Matrícula", 
      flex: 1,
      renderCell: (params) => {
        const isActive = params.row.status === 0;
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            fontSize: '0.875rem',
            opacity: isActive ? 1 : 0.5
          }}>
            <SearchHighlighter 
              text={params.value} 
              searchTerm={searchTerm}
            />
          </Box>
        );
      }
    },
    { 
      field: "grado", 
      headerName: "Grado", 
      flex: 1,
      renderCell: (params) => {
        const isActive = params.row.status === 0;
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            fontSize: '0.875rem',
            opacity: isActive ? 1 : 0.5
          }}>
            <SearchHighlighter 
              text={params.value} 
              searchTerm={searchTerm}
            />
          </Box>
        );
      }
    },
    {
      field: "access",
      headerName: "Nivel de Acceso",
      flex: 1,
      renderCell: ({ row }) => {
        const isActive = row.status === 0;
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            opacity: isActive ? 1 : 0.5
          }}>
            <Typography
              sx={{
                px: 1, py: 0.5, borderRadius: 1,
                bgcolor:
                  row.access === "Administrador"
                    ? safeColors.greenAccent?.[600] || '#4caf50'
                    : safeColors.greenAccent?.[700] || '#388e3c',
                color: safeColors.grey?.[100] || '#ffffff',
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: '0.875rem'
              }}
            >
              {row.access === "Administrador" && "👑"}
              {row.access === "Capturista"     && "🔓"}
              {row.access === "Consultor"       && "🔒"}
              <SearchHighlighter 
                text={row.access} 
                searchTerm={searchTerm}
              />
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "status",
      headerName: "Estado",
      flex: 0.5,
      renderCell: ({ row }) => (
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          <Chip
            label={row.status === 0 ? "Activo" : "Inactivo"}
            color={row.status === 0 ? "success" : "default"}
            size="small"
          />
        </Box>
      ),
    },
    {
      field: "lastAccess",
      headerName: "Último Acceso",
      flex: 1,
      renderCell: ({ row }) => {
        const isActive = row.status === 0;
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            fontSize: '0.875rem',
            opacity: isActive ? 1 : 0.5
          }}>
            {row.lastAccess ? new Date(row.lastAccess).toLocaleString() : "—"}
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 200,
      minWidth: 180,
      sortable: false,
      renderCell: ({ row }) => {
        const isActive = row.status === 0;
        
        return (
          <Box display="flex" alignItems="center" gap={0.5} height="100%" flexWrap="wrap">
            {/* Editar - Solo para usuarios activos */}
            <Tooltip title={isActive ? "Editar usuario" : "No se puede editar un usuario inactivo"}>
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

            {/* Habilitar/Deshabilitar - SIEMPRE DISPONIBLE PARA ADMINS */}
            <Tooltip title={isActive ? "Deshabilitar usuario" : "Rehabilitar usuario"}>
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

            {/* Eliminar - Solo para usuarios activos y admins */}
            {isAdmin && isActive && (
              <Tooltip title="Eliminar usuario">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setDeleteDialog({ 
                    open: true, 
                    userId: row.id, 
                    userName: row.name 
                  })}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ], [safeColors, navigate, isAdmin, handleEdit, searchTerm]);

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
          title="EQUIPO"
          subtitle="Gestión de miembros del equipo"
        />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header title="EQUIPO" subtitle={`${rows.length} miembros del equipo`} />
      
      {/* CONTROLES Y FILTROS */}
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
              ? `${rows.length} usuarios (${rows.filter(u => u.status === 0).length} activos, ${rows.filter(u => u.status === 1).length} inactivos)`
              : `${filteredUsers.length} usuarios activos`
            }
          </Typography>
        </Box>
        
        {/* Botón Crear Usuario */}
        {isAdmin && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => navigate("/createUser")}
            sx={{ 
              px: 3, 
              py: 1.5,
              fontWeight: 'bold'
            }}
          >
            Crear Usuario
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
        sx={{
          "& .MuiDataGrid-root": { border: "none" },
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
            backgroundColor: safeColors.primary?.[400] || '#f5f5f5'
          },
          "& .MuiDataGrid-footerContainer": { 
            borderTop: "none", 
            backgroundColor: safeColors.blueAccent?.[700] || '#1976d2'
          },
          "& .MuiCheckbox-root": { 
            color: `${safeColors.greenAccent?.[200] || '#4caf50'} !important` 
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${safeColors.grey?.[100] || '#ffffff'} !important`
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
          checkboxSelection
          rows={filteredUsers}
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
      </Box>      {/* Dialog de confirmación de eliminación */}
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
            ¿Estás seguro de que deseas eliminar el usuario "{deleteDialog.userName}"?
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
}