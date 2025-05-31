const Controller = require("./Controller");
const Products = require("../models/products");
const History = require("../models/history");

class ProductsController extends Controller {
  constructor() {
    super();
    this.productsModel = new Products();
    this.historyModel = new History();
  }

  /** Obtener todos los productos */
  async getAllProducts(req, res) {
    try {
      console.log('ProductsController.getAllProducts - Iniciando...');
      const products = await this.productsModel.getAllProducts();
      console.log('Productos obtenidos:', products?.length || 0);
      
      return this.sendResponse(res, 200, products);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      return this.sendInternalError(res, "Error al obtener productos");
    }
  }

  /** Obtener producto por ID */
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await this.productsModel.findById(id);
      
      if (!product) {
        return this.sendNotFound(res, "Producto no encontrado");
      }

      return this.sendResponse(res, 200, product);
    } catch (error) {
      console.error("Error al obtener producto:", error);
      return this.sendInternalError(res, "Error al obtener producto");
    }
  }

  /** Crear nuevo producto */
  async createProduct(req, res) {
    try {
      const data = req.body;
      const performed_by = req.user?.id;

      if (!data.part_number || !data.description) {
        return this.sendResponse(res, 400, null, "Número de parte y descripción son requeridos");
      }

      const productId = await this.productsModel.createProduct(data);

      // Registrar en historial
      try {
        await this.historyModel.registerLog({
          action_type: "Producto Creado",
          performed_by,
          target_user: null,
          target_product: productId,
          old_value: null,
          new_value: data,
          description: `Creó producto ${data.part_number}`
        });
      } catch (historyError) {
        console.warn('Error al registrar en historial:', historyError);
      }

      return this.sendResponse(res, 201, { id: productId }, "Producto creado exitosamente");
    } catch (error) {
      console.error("Error al crear producto:", error);
      return this.sendInternalError(res, "Error al crear producto");
    }
  }

  /** Actualizar producto */
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const performed_by = req.user?.id;

      const oldProduct = await this.productsModel.findById(id);
      if (!oldProduct) {
        return this.sendNotFound(res, "Producto no encontrado");
      }

      await this.productsModel.updateProduct(id, data);

      // Registrar en historial
      try {
        await this.historyModel.registerLog({
          action_type: "Producto Actualizado",
          performed_by,
          target_user: null,
          target_product: parseInt(id),
          old_value: oldProduct,
          new_value: data,
          description: `Actualizó producto ${oldProduct.part_number}`
        });
      } catch (historyError) {
        console.warn('Error al registrar en historial:', historyError);
      }

      return this.sendResponse(res, 200, null, "Producto actualizado exitosamente");
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      return this.sendInternalError(res, "Error al actualizar producto");
    }
  }

  /** Eliminar producto */
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const performed_by = req.user?.id;

      console.log(`🗑️ Eliminando producto ${id} por usuario ${performed_by}`);

      // 👇 CRÍTICO: OBTENER DATOS ANTES DE ELIMINAR
      const product = await this.productsModel.findById(id);
      if (!product) {
        return this.sendNotFound(res, "Producto no encontrado");
      }

      console.log('📦 Producto a eliminar:', product.part_number);

      // 👇 REGISTRAR EN HISTORIAL ANTES DE ELIMINAR
      try {
        await this.historyModel.registerLog({
          action_type: "Producto Eliminado",
          performed_by,
          target_user: null,
          target_product: parseInt(id), // El producto AÚN existe
          old_value: product,
          new_value: null,
          description: `Eliminó producto ${product.part_number}`
        });
        console.log('✅ Historial registrado exitosamente');
      } catch (historyError) {
        console.error('❌ Error al registrar en historial (continuando eliminación):', historyError);
        // Continuamos con la eliminación aunque falle el historial
      }

      // 👇 AHORA SÍ ELIMINAR EL PRODUCTO
      await this.productsModel.deleteProduct(id);
      console.log('🗑️ Producto eliminado exitosamente');

      return this.sendResponse(res, 200, null, "Producto eliminado exitosamente");
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      return this.sendInternalError(res, "Error al eliminar producto");
    }
  }

  /** Buscar productos */
  async searchProducts(req, res) {
    try {
      const filters = req.query;
      const products = await this.productsModel.searchProducts(filters);
      return this.sendResponse(res, 200, products);
    } catch (error) {
      console.error("Error al buscar productos:", error);
      return this.sendInternalError(res, "Error al buscar productos");
    }
  }
}

module.exports = ProductsController;