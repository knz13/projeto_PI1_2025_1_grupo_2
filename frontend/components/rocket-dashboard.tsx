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

  // Launch parameters
  const [peso, setPeso] = useState(0.5) // Weight in kg
  const [pressure, setPressure] = useState(30) // Pressure in psi
  const [angle, setAngle] = useState(45) // Launch angle in degrees

  // NEW: Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordedData, setRecordedData] = useState<any[]>([])
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null)

  // Constants for recording logic
  const GRAVITY = 9.81 // m/s²
  const GRAVITY_TOLERANCE = 2.0 // ±2.0 m/s² tolerance
  const MIN_RECORDING_TIME = 10000 // Minimum 5 seconds of recording
  const LANDING_DETECTION_SAMPLES = 5 // Need 5 consecutive samples near gravity to confirm landing

  // Counter for consecutive gravity samples
  const [consecutiveGravitySamples, setConsecutiveGravitySamples] = useState(0)

  // Track last processed telemetry to prevent duplicate processing
  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState<number | null>(null)

  // Database sending state
  const [isSendingToDatabase, setIsSendingToDatabase] = useState(false)
  const [lastDatabaseResult, setLastDatabaseResult] = useState<{
    success: boolean
    message: string
    timestamp: Date
  } | null>(null)

  // Recording logic effect - monitor telemetry data for recording start/stop
  useEffect(() => {
    if (!telemetryData || !telemetryData.imu?.accel) return

    const currentTime = Date.now()

    // Prevent processing the same telemetry data multiple times
    const telemetryTimestamp = telemetryData.timestamp || currentTime
    if (lastProcessedTimestamp === telemetryTimestamp) {
      return
    }

    // Calculate acceleration magnitude
    const accelMagnitude = Math.sqrt(
      Math.pow(telemetryData.imu.accel.x, 2) +
      Math.pow(telemetryData.imu.accel.y, 2) +
      Math.pow(telemetryData.imu.accel.z, 2)
    )

    // If recording, add data to recorded dataset
    if (isRecording) {
      setLastProcessedTimestamp(telemetryTimestamp)

      const dataPoint = {
        timestamp: currentTime,
        relativeTime: recordingStartTime ? currentTime - recordingStartTime : 0,
        telemetry: { ...telemetryData },
        accelMagnitude
      }

      setRecordedData(prev => [...prev, dataPoint])

      // Check if we should stop recording (landed)
      const isNearGravity = Math.abs(accelMagnitude - GRAVITY) <= GRAVITY_TOLERANCE
      const recordingDuration = recordingStartTime ? currentTime - recordingStartTime : 0

      if (isNearGravity && recordingDuration > MIN_RECORDING_TIME) {
        setConsecutiveGravitySamples(prev => prev + 1)
      } else {
        setConsecutiveGravitySamples(0)
      }

      // Stop recording if we have enough consecutive gravity samples
      if (consecutiveGravitySamples >= LANDING_DETECTION_SAMPLES) {
        console.log("Landing detected! Stopping recording.")
        console.log("Recorded", recordedData.length + 1, "data points")

        // Include the current data point in the final dataset
        const finalData = [...recordedData, dataPoint]

        setIsRecording(false)
        setConsecutiveGravitySamples(0)

        // Send data to database
        console.log("🚀 Sending flight data to database...")
        sendDataToDatabase(finalData)
      }
    }
  }, [telemetryData, isRecording, recordingStartTime, consecutiveGravitySamples])

  // Function to start recording
  const startRecording = () => {
    console.log("Starting telemetry recording...")
    setIsRecording(true)
    setRecordedData([])
    setRecordingStartTime(Date.now())
    setConsecutiveGravitySamples(0)
    setLastProcessedTimestamp(null)
  }

  // Function to stop recording manually
  const stopRecording = () => {
    console.log("Manually stopping telemetry recording...")
    console.log("Recorded", recordedData.length, "data points")
    setIsRecording(false)
    setConsecutiveGravitySamples(0)
    setLastDatabaseResult(null)
    setLastProcessedTimestamp(null)
  }

  // Function to clear recorded data
  const clearRecordedData = () => {
    console.log("Clearing recorded data...")
    setRecordedData([])
    setRecordingStartTime(null)
    setConsecutiveGravitySamples(0)
    setLastDatabaseResult(null)
    setLastProcessedTimestamp(null)
  }

  // Function to send recorded data to database
  const sendDataToDatabase = async (data: any[]) => {
    if (data.length === 0) {
      console.warn("No data to send to database")
      return
    }

    setIsSendingToDatabase(true)
    setLastDatabaseResult(null)

    try {
      console.log("Preparing to send", data.length, "data points to database...")

      // Extract arrays from recorded data
      const altura = data.map(point => point.telemetry.position?.z || 0)
      const aceleracao = data.map(point => point.accelMagnitude || 0)
      const velocidade = data.map(point => {
        const vel = point.telemetry.velocity
        if (vel) {
          return Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
        }
        return 0
      })
      const tempo = data.map(point => point.relativeTime / 1000) // Convert milliseconds to seconds
      const posicao = data.map(point => {
        const pos = point.telemetry.position
        if (pos) {
          return Math.sqrt(pos.x * pos.x + pos.y * pos.y) // Horizontal distance from origin
        }
        return 0
      })

      // Get launch parameters (use current selected distance and default values)
      const payload = {
        angulo_lancamento: angle, // Use state value
        peso: peso, // Use state value
        pressao: pressure, // Use state value
        altura: altura,
        aceleracao: aceleracao,
        velocidade: velocidade,
        tempo: tempo,
        posicao: posicao,
        tipo: `${selectedDistance}m` // Use selected distance as type
      }

      console.log("Sending payload to database:", {
        ...payload,
        altura: `${altura.length} points`,
        aceleracao: `${aceleracao.length} points`,
        velocidade: `${velocidade.length} points`,
        tempo: `${tempo.length} points`,
        posicao: `${posicao.length} points`
      })

      const response = await fetch(`${Environment.get_backend_url()}/dados/send-dados-lancamento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Data successfully sent to database:", result)
        setLastDatabaseResult({
          success: true,
          message: `Dados salvos com sucesso! ID: ${result.id}`,
          timestamp: new Date()
        })
      } else {
        const error = await response.json()
        console.error("❌ Failed to send data to database:", error)
        setLastDatabaseResult({
          success: false,
          message: `Erro ao salvar: ${error.error || 'Erro desconhecido'}`,
          timestamp: new Date()
        })
      }

    } catch (error) {
      console.error("❌ Error sending data to database:", error)
      setLastDatabaseResult({
        success: false,
        message: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        timestamp: new Date()
      })
    } finally {
      setIsSendingToDatabase(false)
    }
  }


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
        angle: angle, // Use state value
        pressure: pressure,
        weight: peso,
        distance: selectedDistance // NEW: include selected distance
      }
    };

    // Start recording when launching
    if (action === 'launch') {
      startRecording()
    }

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <CardTitle className="text-base sm:text-lg text-pink-700">Controle de Lançamento</CardTitle>
              {isRecording && (
                <Badge variant="default" className="bg-red-500 text-white animate-pulse text-xs w-fit">
                  🔴 GRAVANDO
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Recording Status */}
            {(isRecording || recordedData.length > 0) && (
              <Card className="mb-4 border-red-100">
                <CardContent className="pt-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col">
                      <span className="text-gray-500">Status:</span>
                      <span className={`font-medium ${isRecording ? 'text-red-600' : 'text-green-600'}`}>
                        {isRecording ? '🔴 Gravando...' : '✅ Gravação finalizada'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Dados coletados:</span>
                      <span className="font-medium">{recordedData.length} pontos</span>
                    </div>
                    {recordingStartTime && (
                      <div className="flex flex-col">
                        <span className="text-gray-500">Tempo de gravação:</span>
                        <span className="font-medium">
                          {isRecording
                            ? `${((Date.now() - recordingStartTime) / 1000).toFixed(1)}s`
                            : recordedData.length > 0
                              ? `${((recordedData[recordedData.length - 1].relativeTime) / 1000).toFixed(1)}s`
                              : '0s'
                          }
                        </span>
                      </div>
                    )}
                    {telemetryData?.imu?.accel && (
                      <div className="flex flex-col">
                        <span className="text-gray-500">Aceleração atual:</span>
                        <span className="font-medium">
                          {Math.sqrt(
                            Math.pow(telemetryData.imu.accel.x, 2) +
                            Math.pow(telemetryData.imu.accel.y, 2) +
                            Math.pow(telemetryData.imu.accel.z, 2)
                          ).toFixed(2)} m/s²
                        </span>
                      </div>
                    )}
                    {(isRecording || recordedData.length > 0) && (
                      <>
                        <div className="flex flex-col">
                          <span className="text-gray-500">Distância:</span>
                          <span className="font-medium">{selectedDistance}m</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500">Peso:</span>
                          <span className="font-medium">{peso}kg</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500">Pressão:</span>
                          <span className="font-medium">{pressure} bar</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500">Ângulo:</span>
                          <span className="font-medium">{angle}°</span>
                        </div>
                      </>
                    )}
                  </div>
                  {isRecording && consecutiveGravitySamples > 0 && (
                    <div className="mt-2 text-xs text-orange-600">
                      ⚠️ Detectando possível pouso ({consecutiveGravitySamples}/{LANDING_DETECTION_SAMPLES} amostras)
                    </div>
                  )}

                  {/* Database status */}
                  {(isSendingToDatabase || lastDatabaseResult) && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      {isSendingToDatabase && (
                        <div className="text-xs text-blue-600 flex items-center gap-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                          📤 Enviando dados para o banco...
                        </div>
                      )}
                      {lastDatabaseResult && !isSendingToDatabase && (
                        <div className={`text-xs flex items-center gap-1 ${lastDatabaseResult.success ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {lastDatabaseResult.success ? '✅' : '❌'} {lastDatabaseResult.message}
                          <span className="text-gray-400 ml-1">
                            ({lastDatabaseResult.timestamp.toLocaleTimeString('pt-BR')})
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recording control buttons */}
                  <div className="flex gap-2 mt-3">
                    {isRecording && (
                      <Button
                        onClick={stopRecording}
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                      >
                        ⏹️ Parar Gravação
                      </Button>
                    )}
                    {recordedData.length > 0 && !isRecording && (
                      <Button
                        onClick={clearRecordedData}
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2 bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      >
                        🗑️ Limpar Dados
                      </Button>
                    )}
                    {recordedData.length > 0 && !isRecording && (
                      <Button
                        onClick={() => sendDataToDatabase(recordedData)}
                        disabled={isSendingToDatabase}
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                      >
                        {isSendingToDatabase ? '⏳' : '📤'} Enviar ao Banco
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

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

              <label className="flex items-center gap-2 text-sm font-medium">
                Peso:
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={peso}
                  onChange={e => setPeso(Number(e.target.value))}
                  className="border rounded px-2 py-1 text-sm focus:outline-pink-500 w-20"
                />
                <span className="text-xs text-gray-500">kg</span>
              </label>

              <label className="flex items-center gap-2 text-sm font-medium">
                Pressão:
                <input
                  type="number"
                  step="1"
                  min="10"
                  max="50"
                  value={pressure}
                  onChange={e => setPressure(Number(e.target.value))}
                  className="border rounded px-2 py-1 text-sm focus:outline-pink-500 w-20"
                />
                <span className="text-xs text-gray-500">bar</span>
              </label>

              <label className="flex items-center gap-2 text-sm font-medium">
                Ângulo:
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="90"
                  value={angle}
                  onChange={e => setAngle(Number(e.target.value))}
                  className="border rounded px-2 py-1 text-sm focus:outline-pink-500 w-20"
                />
                <span className="text-xs text-gray-500">°</span>
              </label>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:justify-center gap-2 sm:gap-4">
              <Button
                onClick={() => handleLaunchCommand('prepare')}
                disabled={!wsConnected || connectedDevices.filter(d => d.connectionType === ConnectionType.acionamento).length === 0}
                className="bg-blue-500 hover:bg-blue-700 text-white text-sm h-10 sm:h-auto"
              >
                Preparar
              </Button>
              <Button
                onClick={() => handleLaunchCommand('launch')}
                disabled={!wsConnected || connectedDevices.filter(d => d.connectionType === ConnectionType.acionamento).length === 0 || isRecording}
                className="bg-pink-500 hover:bg-pink-700 text-white font-semibold text-sm h-10 sm:h-auto"
              >
                {isRecording ? '🔴 Gravando...' : '🚀 Lançar!'}
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
                variant="outline"
                className="text-sm h-10 sm:h-auto"
              >
                Reset
              </Button>
            </div>
            {/* NEW: Reset Acionamento Button */}
            <div className="flex justify-center mt-4">
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

        <TabsContent value="rocket" className="space-y-4 sm:space-y-6">
          <Card className="max-w-6xl mx-auto">
            <CardHeader className="bg-pink-50">
              <CardTitle className="text-lg sm:text-xl text-pink-700">Análise de Lançamentos</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6">
              <LaunchCharts launchData={launchData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
