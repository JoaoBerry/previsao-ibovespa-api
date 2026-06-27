// Configuração base da URL da sua API local (mude se fizer deploy no Render/Railway)
const API_BASE_URL = 'https://previsao-ibovespa-api.onrender.com';

// Inicializa a aplicação quando a árvore DOM estiver pronta
window.addEventListener('DOMContentLoaded', () => {
    carregarMetricasBacktest();
    carregarDadosGrafico();
    configurarEventosSimulador();
});

// 1. Busca os resultados consolidados do Backtest Real (Passo 3)
async function carregarMetricasBacktest() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/backtest`);
        const dados = await response.json();
        
        if (dados && !dados.error) {
            // Tratamento e exibição da acurácia percentual (ex: 0.714 -> 71.4%)
            const acuraciaFormatada = (dados.acuracia * 100).toFixed(1) + '%';
            document.getElementById('acuracia-modelo').innerText = acuraciaFormatada;
            
            // Injeção de strings de retorno (+18.5%, etc)
            document.getElementById('retorno-ia').innerText = dados.retorno_ia;
            document.getElementById('retorno-ibov').innerText = dados.retorno_ibov;
            
            if (dados.data_atualizacao) {
                document.getElementById('data-atualizacao').innerText = `Último treino: ${dados.data_atualizacao}`;
            }
        }
    } catch (error) {
        console.error("❌ Erro ao consumir endpoint /api/backtest:", error);
        document.getElementById('acuracia-modelo').innerText = "Erro de API";
    }
}

// 2. Busca o histórico de 30 dias para renderizar o gráfico de Evolução
async function carregarDadosGrafico() {
    try {
        const response = await fetch(`${API_BASE_URL}/dados-reais`);
        const dados = await response.json();
        
        if (dados && dados.historico) {
            renderizarGrafico(dados.historico);
        }
    } catch (error) {
        console.error("❌ Erro ao carregar dados do histórico do gráfico:", error);
    }
}

// 3. Renderiza o componente visual do gráfico usando o ApexCharts
function renderizarGrafico(historico) {
    // Mapeia os dados do JSON para listas simples aceitas pelo ApexCharts
    const datas = historico.map(item => item.data);
    const fechamentos = historico.map(item => item.fechamento);
    const mma20 = historico.map(item => item.mma20);
    const mma50 = historico.map(item => item.mma50);

    const options = {
        series: [
            { name: 'Fechamento Real', data: fechamentos },
            { name: 'MMA 20 Dias', data: mma20 },
            { name: 'MMA 50 Dias', data: mma50 }
        ],
        chart: {
            type: 'line',
            height: 350,
            background: 'transparent',
            toolbar: { show: false }
        },
        theme: { mode: 'dark' },
        stroke: { width: [3, 2, 2], curve: 'smooth' },
        colors: ['#10b981', '#3b82f6', '#f97316'], // Esmeralda, Azul e Laranja
        xaxis: {
            categories: datas,
            labels: { rotate: -45, style: { fontSize: '10px', fontFamily: 'monospace' } }
        },
        yaxis: {
            labels: {
                formatter: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
        },
        grid: { borderColor: '#334155' },
        legend: { position: 'top' }
    };

    const chart = new ApexCharts(document.querySelector("#chart-historico"), options);
    chart.render();
}

// 4. Configura as ações de clique do simulador manual
function configurarEventosSimulador() {
    const botao = document.getElementById('btn-predicao');
    
    botao.addEventListener('click', async () => {
        const mma20Val = parseFloat(document.getElementById('input-mma20').value);
        const mma50Val = parseFloat(document.getElementById('input-mma50').value);
        
        const txtDirecao = document.getElementById('txt-direcao');
        const txtProbabilidade = document.getElementById('txt-probabilidade');
        
        txtDirecao.innerText = "Calculando...";
        txtProbabilidade.innerText = "Consultando regras de IA...";

        try {
            // Enviando o payload atualizado (com valores neutros para retorno/rsi temporariamente no mock manual)
            const response = await fetch(`${API_BASE_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mma_20: mma20Val,
                    mma_50: mma50Val,
                    retorno: 0.001,
                    rsi: 52.5
                })
            });
            
            const resultado = await response.json();
            
            if (resultado && resultado.direcao) {
                txtDirecao.innerText = `Tendência de ${resultado.direcao}`;
                txtProbabilidade.innerText = `Confiança do Modelo: ${(resultado.probabilidade * 100).toFixed(0)}%`;
                
                // Altera a cor de destaque baseado no viés do mercado
                if (resultado.direcao === 'ALTA') {
                    txtDirecao.className = "text-xl font-black text-emerald-400";
                } else {
                    txtDirecao.className = "text-xl font-black text-rose-400";
                }
            }
        } catch (error) {
            console.error("❌ Erro ao enviar dados de predição:", error);
            txtDirecao.innerText = "Erro de Conexão";
            txtProbabilidade.innerText = "Verifique se a API local está ativa.";
        }
    });
}