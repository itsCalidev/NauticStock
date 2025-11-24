const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const categoryController = new CategoryController();

// Obtener todas las categorías activas (cualquier usuario autenticado)
router.get('/', auth, async (req, res) => {
    await categoryController.getCategories(req, res);
});

// Obtener todas las categorías incluyendo deshabilitadas (solo administradores)
router.get('/all/disabled', auth, isAdmin, async (req, res) => {
    await categoryController.getAllCategories(req, res);
});

// Obtener categoría por ID (cualquier usuario autenticado)
router.get('/:id', auth, async (req, res) => {
    await categoryController.getCategoryById(req, res);
});

// Crear nueva categoría (solo administradores)
router.post('/', auth, isAdmin, async (req, res) => {
    await categoryController.createCategory(req, res);
});

// Actualizar categoría (solo administradores)
router.put('/:id', auth, isAdmin, async (req, res) => {
    await categoryController.updateCategory(req, res);
});

// Rehabilitar categoría (solo administradores)
router.put('/:id/enable', auth, isAdmin, async (req, res) => {
    await categoryController.enableCategory(req, res);
});

// Eliminar/Deshabilitar categoría (solo administradores)
router.delete('/:id', auth, isAdmin, async (req, res) => {
    await categoryController.deleteCategory(req, res);
});

module.exports = router;
