import { DadosLancamento, EndpointController, parseDadosLancamento, RequestType } from "./interfaces";
import { SupabaseWrapper } from "./supabase_wrapper";
import { Pair } from "./utils";
import { Router, Request, Response } from "express";



export const DadosController: EndpointController = {
    name: "dados",
    routes: {
        "dados-lancamento": new Pair(RequestType.GET, async (req: Request, res: Response) => {

            console.log("Fetching launch data...");
            const { data: dadosLancamento, error: errorLancamento } = await SupabaseWrapper.get().from("tipo_lancamento").select("*,dados_lancamento(*)");

            if (errorLancamento) {
                console.error("Erro ao buscar dados de lançamento:", errorLancamento);
                return res.status(500).json({ error: "Erro ao buscar dados de lançamento" });
            }

            if (!dadosLancamento || dadosLancamento.length === 0) {
                console.warn("Nenhum dado de lançamento encontrado");
                return res.status(404).json({ error: "Nenhum dado de lançamento encontrado" });

            }

            var launchData:
                {
                    nome: string;
                    target: string;
                    data: DadosLancamento[]
                }[]
                = [];

            dadosLancamento.forEach((tipoLancamento: any) => {
                const dados = tipoLancamento.dados_lancamento;
                if (dados && dados.length > 0) {
                    launchData.push({
                        nome: tipoLancamento.nome,
                        target: tipoLancamento.target,
                        data: dados.map(parseDadosLancamento)
                    });
                }
            });

            console.log("Launch data:", launchData);

            return res.json(launchData);
        }),

        "send-dados-lancamento": new Pair(RequestType.POST, async (req: Request, res: Response) => {
            console.log("Receiving launch data from website...");

            try {
                // Validate request body
                const { angulo_lancamento, peso, pressao, altura, aceleracao, velocidade, tipo } = req.body;

                if (!angulo_lancamento || !peso || !pressao || !altura || !aceleracao || !velocidade || !tipo) {
                    return res.status(400).json({
                        error: "Missing required fields: angulo_lancamento, peso, pressao, altura, aceleracao, velocidade, tipo"
                    });
                }

                // Validate data types
                if (typeof angulo_lancamento !== 'number' || typeof peso !== 'number' || typeof pressao !== 'number') {
                    return res.status(400).json({
                        error: "angulo_lancamento, peso, and pressao must be numbers"
                    });
                }

                if (!Array.isArray(altura) || !Array.isArray(aceleracao) || !Array.isArray(velocidade)) {
                    return res.status(400).json({
                        error: "altura, aceleracao, and velocidade must be arrays"
                    });
                }

                if (typeof tipo !== 'string') {
                    return res.status(400).json({
                        error: "tipo must be a string"
                    });
                }

                // Prepare data for insertion
                const dadosParaInserir = {
                    angulo_lancamento,
                    peso,
                    pressao,
                    altura: JSON.stringify(altura), // Store as JSON string in database
                    aceleracao: JSON.stringify(aceleracao),
                    velocidade: JSON.stringify(velocidade),
                    tipo,
                    created_at: new Date().toISOString()
                };

                console.log("Inserting launch data:", dadosParaInserir);

                // Insert data into Supabase
                const { data, error } = await SupabaseWrapper.get()
                    .from("dados_lancamento")
                    .insert([dadosParaInserir])
                    .select();

                if (error) {
                    console.error("Erro ao inserir dados de lançamento:", error);
                    return res.status(500).json({
                        error: "Erro ao salvar dados de lançamento no banco de dados",
                        details: error.message
                    });
                }

                console.log("Launch data successfully inserted:", data);

                return res.status(201).json({
                    message: "Dados de lançamento salvos com sucesso!",
                    data: data[0],
                    id: data[0]?.id_lancamento
                });

            } catch (error) {
                console.error("Erro inesperado:", error);
                return res.status(500).json({
                    error: "Erro interno do servidor",
                    details: error instanceof Error ? error.message : "Unknown error"
                });
            }
        })
    }
}





// servidor frontend 
