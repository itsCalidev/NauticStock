const Controller = require('./Controller');
const Brand = require('../models/Brand');
const History = require('../models/history');
const Validator = require('../classes/Validator');

class BrandsController extends Controller {
    constructor() {
        super();
        this.brandModel = new Brand();
        this.historyModel = new History();
    }

    // Obtener todas las marcas
    async getAllBrands(req, res) {
        try {
            const brands = await this.brandModel.getAll();
            return this.sendResponse(res, 200, brands);
        } catch (error) {
            console.error('Error obteniendo marcas:', error);
            return this.sendInternalError(res, 'Error al obtener marcas');
        }
    }

    // Crear nueva marca
    async createBrand(req, res) {
        try {
            const { name } = req.body;

            const error = Validator.validate(req.body, {
                name: { required: true }
            });

            if (error) {
                return this.sendResponse(res, 400, null, error);
            }

            const existingBrand = await this.brandModel.findByName(name.trim());
            if (existingBrand) {
                return this.sendResponse(res, 409, null, 'Ya existe una marca con este nombre');
            }

            const brandData = {
                name: name.trim()
            };

            const insertId = await this.brandModel.create(brandData.name);

            await this.historyModel.registerLog({
                action_type: 'Marca Creada',
                performed_by: req.user.id,
                entity_type: 'brands',
                entity_id: insertId,
                new_value: brandData,
                description: `Creó marca ${brandData.name}`
            });

            return this.sendResponse(res, 201, { id: insertId }, 'Marca creada exitosamente');

        } catch (error) {
            console.error('Error creando marca:', error);
            return this.sendInternalError(res, 'Error al crear marca');
        }
    }

    // Actualizar marca
    async updateBrand(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;

            const error = Validator.validate(req.body, {
                name: { required: true }
            });

            if (error) {
                return this.sendResponse(res, 400, null, error);
            }

            // Verificar si existe (usando getAll y filtrando por ahora, o implementar findById en modelo)
            // Mejor implemento findById en el modelo Brand si no existe, pero Model.js tiene findById?
            // Model.js tiene findById.
            const existingBrand = await this.brandModel.findById(id);
            if (!existingBrand) {
                return this.sendNotFound(res, 'Marca no encontrada');
            }

            const duplicateBrand = await this.brandModel.findByName(name.trim());
            if (duplicateBrand && duplicateBrand.id != id) {
                return this.sendResponse(res, 409, null, 'Ya existe una marca con este nombre');
            }

            const brandData = {
                name: name.trim()
            };

            await this.brandModel.update(id, brandData);

            await this.historyModel.registerLog({
                action_type: 'Marca Actualizada',
                performed_by: req.user.id,
                entity_type: 'brands',
                entity_id: parseInt(id),
                old_value: existingBrand,
                new_value: brandData,
                description: `Actualizó marca ${brandData.name}`
            });

            return this.sendResponse(res, 200, null, 'Marca actualizada exitosamente');

        } catch (error) {
            console.error('Error actualizando marca:', error);
            return this.sendInternalError(res, 'Error al actualizar marca');
        }
    }

    // Eliminar marca
    async deleteBrand(req, res) {
        try {
            const { id } = req.params;

            const existingBrand = await this.brandModel.findById(id);
            if (!existingBrand) {
                return this.sendNotFound(res, 'Marca no encontrada');
            }

            await this.brandModel.deleteBrand(id);

            await this.historyModel.registerLog({
                action_type: 'Marca Eliminada',
                performed_by: req.user.id,
                entity_type: 'brands',
                entity_id: parseInt(id),
                old_value: existingBrand,
                description: `Eliminó marca ${existingBrand.name}`
            });

            return this.sendResponse(res, 200, null, 'Marca eliminada exitosamente');

        } catch (error) {
            console.error('Error eliminando marca:', error);
            // Check for foreign key constraint error
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return this.sendResponse(res, 409, null, 'No se puede eliminar la marca porque está asociada a productos');
            }
            return this.sendInternalError(res, 'Error al eliminar marca');
        }
    }
}

module.exports = BrandsController;
