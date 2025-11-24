const express = require('express');
const router = express.Router();
const LocationController = require('../controllers/locationController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const locationController = new LocationController();

// Obtener todas las ubicaciones activas (cualquier usuario autenticado)
router.get('/', auth, async (req, res) => {
    await locationController.getLocations(req, res);
});

// Obtener todas las ubicaciones incluyendo deshabilitadas (solo administradores)
router.get('/all/disabled', auth, isAdmin, async (req, res) => {
    await locationController.getAllLocations(req, res);
});

// Obtener ubicación por ID (cualquier usuario autenticado)
router.get('/:id', auth, async (req, res) => {
    await locationController.getLocationById(req, res);
});

// Crear nueva ubicación (solo administradores)
router.post('/', auth, isAdmin, async (req, res) => {
    await locationController.createLocation(req, res);
});

// Actualizar ubicación (solo administradores)
router.put('/:id', auth, isAdmin, async (req, res) => {
    await locationController.updateLocation(req, res);
});

// Rehabilitar ubicación (solo administradores)
router.put('/:id/enable', auth, isAdmin, async (req, res) => {
    await locationController.enableLocation(req, res);
});

// Eliminar/Deshabilitar ubicación (solo administradores)
router.delete('/:id', auth, isAdmin, async (req, res) => {
    await locationController.deleteLocation(req, res);
});

module.exports = router;
