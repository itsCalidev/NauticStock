import { Box, IconButton, useTheme, Button } from '@mui/material';
import { useContext, useState, useEffect, useRef } from 'react'; // 👈 AGREGAR useRef
import { ColorModeContext, Token } from '../../theme';
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon  from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon   from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon   from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon     from "@mui/icons-material/PersonOutlined";
import LogoutIcon             from "@mui/icons-material/Logout";
import SearchIcon             from "@mui/icons-material/Search";
import ClearIcon              from "@mui/icons-material/Clear";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axiosClient";
import { useSearch } from "../../contexts/SearchContext";

const Topbar = () => {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const profileLocation = location.pathname === "/profile";
  
  // Contexto de búsqueda
  const { searchTerm, updateSearch, clearSearch, isSearching } = useSearch();
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  
  // 👇 NUEVO: Para controlar cuándo limpiar
  const previousPathname = useRef(location.pathname);
  const isInitialMount = useRef(true);

  // 👇 MODIFICADO: Sincronizar solo si no es la primera vez
  useEffect(() => {
    if (!isInitialMount.current) {
      setLocalSearchTerm(searchTerm);
    }
  }, [searchTerm]);

  // 👇 MODIFICADO: Limpiar solo cuando realmente cambie de página
  useEffect(() => {
    // No limpiar en el montaje inicial
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousPathname.current = location.pathname;
      return;
    }

    // Solo limpiar si realmente cambió de página
    if (previousPathname.current !== location.pathname) {
      console.log('Cambiando de página:', previousPathname.current, '→', location.pathname);
      clearSearch();
      setLocalSearchTerm('');
      previousPathname.current = location.pathname;
    }
  }, [location.pathname, clearSearch]);

  // 👇 MODIFICADO: Manejar cambios con debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    
    // 👇 AGREGAR DEBOUNCE PARA EVITAR MUCHAS ACTUALIZACIONES
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      updateSearch(value);
    }, 150); // 150ms de delay
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    clearSearch();
    clearTimeout(window.searchTimeout); // Limpiar timeout pendiente
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    navigate("/login", { replace: true });
  };

  const getPlaceholder = () => {
    switch (location.pathname) {
      case '/dashboard':
        return "Buscar en dashboard...";
      case '/products':
        return "Buscar productos...";
      case '/team':
        return "Buscar usuarios...";
      case '/history':
        return "Buscar en historial...";
      case '/providers':
        return "Buscar proveedores...";
      default:
        return "Buscar...";
    }
  };

  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* 🔍 BUSCADOR MEJORADO */}
      <Box 
        display="flex" 
        backgroundColor={colors.primary[400]} 
        borderRadius="3px"
        sx={{
          border: isSearching ? `2px solid ${colors.greenAccent[500]}` : 'none',
          transition: 'border 0.2s ease',
          minWidth: '300px' // 👈 NUEVO: Ancho mínimo
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
          // 👇 NUEVO: Prevenir que se borre
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

      {/* RESTO DE ICONOS (sin cambios) */}
      <Box display="flex" alignItems="center" gap={1}>
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === 'dark' ? (
            <DarkModeOutlinedIcon sx={{ fontSize: 30 }} />
          ) : (
            <LightModeOutlinedIcon sx={{ fontSize: 30 }} />
          )}
        </IconButton>

        <IconButton>
          <NotificationsOutlinedIcon />
        </IconButton>

        <IconButton>
          <SettingsOutlinedIcon />
        </IconButton>

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