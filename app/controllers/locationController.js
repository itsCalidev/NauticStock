const Controller = require('./Controller');
const Location = require('../models/location');
const History = require('../models/history');
const Validator = require('../classes/Validator');

class LocationController extends Controller {
  constructor() {
    super();
    this.locationModel = new Location();
    this.historyModel = new History();
  }

  // Obtener todas las ubicaciones activas
  async getLocations(req, res) {
    try {
      const locations = await this.locationModel.getActiveLocations();
      return this.sendResponse(res, 200, locations);
    } catch (error) {
      console.error('Error obteniendo ubicaciones:', error);
      return this.sendInternalError(res, 'Error al obtener ubicaciones');
    }
  }

  // Crear nueva ubicación
  async createLocation(req, res) {
    try {
      const { name, description } = req.body;

      const error = Validator.validate(req.body, {
        name: { required: true }
      });

      if (error) {
        return this.sendResponse(res, 400, null, error);
      }

      const existingLocation = await this.locationModel.getLocationByName(name.trim());
      if (existingLocation) {
        return this.sendResponse(res, 409, null, 'Ya existe una ubicación con este nombre');
      }

      const locationData = {
        name: name.trim(),
        description: description?.trim() || null
      };

      const result = await this.locationModel.createLocation(locationData);

      await this.historyModel.registerLog({
        action_type: 'Ubicación Creada',
        performed_by: req.user.id,
        new_value: JSON.stringify(locationData),
        description: `Creó ubicación ${locationData.name}`
      });

      return this.sendResponse(res, 201, { id: result.insertId }, 'Ubicación creada exitosamente');

    } catch (error) {
      console.error('Error creando ubicación:', error);
      return this.sendInternalError(res, 'Error al crear ubicación');
    }
  }

  // Actualizar ubicación
  async updateLocation(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const error = Validator.validate(req.body, {
        name: { required: true }
      });

      if (error) {
        return this.sendResponse(res, 400, null, error);
      }

      const existingLocation = await this.locationModel.getLocationById(id);
      if (!existingLocation) {
        return this.sendNotFound(res, 'Ubicación no encontrada');
      }

      const duplicateLocation = await this.locationModel.getLocationByName(name.trim());
      if (duplicateLocation && duplicateLocation.id != id) {
        return this.sendResponse(res, 409, null, 'Ya existe una ubicación con este nombre');
      }

      const locationData = {
        name: name.trim(),
        description: description?.trim() || null
      };

      await this.locationModel.updateLocation(id, locationData);

      await this.historyModel.registerLog({
        action_type: 'Ubicación Actualizada',
        performed_by: req.user.id,
        old_value: JSON.stringify(existingLocation),
        new_value: JSON.stringify(locationData),
        description: `Actualizó ubicación ${locationData.name}`
      });

      return this.sendResponse(res, 200, null, 'Ubicación actualizada exitosamente');

    } catch (error) {
      console.error('Error actualizando ubicación:', error);
      return this.sendInternalError(res, 'Error al actualizar ubicación');
    }
  }

  // Eliminar ubicación
  async deleteLocation(req, res) {
    try {
      const { id } = req.params;

      const existingLocation = await this.locationModel.getLocationById(id);
      if (!existingLocation) {
        return this.sendNotFound(res, 'Ubicación no encontrada');
      }

      await this.locationModel.deleteLocation(id);

      await this.historyModel.registerLog({
        action_type: 'Ubicación Eliminada',
        performed_by: req.user.id,
        old_value: JSON.stringify(existingLocation),
        description: `Eliminó ubicación ${existingLocation.name}`
      });

      return this.sendResponse(res, 200, null, 'Ubicación eliminada exitosamente');

    } catch (error) {
      console.error('Error eliminando ubicación:', error);
      return this.sendInternalError(res, 'Error al eliminar ubicación');
    }
  }

  // Obtener ubicación por ID
  async getLocationById(req, res) {
    try {
      const { id } = req.params;
      const location = await this.locationModel.getLocationById(id);

      if (!location) {
        return this.sendNotFound(res, 'Ubicación no encontrada');
      }

      return this.sendResponse(res, 200, location);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      return this.sendInternalError(res, 'Error al obtener ubicación');
    }
  }

  // Obtener todas las ubicaciones (incluyendo deshabilitadas)
  async getAllLocations(req, res) {
    try {
      const locations = await this.locationModel.getAllLocations();
      return this.sendResponse(res, 200, locations);
    } catch (error) {
      console.error('Error obteniendo todas las ubicaciones:', error);
      return this.sendInternalError(res, 'Error al obtener todas las ubicaciones');
    }
  }

  // Rehabilitar ubicación
  async enableLocation(req, res) {
    try {
      const { id } = req.params;

      const existingLocation = await this.locationModel.getLocationByIdAll(id);
      if (!existingLocation) {
        return this.sendNotFound(res, 'Ubicación no encontrada');
      }

      if (existingLocation.status === 0) {
        return this.sendResponse(res, 400, null, 'La ubicación ya está habilitada');
      }

      await this.locationModel.enableLocation(id);

      await this.historyModel.registerLog({
        action_type: 'Ubicación Rehabilitada',
        performed_by: req.user.id,
        old_value: JSON.stringify(existingLocation),
        new_value: JSON.stringify({ ...existingLocation, status: 0 }),
        description: `Rehabilitó ubicación ${existingLocation.name}`
      });

      return this.sendResponse(res, 200, null, 'Ubicación rehabilitada exitosamente');

    } catch (error) {
      console.error('Error rehabilitando ubicación:', error);
      return this.sendInternalError(res, 'Error al rehabilitar ubicación');
    }
  }
}

module.exports = LocationController;
