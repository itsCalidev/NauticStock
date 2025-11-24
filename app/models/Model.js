const DB = require("../classes/db");

class Model {
  constructor() {
    // 👇 NO INICIALIZAR DB AQUÍ - Esperar a que las clases hijas definan tableName
    this.db = null;
    // console.log('✅ Model constructor called for:', this.constructor.name);
  }

  // 👇 NUEVO: Método para inicializar DB después de que tableName esté definido
  initializeDB() {
    if (!this.tableName) {
      throw new Error(`tableName no está definido para ${this.constructor.name}`);
    }

    if (!this.db) {
      this.db = new DB(this.tableName);
    }

    return this.db;
  }

  // 👇 GETTER para acceder a DB con inicialización lazy
  getDB() {
    if (!this.db) {
      this.initializeDB();
    }
    return this.db;
  }

  // 👇 MÉTODO PARA VERIFICAR CONEXIÓN
  async testConnection() {
    try {
      const db = this.getDB();
      const result = await db.execute('SELECT 1 as test');
      console.log('✅ Database connection test passed');
      return result;
    } catch (err) {
      console.error('❌ Database connection test failed:', err);
      throw err;
    }
  }

  async insert(data) {
    try {
      // console.log('📝 Model.insert for table:', this.tableName);
      const db = this.getDB();
      return await db.insert(data);
    } catch (err) {
      console.error('❌ Error in Model.insert:', err);
      throw err;
    }
  }

  async findById(id) {
    try {
      const db = this.getDB();
      const results = await db
        .where([['id', id]])
        .get();
      return results.length > 0 ? results[0] : null;
    } catch (err) {
      console.error('❌ Error in Model.findById:', err);
      throw err;
    }
  }

  async findAll() {
    try {
      const db = this.getDB();
      return await db.get();
    } catch (err) {
      console.error('❌ Error in Model.findAll:', err);
      throw err;
    }
  }

  // 👇 MÉTODO PARA USAR QUERY BUILDER
  select(fields = ["*"]) {
    const db = this.getDB();
    return db.select(fields);
  }

  where(conditions = []) {
    const db = this.getDB();
    return db.where(conditions);
  }

  orderBy(fields = []) {
    const db = this.getDB();
    return db.orderBy(fields);
  }

  limit(n) {
    const db = this.getDB();
    return db.limit(n);
  }

  // 👇 MÉTODO DIRECTO PARA EXECUTE
  async execute(sql, params = []) {
    try {
      const db = this.getDB();
      return await db.execute(sql, params);
    } catch (err) {
      console.error('❌ Error in Model.execute:', err);
      throw err;
    }
  }

  // 👇 ALIAS PARA COMPATIBILIDAD
  async executeQuery(sql, params = []) {
    return this.execute(sql, params);
  }
}

module.exports = Model;