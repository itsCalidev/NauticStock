// app/middleware/auth.js
const jwt    = require('jsonwebtoken');
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
    next();
  } catch (err) {
    console.log('❌ Auth middleware - Token inválido');
    return res.status(401).json({ error: 'Token inválido' });
  }
};
