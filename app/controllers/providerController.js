const Controller = require('./Controller');
const Provider = require('../models/Provider');
const History = require('../models/history');
const Validator = require('../classes/Validator');

class ProviderController extends Controller {
    constructor() {
        super();
        this.providerModel = new Provider();
        this.historyModel = new History();
    }

    // Obtener todos los proveedores
    async getAllProviders(req, res) {
        try {
            const showInactive = req.query.showInactive === 'true';
            const providers = await this.providerModel.getAll(showInactive);
            return this.sendResponse(res, 200, providers);
        } catch (error) {
            console.error('Error obteniendo proveedores:', error);
            return this.sendInternalError(res, 'Error al obtener proveedores');
        }
    }

    // Crear nuevo proveedor
    async createProvider(req, res) {
        try {
            const { name, company, email, address, registration, phone, website, contact_name } = req.body;

            const error = Validator.validate(req.body, {
                name: { required: true }
            });

            if (error) {
                return this.sendResponse(res, 400, null, error);
            }

            const existingProvider = await this.providerModel.findByName(name.trim());
            if (existingProvider) {
                return this.sendResponse(res, 409, null, 'Ya existe un proveedor con este nombre');
            }

            const providerData = {
                name: name.trim(),
                company: company || null,
                email: email || null,
                address: address || null,
                registration: registration || null,
                phone: phone || null,
                website: website || null,
                contact_name: contact_name || null,
                status: 0 // Default active
            };

            const insertId = await this.providerModel.create(providerData);

            await this.historyModel.registerLog({
                action_type: 'Proveedor Creado',
                performed_by: req.user.id,
                entity_type: 'provider',
                entity_id: insertId,
                new_value: providerData,
                description: `Creó proveedor ${providerData.name}`
            });

            return this.sendResponse(res, 201, { id: insertId }, 'Proveedor creado exitosamente');

        } catch (error) {
            console.error('Error creando proveedor:', error);
            return this.sendInternalError(res, 'Error al crear proveedor');
        }
    }

    // Actualizar proveedor
    async updateProvider(req, res) {
        try {
            const { id } = req.params;
            const { name, company, email, address, registration, phone, website, contact_name } = req.body;

            const error = Validator.validate(req.body, {
                name: { required: true }
            });

            if (error) {
                return this.sendResponse(res, 400, null, error);
            }

            const existingProvider = await this.providerModel.findById(id);
            if (!existingProvider) {
                return this.sendNotFound(res, 'Proveedor no encontrado');
            }

            const duplicateProvider = await this.providerModel.findByName(name.trim());
            if (duplicateProvider && duplicateProvider.id != id) {
                return this.sendResponse(res, 409, null, 'Ya existe un proveedor con este nombre');
            }

            const providerData = {
                name: name.trim(),
                company: company || null,
                email: email || null,
                address: address || null,
                registration: registration || null,
                phone: phone || null,
                website: website || null,
                contact_name: contact_name || null
            };

            await this.providerModel.update(id, providerData);

            await this.historyModel.registerLog({
                action_type: 'Proveedor Actualizado',
                performed_by: req.user.id,
                entity_type: 'provider',
                entity_id: parseInt(id),
                old_value: existingProvider,
                new_value: providerData,
                description: `Actualizó proveedor ${providerData.name}`
            });

            return this.sendResponse(res, 200, null, 'Proveedor actualizado exitosamente');

        } catch (error) {
            console.error('Error actualizando proveedor:', error);
            return this.sendInternalError(res, 'Error al actualizar proveedor');
        }
    }

    // Eliminar proveedor (soft delete)
    async deleteProvider(req, res) {
        try {
            const { id } = req.params;

            const existingProvider = await this.providerModel.findById(id);
            if (!existingProvider) {
                return this.sendNotFound(res, 'Proveedor no encontrado');
            }

            await this.providerModel.deleteProvider(id);

            await this.historyModel.registerLog({
                action_type: 'Proveedor Eliminado',
                performed_by: req.user.id,
                entity_type: 'provider',
                entity_id: parseInt(id),
                old_value: existingProvider,
                description: `Eliminó proveedor ${existingProvider.name}`
            });

            return this.sendResponse(res, 200, null, 'Proveedor eliminado exitosamente');

        } catch (error) {
            console.error('Error eliminando proveedor:', error);
            return this.sendInternalError(res, 'Error al eliminar proveedor');
        }
    }

    // Cambiar estado (Habilitar/Deshabilitar)
    async toggleProviderStatus(req, res) {
        try {
            const { id } = req.params;

            const existingProvider = await this.providerModel.findById(id);
            if (!existingProvider) {
                return this.sendNotFound(res, 'Proveedor no encontrado');
            }

            await this.providerModel.toggleStatus(id, existingProvider.status);

            const newStatus = existingProvider.status === 0 ? 1 : 0;
            const action = newStatus === 0 ? 'Habilitó' : 'Deshabilitó';

            await this.historyModel.registerLog({
                action_type: 'Estado Proveedor Actualizado',
                performed_by: req.user.id,
                entity_type: 'provider',
                entity_id: parseInt(id),
                old_value: { status: existingProvider.status },
                new_value: { status: newStatus },
                description: `${action} proveedor ${existingProvider.name}`
            });

            return this.sendResponse(res, 200, { status: newStatus }, `Proveedor ${action.toLowerCase()} exitosamente`);

        } catch (error) {
            console.error('Error cambiando estado del proveedor:', error);
            return this.sendInternalError(res, 'Error al cambiar estado del proveedor');
        }
    }
}

module.exports = ProviderController;
