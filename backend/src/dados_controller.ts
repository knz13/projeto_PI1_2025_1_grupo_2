import { EndpointController, RequestType } from "./interfaces";
import { Pair } from "./utils";
import { Router, Request, Response } from "express";

// Mock data for three launches (10m, 20m, 30m)
export const launchData = [
    {
        name: "Lançamento 1",
        target: "10 metros",
        data: [
            { timestamp: "2025-05-14T15:00:00Z", altitude: 5.2, position: 0.0, velocity: 0.0, acceleration: 0.0 },
            { timestamp: "2025-05-14T15:00:01Z", altitude: 8.7, position: 1.5, velocity: 3.2, acceleration: 3.2 },
            { timestamp: "2025-05-14T15:00:02Z", altitude: 10.3, position: 3.8, velocity: 5.8, acceleration: 2.6 },
            { timestamp: "2025-05-14T15:00:03Z", altitude: 9.8, position: 6.2, velocity: 4.9, acceleration: -0.9 },
            { timestamp: "2025-05-14T15:00:04Z", altitude: 7.5, position: 8.1, velocity: 3.5, acceleration: -1.4 },
            { timestamp: "2025-05-14T15:00:05Z", altitude: 4.2, position: 9.5, velocity: 2.1, acceleration: -1.4 },
            { timestamp: "2025-05-14T15:00:06Z", altitude: 0.8, position: 10.2, velocity: 0.5, acceleration: -1.6 },
            { timestamp: "2025-05-14T15:00:07Z", altitude: 0.0, position: 10.3, velocity: 0.0, acceleration: -0.5 },
        ],
    },
    {
        name: "Lançamento 2",
        target: "20 metros",
        data: [
            { timestamp: "2025-05-14T15:10:00Z", altitude: 5.5, position: 0.0, velocity: 0.0, acceleration: 0.0 },
            { timestamp: "2025-05-14T15:10:01Z", altitude: 10.2, position: 2.1, velocity: 4.5, acceleration: 4.5 },
            { timestamp: "2025-05-14T15:10:02Z", altitude: 15.8, position: 5.3, velocity: 7.8, acceleration: 3.3 },
            { timestamp: "2025-05-14T15:10:03Z", altitude: 18.4, position: 9.2, velocity: 8.2, acceleration: 0.4 },
            { timestamp: "2025-05-14T15:10:04Z", altitude: 17.2, position: 13.5, velocity: 7.1, acceleration: -1.1 },
            { timestamp: "2025-05-14T15:10:05Z", altitude: 14.5, position: 16.8, velocity: 5.3, acceleration: -1.8 },
            { timestamp: "2025-05-14T15:10:06Z", altitude: 10.1, position: 19.2, velocity: 3.2, acceleration: -2.1 },
            { timestamp: "2025-05-14T15:10:07Z", altitude: 5.2, position: 20.1, velocity: 1.5, acceleration: -1.7 },
            { timestamp: "2025-05-14T15:10:08Z", altitude: 0.8, position: 20.4, velocity: 0.3, acceleration: -1.2 },
            { timestamp: "2025-05-14T15:10:09Z", altitude: 0.0, position: 20.5, velocity: 0.0, acceleration: -0.3 },
        ],
    },
    {
        name: "Lançamento 3",
        target: "30 metros",
        data: [
            { timestamp: "2025-05-14T15:20:00Z", altitude: 6.0, position: 0.0, velocity: 0.0, acceleration: 0.0 },
            { timestamp: "2025-05-14T15:20:01Z", altitude: 12.5, position: 2.8, velocity: 5.8, acceleration: 5.8 },
            { timestamp: "2025-05-14T15:20:02Z", altitude: 19.8, position: 7.2, velocity: 9.5, acceleration: 3.7 },
            { timestamp: "2025-05-14T15:20:03Z", altitude: 24.5, position: 12.8, velocity: 10.2, acceleration: 0.7 },
            { timestamp: "2025-05-14T15:20:04Z", altitude: 26.2, position: 18.5, velocity: 9.8, acceleration: -0.4 },
            { timestamp: "2025-05-14T15:20:05Z", altitude: 24.8, position: 23.2, velocity: 8.5, acceleration: -1.3 },
            { timestamp: "2025-05-14T15:20:06Z", altitude: 20.5, position: 27.1, velocity: 6.2, acceleration: -2.3 },
            { timestamp: "2025-05-14T15:20:07Z", altitude: 15.2, position: 29.5, velocity: 4.1, acceleration: -2.1 },
            { timestamp: "2025-05-14T15:20:08Z", altitude: 9.8, position: 30.8, velocity: 2.3, acceleration: -1.8 },
            { timestamp: "2025-05-14T15:20:09Z", altitude: 4.2, position: 31.2, velocity: 0.8, acceleration: -1.5 },
            { timestamp: "2025-05-14T15:20:10Z", altitude: 0.5, position: 31.4, velocity: 0.2, acceleration: -0.6 },
            { timestamp: "2025-05-14T15:20:11Z", altitude: 0.0, position: 31.5, velocity: 0.0, acceleration: -0.2 },
        ],
    },
]


export const DadosController: EndpointController = {
    name: "dados",
    routes: {
        "dados-lancamentos-total": new Pair(RequestType.GET, async (req: Request, res: Response) => {
            return res.json(launchData);
        })
    }
}





// servidor frontend 
