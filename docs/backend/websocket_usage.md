# WebSocket Usage Guide

## Overview

The WebSocket server now supports multiple connection types to handle different ESP32 devices and website connections:

- **acionamento**: ESP32 for launch control
- **telemetria**: ESP32 for flight monitoring  
- **website**: Web dashboard connections

## Connection Protocol

### 1. Initial Connection

When connecting to the WebSocket endpoint (`/ws`), clients must first send a `connection_type` message to identify themselves:

```json
{
  "type": "connection_type",
  "data": {
    "connection_type": "acionamento", // or "telemetria" or "website"
    "device_id": "ESP32_001", // optional unique device identifier
    "capabilities": ["launch_control", "parameter_setting"] // optional list of capabilities
  }
}
```

### 2. Message Types

#### ESP32 Acionamento (Launch Control)
- **Receives**: `launch_command` messages with launch parameters
- **Sends**: Status updates and acknowledgments

#### ESP32 Telemetria (Flight Monitoring)  
- **Sends**: `telemetry_data` with flight data
- **Receives**: Configuration commands

#### Website Dashboard
- **Sends**: `get_connected_devices`, `send_command_to_device`
- **Receives**: `device_list_response`, `esp_status`, `telemetry_update`

## ESP32 Implementation Examples

### Acionamento ESP32 Code Structure

```cpp
// After WebSocket connection is established
void sendConnectionType() {
  String message = "{\"type\":\"connection_type\",\"data\":{\"connection_type\":\"acionamento\",\"device_id\":\"ESP32_LAUNCH_001\",\"capabilities\":[\"launch_control\",\"parameter_setting\"]}}";
  webSocket.sendTXT(message);
}

void onWebSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_CONNECTED:
      sendConnectionType();
      break;
    case WStype_TEXT:
      handleMessage((char*)payload);
      break;
  }
}

void handleMessage(String message) {
  // Parse JSON and handle launch commands
  // Expected format: {"type":"launch_command","data":{"action":"launch","parameters":{...}}}
}
```

### Telemetria ESP32 Code Structure  

```cpp
void sendConnectionType() {
  String message = "{\"type\":\"connection_type\",\"data\":{\"connection_type\":\"telemetria\",\"device_id\":\"ESP32_TELEM_001\",\"capabilities\":[\"telemetry_data\",\"flight_monitoring\"]}}";
  webSocket.sendTXT(message);
}

void sendTelemetryData(float altitude[], float acceleration[], float velocity[]) {
  String message = "{\"type\":\"telemetry_data\",\"data\":{";
  message += "\"timestamp\":\"" + getCurrentTimestamp() + "\",";
  message += "\"altitude\":[" + arrayToString(altitude, 3) + "],";
  message += "\"acceleration\":[" + arrayToString(acceleration, 3) + "],";
  message += "\"velocity\":[" + arrayToString(velocity, 3) + "],";
  message += "\"status\":\"flying\"";
  message += "}}";
  webSocket.sendTXT(message);
}
```

## Frontend Usage

The frontend automatically connects as a `website` type and provides:

1. **Real-time device status**: Shows connected ESP32s
2. **Launch control**: Send commands to acionamento ESP32s
3. **Telemetry display**: Real-time flight data from telemetria ESP32s
4. **Device management**: List and manage connected devices

### Using the WSClient Class

```typescript
import { WSClient, ConnectionType, WSMessageType } from '@/lib/websocket-types';

// Create client (automatically identifies as website)
const client = new WSClient('ws://localhost:5875/ws', ConnectionType.website);

// Set up message handlers
client.onMessage(WSMessageType.device_list_response, (data) => {
  console.log('Connected devices:', data.devices);
});

client.onMessage(WSMessageType.esp_status, (data) => {
  console.log('ESP status update:', data);
});

// Connect
await client.connect();

// Get connected devices
client.getConnectedDevices();

// Send launch command
client.sendMessage(WSMessageType.send_command_to_device, {
  targetConnectionType: ConnectionType.acionamento,
  command: {
    action: 'launch',
    parameters: { angle: 45, pressure: 30, weight: 0.5 }
  }
});
```

## Message Flow Examples

### Launch Sequence

1. Website sends command:
```json
{
  "type": "send_command_to_device",
  "data": {
    "targetConnectionType": "acionamento",
    "command": {
      "action": "launch",
      "parameters": {"angle": 45, "pressure": 30, "weight": 0.5}
    },
    "requestId": "launch-1234567890"
  }
}
```

2. Server forwards to ESP32 acionamento:
```json
{
  "type": "launch_command", 
  "data": {
    "action": "launch",
    "parameters": {"angle": 45, "pressure": 30, "weight": 0.5}
  }
}
```

3. ESP32 telemetria sends flight data:
```json
{
  "type": "telemetry_data",
  "data": {
    "timestamp": "2025-01-15T10:30:00Z",
    "altitude": [0, 5.2, 10.5],
    "acceleration": [0, 3.2, 2.1], 
    "velocity": [0, 3.2, 5.3],
    "status": "flying"
  }
}
```

4. Server broadcasts to websites:
```json
{
  "type": "esp_status",
  "data": {
    "type": "telemetry_update",
    "clientId": "abc123",
    "data": { /* telemetry data */ }
  }
}
```

## Error Handling

The server sends error messages in this format:
```json
{
  "type": "error",
  "data": {
    "error": "Error description",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

Common errors:
- `"Connection type is required"` - Missing connection_type message
- `"Invalid message format: missing type"` - Malformed message
- `"No target devices found"` - Command sent to disconnected device
- `"Invalid JSON format"` - Message parsing failed

## Device Management

The server maintains a list of connected devices with:
- `clientId`: Unique session identifier
- `connectionType`: Device type (acionamento/telemetria/website)
- `deviceId`: Optional custom device identifier
- `capabilities`: List of device capabilities
- `lastSeen`: Last activity timestamp
- `status`: connected/disconnected

Devices are automatically removed 30 seconds after disconnection to allow for reconnection attempts. 