const Model = require("./Model");
const bcrypt = require("bcryptjs");

class User extends Model {
  constructor() {
    super();
    this.tableName = "user";
    this.fillable = [
      "name",
      "password",
      "account",
      "email",
      "rank_id",
      "status",
      "roleId",
    ];

    this.initializeDB();
  }

  /** Busca un usuario por su email */
  async findByEmail(email) {
    try {
      const db = this.getDB();
      db.reset();
      const rows = await db
        .select(["*"])
        .where([["email", email]])
        .get();
      return rows[0] || null;
    } catch (error) {
      console.error('❌ Error en findByEmail:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const db = this.getDB();
      db.reset();
      const rows = await db
        .select(["user.*", "ranks.name AS ranks", "role.role AS role_name"])
        .join("ranks", "ranks.id = user.rank_id", "LEFT")
        .join("role", "role.id = user.roleId", "LEFT")
        .where([["user.id", id]])
        .get();


      return rows[0] || null;
    } catch (error) {
      console.error('❌ Error en findById:', error);
      throw error;
    }
  }

  async registerUser(data) {
    try {
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

      console.log('📝 Registering user with data:', { ...filteredData, password: '***' });
      return await this.insert(filteredData);
    } catch (error) {
      console.error('❌ Error en registerUser:', error);
      throw error;
    }
  }

  async updateUser(id, data) {
    try {
      // 1) Si viene password, aplica hashing
      if (data.password) {
        data.password = bcrypt.hashSync(data.password, 10);
      }

      // Map 'ranks' to 'rank_id' if present
      if (data.ranks !== undefined) {
        data.rank_id = data.ranks;
        delete data.ranks;
      }

      // Filter data to only include fillable fields
      const filteredData = {};
      this.fillable.forEach((field) => {
        if (field in data) {
          filteredData[field] = data[field];
        }
      });

      console.log('📝 Updating user:', id, 'with data:', { ...filteredData, password: filteredData.password ? '***' : undefined });

      if (Object.keys(filteredData).length === 0) {
        return 0; // Nothing to update
      }

      // 2) Usar query builder para update
      const result = await this.getDB()
        .where([["id", id]])
        .update(filteredData);

      return result;
    } catch (error) {
      console.error('❌ Error en updateUser:', error);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      console.log('🗑️ Deleting user:', id);

      const result = await this.getDB()
        .where([["id", id]])
        .delete();

      return result;
    } catch (error) {
      console.error('❌ Error en deleteUser:', error);
      throw error;
    }
  }

  /** Actualiza la columna last_access con la fecha actual */
  async updateLastAccess(id) {
    try {
      console.log('🕒 Updating last access for user:', id);

      // Usamos Date() → MySQL lo castea a DATETIME
      const result = await this.getDB()
        .where([["id", id]])
        .update({ last_access: new Date() });

      return result;
    } catch (error) {
      console.error('❌ Error en updateLastAccess:', error);
      throw error;
    }
  }

  /** Trae todos los usuarios + rol + rango + last_access */
  async getAllUsers() {
    try {
      console.log('📋 Getting all users...');

      const cols = [
        "user.id",
        "user.name",
        "user.email",
        "user.account",
        "user.status",
        "user.roleId",
        "user.rank_id",
        "role.role AS access",
        "ranks.name AS ranks",
        "user.last_access",
      ];

      const db = this.getDB();
      db.reset();

      const rows = await db
        .select(cols)
        .join("role", "role.id = user.roleId", "LEFT")
        .join("ranks", "ranks.id = user.rank_id", "LEFT")
        .get();

      console.log('📋 Users retrieved:', rows.length);
      return rows;
    } catch (error) {
      console.error('❌ Error en getAllUsers:', error);
      throw error;
    }
  }

  async getPermissions(roleId) {
    try {
      // Usar this.execute en lugar de getDB().query
      const rows = await this.execute(
        `SELECT p.name 
         FROM permission p 
         JOIN role_permission rp ON p.id = rp.permission_id 
         WHERE rp.role_id = ?`,
        [roleId]
      );

      return Array.isArray(rows) ? rows.map(r => r.name) : [];
    } catch (error) {
      console.error('❌ Error getting permissions:', error);
      return [];
    }
  }
}

module.exports = User;