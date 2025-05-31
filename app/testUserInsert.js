const UserController = require("./controllers/userController");

(async () => {
  const controller = new UserController();

  try {
    /*
    // CREATE
    const userId = await controller.register({
      name: "Esteban",
      password: "12345678",
      account: "2019100",
      email: "esteban@example.com",
      ranks: "usuario",
      status: "activo",
      roleId: 2,
    });
    console.log("✅ Usuario registrado con ID:", userId);
    */

    /*
    // UPDATE
    const updatedRows = await controller.update(6, { name: 'Esteban Modificado', email: 'nuevo@email.com' }); // Cambia el ID según el usuario que quieras actualizar y los datos que quieras modificar
    console.log(`✅ Usuario actualizado. Filas afectadas: ${updatedRows}`);
    */

    /*
    // DELETE
    const deletedRows = await controller.delete(1); // Cambia el ID según el usuario que quieras eliminar
    console.log(`✅ Usuario eliminado. Filas afectadas: ${deletedRows}`);
    */

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();
