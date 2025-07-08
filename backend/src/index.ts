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
import { DadosController } from './dados_controller';
import { startWsServer } from './wsServer';

dotenv.config();

SupabaseWrapper.init();

const router = express.Router();

//http://meu-servidor.com/dados/dados-lancamento


const app: Express = express();

var appWs = expressws(app);

startWsServer(appWs);




app.use(fileUpload())
app.use(bodyParser.json({ limit: 500 * 1024 * 1024, }));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});





app.get("/", (req: Request, res: Response) => {
    const processInfo = {
        pid: process.pid,
        platform: process.platform,
        version: process.version,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        env: process.env.NODE_ENV || 'development'
    };
    res.json(processInfo);
});


const controllers: EndpointController[] = [
    DadosController
];

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


app.use(router);

app.listen(process.env.PORT ?? 5875, () => {
    console.log(`Server running on port ${process.env.PORT ?? 5875}`);
});


