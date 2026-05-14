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

const fs = require("fs");
const path = require("path");

const crypto = require('crypto');

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

async updateProfilePic(req, res) {
  try {
    const id = req.params.id;
    const performed_by = req.user.id;

    if (!id) {
      return this.sendResponse(res, 400, null, "ID inválido");
    }

    if (!req.file) {
      return this.sendResponse(res, 400, null, "No se envió ninguna imagen");
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      return this.sendNotFound(res, "Usuario no encontrado");
    }

    // 🗑️ borrar imagen anterior si existe
    if (user.profile_pic) {
      const oldPath = path.join(__dirname, '../../', user.profile_pic);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const profilePicPath = `/uploads/${req.file.filename}`;

    await this.userModel.updateUser(id, {
      profile_pic: profilePicPath
    });

    // 📢 sockets (opcional)
    socketManager.emit("user_updated", {
      id,
      profile_pic: profilePicPath
    });

    // 📝 historial
    await historyModel.registerLog({
      action_type: "Foto de Perfil Actualizada",
      performed_by,
      target_user: id,
      old_value: { profile_pic: user.profile_pic },
      new_value: { profile_pic: profilePicPath },
      description: `Actualizó la foto de perfil del usuario ${id}`
    });

    return this.sendResponse(
      res,
      200,
      { profile_pic: profilePicPath },
      "Avatar actualizado exitosamente"
    );
  } catch (err) {
    console.error("❌ Error en updateProfilePic:", err);
    return this.sendInternalError(res, "Error al actualizar la foto de perfil");
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
      // Esperamos: current_password (la actual en texto plano) y new_password (la nueva)
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return this.sendResponse(res, 400, null, "Debes proporcionar la contraseña actual y la nueva.");
      }

      if (new_password.length < 6) {
        return this.sendResponse(res, 400, null, "La nueva contraseña debe tener al menos 6 caracteres.");
      }

      // 1. Obtener el usuario de la BD (con su hash de contraseña)
      const user = await this.userModel.findByIdWithPassword(id);

      if (!user) {
        return this.sendResponse(res, 404, null, "Usuario no encontrado.");
      }

      // 2. VERIFICACIÓN DE SEGURIDAD: ¿La contraseña actual coincide?
      const isMatch = bcrypt.compareSync(current_password, user.password);

      if (!isMatch) {
        // Retornamos 401 (Unauthorized) o 400
        return this.sendResponse(res, 401, null, "La contraseña actual es incorrecta.");
      }

      // 3. Si pasó la validación, actualizamos con la NUEVA contraseña
      // El modelo se encargará de hashear 'new_password' porque la pasamos en el campo 'password'
      const result = await this.userModel.updateUser(id, { password: new_password });

      // Log history
      await historyModel.registerLog({
        action_type: "Contraseña Cambiada",
        performed_by: id,
        target_user: id,
        old_value: null,
        new_value: null,
        description: `Usuario ${id} cambió su propia contraseña mediante verificación segura`
      });

      return this.sendResponse(res, 200, { updated: true }, "Contraseña actualizada exitosamente.");

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

 /** Login Modificado */
  async login(data) {
    const error = Validator.validate(data, {
      email: { required: true },
      password: { required: true }
    });

    if (error) throw new Error(error);

    const user = await this.userModel.findByEmail(data.email);
    if (!user) throw new Error("Usuario no encontrado");
    if (user.status === 1) throw new Error("Cuenta inactiva. Contacta al administrador.");

    const isMatch = bcrypt.compareSync(data.password, user.password);
    if (!isMatch) throw new Error("Contraseña incorrecta");

    // --- INTERCEPCIÓN DE CONTRASEÑA TEMPORAL ---
    if (user.must_change_password === 1) {
      // Token restringido válido por 15 minutos
      const restrictPayload = { id: user.id, isRestricted: true };
      const restrictToken = jwt.sign(restrictPayload, config.jwtSecret, { expiresIn: '15m' });

      return {
        requirePasswordChange: true,
        token: restrictToken,
        message: "Por razones de seguridad, debes cambiar tu contraseña temporal."
      };
    }
    // -------------------------------------------

    await this.userModel.updateLastAccess(user.id);
    const payload = { id: user.id, name: user.name, roleId: user.roleId };
    const token = jwt.sign(payload, config.jwtSecret, config.jwtOptions);
    const permissions = await this.userModel.getPermissions(user.roleId);

    return {
      requirePasswordChange: false,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        account: user.account,
        ranks: user.ranks,
        roleId: user.roleId,
        profile_pic: user.profile_pic,
        permissions: permissions
      },
    };
  }

  /** Restablecer contraseña administrativamente (Soporte Técnico) */
  async resetPasswordAdmin(req, res) {
    try {
      const targetUserId = req.params.id;
      const performed_by = req.user.id;

      if (!targetUserId) {
        return this.sendResponse(res, 400, null, "ID de usuario inválido.");
      }

      const targetUser = await this.userModel.findById(targetUserId);
      if (!targetUser) {
        return this.sendNotFound(res, "Usuario objetivo no encontrado.");
      }

      // Generar contraseña aleatoria de 8 caracteres (ej. 'a1b2c3d4')
      const tempPassword = crypto.randomBytes(4).toString('hex');

      // Actualizar usuario en BD encendiendo la bandera
      await this.userModel.updateUser(targetUserId, { 
        password: tempPassword,
        must_change_password: 1 
      });

      await historyModel.registerLog({
        action_type: "Restablecimiento de Contraseña",
        performed_by,
        target_user: targetUserId,
        old_value: null,
        new_value: null,
        description: `Restableció contraseña del usuario ${targetUserId} a temporal.`
      });

      // Retornamos la contraseña en texto plano UNA SOLA VEZ para que el Admin la copie
      return this.sendResponse(res, 200, { tempPassword }, "Contraseña restablecida exitosamente.");

    } catch (err) {
      console.error('Error en resetPasswordAdmin:', err);
      return this.sendInternalError(res, "Error al restablecer contraseña.");
    }
  }

  /** Cambio obligatorio de contraseña (Usuario) */
  async forcePasswordChange(req, res) {
    try {
      const id = req.user.id; // Viene del token restringido
      const { new_password } = req.body;

      if (!new_password || new_password.length < 6) {
        return this.sendResponse(res, 400, null, "La nueva contraseña debe tener al menos 6 caracteres.");
      }

      // Actualizamos la contraseña y APAGAMOS la bandera
      await this.userModel.updateUser(id, { 
        password: new_password,
        must_change_password: 0 
      });

      await historyModel.registerLog({
        action_type: "Contraseña Cambiada",
        performed_by: id,
        target_user: id,
        old_value: null,
        new_value: null,
        description: `Usuario ${id} cambió su contraseña temporal obligatoria.`
      });

      return this.sendResponse(res, 200, { updated: true }, "Contraseña actualizada. Ya puedes iniciar sesión normalmente.");

    } catch (err) {
      console.error('Error en forcePasswordChange:', err);
      return this.sendInternalError(res, "Error al procesar el cambio de contraseña.");
    }
  }
  
}

module.exports = UserController;