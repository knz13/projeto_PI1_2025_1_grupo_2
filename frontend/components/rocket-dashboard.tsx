"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LaunchCharts from "@/components/launch-charts"
import PinkBoomLogo from "@/components/pink-boom-logo"
import { Environment } from "@/lib/environment"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  WSClient,
  WSMessageType,
  ConnectionType,
  ConnectedDevice,
  LaunchCommand
} from "@/lib"

export default function RocketDashboard() {
  const [activeTab, setActiveTab] = useState("rocket")
  const [launchData, setLaunchData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // WebSocket related state
  const [wsClient, setWsClient] = useState<WSClient | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([])
  const [telemetryData, setTelemetryData] = useState<any>(null)
  const [lastTelemetryMessage, setLastTelemetryMessage] = useState<{ timestamp: string, clientId: string, deviceId?: string } | null>(null)
  const [selectedDistance, setSelectedDistance] = useState(10); // NEW: launch type selector
  const [selectedPressure, setSelectedPressure] = useState(30); // NEW: pressure input
  const [showLiveGraph, setShowLiveGraph] = useState(false); // NEW: show live graph
  const [liveData, setLiveData] = useState<any[]>([]); // NEW: store live telemetry
  const [dataTab, setDataTab] = useState<'banco' | 'live'>('banco'); // NEW: tab for data


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
        setLastTelemetryMessage({
          timestamp: data.timestamp,
          clientId: data.clientId,
          deviceId: data.deviceId
        });
        // Store live data if live graph is active
        if (showLiveGraph) {
          setLiveData(prev => [...prev, data.data]);
        }
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
  }, [showLiveGraph]);

  // Send launch command
  const handleLaunchCommand = (action: 'prepare' | 'launch' | 'abort' | 'reset') => {
    if (!wsClient || !wsConnected) {
      console.error("WebSocket not connected");
      return;
    }

    if (action === 'launch') {
      setShowLiveGraph(true);
      setDataTab('live');
      setLiveData([]); // Reset live data
    }
    if (action === 'reset' || action === 'abort') {
      setShowLiveGraph(false);
      setDataTab('banco');
      setLiveData([]);
    }

    const command: LaunchCommand = {
      action,
      parameters: {
        angle: 45, // Default values, could be made configurable
        pressure: selectedPressure, // Use selected pressure
        distance: selectedDistance // NEW: include selected distance
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
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <PinkBoomLogo />
          <p className="text-gray-600 text-xs sm:text-sm mt-1 text-center px-2">Sistema de Análise de Lançamentos de Foguetes d'Água</p>
        </div>
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Carregando dados e conectando ao WebSocket...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col items-center mb-6 sm:mb-8">
        <PinkBoomLogo />
        <p className="text-gray-600 text-xs sm:text-sm mt-1 text-center px-2">Sistema de Análise de Lançamentos de Foguetes d'Água</p>
      </div>

      <Tabs defaultValue="rocket" className="w-full max-w-6xl mx-auto" onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start mb-4 sm:mb-6 bg-pink-50 border-pink-100 border">
          <TabsTrigger value="rocket" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-sm">
            Dados do Foguete
          </TabsTrigger>
        </TabsList>

        {/* NEW: Data tabs for banco/live */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={dataTab === 'banco' ? 'default' : 'outline'}
            onClick={() => setDataTab('banco')}
            className="text-xs"
          >
            Dados no Banco
          </Button>
          <Button
            variant={dataTab === 'live' ? 'default' : 'outline'}
            onClick={() => setDataTab('live')}
            className="text-xs"
            disabled={!showLiveGraph}
          >
            Dados Live
          </Button>
        </div>

        {/* Data tab content */}
        {dataTab === 'banco' && (
          <TabsContent value="rocket" className="space-y-4 sm:space-y-6">
            <Card className="max-w-6xl mx-auto">
              <CardHeader className="bg-pink-50">
                <CardTitle className="text-lg sm:text-xl text-pink-700">Análise de Lançamentos</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  {launchData.map((launch, index) => (
                    <Card key={index} className="border-pink-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base sm:text-lg">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span>Lançamento {index + 1}</span>
                            <span className="text-xs sm:text-sm font-normal text-gray-500">
                              {index === 0 ? "10 metros" : index === 1 ? "20 metros" : "30 metros"}
                            </span>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
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
        )}
        {dataTab === 'live' && showLiveGraph && (
          <TabsContent value="rocket" className="space-y-4 sm:space-y-6">
            <Card className="max-w-6xl mx-auto">
              <CardHeader className="bg-pink-50">
                <CardTitle className="text-lg sm:text-xl text-pink-700">Dados Live do Lançamento</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6">
                {/* Simple live graph for altitude over time using Recharts */}
                <div className="mb-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={liveData.map((d, i) => ({
                        sample: i,
                        altitude: d.position?.z ?? null,
                        velocity: d.velocity?.z ?? null
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="sample" 
                        label={{ value: 'Amostra', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        label={{ value: 'Valor', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="altitude" 
                        stroke="rgba(236, 72, 153, 1)" 
                        fill="rgba(236, 72, 153, 0.2)"
                        name="Altitude (m)"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="velocity" 
                        stroke="rgba(59, 130, 246, 1)" 
                        fill="rgba(59, 130, 246, 0.2)"
                        name="Velocidade (m/s)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Optionally add more live data visualizations here */}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* WebSocket and ESP32 Status Section */}
        <Card className="mb-4 sm:mb-6 border-pink-100">
          <CardHeader className="bg-pink-50 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <CardTitle className="text-base sm:text-lg text-pink-700">Status da Conexão</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={wsConnected ? "default" : "destructive"} className={`text-xs ${wsConnected ? "bg-green-500" : "bg-red-500"}`}>
                  {wsConnected ? "Conectado" : "Desconectado"}
                </Badge>
                <Button
                  onClick={() => wsClient?.getConnectedDevices()}
                  disabled={!wsConnected}
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2"
                >
                  🔄
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <Card className="border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span>🚀 ESP32 Acionamento</span>
                    <Badge variant={connectedDevices.some(d => d.connectionType === ConnectionType.acionamento) ? "default" : "secondary"} className="text-xs w-fit">
                      {connectedDevices.filter(d => d.connectionType === ConnectionType.acionamento).length} conectado(s)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  {connectedDevices.filter(d => d.connectionType === ConnectionType.acionamento).length > 0 ? (
                    connectedDevices
                      .filter(d => d.connectionType === ConnectionType.acionamento)
                      .map(device => (
                        <div key={device.clientId} className="text-xs text-gray-600 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span>ID: {device.deviceId || device.clientId.substring(0, 8)}</span>
                          <Badge variant="outline" className="text-xs w-fit">
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
                  <CardTitle className="text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span>📡 ESP32 Telemetria</span>
                    <Badge variant={connectedDevices.some(d => d.connectionType === ConnectionType.telemetria) ? "default" : "secondary"} className="text-xs w-fit">
                      {connectedDevices.filter(d => d.connectionType === ConnectionType.telemetria).length} conectado(s)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  {connectedDevices.filter(d => d.connectionType === ConnectionType.telemetria).length > 0 ? (
                    connectedDevices
                      .filter(d => d.connectionType === ConnectionType.telemetria)
                      .map(device => (
                        <div key={device.clientId} className="text-xs text-gray-600 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span>ID: {device.deviceId || device.clientId.substring(0, 8)}</span>
                          <Badge variant="outline" className="text-xs w-fit">
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
                  <CardTitle className="text-sm text-yellow-700 flex items-center gap-2">
                    📊 Telemetria em Tempo Real
                    <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                      GPS + IMU
                    </Badge>
                    {telemetryData.gpsAvailable && (
                      <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                        GPS Fix ✓
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col">
                      <span className="text-gray-500">Aceleração X:</span>
                      <span className="font-medium">
                        {telemetryData.imu?.accel?.x ? telemetryData.imu.accel.x.toFixed(2) : 'N/A'} m/s²
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Aceleração Y:</span>
                      <span className="font-medium">
                        {telemetryData.imu?.accel?.y ? telemetryData.imu.accel.y.toFixed(2) : 'N/A'} m/s²
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Aceleração Z:</span>
                      <span className="font-medium">
                        {telemetryData.imu?.accel?.z ? telemetryData.imu.accel.z.toFixed(2) : 'N/A'} m/s²
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Magnitude Accel:</span>
                      <span className="font-medium">
                        {telemetryData.imu?.accel ?
                          Math.sqrt(
                            Math.pow(telemetryData.imu.accel.x, 2) +
                            Math.pow(telemetryData.imu.accel.y, 2) +
                            Math.pow(telemetryData.imu.accel.z, 2)
                          ).toFixed(2) : 'N/A'} m/s²
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Velocidade X:</span>
                      <span className="font-medium">
                        {telemetryData.velocity?.x ? telemetryData.velocity.x.toFixed(2) : 'N/A'} m/s
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Velocidade Y:</span>
                      <span className="font-medium">
                        {telemetryData.velocity?.y ? telemetryData.velocity.y.toFixed(2) : 'N/A'} m/s
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Velocidade Z:</span>
                      <span className="font-medium">
                        {telemetryData.velocity?.z ? telemetryData.velocity.z.toFixed(2) : 'N/A'} m/s
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Magnitude Vel:</span>
                      <span className="font-medium">
                        {telemetryData.velocity ?
                          Math.sqrt(
                            Math.pow(telemetryData.velocity.x, 2) +
                            Math.pow(telemetryData.velocity.y, 2) +
                            Math.pow(telemetryData.velocity.z, 2)
                          ).toFixed(2) : 'N/A'} m/s
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Posição X:</span>
                      <span className="font-medium">
                        {telemetryData.position?.x ? telemetryData.position.x.toFixed(2) : 'N/A'} m
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Posição Y:</span>
                      <span className="font-medium">
                        {telemetryData.position?.y ? telemetryData.position.y.toFixed(2) : 'N/A'} m
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Posição Z:</span>
                      <span className="font-medium">
                        {telemetryData.position?.z ? telemetryData.position.z.toFixed(2) : 'N/A'} m
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Altitude:</span>
                      <span className="font-medium">
                        {telemetryData.position?.z ? telemetryData.position.z.toFixed(2) : 'N/A'} m
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Gyro X:</span>
                      <span className="font-medium">
                        {telemetryData.imu?.gyro?.x ? telemetryData.imu.gyro.x.toFixed(3) : 'N/A'} rad/s
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Gyro Y:</span>
                      <span className="font-medium">
                        {telemetryData.imu?.gyro?.y ? telemetryData.imu.gyro.y.toFixed(3) : 'N/A'} rad/s
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Gyro Z:</span>
                      <span className="font-medium">
                        {telemetryData.imu?.gyro?.z ? telemetryData.imu.gyro.z.toFixed(3) : 'N/A'} rad/s
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Timestamp:</span>
                      <span className="font-medium">
                        {telemetryData.timestamp ? `${telemetryData.timestamp}ms` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Status:</span>
                      <span className={`font-medium ${telemetryData.isStationary ? 'text-blue-600' : 'text-green-600'}`}>
                        {telemetryData.isStationary ? '🛑 Parado' : '🚀 Em movimento'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">GPS Status:</span>
                      <span className={`font-medium ${telemetryData.gpsAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {telemetryData.gpsAvailable ?
                          `✓ ${telemetryData.fusion?.gpsQuality || 0} sats` :
                          '✗ Sem fix'}
                      </span>
                    </div>
                  </div>

                  {/* GPS Data Section */}
                  {telemetryData.gps && (
                    <div className="mt-3 pt-2 border-t border-yellow-200">
                      <div className="text-xs text-gray-600 mb-2">
                        <span className="font-medium">🛰️ Dados GPS:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex flex-col">
                          <span className="text-gray-500">Latitude:</span>
                          <span className="font-medium">{telemetryData.gps.lat.toFixed(6)}°</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500">Longitude:</span>
                          <span className="font-medium">{telemetryData.gps.lon.toFixed(6)}°</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500">Altitude GPS:</span>
                          <span className="font-medium">{telemetryData.gps.alt.toFixed(1)} m</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500">Satélites:</span>
                          <span className="font-medium">{telemetryData.gps.sats}</span>
                        </div>
                        {telemetryData.gpsPosition && (
                          <>
                            <div className="flex flex-col">
                              <span className="text-gray-500">GPS Local X:</span>
                              <span className="font-medium">{telemetryData.gpsPosition.x.toFixed(2)} m</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500">GPS Local Y:</span>
                              <span className="font-medium">{telemetryData.gpsPosition.y.toFixed(2)} m</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fusion Information */}
                  {telemetryData.fusion && (
                    <div className="mt-3 pt-2 border-t border-yellow-200">
                      <div className="text-xs text-gray-600 mb-2">
                        <span className="font-medium">🔗 Fusão de Sensores:</span>
                        <span className={`ml-2 ${telemetryData.fusion.enabled ? 'text-green-600' : 'text-red-600'}`}>
                          {telemetryData.fusion.enabled ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex flex-col">
                          <span className="text-gray-500">Confiança IMU:</span>
                          <span className="font-medium">{(telemetryData.fusion.confidence.imu * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500">Confiança GPS:</span>
                          <span className="font-medium">{(telemetryData.fusion.confidence.gps * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quaternion details in a separate section */}
                  {telemetryData.orientation && (
                    <div className="mt-3 pt-2 border-t border-yellow-200">
                      <div className="text-xs text-gray-600 mb-2">
                        <span className="font-medium">🧭 Orientação (Quaternion):</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="flex flex-col">
                          <span className="text-gray-500">W:</span>
                          <span className="font-medium">{telemetryData.orientation.w.toFixed(3)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500">X:</span>
                          <span className="font-medium">{telemetryData.orientation.x.toFixed(3)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500">Y:</span>
                          <span className="font-medium">{telemetryData.orientation.y.toFixed(3)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500">Z:</span>
                          <span className="font-medium">{telemetryData.orientation.z.toFixed(3)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {lastTelemetryMessage && (
                    <div className="mt-3 pt-2 border-t border-yellow-200">
                      <div className="text-xs text-gray-600 mb-2">
                        <span className="font-medium">Última mensagem recebida:</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>📅 {new Date(lastTelemetryMessage.timestamp).toLocaleString('pt-BR')}</div>
                        <div>🔗 Cliente: {lastTelemetryMessage.clientId.substring(0, 8)}...</div>
                        {lastTelemetryMessage.deviceId && (
                          <div>📱 Dispositivo: {lastTelemetryMessage.deviceId}</div>
                        )}
                      </div>
                      {telemetryData.timestamp && (
                        <div className="text-xs text-gray-500 mt-1">
                          ⏱️ Timestamp dos dados: {telemetryData.timestamp}ms
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Launch Control Section */}
        <Card className="mb-4 sm:mb-6 border-pink-100">
          <CardHeader className="bg-pink-50 py-3">
            <CardTitle className="text-base sm:text-lg text-pink-700">Controle de Lançamento</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                Distância:
                <select
                  value={selectedDistance}
                  onChange={e => setSelectedDistance(Number(e.target.value))}
                  className="border rounded px-2 py-1 text-sm focus:outline-pink-500"
                >
                  <option value={10}>10 metros</option>
                  <option value={20}>20 metros</option>
                  <option value={30}>30 metros</option>
                </select>
              </label>
              {/* NEW: Pressure input */}
              <label className="flex items-center gap-2 text-sm font-medium">
                Pressão (psi):
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={selectedPressure}
                  onChange={e => setSelectedPressure(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-20 text-sm focus:outline-pink-500"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:justify-center gap-2 sm:gap-4">
              <Button
                onClick={() => handleLaunchCommand('launch')}
                disabled={!wsConnected || connectedDevices.filter(d => d.connectionType === ConnectionType.acionamento).length === 0}
                className="bg-pink-500 hover:bg-pink-700 text-white font-semibold text-sm h-10 sm:h-auto"
              >
                🚀 Lançar!
              </Button>
              <Button
                onClick={() => handleLaunchCommand('abort')}
                disabled={!wsConnected || connectedDevices.filter(d => d.connectionType === ConnectionType.acionamento).length === 0}
                variant="destructive"
                className="text-sm h-10 sm:h-auto"
              >
                Abortar
              </Button>
              <Button
                onClick={() => handleLaunchCommand('reset')}
                disabled={!wsConnected || connectedDevices.filter(d => d.connectionType === ConnectionType.acionamento).length === 0}
                variant="secondary"
                className="text-sm h-10 sm:h-auto"
              >
                Reset Acionamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
