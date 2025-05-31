//app/routes/historyRoutes.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const history = require('../controllers/historyController');

// GET /history → sólo admin
router.get('/', auth, isAdmin, history.getAll);

module.exports = router;
