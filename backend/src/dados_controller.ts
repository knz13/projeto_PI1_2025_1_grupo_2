import { DadosLancamento, EndpointController, parseDadosLancamento, RequestType } from "./interfaces";
import { SupabaseWrapper } from "./supabase_wrapper";
import { Pair } from "./utils";
import { Router, Request, Response } from "express";



export const DadosController: EndpointController = {
    name: "dados",
    routes: {
        "dados-lancamento": new Pair(RequestType.GET, async (req: Request, res: Response) => {

            console.log("Fetching launch data...");
            const {data: dadosLancamento, error: errorLancamento} = await SupabaseWrapper.get().from("tipo_lancamento").select("*,dados_lancamento(*)");

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
        })
    }
}





// servidor frontend 
