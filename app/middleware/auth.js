// app/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    
    // --- NUEVA LÓGICA PARA BLOQUEAR TOKENS RESTRINGIDOS ---
    // Si el token es restringido y la ruta NO es la de cambiar contraseña, lo bloqueamos
    // Ajusta '/force-password-change' según cómo nombraremos la ruta en tus routes
    if (payload.isRestricted && !req.originalUrl.includes('/force-password-change')) {
        return res.status(403).json({ error: 'Acceso denegado. Debes cambiar tu contraseña temporal antes de continuar.' });
    }
    // ------------------------------------------------------

    req.user = payload;

    const User = require('../models/user');
    const userModel = new User();

    // Solo cargar permisos y actualizar acceso si NO es un token restringido
    if (!payload.isRestricted) {
        userModel.getPermissions(payload.roleId).then(perms => {
          req.user.permissions = perms;
          next();
        }).catch(err => {
          req.user.permissions = [];
          next();
        });

        userModel.updateLastAccess(payload.id).catch(err => console.error(err.message));
    } else {
        // Si es restringido, pasa directamente sin cargar permisos
        next();
    }

  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};