const Controller = require('./Controller');
const History = require('../models/history');

class HistoryController extends Controller {
  constructor() {
    super();
    try {
      this.historyModel = new History();
    } catch (err) {
      console.error('Error initializing HistoryController:', err);
      throw err;
    }
  }

  // Obtener todos los logs
  async getAll(req, res) {
    try {
      if (!this.historyModel) {
        throw new Error('historyModel no está inicializado');
      }

      const logs = await this.historyModel.getHistory();

      return this.sendResponse(res, 200, logs || []);

    } catch (err) {
      console.error('Error en HistoryController.getAll:', err);
      return this.sendInternalError(res, 'Error al obtener historial');
    }
  }

  // Obtener logs por tipo
  async getByType(req, res) {
    try {
      const { type } = req.params;

      if (!this.historyModel) {
        throw new Error('historyModel no está inicializado');
      }

      const logs = await this.historyModel.getLogsByType(type);

      return this.sendResponse(res, 200, logs || [], null);

    } catch (err) {
      console.error('Error getting logs by type:', err);
      return this.sendInternalError(res, 'Error al obtener logs por tipo');
    }
  }
}

module.exports = new HistoryController();