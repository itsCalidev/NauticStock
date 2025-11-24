const express = require('express');
const router = express.Router();
const ProviderController = require('../controllers/ProviderController');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

const controller = new ProviderController();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas con permisos granulares
router.get('/', checkPermission('provider_read'), (req, res) => controller.getAllProviders(req, res));
router.post('/', checkPermission('provider_create'), (req, res) => controller.createProvider(req, res));
router.put('/:id', checkPermission('provider_update'), (req, res) => controller.updateProvider(req, res));
router.delete('/:id', checkPermission('provider_delete'), (req, res) => controller.deleteProvider(req, res));
router.put('/:id/status', checkPermission('provider_update'), (req, res) => controller.toggleProviderStatus(req, res));

module.exports = router;
