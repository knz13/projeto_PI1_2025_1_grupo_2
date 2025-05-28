import { Rocket } from "lucide-react"

export default function PinkBoomLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Rocket className="h-8 w-8 text-pink-500" />
        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-pink-200 rounded-full animate-ping" />
      </div>
      <h1 className="text-3xl font-bold">
        <span className="text-pink-500">PINK</span>
        <span className="text-gray-800">BOOM</span>
      </h1>
    </div>
  )
}
