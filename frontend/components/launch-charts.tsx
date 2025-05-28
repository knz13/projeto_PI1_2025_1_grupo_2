"use client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { launchData } from "@/lib/data"

// Colors for each launch
const COLORS = ["#ff4d94", "#d6409f", "#9c27b0"]

export default function LaunchCharts() {
  // Combine all data points for position vs altitude chart
  const positionAltitudeData = launchData.flatMap((launch, index) => {
    return launch.data.map((point) => ({
      ...point,
      launchName: `Lançamento ${index + 1} (${index === 0 ? "10m" : index === 1 ? "20m" : "30m"})`,
      launchIndex: index,
    }))
  })

  // Combine all data points for velocity vs acceleration chart
  const velocityAccelerationData = launchData.flatMap((launch, index) => {
    return launch.data.map((point) => ({
      ...point,
      launchName: `Lançamento ${index + 1} (${index === 0 ? "10m" : index === 1 ? "20m" : "30m"})`,
      launchIndex: index,
    }))
  })

  return (
    <div className="space-y-8">
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
                    `${Number.parseFloat(value).toFixed(2)}`,
                    name === "altitude" ? "Altitude (m)" : "Posição (m)",
                  ]}
                  labelFormatter={(label) => `Posição: ${Number.parseFloat(label).toFixed(2)} m`}
                />
                <Legend />
                {launchData.map((_, index) => (
                  <Line
                    key={index}
                    type="monotone"
                    dataKey="altitude"
                    data={positionAltitudeData.filter((d) => d.launchIndex === index)}
                    name={`Lançamento ${index + 1} (${index === 0 ? "10m" : index === 1 ? "20m" : "30m"})`}
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
                    `${Number.parseFloat(value).toFixed(2)}`,
                    name === "acceleration" ? "Aceleração (m/s²)" : "Velocidade (m/s)",
                  ]}
                  labelFormatter={(label) => `Velocidade: ${Number.parseFloat(label).toFixed(2)} m/s`}
                />
                <Legend />
                {launchData.map((_, index) => (
                  <Line
                    key={index}
                    type="monotone"
                    dataKey="acceleration"
                    data={velocityAccelerationData.filter((d) => d.launchIndex === index)}
                    name={`Lançamento ${index + 1} (${index === 0 ? "10m" : index === 1 ? "20m" : "30m"})`}
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
