const API_BASE_URL = 'https://previsao-ibovespa-api.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    acordarServidor();
    // Inicia o carregamento com a estratégia de retry
    carregarDadosIniciais();
    carregarBacktest();
    configurarFormulario();
});

// Função para enviar uma requisição leve e "acordar" o servidor
async function acordarServidor() {
    try {
        await fetch(`${API_BASE_URL}/`);
    } catch (error) {
        console.log("Servidor em fase de inicialização...");
    }
}

// Função robusta de busca (Retry Logic)
async function fetchComRetry(url, tentativas = 10) {
    for (let i = 0; i < tentativas; i++) {
        try {
            const res = await fetch(url);
            if (res.ok) return await res.json();
            throw new Error('API não respondeu com sucesso');
        } catch (e) {
            console.log(`Tentativa ${i + 1} de ${tentativas}...`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Aguarda 5s entre tentativas
        }
    }
    throw new Error('API indisponível após várias tentativas');
}

async function carregarDadosIniciais() {
    const statusTag = document.getElementById('api-status');
    try {
        const dados = await fetchComRetry(`${API_BASE_URL}/dados-reais`);
        
        document.getElementById('mma20').value = Math.round(dados.mma_20);
        document.getElementById('mma50').value = Math.round(dados.mma_50);
        
        statusTag.textContent = 'API Conectada';
        statusTag.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';

        if (dados.historico) renderizarGraficoHistorico(dados.historico);
    } catch (e) {
        statusTag.textContent = 'Erro de Conexão';
    }
}

async function carregarBacktest() {
    const container = document.getElementById('container-grafico-backtest');
    try {
        const dados = await fetchComRetry(`${API_BASE_URL}/backtest`);
        
        // Remove animação de carregamento
        document.querySelectorAll('[id^="card-"]').forEach(el => el.classList.remove('animate-pulse'));

        document.getElementById('card-acuracia').innerHTML = `
            <span class="text-slate-500 text-[10px] font-bold tracking-wider uppercase">Acurácia da IA</span>
            <div class="text-xl font-bold text-blue-400 mt-1">${(dados.acuracia_backtest * 100).toFixed(1)}%</div>`;
        
        document.getElementById('card-retorno-ia').innerHTML = `
            <span class="text-slate-500 text-[10px] font-bold tracking-wider uppercase">Retorno Estratégia IA</span>
            <div class="text-xl font-bold text-emerald-400 mt-1">${dados.retorno_modelo_pct}%</div>`;
            
        document.getElementById('card-retorno-mercado').innerHTML = `
            <span class="text-slate-500 text-[10px] font-bold tracking-wider uppercase">Retorno Ibovespa</span>
            <div class="text-xl font-bold text-slate-300 mt-1">${dados.retorno_bh_pct}%</div>`;

        renderizarGraficoBacktest(dados.evolucao);
    } catch (e) {
        container.innerHTML = `<p class="text-rose-500 text-xs">Erro ao carregar simulação histórica após múltiplas tentativas.</p>`;
    }
}

function configurarFormulario() {
    const form = document.getElementById('form-simulador');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mma20 = document.getElementById('mma20').value;
        const mma50 = document.getElementById('mma50').value;
        
        const res = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mma_20: parseFloat(mma20), mma_50: parseFloat(mma50) })
        });
        const resultado = await res.json();
        
        const container = document.getElementById('resultado-predicao');
        container.innerHTML = `
            <div class="text-center animate-fade-in">
                <span class="text-4xl block">${resultado.predicao === 1 ? '🚀' : '📉'}</span>
                <h3 class="text-xl font-bold ${resultado.predicao === 1 ? 'text-emerald-400' : 'text-rose-400'} mt-2">
                    Tendência de ${resultado.direcao}
                </h3>
                <p class="text-xs text-slate-500 mt-1">Confiança: ${(resultado.probabilidade * 100).toFixed(1)}%</p>
            </div>
        `;
    });
}

function renderizarGraficoHistorico(historico) {
    const opcoes = {
        series: [{ name: 'Preço', data: historico.map(h => h.fechamento) }],
        chart: { type: 'area', height: 320, background: 'transparent', toolbar: { show: false } },
        colors: ['#3b82f6'],
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0 } },
        xaxis: { categories: historico.map(h => h.data) },
        theme: { mode: 'dark' }
    };
    new ApexCharts(document.getElementById('container-grafico'), opcoes).render();
}

function renderizarGraficoBacktest(evolucao) {
    const opcoes = {
        series: [
            { name: 'IA', data: evolucao.map(e => e.estrategia) },
            { name: 'Ibovespa', data: evolucao.map(e => e.buy_and_hold) }
        ],
        chart: { type: 'line', height: 320, toolbar: { show: false } },
        colors: ['#10b981', '#64748b'],
        stroke: { curve: 'smooth', width: 3 },
        theme: { mode: 'dark' },
        xaxis: { categories: evolucao.map(e => e.data) }
    };
    const container = document.getElementById('container-grafico-backtest');
    container.innerHTML = '';
    new ApexCharts(container, opcoes).render();
}