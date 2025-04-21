// server.js
const express        = require("express");
const path           = require("path");
const bodyParser     = require("body-parser");
const UserController = require("./app/controllers/userController");

const app       = express();
const port      = process.env.PORT || 3000;
const userCtrl  = new UserController();

app.use(bodyParser.json());

// POST /users — ya lo tienes
app.post("/users", async (req, res) => {
  try {
    const userId = await userCtrl.register(req.body);
    res.status(201).json({ id: userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { token, user } = await userCtrl.login(req.body);
    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// <<< DEFINO AQUÍ EL GET /users >>>
app.get("/users", async (req, res) => {
  try {
    const users = await userCtrl.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, () => console.log(`Servidor en puerto ${port}`));