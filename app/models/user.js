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
      "ranks",
      "status",
      "roleId", // Ya está incluido
    ];
    
    this.initializeDB();
    console.log('✅ User model inicializado correctamente');
  }

  /** Busca un usuario por su email */
  async findByEmail(email) {
    try {
      // 👇 USAR QUERY BUILDER CORRECTAMENTE
      const rows = await this.getDB()
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
      const rows = await this.getDB()
        .select(["*"])
        .where([["user.id", id]]) // 👈 CAMBIO PRINCIPAL
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

      console.log('📝 Updating user:', id, 'with data:', { ...data, password: data.password ? '***' : undefined });

      // 2) Usar query builder para update
      const result = await this.getDB()
        .where([["id", id]])
        .update(data);
      
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

  /** Trae todos los usuarios + rol + last_access */
  async getAllUsers() {
    try {
      console.log('📋 Getting all users...');
      
      const cols = [
        "user.id",
        ...this.fillable.map((f) => `user.${f}`),
        "role.role AS access",
        "user.last_access",
      ];

      const db = this.getDB();
      db.reset(); // 👈 AGREGAR RESET
      
      const rows = await db
        .select(cols)
        .join("role", "role.id = user.roleId", "LEFT")
        .get();

      console.log('📋 Users retrieved:', rows.length);
      return rows;
    } catch (error) {
      console.error('❌ Error en getAllUsers:', error);
      throw error;
    }
  }
}

module.exports = User;