const Controller = require("./Controller");
const Validator = require("../classes/Validator");
const Role = require("../models/Role");

class RoleController extends Controller {
    constructor() {
        super();
        this.roleModel = new Role();
    }

    /**
     * Obtener todos los roles con sus permisos
     */
    async getAllRoles(req, res) {
        try {
            const roles = await this.roleModel.findAllWithPermissions();
            return this.sendResponse(res, 200, roles);
        } catch (error) {
            console.error("Error en getAllRoles:", error);
            return this.sendInternalError(res, "Error al obtener roles");
        }
    }

    /**
     * Obtener todos los permisos disponibles
     */
    async getAllPermissions(req, res) {
        try {
            const permissions = await this.roleModel.getAllPermissions();
            return this.sendResponse(res, 200, permissions);
        } catch (error) {
            console.error("Error en getAllPermissions:", error);
            return this.sendInternalError(res, "Error al obtener permisos");
        }
    }

    /**
     * Crear un nuevo rol
     */
    async createRole(req, res) {
        try {
            const { name, permissions } = req.body;

            const error = Validator.validate({ name }, {
                name: { required: true, minLength: 3 }
            });

            if (error) return this.sendResponse(res, 400, null, error);

            const existing = await this.roleModel.findByName(name);
            if (existing) {
                return this.sendResponse(res, 409, null, "El nombre del rol ya existe");
            }

            const roleId = await this.roleModel.createRole(name, permissions);

            return this.sendResponse(res, 201, { id: roleId, role: name }, "Rol creado exitosamente");
        } catch (error) {
            console.error("Error en createRole:", error);
            return this.sendInternalError(res, "Error al crear rol");
        }
    }

    /**
     * Actualizar un rol existente
     */
    async updateRole(req, res) {
        try {
            const { id } = req.params;
            const { name, permissions } = req.body;

            if (!id) return this.sendResponse(res, 400, null, "ID requerido");

            if (name) {
                const error = Validator.validate({ name }, { name: { required: true, minLength: 3 } });
                if (error) return this.sendResponse(res, 400, null, error);
            }

            await this.roleModel.updateRole(id, name, permissions);

            return this.sendResponse(res, 200, { id }, "Rol actualizado exitosamente");
        } catch (error) {
            console.error("Error en updateRole:", error);
            return this.sendInternalError(res, "Error al actualizar rol");
        }
    }

    /**
     * Eliminar un rol
     */
    async deleteRole(req, res) {
        try {
            const { id } = req.params;

            if (id == 1) return this.sendResponse(res, 403, null, "No se puede eliminar el rol Administrador");

            const hasUsers = await this.roleModel.hasUsers(id);
            if (hasUsers) {
                return this.sendResponse(res, 409, null, "No se puede eliminar el rol porque hay usuarios asignados a él");
            }

            await this.roleModel.deleteRole(id);

            return this.sendResponse(res, 200, null, "Rol eliminado exitosamente");
        } catch (error) {
            console.error("Error en deleteRole:", error);
            return this.sendInternalError(res, "Error al eliminar rol");
        }
    }
}

module.exports = RoleController;
