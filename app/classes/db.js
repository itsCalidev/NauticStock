const mysql = require("mysql2/promise");
const { db: dbConfig } = require("../config/config");

// 🟢 CREAR POOL DE CONEXIONES (Singleton)
// Esto maneja automáticamente las conexiones abiertas/cerradas
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10, // Ajustar según capacidad del servidor
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

console.log('🔌 Database Pool Initialized');

class DB {
  constructor(table) {
    this.table = table;
    this.selectFields = "*";
    this.joins = "";
    this.wheres = "1=1";
    this.order = "";
    this.group = "";
    this.limitVal = "";
    this.values = [];
  }

  // 👇 Método helper para obtener el pool (útil si se necesita acceso directo)
  static getPool() {
    return pool;
  }

  async execute(sql, params = []) {
    try {
      // console.log('📊 Executing query:', sql); // Descomentar para debug

      // ⚡️ Usar el pool directamente ejecuta, libera y maneja errores
      const [result, fields] = await pool.execute(sql, params);

      return result;

    } catch (error) {
      console.error("❌ Error en execute:", error.message);
      console.error("❌ Query was:", sql);
      throw error;
    }
  }

  // 👇 ALIAS PARA COMPATIBILIDAD
  async executeQuery(sql, params = []) {
    return this.execute(sql, params);
  }

  select(fields = ["*"]) {
    this.selectFields = fields.join(", ");
    return this;
  }

  join(joinTable, onCondition, type = "INNER") {
    this.joins += ` ${type} JOIN ${joinTable} ON ${onCondition}`;
    return this;
  }

  where(conditions = []) {
    const clauses = conditions.map(([field, value, operator = "="]) => {
      if (operator.toUpperCase() === "IS" && value === null)
        return `${field} IS NULL`;
      if (operator.toUpperCase() === "IS" && value === "NOT NULL")
        return `${field} IS NOT NULL`;
      return `${field} ${operator} ?`;
    });
    this.wheres = clauses.join(" AND ");
    this.values = conditions
      .map((cond) => cond[1])
      .filter((v) => v !== "NOT NULL");
    return this;
  }

  orderBy(fields = []) {
    this.order = `ORDER BY ${fields
      .map(([field, dir]) => `${field} ${dir}`)
      .join(", ")}`;
    return this;
  }

  groupBy(fields = []) {
    this.group = `GROUP BY ${fields.join(", ")}`;
    return this;
  }

  limit(n) {
    this.limitVal = `LIMIT ${n}`;
    return this;
  }

  reset() {
    this.selectFields = '*';
    this.joins = '';
    this.wheres = '1=1';
    this.order = '';
    this.group = '';
    this.limitVal = '';
    this.values = [];
  }

  async get() {
    try {
      const sql = `SELECT ${this.selectFields} FROM ${this.table} ${this.joins} WHERE ${this.wheres} ${this.group} ${this.order} ${this.limitVal}`;
      // El pool maneja la conexión, no necesitamos connect() explícito
      const [rows] = await pool.execute(sql, this.values);
      return rows;
    } catch (error) {
      console.error("Error en DB.get():", error);
      throw error;
    } finally {
      this.reset();
    }
  }

  async insert(data) {
    try {
      const fields = Object.keys(data).join(", ");
      const placeholders = Object.keys(data)
        .map(() => "?")
        .join(", ");
      const values = Object.values(data);
      const sql = `INSERT INTO ${this.table} (${fields}) VALUES (${placeholders})`;

      const [result] = await pool.execute(sql, values);

      // console.log('✅ Insert successful, ID:', result.insertId);
      return result.insertId;
    } catch (error) {
      console.error("❌ Error en insert:", error);
      throw error;
    }
  }

  async update(data) {
    try {
      const fields = Object.keys(data)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(data);
      const sql = `UPDATE ${this.table} SET ${fields} WHERE ${this.wheres}`;

      const [result] = await pool.execute(sql, [...values, ...this.values]);
      this.reset();

      return result.affectedRows;
    } catch (error) {
      console.error("❌ Error en update:", error);
      throw error;
    }
  }

  async delete() {
    try {
      const sql = `DELETE FROM ${this.table} WHERE ${this.wheres}`;
      const [result] = await pool.execute(sql, this.values);
      this.reset();

      return result.affectedRows;
    } catch (error) {
      console.error("❌ Error en delete:", error);
      throw error;
    }
  }

  // 👇 MÉTODOS DE COMPATIBILIDAD (No-ops o wrappers)
  async connect() {
    // Con pool no necesitamos conectar manualmente, pero devolvemos una conexión del pool si alguien lo pide explícitamente
    // OJO: Si se usa esto, se DEBE liberar la conexión manualmente.
    // Por seguridad, devolvemos el pool que tiene interfaz compatible para execute
    return pool;
  }

  async close() {
    // No cerramos el pool en tiempo de ejecución normal
    return Promise.resolve();
  }
}

module.exports = DB;