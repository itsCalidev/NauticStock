// app/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const userCtrl = new UserController();

// POST /login
router.post('/login', async (req, res, next) => {
  try {
    const { token, user } = await userCtrl.login(req.body);

    // 👇 FORMATO ESTÁNDAR
    res.json({
      success: true,
      data: { token, user }
    });
  } catch (err) {
    // 👇 FORMATO ESTÁNDAR DE ERROR
    res.status(401).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
