const Controller = require("./Controller");
const Products = require("../models/products");
const History = require("../models/history");
const Brand = require("../models/brand");
const Category = require("../models/category");
const Location = require("../models/location");
const Provider = require("../models/provider");
const Validator = require("../classes/validator");
const socketManager = require("../classes/socketManager");

class ProductsController extends Controller {
  constructor() {
    super();
    this.productsModel = new Products();
    this.historyModel = new History();
    this.brandModel = new Brand();
    this.categoryModel = new Category();
    this.locationModel = new Location();
    this.providerModel = new Provider();
  }

  /** Obtener todos los productos */
  async getAllProducts(req, res) {
    try {
      const products = await this.productsModel.getAllProducts();
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

  /** Helper para resolver IDs */
  async resolveIds(data) {
    const resolved = { ...data };

    // 1. Brand
    if (data.brandId) {
      resolved.brand_id = data.brandId;
    } else if (data.brand && !data.brand_id) {
      const brand = await this.brandModel.findByName(data.brand);
      if (brand) {
        resolved.brand_id = brand.id;
      } else {
        // Crear si no existe
        resolved.brand_id = await this.brandModel.create(data.brand);
      }
    }

    // 2. Category
    if (data.categoryId) {
      resolved.category_id = data.categoryId;
    } else if (data.category && !data.category_id) {
      const category = await this.categoryModel.getCategoryByName(data.category);
      if (category) {
        resolved.category_id = category.id;
      } else {
        // Si no existe, podríamos crearla o lanzar error.
        // Dado que el frontend usa un Select, debería existir.
        // Pero si viene texto libre, la creamos.
        const insertId = await this.categoryModel.createCategory({ name: data.category, description: '' });
        resolved.category_id = insertId;
      }
    }

    // 3. Location
    if (data.locationId) {
      resolved.location_id = data.locationId;
    } else if (data.location && !data.location_id) {
      const location = await this.locationModel.getLocationByName(data.location);
      if (location) {
        resolved.location_id = location.id;
      } else {
        const insertId = await this.locationModel.createLocation({ name: data.location, description: '' });
        resolved.location_id = insertId;
      }
    }

    // 4. Provider (Supplier)
    // Frontend envía 'supplier', DB usa 'provider_id'
    const supplierName = data.supplier || data.provider;
    if (data.providerId) {
      resolved.provider_id = data.providerId;
    } else if (supplierName && !data.provider_id) {
      const provider = await this.providerModel.findByName(supplierName);
      if (provider) {
        resolved.provider_id = provider.id;
      } else {
        resolved.provider_id = await this.providerModel.create(supplierName);
      }
    }

    return resolved;
  }

  /** Crear nuevo producto */
  async createProduct(req, res) {
    try {
      const rawData = req.body;
      const performed_by = req.user?.id;

      const error = Validator.validate(rawData, {
        part_number: { required: true },
        description: { required: true }
      });

      if (error) {
        return this.sendResponse(res, 400, null, error);
      }

      // Resolver IDs
      const data = await this.resolveIds(rawData);

      const productId = await this.productsModel.createProduct(data);

      // Emit socket event
      socketManager.emit("product_created", { id: productId, ...data });
      socketManager.emit("history_updated", {});

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
      const rawData = req.body;
      const performed_by = req.user?.id;

      const oldProduct = await this.productsModel.findById(id);
      if (!oldProduct) {
        return this.sendNotFound(res, "Producto no encontrado");
      }

      // Resolver IDs
      const data = await this.resolveIds(rawData);

      await this.productsModel.updateProduct(id, data);

      // Emit socket event with FULL data for notifications
      const updatedProductPayload = { ...oldProduct, ...data, id };
      socketManager.emit("product_updated", updatedProductPayload);
      socketManager.emit("history_updated", {});

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

      const product = await this.productsModel.findById(id);
      if (!product) {
        return this.sendNotFound(res, "Producto no encontrado");
      }

      try {
        await this.historyModel.registerLog({
          action_type: "Producto Eliminado",
          performed_by,
          target_user: null,
          target_product: parseInt(id),
          old_value: product,
          new_value: null,
          description: `Eliminó producto ${product.part_number}`
        });
      } catch (historyError) {
        console.error('Error al registrar en historial (continuando eliminación):', historyError);
      }

      await this.productsModel.deleteProduct(id);

      // Emit socket event
      socketManager.emit("product_deleted", { id });
      socketManager.emit("history_updated", {});

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