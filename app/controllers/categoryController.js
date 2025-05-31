const Controller = require('./Controller');
const Category = require('../models/category');
const History = require('../models/history');

class CategoryController extends Controller {
  constructor() {
    super();
    this.categoryModel = new Category();
    this.historyModel = new History();
  }  // Obtener todas las categorías activas
  async getCategories(req, res) {
    try {
      console.log('🔍 CategoryController.getCategories llamado');
      console.log('🔍 Usuario autenticado:', req.user?.id);
      
      const categories = await this.categoryModel.getActiveCategories();
      console.log('✅ Categorías obtenidas:', categories.length, 'registros');
      console.log('✅ Primera categoría:', categories[0]);
      
      res.json(categories);
    } catch (error) {
      console.error('❌ Error obteniendo categorías:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Crear nueva categoría
  async createCategory(req, res) {
    try {
      const { name, description } = req.body;

      // Validaciones
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
      }

      // Verificar si ya existe
      const existingCategory = await this.categoryModel.getCategoryByName(name.trim());
      if (existingCategory) {
        return res.status(409).json({ error: 'Ya existe una categoría con este nombre' });
      }

      // Crear categoría
      const categoryData = {
        name: name.trim(),
        description: description?.trim() || null
      };

      const result = await this.categoryModel.createCategory(categoryData);      // Registrar en historial
      await this.historyModel.registerLog({
        action_type: 'Categoría Creada',
        performed_by: req.user.id,
        new_value: JSON.stringify(categoryData),
        description: `Creó categoría ${categoryData.name}`
      });

      res.status(201).json({ 
        message: 'Categoría creada exitosamente',
        categoryId: result.insertId 
      });

    } catch (error) {
      console.error('Error creando categoría:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Actualizar categoría
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Validaciones
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
      }

      // Verificar si existe
      const existingCategory = await this.categoryModel.getCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      // Verificar si el nuevo nombre ya existe (excepto la categoría actual)
      const duplicateCategory = await this.categoryModel.getCategoryByName(name.trim());
      if (duplicateCategory && duplicateCategory.id != id) {
        return res.status(409).json({ error: 'Ya existe una categoría con este nombre' });
      }

      const categoryData = {
        name: name.trim(),
        description: description?.trim() || null
      };

      await this.categoryModel.updateCategory(id, categoryData);      // Registrar en historial
      await this.historyModel.registerLog({
        action_type: 'Categoría Actualizada',
        performed_by: req.user.id,
        old_value: JSON.stringify(existingCategory),
        new_value: JSON.stringify(categoryData),
        description: `Actualizó categoría ${categoryData.name}`
      });

      res.json({ message: 'Categoría actualizada exitosamente' });

    } catch (error) {
      console.error('Error actualizando categoría:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Eliminar categoría
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      // Verificar si existe
      const existingCategory = await this.categoryModel.getCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      await this.categoryModel.deleteCategory(id);      // Registrar en historial
      await this.historyModel.registerLog({
        action_type: 'Categoría Eliminada',
        performed_by: req.user.id,
        old_value: JSON.stringify(existingCategory),
        description: `Eliminó categoría ${existingCategory.name}`
      });

      res.json({ message: 'Categoría eliminada exitosamente' });

    } catch (error) {
      console.error('Error eliminando categoría:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener categoría por ID
  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const category = await this.categoryModel.getCategoryById(id);

      if (!category) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      res.json(category);
    } catch (error) {
      console.error('Error obteniendo categoría:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener todas las categorías (incluyendo deshabilitadas) - solo para admin
  async getAllCategories(req, res) {
    try {
      console.log('🔍 CategoryController.getAllCategories llamado');
      console.log('🔍 Usuario autenticado:', req.user?.id);
      
      const categories = await this.categoryModel.getAllCategories();
      console.log('✅ Todas las categorías obtenidas:', categories.length, 'registros');
      
      res.json(categories);
    } catch (error) {
      console.error('❌ Error obteniendo todas las categorías:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Rehabilitar categoría
  async enableCategory(req, res) {
    try {
      const { id } = req.params;

      // Verificar si existe (incluyendo deshabilitadas)
      const existingCategory = await this.categoryModel.getCategoryByIdAll(id);
      if (!existingCategory) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      // Verificar si ya está habilitada
      if (existingCategory.status === 0) {
        return res.status(400).json({ error: 'La categoría ya está habilitada' });
      }

      await this.categoryModel.enableCategory(id);

      // Registrar en historial
      await this.historyModel.registerLog({
        action_type: 'Categoría Rehabilitada',
        performed_by: req.user.id,
        old_value: JSON.stringify(existingCategory),
        new_value: JSON.stringify({ ...existingCategory, status: 0 }),
        description: `Rehabilitó categoría ${existingCategory.name}`
      });

      res.json({ message: 'Categoría rehabilitada exitosamente' });

    } catch (error) {
      console.error('Error rehabilitando categoría:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = CategoryController;
