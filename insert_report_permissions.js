const mysql = require('mysql2/promise');
const { db: dbConfig } = require('./app/config/config');

async function insertReportPermissions() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado a la base de datos.');

        // 1. Insertar el permiso 'report_view' si no existe
        const permissionName = 'report_view';
        const permissionDescription = 'Ver reportes y estadisticas';

        const [existingPerms] = await connection.execute(
            'SELECT id FROM permission WHERE name = ?',
            [permissionName]
        );

        let permissionId;

        if (existingPerms.length === 0) {
            const [result] = await connection.execute(
                'INSERT INTO permission (name, description) VALUES (?, ?)',
                [permissionName, permissionDescription]
            );
            permissionId = result.insertId;
            console.log(`✅ Permiso '${permissionName}' creado con ID: ${permissionId}`);
        } else {
            permissionId = existingPerms[0].id;
            console.log(`ℹ️ El permiso '${permissionName}' ya existe con ID: ${permissionId}`);
        }

        // 2. Asignar el permiso al rol de Administrador (ID 1)
        const adminRoleId = 1;

        const [existingAssignment] = await connection.execute(
            'SELECT * FROM role_permission WHERE role_id = ? AND permission_id = ?',
            [adminRoleId, permissionId]
        );

        if (existingAssignment.length === 0) {
            await connection.execute(
                'INSERT INTO role_permission (role_id, permission_id) VALUES (?, ?)',
                [adminRoleId, permissionId]
            );
            console.log(`✅ Permiso '${permissionName}' asignado al rol de Administrador.`);
        } else {
            console.log(`ℹ️ El rol de Administrador ya tiene el permiso '${permissionName}'.`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

insertReportPermissions();
