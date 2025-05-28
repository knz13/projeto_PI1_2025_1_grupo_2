"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LaunchCharts from "@/components/launch-charts"
import PinkBoomLogo from "@/components/pink-boom-logo"
import { launchData } from "@/lib/data"

export default function RocketDashboard() {
  const [activeTab, setActiveTab] = useState("rocket")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center mb-8">
        <PinkBoomLogo />
        <p className="text-gray-600 text-sm mt-1">Sistema de Análise de Lançamentos de Foguetes d'Água</p>
      </div>

      <Tabs defaultValue="rocket" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start mb-6 bg-pink-50 border-pink-100 border">
          <TabsTrigger value="rocket" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
            Dados do Foguete
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rocket" className="space-y-6">
          <Card>
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
                            {Math.max(...launch.data.map((d) => d.altitude)).toFixed(1)} m
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Posição Máx:</span>
                          <span className="font-medium">
                            {Math.max(...launch.data.map((d) => d.position)).toFixed(1)} m
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Velocidade Máx:</span>
                          <span className="font-medium">
                            {Math.max(...launch.data.map((d) => d.velocity)).toFixed(1)} m/s
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Aceleração Máx:</span>
                          <span className="font-medium">
                            {Math.max(...launch.data.map((d) => d.acceleration)).toFixed(1)} m/s²
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
