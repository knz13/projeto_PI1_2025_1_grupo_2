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




// Configure CORS
const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Configure file upload limits
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '524288000'); // 500MB default
app.use(fileUpload({
    limits: { fileSize: maxFileSize }
}));

// Configure body parser limits
const maxBodySize = process.env.MAX_BODY_SIZE || '500mb';
app.use(bodyParser.json({ limit: maxBodySize }));
app.use(bodyParser.urlencoded({ limit: maxBodySize, extended: true }));





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

// Health check endpoint for Docker
app.get("/health", (req: Request, res: Response) => {
    try {
        // Check if Supabase is initialized
        const supabaseHealthy = SupabaseWrapper.get() !== null;

        const healthStatus = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            supabase: supabaseHealthy ? "connected" : "disconnected",
            env: process.env.NODE_ENV || 'development'
        };

        res.status(200).json(healthStatus);
    } catch (error) {
        res.status(503).json({
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
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

const port = parseInt(process.env.PORT || '3325');
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
    console.log(`🚀 Server running on ${host}:${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS Origin: ${corsOrigin}`);
    console.log(`📁 Max file size: ${Math.round(maxFileSize / 1024 / 1024)}MB`);
    console.log(`📄 Max body size: ${maxBodySize}`);
    console.log(`🏥 Health check: http://${host}:${port}/health`);
});


