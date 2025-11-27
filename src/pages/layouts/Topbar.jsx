import { Box, IconButton, useTheme, Button, Badge, Menu, MenuItem, Typography, Divider, ListItemIcon, ListItemText } from '@mui/material';
import { useContext, useState, useEffect, useRef } from 'react';
import { ColorModeContext, Token } from '../../theme';
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import UpdateIcon from '@mui/icons-material/Update';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axiosClient";
import { useSearch } from "../../contexts/SearchContext";
import { useSocket } from "../../context/SocketContext";

const Topbar = () => {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const profileLocation = location.pathname === "/profile";
  const socket = useSocket();

  // Contexto de búsqueda
  const { searchTerm, updateSearch, clearSearch, isSearching } = useSearch();
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // Estados para notificaciones
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const openNotifications = Boolean(anchorEl);

  // Control de limpieza de búsqueda
  const previousPathname = useRef(location.pathname);
  const isInitialMount = useRef(true);

  // Sincronizar búsqueda
  useEffect(() => {
    if (!isInitialMount.current) {
      setLocalSearchTerm(searchTerm);
    }
  }, [searchTerm]);

  // Limpiar búsqueda al cambiar de página
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousPathname.current = location.pathname;
      return;
    }

    const params = new URLSearchParams(location.search);
    const urlSearch = params.get('search');

    if (urlSearch) {
      // Si hay un parámetro de búsqueda en la URL, lo aplicamos
      updateSearch(urlSearch);
      setLocalSearchTerm(urlSearch);
    } else if (previousPathname.current !== location.pathname) {
      // Si cambiamos de página y NO hay parámetro de búsqueda, limpiamos
      clearSearch();
      setLocalSearchTerm('');
    }

    previousPathname.current = location.pathname;
  }, [location, updateSearch, clearSearch]);

  // Manejar notificaciones via Socket
  useEffect(() => {
    if (!socket) return;

    const addNotification = (message, type = 'info', relatedData = null) => {
      const newNotification = {
        id: Date.now(),
        message,
        type,
        relatedData,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
      };
      setNotifications(prev => [newNotification, ...prev].slice(0, 10)); // Mantener solo las últimas 10
    };

    const handleProductCreated = (data) => {
      addNotification(`Nuevo producto creado: ${data.part_number}`, 'success', { searchTerm: data.part_number });
    };

    const handleProductUpdated = (data) => {
      // Lógica de Notificaciones de Stock
      if (data.quantity !== undefined && data.min_stock !== undefined) {
        const stock = Number(data.quantity);
        const minStock = Number(data.min_stock);
        const productName = data.part_number || data.name || 'Producto';
        const searchTerm = data.part_number || data.name;

        if (stock === 0) {
          addNotification(`¡AGOTADO! El producto ${productName} se ha quedado sin stock.`, 'warning', { searchTerm });
        } else if (stock <= minStock * 0.5) {
          addNotification(`¡CRÍTICO! El stock de ${productName} es muy bajo (${stock}).`, 'warning', { searchTerm });
        } else if (stock <= minStock) {
          addNotification(`¡BAJO! El stock de ${productName} está por debajo del mínimo.`, 'warning', { searchTerm });
        } else {
          // Si el stock es normal, quizás solo notificar actualización genérica o nada
          // addNotification(`Producto actualizado: ${productName}`, 'info');
        }
      } else {
        addNotification(`Producto actualizado: ${data.part_number || 'Desconocido'}`, 'info', { searchTerm: data.part_number });
      }
    };

    const handleProductDeleted = (data) => {
      addNotification(`Producto eliminado (ID: ${data.id})`, 'warning');
    };

    const handleStockUpdated = (data) => {
      if (data.quantity !== undefined && data.min_stock !== undefined) {
        handleProductUpdated(data);
      } else {
        addNotification(`Stock actualizado para producto ID: ${data.id}`, 'info');
      }
    };

    socket.on('product_created', handleProductCreated);
    socket.on('product_updated', handleProductUpdated);
    socket.on('product_deleted', handleProductDeleted);
    socket.on('stock_updated', handleStockUpdated);

    return () => {
      socket.off('product_created', handleProductCreated);
      socket.off('product_updated', handleProductUpdated);
      socket.off('product_deleted', handleProductDeleted);
      socket.off('stock_updated', handleStockUpdated);
    };
  }, [socket]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      updateSearch(value);
    }, 150);
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    clearSearch();
    clearTimeout(window.searchTimeout);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    navigate("/login", { replace: true });
  };

  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
    // Marcar como leídas al cerrar (opcional)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationItemClick = (notification) => {
    // 1. Borrar la notificación
    setNotifications(prev => prev.filter(n => n.id !== notification.id));

    // 2. Redirigir si hay datos relacionados
    if (notification.relatedData && notification.relatedData.searchTerm) {
      const term = encodeURIComponent(notification.relatedData.searchTerm);
      navigate(`/products?search=${term}`);
      handleNotificationClose(); // Cerramos menú al navegar
    }
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    handleNotificationClose();
  };

  const getPlaceholder = () => {
    switch (location.pathname) {
      case '/dashboard': return "Buscar en dashboard...";
      case '/products': return "Buscar productos...";
      case '/team': return "Buscar usuarios...";
      case '/history': return "Buscar en historial...";
      case '/providers': return "Buscar proveedores...";
      default: return "Buscar...";
    }
  };

  const unreadCount = notifications.length;

  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* 🔍 BUSCADOR */}
      <Box
        display="flex"
        backgroundColor={colors.primary[400]}
        borderRadius="3px"
        sx={{
          border: isSearching ? `2px solid ${colors.greenAccent[500]}` : 'none',
          transition: 'border 0.2s ease',
          minWidth: '300px'
        }}
      >
        <InputBase
          sx={{
            ml: 2,
            flex: 1,
            '& input::placeholder': {
              color: colors.grey[300],
              opacity: 0.7
            }
          }}
          placeholder={getPlaceholder()}
          value={localSearchTerm}
          onChange={handleSearchChange}
          autoComplete="off"
          spellCheck={false}
        />

        <IconButton
          type="button"
          sx={{ p: 1 }}
          onClick={isSearching ? handleClearSearch : undefined}
        >
          {isSearching ? (
            <ClearIcon sx={{ color: colors.redAccent[500] }} />
          ) : (
            <SearchIcon />
          )}
        </IconButton>
      </Box>

      {/* ICONOS */}
      <Box display="flex" alignItems="center" gap={1}>
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === 'dark' ? (
            <DarkModeOutlinedIcon sx={{ fontSize: 30 }} />
          ) : (
            <LightModeOutlinedIcon sx={{ fontSize: 30 }} />
          )}
        </IconButton>

        {/* 🔔 NOTIFICACIONES */}
        <IconButton onClick={handleNotificationClick}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsOutlinedIcon />
          </Badge>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={openNotifications}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: {
              width: 360,
              maxHeight: 400,
              mt: 1.5,
              backgroundColor: colors.primary[400],
              color: colors.grey[100]
            }
          }}
        >
          <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">Notificaciones</Typography>
            {notifications.length > 0 && (
              <Typography
                variant="caption"
                sx={{ cursor: 'pointer', color: colors.greenAccent[500] }}
                onClick={handleClearNotifications}
              >
                Limpiar todo
              </Typography>
            )}
          </Box>
          <Divider />
          {notifications.length === 0 ? (
            <MenuItem onClick={handleNotificationClose}>
              <Typography variant="body2" color="textSecondary">
                No hay notificaciones nuevas
              </Typography>
            </MenuItem>
          ) : (
            notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationItemClick(notification)}
                sx={{ whiteSpace: 'normal', cursor: 'pointer' }}
              >
                <ListItemIcon>
                  {notification.type === 'success' && <Inventory2OutlinedIcon color="success" fontSize="small" />}
                  {notification.type === 'info' && <UpdateIcon color="info" fontSize="small" />}
                  {notification.type === 'warning' && <DeleteOutlineIcon color="warning" fontSize="small" />}
                </ListItemIcon>
                <ListItemText
                  primary={notification.message}
                  secondary={notification.time}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold', style: { wordWrap: 'break-word' } }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </MenuItem>
            ))
          )}
        </Menu>

        <Link to="/profile">
          <IconButton
            style={{ marginTop: "5px" }}
            sx={{
              color: profileLocation ? colors.greenAccent[500] : undefined,
            }}
          >
            <PersonOutlinedIcon />
          </IconButton>
        </Link>

        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ ml: 1, fontWeight: "bold", textTransform: "none" }}
        >
          Cerrar sesión
        </Button>
      </Box>
    </Box>
  );
};

export default Topbar;