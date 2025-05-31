const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ProductsController = require('../controllers/productsController');

const productsController = new ProductsController();

// GET /api/products - Obtener todos los productos
router.get('/', auth, async (req, res) => {
  await productsController.getAllProducts(req, res);
});

// POST /api/products - Crear nuevo producto
router.post('/', auth, async (req, res) => {
  await productsController.createProduct(req, res);
});

// GET /api/products/:id - Obtener producto por ID
router.get('/:id', auth, async (req, res) => {
  await productsController.getProductById(req, res);
});

// PUT /api/products/:id - Actualizar producto
router.put('/:id', auth, async (req, res) => {
  await productsController.updateProduct(req, res);
});

// DELETE /api/products/:id - Eliminar producto
router.delete('/:id', auth, async (req, res) => {
  await productsController.deleteProduct(req, res);
});

module.exports = router;