// server.js
const express        = require("express");
const fs             = require("fs");
const path           = require("path");
const multer         = require("multer");
const bodyParser     = require("body-parser");
const UserController = require("./app/controllers/userController");

const app      = express();
const port     = process.env.PORT || 3000;
const userCtrl = new UserController();


// JSON parser
app.use(bodyParser.json());

// 1) Asegúrate de que exista public/uploads
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2) Sirve la carpeta uploads como estática
app.use("/uploads", express.static(uploadDir));

// 3) Configura Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.params.id}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// 4) Endpoints

// Subir foto de perfil
app.post(
  "/users/:id/avatar",
  upload.single("avatar"),
  async (req, res) => {
    try {
      const id = req.params.id;

      // 1) Trae al usuario actual para saber su foto vieja
      const oldUser = await userCtrl.getById(id);
      const oldPic  = oldUser.profile_pic; // e.g. "/uploads/avatar-12-....png"

      // 2) Si existe y no es la por defecto, lo borramos
      if (oldPic) {
        const oldPath = path.join(__dirname, "public", oldPic);
        // Asegúrate de que oldPic apunte a uploads; por defecto null o default.png no se toca
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // 3) Ya borrada la anterior, guardamos la nueva
      const filePath = `/uploads/${req.file.filename}`;
      await userCtrl.update(id, { profile_pic: filePath });

      res.json({ profile_pic: filePath });
    } catch (err) {
      console.error("Error al subir avatar:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Registrar usuario
app.post("/users", async (req, res) => {
  try {
    const userId = await userCtrl.register(req.body);
    res.status(201).json({ id: userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { token, user } = await userCtrl.login(req.body);
    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Obtener todos los usuarios
app.get("/users", async (req, res) => {
  try {
    const users = await userCtrl.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar usuario (PUT /users/:id)
app.put("/users/:id", async (req, res) => {
  try {
    const result = await userCtrl.update(req.params.id, req.body);
    res.json({ updated: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener un usuario por ID
app.get("/users/:id", async (req, res) => {
  try {
    const user = await userCtrl.getById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sirve la app React compilada
app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "build", "index.html"))
);

app.listen(port, () => console.log(`Servidor en puerto ${port}`));
