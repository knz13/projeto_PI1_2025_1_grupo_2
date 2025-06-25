import expressWs from 'express-ws';
import { parse } from 'path';
import { WebSocketServer } from 'ws';

enum MessageType {
    dados_geral = "dados_geral",
    dados_aceleracao = "dados_aceleracao",
    dados_altura = "dados_altura",
}


export function startWsServer(appWs: expressWs.Instance){
    appWs.app.ws("/ws", (ws, req) => {
        const clientId = Math.random().toString(36).substring(7);
        console.log(`[WebSocket] New client connected (ID: ${clientId})`);
        console.log(`[WebSocket] Total clients connected: ${appWs.getWss().clients.size}`);
    
        ws.on('message', (data) => {
            try {
                const parsedData = JSON.parse(data.toString());

                if(!parsedData.type || !parsedData.data) {
                    console.log(`[WebSocket] Received invalid message from client ${clientId}:`, parsedData);
                    return;
                }

                switch(parsedData.type){
                    case MessageType.dados_geral:
                        handleDadosGeral(parsedData.data, clientId);
                        break;
                    case MessageType.dados_aceleracao:
                        handleDadosAceleracao(parsedData.data, clientId);
                        break;
                    case MessageType.dados_altura:
                        handleDadosAltura(parsedData.data, clientId);
                        break;
                }
                console.log(`[WebSocket] Received message from client ${clientId}:`, parsedData);
            } catch (error) {
                console.log(`[WebSocket] Received raw message from client ${clientId}:`, data.toString());
            }
        });
    
        ws.on('close', (code, reason) => {
            console.log(`[WebSocket] Client ${clientId} disconnected`);
            console.log(`[WebSocket] Close code: ${code}, Reason: ${reason || 'No reason provided'}`);
            console.log(`[WebSocket] Remaining clients: ${appWs.getWss().clients.size}`);
        });
    
        ws.on('error', (error) => {
            console.error(`[WebSocket] Error with client ${clientId}:`, error);
        });
    
        console.log(`[WebSocket] Sending welcome message to client ${clientId}`);
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

function handleDadosGeral(data: any, clientId: string){
    console.log(`[WebSocket] Received dados_geral message from client ${clientId}:`, data);

    // assumindo que os dados são um object do tipo

    /*
    {
        "aceleracao": [10, 10, 10],
        "altura": [10, 10, 10]
    }
    */

}

function handleDadosAltura(data: any, clientId: string){
    console.log(`[WebSocket] Received dados_altura message from client ${clientId}:`, data);

    // assumindo que os dados são um array de floats
}


function handleDadosAceleracao(data: any, clientId: string){
    console.log(`[WebSocket] Received dados_aceleracao message from client ${clientId}:`, data);

    // assumindo que os dados são um array de floats
}







/* console.log(`Listening por ${port}...`);

wss.on('connection', (ws) => {

    ws.on('message', (data) => {
        //a ideia é que os sensores mandem um json com um tipo e um valor
        //o tipo vai indicar qual informação está sendo mandada
        try{
            const fullData = JSON.parse(data.toString());
            switch(fullData.tipo){
                case 'velocidade':
                    //eu nao achei nenhuma funcao que salva os dados no supabase ent deixei so o placeholder msm
                    //placeholder(fullData.valor);
                    break;
                case 'aceleracao':
                    //placeholder(fullData.valor);
                    break;
                case 'altura':
                    //placeholder(fullData.valor);
                    break;
                case 'angulo':
                    //placeholder(fullData.valor);
                    break;
                case 'pressao':
                    //placeholder(fullData.valor);
                    break;
                
                //como velocidade aceleração e altura vao ser
                //mandados varias vezes durante o voo,
                //acho interessante que sejam mandados juntos
                //se esse for o caso:
               
                default:
                    break;
                    
            }
        }catch(err){
            console.error('Mensage Error');
            ws.send('Error');
        }
        
    });

    ws.send('Connected');
});

 */