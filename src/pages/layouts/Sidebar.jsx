import React, { useState, useEffect } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

import "react-pro-sidebar/dist/css/styles.css";
import { Token } from "../../theme";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PieChartOutlineOutlinedIcon from "@mui/icons-material/PieChartOutlineOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import GradeIcon from "@mui/icons-material/Grade";
import CategoryIcon from "@mui/icons-material/Category";
import PlaceIcon from "@mui/icons-material/Place";
import SellIcon from "@mui/icons-material/Sell";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import SecurityIcon from "@mui/icons-material/Security";

import defaultPic from "../../assets/default.png";

const Item = ({ title, to, icon }) => {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isActive = pathname === to;

  const handleClick = () => {
    try {
      // Verificar que la ruta es válida antes de navegar
      if (to && typeof to === 'string') {
        navigate(to);
      }
    } catch (error) {
      console.error('Error al navegar:', error);
    }
  };

  return (
    <MenuItem
      icon={icon}
      active={isActive}
      style={{ color: colors.grey[100], textDecoration: "none" }}
      onClick={handleClick}
    >
      <Typography>{title}</Typography>
    </MenuItem>
  );
};

export default function Sidebar() {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);
  const [collapsed, setCollapsed] = useState(false);

  const [user, setUser] = useState({
    name: "Usuario",
    profile_pic: null,
    roleId: null,
  });

  useEffect(() => {
    // función para recargar usuario desde localStorage
    const loadUser = () => {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch { }
      }
    };

    // carga inicial
    loadUser();

    // escuchar el evento que disparas en Profile.jsx
    window.addEventListener("userUpdated", loadUser);

    // limpieza
    return () => {
      window.removeEventListener("userUpdated", loadUser);
    };
  }, []);

  const isAdmin = user.roleId === 1;

  return (
    <Box
      sx={{
        "& .pro-sidebar-inner": { background: `${colors.primary[400]} !important` },
        "& .pro-icon-wrapper": { backgroundColor: "transparent !important" },
        "& .pro-inner-item": { padding: "5px 35px 5px 20px !important" },
        "& .pro-inner-item:hover": { color: "#868dfb !important" },
        "& .pro-menu-item.active": { color: "#6870fa !important" },
      }}
    >
      <ProSidebar collapsed={collapsed}>
        {/* Toggle Header */}
        <Box
          display="flex"
          justifyContent={collapsed ? "center" : "space-between"}
          alignItems="center"
          p="10px 20px"
        >
          {!collapsed && (
            <Typography variant="h3" color={colors.grey[100]}>
              NauticStock
            </Typography>
          )}
          <IconButton
            onClick={() => setCollapsed(c => !c)}
            sx={{ color: colors.grey[100] }}
          >
            <MenuOutlinedIcon />
          </IconButton>
        </Box>

        <Menu iconShape="square">
          {/* Profile */}
          {!collapsed && (
            <Box mb="25px" textAlign="center">
              <img
                src={user.profile_pic || defaultPic}
                alt="avatar"
                width={100}
                height={100}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
              <Typography variant="h5" color={colors.greenAccent[500]} mt="10px">
                {user.name}
              </Typography>
            </Box>
          )}

          {/* Menu Sections */}
          <Box paddingLeft={collapsed ? undefined : "10%"}>
            <Item title="Dashboard" to="/" icon={<HomeOutlinedIcon />} />

            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              Administración
            </Typography>
            {isAdmin && (
              <Item
                title="Equipo de Trabajo"
                to="/team"
                icon={<PeopleOutlinedIcon />}
              />
            )}
            <Item title="Productos" to="/products" icon={<InventoryIcon />} />
            <Item title="Proveedores" to="/providers" icon={<LocalShippingIcon />} />

            {isAdmin && (
              <>
                <Item
                  title="Categorías"
                  to="/categories"
                  icon={<CategoryIcon />}
                />
                <Item
                  title="Marcas"
                  to="/brands"
                  icon={<SellIcon />}
                />
                <Item
                  title="Ubicaciones"
                  to="/locations"
                  icon={<PlaceIcon />}
                />
                <Item
                  title="Rangos"
                  to="/ranks"
                  icon={<GradeIcon />}
                />
                <Item
                  title="Roles y Permisos"
                  to="/roles"
                  icon={<SecurityIcon />}
                />
                <Item
                  title="Historial"
                  to="/history"
                  icon={<HistoryOutlinedIcon />}
                />
              </>
            )}

            <Item
              title="Calendario"
              to="/calendar"
              icon={<CalendarTodayOutlinedIcon />}
            />
            <Item
              title="Preguntas Frecuentes"
              to="/faq"
              icon={<HelpOutlineOutlinedIcon />}
            />

            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              Gráficos
            </Typography>
            <Item title="Bar Chart" to="/bar" icon={<BarChartOutlinedIcon />} />
            <Item title="Pie Chart" to="/pie" icon={<PieChartOutlineOutlinedIcon />} />
            <Item title="Line Chart" to="/line" icon={<TimelineOutlinedIcon />} />
            <Item title="Geography" to="/geography" icon={<MapOutlinedIcon />} />
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
}