const express = require('express');
const router = express.Router();
const RoleController = require('../controllers/RoleController');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

const controller = new RoleController();

router.use(authMiddleware);

// Obtener todos los roles
router.get('/', checkPermission('role_read'), (req, res) => controller.getAllRoles(req, res));

// Obtener lista de permisos disponibles (para formularios)
// Usamos role_read o role_create/update ya que se necesita para crear roles
router.get('/permissions', checkPermission('role_read'), (req, res) => controller.getAllPermissions(req, res));

// Crear rol
router.post('/', checkPermission('role_create'), (req, res) => controller.createRole(req, res));

// Actualizar rol
router.put('/:id', checkPermission('role_update'), (req, res) => controller.updateRole(req, res));

// Eliminar rol
router.delete('/:id', checkPermission('role_delete'), (req, res) => controller.deleteRole(req, res));

module.exports = router;
