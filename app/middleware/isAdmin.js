// app/middleware/isAdmin.js
module.exports = (req, res, next) => {
    if (!req.user || req.user.roleId !== 1) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };