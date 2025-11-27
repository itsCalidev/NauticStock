const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nauticstock'
};

async function insertPermissions() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado a la base de datos');

        const permissions = [
            { name: 'order_read', description: 'Ver Ordenes', module: 'orders' },
            { name: 'order_create', description: 'Crear Ordenes', module: 'orders' },
            { name: 'order_update', description: 'Editar Ordenes', module: 'orders' },
            { name: 'order_delete', description: 'Eliminar Ordenes', module: 'orders' }
        ];

        for (const perm of permissions) {
            // Check if exists
            const [rows] = await connection.execute('SELECT id FROM permission WHERE name = ?', [perm.name]);

            if (rows.length === 0) {
                await connection.execute(
                    'INSERT INTO permission (name, description, module) VALUES (?, ?, ?)',
                    [perm.name, perm.description, perm.module]
                );
                console.log(`✅ Permiso creado: ${perm.name}`);
            } else {
                console.log(`ℹ️ Permiso ya existe: ${perm.name}`);
            }
        }

        // Assign to admin role (id: 1)
        console.log('🔄 Asignando permisos al rol Administrador (ID: 1)...');

        const [adminPermissions] = await connection.execute(
            `SELECT id FROM permission WHERE module = 'orders'`
        );

        for (const p of adminPermissions) {
            const [exists] = await connection.execute(
                'SELECT * FROM role_permission WHERE role_id = 1 AND permission_id = ?',
                [p.id]
            );

            if (exists.length === 0) {
                await connection.execute(
                    'INSERT INTO role_permission (role_id, permission_id) VALUES (1, ?)',
                    [p.id]
                );
                console.log(`✅ Permiso ID ${p.id} asignado a Admin`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

insertPermissions();
