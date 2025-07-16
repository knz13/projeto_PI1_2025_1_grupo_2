import { Pair } from "./utils";
import { Request, Response } from 'express';

export enum RequestType {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
}

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
    timestamp: number; // Changed from string to number
    imu: {
        accel: {
            x: number;
            y: number;
            z: number;
        };
        gyro: {
            x: number;
            y: number;
            z: number;
        };
    };
    gps?: {  // GPS data is optional
        lat: number;
        lon: number;
        alt: number;
        sats: number;
    };
    velocity?: {  // Calculated velocity
        x: number;
        y: number;
        z: number;
    };
    position?: {  // Calculated position
        x: number;
        y: number;
        z: number;
    };
    acceleration?: number[];  // Keep for backwards compatibility
    status?: string;
}

export interface DeviceCommand {
    targetDeviceId?: string;
    targetConnectionType?: ConnectionType;
    command: LaunchCommand | any;
    requestId?: string;
}

export interface DadosLancamento {
    id_lancamento: number;
    created_at: string; // ou Date, dependendo de como você manipula datas
    angulo_lancamento: number;
    peso: number;
    pressao: number;
    altura: number[];
    aceleracao: number[];
    velocidade: number[];
    tempo: number[]; // Time array in seconds
    posicao: number[]; // Position array in meters
    tipo: string;
}

export interface EndpointController {
    name: string;
    routes: { [key: string]: Pair<RequestType, (req: Request, res: Response) => Promise<Response> | Promise<void>> };
}

export function parseDadosLancamento(json: any): DadosLancamento {
    return {
        id_lancamento: Number(json.id_lancamento),
        created_at: String(json.created_at),
        angulo_lancamento: Number(json.angulo_lancamento),
        peso: Number(json.peso),
        pressao: Number(json.pressao),
        altura: Array.isArray(json.altura)
            ? json.altura.map(Number)
            : JSON.parse(json.altura).map(Number),
        aceleracao: Array.isArray(json.aceleracao)
            ? json.aceleracao.map(Number)
            : JSON.parse(json.aceleracao).map(Number),
        velocidade: Array.isArray(json.velocidade)
            ? json.velocidade.map(Number)
            : JSON.parse(json.velocidade).map(Number),
        tempo: Array.isArray(json.tempo)
            ? json.tempo.map(Number)
            : JSON.parse(json.tempo).map(Number),
        posicao: Array.isArray(json.posicao)
            ? json.posicao.map(Number)
            : JSON.parse(json.posicao).map(Number),
        tipo: String(json.tipo),
    };
}