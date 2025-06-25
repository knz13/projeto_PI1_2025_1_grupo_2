import WebSocket from 'ws';

// Configuration
const WS_URL = 'ws://localhost:5875/ws';
const MESSAGE_INTERVAL = 3000; // 3 seconds

console.log(`[WebSocket Client] Attempting to connect to ${WS_URL}`);

// Create WebSocket connection
const ws = new WebSocket(WS_URL);

let messageCount = 0;
let connectionStartTime: Date;

// Connection opened
ws.on('open', () => {
    connectionStartTime = new Date();
    console.log(`[WebSocket Client] Connected successfully at ${connectionStartTime.toISOString()}`);

    // Send a message every 3 seconds
    const intervalId = setInterval(() => {
        messageCount++;
        const message = {
            timestamp: new Date().toISOString(),
            messageId: messageCount,
            message: `Test message #${messageCount}`,
            uptime: Math.round((new Date().getTime() - connectionStartTime.getTime()) / 1000)
        };

        try {
            ws.send(JSON.stringify(message));
            console.log('[WebSocket Client] Sent message:', message);
        } catch (error) {
            console.error('[WebSocket Client] Failed to send message:', error);
            clearInterval(intervalId);
        }
    }, MESSAGE_INTERVAL);
});

// Listen for messages
ws.on('message', (data) => {
    try {
        const parsedData = JSON.parse(data.toString());
        console.log('[WebSocket Client] Received:', parsedData);

        if (parsedData.type === 'welcome') {
            console.log('[WebSocket Client] Received welcome message with client ID:', parsedData.data.clientId);
        }
    } catch (error) {
        console.log('[WebSocket Client] Received raw message:', data.toString());
    }
});

// Handle errors
ws.on('error', (error) => {
    console.error('[WebSocket Client] Error occurred:', error);
});

// Handle connection close
ws.on('close', (code, reason) => {
    console.log('[WebSocket Client] Disconnected from server');
    console.log(`[WebSocket Client] Close code: ${code}`);
    console.log(`[WebSocket Client] Close reason: ${reason || 'No reason provided'}`);
    if (connectionStartTime) {
        const duration = Math.round((new Date().getTime() - connectionStartTime.getTime()) / 1000);
        console.log(`[WebSocket Client] Connection duration: ${duration} seconds`);
        console.log(`[WebSocket Client] Messages sent: ${messageCount}`);
    }
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n[WebSocket Client] Received termination signal');
    console.log('[WebSocket Client] Closing connection gracefully...');
    ws.close(1000, 'Client terminated by user');
    process.exit();
});
