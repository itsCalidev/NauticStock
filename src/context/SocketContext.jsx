import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Determine the URL for the socket connection
        // In development, React runs on a different port (usually 3001) than the API (3000)
        // In production, they run on the same port
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = process.env.NODE_ENV === 'development' ? '3000' : window.location.port;

        const url = `${protocol}//${hostname}:${port}`;

        console.log(`🔌 Connecting to Socket.io at ${url}`);

        const newSocket = io(url, {
            transports: ['websocket'], // Force websocket
            reconnection: true,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('✅ Connected to WebSocket server');
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Disconnected from WebSocket server');
        });

        newSocket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err);
        });

        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
