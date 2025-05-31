const Model = require("./Model");

class History extends Model {
  constructor() {
    super(); // 👈 Llamar constructor padre
    this.tableName = "history"; // 👈 DEFINIR ANTES de usar DB
    
    // 👇 INICIALIZAR DB DESPUÉS de definir tableName
    this.initializeDB();
    
    console.log('✅ History model inicializado correctamente');
  }

  async registerLog({ action_type, performed_by, target_user = null, target_product = null, old_value = null, new_value = null, description }) {
    try {
      // Validar que target_user existe si se proporciona
      if (target_user) {
        const User = require("./user");
        const userModel = new User();
        const userExists = await userModel.findById(target_user);
        
        if (!userExists) {
          console.warn(`⚠️ Usuario ${target_user} no existe, estableciendo target_user a NULL`);
          target_user = null;
        }
      }

      // VALIDAR que target_product existe si se proporciona
      if (target_product) {
        const Products = require("./products");
        const productsModel = new Products();
        const productExists = await productsModel.findById(target_product);
        
        if (!productExists) {
          console.warn(`⚠️ Producto ${target_product} no existe, estableciendo target_product a NULL`);
          target_product = null;
        }
      }

      const logData = {
        action_type,
        performed_by,
        target_user,
        target_product,
        old_value: old_value ? JSON.stringify(old_value) : null,
        new_value: new_value ? JSON.stringify(new_value) : null,
        description,
        created_at: new Date()
      };

      console.log('📝 Registrando en historial:', { 
        action_type, 
        target_user, 
        target_product, 
        description 
      });
      
      const result = await this.insert(logData);
      console.log('✅ Log registrado exitosamente con ID:', result);
      return result;
      
    } catch (err) {
      console.error('❌ Error al registrar en historial:', err);
      
      // Si es error de FK en target_user, intentamos registrar sin target_user
      if (err.code === 'ER_NO_REFERENCED_ROW_2' && target_user) {
        console.log('🔄 Reintentando sin target_user...');
        return this.registerLog({
          action_type,
          performed_by,
          target_user: null,
          target_product,
          old_value,
          new_value,
          description: description + ` (usuario ${target_user} ya eliminado)`
        });
      }
      
      // Si es error de FK en target_product, intentamos registrar sin target_product
      if (err.code === 'ER_NO_REFERENCED_ROW_2' && target_product) {
        console.log('🔄 Reintentando sin target_product...');
        return this.registerLog({
          action_type,
          performed_by,
          target_user,
          target_product: null,
          old_value,
          new_value,
          description: description + ` (producto ${target_product} ya eliminado)`
        });
      }
      
      throw err;
    }
  }

  // 👇 USAR EXECUTE DIRECTO
  async getHistory() {
    try {
      console.log('📋 Ejecutando query de historial...');
      
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
        ORDER BY h.created_at DESC
        LIMIT 1000
      `;
      
      const results = await this.execute(query);
      console.log('📋 Query ejecutado exitosamente, resultados:', results?.length || 0);
      
      return results || [];
      
    } catch (err) {
      console.error('❌ Error en getHistory:', err);
      throw err;
    }
  }

  // 👇 MÉTODO ALTERNATIVO: getAllLogs (alias de getHistory)
  async getAllLogs() {
    return this.getHistory();
  }

  // 👇 MÉTODO: Obtener logs por tipo de acción
  async getLogsByType(actionType) {
    try {
      if (!this.db) {
        throw new Error('Database connection not available');
      }

      console.log('📋 Obteniendo logs por tipo:', actionType);

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
      console.log(`📋 Logs de tipo "${actionType}" obtenidos:`, results?.length || 0);
      
      return results || [];
      
    } catch (err) {
      console.error(`❌ Error getting logs by type ${actionType}:`, err);
      throw err;
    }
  }

  // 👇 NUEVO: Método para obtener logs por usuario
  async getLogsByUser(userId) {
    try {
      if (!this.db) {
        throw new Error('Database connection not available');
      }

      console.log('📋 Obteniendo logs por usuario:', userId);

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
      console.log(`📋 Logs del usuario ${userId} obtenidos:`, results?.length || 0);
      
      return results || [];
      
    } catch (err) {
      console.error(`❌ Error getting logs by user ${userId}:`, err);
      throw err;
    }
  }

  // 👇 NUEVO: Método para obtener logs por producto
  async getLogsByProduct(productId) {
    try {
      if (!this.db) {
        throw new Error('Database connection not available');
      }

      console.log('📋 Obteniendo logs por producto:', productId);

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
      console.log(`📋 Logs del producto ${productId} obtenidos:`, results?.length || 0);
      
      return results || [];
      
    } catch (err) {
      console.error(`❌ Error getting logs by product ${productId}:`, err);
      throw err;
    }
  }

  // 👇 NUEVO: Método para obtener logs por rango de fechas
  async getLogsByDateRange(startDate, endDate) {
    try {
      if (!this.db) {
        throw new Error('Database connection not available');
      }

      console.log('📋 Obteniendo logs por rango de fechas:', startDate, 'a', endDate);

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
      console.log('📋 Logs en rango de fechas obtenidos:', results?.length || 0);
      
      return results || [];
      
    } catch (err) {
      console.error('❌ Error getting logs by date range:', err);
      throw err;
    }
  }

  // 👇 NUEVO: Método para obtener estadísticas del historial
  async getHistoryStats() {
    try {
      if (!this.db) {
        throw new Error('Database connection not available');
      }

      console.log('📊 Obteniendo estadísticas del historial...');

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
      console.log('📊 Estadísticas obtenidas:', results?.length || 0);
      
      return results || [];
      
    } catch (err) {
      console.error('❌ Error getting history stats:', err);
      throw err;
    }
  }

  // 👇 NUEVO: Método para limpiar historial antiguo
  async cleanOldLogs(daysToKeep = 90) {
    try {
      if (!this.db) {
        throw new Error('Database connection not available');
      }

      console.log(`🧹 Limpiando logs de más de ${daysToKeep} días...`);

      const query = `
        DELETE FROM history 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      `;
      
      const results = await this.db.execute(query, [daysToKeep]);
      console.log('🧹 Logs antiguos eliminados:', results.affectedRows || 0);
      
      return results.affectedRows || 0;
      
    } catch (err) {
      console.error('❌ Error cleaning old logs:', err);
      throw err;
    }
  }
}

module.exports = History;