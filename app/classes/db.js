const mysql = require("mysql2/promise");
const { db: dbConfig } = require("../config/config");

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

  async connect() {
    if (!this.connection) {
      this.connection = await mysql.createConnection(dbConfig);
    }
    return this.connection;
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
      const conn = await this.connect();
      const [rows] = await conn.execute(sql, this.values);
      return rows;
    } catch (error) {
      console.error("Error en DB.get():", error);
      throw error;
    } finally {
      this.reset();
    }
  }

  async insert(data) {
    const fields = Object.keys(data).join(", ");
    const placeholders = Object.keys(data)
      .map(() => "?")
      .join(", ");
    const values = Object.values(data);
    const sql = `INSERT INTO ${this.table} (${fields}) VALUES (${placeholders})`;
    const conn = await this.connect();
    const [result] = await conn.execute(sql, values);
    return result.insertId;
  }

  async update(data) {
    const fields = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(data);
    const sql = `UPDATE ${this.table} SET ${fields} WHERE ${this.wheres}`;
    const conn = await this.connect();
    const [result] = await conn.execute(sql, [...values, ...this.values]);
    this.reset();
    return result.affectedRows;
  }

  async delete() {
    const sql = `DELETE FROM ${this.table} WHERE ${this.wheres}`;
    const conn = await this.connect();
    const [result] = await conn.execute(sql, this.values);
    this.reset();
    return result.affectedRows;
  }
}

module.exports = DB;
