// app/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = (req, res, next) => {
  console.log('🔑 Auth middleware - Headers:', req.headers.authorization ? 'Token presente' : 'No token');
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    console.log('❌ Auth middleware - Token no proporcionado');
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    console.log('✅ Auth middleware - Usuario autenticado:', payload.id);
    req.user = payload;   // { id, name, roleId }

    // Actualizar última actividad (sin await para no bloquear)
    const User = require('../models/user');
    const userModel = new User();

    // Cargar permisos y adjuntar al usuario
    userModel.getPermissions(payload.roleId).then(perms => {
      req.user.permissions = perms;
      console.log(`🔑 Permissions loaded for user ${payload.id}:`, perms.length);
      next();
    }).catch(err => {
      console.error('⚠️ Error loading permissions:', err);
      // Aún si falla la carga de permisos, permitimos continuar (aunque fallará en checkPermission)
      // O podríamos bloquear. Por seguridad, mejor continuar pero sin permisos.
      req.user.permissions = [];
      next();
    });

    userModel.updateLastAccess(payload.id).catch(err =>
      console.error('⚠️ Error actualizando last_access:', err.message)
    );

  } catch (err) {
    console.log('❌ Auth middleware - Token inválido');
    return res.status(401).json({ error: 'Token inválido' });
  }
};
