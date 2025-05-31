const Model = require('./Model');

class Category extends Model {
  constructor() {
    super();
    this.tableName = 'categories';
  }
  // Obtener todas las categorías activas
  async getActiveCategories() {
    try {
      const query = 'SELECT * FROM categories WHERE status = 0 ORDER BY name ASC';
      const db = this.getDB();
      const rows = await db.execute(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }  // Crear nueva categoría
  async createCategory(categoryData) {
    try {
      const { name, description } = categoryData;
      const query = 'INSERT INTO categories (name, description) VALUES (?, ?)';
      const db = this.getDB();
      const result = await db.execute(query, [name, description]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar categoría
  async updateCategory(id, categoryData) {
    try {
      const { name, description } = categoryData;
      const query = 'UPDATE categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?';
      const db = this.getDB();
      const result = await db.execute(query, [name, description, id]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar/deshabilitar categoría
  async deleteCategory(id) {
    try {
      const query = 'UPDATE categories SET status = 1, updated_at = NOW() WHERE id = ?';
      const db = this.getDB();
      const result = await db.execute(query, [id]);
      return result;
    } catch (error) {
      throw error;
    }
  }
  // Obtener categoría por ID
  async getCategoryById(id) {
    try {
      const query = 'SELECT * FROM categories WHERE id = ? AND status = 0';
      const db = this.getDB();
      const rows = await db.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Verificar si una categoría existe por nombre
  async getCategoryByName(name) {
    try {
      const query = 'SELECT * FROM categories WHERE name = ? AND status = 0';
      const db = this.getDB();
      const rows = await db.execute(query, [name]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener todas las categorías (activas e inactivas)
  async getAllCategories() {
    try {
      const query = 'SELECT * FROM categories ORDER BY status ASC, name ASC';
      const db = this.getDB();
      const rows = await db.execute(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Rehabilitar categoría
  async enableCategory(id) {
    try {
      const query = 'UPDATE categories SET status = 0, updated_at = NOW() WHERE id = ?';
      const db = this.getDB();
      const result = await db.execute(query, [id]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Obtener categoría por ID (incluyendo deshabilitadas)
  async getCategoryByIdAll(id) {
    try {
      const query = 'SELECT * FROM categories WHERE id = ?';
      const db = this.getDB();
      const rows = await db.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Category;
