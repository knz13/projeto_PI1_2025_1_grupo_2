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
        }),


        //POST para /dados/exportar-dados com o JSON no mesmo formato dos dados recebidos.
        //O endpoint insere em tipo_lancamento e depois em dados_lancamento para cada tipo
        "exportar-dados": new Pair(RequestType.POST, async (req: Request, res: Response) => {
        try {
            const payload = req.body; // Deve ser um array no formato [{ nome, target, data: [...] }]
            if (!Array.isArray(payload)) {
                return res.status(400).json({ error: "Payload deve ser um array" });
            }

            for (const tipo of payload) {
                // Insere tipo_lancamento
                const { data: tipoResult, error: tipoError } = await SupabaseWrapper.get()
                    .from("tipo_lancamento")
                    .insert([{ nome: tipo.nome, target: tipo.target }])
                    .select("id")
                    .single();

                if (tipoError) {
                    console.error("Erro ao inserir tipo_lancamento:", tipoError);
                    return res.status(500).json({ error: "Erro ao inserir tipo_lancamento" });
                }

                const tipoId = tipoResult.id;

                // Insere dados_lancamento relacionados
                if (Array.isArray(tipo.data) && tipo.data.length > 0) {
                    const dadosToInsert = tipo.data.map((d: any) => ({
                        ...d,
                        tipo_lancamento: tipoId // ajuste o nome do campo FK conforme seu schema
                    }));

                    const { error: dadosError } = await SupabaseWrapper.get()
                        .from("dados_lancamento")
                        .insert(dadosToInsert);

                    if (dadosError) {
                        console.error("Erro ao inserir dados_lancamento:", dadosError);
                        return res.status(500).json({ error: "Erro ao inserir dados_lancamento" });
                    }
                }
            }

            return res.status(201).json({ message: "Dados exportados com sucesso" });
        } catch (error) {
            console.error("Erro ao exportar dados:", error);
            return res.status(500).json({ error: "Erro ao exportar dados" });
        }
    })
    }
}





// servidor frontend 
