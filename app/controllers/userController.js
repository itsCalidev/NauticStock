const Controller   = require("./Controller");
const User         = require("../models/user");
const bcrypt       = require("bcryptjs");
const jwt          = require("jsonwebtoken");
const config       = require("../config/config");
const History      = require("../models/history");
const historyModel = new History();

class UserController extends Controller {
  constructor() {
    super();
    this.userModel = new User();
  }

  // 👇 NUEVO MÉTODO: Actualizar mi propia contraseña
  async updateMyPassword(id, data, performed_by) {
    console.log('🔐 updateMyPassword llamado:', { id, data: { password: '***' }, performed_by });
    
    // Validar que solo venga password
    if (!data.password) {
      throw { status: 400, message: "La contraseña es requerida" };
    }

    // Validar longitud mínima
    if (data.password.length < 8) {
      throw { status: 400, message: "La contraseña debe tener al menos 8 caracteres" };
    }

    // Solo permitir cambio de contraseña, no otros campos
    const allowedData = { password: data.password };

    try {
      // 1) Ejecuta update
      const result = await this.userModel.updateUser(id, allowedData);
      console.log('✅ Contraseña actualizada para usuario:', id);

      // 2) Log de la acción
      await historyModel.registerLog({
        action_type:  "Contraseña Cambiada",
        performed_by,
        target_user:  id,
        old_value:    null, // No guardamos contraseñas en el log
        new_value:    null, // No guardamos contraseñas en el log
        description:  `Usuario ${id} cambió su propia contraseña`
      });

      return result;
    } catch (err) {
      console.error('❌ Error en updateMyPassword:', err);
      throw err;
    }
  }
  /** Crear usuario */
  async register(data, performed_by) {
    if (!data || Object.keys(data).length === 0) {
      throw { status: 400, message: "Datos no pueden estar vacíos" };
    }

    // Validar campo matrícula (account)
    if (data.account) {
      // Solo números
      if (!/^\d+$/.test(data.account)) {
        throw { status: 400, message: "La matrícula solo debe contener números" };
      }
      // Máximo 10 caracteres
      if (data.account.length > 10) {
        throw { status: 400, message: "La matrícula no puede tener más de 10 caracteres" };
      }
    }

    // 1) Verificar duplicado de email
    const existing = await this.userModel.findByEmail(data.email);
    if (existing) {
      throw { status: 409, message: "Ya existe un usuario con ese correo" };
    }

    // 2) Inserta usuario
    const id = await this.userModel.registerUser(data);

    // 3) Log de creación
    await historyModel.registerLog({
      action_type:  "Usuario Creado",
      performed_by,
      target_user:  id,
      old_value:    null,
      new_value:    data,
      description:  `Creó usuario ${id}`
    });

    return id;
  }

/** Actualizar usuario (incluye cambio de contraseña, deshabilitar y cambio de rol) */
async update(id, data, performed_by) {
  if (!id || typeof data !== "object") {
    throw new Error("Datos inválidos para actualización");
  }

  // Validar campo matrícula (account) si se está actualizando
  if (data.account) {
    // Solo números
    if (!/^\d+$/.test(data.account)) {
      throw { status: 400, message: "La matrícula solo debe contener números" };
    }
    // Máximo 10 caracteres
    if (data.account.length > 10) {
      throw { status: 400, message: "La matrícula no puede tener más de 10 caracteres" };
    }
  }
  
  // 1) Lee estado previo
  const old = await this.userModel.findById(id);
  if (!old) {
    throw { status: 404, message: "Usuario no encontrado" };
  }

  // 2) Ejecuta update
  const result = await this.userModel.updateUser(id, data);

  // 3) Determina tipo de acción
  let action_type = "Usuario Actualizado";
  let description = `Actualizó datos de usuario ${id}`;
  
  if (data.password) {
    action_type = "Contraseña Cambiada";
    description = `Cambió contraseña de usuario ${id}`;
  }
  
  if ("status" in data && data.status === 1) {
    action_type = "Usuario Deshabilitado";
    description = `Deshabilitó usuario ${id}`;
    console.log(`🚫 Usuario ${id} deshabilitado por ${performed_by}`);
  }
  
  if ("status" in data && data.status === 0) {
    action_type = "Usuario Rehabilitado";
    description = `Rehabilitó usuario ${id}`;
    console.log(`✅ Usuario ${id} rehabilitado por ${performed_by}`);
  }

  // 👇 NUEVO: Detectar cambio de rol
  if ("roleId" in data && data.roleId !== old.roleId) {
    action_type = "Rol Cambiado";
    const oldRoleName = this.getRoleName(old.roleId);
    const newRoleName = this.getRoleName(data.roleId);
    description = `Cambió rol de usuario ${id} de ${oldRoleName} a ${newRoleName}`;
    console.log(`🔄 Usuario ${id}: rol cambiado de ${oldRoleName} a ${newRoleName} por ${performed_by}`);
  }

  // 4) Prepara old_value / new_value solo con campos modificados
  const old_value = {};
  const new_value = {};
  for (const field of ["name", "email", "account", "ranks", "status", "roleId"]) { // 👈 Agregar roleId
    if (field in data) {
      old_value[field] = old[field];
      new_value[field] = data[field];
    }
  }

  // 5) Log de la acción
  await historyModel.registerLog({
    action_type,
    performed_by,
    target_user: id,
    old_value:  Object.keys(old_value).length ? old_value : null,
    new_value:  Object.keys(new_value).length ? new_value : null,
    description
  });

  return result;
}

// 👇 NUEVO: Método helper para obtener nombre del rol
getRoleName(roleId) {
  switch(parseInt(roleId)) {
    case 1: return "Administrador";
    case 2: return "Capturista";
    case 3: return "Consultor";
    default: return "Desconocido";
  }
}

  /** Eliminar usuario */
  async delete(id, performed_by) {
    if (!id) {
      throw new Error("ID no puede estar vacío");
    }

    try {
      // 1) Lee datos previos ANTES de eliminar
      const old = await this.userModel.findById(id);
      
      if (!old) {
        throw { status: 404, message: "Usuario no encontrado" };
      }

      // 👇 NUEVO: Log adicional para facilitar auditoría
      console.log(`🗑️ Eliminando usuario ${id} (${old.name}) por ${performed_by}`);

      // 2) PRIMERO registra en historial (mientras el usuario aún existe)
      await historyModel.registerLog({
        action_type:  "Usuario Eliminado",
        performed_by,
        target_user:  id, // El usuario aún existe en este punto
        old_value:    old,
        new_value:    null,
        description:  `Eliminó usuario ${id} (${old.name})`
      });

      // 3) DESPUÉS elimina el usuario
      const result = await this.userModel.deleteUser(id);

      console.log(`✅ Usuario ${id} eliminado exitosamente`);
      return result;

    } catch (err) {
      console.error('❌ Error en delete:', err);
      // Si es un error de base de datos, agregamos contexto
      if (err.code) {
        throw { 
          status: 500, 
          message: `Error de base de datos al eliminar usuario: ${err.message}` 
        };
      }
      throw err;
    }
  }

  /** Listar todos los usuarios */
  async getAllUsers() {
    return await this.userModel.getAllUsers();
  }

  /** Obtener un usuario por ID */
  async getById(id) {
    try {
      console.log('🔍 UserController.getById llamado con ID:', id);
      
      if (!id) {
        throw new Error("ID es requerido");
      }

      const user = await this.userModel.findById(id);
      
      if (!user) {
        console.log('❌ Usuario no encontrado en BD:', id);
        return null;
      }

      console.log('✅ Usuario encontrado en BD:', { 
        id: user.id, 
        name: user.name, 
        status: user.status,
        email: user.email 
      });

      // Remover password antes de devolver
      const { password, ...userWithoutPassword } = user;
      
      return userWithoutPassword;
      
    } catch (err) {
      console.error('❌ Error en UserController.getById:', err);
      throw err;
    }
  }
  
  /** Login (no registra en historial) */
  async login({ email, password }) {
    if (!email || !password)
      throw new Error("Email y contraseña son requeridos");

    const user = await this.userModel.findByEmail(email);
    if (!user) throw new Error("Usuario no encontrado");
    if (user.status === 1)
      throw new Error("Cuenta inactiva. Contacta al administrador.");

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) throw new Error("Contraseña incorrecta");

    // Actualiza último acceso y genera token
    await this.userModel.updateLastAccess(user.id);
    const payload = { id: user.id, name: user.name, roleId: user.roleId };
    const token   = jwt.sign(payload, config.jwtSecret, config.jwtOptions);

    return {
      token,
      user: {
        id:          user.id,
        name:        user.name,
        email:       user.email,
        account:     user.account,
        ranks:       user.ranks,
        roleId:      user.roleId,
        profile_pic: user.profile_pic,
      },
    };
  }
}

module.exports = UserController;