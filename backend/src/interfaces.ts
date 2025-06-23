import { Pair } from "./utils";
import { Request, Response } from 'express';

export enum RequestType {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
}

export interface DadosLancamento {
    id_lancamento: number;
    created_at: string; // ou Date, dependendo de como você manipula datas
    angulo_lancamento: number;
    peso: number;
    pressao: number;
    altura: number[];
    aceleracao: number[];
    velocidade: number[];
}

export interface EndpointController {
    name: string;
    routes: { [key: string]: Pair<RequestType, (req: Request, res: Response) => Promise<Response> | Promise<void>> };
}

export function parseDadosLancamento(json: any): DadosLancamento {
    return {
        id_lancamento: Number(json.id_lancamento),
        created_at: String(json.created_at),
        angulo_lancamento: Number(json.angulo_lancamento),
        peso: Number(json.peso),
        pressao: Number(json.pressao),
        altura: Array.isArray(json.altura)
            ? json.altura.map(Number)
            : JSON.parse(json.altura).map(Number),
        aceleracao: Array.isArray(json.aceleracao)
            ? json.aceleracao.map(Number)
            : JSON.parse(json.aceleracao).map(Number),
        velocidade: Array.isArray(json.velocidade)
            ? json.velocidade.map(Number)
            : JSON.parse(json.velocidade).map(Number),
    };
}