const Controller = require('./Controller');
const Location = require('../models/location');
const History = require('../models/history');

class LocationController extends Controller {
  constructor() {
    super();
    this.locationModel = new Location();
    this.historyModel = new History();
  }  // Obtener todas las ubicaciones activas
  async getLocations(req, res) {
    try {
      console.log('🔍 LocationController.getLocations llamado');
      console.log('🔍 Usuario autenticado:', req.user?.id);
      
      const locations = await this.locationModel.getActiveLocations();
      console.log('✅ Ubicaciones obtenidas:', locations.length, 'registros');
      console.log('✅ Primera ubicación:', locations[0]);
      
      res.json(locations);
    } catch (error) {
      console.error('❌ Error obteniendo ubicaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Crear nueva ubicación
  async createLocation(req, res) {
    try {
      const { name, description } = req.body;

      // Validaciones
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'El nombre de la ubicación es requerido' });
      }

      // Verificar si ya existe
      const existingLocation = await this.locationModel.getLocationByName(name.trim());
      if (existingLocation) {
        return res.status(409).json({ error: 'Ya existe una ubicación con este nombre' });
      }

      // Crear ubicación
      const locationData = {
        name: name.trim(),
        description: description?.trim() || null
      };

      const result = await this.locationModel.createLocation(locationData);      // Registrar en historial
      await this.historyModel.registerLog({
        action_type: 'Ubicación Creada',
        performed_by: req.user.id,
        new_value: JSON.stringify(locationData),
        description: `Creó ubicación ${locationData.name}`
      });

      res.status(201).json({ 
        message: 'Ubicación creada exitosamente',
        locationId: result.insertId 
      });

    } catch (error) {
      console.error('Error creando ubicación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Actualizar ubicación
  async updateLocation(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Validaciones
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'El nombre de la ubicación es requerido' });
      }

      // Verificar si existe
      const existingLocation = await this.locationModel.getLocationById(id);
      if (!existingLocation) {
        return res.status(404).json({ error: 'Ubicación no encontrada' });
      }

      // Verificar si el nuevo nombre ya existe (excepto la ubicación actual)
      const duplicateLocation = await this.locationModel.getLocationByName(name.trim());
      if (duplicateLocation && duplicateLocation.id != id) {
        return res.status(409).json({ error: 'Ya existe una ubicación con este nombre' });
      }

      const locationData = {
        name: name.trim(),
        description: description?.trim() || null
      };

      await this.locationModel.updateLocation(id, locationData);      // Registrar en historial
      await this.historyModel.registerLog({
        action_type: 'Ubicación Actualizada',
        performed_by: req.user.id,
        old_value: JSON.stringify(existingLocation),
        new_value: JSON.stringify(locationData),
        description: `Actualizó ubicación ${locationData.name}`
      });

      res.json({ message: 'Ubicación actualizada exitosamente' });

    } catch (error) {
      console.error('Error actualizando ubicación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Eliminar ubicación
  async deleteLocation(req, res) {
    try {
      const { id } = req.params;

      // Verificar si existe
      const existingLocation = await this.locationModel.getLocationById(id);
      if (!existingLocation) {
        return res.status(404).json({ error: 'Ubicación no encontrada' });
      }

      await this.locationModel.deleteLocation(id);      // Registrar en historial
      await this.historyModel.registerLog({
        action_type: 'Ubicación Eliminada',
        performed_by: req.user.id,
        old_value: JSON.stringify(existingLocation),
        description: `Eliminó ubicación ${existingLocation.name}`
      });

      res.json({ message: 'Ubicación eliminada exitosamente' });

    } catch (error) {
      console.error('Error eliminando ubicación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener ubicación por ID
  async getLocationById(req, res) {
    try {
      const { id } = req.params;
      const location = await this.locationModel.getLocationById(id);

      if (!location) {
        return res.status(404).json({ error: 'Ubicación no encontrada' });
      }

      res.json(location);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener todas las ubicaciones (incluyendo deshabilitadas) - solo para admin
  async getAllLocations(req, res) {
    try {
      console.log('🔍 LocationController.getAllLocations llamado');
      console.log('🔍 Usuario autenticado:', req.user?.id);
      
      const locations = await this.locationModel.getAllLocations();
      console.log('✅ Todas las ubicaciones obtenidas:', locations.length, 'registros');
      
      res.json(locations);
    } catch (error) {
      console.error('❌ Error obteniendo todas las ubicaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Rehabilitar ubicación
  async enableLocation(req, res) {
    try {
      const { id } = req.params;

      // Verificar si existe (incluyendo deshabilitadas)
      const existingLocation = await this.locationModel.getLocationByIdAll(id);
      if (!existingLocation) {
        return res.status(404).json({ error: 'Ubicación no encontrada' });
      }

      // Verificar si ya está habilitada
      if (existingLocation.status === 0) {
        return res.status(400).json({ error: 'La ubicación ya está habilitada' });
      }

      await this.locationModel.enableLocation(id);

      // Registrar en historial
      await this.historyModel.registerLog({
        action_type: 'Ubicación Rehabilitada',
        performed_by: req.user.id,
        old_value: JSON.stringify(existingLocation),
        new_value: JSON.stringify({ ...existingLocation, status: 0 }),
        description: `Rehabilitó ubicación ${existingLocation.name}`
      });

      res.json({ message: 'Ubicación rehabilitada exitosamente' });

    } catch (error) {
      console.error('Error rehabilitando ubicación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = LocationController;
