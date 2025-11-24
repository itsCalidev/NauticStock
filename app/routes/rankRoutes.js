const express = require('express');
const router = express.Router();
const RanksController = require('../controllers/RanksController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const controller = new RanksController();

// Obtener todos los rangos (autenticado)
router.get('/', auth, (req, res) => controller.getAllRanks(req, res));

// Crear rango (admin)
router.post('/', auth, isAdmin, (req, res) => controller.createRank(req, res));

// Actualizar rango (admin)
router.put('/:id', auth, isAdmin, (req, res) => controller.updateRank(req, res));

// Eliminar rango (admin)
router.delete('/:id', auth, isAdmin, (req, res) => controller.deleteRank(req, res));

module.exports = router;
