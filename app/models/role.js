const Model = require("./Model");

class Role extends Model {
    constructor() {
        super();
        this.tableName = "role";
        this.initializeDB();
    }

    async findAllWithPermissions() {
        try {
            // 1. Obtener roles
            const roles = await this.execute("SELECT * FROM role");

            // 2. Obtener permisos por rol
            const rolePermissions = await this.execute(`
        SELECT rp.role_id, p.id as permission_id, p.name, p.description, p.module 
        FROM role_permission rp
        JOIN permission p ON rp.permission_id = p.id
      `);

            // 3. Mapear permisos a roles
            const rolesWithPermissions = roles.map(role => {
                const perms = rolePermissions.filter(rp => rp.role_id === role.id);
                return {
                    ...role,
                    permissions: perms.map(p => ({
                        id: p.permission_id,
                        name: p.name,
                        description: p.description,
                        module: p.module
                    }))
                };
            });

            return rolesWithPermissions;
        } catch (error) {
            console.error("Error in Role.findAllWithPermissions:", error);
            throw error;
        }
    }

    async getAllPermissions() {
        try {
            const permissions = await this.execute("SELECT * FROM permission ORDER BY module, name");

            // Agrupar por módulo
            const grouped = permissions.reduce((acc, curr) => {
                if (!acc[curr.module]) acc[curr.module] = [];
                acc[curr.module].push(curr);
                return acc;
            }, {});

            return grouped;
        } catch (error) {
            console.error("Error in Role.getAllPermissions:", error);
            throw error;
        }
    }

    async findByName(name) {
        try {
            const rows = await this.execute("SELECT * FROM role WHERE role = ?", [name]);
            return rows[0] || null;
        } catch (error) {
            console.error("Error in Role.findByName:", error);
            throw error;
        }
    }

    async createRole(name, permissions) {
        try {
            const result = await this.execute("INSERT INTO role (role) VALUES (?)", [name]);
            const roleId = result.insertId;

            if (permissions && Array.isArray(permissions) && permissions.length > 0) {
                const values = permissions.map(pId => `(${roleId}, ${pId})`).join(",");
                await this.execute(`INSERT INTO role_permission (role_id, permission_id) VALUES ${values}`);
            }

            return roleId;
        } catch (error) {
            console.error("Error in Role.createRole:", error);
            throw error;
        }
    }

    async updateRole(id, name, permissions) {
        try {
            if (name) {
                await this.execute("UPDATE role SET role = ? WHERE id = ?", [name, id]);
            }

            if (permissions && Array.isArray(permissions)) {
                await this.execute("DELETE FROM role_permission WHERE role_id = ?", [id]);

                if (permissions.length > 0) {
                    const values = permissions.map(pId => `(${id}, ${pId})`).join(",");
                    await this.execute(`INSERT INTO role_permission (role_id, permission_id) VALUES ${values}`);
                }
            }
            return true;
        } catch (error) {
            console.error("Error in Role.updateRole:", error);
            throw error;
        }
    }

    async deleteRole(id) {
        try {
            // Verificar usuarios antes de borrar (aunque el controller también lo hace, doble check no daña)
            const users = await this.execute("SELECT id FROM user WHERE roleId = ?", [id]);
            if (users.length > 0) throw new Error("Cannot delete role with assigned users");

            await this.execute("DELETE FROM role WHERE id = ?", [id]);
            return true;
        } catch (error) {
            console.error("Error in Role.deleteRole:", error);
            throw error;
        }
    }

    async hasUsers(roleId) {
        const users = await this.execute("SELECT id FROM user WHERE roleId = ?", [roleId]);
        return users.length > 0;
    }
}

module.exports = Role;
