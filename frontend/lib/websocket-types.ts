// WebSocket Message Types
export enum WSMessageType {
    // Connection types
    connection_type = "connection_type",

    // Data messages (existing)
    dados_geral = "dados_geral",
    dados_aceleracao = "dados_aceleracao",
    dados_altura = "dados_altura",

    // ESP32 specific messages
    esp_status = "esp_status",
    launch_command = "launch_command",
    telemetry_data = "telemetry_data",

    // Website specific messages
    get_connected_devices = "get_connected_devices",
    send_command_to_device = "send_command_to_device",
    device_list_response = "device_list_response",
    command_response = "command_response",

    // System messages
    welcome = "welcome",
    error = "error",
    acknowledgment = "acknowledgment"
}

export enum ConnectionType {
    acionamento = "acionamento",  // ESP32 for launch control
    telemetria = "telemetria",   // ESP32 for flight monitoring
    website = "website"          // Website connections
}

// WebSocket Message Interfaces
export interface WSMessage {
    type: WSMessageType;
    data: any;
    timestamp?: string;
    clientId?: string;
}

export interface ConnectionTypeMessage {
    connection_type: ConnectionType;
    device_id?: string;
    capabilities?: string[];
}

export interface ConnectedDevice {
    clientId: string;
    connectionType: ConnectionType;
    deviceId?: string;
    capabilities?: string[];
    lastSeen: Date;
    status: 'connected' | 'disconnected';
}

export interface LaunchCommand {
    action: 'prepare' | 'launch' | 'abort' | 'reset';
    parameters?: {
        angle?: number;
        pressure?: number;
        weight?: number;
    };
}

export interface TelemetryData {
    timestamp: string;
    altitude: number[];
    acceleration: number[];
    velocity: number[];
    position?: number[];
    status?: string;
}

export interface DeviceCommand {
    targetDeviceId?: string;
    targetConnectionType?: ConnectionType;
    command: LaunchCommand | any;
    requestId?: string;
}

// WebSocket Client class for the frontend
export class WSClient {
    private ws: WebSocket | null = null;
    private url: string;
    private connectionType: ConnectionType;
    private deviceId?: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectInterval = 3000;
    private messageHandlers: Map<WSMessageType, (data: any) => void> = new Map();

    constructor(url: string, connectionType: ConnectionType = ConnectionType.website, deviceId?: string) {
        this.url = url;
        this.connectionType = connectionType;
        this.deviceId = deviceId;
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.reconnectAttempts = 0;

                    // Send connection type message
                    this.sendMessage(WSMessageType.connection_type, {
                        connection_type: this.connectionType,
                        device_id: this.deviceId,
                        capabilities: this.getCapabilities()
                    } as ConnectionTypeMessage);

                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message: WSMessage = JSON.parse(event.data);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };

                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.handleReconnect();
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    sendMessage(type: WSMessageType, data: any): boolean {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message: WSMessage = {
                type,
                data,
                timestamp: new Date().toISOString()
            };
            this.ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    onMessage(type: WSMessageType, handler: (data: any) => void) {
        this.messageHandlers.set(type, handler);
    }

    private handleMessage(message: WSMessage) {
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
            handler(message.data);
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                this.connect().catch(error => {
                    console.error('Reconnection failed:', error);
                });
            }, this.reconnectInterval);
        }
    }

    private getCapabilities(): string[] {
        switch (this.connectionType) {
            case ConnectionType.acionamento:
                return ['launch_control', 'parameter_setting'];
            case ConnectionType.telemetria:
                return ['telemetry_data', 'flight_monitoring'];
            case ConnectionType.website:
                return ['device_management', 'command_sending', 'data_viewing'];
            default:
                return [];
        }
    }

    // Helper methods for common operations
    getConnectedDevices(): boolean {
        return this.sendMessage(WSMessageType.get_connected_devices, {});
    }

    sendCommandToDevice(targetDeviceId: string, command: LaunchCommand, requestId?: string): boolean {
        return this.sendMessage(WSMessageType.send_command_to_device, {
            targetDeviceId,
            command,
            requestId
        } as DeviceCommand);
    }

    sendTelemetryData(telemetryData: TelemetryData): boolean {
        return this.sendMessage(WSMessageType.telemetry_data, telemetryData);
    }
} 