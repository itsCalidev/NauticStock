// config/config.js
require("dotenv").config();

module.exports = {
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "nauticstock",
    port: process.env.DB_PORT || 3306
  },
  jwtSecret: process.env.JWT_SECRET || "NaUtIcStOcK",
  jwtOptions: {
    expiresIn: process.env.JWT_EXPIRES_IN || "2h"
  }
};