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
    posicao: number[];
    id_tipo: number;
}

// Interface para os dados formatados para o frontend
export interface DadosLancamentoFormatado {
    timestamp: string;
    altitude: number;
    position: number;
    velocity: number;
    acceleration: number;
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
        posicao: Array.isArray(json.posicao)
            ? json.posicao.map(Number)
            : JSON.parse(json.posicao || '[]').map(Number),
        id_tipo: Number(json.id_tipo),
    };
}

// Função para converter dados do banco para o formato esperado pelo frontend
export function formatarDadosParaFrontend(dadosLancamento: DadosLancamento): DadosLancamentoFormatado[] {
    const maxLength = Math.max(
        dadosLancamento.altura.length,
        dadosLancamento.aceleracao.length,
        dadosLancamento.velocidade.length,
        dadosLancamento.posicao.length
    );

    const dados: DadosLancamentoFormatado[] = [];
    const baseDate = new Date(dadosLancamento.created_at);

    for (let i = 0; i < maxLength; i++) {
        // Criar timestamp incrementando segundos baseado no índice
        const timestamp = new Date(baseDate.getTime() + (i * 200)); // 200ms entre cada ponto
        
        dados.push({
            timestamp: timestamp.toISOString(),
            altitude: dadosLancamento.altura[i] || 0,
            position: dadosLancamento.posicao[i] || 0, // Agora usa dados de posição reais
            velocity: dadosLancamento.velocidade[i] || 0,
            acceleration: dadosLancamento.aceleracao[i] || 0
        });
    }

    return dados;
}