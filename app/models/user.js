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
    this.wheres = "id = ?";
    this.values = [id];
    const result = await this.update(data);
    return result;
  }

  async deleteUser(id) {
    this.wheres = "id = ?";
    this.values = [id];
    const result = await this.delete();
    return result;
  }
  
  async getAllUsers() {
    // 1) Columnas de user + el campo role.role AS access
    const cols = [
      "user.id",
      // todos los fillable van prefijados con user.
      ...this.fillable.map(f => `user.${f}`),
      // alias “access” para usarlo de inmediato en el frontend
      "role.role AS access"
    ];

    // 2) Construye y ejecuta la consulta con join
    const rows = await this
      .select(cols)                                     // SELECT user.id, user.name, …, role.role AS access
      .join("role", "role.id = user.roleId", "LEFT")    // LEFT JOIN role ON role.id = user.roleId
      .get();                                           // ejecuta y resetea

    return rows;
  }
}

module.exports = User;
