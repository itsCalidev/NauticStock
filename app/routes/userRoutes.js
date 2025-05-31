// app/routes/userRoutes.js
const express        = require('express');
const router         = express.Router();
const auth           = require('../middleware/auth');
const isAdmin        = require('../middleware/isAdmin');
const UserController = require('../controllers/userController');
const userCtrl       = new UserController();

// 👇 NUEVA RUTA: Actualizar mi propio perfil (solo contraseña)
router.put(
  '/me/password',
  auth, // Solo requiere estar autenticado
  async (req, res, next) => {
    try {
      const updated = await userCtrl.updateMyPassword(
        req.user.id, // ID del usuario autenticado
        req.body,
        req.user.id
      );
      res.json({ updated });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      next(err);
    }
  }
);

// Crear usuario + log            ← solo admin
router.post(
  '/',
  auth, isAdmin,
  async (req, res, next) => {
    try {
      const id = await userCtrl.register(req.body, req.user.id);
      res.status(201).json({ id });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Ya existe un usuario con esa matrícula' });
      }
      next(err);
    }
  }
);

// Obtener todos (no log)         ← solo admin
router.get(
  '/',
  auth, isAdmin,
  async (req, res, next) => {
    try {
      const users = await userCtrl.getAllUsers();
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
);

// Obtener perfil por ID
router.get(
  '/:id',
  auth,
  async (req, res, next) => {
    try {
      console.log('🔍 GET /api/users/:id llamado:', {
        paramId: req.params.id,
        userType: typeof req.params.id,
        userId: req.user?.id,
        userRoleId: req.user?.roleId
      });

      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          error: "ID de usuario inválido" 
        });
      }

      // Permitir que cualquier usuario vea su propio perfil
      // Los admins pueden ver cualquier perfil
      if (req.user.roleId !== 1 && req.user.id !== userId) {
        return res.status(403).json({ 
          error: "No tienes permisos para ver este perfil" 
        });
      }

      const user = await userCtrl.getById(userId);
      
      if (!user) {
        console.log('❌ Usuario no encontrado:', userId);
        return res.status(404).json({ 
          error: "Usuario no encontrado" 
        });
      }

      console.log('✅ Usuario encontrado:', { id: user.id, name: user.name, status: user.status });

      // 👇 IMPORTANTE: Verificar formato de respuesta
      res.json({
        success: true,
        data: user
      });

    } catch (err) {
      console.error('❌ Error en GET /users/:id:', err);
      next(err);
    }
  }
);

// Actualizar usuario + log       ← solo admin
router.put(
  '/:id',
  auth, isAdmin,
  async (req, res, next) => {
    try {
      const updated = await userCtrl.update(
        req.params.id,
        req.body,
        req.user.id
      );
      res.json({ updated });
    } catch (err) {
      next(err);
    }
  }
);

// Eliminar usuario por ID         ← solo admin
router.delete('/:id', auth, isAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Validar que no se esté eliminando a sí mismo
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    console.log(`🗑️ Eliminando usuario ${userId} por ${req.user.id}`);
    
    const deleted = await userCtrl.delete(userId, req.user.id);
    
    res.json({ 
      message: 'Usuario eliminado exitosamente',
      deleted 
    });
    
  } catch (err) {
    console.error('❌ Error en DELETE /:id:', err);
    
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    
    // Error genérico
    res.status(500).json({ 
      error: 'Error interno del servidor al eliminar usuario' 
    });
  }
});

module.exports = router;
