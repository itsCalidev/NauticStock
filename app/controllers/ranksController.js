const Controller = require('./Controller');
const Rank = require('../models/Rank');
const History = require('../models/history');
const Validator = require('../classes/Validator');

class RanksController extends Controller {
    constructor() {
        super();
        this.rankModel = new Rank();
        this.historyModel = new History();
    }

    // Obtener todos los rangos
    async getAllRanks(req, res) {
        try {
            const ranks = await this.rankModel.getAllRanks();
            return this.sendResponse(res, 200, ranks);
        } catch (error) {
            console.error('Error obteniendo rangos:', error);
            return this.sendInternalError(res, 'Error al obtener rangos');
        }
    }

    // Crear nuevo rango
    async createRank(req, res) {
        try {
            const { name } = req.body;

            const error = Validator.validate(req.body, {
                name: { required: true }
            });

            if (error) {
                return this.sendResponse(res, 400, null, error);
            }

            const existingRank = await this.rankModel.getRankByName(name.trim());
            if (existingRank) {
                return this.sendResponse(res, 409, null, 'Ya existe un rango con este nombre');
            }

            const rankData = {
                name: name.trim()
            };

            const insertId = await this.rankModel.createRank(rankData);

            await this.historyModel.registerLog({
                action_type: 'Rango Creado',
                performed_by: req.user.id,
                entity_type: 'ranks', // Assuming 'ranks' is not yet in entity_type enum/check but history table is flexible
                entity_id: insertId,
                new_value: rankData,
                description: `Creó rango ${rankData.name}`
            });

            return this.sendResponse(res, 201, { id: insertId }, 'Rango creado exitosamente');

        } catch (error) {
            console.error('Error creando rango:', error);
            return this.sendInternalError(res, 'Error al crear rango');
        }
    }

    // Actualizar rango
    async updateRank(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;

            const error = Validator.validate(req.body, {
                name: { required: true }
            });

            if (error) {
                return this.sendResponse(res, 400, null, error);
            }

            const existingRank = await this.rankModel.findById(id);
            if (!existingRank) {
                return this.sendNotFound(res, 'Rango no encontrado');
            }

            const duplicateRank = await this.rankModel.getRankByName(name.trim());
            if (duplicateRank && duplicateRank.id != id) {
                return this.sendResponse(res, 409, null, 'Ya existe un rango con este nombre');
            }

            const rankData = {
                name: name.trim()
            };

            await this.rankModel.updateRank(id, rankData);

            await this.historyModel.registerLog({
                action_type: 'Rango Actualizado',
                performed_by: req.user.id,
                entity_type: 'ranks',
                entity_id: parseInt(id),
                old_value: existingRank,
                new_value: rankData,
                description: `Actualizó rango ${rankData.name}`
            });

            return this.sendResponse(res, 200, null, 'Rango actualizado exitosamente');

        } catch (error) {
            console.error('Error actualizando rango:', error);
            return this.sendInternalError(res, 'Error al actualizar rango');
        }
    }

    // Eliminar rango
    async deleteRank(req, res) {
        try {
            const { id } = req.params;

            const existingRank = await this.rankModel.findById(id);
            if (!existingRank) {
                return this.sendNotFound(res, 'Rango no encontrado');
            }

            await this.rankModel.deleteRank(id);

            await this.historyModel.registerLog({
                action_type: 'Rango Eliminado',
                performed_by: req.user.id,
                entity_type: 'ranks',
                entity_id: parseInt(id),
                old_value: existingRank,
                description: `Eliminó rango ${existingRank.name}`
            });

            return this.sendResponse(res, 200, null, 'Rango eliminado exitosamente');

        } catch (error) {
            console.error('Error eliminando rango:', error);
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return this.sendResponse(res, 409, null, 'No se puede eliminar el rango porque está asociado a usuarios');
            }
            return this.sendInternalError(res, 'Error al eliminar rango');
        }
    }
}

module.exports = RanksController;
