const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const historyRoutes = require('./app/routes/historyRoutes');
const authRoutes = require('./app/routes/authRoutes');
const userRoutes = require('./app/routes/userRoutes');
const avatarRoutes = require('./app/routes/avatarRoutes');
const productsRoutes = require('./app/routes/productsRoutes');
const dashboardRoutes = require('./app/routes/dashboardRoutes');
const categoryRoutes = require('./app/routes/categoryRoutes');
const locationRoutes = require('./app/routes/locationRoutes');
const brandRoutes = require('./app/routes/brandRoutes');
const rankRoutes = require('./app/routes/rankRoutes');
const providerRoutes = require('./app/routes/providerRoutes');
const faqRoutes = require('./app/routes/faqRoutes');
const roleRoutes = require('./app/routes/roleRoutes');
const orderRoutes = require('./app/routes/orderRoutes');

const http = require('http');
const socketManager = require('./app/classes/socketManager');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// 1) Security & Efficiency Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now to avoid React issues, or configure strictly
  crossOriginResourcePolicy: false, // Allow loading resources like images
}));
app.use(cors());
app.use(compression());

// Initialize Socket.io
socketManager.initialize(server);

// Rate Limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 login requests per windowMs (Relaxed for testing)
  message: { error: 'Demasiados intentos de inicio de sesión, por favor intente nuevamente en 15 minutos.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // Limit each IP to 3000 requests per windowMs (increased for polling)
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply limiters
app.use('/login', loginLimiter);
app.use('/api', apiLimiter);

// 2) Parser JSON
app.use(bodyParser.json());

// 3) Servir uploads
const uploadDir = path.join(__dirname, 'public', 'uploads');
app.use('/uploads', express.static(uploadDir));

// 4) Montar routers
app.use('/', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/ranks', rankRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/orders', orderRoutes);
app.use('/users', avatarRoutes);

// 5) Servir React build
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
);

// 6) Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err.stack);
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(status).json({
    success: false,
    error: message,
    // Only show stack in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 7) Arrancar servidor
server.listen(port, '0.0.0.0', () => console.log(`Servidor en puerto ${port}`));