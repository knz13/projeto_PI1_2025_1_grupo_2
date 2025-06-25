import { WebSocketServer } from 'ws';

const port = 8080;
const wss = new WebSocketServer({ port });

console.log(`Listening por ${port}...`);

wss.on('connection', (ws) => {

    ws.on('message', (data) => {
        //a ideia é que os sensores mandem um json com um tipo e um valor
        //o tipo vai indicar qual informação está sendo mandada
        try{
            const fullData = JSON.parse(data.toString());
            switch(fullData.tipo){
                case 'velocidade':
                    //eu nao achei nenhuma funcao que salva os dados no supabase ent deixei so o placeholder msm
                    //placeholder(fullData.valor);
                    break;
                case 'aceleracao':
                    //placeholder(fullData.valor);
                    break;
                case 'altura':
                    //placeholder(fullData.valor);
                    break;
                case 'angulo':
                    //placeholder(fullData.valor);
                    break;
                case 'pressao':
                    //placeholder(fullData.valor);
                    break;
                
                //como velocidade aceleração e altura vao ser
                //mandados varias vezes durante o voo,
                //acho interessante que sejam mandados juntos
                //se esse for o caso:
                /*
                case 'velAceAl':
                    //placeholderVelocidade(fullData.valor[0]);
                    //placeholderAceleracao(fullData.valor[1]);
                    //placeholderAltura(fullData.valor[2]);
                    break;
                */
                default:
                    break;
                    
            }
        }catch(err){
            console.error('Mensage Error');
            ws.send('Error');
        }
        
    });

    ws.send('Connected');
});


//caso o backend seja o cliente ao inves de ser o server
/*
const socket = new webSocket('ws://localhost:8080')
socket.onopen = () => {
    console.log('Connected');

    socket.send(JSON.stringify({type: 'hello', payloado:'Connected'}));
};

socket.onmessage = (event) => {
  //placeholder(){}  
};
*/