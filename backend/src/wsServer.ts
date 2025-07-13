import expressWs from 'express-ws';
import { parse } from 'path';
import { WebSocketServer } from 'ws';

enum MessageType {
    dados_geral = "dados_geral",
    dados_aceleracao = "dados_aceleracao",
    dados_altura = "dados_altura",
}


export function startWsServer(appWs: expressWs.Instance) {
    const wsPath = process.env.WS_PATH || "/ws";
    const enableWsLogging = process.env.WS_LOGGING === 'true' || process.env.NODE_ENV === 'development';

    console.log(`🔌 WebSocket server starting on path: ${wsPath}`);
    console.log(`📝 WebSocket logging: ${enableWsLogging ? 'enabled' : 'disabled'}`);

    appWs.app.ws(wsPath, (ws, req) => {
        const clientId = Math.random().toString(36).substring(7);

        if (enableWsLogging) {
            console.log(`[WebSocket] New client connected (ID: ${clientId})`);
            console.log(`[WebSocket] Total clients connected: ${appWs.getWss().clients.size}`);
        }

        ws.on('message', (data) => {
            try {
                const parsedData = JSON.parse(data.toString());

                if (!parsedData.type || !parsedData.data) {
                    console.log(`[WebSocket] Received invalid message from client ${clientId}:`, parsedData);
                    return;
                }

                switch (parsedData.type) {
                    case MessageType.dados_geral:
                        handleDadosGeral(parsedData.data, clientId, enableWsLogging);
                        break;
                    case MessageType.dados_aceleracao:
                        handleDadosAceleracao(parsedData.data, clientId, enableWsLogging);
                        break;
                    case MessageType.dados_altura:
                        handleDadosAltura(parsedData.data, clientId, enableWsLogging);
                        break;
                }

                if (enableWsLogging) {
                    console.log(`[WebSocket] Received message from client ${clientId}:`, parsedData);
                }
            } catch (error) {
                console.log(`[WebSocket] Received raw message from client ${clientId}:`, data.toString());
            }
        });

        ws.on('close', (code, reason) => {
            if (enableWsLogging) {
                console.log(`[WebSocket] Client ${clientId} disconnected`);
                console.log(`[WebSocket] Close code: ${code}, Reason: ${reason || 'No reason provided'}`);
                console.log(`[WebSocket] Remaining clients: ${appWs.getWss().clients.size}`);
            }
        });

        ws.on('error', (error) => {
            console.error(`[WebSocket] Error with client ${clientId}:`, error);
        });

        if (enableWsLogging) {
            console.log(`[WebSocket] Sending welcome message to client ${clientId}`);
        }
        ws.send(JSON.stringify({
            type: "welcome",
            data: {
                clientId: clientId,
                timestamp: new Date().toISOString(),
                message: "Welcome to the WebSocket server!"
            }
        }));
    });

}

function handleDadosGeral(data: any, clientId: string, enableLogging: boolean) {
    if (enableLogging) {
        console.log(`[WebSocket] Received dados_geral message from client ${clientId}:`, data);
    }

    // assumindo que os dados são um object do tipo

    /*
    {
        "aceleracao": [10, 10, 10],
        "altura": [10, 10, 10]
    }
    */

}

function handleDadosAltura(data: any, clientId: string, enableLogging: boolean) {
    if (enableLogging) {
        console.log(`[WebSocket] Received dados_altura message from client ${clientId}:`, data);
    }

    // assumindo que os dados são um array de floats
}


function handleDadosAceleracao(data: any, clientId: string, enableLogging: boolean) {
    if (enableLogging) {
        console.log(`[WebSocket] Received dados_aceleracao message from client ${clientId}:`, data);
    }

    // assumindo que os dados são um array de floats
}





