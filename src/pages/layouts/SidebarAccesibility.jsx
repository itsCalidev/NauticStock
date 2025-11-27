import { useState, useEffect, useCallback, useRef } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, Button } from "@mui/material";
import "react-pro-sidebar/dist/css/styles.css";

// Import Local Font
import OpenDyslexicFont from '../../assets/fonts/OpenDyslexic-Regular.otf';


import SettingsIcon from "@mui/icons-material/Settings";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

// Iconos para funcionalidades (SEMAR Style)
import FontDownloadIcon from "@mui/icons-material/FontDownload";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import ContrastIcon from "@mui/icons-material/Contrast";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import MouseIcon from "@mui/icons-material/Mouse";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import LinkIcon from "@mui/icons-material/Link";
import FormatLineSpacingIcon from "@mui/icons-material/FormatLineSpacing";
import BorderHorizontalIcon from "@mui/icons-material/BorderHorizontal";
import VisibilityIcon from "@mui/icons-material/Visibility"; // For Reading Mask
import HearingIcon from "@mui/icons-material/Hearing"; // For Screen Reader
import TextFieldsIcon from "@mui/icons-material/TextFields"; // For Horizontal Spacing

const AccessibilitySidebar = () => {

    const readingGuideRef = useRef(null);
    const maskTopRef = useRef(null);
    const maskBottomRef = useRef(null);

    // SEMAR Colors
    const SEMAR_MAROON = "#9d2449";
    const SEMAR_GRAY_BG = "#f5f5f5";
    const SEMAR_TEXT = "#9d2449";

    // --- ESTADO CON PERSISTENCIA ---
    const getStoredState = (key, defaultValue) => {
        const stored = localStorage.getItem(`a11y_${key}`);
        if (stored !== null) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.warn("Error parsing accessibility setting:", key);
            }
        }
        return defaultValue;
    };

    const [isOpen, setIsOpen] = useState(false);
    const [fontScale, setFontScale] = useState(() => getStoredState("fontScale", 1));
    const [isDyslexiaFont, setIsDyslexiaFont] = useState(() => getStoredState("isDyslexiaFont", false));
    const [isMarinaMode, setIsMarinaMode] = useState(() => getStoredState("isMarinaMode", false));
    const [isHighContrast, setIsHighContrast] = useState(() => getStoredState("isHighContrast", false));
    const [isGrayscale, setIsGrayscale] = useState(() => getStoredState("isGrayscale", false));
    const [isCursorChanged, setIsCursorChanged] = useState(() => getStoredState("isCursorChanged", false));
    const [hideImages, setHideImages] = useState(() => getStoredState("hideImages", false));
    const [highlightLinks, setHighlightLinks] = useState(() => getStoredState("highlightLinks", false));

    // Changed to numbers (0 = Off, 1 = Low, 2 = Medium, 3 = High)
    const [textSpacingVertical, setTextSpacingVertical] = useState(() => getStoredState("textSpacingVertical", 0));
    const [textSpacingHorizontal, setTextSpacingHorizontal] = useState(() => getStoredState("textSpacingHorizontal", 0));

    const [readingGuide, setReadingGuide] = useState(() => getStoredState("readingGuide", false));
    const [readingMask, setReadingMask] = useState(() => getStoredState("readingMask", false));
    const [screenReader, setScreenReader] = useState(() => getStoredState("screenReader", false));

    // --- EFECTOS ---

    // 1. Guardar en localStorage
    useEffect(() => {
        localStorage.setItem("a11y_fontScale", JSON.stringify(fontScale));
        localStorage.setItem("a11y_isDyslexiaFont", JSON.stringify(isDyslexiaFont));
        localStorage.setItem("a11y_isMarinaMode", JSON.stringify(isMarinaMode));
        localStorage.setItem("a11y_isHighContrast", JSON.stringify(isHighContrast));
        localStorage.setItem("a11y_isGrayscale", JSON.stringify(isGrayscale));
        localStorage.setItem("a11y_isCursorChanged", JSON.stringify(isCursorChanged));
        localStorage.setItem("a11y_hideImages", JSON.stringify(hideImages));
        localStorage.setItem("a11y_highlightLinks", JSON.stringify(highlightLinks));
        localStorage.setItem("a11y_textSpacingVertical", JSON.stringify(textSpacingVertical));
        localStorage.setItem("a11y_textSpacingHorizontal", JSON.stringify(textSpacingHorizontal));
        localStorage.setItem("a11y_readingGuide", JSON.stringify(readingGuide));
        localStorage.setItem("a11y_readingMask", JSON.stringify(readingMask));
        localStorage.setItem("a11y_screenReader", JSON.stringify(screenReader));
    }, [
        fontScale, isDyslexiaFont, isMarinaMode, isHighContrast, isGrayscale,
        isCursorChanged, hideImages, highlightLinks, textSpacingVertical,
        textSpacingHorizontal, readingGuide, readingMask, screenReader
    ]);

    // 2. Aplicar estilos al DOM y lógica de Guías y Lector de Pantalla
    useEffect(() => {
        document.documentElement.style.fontSize = `${fontScale * 16}px`;

        const toggleClass = (condition, className) => {
            if (condition) document.body.classList.add(className);
            else document.body.classList.remove(className);
        };

        toggleClass(isMarinaMode, "marina-mode-accessibility");
        toggleClass(isHighContrast, "high-contrast-accessibility");
        toggleClass(isGrayscale, "grayscale-accessibility");
        toggleClass(isCursorChanged, "cursor-accessibility");
        toggleClass(hideImages, "hide-images-accessibility");
        toggleClass(highlightLinks, "highlight-links-accessibility");
        toggleClass(readingMask, "reading-mask-accessibility");

        // Classes for spacing are handled via dynamic CSS in <style> block now, 
        // but we can keep generic classes if needed, or just rely on the style block.
        // For simplicity, we'll rely on the style block injection below.

        // Lógica de Guía de Lectura y Máscara de Lectura
        const handleMouseMove = (e) => {
            // Guía de Lectura (Línea)
            if (readingGuide && readingGuideRef.current) {
                readingGuideRef.current.style.top = `${e.clientY}px`;
            }

            // Máscara de Lectura (Ventana)
            if (readingMask && maskTopRef.current && maskBottomRef.current) {
                const maskHeight = 120; // Altura de la ventana clara
                const topHeight = Math.max(0, e.clientY - (maskHeight / 2));
                const bottomTop = Math.min(window.innerHeight, e.clientY + (maskHeight / 2));

                maskTopRef.current.style.height = `${topHeight}px`;
                maskBottomRef.current.style.top = `${bottomTop}px`;
                maskBottomRef.current.style.height = `${window.innerHeight - bottomTop}px`;
            }
        };

        if (readingGuide || readingMask) {
            window.addEventListener("mousemove", handleMouseMove);
            if (readingGuide) document.body.classList.add("reading-guide-active");
            if (readingMask) document.body.classList.add("reading-mask-active");
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            document.body.classList.remove("reading-guide-active");
            document.body.classList.remove("reading-mask-active");
        }

        // Lógica de Lector de Pantalla (Web Speech API)
        const handleMouseOver = (e) => {
            if (!screenReader) return;

            const target = e.target;
            // Elementos que queremos leer
            const readableTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'BUTTON', 'LI', 'TD', 'TH', 'LABEL', 'INPUT', 'TEXTAREA'];

            // Verificar si es un elemento legible o está dentro de uno (para botones con iconos, etc.)
            let elementToRead = target;
            if (!readableTags.includes(target.tagName) && target.parentElement && readableTags.includes(target.parentElement.tagName)) {
                elementToRead = target.parentElement;
            }

            if (readableTags.includes(elementToRead.tagName)) {
                // Obtener texto: aria-label tiene prioridad, luego innerText, luego alt (para imgs)
                const text = elementToRead.getAttribute('aria-label') || elementToRead.innerText || elementToRead.alt || '';

                if (text && text.trim().length > 0) {
                    // Cancelar lectura anterior
                    window.speechSynthesis.cancel();

                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'es-MX'; // Configurar idioma español
                    utterance.rate = 1.0; // Velocidad normal

                    // Opcional: Resaltar visualmente lo que se lee
                    elementToRead.style.outline = '2px solid #9d2449';

                    window.speechSynthesis.speak(utterance);

                    // Guardar referencia para limpiar estilo
                    elementToRead.dataset.reading = "true";
                }
            }
        };

        const handleMouseOut = (e) => {
            if (!screenReader) return;

            // Cancelar lectura
            window.speechSynthesis.cancel();

            // Limpiar estilo si se aplicó
            if (e.target.dataset.reading === "true") {
                e.target.style.outline = '';
                delete e.target.dataset.reading;
            } else if (e.target.parentElement && e.target.parentElement.dataset.reading === "true") {
                e.target.parentElement.style.outline = '';
                delete e.target.parentElement.dataset.reading;
            }
        };

        if (screenReader) {
            document.body.addEventListener('mouseover', handleMouseOver);
            document.body.addEventListener('mouseout', handleMouseOut);
        } else {
            document.body.removeEventListener('mouseover', handleMouseOver);
            document.body.removeEventListener('mouseout', handleMouseOut);
            window.speechSynthesis.cancel(); // Asegurar que se calle al desactivar
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            document.body.removeEventListener('mouseover', handleMouseOver);
            document.body.removeEventListener('mouseout', handleMouseOut);
            window.speechSynthesis.cancel();
        };

    }, [
        fontScale, isDyslexiaFont, isMarinaMode, isHighContrast, isGrayscale,
        isCursorChanged, hideImages, highlightLinks, textSpacingVertical,
        textSpacingHorizontal, readingGuide, readingMask, screenReader
    ]);

    // 3. Cerrar con tecla ESC
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    // --- HANDLERS ---

    const increaseFont = () => setFontScale((prev) => Math.min(prev + 0.1, 3));
    const decreaseFont = () => setFontScale((prev) => Math.max(prev - 0.1, 0.5));
    const toggleDyslexiaFont = () => setIsDyslexiaFont((prev) => !prev);
    const toggleMarinaMode = () => setIsMarinaMode((prev) => !prev);
    const toggleHighContrast = () => setIsHighContrast((prev) => !prev);
    const toggleGrayscale = () => setIsGrayscale((prev) => !prev);
    const toggleCursor = () => setIsCursorChanged((prev) => !prev);
    const toggleHideImages = () => setHideImages((prev) => !prev);
    const toggleHighlightLinks = () => setHighlightLinks((prev) => !prev);

    // Cycle 0 -> 1 -> 2 -> 3 -> 0
    const toggleTextSpacingVertical = () => setTextSpacingVertical((prev) => (prev + 1) % 4);
    const toggleTextSpacingHorizontal = () => setTextSpacingHorizontal((prev) => (prev + 1) % 4);

    const toggleReadingGuide = () => setReadingGuide((prev) => !prev);
    const toggleReadingMask = () => setReadingMask((prev) => !prev);
    const toggleScreenReader = () => setScreenReader((prev) => !prev);

    const resetStyles = useCallback(() => {
        setFontScale(1);
        setIsDyslexiaFont(false);
        setIsMarinaMode(false);
        setIsHighContrast(false);
        setIsGrayscale(false);
        setIsCursorChanged(false);
        setHideImages(false);
        setHighlightLinks(false);
        setTextSpacingVertical(0);
        setTextSpacingHorizontal(0);
        setReadingGuide(false);
        setReadingMask(false);
        setScreenReader(false);
    }, []);

    // Helper to get CSS values based on level
    const getVerticalSpacingCSS = (level) => {
        switch (level) {
            case 1: return { lineHeight: '1.8', marginBottom: '1.2em' };
            case 2: return { lineHeight: '2.2', marginBottom: '1.8em' };
            case 3: return { lineHeight: '2.6', marginBottom: '2.4em' };
            default: return { lineHeight: 'normal', marginBottom: 'initial' };
        }
    };

    const getHorizontalSpacingCSS = (level) => {
        switch (level) {
            case 1: return { letterSpacing: '0.12em', wordSpacing: '0.16em' };
            case 2: return { letterSpacing: '0.25em', wordSpacing: '0.3em' };
            case 3: return { letterSpacing: '0.4em', wordSpacing: '0.5em' };
            default: return { letterSpacing: 'normal', wordSpacing: 'normal' };
        }
    };

    const vSpacing = getVerticalSpacingCSS(textSpacingVertical);
    const hSpacing = getHorizontalSpacingCSS(textSpacingHorizontal);

    // Helper Component for Level Indicators
    const LevelIndicator = ({ level }) => (
        <Box display="flex" gap={0.5} ml="auto" alignItems="center">
            {[1, 2, 3].map((i) => (
                <Box
                    key={i}
                    sx={{
                        width: 6,
                        height: 16,
                        backgroundColor: i <= level ? SEMAR_MAROON : "#ccc",
                        borderRadius: 1,
                        transition: "background-color 0.2s"
                    }}
                />
            ))}
        </Box>
    );

    return (
        <>
            {/* Reading Guide Element */}
            {readingGuide && (
                <div
                    ref={readingGuideRef}
                    id="reading-guide-line"
                    style={{
                        position: "fixed",
                        left: 0,
                        width: "100%",
                        height: "10px",
                        backgroundColor: "rgba(255, 235, 59, 0.5)", // Yellow semi-transparent
                        zIndex: 9999,
                        pointerEvents: "none",
                        transform: "translateY(-50%)",
                        borderTop: "2px solid #000",
                        borderBottom: "2px solid #000"
                    }}
                />
            )}

            {/* Reading Mask Elements */}
            {readingMask && (
                <>
                    <div
                        ref={maskTopRef}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "0px", // Dynamic
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                            zIndex: 9998,
                            pointerEvents: "none",
                            transition: "height 0.05s linear" // Smooth transition
                        }}
                    />
                    <div
                        ref={maskBottomRef}
                        style={{
                            position: "fixed",
                            top: "100%", // Dynamic
                            left: 0,
                            width: "100%",
                            height: "0px", // Dynamic
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                            zIndex: 9998,
                            pointerEvents: "none",
                            transition: "top 0.05s linear, height 0.05s linear" // Smooth transition
                        }}
                    />
                </>
            )}

            {/* Toggle Button */}
            <IconButton
                onClick={() => setIsOpen(!isOpen)}
                sx={{
                    position: "fixed",
                    bottom: 60,
                    right: 20,
                    backgroundColor: SEMAR_MAROON,
                    color: "#fff",
                    width: 56,
                    height: 56,
                    zIndex: 2000,
                    boxShadow: 3,
                    "&:hover": {
                        backgroundColor: "#7a1c38", // Darker maroon
                    },
                    "&:focus": {
                        outline: "3px solid #fff",
                        outlineOffset: "2px",
                    }
                }}
                aria-label={isOpen ? "Cerrar menú de accesibilidad" : "Abrir menú de accesibilidad"}
                aria-expanded={isOpen}
                aria-controls="accessibility-sidebar"
                aria-haspopup="true"
            >
                <SettingsIcon fontSize="large" />
            </IconButton>

            {/* Sidebar Menu */}
            <Box
                id="accessibility-sidebar"
                role="dialog"
                aria-label="Opciones de accesibilidad"
                aria-modal="false"
                sx={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    height: "100vh",
                    width: 300,
                    zIndex: 1999,
                    transform: isOpen ? "translateX(0)" : "translateX(100%)",
                    transition: "transform 0.3s ease-in-out",
                    boxShadow: isOpen ? 4 : 0,
                    pointerEvents: isOpen ? "auto" : "none",
                    backgroundColor: SEMAR_GRAY_BG,
                    "& .pro-sidebar-inner": {
                        background: `${SEMAR_GRAY_BG} !important`,
                    },
                    "& .pro-icon-wrapper": {
                        backgroundColor: "transparent !important",
                        color: `${SEMAR_MAROON} !important`,
                    },
                    "& .pro-inner-item": {
                        padding: "10px 20px !important",
                        color: `${SEMAR_TEXT} !important`,
                        fontWeight: "500 !important",
                    },
                    "& .pro-inner-item:hover": {
                        color: "#000 !important",
                        backgroundColor: "rgba(157, 36, 73, 0.1) !important", // Light maroon tint
                    },
                    "& .pro-menu-item.active": {
                        color: `${SEMAR_MAROON} !important`,
                    },
                }}
            >
                <ProSidebar collapsed={false}>
                    <Box p={2} display="flex" justifyContent="space-between" alignItems="center" borderBottom={`1px solid ${SEMAR_MAROON}`}>
                        <Typography variant="h5" color={SEMAR_MAROON} fontWeight="bold">
                            Accesibilidad
                        </Typography>
                        <IconButton onClick={() => setIsOpen(false)} size="small">
                            <SettingsIcon sx={{ color: SEMAR_MAROON }} />
                        </IconButton>
                    </Box>

                    <Box p={2}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<RestartAltIcon />}
                            onClick={resetStyles}
                            sx={{
                                backgroundColor: SEMAR_MAROON,
                                color: "white",
                                "&:hover": { backgroundColor: "#7a1c38" }
                            }}
                        >
                            Restablecer
                        </Button>
                    </Box>

                    <Menu iconShape="square">
                        {/* 1. Cambiar escala de grises */}
                        <MenuItem
                            icon={<ContrastIcon />}
                            onClick={toggleGrayscale}
                            aria-pressed={isGrayscale}
                        >
                            Cambiar escala de grises
                        </MenuItem>

                        {/* 2. Usar un lector de pantalla */}
                        <MenuItem
                            icon={<HearingIcon />}
                            onClick={toggleScreenReader}
                            aria-pressed={screenReader}
                        >
                            Usar un lector de pantalla
                        </MenuItem>

                        {/* 3. Cambiar tamaño de cursor */}
                        <MenuItem
                            icon={<MouseIcon />}
                            onClick={toggleCursor}
                            aria-pressed={isCursorChanged}
                        >
                            Cambiar tamaño de cursor
                        </MenuItem>

                        {/* 4. Cambiar el contraste de color (High Contrast) */}
                        <MenuItem
                            icon={<ColorLensIcon />}
                            onClick={toggleHighContrast}
                            aria-pressed={isHighContrast}
                        >
                            Cambiar el contraste de color
                        </MenuItem>

                        {/* 5. Mascara de lectura */}
                        <MenuItem
                            icon={<VisibilityIcon />}
                            onClick={toggleReadingMask}
                            aria-pressed={readingMask}
                        >
                            Mascara de lectura
                        </MenuItem>

                        {/* 6. Guia de Lectura */}
                        <MenuItem
                            icon={<BorderHorizontalIcon />}
                            onClick={toggleReadingGuide}
                            aria-pressed={readingGuide}
                        >
                            Guia de Lectura
                        </MenuItem>

                        {/* 7. Fuente para dislexia (Toggle) */}
                        <MenuItem
                            icon={<FontDownloadIcon />}
                            onClick={toggleDyslexiaFont}
                            aria-pressed={isDyslexiaFont}
                        >
                            Fuente para dislexia
                        </MenuItem>

                        {/* 8. Espaciado vertical */}
                        <MenuItem
                            icon={<FormatLineSpacingIcon />}
                            onClick={toggleTextSpacingVertical}
                            aria-label={`Espaciado vertical. Nivel actual: ${textSpacingVertical}`}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                <Typography sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>Espaciado vertical</Typography>
                                <LevelIndicator level={textSpacingVertical} />
                            </Box>
                        </MenuItem>

                        {/* 9. Espaciado Horizontal */}
                        <MenuItem
                            icon={<TextFieldsIcon />}
                            onClick={toggleTextSpacingHorizontal}
                            aria-label={`Espaciado horizontal. Nivel actual: ${textSpacingHorizontal}`}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                <Typography sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>Espaciado Horizontal</Typography>
                                <LevelIndicator level={textSpacingHorizontal} />
                            </Box>
                        </MenuItem>

                        {/* 10. Cambiar tamaño (Font Size) */}
                        <Box display="flex" justifyContent="center" gap={1} my={1} px={3}>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={decreaseFont}
                                sx={{ backgroundColor: SEMAR_MAROON, minWidth: '40px' }}
                            >
                                <ZoomOutIcon fontSize="small" />
                            </Button>
                            <Typography variant="body2" color={SEMAR_MAROON} alignSelf="center">
                                Tamaño
                            </Typography>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={increaseFont}
                                sx={{ backgroundColor: SEMAR_MAROON, minWidth: '40px' }}
                            >
                                <ZoomInIcon fontSize="small" />
                            </Button>
                        </Box>

                        {/* 11. Resaltar Enlaces */}
                        <MenuItem
                            icon={<LinkIcon />}
                            onClick={toggleHighlightLinks}
                            aria-pressed={highlightLinks}
                        >
                            Resaltar Enlaces
                        </MenuItem>

                        {/* Extra: Modo Marina (SEMAR Colors) */}
                        <MenuItem
                            icon={<Brightness4Icon />}
                            onClick={toggleMarinaMode}
                            aria-pressed={isMarinaMode}
                        >
                            {isMarinaMode ? "Desactivar Modo Marina" : "Activar Modo Marina"}
                        </MenuItem>

                        {/* Extra: Quitar imagenes */}
                        <MenuItem
                            icon={<ImageNotSupportedIcon />}
                            onClick={toggleHideImages}
                            aria-pressed={hideImages}
                        >
                            {hideImages ? "Mostrar imágenes" : "Quitar imágenes"}
                        </MenuItem>

                    </Menu>
                </ProSidebar>
            </Box>

            <style>{`
        /* --- ESTILOS SEMAR --- */
        
        /* Define OpenDyslexic Font */
        @font-face {
            font-family: 'OpenDyslexic';
            src: url(${OpenDyslexicFont}) format('opentype');
            font-weight: normal;
            font-style: normal;
        }

        /* Modo Marina (SEMAR Official Colors) */
        body.marina-mode-accessibility {
          background-color: #ffffff !important;
          color: #333333 !important;
        }
        body.marina-mode-accessibility .MuiAppBar-root, 
        body.marina-mode-accessibility header,
        body.marina-mode-accessibility .topbar {
          background-color: #9d2449 !important; /* Maroon */
          color: #ffffff !important;
        }
        body.marina-mode-accessibility .MuiDrawer-paper,
        body.marina-mode-accessibility .sidebar {
           background-color: #f5f5f5 !important;
           color: #333 !important;
           border-right: 1px solid #ddd;
        }
        body.marina-mode-accessibility .MuiButton-contained {
            background-color: #b38e5d !important; /* Gold */
            color: #000 !important;
        }
        
        /* High Contrast */
        body.high-contrast-accessibility {
          background-color: #000000 !important;
          color: #FFFF00 !important;
          filter: contrast(150%);
        }
        body.high-contrast-accessibility * {
            background-color: #000000 !important;
            color: #FFFF00 !important;
            border-color: #FFFF00 !important;
        }

        /* Grayscale */
        body.grayscale-accessibility {
          filter: grayscale(100%);
        }

        /* Cursor */
        body.cursor-accessibility, 
        body.cursor-accessibility * {
          cursor: pointer !important;
          cursor: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMDAwMDAwIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgZD0iTTUuNSAzLjIxVjIwLjhjMCAuNDUuNTQuNjcuODUuMzVsNC44Ni00LjQ2YS41LjUgMCAwIDEgLjM1LS4xNWg2LjhjLjQ1IDAgLjY3LS41NC4zNS0uODVMNi4zNSAyLjM2YS41LjUgMCAwIDAtLjg1Ljg1eiIvPjwvc3ZnPg==') 16 16, auto !important;
        }

        /* Hide Images */
        body.hide-images-accessibility img {
          opacity: 0 !important;
          visibility: hidden !important;
        }
        
        /* Highlight Links */
        body.highlight-links-accessibility a,
        body.highlight-links-accessibility button,
        body.highlight-links-accessibility [role="button"] {
          text-decoration: underline !important;
          font-weight: bold !important;
          color: #000 !important;
          background-color: #ffeb3b !important;
          border: 2px solid #000 !important;
          padding: 2px 4px !important;
        }

        /* Text Spacing Vertical - Dynamic Levels */
        ${textSpacingVertical > 0 ? `
            body p, body h1, body h2, body h3, body h4, body h5, body h6, body li {
                line-height: ${vSpacing.lineHeight} !important;
                margin-bottom: ${vSpacing.marginBottom} !important;
            }
            body span, body a, body td, body th, body div.MuiTypography-root {
                line-height: ${vSpacing.lineHeight} !important;
            }
        ` : ''}

        /* Text Spacing Horizontal - Dynamic Levels */
        ${textSpacingHorizontal > 0 ? `
            body p, body h1, body h2, body h3, body h4, body h5, body h6, body li, body span, body a, body td, body th, body div.MuiTypography-root, body label, body input, body textarea, body button {
                letter-spacing: ${hSpacing.letterSpacing} !important;
                word-spacing: ${hSpacing.wordSpacing} !important;
            }
        ` : ''}

        /* PROTECT SIDEBAR FROM SPACING CHANGES */
        #accessibility-sidebar * {
            letter-spacing: normal !important;
            word-spacing: normal !important;
            line-height: normal !important;
            margin-bottom: 0 !important; /* Reset margin for vertical spacing if needed, though vertical targets specific tags */
        }
        
        /* Ensure Typography in sidebar keeps its margin if needed, but usually menu items don't need bottom margin */
        #accessibility-sidebar .MuiTypography-root {
            margin-bottom: 0 !important;
        }

        /* Dyslexia Font Override */
        ${isDyslexiaFont ? `
            body, body * {
                font-family: 'OpenDyslexic', 'Comic Sans MS', sans-serif !important;
            }
        ` : ''}
      `}</style>
        </>
    );
};

export default AccessibilitySidebar;
