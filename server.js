// server.js
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

// Importa o define tus controladores o rutas de API
// Por ejemplo, si tienes un endpoint para registrar usuarios:
const UserController = require("./app/controllers/userController"); // Ajusta la ruta según donde esté tu archivo

const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(bodyParser.json());

// Ejemplo de endpoint de API para registrar usuarios
const userController = new UserController();
app.post("/users", async (req, res) => {
  try {
    const userId = await userController.register(req.body);
    res.status(201).json({ id: userId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Si la aplicación React ya fue compilada (npm run build), servir los archivos estáticos
app.use(express.static(path.join(__dirname, "build")));

// Para cualquier ruta que no sea de API, enviar el index.html (esto es importante para el enrutamiento en React)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});