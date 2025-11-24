import { useState, useEffect, useMemo } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import "react-pro-sidebar/dist/css/styles.css";

import { Token } from "../../theme";
import SettingsIcon from "@mui/icons-material/Settings";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
// import InvertColorsIcon from "@mui/icons-material/InvertColors";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

// Nuevos iconos para funcionalidades
import FontDownloadIcon from "@mui/icons-material/FontDownload";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import ContrastIcon from "@mui/icons-material/Contrast";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import MouseIcon from "@mui/icons-material/Mouse";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import LinkOffIcon from "@mui/icons-material/LinkOff";

const AccessibilitySidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [fontFamilyIndex, setFontFamilyIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isColorBlindMode, setIsColorBlindMode] = useState(false);
  const [isCursorChanged, setIsCursorChanged] = useState(false);
  const [hideImages, setHideImages] = useState(false);
  const [disableLinks, setDisableLinks] = useState(false);

  const theme = useTheme();
  const colors = Token(theme.palette.mode);

  const fonts = useMemo(() => [
    "'Arial', sans-serif",
    "'Comic Sans MS', cursive, sans-serif",
    "'Courier New', monospace",
  ], []);

  useEffect(() => {
    // Ajustar tamaño de fuente base (16px por defecto)
    document.documentElement.style.fontSize = `${fontScale * 16}px`;
    document.body.style.fontFamily = fonts[fontFamilyIndex];

    if (isDarkMode) {
      document.body.classList.add("dark-mode-accessibility");
    } else {
      document.body.classList.remove("dark-mode-accessibility");
    }

    if (isHighContrast) {
      document.body.classList.add("high-contrast-accessibility");
    } else {
      document.body.classList.remove("high-contrast-accessibility");
    }

    if (isColorBlindMode) {
      document.body.classList.add("color-blind-accessibility");
    } else {
      document.body.classList.remove("color-blind-accessibility");
    }

    if (isCursorChanged) {
      document.body.classList.add("cursor-accessibility");
    } else {
      document.body.classList.remove("cursor-accessibility");
    }

    if (hideImages) {
      document.body.classList.add("hide-images-accessibility");
    } else {
      document.body.classList.remove("hide-images-accessibility");
    }

    if (disableLinks) {
      document.body.classList.add("disable-links-accessibility");
    } else {
      document.body.classList.remove("disable-links-accessibility");
    }
  }, [
    fontScale,
    fontFamilyIndex,
    isDarkMode,
    isHighContrast,
    isColorBlindMode,
    isCursorChanged,
    hideImages,
    disableLinks,
    fonts,
  ]);

  const increaseFont = () => setFontScale((prev) => Math.min(prev + 0.25, 3));
  const decreaseFont = () => setFontScale((prev) => Math.max(prev - 0.25, 0.33));
  const changeFont = () =>
    setFontFamilyIndex((prev) => (prev + 1) % fonts.length);
  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);
  const toggleHighContrast = () => setIsHighContrast((prev) => !prev);
  const toggleColorBlindMode = () => setIsColorBlindMode((prev) => !prev);
  const toggleCursor = () => setIsCursorChanged((prev) => !prev);
  const toggleHideImages = () => setHideImages((prev) => !prev);
  const toggleDisableLinks = () => setDisableLinks((prev) => !prev);
  const resetStyles = () => {
    setFontScale(1);
    setFontFamilyIndex(0);
    setIsDarkMode(false);
    setIsHighContrast(false);
    setIsColorBlindMode(false);
    setIsCursorChanged(false);
    setHideImages(false);
    setDisableLinks(false);
  };

  return (
    <>
      <IconButton
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: "fixed",
          bottom: 60,  // Subido desde 20 a 60
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

      <Box
        sx={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 280,
          zIndex: 999,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease-in-out",
          boxShadow: isOpen ? 4 : 0,
          pointerEvents: isOpen ? "auto" : "none",
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
              <MenuItem icon={<ZoomInIcon />} onClick={increaseFont}>
                Aumentar fuente
              </MenuItem>
              <MenuItem icon={<ZoomOutIcon />} onClick={decreaseFont}>
                Reducir fuente
              </MenuItem>
              <MenuItem icon={<FontDownloadIcon />} onClick={changeFont}>
                Cambiar fuente
              </MenuItem>
              <MenuItem icon={<Brightness4Icon />} onClick={toggleDarkMode}>
                {isDarkMode ? "Desactivar modo Marina" : "Activar modo Marina"}
              </MenuItem>
              <MenuItem icon={<ContrastIcon />} onClick={toggleHighContrast}>
                {isHighContrast
                  ? "Desactivar alto contraste"
                  : "Activar alto contraste"}
              </MenuItem>
              <MenuItem icon={<ColorLensIcon />} onClick={toggleColorBlindMode}>
                {isColorBlindMode
                  ? "Desactivar filtro daltonismo"
                  : "Activar filtro daltonismo"}
              </MenuItem>
              <MenuItem icon={<MouseIcon />} onClick={toggleCursor}>
                {isCursorChanged ? "Restaurar cursor" : "Cambiar cursor"}
              </MenuItem>
              <MenuItem icon={<ImageNotSupportedIcon />} onClick={toggleHideImages}>
                {hideImages ? "Mostrar imágenes" : "Quitar imágenes"}
              </MenuItem>
              <MenuItem icon={<LinkOffIcon />} onClick={toggleDisableLinks}>
                {disableLinks ? "Activar links" : "Quitar links y sobresaltar"}
              </MenuItem>
              <MenuItem icon={<RestartAltIcon />} onClick={resetStyles}>
                Restablecer estilos
              </MenuItem>
            </Box>
          </Menu>
        </ProSidebar>
      </Box>

      <style>{`
        body.dark-mode-accessibility {
          background-color: #121212 !important;
          color: #e0e0e0 !important;
          filter: none !important;
        }
        body.high-contrast-accessibility {
          background-color: black !important;
          color: yellow !important;
          filter: none !important;
        }
        body.color-blind-accessibility {
          filter: grayscale(30%) contrast(150%);
        }
        body.cursor-accessibility, 
        body.cursor-accessibility * {
          cursor: pointer !important;
          cursor: url('https://cdn-icons-png.flaticon.com/512/32/32357.png'), auto !important;
        }
        body.hide-images-accessibility img {
          display: none !important;
        }
        body.disable-links-accessibility a {
          pointer-events: none !important;
          color: red !important;
          text-decoration: underline !important;
          font-weight: bold !important;
          cursor: default !important;
        }
      `}</style>
    </>
  );
};

export default AccessibilitySidebar;

