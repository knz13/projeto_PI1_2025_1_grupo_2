"use client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label, ScatterChart, Scatter } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Colors for each launch
const COLORS = ["#ff4d94", "#d6409f", "#9c27b0"]

interface LaunchChartsProps {
  launchData: any[]
}

export default function LaunchCharts({ launchData }: LaunchChartsProps) {
  // Handle empty data case
  if (!launchData || launchData.length === 0) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-gray-500">
              📊 Gráficos de Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum dado de lançamento disponível</p>
              <p className="text-sm text-gray-400 mt-2">Os gráficos aparecerão quando dados de lançamento forem salvos no banco de dados</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Prepare time-based data for all launches
  const timeBasedData = launchData.flatMap((launch, index) => {
    return launch.data.map((point: any, pointIndex: number) => ({
      ...point,
      time: pointIndex * 0.1, // Convert to seconds (assuming 100ms intervals)
      launchName: point.tipo || launch.nome || `Launch ${index + 1}`,
      launchIndex: index,
    }))
  })

  // Calculate performance metrics for summary cards
  const performanceMetrics = launchData.map((launch, index) => {
    const data = launch.data
    if (!data || data.length === 0) return null

    // Get actual parameters from the first data point (they're the same for all points in a launch)
    const firstPoint = data[0]
    const launchType = firstPoint?.tipo || launch.nome || `Launch ${index + 1}`
    const peso = firstPoint?.peso || 'N/A'
    const pressao = firstPoint?.pressao || 'N/A'
    const angulo = firstPoint?.angulo_lancamento || 'N/A'

    const maxAltitude = Math.max(...data.map((p: any) => p.altitude || 0))
    const maxVelocity = Math.max(...data.map((p: any) => p.velocity || 0))
    const maxAcceleration = Math.max(...data.map((p: any) => p.acceleration || 0))
    const flightTime = data.length * 0.1 // in seconds
    const avgVelocity = data.reduce((sum: number, p: any) => sum + (p.velocity || 0), 0) / data.length

    return {
      launch: launchType,
      peso: peso,
      pressao: pressao,
      angulo: angulo,
      maxAltitude: maxAltitude.toFixed(1),
      maxVelocity: maxVelocity.toFixed(1),
      maxAcceleration: maxAcceleration.toFixed(1),
      flightTime: flightTime.toFixed(1),
      avgVelocity: avgVelocity.toFixed(1),
      color: COLORS[index]
    }
  }).filter(Boolean)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {performanceMetrics.map((metrics, index) => (
          <Card key={index} className="border-l-4" style={{ borderLeftColor: metrics?.color }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                🚀 {metrics?.launch}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1 text-xs">
                {/* Launch Parameters */}
                <div className="bg-gray-50 p-2 rounded mb-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Parâmetros de Lançamento</div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="flex justify-between">
                      <span>Peso:</span>
                      <span className="font-medium">{metrics?.peso}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pressão:</span>
                      <span className="font-medium">{metrics?.pressao}psi</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ângulo:</span>
                      <span className="font-medium">{metrics?.angulo}°</span>
                    </div>
                  </div>
                </div>

                {/* Performance Results */}
                <div className="text-xs font-semibold text-gray-600 mb-1">Resultados de Performance</div>
                <div className="flex justify-between">
                  <span>Altitude Máx:</span>
                  <span className="font-bold text-pink-600">{metrics?.maxAltitude}m</span>
                </div>
                <div className="flex justify-between">
                  <span>Velocidade Máx:</span>
                  <span className="font-bold text-blue-600">{metrics?.maxVelocity}m/s</span>
                </div>
                <div className="flex justify-between">
                  <span>Aceleração Máx:</span>
                  <span className="font-bold text-green-600">{metrics?.maxAcceleration}m/s²</span>
                </div>
                <div className="flex justify-between">
                  <span>Tempo de Voo:</span>
                  <span className="font-bold text-purple-600">{metrics?.flightTime}s</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Altitude over Time */}
      <Card>
        <CardHeader className="bg-pink-50">
          <CardTitle className="text-lg text-pink-700">📈 Altitude ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={[0, 'dataMax']}
                  tickFormatter={(value) => `${value.toFixed(1)}s`}
                >
                  <Label value="Tempo (segundos)" offset={-10} position="insideBottom" />
                </XAxis>
                <YAxis domain={[0, 'dataMax']}>
                  <Label value="Altitude (metros)" angle={-90} position="insideLeft" style={{ textAnchor: "middle" }} />
                </YAxis>
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${Number.parseFloat(value).toFixed(2)}m`,
                    "Altitude"
                  ]}
                  labelFormatter={(label) => `Tempo: ${Number.parseFloat(label).toFixed(2)}s`}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-semibold">{`${data.tipo || 'Launch'}`}</p>
                          <p className="text-sm text-gray-600">{`Tempo: ${Number.parseFloat(String(label || 0)).toFixed(2)}s`}</p>
                          <p className="text-pink-600">{`Altitude: ${Number.parseFloat(String(payload[0].value || 0)).toFixed(2)}m`}</p>
                          {data.peso && <p className="text-xs text-gray-500">{`Peso: ${data.peso}kg | Pressão: ${data.pressao}psi | Ângulo: ${data.angulo_lancamento}°`}</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                {launchData.map((launch, index) => (
                  <Line
                    key={index}
                    type="monotone"
                    dataKey="altitude"
                    data={timeBasedData.filter((d) => d.launchIndex === index)}
                    name={`${launch.data[0]?.tipo || launch.nome || `Launch ${index + 1}`}`}
                    stroke={COLORS[index]}
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Velocity over Time */}
      <Card>
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-lg text-blue-700">🏃 Velocidade ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={[0, 'dataMax']}
                  tickFormatter={(value) => `${value.toFixed(1)}s`}
                >
                  <Label value="Tempo (segundos)" offset={-10} position="insideBottom" />
                </XAxis>
                <YAxis>
                  <Label value="Velocidade (m/s)" angle={-90} position="insideLeft" style={{ textAnchor: "middle" }} />
                </YAxis>
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${Number.parseFloat(value).toFixed(2)}m/s`,
                    "Velocidade"
                  ]}
                  labelFormatter={(label) => `Tempo: ${Number.parseFloat(label).toFixed(2)}s`}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-semibold">{`${data.tipo || 'Launch'}`}</p>
                          <p className="text-sm text-gray-600">{`Tempo: ${Number.parseFloat(String(label || 0)).toFixed(2)}s`}</p>
                          <p className="text-blue-600">{`Velocidade: ${Number.parseFloat(String(payload[0].value || 0)).toFixed(2)}m/s`}</p>
                          {data.peso && <p className="text-xs text-gray-500">{`Peso: ${data.peso}kg | Pressão: ${data.pressao}psi | Ângulo: ${data.angulo_lancamento}°`}</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                {launchData.map((launch, index) => (
                  <Line
                    key={index}
                    type="monotone"
                    dataKey="velocity"
                    data={timeBasedData.filter((d) => d.launchIndex === index)}
                    name={`${launch.data[0]?.tipo || launch.nome || `Launch ${index + 1}`}`}
                    stroke={COLORS[index]}
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Acceleration over Time */}
      <Card>
        <CardHeader className="bg-green-50">
          <CardTitle className="text-lg text-green-700">⚡ Aceleração ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={[0, 'dataMax']}
                  tickFormatter={(value) => `${value.toFixed(1)}s`}
                >
                  <Label value="Tempo (segundos)" offset={-10} position="insideBottom" />
                </XAxis>
                <YAxis>
                  <Label value="Aceleração (m/s²)" angle={-90} position="insideLeft" style={{ textAnchor: "middle" }} />
                </YAxis>
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${Number.parseFloat(value).toFixed(2)}m/s²`,
                    "Aceleração"
                  ]}
                  labelFormatter={(label) => `Tempo: ${Number.parseFloat(label).toFixed(2)}s`}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-semibold">{`${data.tipo || 'Launch'}`}</p>
                          <p className="text-sm text-gray-600">{`Tempo: ${Number.parseFloat(String(label || 0)).toFixed(2)}s`}</p>
                          <p className="text-green-600">{`Aceleração: ${Number.parseFloat(String(payload[0].value || 0)).toFixed(2)}m/s²`}</p>
                          {data.peso && <p className="text-xs text-gray-500">{`Peso: ${data.peso}kg | Pressão: ${data.pressao}psi | Ângulo: ${data.angulo_lancamento}°`}</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                {launchData.map((launch, index) => (
                  <Line
                    key={index}
                    type="monotone"
                    dataKey="acceleration"
                    data={timeBasedData.filter((d) => d.launchIndex === index)}
                    name={`${launch.data[0]?.tipo || launch.nome || `Launch ${index + 1}`}`}
                    stroke={COLORS[index]}
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Flight Trajectory */}
      <Card>
        <CardHeader className="bg-purple-50">
          <CardTitle className="text-lg text-purple-700">🎯 Trajetória de Voo (Velocidade vs Altitude)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="velocity"
                  type="number"
                  domain={[0, 'dataMax']}
                >
                  <Label value="Velocidade (m/s)" offset={-10} position="insideBottom" />
                </XAxis>
                <YAxis
                  dataKey="altitude"
                  type="number"
                  domain={[0, 'dataMax']}
                >
                  <Label value="Altitude (m)" angle={-90} position="insideLeft" style={{ textAnchor: "middle" }} />
                </YAxis>
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === 'altitude' ? `${Number.parseFloat(value).toFixed(2)}m` : `${Number.parseFloat(value).toFixed(2)}m/s`,
                    name === 'altitude' ? "Altitude" : "Velocidade"
                  ]}
                  labelFormatter={() => "Trajetória"}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-semibold">{`${data.tipo || 'Launch'}`}</p>
                          <p className="text-sm text-gray-600">{`Tempo: ${Number.parseFloat(String(data.time || 0)).toFixed(2)}s`}</p>
                          <p className="text-purple-600">{`Velocidade: ${Number.parseFloat(String(data.velocity || 0)).toFixed(2)}m/s`}</p>
                          <p className="text-purple-600">{`Altitude: ${Number.parseFloat(String(data.altitude || 0)).toFixed(2)}m`}</p>
                          {data.peso && <p className="text-xs text-gray-500">{`Peso: ${data.peso}kg | Pressão: ${data.pressao}psi | Ângulo: ${data.angulo_lancamento}°`}</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                {launchData.map((launch, index) => (
                  <Scatter
                    key={index}
                    data={timeBasedData.filter((d) => d.launchIndex === index)}
                    name={`${launch.data[0]?.tipo || launch.nome || `Launch ${index + 1}`}`}
                    fill={COLORS[index]}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
