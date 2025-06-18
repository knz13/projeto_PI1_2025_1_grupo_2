"use client"
import { createClient } from '@supabase/supabase-js'
import { SupabaseWrapper } from './supabase_wrapper'
import jwt from 'jsonwebtoken';
import axios from 'axios';
import expressws from "express-ws";

import express, { Express, Request, Response } from 'express';

import dotenv from "dotenv";
import { Utils } from './utils';
import { EndpointController, RequestType } from './interfaces';
import fileUpload from 'express-fileupload';
import bodyParser from 'body-parser';
import cors from "cors";

import * as fs from 'fs';
const raw = fs.readFileSync("frontend/lib/data.json", "utf-8")
const launchData = JSON.parse(raw)

dotenv.config();

SupabaseWrapper.init();

const router = express.Router();

const controllers: EndpointController[] = [];

controllers.forEach(controller => {
    Object.keys(controller.routes).forEach(route_name => {
        const route = controller.routes[route_name];
        const method = route.key;
        const callback = route.value;

        switch (method) {
            case RequestType.GET:
                router.get(`/${controller.name}/${route_name}`, async (req: Request, res: Response) => {
                    try {
                        await callback(req, res);
                    } catch (error) {
                        res.status(500).json({ error: 'Internal server error' });
                    }
                });
                break;
            case RequestType.POST:
                router.post(`/${controller.name}/${route_name}`, async (req: Request, res: Response) => {
                    try {
                        await callback(req, res);
                    } catch (error) {
                        res.status(500).json({ error: 'Internal server error' });
                    }
                });
                break;
            case RequestType.PUT:
                router.put(`/${controller.name}/${route_name}`, async (req: Request, res: Response) => {
                    try {
                        await callback(req, res);
                    } catch (error) {
                        res.status(500).json({ error: 'Internal server error' });
                    }
                });
                break;
            default:
                break;
        }
    });
});

const app: Express = express();

expressws(app);

app.use(fileUpload())
app.use(bodyParser.json({ limit: 500 * 1024 * 1024, }));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});


app.use(router);

app.listen(process.env.PORT ?? 3000, () => {
    console.log(`Server running on port ${process.env.PORT ?? 3000}`);
});


function setNewLaunch(
    newName: string,
    newTarget: string,
    newTimestamp: string,
    newAltitude: number,
    newPosition: number,
    Velocity: number,
    launchNumber: number,
    newAcceleration: number
    
) {
    const newData = {
        name: newName,
        target: newTarget,
        data: []
    };
    
    //while (receber dados do Arduino)
    setData(newTimestamp, newAltitude, newPosition, Velocity, launchNumber, newAcceleration);

    launchData.push(newData);
    fs.writeFileSync("frontend/lib/data.json", JSON.stringify(launchData, null, 2), "utf-8")
}

function setData(
    newTimestamp: string,
    newAltitude: number,
    newPosition: number,
    Velocity: number,
    launchNumber: number,
    newAcceleration: number
){
    launchData[launchNumber].data.push({
        timestamp: newTimestamp,
        altitude: newAltitude,
        position: newPosition,
        velocity: Velocity,
        acceleration: newAcceleration
    });
    fs.writeFileSync("frontend/lib/data.json", JSON.stringify(launchData, null, 2), "utf-8")
}


