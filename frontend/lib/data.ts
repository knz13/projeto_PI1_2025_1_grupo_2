// ARQUIVO DESCONTINUADO - Os dados agora vêm do banco de dados Supabase
// 
// Os dados de lançamento agora são obtidos via API do backend através do endpoint:
// GET /dados/dados-lancamento
//
// Estrutura das tabelas no Supabase:
// 
// tipo_lancamento:
// - id_tipo (int8, PK)
// - created_at (timestamptz, PK) 
// - nome (text)
// - target (text)
//
// dados_lancamento:
// - id_lancamento (PK)
// - created_at (PK)
// - angulo_lancamento (float8)
// - peso (float8)  
// - pressao (float8)
// - altura (text) - array de números separados por vírgula
// - aceleracao (text) - array de números separados por vírgula
// - velocidade (text) - array de números separados por vírgula
// - id_tipo (FK para tipo_lancamento)
//
// Os dados são transformados no backend para o formato esperado pelo frontend:
// {
//   nome: string,
//   target: string, 
//   data: Array<{
//     timestamp: string,
//     altitude: number,
//     position: number,
//     velocity: number,
//     acceleration: number
//   }>
// }

/* DADOS PLACEHOLDER ANTERIORES (mantidos para referência):

export const launchData = [
  {
    name: "Lançamento 1",
    target: "10 metros", 
    data: [
      { timestamp: "2025-05-14T15:00:00Z", altitude: 5.2, position: 0.0, velocity: 0.0, acceleration: 0.0 },
      // ... mais dados
    ],
  },
  // ... mais lançamentos
]

*/
