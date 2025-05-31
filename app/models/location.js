const Model = require('./Model');

class Location extends Model {
  constructor() {
    super();
    this.tableName = 'locations';
  }
  // Obtener todas las ubicaciones activas
  async getActiveLocations() {
    try {
      const query = 'SELECT * FROM locations WHERE status = 0 ORDER BY name ASC';
      const db = this.getDB();
      const rows = await db.execute(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Crear nueva ubicación
  async createLocation(locationData) {
    try {
      const { name, description } = locationData;
      const query = 'INSERT INTO locations (name, description) VALUES (?, ?)';
      const db = this.getDB();
      const result = await db.execute(query, [name, description]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar ubicación
  async updateLocation(id, locationData) {
    try {
      const { name, description } = locationData;
      const query = 'UPDATE locations SET name = ?, description = ?, updated_at = NOW() WHERE id = ?';
      const db = this.getDB();
      const result = await db.execute(query, [name, description, id]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar/deshabilitar ubicación
  async deleteLocation(id) {
    try {
      const query = 'UPDATE locations SET status = 1, updated_at = NOW() WHERE id = ?';
      const db = this.getDB();
      const result = await db.execute(query, [id]);
      return result;
    } catch (error) {
      throw error;
    }
  }
  // Obtener ubicación por ID
  async getLocationById(id) {
    try {
      const query = 'SELECT * FROM locations WHERE id = ? AND status = 0';
      const db = this.getDB();
      const rows = await db.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Verificar si una ubicación existe por nombre
  async getLocationByName(name) {
    try {
      const query = 'SELECT * FROM locations WHERE name = ? AND status = 0';
      const db = this.getDB();
      const rows = await db.execute(query, [name]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener todas las ubicaciones (activas e inactivas)
  async getAllLocations() {
    try {
      const query = 'SELECT * FROM locations ORDER BY name ASC';
      const db = this.getDB();
      const rows = await db.execute(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Rehabilitar ubicación
  async enableLocation(id) {
    try {
      const query = 'UPDATE locations SET status = 0, updated_at = NOW() WHERE id = ?';
      const db = this.getDB();
      const result = await db.execute(query, [id]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Obtener ubicación por ID (incluyendo deshabilitadas)
  async getLocationByIdAll(id) {
    try {
      const query = 'SELECT * FROM locations WHERE id = ?';
      const db = this.getDB();
      const rows = await db.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Location;
