const Model = require("./Model");

class History extends Model {
  constructor() {
    super();
    this.tableName = "history";
    this.initializeDB();
  }

  async registerLog({ action_type, performed_by, target_user = null, target_product = null, entity_type = null, entity_id = null, old_value = null, new_value = null, description }) {
    try {
      // Map legacy targets to entity system
      if (target_user && !entity_type) {
        entity_type = 'user';
        entity_id = target_user;
      }
      if (target_product && !entity_type) {
        entity_type = 'products';
        entity_id = target_product;
      }

      // Validate User
      if (entity_type === 'user' && entity_id) {
        const User = require("./user");
        const userModel = new User();
        const userExists = await userModel.findById(entity_id);
        if (!userExists) {
          console.warn(`⚠️ Usuario ${entity_id} no existe, log sin relación`);
          entity_id = null;
        }
      }

      // Validate Product
      if (entity_type === 'products' && entity_id) {
        const Products = require("./products");
        const productsModel = new Products();
        const productExists = await productsModel.findById(entity_id);
        if (!productExists) {
          console.warn(`⚠️ Producto ${entity_id} no existe, log sin relación`);
          entity_id = null;
        }
      }

      const logData = {
        action_type,
        performed_by,
        entity_type,
        entity_id,
        // Keep legacy columns populated for safety if needed, or just leave null
        target_user: entity_type === 'user' ? entity_id : null,
        target_product: entity_type === 'products' ? entity_id : null,
        old_value: old_value ? JSON.stringify(old_value) : null,
        new_value: new_value ? JSON.stringify(new_value) : null,
        description,
        created_at: new Date()
      };

      const result = await this.insert(logData);
      return result;

    } catch (err) {
      console.error('❌ Error al registrar en historial:', err);
      // Retry logic could be added here if needed
      throw err;
    }
  }

  async getHistory() {
    try {
      console.log('📋 Ejecutando query de historial normalizado...');

      const query = `
        SELECT 
          h.id,
          h.action_type,
          h.performed_by,
          h.entity_type,
          h.entity_id,
          h.old_value,
          h.new_value,
          h.description,
          h.created_at,
          u1.name as performed_by_name,
          -- Resolve name based on entity type
          CASE 
            WHEN h.entity_type = 'user' THEN u2.name 
            WHEN h.entity_type = 'products' THEN p.part_number
            WHEN h.entity_type = 'brands' THEN b.name
            WHEN h.entity_type = 'categories' THEN c.name
            WHEN h.entity_type = 'locations' THEN l.name
            WHEN h.entity_type = 'provider' THEN pr.name
            ELSE NULL 
          END as target_name
        FROM history h
        LEFT JOIN user u1 ON h.performed_by = u1.id
        LEFT JOIN user u2 ON h.entity_type = 'user' AND h.entity_id = u2.id
        LEFT JOIN products p ON h.entity_type = 'products' AND h.entity_id = p.id
        LEFT JOIN brands b ON h.entity_type = 'brands' AND h.entity_id = b.id
        LEFT JOIN categories c ON h.entity_type = 'categories' AND h.entity_id = c.id
        LEFT JOIN locations l ON h.entity_type = 'locations' AND h.entity_id = l.id
        LEFT JOIN provider pr ON h.entity_type = 'provider' AND h.entity_id = pr.id
        ORDER BY h.created_at DESC
        LIMIT 1000
      `;

      const results = await this.execute(query);
      return results || [];

    } catch (err) {
      console.error('❌ Error en getHistory:', err);
      throw err;
    }
  }

  async getAllLogs() {
    return this.getHistory();
  }

  async getLogsByType(actionType) {
    try {
      if (!this.db) {
        throw new Error('Database connection not available');
      }

      const query = `
SELECT
h.id,
  h.action_type,
  h.performed_by,
  h.target_user,
  h.target_product,
  h.old_value,
  h.new_value,
  h.description,
  h.created_at,
  u1.name as performed_by_name,
  u2.name as target_user_name,
  p.part_number as target_product_name
        FROM history h
        LEFT JOIN user u1 ON h.performed_by = u1.id
        LEFT JOIN user u2 ON h.target_user = u2.id
        LEFT JOIN products p ON h.target_product = p.id
        WHERE h.action_type = ?
  ORDER BY h.created_at DESC
      `;

      const results = await this.db.execute(query, [actionType]);

      return results || [];

    } catch (err) {
      console.error(`❌ Error getting logs by type ${actionType}: `, err);
      throw err;
    }
  }

  async getLogsByUser(userId) {
    try {
      if (!this.db) {
        throw new Error('Database connection not available');
      }

      const query = `
SELECT
h.id,
  h.action_type,
  h.performed_by,
  h.target_user,
  h.target_product,
  h.old_value,
  h.new_value,
  h.description,
  h.created_at,
  u1.name as performed_by_name,
  u2.name as target_user_name,
  p.part_number as target_product_name
        FROM history h
        LEFT JOIN user u1 ON h.performed_by = u1.id
        LEFT JOIN user u2 ON h.target_user = u2.id
        LEFT JOIN products p ON h.target_product = p.id
        WHERE h.performed_by = ? OR h.target_user = ?
  ORDER BY h.created_at DESC
      `;

      const results = await this.db.execute(query, [userId, userId]);

      return results || [];

    } catch (err) {
      console.error(`❌ Error getting logs by user ${userId}: `, err);
      throw err;
    }
  }

  async getLogsByProduct(productId) {
    try {
      if (!this.db) {
        throw new Error('Database connection not available');
      }

      const query = `
SELECT
h.id,
  h.action_type,
  h.performed_by,
  h.target_user,
  h.target_product,
  h.old_value,
  h.new_value,
  h.description,
  h.created_at,
  u1.name as performed_by_name,
  u2.name as target_user_name,
  p.part_number as target_product_name
        FROM history h
        LEFT JOIN user u1 ON h.performed_by = u1.id
        LEFT JOIN user u2 ON h.target_user = u2.id
        LEFT JOIN products p ON h.target_product = p.id
        WHERE h.target_product = ?
  ORDER BY h.created_at DESC
      `;

      const results = await this.db.execute(query, [productId]);

      return results || [];

    } catch (err) {
      console.error(`❌ Error getting logs by product ${productId}: `, err);
      throw err;
    }
  }

  async getLogsByDateRange(startDate, endDate) {
    try {
      if (!this.db) {
        throw new Error('Database connection not available');
      }

      const query = `
SELECT
h.id,
  h.action_type,
  h.performed_by,
  h.target_user,
  h.target_product,
  h.old_value,
  h.new_value,
  h.description,
  h.created_at,
  u1.name as performed_by_name,
  u2.name as target_user_name,
  p.part_number as target_product_name
        FROM history h
        LEFT JOIN user u1 ON h.performed_by = u1.id
        LEFT JOIN user u2 ON h.target_user = u2.id
        LEFT JOIN products p ON h.target_product = p.id
        WHERE h.created_at >= ? AND h.created_at <= ?
  ORDER BY h.created_at DESC
    `;

      const results = await this.db.execute(query, [startDate, endDate]);

      return results || [];

    } catch (err) {
      console.error('❌ Error getting logs by date range:', err);
      throw err;
    }
  }

  async getHistoryStats() {
    try {
      if (!this.db) {
        throw new Error('Database connection not available');
      }

      const query = `
SELECT
action_type,
  COUNT(*) as count,
  DATE(created_at) as date
        FROM history 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY action_type, DATE(created_at)
        ORDER BY date DESC, count DESC
      `;

      const results = await this.db.execute(query);

      return results || [];

    } catch (err) {
      console.error('❌ Error getting history stats:', err);
      throw err;
    }
  }

  async cleanOldLogs(daysToKeep = 90) {
    try {
      if (!this.db) {
        throw new Error('Database connection not available');
      }

      const query = `
        DELETE FROM history 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
  `;

      const results = await this.db.execute(query, [daysToKeep]);

      return results.affectedRows || 0;

    } catch (err) {
      console.error('❌ Error cleaning old logs:', err);
      throw err;
    }
  }
}

module.exports = History;