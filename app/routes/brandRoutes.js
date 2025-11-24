const express = require('express');
const router = express.Router();
const BrandsController = require('../controllers/BrandsController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const controller = new BrandsController();

// Obtener todas las marcas (autenticado)
router.get('/', auth, (req, res) => controller.getAllBrands(req, res));

// Crear marca (admin)
router.post('/', auth, isAdmin, (req, res) => controller.createBrand(req, res));

// Actualizar marca (admin)
router.put('/:id', auth, isAdmin, (req, res) => controller.updateBrand(req, res));

// Eliminar marca (admin)
router.delete('/:id', auth, isAdmin, (req, res) => controller.deleteBrand(req, res));

module.exports = router;
