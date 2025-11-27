class SocketManager {
    constructor() {
        this.io = null;
    }

    initialize(server) {
        const { Server } = require("socket.io");
        this.io = new Server(server, {
            cors: {
                origin: "*", // Allow all origins for now to facilitate network access
                methods: ["GET", "POST"]
            }
        });

        this.io.on("connection", (socket) => {
            console.log("🔌 New client connected:", socket.id);

            socket.on("disconnect", () => {
                console.log("❌ Client disconnected:", socket.id);
            });
        });

        console.log("✅ Socket.io initialized");
    }

    emit(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        } else {
            console.warn("⚠️ Socket.io not initialized, cannot emit event:", event);
        }
    }
}

module.exports = new SocketManager();
