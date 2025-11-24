// app/middleware/checkPermission.js
// Para mantener consistencia, consultaremos los permisos del usuario si no están en el token/req.user

module.exports = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }

            // Si es Admin (roleId 1), tiene acceso total (bypass)
            // Opcional: Si quieres que incluso el admin pase por la tabla de permisos, quita esto.
            // Pero por seguridad/conveniencia, el rol 1 suele ser SuperAdmin.
            if (user.roleId === 1) {
                return next();
            }

            // Verificar si el usuario tiene el permiso en su lista de permisos
            // Los permisos deben haber sido cargados en el middleware de auth o aquí mismo.
            // Para eficiencia, es mejor cargarlos en el login/auth y ponerlos en req.user.permissions

            if (!user.permissions || !user.permissions.includes(requiredPermission)) {
                console.log(`⛔ Acceso denegado. Usuario ${user.id} (Rol ${user.roleId}) requiere permiso: ${requiredPermission}`);
                return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
            }

            next();
        } catch (error) {
            console.error('Error en checkPermission:', error);
            return res.status(500).json({ error: 'Error interno verificando permisos' });
        }
    };
};
