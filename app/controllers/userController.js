const Controller = require("./Controller");
const User = require("../models/User");

class UserController extends Controller {
  constructor() {
    super();
    this.userModel = new User();
  }

  //Metodo para registrar un usuario de prueba
  async register(data) {
    // Sanitizar data
    if (!data || Object.keys(data).length === 0) {
      throw new Error("Datos no pueden estar vacíos");
    }

    // Agregar validaciones manuales o con alguna lib como validator.js
    // Verificar si email es válido, si contraseña es segura, etc.

    const id = await this.userModel.registerUser(data);
    return id;
  }
  async update(id, data) {
    if (!id || typeof data !== "object") {
      throw new Error("Datos inválidos para actualización");
    }
    const result = await this.userModel.updateUser(id, data);
    return result;
  }
  
  async delete(id) {
    if (!id) {
      throw new Error("ID no puede estar vacío");
    }
    const result = await this.userModel.deleteUser(id);
    return result;
  }

  async getAllUsers() {
    const users = await this.userModel.getAllUsers();
    return users;
  }
}

module.exports = UserController;
