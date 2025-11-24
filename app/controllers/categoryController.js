const Controller = require('./Controller');
const Category = require('../models/category');
const History = require('../models/history');
const Validator = require('../classes/Validator');

class CategoryController extends Controller {
  constructor() {
    super();
    this.categoryModel = new Category();
    this.historyModel = new History();
  }

  // Obtener todas las categorías activas
  async getCategories(req, res) {
    try {
      const categories = await this.categoryModel.getActiveCategories();
      return this.sendResponse(res, 200, categories);
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      return this.sendInternalError(res, 'Error al obtener categorías');
    }
  }

  // Crear nueva categoría
  async createCategory(req, res) {
    try {
      const { name, description } = req.body;

      const error = Validator.validate(req.body, {
        name: { required: true }
      });

      if (error) {
        return this.sendResponse(res, 400, null, error);
      }

      const existingCategory = await this.categoryModel.getCategoryByName(name.trim());
      if (existingCategory) {
        return this.sendResponse(res, 409, null, 'Ya existe una categoría con este nombre');
      }

      const categoryData = {
        name: name.trim(),
        description: description?.trim() || null
      };

      const result = await this.categoryModel.createCategory(categoryData);

      await this.historyModel.registerLog({
        action_type: 'Categoría Creada',
        performed_by: req.user.id,
        new_value: JSON.stringify(categoryData),
        description: `Creó categoría ${categoryData.name}`
      });

      return this.sendResponse(res, 201, { id: result.insertId }, 'Categoría creada exitosamente');

    } catch (error) {
      console.error('Error creando categoría:', error);
      return this.sendInternalError(res, 'Error al crear categoría');
    }
  }

  // Actualizar categoría
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const error = Validator.validate(req.body, {
        name: { required: true }
      });

      if (error) {
        return this.sendResponse(res, 400, null, error);
      }

      const existingCategory = await this.categoryModel.getCategoryById(id);
      if (!existingCategory) {
        return this.sendNotFound(res, 'Categoría no encontrada');
      }

      const duplicateCategory = await this.categoryModel.getCategoryByName(name.trim());
      if (duplicateCategory && duplicateCategory.id != id) {
        return this.sendResponse(res, 409, null, 'Ya existe una categoría con este nombre');
      }

      const categoryData = {
        name: name.trim(),
        description: description?.trim() || null
      };

      await this.categoryModel.updateCategory(id, categoryData);

      await this.historyModel.registerLog({
        action_type: 'Categoría Actualizada',
        performed_by: req.user.id,
        old_value: JSON.stringify(existingCategory),
        new_value: JSON.stringify(categoryData),
        description: `Actualizó categoría ${categoryData.name}`
      });

      return this.sendResponse(res, 200, null, 'Categoría actualizada exitosamente');

    } catch (error) {
      console.error('Error actualizando categoría:', error);
      return this.sendInternalError(res, 'Error al actualizar categoría');
    }
  }

  // Eliminar categoría
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      const existingCategory = await this.categoryModel.getCategoryById(id);
      if (!existingCategory) {
        return this.sendNotFound(res, 'Categoría no encontrada');
      }

      await this.categoryModel.deleteCategory(id);

      await this.historyModel.registerLog({
        action_type: 'Categoría Eliminada',
        performed_by: req.user.id,
        old_value: JSON.stringify(existingCategory),
        description: `Eliminó categoría ${existingCategory.name}`
      });

      return this.sendResponse(res, 200, null, 'Categoría eliminada exitosamente');

    } catch (error) {
      console.error('Error eliminando categoría:', error);
      return this.sendInternalError(res, 'Error al eliminar categoría');
    }
  }

  // Obtener categoría por ID
  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const category = await this.categoryModel.getCategoryById(id);

      if (!category) {
        return this.sendNotFound(res, 'Categoría no encontrada');
      }

      return this.sendResponse(res, 200, category);
    } catch (error) {
      console.error('Error obteniendo categoría:', error);
      return this.sendInternalError(res, 'Error al obtener categoría');
    }
  }

  // Obtener todas las categorías (incluyendo deshabilitadas)
  async getAllCategories(req, res) {
    try {
      const categories = await this.categoryModel.getAllCategories();
      return this.sendResponse(res, 200, categories);
    } catch (error) {
      console.error('Error obteniendo todas las categorías:', error);
      return this.sendInternalError(res, 'Error al obtener todas las categorías');
    }
  }

  // Rehabilitar categoría
  async enableCategory(req, res) {
    try {
      const { id } = req.params;

      const existingCategory = await this.categoryModel.getCategoryByIdAll(id);
      if (!existingCategory) {
        return this.sendNotFound(res, 'Categoría no encontrada');
      }

      if (existingCategory.status === 0) {
        return this.sendResponse(res, 400, null, 'La categoría ya está habilitada');
      }

      await this.categoryModel.enableCategory(id);

      await this.historyModel.registerLog({
        action_type: 'Categoría Rehabilitada',
        performed_by: req.user.id,
        old_value: JSON.stringify(existingCategory),
        new_value: JSON.stringify({ ...existingCategory, status: 0 }),
        description: `Rehabilitó categoría ${existingCategory.name}`
      });

      return this.sendResponse(res, 200, null, 'Categoría rehabilitada exitosamente');

    } catch (error) {
      console.error('Error rehabilitando categoría:', error);
      return this.sendInternalError(res, 'Error al rehabilitar categoría');
    }
  }
}

module.exports = CategoryController;
