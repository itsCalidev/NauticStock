// app/routes/avatarRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const UserController = require('../controllers/userController');
const userCtrl = new UserController();
const router = express.Router();

// Asegurar carpeta de uploads
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.params.id}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// POST /users/:id/avatar → subir/actualizar avatar
router.post(
  '/:id/avatar',
  auth,
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      // … borras el avatar viejo …

      const filePath = `/uploads/${req.file.filename}`;
      // Actualiza solo la columna, sin log:
      await userCtrl.userModel.updateUser(id, { profile_pic: filePath });

      // 👇 FORMATO ESTÁNDAR
      res.json({
        success: true,
        data: { profile_pic: filePath },
        message: 'Avatar actualizado exitosamente'
      });
    } catch (err) {
      // 👇 FORMATO ESTÁNDAR DE ERROR
      res.status(500).json({
        success: false,
        error: err.message || 'Error al subir avatar'
      });
    }
  }
);

module.exports = router;
