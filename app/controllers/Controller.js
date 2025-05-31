const db = require('../classes/db');

class Controller extends db {
    constructor() {
        super();
    }

    // AGREGAR el método sendResponse sin cambiar lo que ya funciona
    sendResponse(res, status, data, message = null) {
        const response = {
            success: status < 400,
            data: data
        };
        
        if (message) {
            if (status >= 400) {
                response.error = message;
            } else {
                response.message = message;
            }
        }
        
        return res.status(status).json(response);
    }

    // Métodos auxiliares opcionales
    sendNotFound(res, message = "Recurso no encontrado") {
        return this.sendResponse(res, 404, null, message);
    }

    sendInternalError(res, message = "Error interno del servidor") {
        return this.sendResponse(res, 500, null, message);
    }
}

module.exports = Controller;