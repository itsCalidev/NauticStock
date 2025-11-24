
const Model = require('./Model');

class Products extends Model {
  constructor() {
    super(); // 👈 Llamar constructor padre
    this.tableName = "products"; // 👈 DEFINIR ANTES de usar DB

    // 👇 INICIALIZAR DB DESPUÉS de definir tableName
    this.initializeDB();
  }

  async getAllProducts() {
    try {
      // 👇 USAR EXECUTE DIRECTO PARA QUERIES COMPLEJAS CON JOINS
      const query = `
SELECT
p.id,
  p.part_number,
  p.description,
  b.name as brand,
  c.name as category,
  p.quantity,
  p.min_stock,
  p.max_stock,
  p.price,
  l.name as location,
  pr.name as supplier,
  p.status,
  p.created_at,
  p.updated_at,
  p.brand_id,
  p.category_id,
  p.location_id,
  p.provider_id
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN locations l ON p.location_id = l.id
        LEFT JOIN provider pr ON p.provider_id = pr.id
        ORDER BY p.created_at DESC
  `;

      const products = await this.execute(query);
      console.log('Modelo: Productos obtenidos desde DB:', products.length);
      return products;
    } catch (error) {
      console.error('Error en getAllProducts:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      // 👇 USAR QUERY BUILDER PARA QUERIES SIMPLES
      const results = await this.select()
        .where([['id', id]])
        .get();
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error en findById:', error);
      throw error;
    }
  }

  async createProduct(data) {
    try {
      const insertData = {
        part_number: data.part_number,
        description: data.description,
        brand_id: data.brand_id || null, // 👈 Usar IDs o null
        category_id: data.category_id || null,
        quantity: data.quantity || 0,
        min_stock: data.min_stock || 0,
        max_stock: data.max_stock || 0,
        price: data.price || 0,
        location_id: data.location_id || null,
        provider_id: data.provider_id || null,
        status: data.status || 0
      };

      const result = await this.insert(insertData);
      console.log('Producto creado exitosamente:', result);
      return result;
    } catch (error) {
      console.error('Error en createProduct:', error);
      throw error;
    }
  }

  async updateProduct(id, data) {
    try {
      // Filtrar solo los campos que se pueden actualizar
      const updateData = {};

      const allowedFields = [
        'part_number', 'description', 'brand_id', 'category_id',
        'quantity', 'min_stock', 'max_stock', 'price',
        'location_id', 'provider_id', 'status'
      ];

      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      });

      // Agregar timestamp de actualización
      updateData.updated_at = new Date();

      // 👇 USAR QUERY BUILDER
      const result = await this.getDB()
        .where([['id', id]])
        .update(updateData);

      console.log('Producto actualizado exitosamente:', result);
      return result;
    } catch (error) {
      console.error('Error en updateProduct:', error);
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      // 👇 USAR QUERY BUILDER
      const result = await this.getDB()
        .where([['id', id]])
        .delete();

      console.log('Producto eliminado exitosamente:', result);
      return result;
    } catch (error) {
      console.error('Error en deleteProduct:', error);
      throw error;
    }
  }

  async searchProducts(filters) {
    try {
      let whereConditions = [];

      // Construir filtros dinámicos
      if (filters.part_number) {
        whereConditions.push(['p.part_number', `% ${filters.part_number}% `, 'LIKE']);
      }

      // Filtros por ID si se proporcionan, o por nombre si es necesario (aquí asumimos IDs para simplificar o nombres si se hace join)
      // Para mantener compatibilidad con frontend que envía IDs:
      if (filters.category_id) {
        whereConditions.push(['p.category_id', filters.category_id]);
      }

      if (filters.brand_id) {
        whereConditions.push(['p.brand_id', filters.brand_id]);
      }

      if (filters.status !== undefined) {
        whereConditions.push(['p.status', filters.status]);
      }

      // 👇 Query manual para incluir Joins en búsqueda
      let sql = `
SELECT
p.*,
  b.name as brand,
  c.name as category,
  l.name as location,
  pr.name as supplier
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN locations l ON p.location_id = l.id
        LEFT JOIN provider pr ON p.provider_id = pr.id
  `;

      if (whereConditions.length > 0) {
        const clauses = whereConditions.map(cond => {
          if (cond.length === 2) return `${cond[0]} = '${cond[1]}'`;
          if (cond[2] === 'LIKE') return `${cond[0]} LIKE '${cond[1]}'`;
          return `${cond[0]} = '${cond[1]}'`;
        });
        sql += ` WHERE ${clauses.join(' AND ')} `;
      }

      sql += ` ORDER BY p.created_at DESC`;

      const products = await this.execute(sql);

      return products;
    } catch (error) {
      console.error('Error en searchProducts:', error);
      throw error;
    }
  }
}

module.exports = Products;
