const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nauticstock'
};

async function fixPermissions() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado a la base de datos');

        const updates = [
            { old: 'view_faq', new: 'faq_read', desc: 'Ver FAQ' },
            { old: 'create_faq', new: 'faq_create', desc: 'Crear FAQ' },
            { old: 'update_faq', new: 'faq_update', desc: 'Editar FAQ' },
            { old: 'delete_faq', new: 'faq_delete', desc: 'Eliminar FAQ' }
        ];

        for (const update of updates) {
            // Check if old exists
            const [rows] = await connection.execute('SELECT id FROM permission WHERE name = ?', [update.old]);

            if (rows.length > 0) {
                await connection.execute(
                    'UPDATE permission SET name = ? WHERE name = ?',
                    [update.new, update.old]
                );
                console.log(`✅ Renombrado: ${update.old} -> ${update.new}`);
            } else {
                console.log(`ℹ️ No se encontró: ${update.old} (quizás ya fue renombrado)`);
                // Ensure new exists
                const [newRows] = await connection.execute('SELECT id FROM permission WHERE name = ?', [update.new]);
                if (newRows.length === 0) {
                    await connection.execute(
                        'INSERT INTO permission (name, description, module) VALUES (?, ?, ?)',
                        [update.new, update.desc, 'faq']
                    );
                    console.log(`✅ Creado: ${update.new}`);
                }
            }
        }

        // Ensure admin has them
        const [adminPermissions] = await connection.execute(
            `SELECT id FROM permission WHERE module = 'faq'`
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

fixPermissions();
