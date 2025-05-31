const History = require('../models/history');

class HistoryController {
  constructor() {
    // 👇 INICIALIZAR MODELO EN CONSTRUCTOR
    try {
      this.historyModel = new History();
      console.log('✅ HistoryController initialized successfully');
    } catch (err) {
      console.error('❌ Error initializing HistoryController:', err);
      throw err;
    }
  }

  // 👇 USAR ARROW FUNCTIONS PARA MANTENER EL CONTEXTO DE 'this'
  getAll = async (req, res, next) => {
    try {
      console.log('📋 HistoryController.getAll - Iniciando...');
      
      // 👇 VERIFICAR QUE historyModel EXISTE
      if (!this.historyModel) {
        throw new Error('historyModel no está inicializado');
      }
      
      const logs = await this.historyModel.getHistory();
      
      console.log('📋 Logs obtenidos exitosamente:', logs?.length || 0);
      
      // 👇 CORREGIR: Enviar directamente el array, no un objeto con data
      res.json(logs || []);
      
    } catch (err) {
      console.error('❌ Error en HistoryController.getAll:', err);
      res.status(500).json({
        success: false,
        error: 'Error al obtener historial',
        details: err.message
      });
    }
  }

  // 👇 NUEVO: Método para obtener logs por tipo (también con arrow function)
  getByType = async (req, res, next) => {
    try {
      const { type } = req.params;
      console.log('📋 Getting logs by type:', type);
      
      if (!this.historyModel) {
        throw new Error('historyModel no está inicializado');
      }
      
      const logs = await this.historyModel.getLogsByType(type);
      
      res.json({
        success: true,
        data: logs || [],
        count: logs?.length || 0,
        filter: type
      });
      
    } catch (err) {
      console.error('❌ Error getting logs by type:', err);
      res.status(500).json({
        success: false,
        error: 'Error al obtener logs por tipo',
        details: err.message
      });
    }
  }
}

// 👇 EXPORTAR INSTANCIA DE LA CLASE
module.exports = new HistoryController();