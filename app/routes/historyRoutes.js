//app/routes/historyRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const history = require('../controllers/historyController');

// GET /history → admin o permiso history_view
router.get('/', auth, checkPermission('history_view'), (req, res) => history.getAll(req, res));

module.exports = router;
