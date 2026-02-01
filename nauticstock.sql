-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 27-11-2025 a las 01:17:26
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `nauticstock`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `AddColumnIfNotExists` (IN `tableName` VARCHAR(255), IN `colName` VARCHAR(255), IN `colDef` VARCHAR(255))   BEGIN
    DECLARE colCount INT;
    SELECT COUNT(*) INTO colCount 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = tableName 
    AND column_name = colName;
    
    IF colCount = 0 THEN
        SET @s = CONCAT('ALTER TABLE `', tableName, '` ADD COLUMN `', colName, '` ', colDef);
        PREPARE stmt FROM @s;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_dashboard_stats` ()   BEGIN
                SELECT 
                    (SELECT COUNT(*) FROM products WHERE status = 0) as productos_total,
                    (SELECT COALESCE(SUM(quantity), 0) FROM products WHERE status = 0) as stock_total,
                    (SELECT COUNT(*) FROM user WHERE last_access >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)) as usuarios_activos,
                    (SELECT COUNT(*) FROM user WHERE status = 0) as usuarios_total,
                    (SELECT COUNT(*) FROM history WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as actividad_semanal;
            END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_product_details` (IN `p_id` INT)   BEGIN
                SELECT 
                    p.*,
                    b.name as brand_name,
                    c.name as category_name,
                    l.name as location_name,
                    pr.name as provider_name
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.id
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN locations l ON p.location_id = l.id
                LEFT JOIN provider pr ON p.provider_id = pr.id
                WHERE p.id = p_id;
            END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_log_event` (IN `p_action_type` VARCHAR(50), IN `p_performed_by` INT, IN `p_entity_type` VARCHAR(50), IN `p_entity_id` INT, IN `p_old_value` JSON, IN `p_new_value` JSON, IN `p_description` VARCHAR(255))   BEGIN
    INSERT INTO history (
        action_type, performed_by, entity_type, entity_id, old_value, new_value, description, created_at
    ) VALUES (
        p_action_type, p_performed_by, p_entity_type, p_entity_id, p_old_value, p_new_value, p_description, NOW()
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_product_history` (IN `p_action_type` VARCHAR(50), IN `p_performed_by` INT, IN `p_target_product` INT, IN `p_old_value` JSON, IN `p_new_value` JSON, IN `p_description` VARCHAR(255))   BEGIN
    INSERT INTO history (
        action_type, 
        performed_by, 
        target_product, 
        old_value, 
        new_value, 
        description, 
        created_at
    ) VALUES (
        p_action_type, 
        p_performed_by, 
        p_target_product, 
        p_old_value, 
        p_new_value, 
        p_description, 
        NOW()
    );
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `brands`
--

CREATE TABLE `brands` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT 'Nombre de la marca',
  `description` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=activa, 1=eliminada',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `brands`
--

INSERT INTO `brands` (`id`, `name`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Scotch', NULL, 0, '2025-11-22 19:03:56', '2025-11-24 02:18:14'),
(2, 'Genérico', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(3, 'Scribe', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(4, 'HP', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(5, 'Navigator', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(6, 'Maped', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(7, 'Swingline', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(8, 'Logitech', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(9, 'Resistol', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(10, 'Pelikan', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(11, 'Sharpie', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(12, 'Paper Mate', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(13, 'Baco', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(14, 'Wilson Jones', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(15, 'Fellowes', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(16, 'Personalizado', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(17, 'Duck Brand', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(18, 'Cloralex', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(19, 'Mr. Músculo', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(20, 'Lysol', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(21, 'Naval Clean', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(22, 'EcoClean', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(23, 'Kleenex', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(24, 'Ansell', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(25, 'Vileda', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(26, 'Scotch-Brite', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(27, 'HTH', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(28, 'Palmolive', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(29, 'Murilex', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(30, 'Comex', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(31, 'Pemex', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(32, 'Ariel', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(33, 'DeoxIT', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(34, 'Dow Corning', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(35, 'WD-40', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(36, 'Kester', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(37, 'Bondo', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(38, 'Panduit', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(39, 'Energizer', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(40, '3M', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(41, 'Fluke', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(42, 'Hakko', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(43, 'AmScope', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(44, 'Peak Electronic', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(45, 'Pop Rivet', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(46, 'Epson', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(47, 'Weller', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(48, 'Hunter Douglas', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(49, 'Vianney', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(50, 'Helvex', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(51, 'Yale', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(52, 'Stanley', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(53, 'Leviton', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(54, 'Phillips', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(55, 'Corona', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(56, 'Belden', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(57, 'TestBrand_1763951451540', NULL, 0, '2025-11-24 02:30:51', '2025-11-24 02:30:51'),
(58, 'TestBrand_Fixed_1763951635083', NULL, 0, '2025-11-24 02:33:55', '2025-11-24 02:33:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT 'Nombre de la categoría',
  `description` text DEFAULT NULL COMMENT 'Descripción de la categoría',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=activa, 1=eliminada',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Oficina', 'Artículos y suministros de oficina', 0, '2025-05-30 10:13:49', '2025-05-30 10:13:49'),
(2, 'Ferretería', 'Herramientas y materiales de ferretería', 0, '2025-05-30 10:13:49', '2025-05-30 10:13:49'),
(3, 'Limpieza', 'Productos de limpieza y mantenimiento', 0, '2025-05-30 10:13:49', '2025-05-30 10:13:49'),
(4, 'Electrónica', 'Componentes y equipos electrónicos', 0, '2025-05-30 10:13:49', '2025-05-30 10:13:49'),
(5, 'Mantenimiento', 'Materiales para mantenimiento general', 0, '2025-05-30 10:13:49', '2025-05-30 10:13:49'),
(6, 'Seguridad', 'Equipos y materiales de seguridad', 0, '2025-05-30 10:13:49', '2025-05-30 10:13:49'),
(7, 'Herramientas', 'Herramientas de trabajo', 0, '2025-05-30 10:13:49', '2025-05-30 10:13:49'),
(8, 'Consumibless', 'Materiales consumibless', 0, '2025-05-30 10:13:49', '2025-11-24 02:27:37'),
(9, 'AAAA', 'AAA', 1, '2025-05-30 11:33:08', '2025-05-30 15:09:14'),
(10, 'aaaaaaaaaa', 'aaa', 1, '2025-05-30 11:54:14', '2025-05-30 15:09:21'),
(11, 'aaaaaaaaaaa', NULL, 1, '2025-05-30 11:54:24', '2025-05-30 15:09:24'),
(13, 'jaeje', 'jaja', 1, '2025-05-30 14:22:40', '2025-05-30 15:09:27'),
(15, 'aa', 'aa', 1, '2025-05-30 15:09:52', '2025-05-30 15:10:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `faqs`
--

CREATE TABLE `faqs` (
  `id` int(10) NOT NULL,
  `question` varchar(255) NOT NULL,
  `answer` text NOT NULL,
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `category_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `faqs`
--

INSERT INTO `faqs` (`id`, `question`, `answer`, `status`, `created_at`, `last_updated`, `category_id`) VALUES
(1, '¿Cómo puedo rastrear mi pedido?', 'Una vez que tu pedido haya sido enviado, recibirás un correo electrónico con un número de seguimiento. Puedes usar este número en nuestra página de rastreo para ver el estado de tu envío.', 1, '2025-11-23 22:06:11', '2025-11-24 01:29:51', 2),
(2, '¿Cuáles son los métodos de pago aceptados?', 'Aceptamos tarjetas de crédito (Visa, MasterCard, American Express), PayPal y transferencias bancarias.', 1, '2025-11-23 22:06:11', '2025-11-23 22:06:11', 3),
(3, '¿Puedo devolver un producto si no estoy satisfecho?', 'Sí, aceptamos devoluciones dentro de los 30 días posteriores a la compra, siempre y cuando el producto esté en su estado original y con el embalaje intacto.', 1, '2025-11-23 22:06:11', '2025-11-23 22:06:11', 4),
(4, '¿Tienen garantía los productos?', 'Sí, todos nuestros productos cuentan con garantía de fábrica. La duración de la garantía varía según el fabricante y el tipo de producto.', 1, '2025-11-23 22:06:11', '2025-11-23 22:06:11', 5),
(5, '¿Cómo contacto a soporte técnico?', 'Puedes contactarnos a través del formulario de contacto en nuestro sitio web o enviando un correo a soporte@nauticstock.com.', 1, '2025-11-23 22:06:11', '2025-11-23 22:06:11', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `faq_categories`
--

CREATE TABLE `faq_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `faq_categories`
--

INSERT INTO `faq_categories` (`id`, `name`, `created_at`) VALUES
(1, 'General', '2025-11-23 22:06:11'),
(2, 'Envíos', '2025-11-23 22:06:11'),
(3, 'Pagos', '2025-11-23 22:06:11'),
(4, 'Devoluciones', '2025-11-23 22:06:11'),
(5, 'Productos', '2025-11-23 22:06:11');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `history`
--

CREATE TABLE `history` (
  `id` int(11) NOT NULL,
  `action_type` varchar(255) NOT NULL,
  `performed_by` int(11) NOT NULL COMMENT 'ID del admin que la ejecutó',
  `target_user` int(11) DEFAULT NULL COMMENT 'ID del usuario afectado',
  `target_product` int(11) DEFAULT NULL COMMENT 'ID del producto afectado',
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `old_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Valores antes (JSON)' CHECK (json_valid(`old_value`)),
  `new_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Valores después (JSON)' CHECK (json_valid(`new_value`)),
  `description` varchar(255) DEFAULT NULL COMMENT 'Descripción breve',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `history`
--

INSERT INTO `history` (`id`, `action_type`, `performed_by`, `target_user`, `target_product`, `entity_type`, `entity_id`, `old_value`, `new_value`, `description`, `created_at`) VALUES
(1, 'Usuario Deshabilitado', 12, 11, NULL, 'user', 11, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 11', '2025-05-28 21:49:33'),
(2, 'Usuario Rehabilitado', 12, 11, NULL, 'user', 11, '{\"status\":1}', '{\"status\":0}', 'Rehabilito usuario 11', '2025-05-28 21:49:36'),
(3, 'Usuario Creado', 12, NULL, NULL, NULL, NULL, NULL, '{\"name\":\"Hector Daniel Martinez Figueroa\",\"password\":\"12345678\",\"account\":\"20168585\",\"email\":\"hmartinez@ucol.mx\",\"ranks\":\"Sargento\",\"roleId\":3,\"status\":0}', 'Creó usuario 19', '2025-05-28 21:50:23'),
(4, 'Usuario Creado', 12, NULL, NULL, NULL, NULL, NULL, '{\"name\":\"Maximiliano Alexander Mendoza Lopez\",\"password\":\"12345678\",\"account\":\"12312312312312\",\"email\":\"mmendoza34@ucol.es\",\"ranks\":\"Sargento\",\"roleId\":3,\"status\":0}', 'Creó usuario 20', '2025-05-28 22:09:09'),
(5, 'Producto Creado', 12, NULL, NULL, NULL, NULL, NULL, '{\"part_number\":\"HP-L26500-001\",\"description\":\"Monitor HP 24 pulgadas Full HD con conexión HDMI y VGA\",\"brand\":\"HP\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":50,\"price\":3500,\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Distribuidora TecnoMax\",\"status\":0}', 'Creó producto HP-L26500-001', '2025-05-29 00:45:33'),
(6, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":91,\"part_number\":\"HP-L26500-001\",\"description\":\"Monitor HP 24 pulgadas Full HD con conexión HDMI y VGA\",\"category\":\"Oficina\",\"brand\":\"HP\",\"quantity\":15,\"min_stock\":5,\"max_stock\":50,\"price\":\"3500.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Distribuidora TecnoMax\",\"status\":0,\"created_at\":\"2025-05-29T06:45:33.000Z\",\"updated_at\":\"2025-05-29T06:45:33.000Z\"}', '{\"status\":1}', 'Actualizó producto HP-L26500-001', '2025-05-29 01:27:57'),
(7, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":15,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T05:26:56.000Z\"}', '{\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"brand\":\"Scotch\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"Papelería Naval\",\"status\":0}', 'Actualizó producto OFF-001', '2025-05-29 01:28:25'),
(8, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":15,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:28:25.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-001', '2025-05-29 01:28:38'),
(9, 'Producto Eliminado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T05:26:56.000Z\"}', NULL, 'Eliminó producto OFF-002', '2025-05-29 01:29:02'),
(10, 'Producto Actualizado', 12, NULL, 3, 'products', 3, '{\"id\":3,\"part_number\":\"OFF-003\",\"description\":\"Cinta de Refrigeración\",\"category\":\"Oficina\",\"brand\":\"Genérico\",\"quantity\":10,\"min_stock\":3,\"max_stock\":20,\"price\":\"45.00\",\"location\":\"Almacén Oficina A-2\",\"supplier\":\"Suministros Técnicos\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T05:26:56.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-003', '2025-05-29 01:29:15'),
(11, 'Producto Actualizado', 12, NULL, 4, 'products', 4, '{\"id\":4,\"part_number\":\"OFF-004\",\"description\":\"Cintas Canela\",\"category\":\"Oficina\",\"brand\":\"Genérico\",\"quantity\":12,\"min_stock\":4,\"max_stock\":25,\"price\":\"22.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T05:26:56.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-004', '2025-05-29 01:29:16'),
(12, 'Producto Actualizado', 12, NULL, 5, 'products', 5, '{\"id\":5,\"part_number\":\"OFF-005\",\"description\":\"Libretas Pasta Dura\",\"category\":\"Oficina\",\"brand\":\"Scribe\",\"quantity\":25,\"min_stock\":10,\"max_stock\":50,\"price\":\"35.00\",\"location\":\"Almacén Oficina B-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T05:26:56.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-005', '2025-05-29 01:29:17'),
(13, 'Producto Actualizado', 12, NULL, 6, 'products', 6, '{\"id\":6,\"part_number\":\"OFF-006\",\"description\":\"Tintas para Impresora\",\"category\":\"Oficina\",\"brand\":\"HP\",\"quantity\":8,\"min_stock\":3,\"max_stock\":15,\"price\":\"850.00\",\"location\":\"Almacén Oficina C-1\",\"supplier\":\"Tech Supplies\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T05:26:56.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-006', '2025-05-29 01:29:18'),
(14, 'Producto Actualizado', 12, NULL, 7, 'products', 7, '{\"id\":7,\"part_number\":\"OFF-007\",\"description\":\"Broches Metálicos para Archivo\",\"category\":\"Oficina\",\"brand\":\"Genérico\",\"quantity\":50,\"min_stock\":20,\"max_stock\":100,\"price\":\"5.00\",\"location\":\"Almacén Oficina A-3\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T05:26:56.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-007', '2025-05-29 01:29:19'),
(15, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":91,\"part_number\":\"HP-L26500-001\",\"description\":\"Monitor HP 24 pulgadas Full HD con conexión HDMI y VGA\",\"brand\":\"HP\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":50,\"price\":\"3500.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Distribuidora TecnoMax\",\"status\":1,\"created_at\":\"2025-05-29T06:45:33.000Z\",\"updated_at\":\"2025-05-29T07:27:57.000Z\"}', '{\"status\":0}', 'Actualizó producto HP-L26500-001', '2025-05-29 01:39:57'),
(16, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":91,\"part_number\":\"HP-L26500-001\",\"description\":\"Monitor HP 24 pulgadas Full HD con conexión HDMI y VGA\",\"brand\":\"HP\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":50,\"price\":\"3500.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Distribuidora TecnoMax\",\"status\":0,\"created_at\":\"2025-05-29T06:45:33.000Z\",\"updated_at\":\"2025-05-29T07:39:57.000Z\"}', '{\"status\":1}', 'Actualizó producto HP-L26500-001', '2025-05-29 01:39:58'),
(17, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"brand\":\"Scotch\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:30:35.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-001', '2025-05-29 01:40:18'),
(18, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"brand\":\"Scotch\",\"category\":\"Oficina\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:30:47.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-002', '2025-05-29 01:40:19'),
(19, 'Producto Actualizado', 12, NULL, 3, 'products', 3, '{\"id\":3,\"part_number\":\"OFF-003\",\"description\":\"Cinta de Refrigeración\",\"brand\":\"Genérico\",\"category\":\"Oficina\",\"quantity\":10,\"min_stock\":3,\"max_stock\":20,\"price\":\"45.00\",\"location\":\"Almacén Oficina A-2\",\"supplier\":\"Suministros Técnicos\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:30:49.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-003', '2025-05-29 01:40:20'),
(20, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":91,\"part_number\":\"HP-L26500-001\",\"description\":\"Monitor HP 24 pulgadas Full HD con conexión HDMI y VGA\",\"brand\":\"HP\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":50,\"price\":\"3500.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Distribuidora TecnoMax\",\"status\":1,\"created_at\":\"2025-05-29T06:45:33.000Z\",\"updated_at\":\"2025-05-29T07:39:58.000Z\"}', '{\"status\":0}', 'Actualizó producto HP-L26500-001', '2025-05-29 01:40:34'),
(21, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"brand\":\"Scotch\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"Papelería Naval\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:40:18.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-001', '2025-05-29 01:40:35'),
(22, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"brand\":\"Scotch\",\"category\":\"Oficina\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:40:19.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-002', '2025-05-29 01:40:36'),
(23, 'Producto Actualizado', 12, NULL, 3, 'products', 3, '{\"id\":3,\"part_number\":\"OFF-003\",\"description\":\"Cinta de Refrigeración\",\"brand\":\"Genérico\",\"category\":\"Oficina\",\"quantity\":10,\"min_stock\":3,\"max_stock\":20,\"price\":\"45.00\",\"location\":\"Almacén Oficina A-2\",\"supplier\":\"Suministros Técnicos\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:40:20.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-003', '2025-05-29 01:40:37'),
(24, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":91,\"part_number\":\"HP-L26500-001\",\"description\":\"Monitor HP 24 pulgadas Full HD con conexión HDMI y VGA\",\"brand\":\"HP\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":50,\"price\":\"3500.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Distribuidora TecnoMax\",\"status\":0,\"created_at\":\"2025-05-29T06:45:33.000Z\",\"updated_at\":\"2025-05-29T07:40:34.000Z\"}', '{\"status\":1}', 'Actualizó producto HP-L26500-001', '2025-05-29 01:41:27'),
(25, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"brand\":\"Scotch\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:40:35.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-001', '2025-05-29 01:41:29'),
(26, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"brand\":\"Scotch\",\"category\":\"Oficina\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:40:36.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-002', '2025-05-29 01:41:29'),
(27, 'Producto Actualizado', 12, NULL, 3, 'products', 3, '{\"id\":3,\"part_number\":\"OFF-003\",\"description\":\"Cinta de Refrigeración\",\"brand\":\"Genérico\",\"category\":\"Oficina\",\"quantity\":10,\"min_stock\":3,\"max_stock\":20,\"price\":\"45.00\",\"location\":\"Almacén Oficina A-2\",\"supplier\":\"Suministros Técnicos\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:40:37.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-003', '2025-05-29 01:41:30'),
(28, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":91,\"part_number\":\"HP-L26500-001\",\"description\":\"Monitor HP 24 pulgadas Full HD con conexión HDMI y VGA\",\"brand\":\"HP\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":50,\"price\":\"3500.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Distribuidora TecnoMax\",\"status\":1,\"created_at\":\"2025-05-29T06:45:33.000Z\",\"updated_at\":\"2025-05-29T07:41:27.000Z\"}', '{\"status\":0}', 'Actualizó producto HP-L26500-001', '2025-05-29 01:41:36'),
(29, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"brand\":\"Scotch\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"Papelería Naval\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:41:29.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-001', '2025-05-29 01:41:37'),
(30, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"brand\":\"Scotch\",\"category\":\"Oficina\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:41:29.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-002', '2025-05-29 01:41:38'),
(31, 'Producto Actualizado', 12, NULL, 3, 'products', 3, '{\"id\":3,\"part_number\":\"OFF-003\",\"description\":\"Cinta de Refrigeración\",\"brand\":\"Genérico\",\"category\":\"Oficina\",\"quantity\":10,\"min_stock\":3,\"max_stock\":20,\"price\":\"45.00\",\"location\":\"Almacén Oficina A-2\",\"supplier\":\"Suministros Técnicos\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:41:30.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-003', '2025-05-29 01:41:38'),
(32, 'Usuario Deshabilitado', 12, 11, NULL, 'user', 11, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 11', '2025-05-29 01:48:40'),
(33, 'Usuario Rehabilitado', 12, 11, NULL, 'user', 11, '{\"status\":1}', '{\"status\":0}', 'Rehabilito usuario 11', '2025-05-29 01:48:41'),
(34, 'Usuario Deshabilitado', 12, 11, NULL, 'user', 11, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 11', '2025-05-29 01:48:42'),
(35, 'Usuario Rehabilitado', 12, 11, NULL, 'user', 11, '{\"status\":1}', '{\"status\":0}', 'Rehabilito usuario 11', '2025-05-29 01:48:43'),
(36, 'Usuario Deshabilitado', 12, 11, NULL, 'user', 11, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 11', '2025-05-29 01:48:44'),
(37, 'Usuario Rehabilitado', 12, 11, NULL, 'user', 11, '{\"status\":1}', '{\"status\":0}', 'Rehabilito usuario 11', '2025-05-29 01:48:45'),
(38, 'Usuario Deshabilitado', 12, 18, NULL, 'user', 18, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 18', '2025-05-29 02:36:49'),
(39, 'Contraseña Propia Cambiada', 12, 12, NULL, 'user', 12, NULL, NULL, 'Usuario 12 cambió su propia contraseña', '2025-05-29 02:48:18'),
(40, 'Usuario Actualizado', 12, 11, NULL, 'user', 11, '{\"name\":\"Maximiliano Mendoza Lopez\"}', '{\"name\":\"Maximiliano Mendoza\"}', 'Actualizó datos de usuario 11', '2025-05-29 02:54:32'),
(41, 'Usuario Deshabilitado', 12, 11, NULL, 'user', 11, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 11', '2025-05-29 02:55:25'),
(42, 'Usuario Rehabilitado', 12, 11, NULL, 'user', 11, '{\"status\":1}', '{\"status\":0}', 'Rehabilito usuario 11', '2025-05-29 02:55:26'),
(43, 'Usuario Rehabilitado', 12, 18, NULL, 'user', 18, '{\"status\":1}', '{\"status\":0}', 'Rehabilito usuario 18', '2025-05-29 03:00:15'),
(46, 'Usuario Actualizado', 12, NULL, NULL, NULL, NULL, '{\"email\":\"hmartinez@ucol.mx\"}', '{\"email\":\"hmartinez@ucol.com\"}', 'Actualizó datos de usuario 19', '2025-05-29 03:02:48'),
(47, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"brand\":\"Scotch\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:41:37.000Z\"}', '{\"quantity\":14}', 'Actualizó producto OFF-001', '2025-05-29 03:03:17'),
(48, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":91,\"part_number\":\"HP-L26500-001\",\"description\":\"Monitor HP 24 pulgadas Full HD con conexión HDMI y VGA\",\"brand\":\"HP\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":50,\"price\":\"3500.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Distribuidora TecnoMax\",\"status\":0,\"created_at\":\"2025-05-29T06:45:33.000Z\",\"updated_at\":\"2025-05-29T07:41:36.000Z\"}', '{\"status\":1}', 'Actualizó producto HP-L26500-001', '2025-05-29 03:03:31'),
(49, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":91,\"part_number\":\"HP-L26500-001\",\"description\":\"Monitor HP 24 pulgadas Full HD con conexión HDMI y VGA\",\"brand\":\"HP\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":50,\"price\":\"3500.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Distribuidora TecnoMax\",\"status\":1,\"created_at\":\"2025-05-29T06:45:33.000Z\",\"updated_at\":\"2025-05-29T09:03:31.000Z\"}', '{\"status\":0}', 'Actualizó producto HP-L26500-001', '2025-05-29 03:03:42'),
(50, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":91,\"part_number\":\"HP-L26500-001\",\"description\":\"Monitor HP 24 pulgadas Full HD con conexión HDMI y VGA\",\"brand\":\"HP\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":50,\"price\":\"3500.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Distribuidora TecnoMax\",\"status\":0,\"created_at\":\"2025-05-29T06:45:33.000Z\",\"updated_at\":\"2025-05-29T09:03:42.000Z\"}', '{\"part_number\":\"HP-L26500-001\",\"description\":\"Monitor HP 24 pulgadas Full HD con conexión HDMI y VGA\",\"brand\":\"HP\",\"category\":\"Oficina\",\"quantity\":15,\"min_stock\":5,\"max_stock\":30,\"price\":\"3500.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Distribuidora TecnoMax\",\"status\":0}', 'Actualizó producto HP-L26500-001', '2025-05-29 03:03:57'),
(52, 'Producto Creado', 12, NULL, NULL, NULL, NULL, NULL, '{\"part_number\":\"HP-L26500-001\",\"description\":\"aaaaaaa\",\"brand\":\"HP\",\"category\":\"Oficina\",\"quantity\":12,\"min_stock\":4,\"max_stock\":15,\"price\":3588,\"location\":\"Almacén Principal B-1\",\"supplier\":\"Distribuidora TecnoMax\",\"status\":0}', 'Creó producto HP-L26500-001', '2025-05-29 03:05:10'),
(54, 'Usuario Deshabilitado', 12, 11, NULL, 'user', 11, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 11', '2025-05-29 04:02:38'),
(55, 'Usuario Rehabilitado', 12, 11, NULL, 'user', 11, '{\"status\":1}', '{\"status\":0}', 'Rehabilito usuario 11', '2025-05-29 04:02:39'),
(56, 'Usuario Actualizado', 12, 11, NULL, 'user', 11, '{\"account\":20156537}', '{\"account\":\"20156536\"}', 'Actualizó datos de usuario 11', '2025-05-29 04:02:46'),
(57, 'Usuario Creado', 12, NULL, NULL, NULL, NULL, NULL, '{\"name\":\"Maximiliano Mendoza Lopez\",\"password\":\"12345678\",\"account\":\"2015653712\",\"email\":\"maxiova1234@gmail.com\",\"ranks\":\"Capitan\",\"roleId\":2,\"status\":0}', 'Creó usuario 21', '2025-05-29 04:03:05'),
(58, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":14,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T09:03:17.000Z\"}', '{\"quantity\":13}', 'Actualizó producto OFF-001', '2025-05-29 04:03:20'),
(59, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":13,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T10:03:20.000Z\"}', '{\"quantity\":14}', 'Actualizó producto OFF-001', '2025-05-29 04:03:25'),
(60, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":14,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T10:03:25.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-001', '2025-05-29 04:03:27'),
(61, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":14,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"Papelería Naval\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T10:03:27.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-001', '2025-05-29 04:03:30'),
(62, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":14,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T10:03:30.000Z\"}', '{\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"brand\":\"Scotch\",\"category\":\"Oficina\",\"quantity\":14,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Depósito Temporal\",\"supplier\":\"Papelería Naval\",\"status\":0}', 'Actualizó producto OFF-001', '2025-05-29 04:03:43'),
(63, 'Contraseña Propia Cambiada', 12, 12, NULL, 'user', 12, NULL, NULL, 'Usuario 12 cambió su propia contraseña', '2025-05-29 04:03:57'),
(64, 'Usuario Eliminado', 12, NULL, NULL, NULL, NULL, '{\"id\":21,\"name\":\"Maximiliano Mendoza Lopez\",\"password\":\"$2b$10$zIwiwp0bpBdjzOwp4NLxwuWZzVMGxxwDVHc/yuBqEpivS3j7GiRnm\",\"account\":2015653712,\"email\":\"maxiova1234@gmail.com\",\"ranks\":\"Capitan\",\"status\":0,\"registration\":\"2025-05-29T10:03:05.000Z\",\"last_access\":null,\"profile_pic\":null,\"roleId\":2}', NULL, 'Eliminó usuario 21 (Maximiliano Mendoza Lopez)', '2025-05-29 04:04:24'),
(65, 'Producto Creado', 12, NULL, NULL, NULL, NULL, NULL, '{\"part_number\":\"HP-L26500-001\",\"description\":\"aaaaaa\",\"brand\":\"HP\",\"category\":\"Electrónica\",\"quantity\":12,\"min_stock\":10,\"max_stock\":42,\"price\":34512,\"location\":\"Laboratorio\",\"supplier\":\"Papelería Naval\",\"status\":0}', 'Creó producto HP-L26500-001', '2025-05-29 04:05:02'),
(66, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":93,\"part_number\":\"HP-L26500-001\",\"description\":\"aaaaaa\",\"category\":\"Electrónica\",\"brand\":\"HP\",\"quantity\":12,\"min_stock\":10,\"max_stock\":42,\"price\":\"34512.00\",\"location\":\"Laboratorio\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T10:05:02.000Z\",\"updated_at\":\"2025-05-29T10:05:02.000Z\"}', '{\"status\":1}', 'Actualizó producto HP-L26500-001', '2025-05-29 04:05:09'),
(67, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":93,\"part_number\":\"HP-L26500-001\",\"description\":\"aaaaaa\",\"category\":\"Electrónica\",\"brand\":\"HP\",\"quantity\":12,\"min_stock\":10,\"max_stock\":42,\"price\":\"34512.00\",\"location\":\"Laboratorio\",\"supplier\":\"Papelería Naval\",\"status\":1,\"created_at\":\"2025-05-29T10:05:02.000Z\",\"updated_at\":\"2025-05-29T10:05:09.000Z\"}', '{\"status\":0}', 'Actualizó producto HP-L26500-001', '2025-05-29 04:05:10'),
(68, 'Producto Eliminado', 12, NULL, NULL, NULL, NULL, '{\"id\":93,\"part_number\":\"HP-L26500-001\",\"description\":\"aaaaaa\",\"category\":\"Electrónica\",\"brand\":\"HP\",\"quantity\":12,\"min_stock\":10,\"max_stock\":42,\"price\":\"34512.00\",\"location\":\"Laboratorio\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T10:05:02.000Z\",\"updated_at\":\"2025-05-29T10:05:10.000Z\"}', NULL, 'Eliminó producto HP-L26500-001', '2025-05-29 04:05:12'),
(69, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":14,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Depósito Temporal\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T10:03:43.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-001', '2025-05-29 04:08:48'),
(70, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":14,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Depósito Temporal\",\"supplier\":\"Papelería Naval\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T10:08:48.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-001', '2025-05-29 04:08:55'),
(71, 'Usuario Deshabilitado', 12, 18, NULL, 'user', 18, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 18', '2025-05-29 04:10:58'),
(72, 'Usuario Rehabilitado', 12, 18, NULL, 'user', 18, '{\"status\":1}', '{\"status\":0}', 'Rehabilito usuario 18', '2025-05-29 04:11:38'),
(73, 'Usuario Creado', 12, NULL, NULL, NULL, NULL, NULL, '{\"name\":\"Diego Herencia\",\"password\":\"12345678\",\"account\":\"214748364712\",\"email\":\"maxiova123@gmail.com\",\"ranks\":\"Capitan\",\"roleId\":2,\"status\":0}', 'Creó usuario 22', '2025-05-29 04:12:19'),
(74, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":14,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Depósito Temporal\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T10:08:55.000Z\"}', '{\"quantity\":18}', 'Actualizó producto OFF-001', '2025-05-29 04:12:57'),
(75, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":18,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Depósito Temporal\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T10:12:57.000Z\"}', '{\"quantity\":17}', 'Actualizó producto OFF-001', '2025-05-29 04:13:29'),
(76, 'Producto Actualizado', 18, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":17,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Depósito Temporal\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T10:13:29.000Z\"}', '{\"quantity\":18}', 'Actualizó producto OFF-001', '2025-05-29 04:13:42'),
(77, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":18,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Depósito Temporal\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T10:13:42.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-001', '2025-05-29 04:41:02'),
(78, 'Usuario Deshabilitado', 12, 18, NULL, 'user', 18, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 18', '2025-05-29 05:18:39'),
(79, 'Usuario Rehabilitado', 12, 18, NULL, 'user', 18, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 18', '2025-05-29 05:19:26'),
(80, 'Producto Actualizado', 18, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":18,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Depósito Temporal\",\"supplier\":\"Papelería Naval\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T10:41:02.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-001', '2025-05-29 05:19:55'),
(81, 'Usuario Deshabilitado', 12, 18, NULL, 'user', 18, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 18', '2025-05-29 05:20:02'),
(82, 'Usuario Rehabilitado', 12, 18, NULL, 'user', 18, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 18', '2025-05-29 05:20:30'),
(83, 'Usuario Deshabilitado', 12, 18, NULL, 'user', 18, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 18', '2025-05-29 05:24:10'),
(84, 'Usuario Rehabilitado', 12, 18, NULL, 'user', 18, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 18', '2025-05-29 05:24:19'),
(85, 'Contraseña Propia Cambiada', 12, 12, NULL, 'user', 12, NULL, NULL, 'Usuario 12 cambió su propia contraseña', '2025-05-29 05:34:42'),
(86, 'Usuario Deshabilitado', 12, 11, NULL, 'user', 11, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 11', '2025-05-29 21:14:27'),
(87, 'Usuario Rehabilitado', 12, 11, NULL, 'user', 11, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 11', '2025-05-29 21:14:27'),
(88, 'Usuario Deshabilitado', 12, 13, NULL, 'user', 13, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 13', '2025-05-29 21:14:29'),
(89, 'Usuario Rehabilitado', 12, 13, NULL, 'user', 13, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 13', '2025-05-29 21:14:29'),
(90, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":18,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Depósito Temporal\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T11:19:55.000Z\"}', '{\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"brand\":\"Scotch\",\"category\":\"Oficina\",\"quantity\":12,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Depósito Temporal\",\"supplier\":\"Papelería Naval\",\"status\":0}', 'Actualizó producto OFF-001', '2025-05-29 21:15:16'),
(91, 'Contraseña Cambiada', 12, 13, NULL, 'user', 13, NULL, NULL, 'Cambió contraseña de usuario 13', '2025-05-29 21:25:26'),
(92, 'Contraseña Propia Cambiada', 13, 13, NULL, 'user', 13, NULL, NULL, 'Usuario 13 cambió su propia contraseña', '2025-05-29 21:26:24'),
(93, 'Rol Cambiado', 12, 11, NULL, 'user', 11, '{\"roleId\":2}', '{\"roleId\":3}', 'Cambió rol de usuario 11 de Capturista a Consultor', '2025-05-29 21:43:21'),
(94, 'Rol Cambiado', 12, 11, NULL, 'user', 11, '{\"roleId\":3}', '{\"roleId\":2}', 'Cambió rol de usuario 11 de Consultor a Capturista', '2025-05-30 01:52:34'),
(95, 'Usuario Deshabilitado', 12, 11, NULL, 'user', 11, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 11', '2025-05-30 02:18:10'),
(96, 'Usuario Rehabilitado', 12, 11, NULL, 'user', 11, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 11', '2025-05-30 02:18:11'),
(97, 'Usuario Deshabilitado', 12, 11, NULL, 'user', 11, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 11', '2025-05-30 02:18:12'),
(98, 'Usuario Rehabilitado', 12, 11, NULL, 'user', 11, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 11', '2025-05-30 02:18:25'),
(99, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":12,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Depósito Temporal\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T03:15:16.000Z\"}', '{\"quantity\":22}', 'Actualizó producto OFF-001', '2025-05-30 02:19:04'),
(100, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":22,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Depósito Temporal\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T08:19:04.000Z\"}', '{\"quantity\":12}', 'Actualizó producto OFF-001', '2025-05-30 02:19:15'),
(101, 'Producto Creado', 12, NULL, NULL, NULL, NULL, NULL, '{\"part_number\":\"OFF-001\",\"description\":\"aaaaaaaaaa\",\"brand\":\"Scotch\",\"category\":\"Mantenimiento\",\"quantity\":12,\"min_stock\":3,\"max_stock\":2,\"price\":4131,\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0}', 'Creó producto OFF-001', '2025-05-30 03:07:15'),
(102, 'Producto Eliminado', 12, NULL, NULL, NULL, NULL, '{\"id\":94,\"part_number\":\"OFF-001\",\"description\":\"aaaaaaaaaa\",\"category\":\"Mantenimiento\",\"brand\":\"Scotch\",\"quantity\":12,\"min_stock\":3,\"max_stock\":2,\"price\":\"4131.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-30T09:07:15.000Z\",\"updated_at\":\"2025-05-30T09:07:15.000Z\"}', NULL, 'Eliminó producto OFF-001', '2025-05-30 03:09:02'),
(103, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":12,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Depósito Temporal\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T08:19:15.000Z\"}', '{\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"brand\":\"Scotch\",\"category\":\"Oficina\",\"quantity\":12,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-1\",\"supplier\":\"Papelería Naval\",\"status\":0}', 'Actualizó producto OFF-001', '2025-05-30 05:28:33'),
(104, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":12,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T11:28:33.000Z\"}', '{\"quantity\":11}', 'Actualizó producto OFF-001', '2025-05-30 05:28:41'),
(105, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":11,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T11:28:41.000Z\"}', '{\"quantity\":12}', 'Actualizó producto OFF-001', '2025-05-30 05:28:43'),
(106, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":12,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T11:28:43.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-001', '2025-05-30 05:28:44'),
(107, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":12,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-1\",\"supplier\":\"Papelería Naval\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T11:28:44.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-001', '2025-05-30 05:28:49'),
(108, 'Ubicación Actualizada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":5,\\\"name\\\":\\\"Almacén Oficina A-0\\\",\\\"description\\\":\\\"Almacén de oficina sección A-1\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T10:13:49.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T11:29:57.000Z\\\"}\"', '\"{\\\"name\\\":\\\"Almacén Oficina A-1\\\",\\\"description\\\":\\\"Almacén de oficina sección A-1\\\"}\"', 'Actualizó ubicación Almacén Oficina A-1', '2025-05-30 05:32:44'),
(109, 'Categoría Actualizada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":8,\\\"name\\\":\\\"Consumible\\\",\\\"description\\\":\\\"Materiales consumibles\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T10:13:49.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T11:29:33.000Z\\\"}\"', '\"{\\\"name\\\":\\\"Consumibles\\\",\\\"description\\\":\\\"Materiales consumibles\\\"}\"', 'Actualizó categoría Consumibles', '2025-05-30 05:33:02'),
(110, 'Categoría Creada', 12, NULL, NULL, NULL, NULL, NULL, '\"{\\\"name\\\":\\\"AAAA\\\",\\\"description\\\":\\\"AAA\\\"}\"', 'Creó categoría AAAA', '2025-05-30 05:33:08'),
(111, 'Ubicación Creada', 12, NULL, NULL, NULL, NULL, NULL, '\"{\\\"name\\\":\\\"EEEEE\\\",\\\"description\\\":\\\"EEEEE\\\"}\"', 'Creó ubicación EEEEE', '2025-05-30 05:33:22'),
(112, 'Ubicación Eliminada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":10,\\\"name\\\":\\\"EEEEE\\\",\\\"description\\\":\\\"EEEEE\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T11:33:22.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T11:33:22.000Z\\\"}\"', NULL, 'Eliminó ubicación EEEEE', '2025-05-30 05:33:48'),
(113, 'Producto Eliminado', 12, NULL, NULL, NULL, NULL, '{\"id\":1,\"part_number\":\"OFF-001\",\"description\":\"Cintas Masking-Tape\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":12,\"min_stock\":5,\"max_stock\":30,\"price\":\"25.00\",\"location\":\"Almacén Principal A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T11:28:49.000Z\"}', NULL, 'Eliminó producto OFF-001', '2025-05-30 05:33:58'),
(114, 'Usuario Eliminado', 12, NULL, NULL, NULL, NULL, '{\"id\":22,\"name\":\"Diego Herencia\",\"password\":\"$2b$10$8DGKe7kq45HJ9z/1K8DHWeDBhvOVDALJFYeebA6g52h24.jIrXz6i\",\"account\":2147483647,\"email\":\"maxiova123@gmail.com\",\"ranks\":\"Capitan\",\"status\":0,\"registration\":\"2025-05-29T10:12:19.000Z\",\"last_access\":null,\"profile_pic\":null,\"roleId\":2}', NULL, 'Eliminó usuario 22 (Diego Herencia)', '2025-05-30 05:34:05'),
(115, 'Categoría Eliminada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":9,\\\"name\\\":\\\"AAAA\\\",\\\"description\\\":\\\"AAA\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T11:33:08.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T11:33:08.000Z\\\"}\"', NULL, 'Eliminó categoría AAAA', '2025-05-30 05:34:21'),
(116, 'Usuario Deshabilitado', 12, 11, NULL, 'user', 11, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 11', '2025-05-30 05:50:02'),
(117, 'Usuario Rehabilitado', 12, 11, NULL, 'user', 11, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 11', '2025-05-30 05:50:03'),
(118, 'Ubicación Actualizada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":5,\\\"name\\\":\\\"Almacén Oficina A-1\\\",\\\"description\\\":\\\"Almacén de oficina sección A-1\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T10:13:49.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T11:32:44.000Z\\\"}\"', '\"{\\\"name\\\":\\\"Almacén Oficina A-0\\\",\\\"description\\\":\\\"Almacén de oficina sección A-1\\\"}\"', 'Actualizó ubicación Almacén Oficina A-0', '2025-05-30 05:53:52'),
(119, 'Ubicación Actualizada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":5,\\\"name\\\":\\\"Almacén Oficina A-0\\\",\\\"description\\\":\\\"Almacén de oficina sección A-1\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T10:13:49.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T11:53:52.000Z\\\"}\"', '\"{\\\"name\\\":\\\"Almacén Oficina A-1\\\",\\\"description\\\":\\\"Almacén de oficina sección A-1\\\"}\"', 'Actualizó ubicación Almacén Oficina A-1', '2025-05-30 05:53:58'),
(120, 'Ubicación Creada', 12, NULL, NULL, NULL, NULL, NULL, '\"{\\\"name\\\":\\\"ee\\\",\\\"description\\\":\\\"eee\\\"}\"', 'Creó ubicación ee', '2025-05-30 05:54:02'),
(121, 'Ubicación Eliminada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":11,\\\"name\\\":\\\"ee\\\",\\\"description\\\":\\\"eee\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T11:54:02.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T11:54:02.000Z\\\"}\"', NULL, 'Eliminó ubicación ee', '2025-05-30 05:54:06'),
(122, 'Categoría Creada', 12, NULL, NULL, NULL, NULL, NULL, '\"{\\\"name\\\":\\\"aaa\\\",\\\"description\\\":\\\"aaa\\\"}\"', 'Creó categoría aaa', '2025-05-30 05:54:14'),
(123, 'Categoría Actualizada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":10,\\\"name\\\":\\\"aaa\\\",\\\"description\\\":\\\"aaa\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T11:54:14.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T11:54:14.000Z\\\"}\"', '\"{\\\"name\\\":\\\"aaaaaaaaaa\\\",\\\"description\\\":\\\"aaa\\\"}\"', 'Actualizó categoría aaaaaaaaaa', '2025-05-30 05:54:17'),
(124, 'Categoría Eliminada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":10,\\\"name\\\":\\\"aaaaaaaaaa\\\",\\\"description\\\":\\\"aaa\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T11:54:14.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T11:54:17.000Z\\\"}\"', NULL, 'Eliminó categoría aaaaaaaaaa', '2025-05-30 05:54:19'),
(125, 'Categoría Creada', 12, NULL, NULL, NULL, NULL, NULL, '\"{\\\"name\\\":\\\"aaaaaaaaaaa\\\",\\\"description\\\":null}\"', 'Creó categoría aaaaaaaaaaa', '2025-05-30 05:54:24'),
(126, 'Categoría Eliminada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":11,\\\"name\\\":\\\"aaaaaaaaaaa\\\",\\\"description\\\":null,\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T11:54:24.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T11:54:24.000Z\\\"}\"', NULL, 'Eliminó categoría aaaaaaaaaaa', '2025-05-30 05:54:37'),
(127, 'Categoría Actualizada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":8,\\\"name\\\":\\\"Consumibles\\\",\\\"description\\\":\\\"Materiales consumibles\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T10:13:49.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T11:33:02.000Z\\\"}\"', '\"{\\\"name\\\":\\\"Consumible\\\",\\\"description\\\":\\\"Materiales consumibles\\\"}\"', 'Actualizó categoría Consumible', '2025-05-30 07:18:31'),
(128, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:41:38.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-002', '2025-05-30 08:00:14'),
(129, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T14:00:14.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-002', '2025-05-30 08:00:16'),
(130, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T14:00:16.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-002', '2025-05-30 08:09:10'),
(131, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T14:09:10.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-002', '2025-05-30 08:09:13'),
(132, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T14:09:13.000Z\"}', '{\"quantity\":21}', 'Actualizó producto OFF-002', '2025-05-30 08:10:33'),
(133, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":21,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T14:10:33.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-002', '2025-05-30 08:11:54'),
(134, 'Producto Actualizado', 12, NULL, 4, 'products', 4, '{\"id\":4,\"part_number\":\"OFF-004\",\"description\":\"Cintas Canela\",\"category\":\"Oficina\",\"brand\":\"Genérico\",\"quantity\":12,\"min_stock\":4,\"max_stock\":25,\"price\":\"22.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-29T07:30:50.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-004', '2025-05-30 08:11:57'),
(135, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":21,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T14:11:54.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-002', '2025-05-30 08:12:04'),
(136, 'Producto Actualizado', 12, NULL, 4, 'products', 4, '{\"id\":4,\"part_number\":\"OFF-004\",\"description\":\"Cintas Canela\",\"category\":\"Oficina\",\"brand\":\"Genérico\",\"quantity\":12,\"min_stock\":4,\"max_stock\":25,\"price\":\"22.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T14:11:57.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-004', '2025-05-30 08:12:05'),
(137, 'Contraseña Cambiada', 12, 12, NULL, 'user', 12, NULL, NULL, 'Usuario 12 cambió su propia contraseña', '2025-05-30 08:16:54'),
(138, 'Usuario Deshabilitado', 12, NULL, NULL, NULL, NULL, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 19', '2025-05-30 08:18:00'),
(139, 'Usuario Rehabilitado', 12, NULL, NULL, NULL, NULL, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 19', '2025-05-30 08:18:51'),
(140, 'Usuario Deshabilitado', 12, 18, NULL, 'user', 18, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 18', '2025-05-30 08:18:53'),
(141, 'Usuario Rehabilitado', 12, 18, NULL, 'user', 18, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 18', '2025-05-30 08:19:37'),
(142, 'Rol Cambiado', 12, 11, NULL, 'user', 11, '{\"name\":\"Maximiliano Mendoza\",\"roleId\":2}', '{\"name\":\"Maximiliano Mendoza Lopez\",\"roleId\":1}', 'Cambió rol de usuario 11 de Capturista a Administrador', '2025-05-30 08:21:12'),
(143, 'Usuario Eliminado', 12, NULL, NULL, NULL, NULL, '{\"id\":19,\"name\":\"Hector Daniel Martinez Figueroa\",\"password\":\"$2b$10$sqPu463uWHIigw.Df3xgZeAA6PHkOFXrvvi5M0ZD.sQjwuPsI2b26\",\"account\":20168585,\"email\":\"hmartinez@ucol.com\",\"ranks\":\"Sargento\",\"status\":0,\"registration\":\"2025-05-29T03:50:23.000Z\",\"last_access\":null,\"profile_pic\":null,\"roleId\":3}', NULL, 'Eliminó usuario 19 (Hector Daniel Martinez Figueroa)', '2025-05-30 08:21:27');
INSERT INTO `history` (`id`, `action_type`, `performed_by`, `target_user`, `target_product`, `entity_type`, `entity_id`, `old_value`, `new_value`, `description`, `created_at`) VALUES
(144, 'Producto Creado', 12, NULL, NULL, NULL, NULL, NULL, '{\"part_number\":\"aaaaaaaaa\",\"description\":\"aaaaaaaaaaaaaaa\",\"brand\":\"aaaaaaaaaaaaaaaaaaaa\",\"category\":\"Consumible\",\"quantity\":12,\"min_stock\":1,\"max_stock\":14,\"price\":34441,\"location\":\"Almacén Principal B-2\",\"supplier\":\"Papelería Naval\",\"status\":0}', 'Creó producto aaaaaaaaa', '2025-05-30 08:21:58'),
(145, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":95,\"part_number\":\"aaaaaaaaa\",\"description\":\"aaaaaaaaaaaaaaa\",\"category\":\"Consumible\",\"brand\":\"aaaaaaaaaaaaaaaaaaaa\",\"quantity\":12,\"min_stock\":1,\"max_stock\":14,\"price\":\"34441.00\",\"location\":\"Almacén Principal B-2\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-30T14:21:58.000Z\",\"updated_at\":\"2025-05-30T14:21:58.000Z\"}', '{\"quantity\":13}', 'Actualizó producto aaaaaaaaa', '2025-05-30 08:22:10'),
(146, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":95,\"part_number\":\"aaaaaaaaa\",\"description\":\"aaaaaaaaaaaaaaa\",\"category\":\"Consumible\",\"brand\":\"aaaaaaaaaaaaaaaaaaaa\",\"quantity\":13,\"min_stock\":1,\"max_stock\":14,\"price\":\"34441.00\",\"location\":\"Almacén Principal B-2\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-30T14:21:58.000Z\",\"updated_at\":\"2025-05-30T14:22:10.000Z\"}', '{\"quantity\":12}', 'Actualizó producto aaaaaaaaa', '2025-05-30 08:22:14'),
(147, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":95,\"part_number\":\"aaaaaaaaa\",\"description\":\"aaaaaaaaaaaaaaa\",\"category\":\"Consumible\",\"brand\":\"aaaaaaaaaaaaaaaaaaaa\",\"quantity\":12,\"min_stock\":1,\"max_stock\":14,\"price\":\"34441.00\",\"location\":\"Almacén Principal B-2\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-30T14:21:58.000Z\",\"updated_at\":\"2025-05-30T14:22:14.000Z\"}', '{\"part_number\":\"bbbbbbbbbbbb\",\"description\":\"aaaaaaaaaaaaaaa\",\"brand\":\"aaaaaaaaaaaaaaaaaaaa\",\"category\":\"Consumible\",\"quantity\":12,\"min_stock\":1,\"max_stock\":14,\"price\":\"34441.00\",\"location\":\"Almacén Principal A-1\",\"supplier\":\"Papelería Naval\",\"status\":0}', 'Actualizó producto aaaaaaaaa', '2025-05-30 08:22:25'),
(148, 'Categoría Creada', 12, NULL, NULL, NULL, NULL, NULL, '\"{\\\"name\\\":\\\"jaja\\\",\\\"description\\\":\\\"jaja\\\"}\"', 'Creó categoría jaja', '2025-05-30 08:22:40'),
(149, 'Categoría Actualizada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":13,\\\"name\\\":\\\"jaja\\\",\\\"description\\\":\\\"jaja\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T14:22:40.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T14:22:40.000Z\\\"}\"', '\"{\\\"name\\\":\\\"jaeje\\\",\\\"description\\\":\\\"jaja\\\"}\"', 'Actualizó categoría jaeje', '2025-05-30 08:22:49'),
(150, 'Ubicación Creada', 12, NULL, NULL, NULL, NULL, NULL, '\"{\\\"name\\\":\\\"acacac\\\",\\\"description\\\":\\\"acacca\\\"}\"', 'Creó ubicación acacac', '2025-05-30 08:22:58'),
(151, 'Producto Creado', 12, NULL, NULL, NULL, NULL, NULL, '{\"part_number\":\"nuevo\",\"description\":\"nuevo\",\"brand\":\"nuevo\",\"category\":\"jaeje\",\"quantity\":12,\"min_stock\":4,\"max_stock\":20,\"price\":666,\"location\":\"acacac\",\"supplier\":\"Papelería Naval\",\"status\":0}', 'Creó producto nuevo', '2025-05-30 08:23:32'),
(152, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":96,\"part_number\":\"nuevo\",\"description\":\"nuevo\",\"category\":\"jaeje\",\"brand\":\"nuevo\",\"quantity\":12,\"min_stock\":4,\"max_stock\":20,\"price\":\"666.00\",\"location\":\"acacac\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-30T14:23:32.000Z\",\"updated_at\":\"2025-05-30T14:23:32.000Z\"}', '{\"quantity\":13}', 'Actualizó producto nuevo', '2025-05-30 08:23:53'),
(153, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":96,\"part_number\":\"nuevo\",\"description\":\"nuevo\",\"category\":\"jaeje\",\"brand\":\"nuevo\",\"quantity\":13,\"min_stock\":4,\"max_stock\":20,\"price\":\"666.00\",\"location\":\"acacac\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-30T14:23:32.000Z\",\"updated_at\":\"2025-05-30T14:23:53.000Z\"}', '{\"quantity\":0}', 'Actualizó producto nuevo', '2025-05-30 08:24:03'),
(154, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":96,\"part_number\":\"nuevo\",\"description\":\"nuevo\",\"category\":\"jaeje\",\"brand\":\"nuevo\",\"quantity\":0,\"min_stock\":4,\"max_stock\":20,\"price\":\"666.00\",\"location\":\"acacac\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-30T14:23:32.000Z\",\"updated_at\":\"2025-05-30T14:24:03.000Z\"}', '{\"quantity\":5}', 'Actualizó producto nuevo', '2025-05-30 08:24:18'),
(155, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":96,\"part_number\":\"nuevo\",\"description\":\"nuevo\",\"category\":\"jaeje\",\"brand\":\"nuevo\",\"quantity\":5,\"min_stock\":4,\"max_stock\":20,\"price\":\"666.00\",\"location\":\"acacac\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-30T14:23:32.000Z\",\"updated_at\":\"2025-05-30T14:24:18.000Z\"}', '{\"quantity\":19}', 'Actualizó producto nuevo', '2025-05-30 08:24:27'),
(156, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":96,\"part_number\":\"nuevo\",\"description\":\"nuevo\",\"category\":\"jaeje\",\"brand\":\"nuevo\",\"quantity\":19,\"min_stock\":4,\"max_stock\":20,\"price\":\"666.00\",\"location\":\"acacac\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-30T14:23:32.000Z\",\"updated_at\":\"2025-05-30T14:24:27.000Z\"}', '{\"quantity\":23}', 'Actualizó producto nuevo', '2025-05-30 08:24:35'),
(157, 'Categoría Eliminada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":13,\\\"name\\\":\\\"jaeje\\\",\\\"description\\\":\\\"jaja\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T14:22:40.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T14:22:49.000Z\\\"}\"', NULL, 'Eliminó categoría jaeje', '2025-05-30 08:24:56'),
(158, 'Ubicación Eliminada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":12,\\\"name\\\":\\\"acacac\\\",\\\"description\\\":\\\"acacca\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T14:22:58.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T14:22:58.000Z\\\"}\"', NULL, 'Eliminó ubicación acacac', '2025-05-30 08:25:03'),
(159, 'Usuario Actualizado', 12, 11, NULL, 'user', 11, '{\"roleId\":2}', '{\"roleId\":2}', 'Actualizó datos de usuario 11', '2025-05-30 08:31:27'),
(160, 'Usuario Eliminado', 12, NULL, NULL, NULL, NULL, '{\"id\":23,\"name\":\"Diego Danae\",\"password\":\"$2b$10$9MrSYWZNvh9Ri8GaILcWGOSEZ6Cbf3L/TDPPSBHZ.qoemsdh03uji\",\"account\":2147483647,\"email\":\"maxelgrande@hotmail.es\",\"ranks\":\"Capitan\",\"status\":0,\"registration\":\"2025-05-30T14:25:50.000Z\",\"last_access\":null,\"profile_pic\":null,\"roleId\":3}', NULL, 'Eliminó usuario 23 (Diego Danae)', '2025-05-30 08:31:34'),
(161, 'Usuario Eliminado', 12, NULL, NULL, NULL, NULL, '{\"id\":29,\"name\":\"Diego Danae\",\"password\":\"$2b$10$OvGJ76wrYMV91PcWIdFWLOoIpcsV4SyAy3vLdHkDwcbdmZaK.pRLu\",\"account\":20156544,\"email\":\"hmartinez@ucol.mx\",\"ranks\":\"Sargento\",\"status\":0,\"registration\":\"2025-05-30T14:28:14.000Z\",\"last_access\":null,\"profile_pic\":null,\"roleId\":2}', NULL, 'Eliminó usuario 29 (Diego Danae)', '2025-05-30 08:32:11'),
(162, 'Usuario Creado', 12, 30, NULL, 'user', 30, NULL, '{\"name\":\"Diego Danae\",\"password\":\"12345678\",\"account\":\"112233445566\",\"email\":\"hmartinez@ucol.mx\",\"ranks\":\"Capitan\",\"roleId\":2,\"status\":0}', 'Creó usuario 30', '2025-05-30 08:32:36'),
(163, 'Usuario Creado', 12, NULL, NULL, NULL, NULL, NULL, '{\"name\":\"no waay\",\"password\":\"12345678\",\"account\":\"aaaaaaaaaaaaa\",\"email\":\"maxiova3@gmail.com\",\"ranks\":\"Capitan\",\"roleId\":2,\"status\":0}', 'Creó usuario 31', '2025-05-30 08:43:27'),
(164, 'Usuario Eliminado', 12, NULL, NULL, NULL, NULL, '{\"id\":31,\"name\":\"no waay\",\"password\":\"$2b$10$ztYrSg3a3bZSJlVaOu9ZwOe4FNaTfYCIhpjDow1QIJOtO4a1ORLYi\",\"account\":0,\"email\":\"maxiova3@gmail.com\",\"ranks\":\"Capitan\",\"status\":0,\"registration\":\"2025-05-30T14:43:27.000Z\",\"last_access\":null,\"profile_pic\":null,\"roleId\":2}', NULL, 'Eliminó usuario 31 (no waay)', '2025-05-30 08:43:42'),
(165, 'Usuario Creado', 12, NULL, NULL, NULL, NULL, NULL, '{\"name\":\"P8\",\"password\":\"12345678\",\"account\":\"2015653731\",\"email\":\"maxiova@gmail.com\",\"ranks\":\"Capitan\",\"roleId\":2,\"status\":0}', 'Creó usuario 32', '2025-05-30 08:50:04'),
(166, 'Usuario Actualizado', 12, NULL, NULL, NULL, NULL, '{\"name\":\"P8\",\"email\":\"maxiova@gmail.com\",\"account\":2015653731}', '{\"name\":\"P7\",\"email\":\"maxiova32@gmail.com\",\"account\":\"1234689979\"}', 'Actualizó datos de usuario 32', '2025-05-30 08:50:29'),
(167, 'Usuario Eliminado', 12, NULL, NULL, NULL, NULL, '{\"id\":32,\"name\":\"P7\",\"password\":\"$2b$10$ycQfRe1Udp8AkXrrgk2PD.SDPqCnC39OkXCq2DxYerKqaDKWB5Twu\",\"account\":1234689979,\"email\":\"maxiova32@gmail.com\",\"ranks\":\"Capitan\",\"status\":0,\"registration\":\"2025-05-30T14:50:04.000Z\",\"last_access\":null,\"profile_pic\":null,\"roleId\":2}', NULL, 'Eliminó usuario 32 (P7)', '2025-05-30 08:50:49'),
(168, 'Categoría Actualizada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":8,\\\"name\\\":\\\"Consumible\\\",\\\"description\\\":\\\"Materiales consumibles\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T10:13:49.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T13:18:31.000Z\\\"}\"', '\"{\\\"name\\\":\\\"Consumible\\\",\\\"description\\\":\\\"Materiales consumibles 123\\\"}\"', 'Actualizó categoría Consumible', '2025-05-30 08:51:48'),
(169, 'Categoría Actualizada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":8,\\\"name\\\":\\\"Consumible\\\",\\\"description\\\":\\\"Materiales consumibles 123\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T10:13:49.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T14:51:48.000Z\\\"}\"', '\"{\\\"name\\\":\\\"Consumible\\\",\\\"description\\\":\\\"Materiales consumibles\\\"}\"', 'Actualizó categoría Consumible', '2025-05-30 08:51:56'),
(170, 'Categoría Actualizada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":8,\\\"name\\\":\\\"Consumible\\\",\\\"description\\\":\\\"Materiales consumibles\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T10:13:49.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T14:51:56.000Z\\\"}\"', '\"{\\\"name\\\":\\\"Consumible\\\",\\\"description\\\":\\\"Materiales consumibles\\\"}\"', 'Actualizó categoría Consumible', '2025-05-30 08:52:02'),
(171, 'Categoría Eliminada', 18, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":9,\\\"name\\\":\\\"AAAA\\\",\\\"description\\\":\\\"AAA\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T11:33:08.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T15:07:24.000Z\\\"}\"', NULL, 'Eliminó categoría AAAA', '2025-05-30 09:09:14'),
(172, 'Categoría Eliminada', 18, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":10,\\\"name\\\":\\\"aaaaaaaaaa\\\",\\\"description\\\":\\\"aaa\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T11:54:14.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T15:07:27.000Z\\\"}\"', NULL, 'Eliminó categoría aaaaaaaaaa', '2025-05-30 09:09:21'),
(173, 'Categoría Eliminada', 18, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":11,\\\"name\\\":\\\"aaaaaaaaaaa\\\",\\\"description\\\":null,\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T11:54:24.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T15:07:31.000Z\\\"}\"', NULL, 'Eliminó categoría aaaaaaaaaaa', '2025-05-30 09:09:24'),
(174, 'Categoría Eliminada', 18, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":13,\\\"name\\\":\\\"jaeje\\\",\\\"description\\\":\\\"jaja\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T14:22:40.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T15:07:33.000Z\\\"}\"', NULL, 'Eliminó categoría jaeje', '2025-05-30 09:09:27'),
(175, 'Categoría Creada', 18, NULL, NULL, NULL, NULL, NULL, '\"{\\\"name\\\":\\\"aa\\\",\\\"description\\\":\\\"aa\\\"}\"', 'Creó categoría aa', '2025-05-30 09:09:52'),
(176, 'Ubicación Creada', 18, NULL, NULL, NULL, NULL, NULL, '\"{\\\"name\\\":\\\"aa\\\",\\\"description\\\":\\\"aa\\\"}\"', 'Creó ubicación aa', '2025-05-30 09:09:59'),
(177, 'Ubicación Eliminada', 18, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":13,\\\"name\\\":\\\"aa\\\",\\\"description\\\":\\\"aa\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T15:09:59.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T15:09:59.000Z\\\"}\"', NULL, 'Eliminó ubicación aa', '2025-05-30 09:10:02'),
(178, 'Ubicación Eliminada', 18, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":12,\\\"name\\\":\\\"acacac\\\",\\\"description\\\":\\\"acacca\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T14:22:58.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T15:07:14.000Z\\\"}\"', NULL, 'Eliminó ubicación acacac', '2025-05-30 09:10:04'),
(179, 'Ubicación Eliminada', 18, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":11,\\\"name\\\":\\\"ee\\\",\\\"description\\\":\\\"eee\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T11:54:02.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T15:07:10.000Z\\\"}\"', NULL, 'Eliminó ubicación ee', '2025-05-30 09:10:08'),
(180, 'Ubicación Eliminada', 18, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":10,\\\"name\\\":\\\"EEEEE\\\",\\\"description\\\":\\\"EEEEE\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T11:33:22.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T15:07:07.000Z\\\"}\"', NULL, 'Eliminó ubicación EEEEE', '2025-05-30 09:10:10'),
(181, 'Categoría Eliminada', 18, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":15,\\\"name\\\":\\\"aa\\\",\\\"description\\\":\\\"aa\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T15:09:52.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T15:09:52.000Z\\\"}\"', NULL, 'Eliminó categoría aa', '2025-05-30 09:10:14'),
(182, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":21,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-05-30T14:12:04.000Z\"}', '{\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"brand\":\"Scotch\",\"category\":\"Oficina\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0}', 'Actualizó producto OFF-002', '2025-08-26 21:59:28'),
(183, 'Usuario Creado', 12, 33, NULL, 'user', 33, NULL, '{\"name\":\"Maximiliano Alexander Mendoza Lopez\",\"password\":\"123456788\",\"account\":\"20156422\",\"email\":\"maxiova1234@gmail.com\",\"ranks\":\"Capitan\",\"roleId\":3,\"status\":0}', 'Creó usuario 33', '2025-10-24 09:08:49'),
(184, 'Usuario Actualizado', 12, 11, NULL, 'user', 11, '{\"name\":\"Maximiliano Mendoza Lopez\"}', '{\"name\":\"Maximiliano Mendoza Lopez A\"}', 'Actualizó datos de usuario 11', '2025-11-21 13:21:53'),
(185, 'Usuario Creado', 12, 34, NULL, 'user', 34, NULL, '{\"name\":\"Max\",\"password\":\"12345678\",\"account\":\"20156521\",\"email\":\"maxiova312@gmail.mx\",\"ranks\":\"Coronel\",\"roleId\":1,\"status\":0}', 'Creó usuario 34', '2025-11-21 15:01:15'),
(186, 'Usuario Creado', 12, 35, NULL, 'user', 35, NULL, '{\"name\":\"Gabriel\",\"password\":\"12345678\",\"account\":\"20156481\",\"email\":\"imontiel@ucol.com\",\"ranks\":\"General\",\"roleId\":2,\"status\":0}', 'Creó usuario 35', '2025-11-21 15:09:59'),
(187, 'Usuario Creado', 12, NULL, NULL, NULL, NULL, NULL, '{\"name\":\"Gabriel1\",\"password\":\"12345678\",\"account\":\"20156480\",\"email\":\"maxiova312@gmail.es\",\"ranks\":\"Sargento\",\"roleId\":3,\"status\":0}', 'Creó usuario 37', '2025-11-21 15:10:47'),
(188, 'Producto Creado', 12, NULL, NULL, NULL, NULL, NULL, '{\"part_number\":\"bbbbbbbbbbbb\",\"description\":\"1212\",\"brand\":\"Scotch\",\"category\":\"Electrónica\",\"quantity\":0,\"min_stock\":0,\"max_stock\":0,\"price\":0,\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0}', 'Creó producto bbbbbbbbbbbb', '2025-11-21 15:11:56'),
(189, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-08-27T03:59:28.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-002', '2025-11-21 15:12:49'),
(190, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-21T21:12:49.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-002', '2025-11-21 15:12:51'),
(191, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-21T21:12:51.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-002', '2025-11-21 15:13:01'),
(192, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category\":\"Oficina\",\"brand\":\"Scotch\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location\":\"Almacén Oficina A-1\",\"supplier\":\"Papelería Naval\",\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-21T21:13:01.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-002', '2025-11-21 15:13:07'),
(193, 'Producto Creado', 34, NULL, NULL, NULL, NULL, NULL, '{\"part_number\":\"as\",\"description\":\"asdas\",\"brand\":\"asad\",\"category\":\"Electrónica\",\"quantity\":1,\"min_stock\":0,\"max_stock\":0,\"price\":0,\"location\":\"Almacén Principal A-2\",\"supplier\":\"asdasdasd\",\"status\":0}', 'Creó producto as', '2025-11-22 09:26:13'),
(194, 'Usuario Deshabilitado', 34, 30, NULL, 'user', 30, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 30', '2025-11-22 09:27:04'),
(195, 'Usuario Rehabilitado', 12, 30, NULL, 'user', 30, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 30', '2025-11-22 09:27:12'),
(196, 'Usuario Actualizado', 34, 17, NULL, 'user', 17, '{\"name\":\"Gabriel Mendoza Lopez\"}', '{\"name\":\"Gabriel Mendoza Lopez a\"}', 'Actualizó datos de usuario 17', '2025-11-22 09:27:24'),
(197, 'Rol Cambiado', 34, 13, NULL, 'user', 13, '{\"roleId\":3}', '{\"roleId\":2}', 'Cambió rol de usuario 13 de Consultor a Capturista', '2025-11-22 09:28:00'),
(198, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":98,\"part_number\":\"as\",\"description\":\"asdas\",\"category\":\"Electrónica\",\"brand\":\"asad\",\"quantity\":1,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"asdasdasd\",\"status\":0,\"created_at\":\"2025-11-22T15:26:13.000Z\",\"updated_at\":\"2025-11-22T15:26:13.000Z\"}', '{\"quantity\":5}', 'Actualizó producto as', '2025-11-22 09:51:33'),
(199, 'Producto Creado', 12, NULL, NULL, NULL, NULL, NULL, '{\"part_number\":\"OFF-001\",\"description\":\"2asda\",\"brand\":\"Scotch\",\"category\":\"Electrónica\",\"quantity\":1,\"min_stock\":0,\"max_stock\":0,\"price\":0,\"location\":\"Almacén Principal B-1\",\"supplier\":\"Papelería Naval\",\"status\":0}', 'Creó producto OFF-001', '2025-11-22 09:52:04'),
(200, 'Producto Eliminado', 34, NULL, NULL, NULL, NULL, '{\"id\":99,\"part_number\":\"OFF-001\",\"description\":\"2asda\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":1,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"Papelería Naval\",\"status\":0,\"created_at\":\"2025-11-22T15:52:04.000Z\",\"updated_at\":\"2025-11-22T15:52:04.000Z\"}', NULL, 'Eliminó producto OFF-001', '2025-11-22 09:52:55'),
(201, 'Usuario Deshabilitado', 12, 11, NULL, 'user', 11, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 11', '2025-11-22 09:53:16'),
(202, 'Usuario Rehabilitado', 12, 11, NULL, 'user', 11, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 11', '2025-11-22 09:53:21'),
(203, 'Usuario Deshabilitado', 34, 11, NULL, 'user', 11, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 11', '2025-11-22 09:53:34'),
(204, 'Usuario Rehabilitado', 34, 11, NULL, 'user', 11, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 11', '2025-11-22 09:53:35'),
(205, 'Producto Actualizado', 34, NULL, NULL, NULL, NULL, '{\"id\":98,\"part_number\":\"as\",\"description\":\"asdas\",\"category\":\"Electrónica\",\"brand\":\"asad\",\"quantity\":5,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"asdasdasd\",\"status\":0,\"created_at\":\"2025-11-22T15:26:13.000Z\",\"updated_at\":\"2025-11-22T15:51:33.000Z\"}', '{\"status\":1}', 'Actualizó producto as', '2025-11-22 09:53:50'),
(206, 'Producto Actualizado', 34, NULL, NULL, NULL, NULL, '{\"id\":98,\"part_number\":\"as\",\"description\":\"asdas\",\"category\":\"Electrónica\",\"brand\":\"asad\",\"quantity\":5,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"asdasdasd\",\"status\":1,\"created_at\":\"2025-11-22T15:26:13.000Z\",\"updated_at\":\"2025-11-22T15:53:50.000Z\"}', '{\"status\":0}', 'Actualizó producto as', '2025-11-22 09:53:59'),
(207, 'Producto Actualizado', 34, NULL, NULL, NULL, NULL, '{\"id\":98,\"part_number\":\"as\",\"description\":\"asdas\",\"category\":\"Electrónica\",\"brand\":\"asad\",\"quantity\":5,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"asdasdasd\",\"status\":0,\"created_at\":\"2025-11-22T15:26:13.000Z\",\"updated_at\":\"2025-11-22T15:53:59.000Z\"}', '{\"quantity\":2}', 'Actualizó producto as', '2025-11-22 10:02:33'),
(208, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":98,\"part_number\":\"as\",\"description\":\"asdas\",\"category\":\"Electrónica\",\"brand\":\"asad\",\"quantity\":2,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"asdasdasd\",\"status\":0,\"created_at\":\"2025-11-22T15:26:13.000Z\",\"updated_at\":\"2025-11-22T16:02:33.000Z\"}', '{\"status\":1}', 'Actualizó producto as', '2025-11-22 10:02:41'),
(209, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":98,\"part_number\":\"as\",\"description\":\"asdas\",\"category\":\"Electrónica\",\"brand\":\"asad\",\"quantity\":2,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"asdasdasd\",\"status\":1,\"created_at\":\"2025-11-22T15:26:13.000Z\",\"updated_at\":\"2025-11-22T16:02:41.000Z\"}', '{\"status\":0}', 'Actualizó producto as', '2025-11-22 10:02:47'),
(210, 'Producto Eliminado', 12, NULL, NULL, NULL, NULL, '{\"id\":98,\"part_number\":\"as\",\"description\":\"asdas\",\"category\":\"Electrónica\",\"brand\":\"asad\",\"quantity\":2,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal A-2\",\"supplier\":\"asdasdasd\",\"status\":0,\"created_at\":\"2025-11-22T15:26:13.000Z\",\"updated_at\":\"2025-11-22T16:02:47.000Z\"}', NULL, 'Eliminó producto as', '2025-11-22 10:02:52'),
(211, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"bbbbbbbbbbbb\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":0,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-21T21:11:56.000Z\"}', '{\"part_number\":\"HOLA\",\"description\":\"1212\",\"brand\":\"Scotch\",\"category\":\"Electrónica\",\"quantity\":0,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0}', 'Actualizó producto bbbbbbbbbbbb', '2025-11-22 10:03:02'),
(212, 'Producto Actualizado', 34, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":0,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:03:02.000Z\"}', '{\"quantity\":21}', 'Actualizó producto HOLA', '2025-11-22 10:04:22'),
(213, 'Producto Actualizado', 34, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":21,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:04:22.000Z\"}', '{\"quantity\":20}', 'Actualizó producto HOLA', '2025-11-22 10:04:42'),
(214, 'Producto Actualizado', 34, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":20,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:04:42.000Z\"}', '{\"quantity\":319}', 'Actualizó producto HOLA', '2025-11-22 10:05:06'),
(215, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":319,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:05:06.000Z\"}', '{\"status\":1}', 'Actualizó producto HOLA', '2025-11-22 10:47:29'),
(216, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":319,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":1,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:47:29.000Z\"}', '{\"status\":0}', 'Actualizó producto HOLA', '2025-11-22 10:47:31'),
(217, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":319,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:47:31.000Z\"}', '{\"quantity\":317}', 'Actualizó producto HOLA', '2025-11-22 10:47:42'),
(218, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":317,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:47:42.000Z\"}', '{\"quantity\":328}', 'Actualizó producto HOLA', '2025-11-22 10:47:49'),
(219, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":328,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:47:49.000Z\"}', '{\"quantity\":329}', 'Actualizó producto HOLA', '2025-11-22 10:48:17'),
(220, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":329,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:48:17.000Z\"}', '{\"quantity\":330}', 'Actualizó producto HOLA', '2025-11-22 10:48:33'),
(221, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":330,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:48:33.000Z\"}', '{\"status\":1}', 'Actualizó producto HOLA', '2025-11-22 10:48:42'),
(222, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":330,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":1,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:48:42.000Z\"}', '{\"status\":0}', 'Actualizó producto HOLA', '2025-11-22 10:49:02'),
(223, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":330,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:49:02.000Z\"}', '{\"status\":1}', 'Actualizó producto HOLA', '2025-11-22 10:49:59'),
(224, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":330,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":1,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:49:59.000Z\"}', '{\"status\":0}', 'Actualizó producto HOLA', '2025-11-22 10:50:04'),
(225, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":330,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:50:04.000Z\"}', '{\"status\":1}', 'Actualizó producto HOLA', '2025-11-22 10:50:09'),
(226, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":330,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":1,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:50:09.000Z\"}', '{\"status\":0}', 'Actualizó producto HOLA', '2025-11-22 10:50:11'),
(227, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":330,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:50:11.000Z\"}', '{\"status\":1}', 'Actualizó producto HOLA', '2025-11-22 10:50:15'),
(228, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":330,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":1,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:50:15.000Z\"}', '{\"status\":0}', 'Actualizó producto HOLA', '2025-11-22 10:50:22'),
(229, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":330,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:50:22.000Z\"}', '{\"status\":1}', 'Actualizó producto HOLA', '2025-11-22 10:50:26'),
(230, 'Producto Actualizado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":330,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":1,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:50:26.000Z\"}', '{\"status\":0}', 'Actualizó producto HOLA', '2025-11-22 10:50:34'),
(231, 'Producto Eliminado', 12, NULL, NULL, NULL, NULL, '{\"id\":97,\"part_number\":\"HOLA\",\"description\":\"1212\",\"category\":\"Electrónica\",\"brand\":\"Scotch\",\"quantity\":330,\"min_stock\":0,\"max_stock\":0,\"price\":\"0.00\",\"location\":\"Almacén Principal B-1\",\"supplier\":\"1221e12e\",\"status\":0,\"created_at\":\"2025-11-21T21:11:56.000Z\",\"updated_at\":\"2025-11-22T16:50:34.000Z\"}', NULL, 'Eliminó producto HOLA', '2025-11-22 10:50:37'),
(232, 'Usuario Eliminado', 34, NULL, NULL, NULL, NULL, '{\"id\":37,\"name\":\"Gabriel1\",\"password\":\"$2b$10$7YZ.5hv2wyrwGpW6RWa4H.NcfKvgROhobRybMsoPLzDl9B1TN2Lgq\",\"account\":20156480,\"email\":\"maxiova312@gmail.es\",\"ranks\":\"Sargento\",\"status\":0,\"registration\":\"2025-11-21T21:10:47.000Z\",\"last_access\":null,\"profile_pic\":null,\"roleId\":3}', NULL, 'Eliminó usuario 37 (Gabriel1)', '2025-11-22 11:37:03'),
(233, '', 1, 1, NULL, 'user', 1, NULL, NULL, 'Prueba de log normalizado', '2025-11-22 13:37:59'),
(234, 'Usuario Deshabilitado', 34, 1, NULL, 'user', 1, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 1', '2025-11-22 13:43:51'),
(235, 'Usuario Rehabilitado', 34, 1, NULL, 'user', 1, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 1', '2025-11-22 13:44:07'),
(236, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 1}', 'Producto actualizado: OFF-002', '2025-11-22 15:49:29'),
(237, 'Producto Actualizado', 34, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-22T19:03:56.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-002', '2025-11-22 15:49:29'),
(238, 'Producto Actualizado', 1, NULL, NULL, 'products', 3, '{\"part_number\": \"OFF-003\", \"brand\": \"Genérico\", \"category\": \"Oficina\", \"quantity\": 10, \"status\": 0}', '{\"part_number\": \"OFF-003\", \"brand\": \"Genérico\", \"category\": \"Oficina\", \"quantity\": 10, \"status\": 1}', 'Producto actualizado: OFF-003', '2025-11-22 15:50:17'),
(239, 'Producto Actualizado', 34, NULL, 3, 'products', 3, '{\"id\":3,\"part_number\":\"OFF-003\",\"description\":\"Cinta de Refrigeración\",\"category_id\":1,\"brand_id\":2,\"quantity\":10,\"min_stock\":3,\"max_stock\":20,\"price\":\"45.00\",\"location_id\":6,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-22T19:03:56.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-003', '2025-11-22 15:50:17'),
(240, 'Producto Actualizado', 1, NULL, NULL, 'products', 14, '{\"part_number\": \"OFF-014\", \"brand\": \"Genérico\", \"category\": \"Oficina\", \"quantity\": 200, \"status\": 0}', '{\"part_number\": \"OFF-014\", \"brand\": \"Genérico\", \"category\": \"Oficina\", \"quantity\": 200, \"status\": 1}', 'Producto actualizado: OFF-014', '2025-11-22 15:50:26'),
(241, 'Producto Actualizado', 34, NULL, 14, 'products', 14, '{\"id\":14,\"part_number\":\"OFF-014\",\"description\":\"Sobres Blancos\",\"category_id\":1,\"brand_id\":2,\"quantity\":200,\"min_stock\":50,\"max_stock\":400,\"price\":\"2.00\",\"location_id\":null,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-22T19:03:56.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-014', '2025-11-22 15:50:26'),
(242, 'Producto Actualizado', 1, NULL, NULL, 'products', 14, '{\"part_number\": \"OFF-014\", \"brand\": \"Genérico\", \"category\": \"Oficina\", \"quantity\": 200, \"status\": 1}', '{\"part_number\": \"OFF-014\", \"brand\": \"Genérico\", \"category\": \"Oficina\", \"quantity\": 200, \"status\": 0}', 'Producto actualizado: OFF-014', '2025-11-22 15:50:31'),
(243, 'Producto Actualizado', 34, NULL, 14, 'products', 14, '{\"id\":14,\"part_number\":\"OFF-014\",\"description\":\"Sobres Blancos\",\"category_id\":1,\"brand_id\":2,\"quantity\":200,\"min_stock\":50,\"max_stock\":400,\"price\":\"2.00\",\"location_id\":null,\"provider_id\":null,\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-22T21:50:26.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-014', '2025-11-22 15:50:31'),
(244, 'Producto Actualizado', 1, NULL, NULL, 'products', 3, '{\"part_number\": \"OFF-003\", \"brand\": \"Genérico\", \"category\": \"Oficina\", \"quantity\": 10, \"status\": 1}', '{\"part_number\": \"OFF-003\", \"brand\": \"Genérico\", \"category\": \"Oficina\", \"quantity\": 10, \"status\": 0}', 'Producto actualizado: OFF-003', '2025-11-22 15:50:34'),
(245, 'Producto Actualizado', 34, NULL, 3, 'products', 3, '{\"id\":3,\"part_number\":\"OFF-003\",\"description\":\"Cinta de Refrigeración\",\"category_id\":1,\"brand_id\":2,\"quantity\":10,\"min_stock\":3,\"max_stock\":20,\"price\":\"45.00\",\"location_id\":6,\"provider_id\":null,\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-22T21:50:17.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-003', '2025-11-22 15:50:34'),
(246, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 1}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', 'Producto actualizado: OFF-002', '2025-11-22 15:50:35'),
(247, 'Producto Actualizado', 34, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":null,\"status\":1,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-22T21:49:29.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-002', '2025-11-22 15:50:35'),
(248, '', 1, NULL, NULL, 'provider', 1, '{\"name\": \"Proveedor Desconocido\", \"status\": 0}', '{\"name\": \"Proveedor Desconocido\", \"status\": 1}', 'Proveedor actualizado: Proveedor Desconocido', '2025-11-23 12:54:31'),
(249, '', 12, NULL, NULL, 'provider', 1, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó proveedor Proveedor Desconocido', '2025-11-23 12:54:31'),
(250, '', 1, NULL, NULL, 'provider', 1, '{\"name\": \"Proveedor Desconocido\", \"status\": 1}', '{\"name\": \"Proveedor Desconocido\", \"status\": 0}', 'Proveedor actualizado: Proveedor Desconocido', '2025-11-23 12:54:40'),
(251, '', 12, NULL, NULL, 'provider', 1, '{\"status\":1}', '{\"status\":0}', 'Habilitó proveedor Proveedor Desconocido', '2025-11-23 12:54:40'),
(252, '', 1, NULL, NULL, 'provider', 1, '{\"name\": \"Proveedor Desconocido\", \"status\": 0}', '{\"name\": \"Proveedor Desconocido\", \"status\": 1}', 'Proveedor actualizado: Proveedor Desconocido', '2025-11-23 13:00:35'),
(253, '', 12, NULL, NULL, 'provider', 1, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó proveedor Proveedor Desconocido', '2025-11-23 13:00:35'),
(254, '', 1, NULL, NULL, 'provider', 1, '{\"name\": \"Proveedor Desconocido\", \"status\": 1}', '{\"name\": \"Proveedor Desconocido\", \"status\": 0}', 'Proveedor actualizado: Proveedor Desconocido', '2025-11-23 13:00:50'),
(255, '', 12, NULL, NULL, 'provider', 1, '{\"status\":1}', '{\"status\":0}', 'Habilitó proveedor Proveedor Desconocido', '2025-11-23 13:00:50'),
(256, '', 1, NULL, NULL, 'provider', 3, NULL, '{\"name\": \"Marine Supplies Co.\"}', 'Proveedor creado: Marine Supplies Co.', '2025-11-23 13:11:15'),
(257, '', 1, NULL, NULL, 'provider', 4, NULL, '{\"name\": \"Nautical Gear Ltd.\"}', 'Proveedor creado: Nautical Gear Ltd.', '2025-11-23 13:11:15'),
(258, '', 1, NULL, NULL, 'provider', 5, NULL, '{\"name\": \"SeaTech Innovations\"}', 'Proveedor creado: SeaTech Innovations', '2025-11-23 13:11:15'),
(259, '', 1, NULL, NULL, 'provider', 6, NULL, '{\"name\": \"Oceanic Parts\"}', 'Proveedor creado: Oceanic Parts', '2025-11-23 13:11:15'),
(260, '', 1, NULL, NULL, 'provider', 7, NULL, '{\"name\": \"Deep Blue Marine\"}', 'Proveedor creado: Deep Blue Marine', '2025-11-23 13:11:15'),
(261, '', 1, NULL, NULL, 'provider', 3, '{\"name\": \"Marine Supplies Co.\", \"status\": 0}', '{\"name\": \"Marine Supplies Co.\", \"status\": 1}', 'Proveedor actualizado: Marine Supplies Co.', '2025-11-23 15:03:52'),
(262, '', 12, NULL, NULL, 'provider', 3, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó proveedor Marine Supplies Co.', '2025-11-23 15:03:52'),
(263, '', 1, NULL, NULL, 'provider', 3, '{\"name\": \"Marine Supplies Co.\", \"status\": 1}', '{\"name\": \"Marine Supplies Co.\", \"status\": 0}', 'Proveedor actualizado: Marine Supplies Co.', '2025-11-23 15:03:53'),
(264, '', 12, NULL, NULL, 'provider', 3, '{\"status\":1}', '{\"status\":0}', 'Habilitó proveedor Marine Supplies Co.', '2025-11-23 15:03:53'),
(265, '', 1, NULL, NULL, 'provider', 3, '{\"name\": \"Marine Supplies Co.\", \"status\": 0}', '{\"name\": \"Marine Supplies Co.\", \"status\": 1}', 'Proveedor actualizado: Marine Supplies Co.', '2025-11-23 15:03:54'),
(266, '', 12, NULL, NULL, 'provider', 3, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó proveedor Marine Supplies Co.', '2025-11-23 15:03:54'),
(267, '', 1, NULL, NULL, 'provider', 3, '{\"name\": \"Marine Supplies Co.\", \"status\": 1}', '{\"name\": \"Marine Supplies Co.\", \"status\": 0}', 'Proveedor actualizado: Marine Supplies Co.', '2025-11-23 15:03:55'),
(268, '', 12, NULL, NULL, 'provider', 3, '{\"status\":1}', '{\"status\":0}', 'Habilitó proveedor Marine Supplies Co.', '2025-11-23 15:03:55'),
(269, '', 1, NULL, NULL, 'provider', 4, '{\"name\": \"Nautical Gear Ltd.\", \"status\": 0}', '{\"name\": \"Nautical Gear Ltd.\", \"status\": 1}', 'Proveedor actualizado: Nautical Gear Ltd.', '2025-11-23 15:03:56'),
(270, '', 12, NULL, NULL, 'provider', 4, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó proveedor Nautical Gear Ltd.', '2025-11-23 15:03:56'),
(271, '', 1, NULL, NULL, 'provider', 4, '{\"name\": \"Nautical Gear Ltd.\", \"status\": 1}', '{\"name\": \"Nautical Gear Ltd.\", \"status\": 0}', 'Proveedor actualizado: Nautical Gear Ltd.', '2025-11-23 15:03:56'),
(272, '', 12, NULL, NULL, 'provider', 4, '{\"status\":1}', '{\"status\":0}', 'Habilitó proveedor Nautical Gear Ltd.', '2025-11-23 15:03:56'),
(273, 'Usuario Creado', 12, 38, NULL, 'user', 38, NULL, '{\"name\":\"no waay\",\"email\":\"maxiova312@gmail.es\",\"account\":\"20156537\",\"ranks\":\"General\",\"roleId\":1,\"password\":\"12345678\",\"isEditing\":false,\"status\":0}', 'Creó usuario 38', '2025-11-23 16:38:13'),
(274, 'Usuario Actualizado', 12, 38, NULL, 'user', 38, '{\"name\":\"no waay\",\"email\":\"maxiova312@gmail.es\",\"account\":20156537,\"roleId\":1}', '{\"name\":\"no waay\",\"email\":\"maxiova312@gmail.es\",\"account\":\"20156537\",\"roleId\":1}', 'Actualizó datos de usuario 38', '2025-11-23 16:53:12'),
(275, 'Usuario Actualizado', 12, 38, NULL, 'user', 38, '{\"name\":\"no waay\",\"email\":\"maxiova312@gmail.es\",\"account\":20156537,\"roleId\":1}', '{\"name\":\"no waay\",\"email\":\"maxiova312@gmail.es\",\"account\":\"20156537\",\"roleId\":1}', 'Actualizó datos de usuario 38', '2025-11-23 16:53:22'),
(276, 'Rol Cambiado', 12, 38, NULL, 'user', 38, '{\"name\":\"no waay\",\"email\":\"maxiova312@gmail.es\",\"account\":20156537,\"roleId\":1}', '{\"name\":\"no waay\",\"email\":\"maxiova312@gmail.es\",\"account\":\"20156537\",\"roleId\":2}', 'Cambió rol de usuario 38 de Administrador a Capturista', '2025-11-23 16:53:27'),
(277, 'Producto Creado', 1, NULL, NULL, 'products', 100, NULL, '{\"part_number\": \"OFF-001\", \"brand\": null, \"category\": null, \"quantity\": 0}', 'Producto creado: OFF-001', '2025-11-23 17:04:38'),
(278, 'Producto Creado', 12, NULL, NULL, 'products', 100, NULL, '{\"part_number\":\"OFF-001\",\"description\":\"asssss\",\"price\":23,\"stock\":5,\"min_stock\":1,\"max_stock\":10,\"categoryId\":1,\"brandId\":18,\"providerId\":4,\"locationId\":4,\"status\":0}', 'Creó producto OFF-001', '2025-11-23 17:04:38'),
(279, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', 'Producto actualizado: OFF-002', '2025-11-23 17:10:41'),
(280, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-22T21:50:35.000Z\"}', '{\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"price\":\"18.00\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"categoryId\":1,\"brandId\":1,\"providerId\":5,\"locationId\":5}', 'Actualizó producto OFF-002', '2025-11-23 17:10:41'),
(281, 'Producto Actualizado', 1, NULL, NULL, 'products', 100, '{\"part_number\": \"OFF-001\", \"brand\": null, \"category\": null, \"quantity\": 0, \"status\": 0}', '{\"part_number\": \"OFF-001\", \"brand\": null, \"category\": null, \"quantity\": 0, \"status\": 0}', 'Producto actualizado: OFF-001', '2025-11-23 17:10:57'),
(282, 'Producto Actualizado', 12, NULL, NULL, 'products', 100, '{\"id\":100,\"part_number\":\"OFF-001\",\"description\":\"asssss\",\"category_id\":null,\"brand_id\":null,\"quantity\":0,\"min_stock\":1,\"max_stock\":10,\"price\":\"23.00\",\"location_id\":null,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-11-23T23:04:38.000Z\",\"updated_at\":\"2025-11-23T23:04:38.000Z\"}', '{\"part_number\":\"OFF-001\",\"description\":\"asssss\",\"price\":\"23.00\",\"quantity\":0,\"min_stock\":1,\"max_stock\":10,\"categoryId\":8,\"brandId\":15,\"providerId\":5,\"locationId\":7}', 'Actualizó producto OFF-001', '2025-11-23 17:10:57'),
(283, 'Producto Actualizado', 1, NULL, NULL, 'products', 5, '{\"part_number\": \"OFF-005\", \"brand\": \"Scribe\", \"category\": \"Oficina\", \"quantity\": 25, \"status\": 0}', '{\"part_number\": \"OFF-005\", \"brand\": \"Scribe\", \"category\": \"Oficina\", \"quantity\": 25, \"status\": 0}', 'Producto actualizado: OFF-005', '2025-11-23 17:11:53'),
(284, 'Producto Actualizado', 12, NULL, 5, 'products', 5, '{\"id\":5,\"part_number\":\"OFF-005\",\"description\":\"Libretas Pasta Dura\",\"category_id\":1,\"brand_id\":3,\"quantity\":25,\"min_stock\":10,\"max_stock\":50,\"price\":\"35.00\",\"location_id\":null,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-22T19:03:56.000Z\"}', '{\"part_number\":\"OFF-005\",\"description\":\"Libretas Pasta Dura\",\"price\":\"35.00\",\"quantity\":25,\"min_stock\":10,\"max_stock\":50,\"categoryId\":1,\"brandId\":3,\"providerId\":5,\"locationId\":7}', 'Actualizó producto OFF-005', '2025-11-23 17:11:53'),
(285, 'Producto Actualizado', 1, NULL, NULL, 'products', 5, '{\"part_number\": \"OFF-005\", \"brand\": \"Scribe\", \"category\": \"Oficina\", \"quantity\": 25, \"status\": 0}', '{\"part_number\": \"OFF-005\", \"brand\": \"Scribe\", \"category\": \"Oficina\", \"quantity\": 25, \"status\": 0}', 'Producto actualizado: OFF-005', '2025-11-23 17:12:04'),
(286, 'Producto Actualizado', 12, NULL, 5, 'products', 5, '{\"id\":5,\"part_number\":\"OFF-005\",\"description\":\"Libretas Pasta Dura\",\"category_id\":1,\"brand_id\":3,\"quantity\":25,\"min_stock\":10,\"max_stock\":50,\"price\":\"35.00\",\"location_id\":null,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-23T23:11:53.000Z\"}', '{\"part_number\":\"OFF-005\",\"description\":\"Libretas Pasta Dura\",\"price\":\"35.00\",\"quantity\":25,\"min_stock\":10,\"max_stock\":50,\"categoryId\":1,\"brandId\":3,\"providerId\":5,\"locationId\":4}', 'Actualizó producto OFF-005', '2025-11-23 17:12:04');
INSERT INTO `history` (`id`, `action_type`, `performed_by`, `target_user`, `target_product`, `entity_type`, `entity_id`, `old_value`, `new_value`, `description`, `created_at`) VALUES
(287, 'Producto Actualizado', 1, NULL, NULL, 'products', 100, '{\"part_number\": \"OFF-001\", \"brand\": null, \"category\": null, \"quantity\": 0, \"status\": 0}', '{\"part_number\": \"OFF-001\", \"brand\": \"Wilson Jones\", \"category\": \"Seguridad\", \"quantity\": 0, \"status\": 0}', 'Producto actualizado: OFF-001', '2025-11-23 17:18:51'),
(288, 'Producto Actualizado', 12, NULL, NULL, 'products', 100, '{\"id\":100,\"part_number\":\"OFF-001\",\"description\":\"asssss\",\"category_id\":null,\"brand_id\":null,\"quantity\":0,\"min_stock\":1,\"max_stock\":10,\"price\":\"23.00\",\"location_id\":null,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-11-23T23:04:38.000Z\",\"updated_at\":\"2025-11-23T23:10:57.000Z\"}', '{\"part_number\":\"OFF-001\",\"description\":\"asssss\",\"price\":\"23.00\",\"quantity\":0,\"min_stock\":1,\"max_stock\":10,\"categoryId\":6,\"brandId\":14,\"providerId\":3,\"locationId\":8,\"brand_id\":14,\"category_id\":6,\"location_id\":8,\"provider_id\":3}', 'Actualizó producto OFF-001', '2025-11-23 17:18:51'),
(289, 'Producto Actualizado', 1, NULL, NULL, 'products', 18, '{\"part_number\": \"OFF-018\", \"brand\": \"Paper Mate\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', '{\"part_number\": \"OFF-018\", \"brand\": \"Paper Mate\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', 'Producto actualizado: OFF-018', '2025-11-23 17:19:03'),
(290, 'Producto Actualizado', 12, NULL, 18, 'products', 18, '{\"id\":18,\"part_number\":\"OFF-018\",\"description\":\"Correctores en Lápiz\",\"category_id\":1,\"brand_id\":12,\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"12.00\",\"location_id\":null,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-22T19:03:56.000Z\"}', '{\"part_number\":\"OFF-018\",\"description\":\"Correctores en Lápiz\",\"price\":\"12.00\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"categoryId\":1,\"brandId\":12,\"providerId\":4,\"locationId\":7,\"brand_id\":12,\"category_id\":1,\"location_id\":7,\"provider_id\":4}', 'Actualizó producto OFF-018', '2025-11-23 17:19:03'),
(291, 'Producto Actualizado', 1, NULL, NULL, 'products', 100, '{\"part_number\": \"OFF-001\", \"brand\": \"Wilson Jones\", \"category\": \"Seguridad\", \"quantity\": 0, \"status\": 0}', '{\"part_number\": \"OFF-001\", \"brand\": \"Wilson Jones\", \"category\": \"Seguridad\", \"quantity\": 0, \"status\": 1}', 'Producto actualizado: OFF-001', '2025-11-23 17:19:08'),
(292, 'Producto Actualizado', 12, NULL, NULL, 'products', 100, '{\"id\":100,\"part_number\":\"OFF-001\",\"description\":\"asssss\",\"category_id\":6,\"brand_id\":14,\"quantity\":0,\"min_stock\":1,\"max_stock\":10,\"price\":\"23.00\",\"location_id\":8,\"provider_id\":3,\"status\":0,\"created_at\":\"2025-11-23T23:04:38.000Z\",\"updated_at\":\"2025-11-23T23:18:51.000Z\"}', '{\"status\":1}', 'Actualizó producto OFF-001', '2025-11-23 17:19:08'),
(293, 'Producto Actualizado', 1, NULL, NULL, 'products', 100, '{\"part_number\": \"OFF-001\", \"brand\": \"Wilson Jones\", \"category\": \"Seguridad\", \"quantity\": 0, \"status\": 1}', '{\"part_number\": \"OFF-001\", \"brand\": \"Wilson Jones\", \"category\": \"Seguridad\", \"quantity\": 0, \"status\": 0}', 'Producto actualizado: OFF-001', '2025-11-23 17:19:12'),
(294, 'Producto Actualizado', 12, NULL, NULL, 'products', 100, '{\"id\":100,\"part_number\":\"OFF-001\",\"description\":\"asssss\",\"category_id\":6,\"brand_id\":14,\"quantity\":0,\"min_stock\":1,\"max_stock\":10,\"price\":\"23.00\",\"location_id\":8,\"provider_id\":3,\"status\":1,\"created_at\":\"2025-11-23T23:04:38.000Z\",\"updated_at\":\"2025-11-23T23:19:08.000Z\"}', '{\"status\":0}', 'Actualizó producto OFF-001', '2025-11-23 17:19:12'),
(295, 'Producto Eliminado', 12, NULL, NULL, 'products', 100, '{\"id\":100,\"part_number\":\"OFF-001\",\"description\":\"asssss\",\"category_id\":6,\"brand_id\":14,\"quantity\":0,\"min_stock\":1,\"max_stock\":10,\"price\":\"23.00\",\"location_id\":8,\"provider_id\":3,\"status\":0,\"created_at\":\"2025-11-23T23:04:38.000Z\",\"updated_at\":\"2025-11-23T23:19:12.000Z\"}', NULL, 'Eliminó producto OFF-001', '2025-11-23 17:19:17'),
(296, '', 1, NULL, NULL, 'provider', 8, NULL, '{\"name\": \"Marcos Toys\"}', 'Proveedor creado: Marcos Toys', '2025-11-23 17:20:40'),
(297, '', 12, NULL, NULL, 'provider', NULL, NULL, '{\"name\":\"Marcos Toys\",\"company\":\"Universidad de Colima\",\"email\":\"maxiova312@gmail.com\",\"address\":\"Avenida Universidad 333\\nLas Víboras\",\"registration\":\"312123124asda\",\"phone\":\"3121351997\",\"website\":\"www.ucol.mx\",\"contact_name\":\"Esteban Macilla\",\"status\":0}', 'Creó proveedor Marcos Toys', '2025-11-23 17:20:40'),
(298, '', 1, NULL, NULL, 'provider', 1, '{\"name\": \"Proveedor Desconocido\", \"status\": 0}', '{\"name\": \"Proveedor Desconocido\", \"status\": 0}', 'Proveedor actualizado: Proveedor Desconocido', '2025-11-23 17:27:59'),
(299, '', 1, NULL, NULL, 'provider', 3, '{\"name\": \"Marine Supplies Co.\", \"status\": 0}', '{\"name\": \"Marine Supplies Co.\", \"status\": 0}', 'Proveedor actualizado: Marine Supplies Co.', '2025-11-23 17:27:59'),
(300, '', 1, NULL, NULL, 'provider', 4, '{\"name\": \"Nautical Gear Ltd.\", \"status\": 0}', '{\"name\": \"Nautical Gear Ltd.\", \"status\": 0}', 'Proveedor actualizado: Nautical Gear Ltd.', '2025-11-23 17:27:59'),
(301, '', 1, NULL, NULL, 'provider', 5, '{\"name\": \"SeaTech Innovations\", \"status\": 0}', '{\"name\": \"SeaTech Innovations\", \"status\": 0}', 'Proveedor actualizado: SeaTech Innovations', '2025-11-23 17:27:59'),
(302, '', 1, NULL, NULL, 'provider', 6, '{\"name\": \"Oceanic Parts\", \"status\": 0}', '{\"name\": \"Oceanic Parts\", \"status\": 0}', 'Proveedor actualizado: Oceanic Parts', '2025-11-23 17:27:59'),
(303, '', 1, NULL, NULL, 'provider', 7, '{\"name\": \"Deep Blue Marine\", \"status\": 0}', '{\"name\": \"Deep Blue Marine\", \"status\": 0}', 'Proveedor actualizado: Deep Blue Marine', '2025-11-23 17:27:59'),
(304, '', 1, NULL, NULL, 'provider', 8, '{\"name\": \"Marcos Toys\", \"status\": 0}', '{\"name\": \"Marcos Toys\", \"status\": 0}', 'Proveedor actualizado: Marcos Toys', '2025-11-23 17:27:59'),
(305, '', 1, NULL, NULL, 'provider', 8, '{\"name\": \"Marcos Toys\", \"status\": 0}', '{\"name\": \"Marcos Toys\", \"status\": 0}', 'Proveedor actualizado: Marcos Toys', '2025-11-23 17:28:46'),
(306, '', 12, NULL, NULL, 'provider', 8, '{\"id\":8,\"name\":\"Marcos Toys\",\"company\":\"Universidad de Colima\",\"email\":\"maxiova312@gmail.com\",\"address\":\"Avenida Universidad 333\\nLas Víboras\",\"status\":0,\"registration\":null,\"created_at\":\"2025-11-23T23:20:40.000Z\",\"updated_at\":\"2025-11-23T23:27:59.000Z\",\"phone\":\"3121351997\",\"website\":\"www.ucol.mx\",\"contact_name\":\"Esteban Macilla\"}', '{\"name\":\"Marcos Toys\",\"company\":\"Universidad de Colima\",\"email\":\"maxiova312@gmail.com\",\"address\":\"Avenida Universidad 333\\nLas Víboras\",\"registration\":\"312asdasd\",\"phone\":\"3121351997\",\"website\":\"www.ucol.mx\",\"contact_name\":\"Esteban Macilla\"}', 'Actualizó proveedor Marcos Toys', '2025-11-23 17:28:46'),
(307, '', 1, NULL, NULL, 'provider', 8, '{\"name\": \"Marcos Toys\", \"status\": 0}', '{\"name\": \"Marcos Toys\", \"status\": 0}', 'Proveedor actualizado: Marcos Toys', '2025-11-23 18:05:02'),
(308, '', 12, NULL, NULL, 'provider', 8, '{\"id\":8,\"name\":\"Marcos Toys\",\"company\":\"Universidad de Colima\",\"email\":\"maxiova312@gmail.com\",\"address\":\"Avenida Universidad 333\\nLas Víboras\",\"status\":0,\"registration\":\"312asdasd\",\"created_at\":\"2025-11-23T23:20:40.000Z\",\"updated_at\":\"2025-11-23T23:28:46.000Z\",\"phone\":\"3121351997\",\"website\":\"www.ucol.mx\",\"contact_name\":\"Esteban Macilla\"}', '{\"name\":\"Marcos Toys\",\"company\":\"Universidad de Colima\",\"email\":\"maxiova312@gmail.com\",\"address\":\"Avenida Universidad 333\\nLas Víboras\",\"registration\":\"GODE561231GR8\",\"phone\":\"3121351997\",\"website\":\"www.ucol.mx\",\"contact_name\":\"Esteban Macilla\"}', 'Actualizó proveedor Marcos Toys', '2025-11-23 18:05:02'),
(309, '', 1, NULL, NULL, 'provider', 3, '{\"name\": \"Marine Supplies Co.\", \"status\": 0}', '{\"name\": \"Marine Supplies Co.\", \"status\": 0}', 'Proveedor actualizado: Marine Supplies Co.', '2025-11-23 18:05:10'),
(310, '', 12, NULL, NULL, 'provider', 3, '{\"id\":3,\"name\":\"Marine Supplies Co.\",\"company\":\"Marine Supplies International\",\"email\":\"contact@marinesupplies.com\",\"address\":\"123 Ocean Drive, Miami, FL\",\"status\":0,\"registration\":null,\"created_at\":\"2025-11-23T19:11:15.000Z\",\"updated_at\":\"2025-11-23T23:27:59.000Z\",\"phone\":\"555-0101\",\"website\":\"www.marinesupplies.com\",\"contact_name\":\"John Doe\"}', '{\"name\":\"Marine Supplies Co.\",\"company\":\"Marine Supplies International\",\"email\":\"contact@marinesupplies.com\",\"address\":\"123 Ocean Drive, Miami, FL\",\"registration\":\"ROGA880215H45\",\"phone\":\"555-0101\",\"website\":\"www.marinesupplies.com\",\"contact_name\":\"John Doe\"}', 'Actualizó proveedor Marine Supplies Co.', '2025-11-23 18:05:10'),
(311, '', 1, NULL, NULL, 'provider', 4, '{\"name\": \"Nautical Gear Ltd.\", \"status\": 0}', '{\"name\": \"Nautical Gear Ltd.\", \"status\": 0}', 'Proveedor actualizado: Nautical Gear Ltd.', '2025-11-23 18:05:17'),
(312, '', 12, NULL, NULL, 'provider', 4, '{\"id\":4,\"name\":\"Nautical Gear Ltd.\",\"company\":\"Nautical Gear Solutions\",\"email\":\"sales@nauticalgear.com\",\"address\":\"456 Harbor Ave, Seattle, WA\",\"status\":0,\"registration\":null,\"created_at\":\"2025-11-23T19:11:15.000Z\",\"updated_at\":\"2025-11-23T23:27:59.000Z\",\"phone\":\"555-0102\",\"website\":\"www.nauticalgear.com\",\"contact_name\":\"Jane Smith\"}', '{\"name\":\"Nautical Gear Ltd.\",\"company\":\"Nautical Gear Solutions\",\"email\":\"sales@nauticalgear.com\",\"address\":\"456 Harbor Ave, Seattle, WA\",\"registration\":\"ABC680524P76\",\"phone\":\"555-0102\",\"website\":\"www.nauticalgear.com\",\"contact_name\":\"Jane Smith\"}', 'Actualizó proveedor Nautical Gear Ltd.', '2025-11-23 18:05:17'),
(313, 'Usuario Deshabilitado', 12, 1, NULL, 'user', 1, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 1', '2025-11-23 18:35:13'),
(314, 'Usuario Rehabilitado', 12, 1, NULL, 'user', 1, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 1', '2025-11-23 18:35:18'),
(315, '', 1, NULL, NULL, 'provider', 8, '{\"name\": \"Marcos Toys\", \"status\": 0}', '{\"name\": \"Marcos Toys\", \"status\": 1}', 'Proveedor actualizado: Marcos Toys', '2025-11-23 18:35:21'),
(316, '', 12, NULL, NULL, 'provider', 8, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó proveedor Marcos Toys', '2025-11-23 18:35:21'),
(317, '', 1, NULL, NULL, 'provider', 8, '{\"name\": \"Marcos Toys\", \"status\": 1}', '{\"name\": \"Marcos Toys\", \"status\": 0}', 'Proveedor actualizado: Marcos Toys', '2025-11-23 18:35:28'),
(318, '', 12, NULL, NULL, 'provider', 8, '{\"status\":1}', '{\"status\":0}', 'Habilitó proveedor Marcos Toys', '2025-11-23 18:35:28'),
(319, '', 1, NULL, NULL, 'provider', 8, '{\"name\": \"Marcos Toys\", \"status\": 0}', '{\"name\": \"Marcos Toys\", \"status\": 1}', 'Proveedor actualizado: Marcos Toys', '2025-11-23 18:44:49'),
(320, '', 12, NULL, NULL, 'provider', 8, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó proveedor Marcos Toys', '2025-11-23 18:44:49'),
(321, '', 1, NULL, NULL, 'provider', 8, '{\"name\": \"Marcos Toys\", \"status\": 1}', '{\"name\": \"Marcos Toys\", \"status\": 0}', 'Proveedor actualizado: Marcos Toys', '2025-11-23 18:45:00'),
(322, '', 12, NULL, NULL, 'provider', 8, '{\"status\":1}', '{\"status\":0}', 'Habilitó proveedor Marcos Toys', '2025-11-23 18:45:00'),
(323, '', 1, NULL, NULL, 'provider', 8, '{\"name\": \"Marcos Toys\", \"status\": 0}', '{\"name\": \"Marcos Toys\", \"status\": 1}', 'Proveedor actualizado: Marcos Toys', '2025-11-23 18:45:03'),
(324, '', 34, NULL, NULL, 'provider', 8, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó proveedor Marcos Toys', '2025-11-23 18:45:03'),
(325, '', 1, NULL, NULL, 'provider', 8, '{\"name\": \"Marcos Toys\", \"status\": 1}', '{\"name\": \"Marcos Toys\", \"status\": 0}', 'Proveedor actualizado: Marcos Toys', '2025-11-23 18:45:05'),
(326, '', 34, NULL, NULL, 'provider', 8, '{\"status\":1}', '{\"status\":0}', 'Habilitó proveedor Marcos Toys', '2025-11-23 18:45:05'),
(327, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', 'Producto actualizado: OFF-002', '2025-11-23 19:11:52'),
(328, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-23T23:10:41.000Z\"}', '{\"stock\":22}', 'Actualizó producto OFF-002', '2025-11-23 19:11:52'),
(329, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', 'Producto actualizado: OFF-002', '2025-11-23 19:12:13'),
(330, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-24T01:11:52.000Z\"}', '{\"stock\":21}', 'Actualizó producto OFF-002', '2025-11-23 19:12:13'),
(331, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', 'Producto actualizado: OFF-002', '2025-11-23 19:12:34'),
(332, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-24T01:12:13.000Z\"}', '{\"stock\":21}', 'Actualizó producto OFF-002', '2025-11-23 19:12:34'),
(333, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', 'Producto actualizado: OFF-002', '2025-11-23 19:12:36'),
(334, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-24T01:12:34.000Z\"}', '{\"stock\":19}', 'Actualizó producto OFF-002', '2025-11-23 19:12:36'),
(335, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', 'Producto actualizado: OFF-002', '2025-11-23 19:12:40'),
(336, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-24T01:12:36.000Z\"}', '{\"stock\":21}', 'Actualizó producto OFF-002', '2025-11-23 19:12:40'),
(337, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', 'Producto actualizado: OFF-002', '2025-11-23 19:12:42'),
(338, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-24T01:12:40.000Z\"}', '{\"stock\":19}', 'Actualizó producto OFF-002', '2025-11-23 19:12:42'),
(339, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', 'Producto actualizado: OFF-002', '2025-11-23 19:12:49'),
(340, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-24T01:12:42.000Z\"}', '{\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"price\":\"18.00\",\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"categoryId\":1,\"brandId\":1,\"providerId\":5,\"locationId\":5,\"brand_id\":1,\"category_id\":1,\"location_id\":5,\"provider_id\":5}', 'Actualizó producto OFF-002', '2025-11-23 19:12:49'),
(341, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', 'Producto actualizado: OFF-002', '2025-11-23 19:12:53'),
(342, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":5,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-24T01:12:49.000Z\"}', '{\"stock\":21}', 'Actualizó producto OFF-002', '2025-11-23 19:12:53'),
(343, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotch\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', 'Producto actualizado: OFF-002', '2025-11-23 19:12:56'),
(344, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":5,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-24T01:12:53.000Z\"}', '{\"stock\":19}', 'Actualizó producto OFF-002', '2025-11-23 19:12:56'),
(345, 'Categoría Actualizada', 1, NULL, NULL, 'categories', 8, '{\"name\": \"Consumible\", \"status\": 0}', '{\"name\": \"Consumible\", \"status\": 0}', 'Categoría actualizada: Consumible', '2025-11-23 19:13:37'),
(346, 'Categoría Actualizada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":8,\\\"name\\\":\\\"Consumible\\\",\\\"description\\\":\\\"Materiales consumibles\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T10:13:49.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T14:52:02.000Z\\\"}\"', '\"{\\\"name\\\":\\\"Consumible\\\",\\\"description\\\":\\\"Materiales consumibless\\\"}\"', 'Actualizó categoría Consumible', '2025-11-23 19:13:37'),
(347, 'Categoría Actualizada', 1, NULL, NULL, 'categories', 8, '{\"name\": \"Consumible\", \"status\": 0}', '{\"name\": \"Consumibles\", \"status\": 0}', 'Categoría actualizada: Consumibles', '2025-11-23 19:13:51'),
(348, 'Categoría Actualizada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":8,\\\"name\\\":\\\"Consumible\\\",\\\"description\\\":\\\"Materiales consumibless\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T10:13:49.000Z\\\",\\\"updated_at\\\":\\\"2025-11-24T01:13:37.000Z\\\"}\"', '\"{\\\"name\\\":\\\"Consumibles\\\",\\\"description\\\":\\\"Materiales consumibless\\\"}\"', 'Actualizó categoría Consumibles', '2025-11-23 19:13:51'),
(349, 'Categoría Actualizada', 1, NULL, NULL, 'categories', 8, '{\"name\": \"Consumibles\", \"status\": 0}', '{\"name\": \"Consumibless\", \"status\": 0}', 'Categoría actualizada: Consumibless', '2025-11-23 19:14:00'),
(350, 'Categoría Actualizada', 12, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":8,\\\"name\\\":\\\"Consumibles\\\",\\\"description\\\":\\\"Materiales consumibless\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T10:13:49.000Z\\\",\\\"updated_at\\\":\\\"2025-11-24T01:13:51.000Z\\\"}\"', '\"{\\\"name\\\":\\\"Consumibless\\\",\\\"description\\\":\\\"Materiales consumibless\\\"}\"', 'Actualizó categoría Consumibless', '2025-11-23 19:14:00'),
(351, '', 1, NULL, NULL, 'brands', 1, '{\"name\": \"Scotch\", \"status\": 0}', '{\"name\": \"Scotchs\", \"status\": 0}', 'Marca actualizada: Scotchs', '2025-11-23 19:14:26'),
(352, '', 12, NULL, NULL, 'brands', 1, '{\"id\":1,\"name\":\"Scotch\",\"description\":null,\"status\":0,\"created_at\":\"2025-11-22T19:03:56.000Z\",\"updated_at\":\"2025-11-22T19:03:56.000Z\"}', '{\"name\":\"Scotchs\"}', 'Actualizó marca Scotchs', '2025-11-23 19:14:26'),
(353, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotchs\", \"category\": \"Oficina\", \"quantity\": 20, \"status\": 0}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotchs\", \"category\": \"Oficina\", \"quantity\": 22, \"status\": 0}', 'Producto actualizado: OFF-002', '2025-11-23 19:36:53'),
(354, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":20,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":5,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-24T01:12:56.000Z\"}', '{\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"price\":\"18.00\",\"quantity\":22,\"min_stock\":8,\"max_stock\":40,\"categoryId\":1,\"brandId\":1,\"providerId\":5,\"locationId\":5,\"brand_id\":1,\"category_id\":1,\"location_id\":5,\"provider_id\":5}', 'Actualizó producto OFF-002', '2025-11-23 19:36:53'),
(355, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotchs\", \"category\": \"Oficina\", \"quantity\": 22, \"status\": 0}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotchs\", \"category\": \"Oficina\", \"quantity\": 22, \"status\": 0}', 'Producto actualizado: OFF-002', '2025-11-23 19:37:02'),
(356, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":22,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":5,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-24T01:36:53.000Z\"}', '{\"stock\":23}', 'Actualizó producto OFF-002', '2025-11-23 19:37:02'),
(357, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotchs\", \"category\": \"Oficina\", \"quantity\": 22, \"status\": 0}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotchs\", \"category\": \"Oficina\", \"quantity\": 23, \"status\": 0}', 'Producto actualizado: OFF-002', '2025-11-23 19:39:13'),
(358, 'Producto Actualizado', 12, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":22,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":5,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-24T01:37:02.000Z\"}', '{\"quantity\":23}', 'Actualizó producto OFF-002', '2025-11-23 19:39:13'),
(359, 'Producto Actualizado', 1, NULL, NULL, 'products', 2, '{\"part_number\": \"OFF-002\", \"brand\": \"Scotchs\", \"category\": \"Oficina\", \"quantity\": 23, \"status\": 0}', '{\"part_number\": \"OFF-002\", \"brand\": \"Scotchs\", \"category\": \"Oficina\", \"quantity\": 11, \"status\": 0}', 'Producto actualizado: OFF-002', '2025-11-23 19:39:22'),
(360, 'Producto Actualizado', 34, NULL, 2, 'products', 2, '{\"id\":2,\"part_number\":\"OFF-002\",\"description\":\"Cintas Adhesivas Transparentes\",\"category_id\":1,\"brand_id\":1,\"quantity\":23,\"min_stock\":8,\"max_stock\":40,\"price\":\"18.00\",\"location_id\":5,\"provider_id\":5,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-24T01:39:13.000Z\"}', '{\"quantity\":11}', 'Actualizó producto OFF-002', '2025-11-23 19:39:22'),
(361, 'Producto Creado', 1, NULL, NULL, 'products', 101, NULL, '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 1}', 'Producto creado: Producto', '2025-11-23 19:40:01'),
(362, 'Producto Creado', 34, NULL, 101, 'products', 101, NULL, '{\"part_number\":\"Producto\",\"description\":\"Producto\",\"price\":12,\"quantity\":1,\"min_stock\":1,\"max_stock\":3,\"categoryId\":6,\"brandId\":19,\"providerId\":4,\"locationId\":3,\"status\":0,\"brand_id\":19,\"category_id\":6,\"location_id\":3,\"provider_id\":4}', 'Creó producto Producto', '2025-11-23 19:40:01'),
(363, 'Producto Actualizado', 1, NULL, NULL, 'products', 101, '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 1, \"status\": 0}', '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 2000, \"status\": 0}', 'Producto actualizado: Producto', '2025-11-23 19:40:18'),
(364, 'Producto Actualizado', 34, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":1,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-24T01:40:01.000Z\"}', '{\"quantity\":2000}', 'Actualizó producto Producto', '2025-11-23 19:40:18'),
(365, 'Producto Actualizado', 1, NULL, NULL, 'products', 101, '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 2000, \"status\": 0}', '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 2000, \"status\": 1}', 'Producto actualizado: Producto', '2025-11-23 19:41:04'),
(366, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2000,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-24T01:40:18.000Z\"}', '{\"status\":1}', 'Actualizó producto Producto', '2025-11-23 19:41:04'),
(367, 'Producto Actualizado', 1, NULL, NULL, 'products', 101, '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 2000, \"status\": 1}', '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 2000, \"status\": 0}', 'Producto actualizado: Producto', '2025-11-23 19:41:13'),
(368, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2000,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":1,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-24T01:41:04.000Z\"}', '{\"status\":0}', 'Actualizó producto Producto', '2025-11-23 19:41:13'),
(369, 'Usuario Deshabilitado', 34, 1, NULL, 'user', 1, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 1', '2025-11-23 19:52:01'),
(370, 'Usuario Rehabilitado', 34, 1, NULL, 'user', 1, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 1', '2025-11-23 19:52:03'),
(371, 'Producto Creado', 1, NULL, NULL, 'products', 102, NULL, '{\"part_number\": \"Producto\", \"brand\": \"Fellowes\", \"category\": \"Electrónica\", \"quantity\": 0}', 'Producto creado: Producto', '2025-11-23 19:52:33'),
(372, 'Producto Creado', 34, NULL, NULL, NULL, NULL, NULL, '{\"part_number\":\"Producto\",\"description\":\"Producto\",\"price\":1,\"quantity\":0,\"min_stock\":2,\"max_stock\":3,\"categoryId\":4,\"brandId\":15,\"providerId\":5,\"locationId\":8,\"status\":0,\"brand_id\":15,\"category_id\":4,\"location_id\":8,\"provider_id\":5}', 'Creó producto Producto', '2025-11-23 19:52:33'),
(373, 'Producto Actualizado', 1, NULL, NULL, 'products', 102, '{\"part_number\": \"Producto\", \"brand\": \"Fellowes\", \"category\": \"Electrónica\", \"quantity\": 0, \"status\": 0}', '{\"part_number\": \"Producto\", \"brand\": \"Fellowes\", \"category\": \"Electrónica\", \"quantity\": 0, \"status\": 1}', 'Producto actualizado: Producto', '2025-11-23 19:56:36'),
(374, 'Producto Actualizado', 34, NULL, NULL, 'products', 102, '{\"id\":102,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":4,\"brand_id\":15,\"quantity\":0,\"min_stock\":2,\"max_stock\":3,\"price\":\"1.00\",\"location_id\":8,\"provider_id\":5,\"status\":0,\"created_at\":\"2025-11-24T01:52:33.000Z\",\"updated_at\":\"2025-11-24T01:52:33.000Z\"}', '{\"status\":1}', 'Actualizó producto Producto', '2025-11-23 19:56:36'),
(375, 'Producto Actualizado', 1, NULL, NULL, 'products', 102, '{\"part_number\": \"Producto\", \"brand\": \"Fellowes\", \"category\": \"Electrónica\", \"quantity\": 0, \"status\": 1}', '{\"part_number\": \"Producto\", \"brand\": \"Fellowes\", \"category\": \"Electrónica\", \"quantity\": 0, \"status\": 0}', 'Producto actualizado: Producto', '2025-11-23 19:56:46'),
(376, 'Producto Actualizado', 34, NULL, NULL, 'products', 102, '{\"id\":102,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":4,\"brand_id\":15,\"quantity\":0,\"min_stock\":2,\"max_stock\":3,\"price\":\"1.00\",\"location_id\":8,\"provider_id\":5,\"status\":1,\"created_at\":\"2025-11-24T01:52:33.000Z\",\"updated_at\":\"2025-11-24T01:56:36.000Z\"}', '{\"status\":0}', 'Actualizó producto Producto', '2025-11-23 19:56:46'),
(377, 'Producto Actualizado', 1, NULL, NULL, 'products', 102, '{\"part_number\": \"Producto\", \"brand\": \"Fellowes\", \"category\": \"Electrónica\", \"quantity\": 0, \"status\": 0}', '{\"part_number\": \"Producto\", \"brand\": \"Fellowes\", \"category\": \"Electrónica\", \"quantity\": 1, \"status\": 0}', 'Producto actualizado: Producto', '2025-11-23 19:57:02'),
(378, 'Producto Actualizado', 34, NULL, NULL, 'products', 102, '{\"id\":102,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":4,\"brand_id\":15,\"quantity\":0,\"min_stock\":2,\"max_stock\":3,\"price\":\"1.00\",\"location_id\":8,\"provider_id\":5,\"status\":0,\"created_at\":\"2025-11-24T01:52:33.000Z\",\"updated_at\":\"2025-11-24T01:56:46.000Z\"}', '{\"quantity\":1}', 'Actualizó producto Producto', '2025-11-23 19:57:02'),
(379, 'Producto Eliminado', 12, NULL, NULL, 'products', 102, '{\"id\":102,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":4,\"brand_id\":15,\"quantity\":1,\"min_stock\":2,\"max_stock\":3,\"price\":\"1.00\",\"location_id\":8,\"provider_id\":5,\"status\":0,\"created_at\":\"2025-11-24T01:52:33.000Z\",\"updated_at\":\"2025-11-24T01:57:02.000Z\"}', NULL, 'Eliminó producto Producto', '2025-11-23 19:57:25'),
(380, 'Producto Actualizado', 1, NULL, NULL, 'products', 101, '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 2000, \"status\": 0}', '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 2000, \"status\": 1}', 'Producto actualizado: Producto', '2025-11-23 19:57:37'),
(381, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2000,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-24T01:41:13.000Z\"}', '{\"status\":1}', 'Actualizó producto Producto', '2025-11-23 19:57:37'),
(382, 'Producto Actualizado', 1, NULL, NULL, 'products', 101, '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 2000, \"status\": 1}', '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 2000, \"status\": 0}', 'Producto actualizado: Producto', '2025-11-23 19:57:45'),
(383, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2000,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":1,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-24T01:57:37.000Z\"}', '{\"status\":0}', 'Actualizó producto Producto', '2025-11-23 19:57:45'),
(384, 'Producto Actualizado', 1, NULL, NULL, 'products', 101, '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 2000, \"status\": 0}', '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 2000, \"status\": 0}', 'Producto actualizado: Producto', '2025-11-23 19:57:51'),
(385, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2000,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-24T01:57:45.000Z\"}', '{\"part_number\":\"Producto\",\"description\":\"Producto\",\"price\":\"12.00\",\"quantity\":2000,\"min_stock\":1,\"max_stock\":3,\"categoryId\":6,\"brandId\":19,\"providerId\":4,\"locationId\":3,\"brand_id\":19,\"category_id\":6,\"location_id\":3,\"provider_id\":4}', 'Actualizó producto Producto', '2025-11-23 19:57:51'),
(386, 'Producto Actualizado', 1, NULL, NULL, 'products', 101, '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 2000, \"status\": 0}', '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 2000, \"status\": 1}', 'Producto actualizado: Producto', '2025-11-23 19:57:57'),
(387, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2000,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-24T01:57:51.000Z\"}', '{\"status\":1}', 'Actualizó producto Producto', '2025-11-23 19:57:57'),
(388, 'Producto Actualizado', 1, NULL, NULL, 'products', 101, '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 2000, \"status\": 1}', '{\"part_number\": \"Producto\", \"brand\": \"Mr. Músculo\", \"category\": \"Seguridad\", \"quantity\": 2000, \"status\": 0}', 'Producto actualizado: Producto', '2025-11-23 19:58:00'),
(389, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2000,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":1,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-24T01:57:57.000Z\"}', '{\"status\":0}', 'Actualizó producto Producto', '2025-11-23 19:58:00'),
(390, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2000,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-24T01:58:00.000Z\"}', '{\"status\":1}', 'Actualizó producto Producto', '2025-11-23 20:17:36'),
(391, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2000,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":1,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-24T02:17:36.000Z\"}', '{\"status\":0}', 'Actualizó producto Producto', '2025-11-23 20:17:41'),
(392, '', 34, NULL, NULL, 'brands', 1, '{\"id\":1,\"name\":\"Scotchs\",\"description\":null,\"status\":0,\"created_at\":\"2025-11-22T19:03:56.000Z\",\"updated_at\":\"2025-11-24T01:14:26.000Z\"}', '{\"name\":\"Scotch\"}', 'Actualizó marca Scotch', '2025-11-23 20:17:55'),
(393, '', 34, NULL, NULL, 'brands', 1, '{\"id\":1,\"name\":\"Scotch\",\"description\":null,\"status\":0,\"created_at\":\"2025-11-22T19:03:56.000Z\",\"updated_at\":\"2025-11-24T02:17:55.000Z\"}', '{\"name\":\"Scotchs\"}', 'Actualizó marca Scotchs', '2025-11-23 20:18:05'),
(394, '', 34, NULL, NULL, 'brands', 1, '{\"id\":1,\"name\":\"Scotchs\",\"description\":null,\"status\":0,\"created_at\":\"2025-11-22T19:03:56.000Z\",\"updated_at\":\"2025-11-24T02:18:05.000Z\"}', '{\"name\":\"Scotch\"}', 'Actualizó marca Scotch', '2025-11-23 20:18:14'),
(395, '', 34, NULL, NULL, 'brands', 1, '{\"id\":1,\"name\":\"Scotch\",\"description\":null,\"status\":0,\"created_at\":\"2025-11-22T19:03:56.000Z\",\"updated_at\":\"2025-11-24T02:18:14.000Z\"}', '{\"name\":\"Scotch\"}', 'Actualizó marca Scotch', '2025-11-23 20:18:29'),
(396, '', 34, NULL, NULL, 'brands', 1, '{\"id\":1,\"name\":\"Scotch\",\"description\":null,\"status\":0,\"created_at\":\"2025-11-22T19:03:56.000Z\",\"updated_at\":\"2025-11-24T02:18:14.000Z\"}', '{\"name\":\"Scotch\"}', 'Actualizó marca Scotch', '2025-11-23 20:18:35'),
(397, '', 34, NULL, NULL, 'ranks', 1, '{\"id\":1,\"name\":\"Capitan\",\"description\":null,\"status\":0,\"created_at\":\"2025-11-22T19:03:56.000Z\",\"updated_at\":\"2025-11-22T19:03:56.000Z\"}', '{\"name\":\"Capitan\"}', 'Actualizó rango Capitan', '2025-11-23 20:26:51'),
(398, 'Ubicación Actualizada', 34, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":5,\\\"name\\\":\\\"Almacén Oficina A-1\\\",\\\"description\\\":\\\"Almacén de oficina sección A-1\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T10:13:49.000Z\\\",\\\"updated_at\\\":\\\"2025-05-30T11:53:58.000Z\\\"}\"', '\"{\\\"name\\\":\\\"Almacén Oficina A-1\\\",\\\"description\\\":\\\"Almacén de oficina sección A-1\\\"}\"', 'Actualizó ubicación Almacén Oficina A-1', '2025-11-23 20:27:28'),
(399, 'Categoría Actualizada', 34, NULL, NULL, NULL, NULL, '\"{\\\"id\\\":8,\\\"name\\\":\\\"Consumibless\\\",\\\"description\\\":\\\"Materiales consumibless\\\",\\\"status\\\":0,\\\"created_at\\\":\\\"2025-05-30T10:13:49.000Z\\\",\\\"updated_at\\\":\\\"2025-11-24T01:14:00.000Z\\\"}\"', '\"{\\\"name\\\":\\\"Consumibless\\\",\\\"description\\\":\\\"Materiales consumibless\\\"}\"', 'Actualizó categoría Consumibless', '2025-11-23 20:27:37'),
(400, '', 34, NULL, NULL, 'provider', 8, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó proveedor Marcos Toys', '2025-11-23 20:27:44'),
(401, '', 1, NULL, NULL, 'brands', NULL, NULL, '{\"name\":\"TestBrand_1763951451540\"}', 'Creó marca TestBrand_1763951451540', '2025-11-23 20:30:51'),
(402, 'Marca Creada', 1, NULL, NULL, 'brands', 58, NULL, '{\"name\":\"TestBrand_Fixed_1763951635083\"}', 'Creó marca TestBrand_Fixed_1763951635083', '2025-11-23 20:33:55'),
(403, 'Estado Proveedor Actualizado', 12, NULL, NULL, 'provider', 8, '{\"status\":1}', '{\"status\":0}', 'Habilitó proveedor Marcos Toys', '2025-11-23 20:55:42'),
(404, 'Proveedor Actualizado', 34, NULL, NULL, 'provider', 8, '{\"id\":8,\"name\":\"Marcos Toys\",\"company\":\"Universidad de Colima\",\"email\":\"maxiova312@gmail.com\",\"address\":\"Avenida Universidad 333\\nLas Víboras\",\"status\":0,\"registration\":\"GODE561231GR8\",\"created_at\":\"2025-11-23T23:20:40.000Z\",\"updated_at\":\"2025-11-24T02:55:42.000Z\",\"phone\":\"3121351997\",\"website\":\"www.ucol.mx\",\"contact_name\":\"Esteban Macilla\"}', '{\"name\":\"Marcos Toys\",\"company\":\"Universidad de Colima\",\"email\":\"maxiova312@gmail.com\",\"address\":\"Avenida Universidad 333\\nLas Víboras\",\"registration\":\"GODE561231GR8\",\"phone\":\"3121351998\",\"website\":\"www.ucol.mx\",\"contact_name\":\"Esteban Macilla\"}', 'Actualizó proveedor Marcos Toys', '2025-11-23 20:56:04'),
(405, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2000,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-24T02:17:41.000Z\"}', '{\"quantity\":2001}', 'Actualizó producto Producto', '2025-11-23 22:36:39'),
(406, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2001,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-24T04:36:39.000Z\"}', '{\"status\":1}', 'Actualizó producto Producto', '2025-11-24 15:37:49'),
(407, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2001,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":1,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-24T21:37:49.000Z\"}', '{\"status\":0}', 'Actualizó producto Producto', '2025-11-24 15:37:58'),
(408, 'Producto Creado', 12, NULL, NULL, 'products', 103, NULL, '{\"part_number\":\"3213213\",\"description\":\"dsfdsfsd\",\"price\":3223,\"quantity\":3213,\"min_stock\":32,\"max_stock\":35,\"categoryId\":2,\"brandId\":13,\"providerId\":4,\"locationId\":3,\"status\":0,\"brand_id\":13,\"category_id\":2,\"location_id\":3,\"provider_id\":4}', 'Creó producto 3213213', '2025-11-24 15:51:02'),
(409, 'Producto Eliminado', 12, NULL, NULL, 'products', 103, '{\"id\":103,\"part_number\":\"3213213\",\"description\":\"dsfdsfsd\",\"category_id\":2,\"brand_id\":13,\"quantity\":3213,\"min_stock\":32,\"max_stock\":35,\"price\":\"3223.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T21:51:02.000Z\",\"updated_at\":\"2025-11-24T21:51:02.000Z\"}', NULL, 'Eliminó producto 3213213', '2025-11-24 15:51:08'),
(410, 'Estado Proveedor Actualizado', 13, NULL, NULL, 'provider', 8, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó proveedor Marcos Toys', '2025-11-25 14:42:31'),
(411, 'Estado Proveedor Actualizado', 12, NULL, NULL, 'provider', 8, '{\"status\":1}', '{\"status\":0}', 'Habilitó proveedor Marcos Toys', '2025-11-25 14:44:01'),
(412, 'Estado Proveedor Actualizado', 12, NULL, NULL, 'provider', 8, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó proveedor Marcos Toys', '2025-11-25 14:44:02'),
(413, 'Estado Proveedor Actualizado', 12, NULL, NULL, 'provider', 8, '{\"status\":1}', '{\"status\":0}', 'Habilitó proveedor Marcos Toys', '2025-11-25 14:44:03'),
(414, 'Estado Proveedor Actualizado', 12, NULL, NULL, 'provider', 8, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó proveedor Marcos Toys', '2025-11-25 14:44:03'),
(415, 'Estado Proveedor Actualizado', 12, NULL, NULL, 'provider', 8, '{\"status\":1}', '{\"status\":0}', 'Habilitó proveedor Marcos Toys', '2025-11-25 14:44:04'),
(416, 'Proveedor Actualizado', 12, NULL, NULL, 'provider', 8, '{\"id\":8,\"name\":\"Marcos Toys\",\"company\":\"Universidad de Colima\",\"email\":\"maxiova312@gmail.com\",\"address\":\"Avenida Universidad 333\\nLas Víboras\",\"status\":0,\"registration\":\"GODE561231GR8\",\"created_at\":\"2025-11-23T23:20:40.000Z\",\"updated_at\":\"2025-11-25T20:44:04.000Z\",\"phone\":\"3121351998\",\"website\":\"www.ucol.mx\",\"contact_name\":\"Esteban Macilla\"}', '{\"name\":\"Marcos Toys\",\"company\":\"Universidad de Colima\",\"email\":\"maxiova312@gmail.com\",\"address\":\"Avenida Universidad 333\\nLas Víboras\",\"registration\":\"GODE561231GR8\",\"phone\":null,\"website\":\"www.ucol.mx\",\"contact_name\":\"Esteban Macilla\"}', 'Actualizó proveedor Marcos Toys', '2025-11-25 14:44:11'),
(417, 'Proveedor Actualizado', 12, NULL, NULL, 'provider', 8, '{\"id\":8,\"name\":\"Marcos Toys\",\"company\":\"Universidad de Colima\",\"email\":\"maxiova312@gmail.com\",\"address\":\"Avenida Universidad 333\\nLas Víboras\",\"status\":0,\"registration\":\"GODE561231GR8\",\"created_at\":\"2025-11-23T23:20:40.000Z\",\"updated_at\":\"2025-11-25T20:44:11.000Z\",\"phone\":null,\"website\":\"www.ucol.mx\",\"contact_name\":\"Esteban Macilla\"}', '{\"name\":\"Marcos Toys\",\"company\":\"Universidad de Colima\",\"email\":\"maxiova312@gmail.com\",\"address\":\"Avenida Universidad 333\\nLas Víboras\",\"registration\":\"GODE561231GR8\",\"phone\":\"3121351997\",\"website\":\"www.ucol.mx\",\"contact_name\":\"Esteban Macilla\"}', 'Actualizó proveedor Marcos Toys', '2025-11-25 14:44:18'),
(418, 'Estado Proveedor Actualizado', 12, NULL, NULL, 'provider', 8, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó proveedor Marcos Toys', '2025-11-25 14:53:27'),
(419, 'Estado Proveedor Actualizado', 12, NULL, NULL, 'provider', 8, '{\"status\":1}', '{\"status\":0}', 'Habilitó proveedor Marcos Toys', '2025-11-25 14:53:31'),
(420, 'Proveedor Actualizado', 12, NULL, NULL, 'provider', 8, '{\"id\":8,\"name\":\"Marcos Toys\",\"company\":\"Universidad de Colima\",\"email\":\"maxiova312@gmail.com\",\"address\":\"Avenida Universidad 333\\nLas Víboras\",\"status\":0,\"registration\":\"GODE561231GR8\",\"created_at\":\"2025-11-23T23:20:40.000Z\",\"updated_at\":\"2025-11-25T20:53:31.000Z\",\"phone\":\"3121351997\",\"website\":\"www.ucol.mx\",\"contact_name\":\"Esteban Macilla\"}', '{\"name\":\"Hola Hector\",\"company\":\"Universidad de Colima\",\"email\":\"maxiova312@gmail.com\",\"address\":\"Avenida Universidad 333\\nLas Víboras\",\"registration\":\"GODE561231GR8\",\"phone\":\"3121351997\",\"website\":\"www.ucol.mx\",\"contact_name\":\"Esteban Macilla\"}', 'Actualizó proveedor Hola Hector', '2025-11-25 14:53:39'),
(421, 'Contraseña Cambiada', 12, 12, NULL, 'user', 12, NULL, NULL, 'Usuario 12 cambió su propia contraseña', '2025-11-25 23:19:26'),
(422, 'Contraseña Cambiada', 12, 12, NULL, 'user', 12, NULL, NULL, 'Usuario 12 cambió su propia contraseña', '2025-11-25 23:19:50'),
(423, 'Contraseña Cambiada', 12, 12, NULL, 'user', 12, NULL, NULL, 'Usuario 12 cambió su propia contraseña', '2025-11-25 23:20:16'),
(424, 'Usuario Deshabilitado', 12, 1, NULL, 'user', 1, '{\"status\":0}', '{\"status\":1}', 'Deshabilitó usuario 1', '2025-11-26 08:29:32'),
(425, 'Usuario Rehabilitado', 12, 1, NULL, 'user', 1, '{\"status\":1}', '{\"status\":0}', 'Rehabilitó usuario 1', '2025-11-26 08:29:33'),
(426, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2001,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-24T21:37:58.000Z\"}', '{\"quantity\":2013}', 'Actualizó producto Producto', '2025-11-26 08:29:46'),
(427, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2013,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-26T14:29:46.000Z\"}', '{\"quantity\":11}', 'Actualizó producto Producto', '2025-11-26 08:53:10'),
(428, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":11,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-26T14:53:10.000Z\"}', '{\"quantity\":2}', 'Actualizó producto Producto', '2025-11-26 08:53:37');
INSERT INTO `history` (`id`, `action_type`, `performed_by`, `target_user`, `target_product`, `entity_type`, `entity_id`, `old_value`, `new_value`, `description`, `created_at`) VALUES
(429, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-26T14:53:37.000Z\"}', '{\"quantity\":1}', 'Actualizó producto Producto', '2025-11-26 08:53:51'),
(430, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":1,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-26T14:53:51.000Z\"}', '{\"quantity\":0}', 'Actualizó producto Producto', '2025-11-26 08:55:11'),
(431, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":0,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-26T14:55:11.000Z\"}', '{\"quantity\":1}', 'Actualizó producto Producto', '2025-11-26 08:55:25'),
(432, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":1,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-26T14:55:25.000Z\"}', '{\"quantity\":0}', 'Actualizó producto Producto', '2025-11-26 08:55:37'),
(433, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":0,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-26T14:55:37.000Z\"}', '{\"quantity\":1}', 'Actualizó producto Producto', '2025-11-26 08:55:45'),
(434, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":1,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-26T14:55:45.000Z\"}', '{\"quantity\":2}', 'Actualizó producto Producto', '2025-11-26 09:00:28'),
(435, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":2,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-26T15:00:28.000Z\"}', '{\"quantity\":1}', 'Actualizó producto Producto', '2025-11-26 09:00:32'),
(436, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":1,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-26T15:00:32.000Z\"}', '{\"quantity\":0}', 'Actualizó producto Producto', '2025-11-26 09:00:45'),
(437, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":0,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-26T15:00:45.000Z\"}', '{\"quantity\":1}', 'Actualizó producto Producto', '2025-11-26 09:09:29'),
(438, 'Producto Actualizado', 12, NULL, 21, 'products', 21, '{\"id\":21,\"part_number\":\"OFF-021\",\"description\":\"Reglas Metálicas\",\"category_id\":1,\"brand_id\":2,\"quantity\":10,\"min_stock\":4,\"max_stock\":20,\"price\":\"18.00\",\"location_id\":null,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-22T19:03:56.000Z\"}', '{\"quantity\":1}', 'Actualizó producto OFF-021', '2025-11-26 09:10:16'),
(439, 'Producto Actualizado', 12, NULL, 21, 'products', 21, '{\"id\":21,\"part_number\":\"OFF-021\",\"description\":\"Reglas Metálicas\",\"category_id\":1,\"brand_id\":2,\"quantity\":1,\"min_stock\":4,\"max_stock\":20,\"price\":\"18.00\",\"location_id\":null,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-26T15:10:16.000Z\"}', '{\"quantity\":0}', 'Actualizó producto OFF-021', '2025-11-26 09:11:06'),
(440, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":1,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-26T15:09:29.000Z\"}', '{\"quantity\":0}', 'Actualizó producto Producto', '2025-11-26 09:21:58'),
(441, 'Producto Actualizado', 12, NULL, 101, 'products', 101, '{\"id\":101,\"part_number\":\"Producto\",\"description\":\"Producto\",\"category_id\":6,\"brand_id\":19,\"quantity\":0,\"min_stock\":1,\"max_stock\":3,\"price\":\"12.00\",\"location_id\":3,\"provider_id\":4,\"status\":0,\"created_at\":\"2025-11-24T01:40:01.000Z\",\"updated_at\":\"2025-11-26T15:21:58.000Z\"}', '{\"quantity\":3}', 'Actualizó producto Producto', '2025-11-26 09:22:20'),
(442, 'Producto Actualizado', 12, NULL, 21, 'products', 21, '{\"id\":21,\"part_number\":\"OFF-021\",\"description\":\"Reglas Metálicas\",\"category_id\":1,\"brand_id\":2,\"quantity\":0,\"min_stock\":4,\"max_stock\":20,\"price\":\"18.00\",\"location_id\":null,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-26T15:11:06.000Z\"}', '{\"quantity\":1}', 'Actualizó producto OFF-021', '2025-11-26 09:22:57'),
(443, 'Producto Actualizado', 12, NULL, 21, 'products', 21, '{\"id\":21,\"part_number\":\"OFF-021\",\"description\":\"Reglas Metálicas\",\"category_id\":1,\"brand_id\":2,\"quantity\":1,\"min_stock\":4,\"max_stock\":20,\"price\":\"18.00\",\"location_id\":null,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-26T15:22:57.000Z\"}', '{\"quantity\":0}', 'Actualizó producto OFF-021', '2025-11-26 09:23:21'),
(444, 'Producto Actualizado', 12, NULL, 21, 'products', 21, '{\"id\":21,\"part_number\":\"OFF-021\",\"description\":\"Reglas Metálicas\",\"category_id\":1,\"brand_id\":2,\"quantity\":0,\"min_stock\":4,\"max_stock\":20,\"price\":\"18.00\",\"location_id\":null,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-26T15:23:21.000Z\"}', '{\"quantity\":1}', 'Actualizó producto OFF-021', '2025-11-26 09:31:11'),
(445, 'Producto Actualizado', 12, NULL, 21, 'products', 21, '{\"id\":21,\"part_number\":\"OFF-021\",\"description\":\"Reglas Metálicas\",\"category_id\":1,\"brand_id\":2,\"quantity\":1,\"min_stock\":4,\"max_stock\":20,\"price\":\"18.00\",\"location_id\":null,\"provider_id\":null,\"status\":0,\"created_at\":\"2025-05-29T05:26:56.000Z\",\"updated_at\":\"2025-11-26T15:31:11.000Z\"}', '{\"quantity\":0}', 'Actualizó producto OFF-021', '2025-11-26 09:31:27'),
(446, 'Actualizar Orden', 12, NULL, NULL, 'orders', 1, NULL, NULL, 'Orden actualizada (ID: 1)', '2025-11-26 10:21:39'),
(447, 'Crear Orden', 12, NULL, NULL, 'orders', 2, NULL, NULL, 'Orden creada para producto ID 101', '2025-11-26 10:24:03'),
(448, 'Actualizar Stock', 12, NULL, 101, 'products', 101, '3', '5', 'Stock actualizado por recepción de orden #2', '2025-11-26 10:25:08'),
(449, 'Actualizar Orden', 12, NULL, NULL, 'orders', 2, NULL, NULL, 'Orden actualizada (ID: 2)', '2025-11-26 10:25:08'),
(450, 'Actualizar Stock', 12, NULL, 7, 'products', 7, '50', '62', 'Stock actualizado por recepción de orden #1', '2025-11-26 10:28:46'),
(451, 'Actualizar Orden', 12, NULL, NULL, 'orders', 1, NULL, NULL, 'Orden actualizada (ID: 1)', '2025-11-26 10:28:46'),
(452, 'Crear Orden', 12, NULL, NULL, 'orders', 3, NULL, NULL, 'Orden creada para producto ID 101', '2025-11-26 10:29:38'),
(453, 'Actualizar Stock', 12, NULL, 101, 'products', 101, '5', '6', 'Stock actualizado por recepción de orden #3', '2025-11-26 10:29:43'),
(454, 'Actualizar Orden', 12, NULL, NULL, 'orders', 3, NULL, NULL, 'Orden actualizada (ID: 3)', '2025-11-26 10:29:43'),
(455, 'Crear Orden', 12, NULL, NULL, 'orders', 4, NULL, NULL, 'Orden creada para producto ID 7', '2025-11-26 10:30:26'),
(456, 'Actualizar Stock', 12, NULL, 7, 'products', 7, '62', '63', 'Stock actualizado por recepción de orden #4', '2025-11-26 10:30:29'),
(457, 'Actualizar Orden', 12, NULL, NULL, 'orders', 4, NULL, NULL, 'Orden actualizada (ID: 4)', '2025-11-26 10:30:29'),
(458, 'Crear Orden', 12, NULL, NULL, 'orders', 5, NULL, NULL, 'Orden creada para producto ID 2', '2025-11-26 13:20:09');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `locations`
--

CREATE TABLE `locations` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT 'Nombre de la ubicación',
  `description` text DEFAULT NULL COMMENT 'Descripción de la ubicación',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=activa, 1=eliminada',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `locations`
--

INSERT INTO `locations` (`id`, `name`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Almacén Principal A-1', 'Almacén principal sección A-1', 0, '2025-05-30 10:13:49', '2025-05-30 10:13:49'),
(2, 'Almacén Principal A-2', 'Almacén principal sección A-2', 0, '2025-05-30 10:13:49', '2025-05-30 10:13:49'),
(3, 'Almacén Principal B-1', 'Almacén principal sección B-1', 0, '2025-05-30 10:13:49', '2025-05-30 10:13:49'),
(4, 'Almacén Principal B-2', 'Almacén principal sección B-2', 0, '2025-05-30 10:13:49', '2025-05-30 10:13:49'),
(5, 'Almacén Oficina A-1', 'Almacén de oficina sección A-1', 0, '2025-05-30 10:13:49', '2025-11-24 02:27:28'),
(6, 'Almacén Oficina A-2', 'Almacén de oficina sección A-2', 0, '2025-05-30 10:13:49', '2025-05-30 10:13:49'),
(7, 'Depósito Temporal', 'Área de depósito temporal', 0, '2025-05-30 10:13:49', '2025-05-30 10:13:49'),
(8, 'Área de Trabajo', 'Área de trabajo activa', 0, '2025-05-30 10:13:49', '2025-05-30 10:13:49'),
(9, 'Laboratorio', 'Laboratorio de pruebas', 0, '2025-05-30 10:13:49', '2025-05-30 10:13:49'),
(10, 'EEEEE', 'EEEEE', 1, '2025-05-30 11:33:22', '2025-05-30 15:10:10'),
(11, 'ee', 'eee', 1, '2025-05-30 11:54:02', '2025-05-30 15:10:08'),
(12, 'acacac', 'acacca', 1, '2025-05-30 14:22:58', '2025-05-30 15:10:04'),
(13, 'aa', 'aa', 1, '2025-05-30 15:09:59', '2025-05-30 15:10:02');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `provider_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `status` enum('pending','received','cancelled') DEFAULT 'pending',
  `order_date` datetime DEFAULT current_timestamp(),
  `expected_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `orders`
--

INSERT INTO `orders` (`id`, `product_id`, `provider_id`, `quantity`, `status`, `order_date`, `expected_date`, `notes`, `created_by`) VALUES
(1, 7, 3, 12, 'received', '2025-11-26 10:15:35', '2025-11-27', 'aaaa', 12),
(2, 101, 8, 2, 'received', '2025-11-26 10:24:03', '0000-00-00', 'Notas', 12),
(3, 101, 8, 1, 'received', '2025-11-26 10:29:38', '0000-00-00', '', 12),
(4, 7, 6, 1, 'received', '2025-11-26 10:30:26', '0000-00-00', '', 12),
(5, 2, 5, 12, 'pending', '2025-11-26 13:20:09', '2025-11-26', '', 12);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permission`
--

CREATE TABLE `permission` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(100) DEFAULT NULL,
  `module` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `permission`
--

INSERT INTO `permission` (`id`, `name`, `description`, `module`, `created_at`) VALUES
(1, 'user_read', 'Ver usuarios', 'users', '2025-11-24 00:13:39'),
(2, 'user_create', 'Crear usuarios', 'users', '2025-11-24 00:13:39'),
(3, 'user_update', 'Editar usuarios', 'users', '2025-11-24 00:13:39'),
(4, 'user_delete', 'Eliminar usuarios', 'users', '2025-11-24 00:13:39'),
(5, 'role_read', 'Ver roles y permisos', 'roles', '2025-11-24 00:13:39'),
(6, 'role_create', 'Crear roles', 'roles', '2025-11-24 00:13:39'),
(7, 'role_update', 'Editar roles', 'roles', '2025-11-24 00:13:39'),
(8, 'role_delete', 'Eliminar roles', 'roles', '2025-11-24 00:13:39'),
(9, 'product_read', 'Ver productos', 'products', '2025-11-24 00:13:39'),
(10, 'product_create', 'Crear productos', 'products', '2025-11-24 00:13:39'),
(11, 'product_update', 'Editar productos', 'products', '2025-11-24 00:13:39'),
(12, 'product_delete', 'Eliminar productos', 'products', '2025-11-24 00:13:39'),
(13, 'provider_read', 'Ver proveedores', 'providers', '2025-11-24 00:13:39'),
(14, 'provider_create', 'Crear proveedores', 'providers', '2025-11-24 00:13:39'),
(15, 'provider_update', 'Editar proveedores', 'providers', '2025-11-24 00:13:39'),
(16, 'provider_delete', 'Eliminar proveedores', 'providers', '2025-11-24 00:13:39'),
(17, 'category_read', 'Ver categorías', 'categories', '2025-11-24 00:13:39'),
(18, 'category_create', 'Crear categorías', 'categories', '2025-11-24 00:13:39'),
(19, 'category_update', 'Editar categorías', 'categories', '2025-11-24 00:13:39'),
(20, 'category_delete', 'Eliminar categorías', 'categories', '2025-11-24 00:13:39'),
(21, 'brand_read', 'Ver marcas', 'brands', '2025-11-24 00:13:39'),
(22, 'brand_create', 'Crear marcas', 'brands', '2025-11-24 00:13:39'),
(23, 'brand_update', 'Editar marcas', 'brands', '2025-11-24 00:13:39'),
(24, 'brand_delete', 'Eliminar marcas', 'brands', '2025-11-24 00:13:39'),
(25, 'location_read', 'Ver ubicaciones', 'locations', '2025-11-24 00:13:39'),
(26, 'location_create', 'Crear ubicaciones', 'locations', '2025-11-24 00:13:39'),
(27, 'location_update', 'Editar ubicaciones', 'locations', '2025-11-24 00:13:39'),
(28, 'location_delete', 'Eliminar ubicaciones', 'locations', '2025-11-24 00:13:39'),
(29, 'rank_read', 'Ver rangos', 'ranks', '2025-11-24 00:13:39'),
(30, 'rank_create', 'Crear rangos', 'ranks', '2025-11-24 00:13:39'),
(31, 'rank_update', 'Editar rangos', 'ranks', '2025-11-24 00:13:39'),
(32, 'rank_delete', 'Eliminar rangos', 'ranks', '2025-11-24 00:13:39'),
(33, 'dashboard_view', 'Ver dashboard', 'dashboard', '2025-11-24 00:13:39'),
(34, 'history_view', 'Ver historial', 'history', '2025-11-24 00:13:39'),
(35, 'order_read', 'Ver Ordenes', 'orders', '2025-11-26 16:32:50'),
(36, 'order_create', 'Crear Ordenes', 'orders', '2025-11-26 16:32:50'),
(37, 'order_update', 'Editar Ordenes', 'orders', '2025-11-26 16:32:50'),
(38, 'order_delete', 'Eliminar Ordenes', 'orders', '2025-11-26 16:32:50'),
(39, 'faq_read', 'Ver FAQ', 'faq', '2025-11-26 16:37:51'),
(40, 'faq_create', 'Crear FAQ', 'faq', '2025-11-26 16:37:51'),
(41, 'faq_update', 'Editar FAQ', 'faq', '2025-11-26 16:37:51'),
(42, 'faq_delete', 'Eliminar FAQ', 'faq', '2025-11-26 16:37:51'),
(43, 'calendar_read', 'Ver calendario de ordenes', '', '2025-11-26 18:43:58'),
(44, 'report_view', 'Ver reportes y estadisticas', '', '2025-11-26 20:31:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `part_number` varchar(100) NOT NULL COMMENT 'Número de parte/código del producto',
  `description` text NOT NULL COMMENT 'Descripción detallada del producto',
  `category_id` int(11) DEFAULT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0 COMMENT 'Cantidad actual en stock',
  `min_stock` int(11) NOT NULL DEFAULT 0 COMMENT 'Stock mínimo (alerta)',
  `max_stock` int(11) NOT NULL DEFAULT 0 COMMENT 'Stock máximo recomendado',
  `price` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Precio unitario en pesos mexicanos',
  `location_id` int(11) DEFAULT NULL,
  `provider_id` int(11) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=activo, 1=eliminado',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Volcado de datos para la tabla `products`
--

INSERT INTO `products` (`id`, `part_number`, `description`, `category_id`, `brand_id`, `quantity`, `min_stock`, `max_stock`, `price`, `location_id`, `provider_id`, `status`, `created_at`, `updated_at`) VALUES
(2, 'OFF-002', 'Cintas Adhesivas Transparentes', 1, 1, 11, 8, 40, 18.00, 5, 5, 0, '2025-05-29 05:26:56', '2025-11-24 01:39:22'),
(3, 'OFF-003', 'Cinta de Refrigeración', 1, 2, 10, 3, 20, 45.00, 6, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 21:50:34'),
(4, 'OFF-004', 'Cintas Canela', 1, 2, 12, 4, 25, 22.00, 5, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(5, 'OFF-005', 'Libretas Pasta Dura', 1, 3, 25, 10, 50, 35.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-23 23:12:04'),
(6, 'OFF-006', 'Tintas para Impresora', 1, 4, 8, 3, 15, 850.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(7, 'OFF-007', 'Broches Metálicos para Archivo', 1, 2, 63, 20, 100, 5.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-26 16:30:29'),
(8, 'OFF-008', 'Paquetes de Hojas', 1, 5, 30, 12, 60, 125.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(9, 'OFF-009', 'Perforadora', 1, 6, 3, 1, 5, 180.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(10, 'OFF-010', 'Engrapadora', 1, 7, 4, 2, 8, 220.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(11, 'OFF-011', 'Bocinas para PC', 1, 8, 6, 2, 10, 450.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(12, 'OFF-012', 'Toner HP LaserJet', 1, 4, 5, 2, 12, 1200.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(13, 'OFF-013', 'Clips, Grapas, Bolígrafos', 1, 2, 100, 30, 200, 3.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(14, 'OFF-014', 'Sobres Blancos', 1, 2, 200, 50, 400, 2.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 21:50:31'),
(15, 'OFF-015', 'Lápiz Adhesivo Resistol', 1, 9, 18, 8, 35, 15.00, 6, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(16, 'OFF-016', 'Tinta para Sellos', 1, 10, 12, 5, 25, 35.00, 6, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(17, 'OFF-017', 'Marcadores Permanentes', 1, 11, 25, 10, 50, 28.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(18, 'OFF-018', 'Correctores en Lápiz', 1, 12, 20, 8, 40, 12.00, 7, 4, 0, '2025-05-29 05:26:56', '2025-11-23 23:19:03'),
(19, 'OFF-019', 'Foliador de Hojas', 1, 13, 2, 1, 4, 350.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(20, 'OFF-020', 'Kola Loka Gotero y Resistol 5000 en Tubo', 1, 9, 15, 6, 30, 25.00, 6, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(21, 'OFF-021', 'Reglas Metálicas', 1, 2, 0, 4, 20, 18.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-26 15:31:27'),
(22, 'OFF-022', 'Sobres Manila Tamaño Carta', 1, 2, 150, 40, 300, 3.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(23, 'OFF-023', 'Carpetas Archivo', 1, 14, 40, 15, 80, 8.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(24, 'OFF-024', 'Micas para Enmicadora', 1, 15, 100, 30, 200, 2.50, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(25, 'OFF-025', 'Fólders para Archivo', 1, 14, 80, 25, 160, 4.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(26, 'OFF-026', 'Hojas de Protección Folder', 1, 2, 200, 50, 400, 1.50, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(27, 'OFF-027', 'Arillos para Encarpetar', 1, 2, 60, 20, 120, 0.50, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(28, 'OFF-028', 'Cintas \"DIGACOMINF\"', 1, 16, 8, 3, 15, 45.00, 5, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(29, 'OFF-029', 'Papel Contact Transparente', 1, 17, 12, 5, 25, 85.00, 6, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(30, 'OFF-030', 'Papel Bond Amarillo', 1, 5, 20, 8, 40, 95.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(31, 'LIM-001', 'Cloralex', 3, 18, 24, 10, 50, 35.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(32, 'LIM-002', 'Limpiador de Baños', 3, 19, 15, 6, 30, 45.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(33, 'LIM-003', 'Desinfectante', 3, 20, 20, 8, 40, 65.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(34, 'LIM-004', 'Limpia Metales', 3, 21, 12, 5, 25, 85.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(35, 'LIM-005', 'Biodesengrasante', 3, 22, 18, 7, 35, 95.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(36, 'LIM-006', 'Toallas Desinfectantes', 3, 23, 30, 12, 60, 55.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(37, 'LIM-007', 'Guantes', 3, 24, 100, 30, 200, 8.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(38, 'LIM-008', 'Jergas y Trapos', 3, 2, 50, 20, 100, 12.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(39, 'LIM-009', 'Cepillos para Escoba', 3, 25, 8, 3, 15, 120.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(40, 'LIM-010', 'Esponjas', 3, 26, 40, 15, 80, 18.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(41, 'LIM-011', 'Pastillas de Cloro', 3, 27, 25, 10, 50, 25.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(42, 'LIM-012', 'Rollo Toalla Manos', 3, 23, 36, 12, 72, 45.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(43, 'LIM-013', 'Jabón Líquido para Manos', 3, 28, 20, 8, 40, 38.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(44, 'LIM-014', 'Ácido Muriático', 3, 29, 10, 4, 20, 65.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(45, 'LIM-015', 'Tiner', 3, 30, 12, 5, 25, 85.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(46, 'LIM-016', 'Gasolina', 3, 31, 8, 3, 15, 22.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(47, 'LIM-017', 'Jabón en Polvo', 3, 32, 15, 6, 30, 125.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(48, 'LIM-018', 'Mangas Impermeables', 3, 24, 20, 8, 40, 95.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(49, 'FER-001', 'Removedor de Polvo', 2, 33, 10, 4, 20, 125.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(50, 'FER-002', 'Limpiador de Pantallas', 2, 15, 15, 6, 30, 85.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(51, 'FER-003', 'Silicón', 2, 34, 18, 8, 35, 65.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(52, 'FER-004', 'Aflojatodo', 2, 35, 12, 5, 25, 95.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(53, 'FER-005', 'Flux', 2, 36, 8, 3, 15, 180.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(54, 'FER-006', 'Alcohol Isopropílico', 2, 2, 20, 8, 40, 45.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(55, 'FER-007', 'Rellenador Automotriz', 2, 37, 6, 2, 12, 185.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(56, 'FER-008', 'Conectores RJ-45', 2, 38, 100, 30, 200, 12.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(57, 'FER-009', 'Conectores RJ-11 Y RN-12', 2, 38, 80, 25, 160, 8.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(58, 'FER-010', 'Baterías 9V, AA, AAA', 2, 39, 50, 20, 100, 35.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(59, 'FER-011', 'Pintura para Muros', 2, 30, 15, 6, 30, 285.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(60, 'FER-012', 'Esmalte', 2, 30, 12, 5, 25, 195.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(61, 'FER-013', 'Máscara para Polvo', 2, 40, 25, 10, 50, 35.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(62, 'FER-014', 'Lentes Protectores', 2, 40, 20, 8, 40, 85.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(63, 'FER-015', 'Probador de CCTV', 2, 41, 2, 1, 4, 2500.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(64, 'FER-016', 'Desoldadora', 2, 42, 2, 1, 4, 1200.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(65, 'FER-017', 'Microscopio Electrónico', 2, 43, 1, 1, 2, 8500.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(66, 'FER-018', 'Probador de Componentes', 2, 44, 3, 1, 6, 850.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(67, 'FER-019', 'Lijas', 2, 40, 40, 15, 80, 12.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(68, 'FER-020', 'Remaches', 2, 45, 200, 50, 400, 2.50, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(69, 'FER-021', 'Tornillería', 2, 2, 500, 100, 1000, 1.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(70, 'FER-022', 'Mascarilla para Polvos No Tóxico', 2, 40, 30, 12, 60, 45.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(71, 'FER-023', 'Espuma Limpiadora', 2, 33, 12, 5, 25, 95.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(72, 'FER-024', 'Desinfectante de Superficies', 2, 20, 18, 7, 35, 75.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(73, 'FER-025', 'Thermofit', 2, 40, 25, 10, 50, 15.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(74, 'FER-026', 'Tarjetas para Impresoras Epson', 2, 46, 10, 4, 20, 450.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(75, 'FER-027', 'Refacciones para Impresoras Epson', 2, 46, 15, 6, 30, 850.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(76, 'FER-028', 'Estación de Soldar', 2, 47, 3, 1, 5, 2500.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(77, 'FER-029', 'Cortinas', 2, 48, 8, 3, 15, 850.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(78, 'FER-030', 'Ropa de Cama', 2, 49, 12, 5, 25, 650.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(79, 'FER-031', 'Refacciones para Impresoras Epson (Duplicado)', 2, 46, 8, 3, 15, 750.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(80, 'FER-032', 'Fontanería', 2, 50, 25, 10, 50, 150.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(81, 'FER-033', 'Herrajes', 2, 51, 30, 12, 60, 85.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(82, 'FER-034', 'Herramientas Nuevas', 2, 52, 20, 8, 40, 350.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(83, 'FER-035', 'Electricidad', 2, 53, 40, 15, 80, 75.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(84, 'FER-036', 'Llaves para Lavabo', 2, 50, 8, 3, 15, 450.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(85, 'FER-037', 'Cerraduras', 2, 54, 12, 5, 25, 680.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(86, 'FER-038', 'Regaderas', 2, 50, 6, 2, 12, 850.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(87, 'FER-039', 'Rodillos para Pintura', 2, 55, 15, 6, 30, 45.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(88, 'FER-040', 'Brochas para Pintura', 2, 55, 20, 8, 40, 35.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(89, 'FER-041', 'Arnés de Seguridad', 2, 40, 5, 2, 10, 1200.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(90, 'FER-042', 'Cables Espiral para Telefonía', 2, 56, 25, 10, 50, 85.00, NULL, NULL, 0, '2025-05-29 05:26:56', '2025-11-22 19:03:56'),
(101, 'Producto', 'Producto', 6, 19, 6, 1, 3, 12.00, 3, 4, 0, '2025-11-24 01:40:01', '2025-11-26 16:29:43');

--
-- Disparadores `products`
--
DELIMITER $$
CREATE TRIGGER `tr_prevent_negative_stock` BEFORE UPDATE ON `products` FOR EACH ROW BEGIN
                IF NEW.quantity < 0 THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Stock cannot be negative';
                END IF;
            END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_products_updated_at` BEFORE UPDATE ON `products` FOR EACH ROW BEGIN
    SET NEW.updated_at = NOW();
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_validate_product_stock` BEFORE UPDATE ON `products` FOR EACH ROW BEGIN
    IF NEW.min_stock > NEW.max_stock THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Stock mínimo no puede ser mayor al stock máximo';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_validate_product_stock_insert` BEFORE INSERT ON `products` FOR EACH ROW BEGIN
    IF NEW.min_stock > NEW.max_stock THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Stock mínimo no puede ser mayor al stock máximo';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `provider`
--

CREATE TABLE `provider` (
  `id` int(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `company` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL,
  `registration` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `phone` varchar(20) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `contact_name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `provider`
--

INSERT INTO `provider` (`id`, `name`, `company`, `email`, `address`, `status`, `registration`, `created_at`, `updated_at`, `phone`, `website`, `contact_name`) VALUES
(1, 'Proveedor Desconocido', NULL, '', '', 0, NULL, '2025-11-22 19:33:36', '2025-11-23 23:27:59', NULL, NULL, NULL),
(3, 'Marine Supplies Co.', 'Marine Supplies International', 'contact@marinesupplies.com', '123 Ocean Drive, Miami, FL', 0, 'ROGA880215H45', '2025-11-23 19:11:15', '2025-11-24 00:05:10', '555-0101', 'www.marinesupplies.com', 'John Doe'),
(4, 'Nautical Gear Ltd.', 'Nautical Gear Solutions', 'sales@nauticalgear.com', '456 Harbor Ave, Seattle, WA', 0, 'ABC680524P76', '2025-11-23 19:11:15', '2025-11-24 00:05:17', '555-0102', 'www.nauticalgear.com', 'Jane Smith'),
(5, 'SeaTech Innovations', 'SeaTech Corp', 'info@seatech.com', '789 Bay St, San Francisco, CA', 0, NULL, '2025-11-23 19:11:15', '2025-11-23 23:27:59', '555-0103', 'www.seatech.com', 'Bob Johnson'),
(6, 'Oceanic Parts', 'Oceanic Parts Distributors', 'support@oceanicparts.com', '321 Coral Way, Sydney, NSW', 0, NULL, '2025-11-23 19:11:15', '2025-11-23 23:27:59', '555-0104', 'www.oceanicparts.com', 'Alice Williams'),
(7, 'Deep Blue Marine', 'Deep Blue Enterprises', 'hello@deepbluemarine.com', '654 Reef Rd, Cairns, QLD', 0, NULL, '2025-11-23 19:11:15', '2025-11-23 23:27:59', '555-0105', 'www.deepbluemarine.com', 'Charlie Brown'),
(8, 'Hola Hector', 'Universidad de Colima', 'maxiova312@gmail.com', 'Avenida Universidad 333\nLas Víboras', 0, 'GODE561231GR8', '2025-11-23 23:20:40', '2025-11-25 20:53:39', '3121351997', 'www.ucol.mx', 'Esteban Macilla');

--
-- Disparadores `provider`
--
DELIMITER $$
CREATE TRIGGER `tr_provider_updated_at` BEFORE UPDATE ON `provider` FOR EACH ROW BEGIN
    SET NEW.updated_at = NOW();
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ranks`
--

CREATE TABLE `ranks` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT 'Nombre del rango',
  `description` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=activo, 1=eliminado',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `ranks`
--

INSERT INTO `ranks` (`id`, `name`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Capitan', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(2, 'General', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(3, 'Coronel', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56'),
(4, 'Sargento', NULL, 0, '2025-11-22 19:03:56', '2025-11-22 19:03:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `role`
--

CREATE TABLE `role` (
  `id` int(10) NOT NULL,
  `role` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `role`
--

INSERT INTO `role` (`id`, `role`, `created_at`, `updated_at`) VALUES
(1, 'Administrador', '2025-11-22 19:33:36', '2025-11-24 01:30:19'),
(2, 'Capturista', '2025-11-22 19:33:36', '2025-11-26 16:56:54'),
(3, 'Consultor', '2025-11-22 19:33:36', '2025-11-24 00:37:17');

--
-- Disparadores `role`
--
DELIMITER $$
CREATE TRIGGER `tr_role_updated_at` BEFORE UPDATE ON `role` FOR EACH ROW BEGIN
    SET NEW.updated_at = NOW();
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `role_permission`
--

CREATE TABLE `role_permission` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `role_permission`
--

INSERT INTO `role_permission` (`role_id`, `permission_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10),
(1, 11),
(1, 12),
(1, 13),
(1, 14),
(1, 15),
(1, 16),
(1, 17),
(1, 18),
(1, 19),
(1, 20),
(1, 21),
(1, 22),
(1, 23),
(1, 24),
(1, 25),
(1, 26),
(1, 27),
(1, 28),
(1, 29),
(1, 30),
(1, 31),
(1, 32),
(1, 33),
(1, 34),
(1, 35),
(1, 36),
(1, 37),
(1, 38),
(1, 39),
(1, 40),
(1, 41),
(1, 42),
(1, 43),
(1, 44),
(2, 1),
(2, 2),
(2, 3),
(2, 4),
(2, 9),
(2, 10),
(2, 11),
(2, 12),
(2, 13),
(2, 14),
(2, 15),
(2, 16),
(2, 17),
(2, 18),
(2, 19),
(2, 20),
(2, 21),
(2, 22),
(2, 23),
(2, 24),
(2, 25),
(2, 26),
(2, 27),
(2, 28),
(2, 29),
(2, 30),
(2, 31),
(2, 32),
(2, 33),
(2, 34),
(2, 35),
(2, 36),
(2, 37),
(2, 38),
(2, 39),
(3, 9),
(3, 13),
(3, 17),
(3, 21),
(3, 25),
(3, 29);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user`
--

CREATE TABLE `user` (
  `id` int(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `account` int(10) NOT NULL,
  `email` varchar(255) NOT NULL,
  `rank_id` int(11) DEFAULT NULL,
  `status` tinyint(1) NOT NULL,
  `registration` datetime NOT NULL DEFAULT current_timestamp(),
  `last_access` datetime DEFAULT NULL,
  `profile_pic` varchar(255) DEFAULT NULL,
  `roleId` int(10) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `user`
--

INSERT INTO `user` (`id`, `name`, `password`, `account`, `email`, `rank_id`, `status`, `registration`, `last_access`, `profile_pic`, `roleId`, `updated_at`) VALUES
(1, 'System', '$2b$10$SystemPasswordHashPlaceholder', 0, 'system@nauticstock.internal', NULL, 0, '2025-11-22 13:35:20', NULL, NULL, 1, '2025-11-26 14:29:33'),
(11, 'Maximiliano Mendoza Lopez A', '$2b$10$4XaOvywWk5yg1l56d/zWxOQaTQyIiK8GSqpSL1yTUsCbl8BZBPpti', 20156535, 'maxiova312@gmail.com', 1, 0, '2025-04-26 20:08:36', '2025-04-28 01:40:44', '/uploads/avatar-11-1745825089134.png', 2, '2025-11-22 19:24:18'),
(12, 'Ulises Garcia Rea', '$2b$10$0yOt.grM9Nsj6JYcd.I9peTYXhgzg//8/MYzHkJgg9qJb6HQ5RIiq', 202221546, 'ugarcia0@ucol.mx', 1, 0, '2025-04-26 22:50:50', '2025-11-26 18:09:15', '/uploads/avatar-12-1748614598130.png', 1, '2025-11-27 00:09:15'),
(13, 'Esteban Daniel Mancilla Lozoya', '$2b$10$Yxj0eaUewt5JTLLS5QTx5.QEtCu7NRzgeQNM90HHHQoV6wsRwWRPy', 20156487, 'emancilla0@ucol.mx', 2, 0, '2025-04-26 22:52:12', '2025-11-26 13:23:46', '/uploads/avatar-13-1748575574826.png', 2, '2025-11-26 19:23:46'),
(17, 'Gabriel Mendoza Lopez a', '$2b$10$2KNXta9edsHYHxmPDY0IL.yXNnYNunwrwcm6.PCnV43MWIMj8T1Jm', 980809821, 'gmendozalopez24@gmail.com', 3, 0, '2025-04-27 21:06:01', '2025-11-23 18:44:20', '/uploads/avatar-17-1745809754457.jpg', 3, '2025-11-24 00:44:20'),
(18, 'Hector Daniel Martinez', '$2b$10$IJ/MmwW9SqOaEjYH5if/1.pvFyyvaGEfwGcE7Vt91Au4rCV8isE3y', 123456789, 'imontiel@ucol.mx', 4, 0, '2025-04-28 00:47:29', '2025-05-30 09:02:07', '/uploads/avatar-18-1748617408951.jpg', 1, '2025-11-22 19:24:18'),
(30, 'Diego Danae', '$2b$10$DbTtabZatdvpzUYhgHOYce02qV5x4bW3SOeUa.gAmV6l8PL1AqHX.', 2147483647, 'hmartinez@ucol.mx', 1, 0, '2025-05-30 08:32:36', NULL, NULL, 2, '2025-11-22 19:24:18'),
(33, 'Maximiliano Alexander Mendoza Lopez', '$2b$10$UMRnHZivFfyy8SEcYkTbyekyfCTHnCRKXmqbCXcmEKLHlY3UDzv4C', 20156422, 'maxiova1234@gmail.com', 1, 0, '2025-10-24 09:08:49', NULL, NULL, 3, '2025-11-22 19:24:18'),
(34, 'Max', '$2b$10$L8hprnLGnJOgRrfRFQq7xuPi3gd1eCjOzuqv36/Hlr9.TuV3FfQBq', 20156521, 'maxiova312@gmail.mx', 3, 0, '2025-11-21 15:01:15', '2025-11-24 10:43:08', NULL, 1, '2025-11-24 16:43:08'),
(35, 'Gabriel', '$2b$10$HNIRv2uRPVRQJAuxOM0FvuWVL81zjkSRbZ99It6jLX/wffloEgJIK', 20156481, 'imontiel@ucol.com', 2, 0, '2025-11-21 15:09:59', NULL, NULL, 2, '2025-11-22 19:24:18'),
(38, 'no waay', '$2b$10$a1TmiYZBVTnj9NpnLRJ3Xu1iEvobRAwwEBX9SnCOLoaLvM4PndX9O', 20156537, 'maxiova312@gmail.es', 4, 0, '2025-11-23 16:38:13', NULL, NULL, 2, '2025-11-23 22:53:27');

--
-- Disparadores `user`
--
DELIMITER $$
CREATE TRIGGER `tr_user_updated_at` BEFORE UPDATE ON `user` FOR EACH ROW BEGIN
    SET NEW.updated_at = NOW();
END
$$
DELIMITER ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `brands`
--
ALTER TABLE `brands`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `faqs`
--
ALTER TABLE `faqs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_faqs_category` (`category_id`);

--
-- Indices de la tabla `faq_categories`
--
ALTER TABLE `faq_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `history`
--
ALTER TABLE `history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_history_performer` (`performed_by`),
  ADD KEY `fk_history_target` (`target_user`),
  ADD KEY `fk_history_product` (`target_product`);

--
-- Indices de la tabla `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indices de la tabla `permission`
--
ALTER TABLE `permission`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_products_brand` (`brand_id`),
  ADD KEY `fk_products_category` (`category_id`),
  ADD KEY `fk_products_location` (`location_id`),
  ADD KEY `fk_products_provider` (`provider_id`);

--
-- Indices de la tabla `provider`
--
ALTER TABLE `provider`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `ranks`
--
ALTER TABLE `ranks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `role_permission`
--
ALTER TABLE `role_permission`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indices de la tabla `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `account` (`account`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_roleId` (`roleId`),
  ADD KEY `fk_user_rank` (`rank_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `brands`
--
ALTER TABLE `brands`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT de la tabla `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `faqs`
--
ALTER TABLE `faqs`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `faq_categories`
--
ALTER TABLE `faq_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `history`
--
ALTER TABLE `history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=459;

--
-- AUTO_INCREMENT de la tabla `locations`
--
ALTER TABLE `locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `permission`
--
ALTER TABLE `permission`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT de la tabla `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `provider`
--
ALTER TABLE `provider`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `ranks`
--
ALTER TABLE `ranks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `role`
--
ALTER TABLE `role`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `user`
--
ALTER TABLE `user`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `faqs`
--
ALTER TABLE `faqs`
  ADD CONSTRAINT `fk_faqs_category` FOREIGN KEY (`category_id`) REFERENCES `faq_categories` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `history`
--
ALTER TABLE `history`
  ADD CONSTRAINT `fk_history_performer` FOREIGN KEY (`performed_by`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_history_product` FOREIGN KEY (`target_product`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_history_target` FOREIGN KEY (`target_user`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `provider` (`id`),
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);

--
-- Filtros para la tabla `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_products_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_products_provider` FOREIGN KEY (`provider_id`) REFERENCES `provider` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `role_permission`
--
ALTER TABLE `role_permission`
  ADD CONSTRAINT `role_permission_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permission_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permission` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `fk_roleId` FOREIGN KEY (`roleId`) REFERENCES `role` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_user_rank` FOREIGN KEY (`rank_id`) REFERENCES `ranks` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `user_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `role` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
