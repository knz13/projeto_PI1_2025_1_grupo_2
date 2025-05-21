
| Método | Endpoint                  | Descrição                          |
| ------ | ------------------------- | ---------------------------------- |
| POST   | /launches                 |                                    |
| GET    | /launches/                | Lista lançamentos                  |
| GET    | /launches/{id}            | Obter detalhes de um lançamento    |
| GET    | /launches/{id}/trajectory | Puxa dado de lançamento específico |
| DELETE | /launches/{id}            | Remove um lançamento do sistema.   |

## Observações sobre os Dados de Gráfico

- Todos os vetores de dados devem estar sincronizados pelo índice do tempo (`tempo_segundos`).
- É esperado que os dados estejam ordenados em ordem crescente de tempo.
- Unidades:
    - Distância: metros (m)
    - Tempo: segundos (s)
    - Velocidade: metros por segundo (m/s)
    - Aceleração: metros por segundo ao quadrado (m/s²)
