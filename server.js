const express          = require('express');
const bodyParser       = require('body-parser');
const path             = require('path');
const historyRoutes    = require('./app/routes/historyRoutes');
const authRoutes       = require('./app/routes/authRoutes');
const userRoutes       = require('./app/routes/userRoutes');
const avatarRoutes     = require('./app/routes/avatarRoutes');
const productsRoutes   = require('./app/routes/productsRoutes');
const dashboardRoutes  = require('./app/routes/dashboardRoutes'); // 👈 Debe estar
const categoryRoutes   = require('./app/routes/categoryRoutes');
const locationRoutes   = require('./app/routes/locationRoutes');

const app  = express();
const port = process.env.PORT || 3000;

// 1) Parser JSON
app.use(bodyParser.json());

// 2) Servir uploads
const uploadDir = path.join(__dirname, 'public', 'uploads');
app.use('/uploads', express.static(uploadDir));

// 3) Montar routers
app.use('/',            authRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/dashboard', dashboardRoutes); // 👈 Debe estar
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/users',       avatarRoutes);

// 4) Servir React build
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
);

// 5) Arrancar servidor
app.listen(port, () => console.log(`Servidor en puerto ${port}`));