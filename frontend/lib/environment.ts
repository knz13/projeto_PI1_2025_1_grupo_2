
import dotenv from 'dotenv';

var initializedEnvironment = false;

export const Environment = {
    get_backend_url: () => {
        return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5875";
    },
    get_websocket_url: () => {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5875";
        const wsPath = process.env.NEXT_PUBLIC_WS_PATH || "/ws";

        // Convert HTTP/HTTPS to WS/WSS
        const wsUrl = backendUrl.replace(/^https?/, (match) => {
            return match === 'https' ? 'wss' : 'ws';
        });

        return wsUrl + wsPath;
    },
    init: () => {
        if (initializedEnvironment) return;
        dotenv.config();
        initializedEnvironment = true;
    }
}