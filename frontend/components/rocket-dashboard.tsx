"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LaunchCharts from "@/components/launch-charts"
import PinkBoomLogo from "@/components/pink-boom-logo"
import { Environment } from "@/lib/environment"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  WSClient,
  WSMessageType,
  ConnectionType,
  ConnectedDevice,
  LaunchCommand
} from "@/lib/websocket-types"

export default function RocketDashboard() {
  const [activeTab, setActiveTab] = useState("rocket")
  const [launchData, setLaunchData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // WebSocket related state
  const [wsClient, setWsClient] = useState<WSClient | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([])
  const [telemetryData, setTelemetryData] = useState<any>(null)


  // Fetch launch data
  useEffect(() => {
    console.log("Fetching launch data...");
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await fetch(`${Environment.get_backend_url()}/dados/dados-lancamento`);
        if (result.status === 200) {
          const resultJson = await result.json();
          console.log("Launch data:", resultJson);
          setLaunchData(resultJson);
        }
      } catch (error) {
        console.error("Error fetching launch data:", error);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // WebSocket connection setup and cleanup
  useEffect(() => {
    console.log("Setting up WebSocket connection...");

    // Create WebSocket URL
    const wsUrl = Environment.get_websocket_url();

    const client = new WSClient(wsUrl, ConnectionType.website);
    setWsClient(client);

    // Set up message handlers
    client.onMessage(WSMessageType.welcome, (data) => {
      console.log("WebSocket welcome:", data);
      setWsConnected(true);
      // Request list of connected devices
      client.getConnectedDevices();
    });

    client.onMessage(WSMessageType.device_list_response, (data) => {
      console.log("Connected devices:", data.devices);
      setConnectedDevices(data.devices || []);
    });

    client.onMessage(WSMessageType.esp_status, (data) => {
      console.log("ESP status update:", data);
      if (data.type === 'device_connected' || data.type === 'device_disconnected') {
        // Refresh device list
        client.getConnectedDevices();
      } else if (data.type === 'telemetry_update') {
        setTelemetryData(data.data);
      }
    });

    client.onMessage(WSMessageType.command_response, (data) => {
      console.log("Command response:", data);
    });

    client.onMessage(WSMessageType.error, (data) => {
      console.error("WebSocket error:", data);
    });

    // Connect to WebSocket
    client.connect().catch(error => {
      console.error("Failed to connect to WebSocket:", error);
      setWsConnected(false);
    });

    // Cleanup function
    return () => {
      console.log("Cleaning up WebSocket connection...");
      client.disconnect();
      setWsClient(null);
      setWsConnected(false);
      setConnectedDevices([]);
    };
  }, []);

  // Send launch command
  const handleLaunchCommand = (action: 'prepare' | 'launch' | 'abort' | 'reset') => {
    if (!wsClient || !wsConnected) {
      console.error("WebSocket not connected");
      return;
    }

    const command: LaunchCommand = {
      action,
      parameters: {
        angle: 45, // Default values, could be made configurable
        pressure: 30,
        weight: 0.5
      }
    };

    // Send command to acionamento ESP32s
    const success = wsClient.sendMessage(WSMessageType.send_command_to_device, {
      targetConnectionType: ConnectionType.acionamento,
      command,
      requestId: `launch-${Date.now()}`
    });

    if (!success) {
      console.error("Failed to send command");
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <PinkBoomLogo />
          <p className="text-gray-600 text-sm mt-1">Sistema de Análise de Lançamentos de Foguetes d'Água</p>
        </div>
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados e conectando ao WebSocket...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center mb-8">
        <PinkBoomLogo />
        <p className="text-gray-600 text-sm mt-1">Sistema de Análise de Lançamentos de Foguetes d'Água</p>
      </div>

      <Tabs defaultValue="rocket" className="w-full max-w-6xl mx-auto" onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start mb-6 bg-pink-50 border-pink-100 border">
          <TabsTrigger value="rocket" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
            Dados do Foguete
          </TabsTrigger>
        </TabsList>

        {/* WebSocket and ESP32 Status Section */}
        <Card className="mb-6 border-pink-100">
          <CardHeader className="bg-pink-50 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-pink-700">Status da Conexão</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={wsConnected ? "default" : "destructive"} className={wsConnected ? "bg-green-500" : "bg-red-500"}>
                  WebSocket: {wsConnected ? "Conectado" : "Desconectado"}
                </Badge>
                <Button
                  onClick={() => wsClient?.getConnectedDevices()}
                  disabled={!wsConnected}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  🔄 Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    🚀 ESP32 Acionamento
                    <Badge variant={connectedDevices.some(d => d.connectionType === ConnectionType.acionamento) ? "default" : "secondary"}>
                      {connectedDevices.filter(d => d.connectionType === ConnectionType.acionamento).length} conectado(s)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  {connectedDevices.filter(d => d.connectionType === ConnectionType.acionamento).length > 0 ? (
                    connectedDevices
                      .filter(d => d.connectionType === ConnectionType.acionamento)
                      .map(device => (
                        <div key={device.clientId} className="text-xs text-gray-600">
                          ID: {device.deviceId || device.clientId.substring(0, 8)}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {device.status}
                          </Badge>
                        </div>
                      ))
                  ) : (
                    <p className="text-xs text-gray-500">Nenhum dispositivo conectado</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-green-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    📡 ESP32 Telemetria
                    <Badge variant={connectedDevices.some(d => d.connectionType === ConnectionType.telemetria) ? "default" : "secondary"}>
                      {connectedDevices.filter(d => d.connectionType === ConnectionType.telemetria).length} conectado(s)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  {connectedDevices.filter(d => d.connectionType === ConnectionType.telemetria).length > 0 ? (
                    connectedDevices
                      .filter(d => d.connectionType === ConnectionType.telemetria)
                      .map(device => (
                        <div key={device.clientId} className="text-xs text-gray-600">
                          ID: {device.deviceId || device.clientId.substring(0, 8)}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {device.status}
                          </Badge>
                        </div>
                      ))
                  ) : (
                    <p className="text-xs text-gray-500">Nenhum dispositivo conectado</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {telemetryData && (
              <Card className="mt-4 border-yellow-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-yellow-700">📊 Telemetria em Tempo Real</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Altitude:</span>
                      <span className="font-medium ml-1">
                        {telemetryData.altitude ? telemetryData.altitude[telemetryData.altitude.length - 1]?.toFixed(2) : 'N/A'} m
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Velocidade:</span>
                      <span className="font-medium ml-1">
                        {telemetryData.velocity ? telemetryData.velocity[telemetryData.velocity.length - 1]?.toFixed(2) : 'N/A'} m/s
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Aceleração:</span>
                      <span className="font-medium ml-1">
                        {telemetryData.acceleration ? telemetryData.acceleration[telemetryData.acceleration.length - 1]?.toFixed(2) : 'N/A'} m/s²
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="font-medium ml-1">{telemetryData.status || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Launch Control Section */}
        <Card className="mb-6 border-pink-100">
          <CardHeader className="bg-pink-50 py-3">
            <CardTitle className="text-lg text-pink-700">Controle de Lançamento</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => handleLaunchCommand('prepare')}
                disabled={!wsConnected || connectedDevices.filter(d => d.connectionType === ConnectionType.acionamento).length === 0}
                className="bg-blue-500 hover:bg-blue-700 text-white"
              >
                Preparar
              </Button>
              <Button
                onClick={() => handleLaunchCommand('launch')}
                disabled={!wsConnected || connectedDevices.filter(d => d.connectionType === ConnectionType.acionamento).length === 0}
                className="bg-pink-500 hover:bg-pink-700 text-white font-semibold"
              >
                🚀 Lançar!
              </Button>
              <Button
                onClick={() => handleLaunchCommand('abort')}
                disabled={!wsConnected || connectedDevices.filter(d => d.connectionType === ConnectionType.acionamento).length === 0}
                variant="destructive"
              >
                Abortar
              </Button>
              <Button
                onClick={() => handleLaunchCommand('reset')}
                disabled={!wsConnected || connectedDevices.filter(d => d.connectionType === ConnectionType.acionamento).length === 0}
                variant="outline"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="rocket" className="space-y-6">
          <Card className="max-w-6xl mx-auto">
            <CardHeader className="bg-pink-50">
              <CardTitle className="text-xl text-pink-700">Análise de Lançamentos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {launchData.map((launch, index) => (
                  <Card key={index} className="border-pink-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Lançamento {index + 1}
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          {index === 0 ? "10 metros" : index === 1 ? "20 metros" : "30 metros"}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Data:</span>
                          <span className="font-medium">{new Date(launch.data[0].timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Altitude Máx:</span>
                          <span className="font-medium">
                            {Math.max(...launch.data.map((d: any) => d.altitude)).toFixed(1)} m
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Posição Máx:</span>
                          <span className="font-medium">
                            {Math.max(...launch.data.map((d: any) => d.position)).toFixed(1)} m
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Velocidade Máx:</span>
                          <span className="font-medium">
                            {Math.max(...launch.data.map((d: any) => d.velocity)).toFixed(1)} m/s
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Aceleração Máx:</span>
                          <span className="font-medium">
                            {Math.max(...launch.data.map((d: any) => d.acceleration)).toFixed(1)} m/s²
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <LaunchCharts />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
