const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const DB = require('../classes/db');

// 📊 Obtener estadísticas de inventario por categoría - MEJORADA
router.get('/inventory-stats', auth, checkPermission('dashboard_view'), async (req, res, next) => {
  try {
    console.log('📊 Obteniendo estadísticas de inventario...');

    const db = new DB();

    // Query mejorada para obtener TODAS las categorías, incluso las vacías
    // ACTUALIZADO: Usar JOIN con categories table
    const query = `
      SELECT DISTINCT
        COALESCE(c.name, 'Sin Categoría') as categoria,
        COUNT(p.id) as productos,
        COALESCE(SUM(p.quantity), 0) as cantidad,
        COALESCE(SUM(CASE WHEN p.quantity <= p.min_stock THEN 1 ELSE 0 END), 0) as bajo_stock,
        COALESCE(AVG(p.price), 0) as precio_promedio,
        MIN(p.created_at) as primera_fecha
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 0
      GROUP BY c.name
      ORDER BY cantidad DESC, categoria ASC
    `;

    const stats = await db.execute(query);

    // Procesar y limpiar datos
    const processedStats = stats.map(stat => ({
      categoria: stat.categoria || 'Sin Categoría',
      productos: parseInt(stat.productos) || 0,
      cantidad: parseInt(stat.cantidad) || 0,
      bajo_stock: parseInt(stat.bajo_stock) || 0,
      precio_promedio: parseFloat(stat.precio_promedio) || 0
    }));

    console.log('✅ Stats de inventario obtenidas:', processedStats.length, 'categorías');
    console.log('📊 Categorías encontradas:', processedStats.map(s => s.categoria));

    res.json({
      success: true,
      data: processedStats
    });

  } catch (err) {
    console.error('❌ Error obteniendo stats de inventario:', err);
    next(err);
  }
});

// 📈 Obtener actividad del sistema (últimos 30 días)
router.get('/activity-stats', auth, checkPermission('dashboard_view'), async (req, res, next) => {
  try {
    console.log('📈 Obteniendo estadísticas de actividad...');

    const db = new DB();

    // Query para obtener actividad de los últimos 30 días
    const query = `
      SELECT 
        DATE(created_at) as fecha,
        COUNT(*) as actividad,
        COUNT(CASE WHEN action_type LIKE '%Creado%' THEN 1 END) as creaciones,
        COUNT(CASE WHEN action_type LIKE '%Actualizado%' THEN 1 END) as actualizaciones,
        COUNT(CASE WHEN action_type LIKE '%Eliminado%' THEN 1 END) as eliminaciones
      FROM history 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at) 
      ORDER BY fecha ASC
    `;

    const activity = await db.execute(query);

    console.log('📈 Actividad raw obtenida:', activity);

    // Llenar días faltantes con 0
    const filledActivity = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const existingData = activity.find(a => {
        const activityDate = new Date(a.fecha).toISOString().split('T')[0];
        return activityDate === dateStr;
      });

      filledActivity.push({
        fecha: dateStr.split('-').slice(1).reverse().join('/'),
        fecha_completa: dateStr,
        actividad: existingData ? parseInt(existingData.actividad) : 0,
        creaciones: existingData ? parseInt(existingData.creaciones) : 0,
        actualizaciones: existingData ? parseInt(existingData.actualizaciones) : 0,
        eliminaciones: existingData ? parseInt(existingData.eliminaciones) : 0
      });
    }

    console.log('✅ Stats de actividad procesadas:', filledActivity);

    res.json({
      success: true,
      data: filledActivity
    });

  } catch (err) {
    console.error('❌ Error obteniendo stats de actividad:', err);
    next(err);
  }
});

// 📋 Obtener resumen general del sistema
router.get('/summary', auth, checkPermission('dashboard_view'), async (req, res, next) => {
  try {
    console.log('📋 Obteniendo resumen del sistema...');

    const db = new DB();

    // Queries paralelas para obtener resumen
    const [products, users, history] = await Promise.all([
      db.execute('SELECT COUNT(*) as total, SUM(quantity) as stock_total FROM products WHERE status = 0'),
      // Usuarios activos: aquellos con last_access en los últimos 5 minutos
      db.execute(`
        SELECT 
          COUNT(*) as total, 
          COUNT(CASE WHEN last_access >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 1 END) as activos 
        FROM user
      `),
      db.execute('SELECT COUNT(*) as total FROM history WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)')
    ]);

    const summary = {
      productos_total: products[0]?.total || 0,
      stock_total: products[0]?.stock_total || 0,
      usuarios_total: users[0]?.total || 0,
      usuarios_activos: users[0]?.activos || 0,
      actividad_semanal: history[0]?.total || 0
    };

    console.log('✅ Resumen obtenido:', summary);

    res.json({
      success: true,
      data: summary
    });

  } catch (err) {
    console.error('❌ Error obteniendo resumen:', err);
    next(err);
  }
});

module.exports = router;