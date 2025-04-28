// components/Topbar.jsx
import { Box, IconButton, useTheme, Button } from '@mui/material';
import { useContext } from 'react';
import { ColorModeContext, Token } from '../../theme';
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon  from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon   from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon   from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon     from "@mui/icons-material/PersonOutlined";
import LogoutIcon             from "@mui/icons-material/Logout";
import SearchIcon             from "@mui/icons-material/Search";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "../../api/axiosClient";



const Topbar = () => {
  const theme    = useTheme();
  const colors   = Token(theme.palette.mode);
  const colorMode= useContext(ColorModeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const profileLocation = location.pathname === "/profile";

  const handleLogout = () => {
    // 1) Borra el token y datos de usuario
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // 2) Limpia el header de Authorization en Axios
    delete axios.defaults.headers.common["Authorization"];
    // 3) Redirige al login
    navigate("/login", { replace: true });
  };

  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      <Box display="flex" backgroundColor={colors.primary[400]} borderRadius="3px">
        <InputBase sx={{ ml: 2, flex: 1 }} placeholder="Search..." />
        <IconButton type="button" sx={{ p: 1 }}>
          <SearchIcon />
        </IconButton>
      </Box>

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