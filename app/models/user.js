const Model = require("./Model");
const bcrypt = require("bcryptjs");

class User extends Model {
  constructor() {
    super();
    this.fillable = [
      "name",
      "password",
      "account",
      "email",
      "ranks",
      "status",
      "roleId",
    ];
  }
    /** Busca un usuario por su email */
    async findByEmail(email) {
      // Seleccionamos todos los campos (incluyendo password)
      const rows = await this
        .select(["*"])
        .where([["email", email]])
        .get();
      return rows[0] || null;
    }

    async findById(id) {
      const rows = await this
        .select(["*"])
        .where([["user.id", id]])
        .get();
      return rows[0] || null;
    }

  async registerUser(data) {
    const filteredData = {};

    this.fillable.forEach((field) => {
      if (field in data) {
        if (field === "password") {
          filteredData[field] = bcrypt.hashSync(data[field], 10);
        } else {
          filteredData[field] = data[field];
        }
      }
    });

    return await this.insert(filteredData);
  }

  async updateUser(id, data) {
    // 1) Si vienen password, aplica hashing
    if (data.password) {
      data.password = bcrypt.hashSync(data.password, 10);
    }

    // 2) Prepara el WHERE
    this.wheres = "user.id = ?";
    this.values = [id];

    // 3) Lanza el UPDATE con el objeto ya modificado
    const result = await this.update(data);
    return result;
  }
  
  async deleteUser(id) {
    this.wheres = "user.id = ?";
    this.values = [id];
    const result = await this.delete();
    return result;
  }
  
/** Actualiza la columna last_access con la fecha actual */
  async updateLastAccess(id) {
    this.wheres = "user.id = ?";
    this.values = [id];
    // Usamos Date() → MySQL lo castea a DATETIME
    const result = await this.update({ last_access: new Date() });
    return result;
  }

  /** Trae todos los usuarios + rol + last_access */
  async getAllUsers() {
    const cols = [
      "user.id",
      ...this.fillable.map((f) => `user.${f}`),
      "role.role AS access",
      "user.last_access",
    ];

    const rows = await this
      .select(cols)
      .join("role", "role.id = user.roleId", "LEFT")
      .get();

    return rows;
  }
  
}

module.exports = User;
