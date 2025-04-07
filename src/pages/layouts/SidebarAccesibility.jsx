import { useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import "react-pro-sidebar/dist/css/styles.css";

import { Token } from "../../theme";
import SettingsIcon from "@mui/icons-material/Settings";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import InvertColorsIcon from "@mui/icons-material/InvertColors";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const AccessibilitySidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();
  const colors = Token(theme.palette.mode);

  return (
    <>
      {/* Botón flotante en la esquina inferior derecha */}
      <IconButton
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          backgroundColor: colors.blueAccent[600],
          color: "#fff",
          width: 56,
          height: 56,
          zIndex: 1000,
          boxShadow: 3,
          "&:hover": {
            backgroundColor: colors.blueAccent[700],
          },
        }}
        aria-label="Configuración de accesibilidad"
      >
        <SettingsIcon />
      </IconButton>

      {/* Sidebar flotante desde la derecha con animación */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 250,
          zIndex: 999,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease-in-out",
          boxShadow: isOpen ? 4 : 0,
          pointerEvents: isOpen ? "auto" : "none", // evita clics cuando está cerrado
          "& .pro-sidebar-inner": {
            background: `${colors.primary[400]} !important`,
          },
          "& .pro-icon-wrapper": {
            backgroundColor: "transparent !important",
          },
          "& .pro-inner-item": {
            padding: "5px 35px 5px 20px !important",
          },
          "& .pro-inner-item:hover": {
            color: "#868dfb !important",
          },
          "& .pro-menu-item.active": {
            color: "#6870fa !important",
          },
        }}
      >
        <ProSidebar collapsed={false}>
          <Menu iconShape="square">
            <MenuItem
              style={{
                margin: "10px 0 20px 0",
                color: colors.grey[100],
              }}
              icon={<SettingsIcon />}
              onClick={() => setIsOpen(false)}
            >
              <Typography variant="h3" color={colors.grey[100]}>
                Accesibilidad
              </Typography>
            </MenuItem>

            <Box paddingLeft="10%">
              <MenuItem icon={<ZoomInIcon />}>Aumentar fuente</MenuItem>
              <MenuItem icon={<ZoomOutIcon />}>Reducir fuente</MenuItem>
              <MenuItem icon={<InvertColorsIcon />}>Modo alto contraste</MenuItem>
              <MenuItem icon={<RestartAltIcon />}>Restablecer estilos</MenuItem>
            </Box>
          </Menu>
        </ProSidebar>
      </Box>
    </>
  );
};

export default AccessibilitySidebar;
