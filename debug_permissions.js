const Role = require('./app/models/role');

async function debugPermissions() {
    try {
        const roleModel = new Role();
        const permissions = await roleModel.getAllPermissions();

        const flatPermissions = [];
        Object.values(permissions).forEach(group => {
            group.forEach(p => flatPermissions.push(p.name));
        });

        console.log("All Permission Names:");
        console.log(flatPermissions.sort());
    } catch (error) {
        console.error("Error:", error);
    }
    process.exit();
}

debugPermissions();
