import expressWs from 'express-ws';
import { parse } from 'path';
import { WebSocketServer } from 'ws';
import {
    WSMessageType,
    ConnectionType,
    WSMessage,
    ConnectionTypeMessage,
    ConnectedDevice,
    LaunchCommand,
    TelemetryData,
    DeviceCommand
} from './interfaces';
import {
    MotionState,
    IMUData,
    Vector3,
    Quaternion,
    initializeMotionState,
    integrateMotion as integrateAdvancedMotion,
    resetMotionState as resetAdvancedMotionState
} from './motion-integration';


// Connected devices tracking
const connectedDevices = new Map<string, ConnectedDevice>();
const clientSockets = new Map<string, any>();

// Motion integration state for each device using advanced algorithms
const motionStates = new Map<string, MotionState>();

// Helper function to get or initialize motion state for a device
function getOrInitializeMotionState(clientId: string): MotionState {
    let state = motionStates.get(clientId);
    if (!state) {
        // Disable outlier detection by default for debugging
        state = initializeMotionState(100, false); // 100 Hz sample rate, outlier detection disabled
        motionStates.set(clientId, state);
        console.log(`[WebSocket] Initialized advanced motion state for device ${clientId} (outlier detection: disabled)`);
    }
    return state;
}

// Helper function to reset motion state (for launch resets)
function resetMotionState(clientId: string) {
    const state = motionStates.get(clientId);
    if (state) {
        resetAdvancedMotionState(state);
        console.log(`[WebSocket] Reset advanced motion state for device ${clientId}`);
    }
}

export function startWsServer(appWs: expressWs.Instance) {
    const wsPath = process.env.WS_PATH || "/ws";
    const enableWsLogging = process.env.WS_LOGGING === 'true' || process.env.NODE_ENV === 'development';

    console.log(`🔌 WebSocket server starting on path: ${wsPath}`);
    console.log(`📝 WebSocket logging: ${enableWsLogging ? 'enabled' : 'disabled'}`);

    appWs.app.ws(wsPath, (ws, req) => {
        const clientId = Math.random().toString(36).substring(7);
        clientSockets.set(clientId, ws);

        if (enableWsLogging) {
            console.log(`[WebSocket] New client connected (ID: ${clientId})`);
            console.log(`[WebSocket] Total clients connected: ${appWs.getWss().clients.size}`);
        }

        ws.on('message', (data) => {
            try {
                const parsedData: WSMessage = JSON.parse(data.toString());

                if (!parsedData.type) {
                    sendErrorMessage(ws, "Invalid message format: missing type", clientId);
                    return;
                }

                handleMessage(parsedData, clientId, ws, enableWsLogging);

            } catch (error) {
                if (enableWsLogging) {
                    console.log(`[WebSocket] Received raw message from client ${clientId}:`, data.toString());
                }
                sendErrorMessage(ws, "Invalid JSON format", clientId);
            }
        });

        ws.on('close', (code, reason) => {
            handleClientDisconnect(clientId, enableWsLogging);
            if (enableWsLogging) {
                console.log(`[WebSocket] Client ${clientId} disconnected`);
                console.log(`[WebSocket] Close code: ${code}, Reason: ${reason || 'No reason provided'}`);
                console.log(`[WebSocket] Remaining clients: ${appWs.getWss().clients.size}`);
            }
        });

        ws.on('error', (error) => {
            console.error(`[WebSocket] Error with client ${clientId}:`, error);
            handleClientDisconnect(clientId, enableWsLogging);
        });

        // Send welcome message
        sendMessage(ws, WSMessageType.welcome, {
            clientId: clientId,
            timestamp: new Date().toISOString(),
            message: "Welcome to the WebSocket server! Please send connection_type message to identify yourself."
        }, clientId);
    });
}

// Message handling functions
function handleMessage(message: WSMessage, clientId: string, ws: any, enableLogging: boolean) {
    switch (message.type) {
        case WSMessageType.connection_type:
            handleConnectionType(message.data, clientId, ws, enableLogging);
            break;
        case WSMessageType.dados_geral:
            handleDadosGeral(message.data, clientId, enableLogging);
            break;
        case WSMessageType.dados_aceleracao:
            handleDadosAceleracao(message.data, clientId, enableLogging);
            break;
        case WSMessageType.dados_altura:
            handleDadosAltura(message.data, clientId, enableLogging);
            break;
        case WSMessageType.telemetry_data:
            handleTelemetryData(message.data, clientId, enableLogging);
            break;
        case WSMessageType.get_connected_devices:
            handleGetConnectedDevices(clientId, ws, enableLogging);
            break;
        case WSMessageType.send_command_to_device:
            handleSendCommandToDevice(message.data, clientId, ws, enableLogging);
            break;
        case WSMessageType.launch_command:
            handleLaunchCommand(message.data, clientId, enableLogging);
            break;
        default:
            if (enableLogging) {
                console.log(`[WebSocket] Unknown message type from client ${clientId}:`, message.type);
            }
            sendErrorMessage(ws, `Unknown message type: ${message.type}`, clientId);
    }
}

function handleConnectionType(data: ConnectionTypeMessage, clientId: string, ws: any, enableLogging: boolean) {
    if (!data.connection_type) {
        sendErrorMessage(ws, "Connection type is required", clientId);
        return;
    }

    const device: ConnectedDevice = {
        clientId,
        connectionType: data.connection_type,
        deviceId: data.device_id,
        capabilities: data.capabilities || [],
        lastSeen: new Date(),
        status: 'connected'
    };

    connectedDevices.set(clientId, device);

    if (enableLogging) {
        console.log(`[WebSocket] Client ${clientId} registered as ${data.connection_type}${data.device_id ? ` (Device ID: ${data.device_id})` : ''}`);
    }

    // Send acknowledgment
    sendMessage(ws, WSMessageType.acknowledgment, {
        message: `Successfully registered as ${data.connection_type}`,
        clientId,
        connectionType: data.connection_type
    }, clientId);

    // Notify other clients about the new device (especially websites)
    broadcastToWebsites({
        type: 'device_connected',
        device
    });
}

function handleGetConnectedDevices(clientId: string, ws: any, enableLogging: boolean) {
    const devices = Array.from(connectedDevices.values())
        .filter(device => device.status === 'connected');

    sendMessage(ws, WSMessageType.device_list_response, {
        devices,
        timestamp: new Date().toISOString()
    }, clientId);

    if (enableLogging) {
        console.log(`[WebSocket] Sent device list to client ${clientId}: ${devices.length} devices`);
    }
}

function handleSendCommandToDevice(data: DeviceCommand, senderClientId: string, senderWs: any, enableLogging: boolean) {
    if (!data.command) {
        sendErrorMessage(senderWs, "Command is required", senderClientId);
        return;
    }

    // Log the distance parameter if present
    if (enableLogging && data.command?.parameters?.distance) {
        console.log(`[WebSocket] Launch command distance: ${data.command.parameters.distance}m`);
    }

    let targetDevices: ConnectedDevice[] = [];

    if (data.targetDeviceId) {
        // Find device by device ID
        const device = Array.from(connectedDevices.values())
            .find(d => d.deviceId === data.targetDeviceId && d.status === 'connected');
        if (device) targetDevices.push(device);
    } else if (data.targetConnectionType) {
        // Find devices by connection type
        targetDevices = Array.from(connectedDevices.values())
            .filter(d => d.connectionType === data.targetConnectionType && d.status === 'connected');
    }

    if (targetDevices.length === 0) {
        sendErrorMessage(senderWs, "No target devices found", senderClientId);
        return;
    }

    // Send command to target devices
    let successCount = 0;
    targetDevices.forEach(device => {
        const targetWs = clientSockets.get(device.clientId);
        if (targetWs) {
            let messageToSend: any;

            // For ESP32 acionamento devices, send simple "start" string for launch action
            if (device.connectionType === ConnectionType.acionamento && data.command.action === 'launch') {
                messageToSend = "start";
                if (enableLogging) {
                    console.log(`[WebSocket] Sending simple "start" command to ESP32 ${device.clientId}`);
                }
            } else if (device.connectionType === ConnectionType.acionamento && data.command.action === 'reset') {
                messageToSend = "reset";
                if (enableLogging) {
                    console.log(`[WebSocket] Sending simple \"reset\" command to ESP32 ${device.clientId}`);
                }
            } else {
                // For other devices or actions, send the full JSON command
                messageToSend = data.command;
            }

            const sent = sendRawMessage(targetWs, messageToSend, device.clientId);
            if (sent) successCount++;
        }

        // Reset motion integration state for launch or reset commands
        if (data.command.action === 'launch' || data.command.action === 'reset') {
            resetMotionState(device.clientId);
        }
    });

    // Send response back to sender
    sendMessage(senderWs, WSMessageType.command_response, {
        requestId: data.requestId,
        success: successCount > 0,
        targetCount: targetDevices.length,
        successCount,
        message: `Command sent to ${successCount}/${targetDevices.length} devices`
    }, senderClientId);

    if (enableLogging) {
        console.log(`[WebSocket] Command from ${senderClientId} sent to ${successCount}/${targetDevices.length} devices`);
    }
}

function handleTelemetryData(data: TelemetryData, clientId: string, enableLogging: boolean) {
    if (enableLogging) {
        console.log(`[WebSocket] Received telemetry data from client ${clientId}:`, data);
    }

    // Update device last seen
    const device = connectedDevices.get(clientId);
    if (device) {
        device.lastSeen = new Date();
    }

    // Get or initialize motion state
    const motionState = getOrInitializeMotionState(clientId);

    // Process IMU data if available
    let velocity: Vector3 = { x: 0, y: 0, z: 0 };
    let position: Vector3 = { x: 0, y: 0, z: 0 };
    let orientation: Quaternion = { w: 1, x: 0, y: 0, z: 0 };
    let isStationary = false;
    let convertedIMU = null;

    if (data.imu && data.imu.accel) {
        // Create IMU data structure for the motion integration
        const imuData: IMUData = {
            accel: data.imu.accel,
            gyro: data.imu.gyro || { x: 0, y: 0, z: 0 }, // Use gyro if available, otherwise zero
            timestamp: data.timestamp
        };

        // Perform advanced motion integration
        const result = integrateAdvancedMotion(imuData, motionState);
        velocity = result.velocity;
        position = result.position;
        orientation = result.orientation;
        isStationary = result.isStationary;

        // Convert raw IMU data for display
        convertedIMU = {
            accel: {
                x: data.imu.accel.x * motionState.accelScale,
                y: data.imu.accel.y * motionState.accelScale,
                z: data.imu.accel.z * motionState.accelScale
            },
            gyro: data.imu.gyro ? {
                x: data.imu.gyro.x * motionState.gyroScale,
                y: data.imu.gyro.y * motionState.gyroScale,
                z: data.imu.gyro.z * motionState.gyroScale
            } : { x: 0, y: 0, z: 0 }
        };

        if (enableLogging && isStationary) {
            console.log(`[WebSocket] Device ${clientId} detected as stationary`);
        }
    }

    // Broadcast telemetry data to websites with enhanced motion data
    broadcastToWebsites({
        type: 'telemetry_update',
        clientId,
        deviceId: device?.deviceId,
        timestamp: new Date().toISOString(),
        data: {
            // Send original data structure but with converted values
            timestamp: data.timestamp,
            imu: convertedIMU || data.imu, // Use converted data if available
            rawIMU: data.imu, // Keep raw data for debugging
            // Enhanced motion data
            velocity,
            position,
            orientation,
            isStationary,
            // Scale information for transparency
            scales: {
                accel: motionState.accelScale,
                gyro: motionState.gyroScale,
                autoDetected: motionState.scaleDetected
            }
        }
    });
}

function handleLaunchCommand(data: LaunchCommand, clientId: string, enableLogging: boolean) {
    if (enableLogging) {
        console.log(`[WebSocket] Received launch command from client ${clientId}:`, data);
    }

    // Update device last seen
    const device = connectedDevices.get(clientId);
    if (device) {
        device.lastSeen = new Date();
    }

    // Reset motion state for the device
    resetMotionState(clientId);

    // Broadcast command status to websites
    broadcastToWebsites({
        type: 'command_executed',
        clientId,
        command: data
    });
}

function handleDadosGeral(data: any, clientId: string, enableLogging: boolean) {
    if (enableLogging) {
        console.log(`[WebSocket] Received dados_geral message from client ${clientId}:`, data);
    }
    // Legacy handler - assumindo que os dados são um object do tipo
    // { "aceleracao": [10, 10, 10], "altura": [10, 10, 10] }
}

function handleDadosAltura(data: any, clientId: string, enableLogging: boolean) {
    if (enableLogging) {
        console.log(`[WebSocket] Received dados_altura message from client ${clientId}:`, data);
    }
    // Legacy handler - assumindo que os dados são um array de floats
}

function handleDadosAceleracao(data: any, clientId: string, enableLogging: boolean) {
    if (enableLogging) {
        console.log(`[WebSocket] Received dados_aceleracao message from client ${clientId}:`, data);
    }
    // Legacy handler - assumindo que os dados são um array de floats
}

// Utility functions
function sendMessage(ws: any, type: WSMessageType, data: any, clientId?: string): boolean {
    if (ws && ws.readyState === 1) { // WebSocket.OPEN = 1
        const message: WSMessage = {
            type,
            data,
            timestamp: new Date().toISOString(),
            clientId
        };
        ws.send(JSON.stringify(message));
        return true;
    }
    return false;
}

function sendRawMessage(ws: any, data: any, clientId?: string): boolean {
    if (ws && ws.readyState === 1) { // WebSocket.OPEN = 1
        // Send raw data (string, number, etc.) without JSON wrapper
        ws.send(data);
        return true;
    }
    return false;
}

function sendErrorMessage(ws: any, errorMessage: string, clientId: string) {
    sendMessage(ws, WSMessageType.error, {
        error: errorMessage,
        timestamp: new Date().toISOString()
    }, clientId);
}

function handleClientDisconnect(clientId: string, enableLogging: boolean) {
    const device = connectedDevices.get(clientId);
    if (device) {
        device.status = 'disconnected';

        if (enableLogging) {
            console.log(`[WebSocket] Device ${device.connectionType}${device.deviceId ? ` (${device.deviceId})` : ''} disconnected`);
        }

        // Notify websites about disconnection
        broadcastToWebsites({
            type: 'device_disconnected',
            device
        });

        // Remove from active connections after a delay (for potential reconnection)
        setTimeout(() => {
            connectedDevices.delete(clientId);
        }, 30000); // 30 seconds grace period
    }

    clientSockets.delete(clientId);
}

function broadcastToWebsites(data: any) {
    const websiteClients = Array.from(connectedDevices.values())
        .filter(device => device.connectionType === ConnectionType.website && device.status === 'connected');

    websiteClients.forEach(device => {
        const ws = clientSockets.get(device.clientId);
        if (ws) {
            sendMessage(ws, WSMessageType.esp_status, data, device.clientId);
        }
    });
}





