const Validator = require("../classes/validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const Controller = require("./Controller");
const User = require("../models/user");
const Role = require("../models/role");
const History = require("../models/history");
const socketManager = require("../classes/socketManager");

const historyModel = new History();

class UserController extends Controller {
  constructor() {
    super();
    this.userModel = new User();
    this.roleModel = new Role();
  }

  /** Registrar usuario */
  async register(req, res) {
    try {
      const data = req.body;
      const performed_by = req.user.id;

      const error = Validator.validate(data, {
        name: { required: true },
        email: { required: true, email: true },
        password: { required: true, minLength: 6 },
        account: { required: true, numeric: true, maxLength: 10 },
        ranks: { required: true },
        roleId: { required: true }
      });

      if (error) {
        return this.sendResponse(res, 400, null, error);
      }

      const existing = await this.userModel.findByEmail(data.email);
      if (existing) {
        return this.sendResponse(res, 409, null, "Ya existe un usuario con ese correo");
      }

      let id;
      try {
        id = await this.userModel.registerUser(data);
      } catch (dbErr) {
        if (dbErr.code === 'ER_DUP_ENTRY') {
          return this.sendResponse(res, 409, null, "Ya existe un usuario con esa matrícula");
        }
        throw dbErr;
      }

      // Emit socket event
      socketManager.emit("user_created", { id, ...data });
      socketManager.emit("history_updated", {});

      await historyModel.registerLog({
        action_type: "Usuario Creado",
        performed_by,
        target_user: id,
        old_value: null,
        new_value: data,
        description: `Creó usuario ${id}`
      });

      return this.sendResponse(res, 201, { id }, "Usuario creado exitosamente");
    } catch (err) {
      console.error('Error en register:', err);
      return this.sendInternalError(res, "Error al crear usuario");
    }
  }

  /** Actualizar usuario */
  async update(req, res) {
    try {
      const id = req.params.id;
      const data = req.body;
      const performed_by = req.user.id;

      if (!id) {
        return this.sendResponse(res, 400, null, "ID inválido");
      }

      const error = Validator.validate(data, {
        account: { numeric: true, maxLength: 10 }
      });

      if (error) {
        return this.sendResponse(res, 400, null, error);
      }

      const old = await this.userModel.findById(id);
      if (!old) {
        return this.sendNotFound(res, "Usuario no encontrado");
      }

      const result = await this.userModel.updateUser(id, data);

      // Emit socket event
      socketManager.emit("user_updated", { id, ...data });
      if ("status" in data) {
        socketManager.emit("user_status_changed", { id, status: data.status });
      }
      socketManager.emit("history_updated", {});

      let action_type = "Usuario Actualizado";
      let description = `Actualizó datos de usuario ${id}`;

      if (data.password) {
        action_type = "Contraseña Cambiada";
        description = `Cambió contraseña de usuario ${id}`;
      }

      if ("status" in data) {
        if (data.status === 1) {
          action_type = "Usuario Deshabilitado";
          description = `Deshabilitó usuario ${id}`;
        } else if (data.status === 0) {
          action_type = "Usuario Rehabilitado";
          description = `Rehabilitó usuario ${id}`;
        }
      }

      if ("roleId" in data && data.roleId !== old.roleId) {
        action_type = "Rol Cambiado";
        const oldRoleName = this.getRoleName(old.roleId);
        const newRoleName = this.getRoleName(data.roleId);
        description = `Cambió rol de usuario ${id} de ${oldRoleName} a ${newRoleName}`;
      }

      const old_value = {};
      const new_value = {};
      for (const field of ["name", "email", "account", "ranks", "status", "roleId"]) {
        if (field in data) {
          old_value[field] = old[field];
          new_value[field] = data[field];
        }
      }

      await historyModel.registerLog({
        action_type,
        performed_by,
        target_user: id,
        old_value: Object.keys(old_value).length ? old_value : null,
        new_value: Object.keys(new_value).length ? new_value : null,
        description
      });

      return this.sendResponse(res, 200, { updated: result }, "Usuario actualizado exitosamente");
    } catch (err) {
      console.error('Error en update:', err);
      return this.sendInternalError(res, "Error al actualizar usuario");
    }
  }

  getRoleName(roleId) {
    switch (parseInt(roleId)) {
      case 1: return "Administrador";
      case 2: return "Capturista";
      case 3: return "Consultor";
      default: return "Desconocido";
    }
  }

  /** Actualizar mi propia contraseña */
  async updateMyPassword(req, res) {
    try {
      const id = req.user.id;
      const { password } = req.body;

      if (!password) {
        return this.sendResponse(res, 400, null, "La contraseña es requerida");
      }

      if (password.length < 6) {
        return this.sendResponse(res, 400, null, "La contraseña debe tener al menos 6 caracteres");
      }

      // Reutilizamos la lógica de update, pero restringida a solo password
      const result = await this.userModel.updateUser(id, { password });

      // Log history
      await historyModel.registerLog({
        action_type: "Contraseña Cambiada",
        performed_by: id,
        target_user: id,
        old_value: null,
        new_value: null, // No guardamos la contraseña en logs por seguridad
        description: `Usuario ${id} cambió su propia contraseña`
      });

      return this.sendResponse(res, 200, { updated: true }, "Contraseña actualizada exitosamente");
    } catch (err) {
      console.error('Error en updateMyPassword:', err);
      return this.sendInternalError(res, "Error al actualizar contraseña");
    }
  }

  /** Eliminar usuario */
  async delete(req, res) {
    try {
      const id = parseInt(req.params.id);
      const performed_by = req.user.id;

      if (!id) {
        return this.sendResponse(res, 400, null, "ID no puede estar vacío");
      }

      if (id === performed_by) {
        return this.sendResponse(res, 400, null, "No puedes eliminarte a ti mismo");
      }

      const old = await this.userModel.findById(id);

      if (!old) {
        return this.sendNotFound(res, "Usuario no encontrado");
      }

      await historyModel.registerLog({
        action_type: "Usuario Eliminado",
        performed_by,
        target_user: id,
        old_value: old,
        new_value: null,
        description: `Eliminó usuario ${id} (${old.name})`
      });

      const result = await this.userModel.deleteUser(id);

      // Emit socket event
      socketManager.emit("user_deleted", { id });
      socketManager.emit("history_updated", {});

      return this.sendResponse(res, 200, { deleted: result }, "Usuario eliminado exitosamente");

    } catch (err) {
      console.error('Error en delete:', err);
      if (err.code) {
        return this.sendInternalError(res, `Error de base de datos al eliminar usuario: ${err.message}`);
      }
      return this.sendInternalError(res, "Error al eliminar usuario");
    }
  }

  /** Listar todos los usuarios */
  async getAllUsers(req, res) {
    try {
      const users = await this.userModel.getAllUsers();
      return this.sendResponse(res, 200, users);
    } catch (err) {
      console.error('Error en getAllUsers:', err);
      return this.sendInternalError(res, "Error al obtener usuarios");
    }
  }

  /** Obtener un usuario por ID */
  async getById(req, res) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return this.sendResponse(res, 400, null, "ID de usuario inválido");
      }

      if (req.user.roleId !== 1 && req.user.id !== id) {
        return this.sendResponse(res, 403, null, "No tienes permisos para ver este perfil");
      }

      const user = await this.userModel.findById(id);

      if (!user) {
        return this.sendNotFound(res, "Usuario no encontrado");
      }

      const permissions = await this.userModel.getPermissions(user.roleId);
      console.log('🔍 Backend getById - User ID:', id);
      console.log('🔍 Backend getById - Role ID:', user.roleId);
      console.log('🔍 Backend getById - Permissions fetched:', permissions);

      user.permissions = permissions;

      const { password, ...userWithoutPassword } = user;
      console.log('🔍 Backend getById - Sending user object keys:', Object.keys(userWithoutPassword));

      return this.sendResponse(res, 200, userWithoutPassword);

    } catch (err) {
      console.error('Error en UserController.getById:', err);
      return this.sendInternalError(res, "Error al obtener usuario");
    }
  }

  /** Login */
  async login(data) {
    const error = Validator.validate(data, {
      email: { required: true },
      password: { required: true }
    });

    if (error) throw new Error(error);

    const user = await this.userModel.findByEmail(data.email);
    if (!user) throw new Error("Usuario no encontrado");
    if (user.status === 1)
      throw new Error("Cuenta inactiva. Contacta al administrador.");

    const isMatch = bcrypt.compareSync(data.password, user.password);
    if (!isMatch) throw new Error("Contraseña incorrecta");

    await this.userModel.updateLastAccess(user.id);
    const payload = { id: user.id, name: user.name, roleId: user.roleId };
    const token = jwt.sign(payload, config.jwtSecret, config.jwtOptions);

    // Obtener permisos del rol
    const permissions = await this.userModel.getPermissions(user.roleId);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        account: user.account,
        ranks: user.ranks,
        roleId: user.roleId,
        profile_pic: user.profile_pic,
        permissions: permissions // 👈 Incluir permisos
      },
    };
  }
}

module.exports = UserController;