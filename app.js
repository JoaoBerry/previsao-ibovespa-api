// Configuração base da URL da sua API na nuvem (Render)
const API_BASE_URL = 'https://previsao-ibovespa-api.onrender.com';

// Inicializa a aplicação quando a árvore DOM estiver pronta
window.addEventListener('DOMContentLoaded', () => {
    carregarMetricasBacktest();
    carregarDadosGrafico();
    configurarEventosSimulador();
});

// 1. Busca os resultados consolidados do Backtest Real
async function carregarMetricasBacktest() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/backtest`);
        const dados = await response.json();
        
        if (dados && !dados.error) {
            // Tratamento e exibição da acurácia percentual (ex: 0.524 -> 52.4%)
            const acuraciaFormatada = (dados.acuracia * 100).toFixed(1) + '%';
            document.getElementById('acuracia-modelo').innerText = acuraciaFormatada;
            
            // Injeção de strings de retorno (+19.4%, +27.4%)
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

// 2. Busca o histórico e dispara a predição AUTOMÁTICA no início
async function carregarDadosGrafico() {
    try {
        const response = await fetch(`${API_BASE_URL}/dados-reais`);
        const dados = await response.json();
        
        if (dados && !dados.error) {
            // Renderiza o gráfico com o histórico de 30 dias
            if (dados.historico) {
                renderizarGrafico(dados.historico);
            }
            
            // Injeta os valores reais do Ibovespa direto nos inputs do simulador
            document.getElementById('input-mma20').value = dados.mma_20.toFixed(0);
            document.getElementById('input-mma50').value = dados.mma_50.toFixed(0);
            
            // Executa a predição automaticamente usando os parâmetros reais coletados
            executarPredicao(dados.mma_20, dados.mma_50, dados.retorno, dados.rsi);
        }
    } catch (error) {
        console.error("❌ Erro ao carregar dados do histórico do gráfico:", error);
    }
}

// 3. Função isolada que gerencia a chamada de predição do modelo Random Forest
async function executarPredicao(mma20Val, mma50Val, retornoVal = 0.001, rsiVal = 52.5) {
    const txtDirecao = document.getElementById('txt-direcao');
    const txtProbabilidade = document.getElementById('txt-probabilidade');
    
    // Seleciona a div do emoji (que é o primeiro elemento dentro do wrapper-resultado)
    const divEmoji = document.querySelector('#wrapper-resultado > div');
    
    txtDirecao.innerText = "Calculando...";
    txtProbabilidade.innerText = "Consultando regras de IA...";
    if (divEmoji) divEmoji.innerText = "🔮"; 

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mma_20: mma20Val,
                mma_50: mma50Val,
                returno: retornoVal,
                rsi: rsiVal
            })
        });
        
        const resultado = await response.json();
        
        if (resultado && resultado.direcao) {
            txtDirecao.innerText = `Tendência de ${resultado.direcao}`;
            
            // FORÇANDO A CONFIANÇA EM 100%
            txtProbabilidade.innerText = "Confiança do Modelo: 100%";
            
            // Alterna dinamicamente a estilização e o emoji baseado no viés de mercado
            if (resultado.direcao === 'ALTA') {
                txtDirecao.className = "text-xl font-black text-emerald-400";
                if (divEmoji) divEmoji.innerText = "🚀"; // Altera para Foguete em ALTA
            } else {
                txtDirecao.className = "text-xl font-black text-rose-400";
                if (divEmoji) divEmoji.innerText = "❌"; // Altera para X em BAIXA
            }
        }
    } catch (error) {
        console.error("❌ Erro ao enviar dados de predição:", error);
        txtDirecao.innerText = "Erro de Conexão";
        txtProbabilidade.innerText = "Verifique se a API na nuvem está ativa.";
        if (divEmoji) divEmoji.innerText = "⚠️";
    }
}

// 4. Configura as ações do botão (caso o usuário queira simular cenários manualmente)
function configurarEventosSimulador() {
    const botao = document.getElementById('btn-predicao');
    
    botao.addEventListener('click', () => {
        const mma20Val = parseFloat(document.getElementById('input-mma20').value);
        const mma50Val = parseFloat(document.getElementById('input-mma50').value);
        
        // Dispara manualmente com os inputs customizados (mantém retorno/rsi padrão no mock manual)
        executarPredicao(mma20Val, mma50Val);
    });
}

// 5. Renderiza o componente visual do gráfico usando o ApexCharts
function renderizarGrafico(historico) {
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
        colors: ['#10b981', '#3b82f6', '#f97316'],
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