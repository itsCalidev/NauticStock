import React, { useState, useEffect } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

import "react-pro-sidebar/dist/css/styles.css";
import { Token } from "../../theme";
import usePermission from "../../hooks/usePermission";

import defaultPic from "../../assets/default.png";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import GradeIcon from "@mui/icons-material/Grade";
import CategoryIcon from "@mui/icons-material/Category";
import PlaceIcon from "@mui/icons-material/Place";
import SellIcon from "@mui/icons-material/Sell";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import SecurityIcon from "@mui/icons-material/Security";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";

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
  const { can } = usePermission();

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
            {/* Dashboard */}
            {can('dashboard_view') && (
              <Item title="Dashboard" to="/" icon={<HomeOutlinedIcon />} />
            )}

            {!collapsed && (
              <Typography
                variant="h6"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 20px" }}
              >
                Datos
              </Typography>
            )}

            {/* Team */}
            {can('user_read') && (
              <Item
                title="Equipo"
                to="/team"
                icon={<PeopleOutlinedIcon />}
              />
            )}

            {/* Products */}
            {can('product_read') && (
              <Item title="Productos" to="/products" icon={<InventoryIcon />} />
            )}

            {/* Providers */}
            {can('provider_read') && (
              <Item title="Proveedores" to="/providers" icon={<LocalShippingIcon />} />
            )}

            {/* Orders */}
            {can('order_read') && (
              <Item title="Ordenes" to="/orders" icon={<ReceiptLongOutlinedIcon />} />
            )}

            {/* Categories */}
            {can('category_read') && (
              <Item
                title="Categorías"
                to="/categories"
                icon={<CategoryIcon />}
              />
            )}

            {/* Brands */}
            {can('brand_read') && (
              <Item
                title="Marcas"
                to="/brands"
                icon={<SellIcon />}
              />
            )}

            {/* Locations */}
            {can('location_read') && (
              <Item
                title="Ubicaciones"
                to="/locations"
                icon={<PlaceIcon />}
              />
            )}

            {!collapsed && (
              <Typography
                variant="h6"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 20px" }}
              >
                Administración
              </Typography>
            )}

            {/* Roles */}
            {can('role_read') && (
              <Item
                title="Roles y Permisos"
                to="/roles"
                icon={<SecurityIcon />}
              />
            )}

            {/* Ranks */}
            {can('rank_read') && (
              <Item
                title="Rangos"
                to="/ranks"
                icon={<GradeIcon />}
              />
            )}

            {/* History */}
            {can('history_view') && (
              <Item
                title="Historial"
                to="/history"
                icon={<HistoryOutlinedIcon />}
              />
            )}

            {/* Calendar */}
            {can('calendar_read') && (
              <Item
                title="Calendario"
                to="/calendar"
                icon={<CalendarTodayOutlinedIcon />}
              />
            )}

            {/* Reports */}
            {can('report_view') && (
              <Item
                title="Reportes"
                to="/reports"
                icon={<BarChartOutlinedIcon />}
              />
            )}

            {/* FAQ */}
            {can('faq_read') && (
              <Item
                title="Preguntas Frecuentes"
                to="/faq"
                icon={<HelpOutlineOutlinedIcon />}
              />
            )}

          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
}
