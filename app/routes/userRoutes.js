// app/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const UserController = require('../controllers/userController');
const userCtrl = new UserController();
const upload = require('../middleware/upload');
const isAdmin = require('../middleware/isAdmin');

const userController = new UserController();

// 👇 NUEVA RUTA: Actualizar mi propio perfil (solo contraseña)
router.put(
  '/me/password',
  auth, // Solo requiere estar autenticado
  async (req, res) => {
    await userCtrl.updateMyPassword(req, res);
  }
);

// Crear usuario + log            ← solo admin
router.post(
  '/',
  auth, isAdmin,
  async (req, res) => {
    await userCtrl.register(req, res);
  }
);

router.put(
  '/:id/profile-pic',
  auth,
  upload.single('profilePic'),
  async (req, res) => {
    await userCtrl.updateProfilePic(req, res);
  }
);

// Obtener todos (no log)         ← validado en controlador
router.get(
  '/',
  auth,
  async (req, res) => {
    await userCtrl.getAllUsers(req, res);
  }
);

// Obtener perfil por ID
router.get(
  '/:id',
  auth,
  async (req, res) => {
    await userCtrl.getById(req, res);
  }
);

// Actualizar usuario + log       ← solo admin
router.put(
  '/:id',
  auth, isAdmin,
  async (req, res) => {
    await userCtrl.update(req, res);
  }
);

// Eliminar usuario por ID         ← solo admin
router.delete('/:id', auth, isAdmin, async (req, res) => {
  await userCtrl.delete(req, res);
});

// Endpoint para el Administrador
router.post('/:id/reset-password', auth, isAdmin, userController.resetPasswordAdmin.bind(userController));

// Endpoint para el Usuario forzado a cambiar (Usa auth porque el token restringido es un JWT válido)
router.post('/force-password-change', auth, userController.forcePasswordChange.bind(userController));

module.exports = router;