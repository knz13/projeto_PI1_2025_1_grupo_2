"use client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Colors for each launch
const COLORS = ["#ff4d94", "#d6409f", "#9c27b0"]

interface LaunchData {
  nome: string;
  target: string;
  data: Array<{
    timestamp: string;
    altitude: number;
    position: number;
    velocity: number;
    acceleration: number;
  }>;
}

interface LaunchChartsProps {
  launchData: LaunchData[];
}

export default function LaunchCharts({ launchData }: LaunchChartsProps) {
  // Se não há dados, mostrar uma mensagem
  if (!launchData || launchData.length === 0) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-gray-500">
              Nenhum dado de lançamento disponível
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Combine all data points for position vs altitude chart
  const positionAltitudeData = launchData.flatMap((launch, index) => {
    return launch.data.map((point) => ({
      ...point,
      launchName: `${launch.nome} (${launch.target})`,
      launchIndex: index,
    }))
  })

  // Combine all data points for velocity vs acceleration chart
  const velocityAccelerationData = launchData.flatMap((launch, index) => {
    return launch.data.map((point) => ({
      ...point,
      launchName: `${launch.nome} (${launch.target})`,
      launchIndex: index,
    }))
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <Card>
        <CardHeader className="bg-pink-50">
          <CardTitle className="text-lg text-pink-700">Posição vs. Altitude</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={positionAltitudeData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="position" type="number" domain={["dataMin", "dataMax"]} allowDataOverflow>
                  <Label value="Posição (m)" offset={-10} position="insideBottom" />
                </XAxis>
                <YAxis domain={["dataMin", "dataMax"]} allowDataOverflow>
                  <Label value="Altitude (m)" angle={-90} position="insideLeft" style={{ textAnchor: "middle" }} />
                </YAxis>
                <Tooltip
                  formatter={(value, name) => [
                  `${Number.parseFloat(value as string).toFixed(2)}`,
                  name === "altitude" ? "Altitude (m)" : "Posição (m)",
                  ]}
                  labelFormatter={(label) => `Posição: ${Number.parseFloat(label).toFixed(2)} m`}
                />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                {launchData.map((launch, index) => (
                  <Line
                    key={index}
                    type="monotone"
                    dataKey="altitude"
                    data={positionAltitudeData.filter((d) => d.launchIndex === index)}
                    name={`${launch.nome} (${launch.target})`}
                    stroke={COLORS[index]}
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-pink-50">
          <CardTitle className="text-lg text-pink-700">Velocidade vs. Aceleração</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocityAccelerationData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="velocity" type="number" domain={["dataMin", "dataMax"]} allowDataOverflow>
                  <Label value="Velocidade (m/s)" offset={-10} position="insideBottom" />
                </XAxis>
                <YAxis domain={["dataMin", "dataMax"]} allowDataOverflow>
                  <Label value="Aceleração (m/s²)" angle={-90} position="insideLeft" style={{ textAnchor: "middle" }} />
                </YAxis>
                <Tooltip
                  formatter={(value, name) => [
                    `${Number.parseFloat(value as string).toFixed(2)}`,
                    name === "acceleration" ? "Aceleração (m/s²)" : "Velocidade (m/s)",
                  ]}
                  labelFormatter={(label) => `Velocidade: ${Number.parseFloat(label).toFixed(2)} m/s`}
                />
                <Legend wrapperStyle={{ paddingTop: 20 }}/>
                {launchData.map((launch, index) => (
                  <Line 
                    key={index}
                    type="monotone"
                    dataKey="acceleration"
                    data={velocityAccelerationData.filter((d) => d.launchIndex === index)}
                    name={`${launch.nome} (${launch.target})`}
                    stroke={COLORS[index]}
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
