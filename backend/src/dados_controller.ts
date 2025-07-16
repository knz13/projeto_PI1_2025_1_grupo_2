import { DadosLancamento, EndpointController, parseDadosLancamento, RequestType } from "./interfaces";
import { SupabaseWrapper } from "./supabase_wrapper";
import { Pair } from "./utils";
import { Router, Request, Response } from "express";



export const DadosController: EndpointController = {
    name: "dados",
    routes: {
        "dados-lancamento": new Pair(RequestType.GET, async (req: Request, res: Response) => {

            console.log("Fetching launch data...");
            const { data: dadosLancamento, error: errorLancamento } = await SupabaseWrapper.get().from("dados_lancamento").select("*");

            if (errorLancamento) {
                console.error("Erro ao buscar dados de lançamento:", errorLancamento);
                return res.status(500).json({ error: "Erro ao buscar dados de lançamento" });
            }

            if (!dadosLancamento || dadosLancamento.length === 0) {
                console.warn("Nenhum dado de lançamento encontrado");
                return res.status(404).json({ error: "Nenhum dado de lançamento encontrado" });

            }

            console.log("Dados de lançamento encontrados:", JSON.stringify(dadosLancamento, null, 2));

            // Group launches by tipo and transform data
            const launchsByTipo: { [key: string]: any[] } = {};

            dadosLancamento.forEach((dadoLancamento: any) => {
                const parsed = parseDadosLancamento(dadoLancamento);

                if (!launchsByTipo[parsed.tipo]) {
                    launchsByTipo[parsed.tipo] = [];
                }

                // Convert arrays to individual data points for this launch
                const dataPoints = [];
                const maxLength = Math.max(
                    parsed.altura.length,
                    parsed.aceleracao.length,
                    parsed.velocidade.length,
                    parsed.tempo.length,
                    parsed.posicao.length
                );

                for (let i = 0; i < maxLength; i++) {
                    dataPoints.push({
                        timestamp: parsed.created_at,
                        relativeTime: parsed.tempo[i] || (i * 0.1), // Use actual time or fallback to 100ms intervals
                        altitude: parsed.altura[i] || 0,
                        acceleration: parsed.aceleracao[i] || 0,
                        velocity: parsed.velocidade[i] || 0,
                        position: parsed.posicao[i] || 0, // Use actual position data
                        time: parsed.tempo[i] || (i * 0.1), // Add time field for charts
                        id_lancamento: parsed.id_lancamento,
                        angulo_lancamento: parsed.angulo_lancamento,
                        peso: parsed.peso,
                        pressao: parsed.pressao,
                        tipo: parsed.tipo
                    });
                }

                // Add all data points from this launch to the group
                launchsByTipo[parsed.tipo].push(...dataPoints);
            });

            // Convert grouped data to expected format
            const launchData = Object.keys(launchsByTipo).map(tipo => ({
                nome: `Lançamento ${tipo}`,
                target: tipo,
                data: launchsByTipo[tipo]
            }));

            console.log("Launch data:", launchData);

            return res.json(launchData);
        }),

        "send-dados-lancamento": new Pair(RequestType.POST, async (req: Request, res: Response) => {
            console.log("Receiving launch data from website...");

            try {
                // Validate request body
                const { angulo_lancamento, peso, pressao, altura, aceleracao, velocidade, tempo, posicao, tipo } = req.body;

                if (!angulo_lancamento || !peso || !pressao || !altura || !aceleracao || !velocidade || !tempo || !posicao || !tipo) {
                    return res.status(400).json({
                        error: "Missing required fields: angulo_lancamento, peso, pressao, altura, aceleracao, velocidade, tempo, posicao, tipo"
                    });
                }

                // Validate data types
                if (typeof angulo_lancamento !== 'number' || typeof peso !== 'number' || typeof pressao !== 'number') {
                    return res.status(400).json({
                        error: "angulo_lancamento, peso, and pressao must be numbers"
                    });
                }

                if (!Array.isArray(altura) || !Array.isArray(aceleracao) || !Array.isArray(velocidade) || !Array.isArray(tempo) || !Array.isArray(posicao)) {
                    return res.status(400).json({
                        error: "altura, aceleracao, velocidade, tempo, and posicao must be arrays"
                    });
                }

                if (typeof tipo !== 'string') {
                    return res.status(400).json({
                        error: "tipo must be a string"
                    });
                }

                // Validate tipo values
                const validTipos = ["10m", "20m", "30m"];
                if (!validTipos.includes(tipo)) {
                    return res.status(400).json({
                        error: "tipo must be one of: 10m, 20m, 30m"
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
                    tempo: JSON.stringify(tempo),
                    posicao: JSON.stringify(posicao),
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
