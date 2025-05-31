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
      // 👇 USAR EXECUTE DIRECTO PARA QUERIES COMPLEJAS
      const query = `
        SELECT 
          id,
          part_number,
          description,
          brand,
          category,
          quantity,
          min_stock,
          max_stock,
          price,
          location,
          supplier,
          status,
          created_at,
          updated_at
        FROM products 
        ORDER BY created_at DESC
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
        brand: data.brand,
        category: data.category,
        quantity: data.quantity || 0,
        min_stock: data.min_stock || 0,
        max_stock: data.max_stock || 0,
        price: data.price || 0,
        location: data.location,
        supplier: data.supplier,
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
        'part_number', 'description', 'brand', 'category',
        'quantity', 'min_stock', 'max_stock', 'price',
        'location', 'supplier', 'status'
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
        whereConditions.push(['part_number', `%${filters.part_number}%`, 'LIKE']);
      }

      if (filters.category) {
        whereConditions.push(['category', filters.category]);
      }

      if (filters.brand) {
        whereConditions.push(['brand', `%${filters.brand}%`, 'LIKE']);
      }

      if (filters.status !== undefined) {
        whereConditions.push(['status', filters.status]);
      }

      // 👇 USAR QUERY BUILDER
      let query = this.select();
      
      if (whereConditions.length > 0) {
        query = query.where(whereConditions);
      }

      const products = await query
        .orderBy([['created_at', 'DESC']])
        .get();
      
      return products;
    } catch (error) {
      console.error('Error en searchProducts:', error);
      throw error;
    }
  }
}

module.exports = Products;