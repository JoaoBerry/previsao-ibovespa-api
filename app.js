const API_BASE_URL = 'https://previsao-ibovespa-api.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Tenta acordar o servidor antes de carregar os dados
    acordarServidor();
    
    // 2. Aguarda um curto tempo para o servidor responder e carrega as duas rotas
    setTimeout(() => {
        carregarDadosIniciais();
        carregarBacktest(); 
    }, 2000); 
    
    configurarFormulario();
});

// Função para enviar uma requisição leve e "acordar" o servidor do Render
async function acordarServidor() {
    console.log("Acordando servidor...");
    try {
        await fetch(`${API_BASE_URL}/`);
    } catch (error) {
        console.log("Servidor em fase de inicialização...");
    }
}

// Busca os dados em tempo real e o lote histórico da API
async function carregarDadosIniciais() {
    const statusTag = document.getElementById('api-status');
    
    try {
        const response = await fetch(`${API_BASE_URL}/dados-reais`);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        const dados = await response.json();
        
        document.getElementById('mma20').value = Math.round(dados.mma_20);
        document.getElementById('mma50').value = Math.round(dados.mma_50);
        
        statusTag.textContent = 'API Conectada';
        statusTag.className = 'px-4 py-2 text-sm font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';

        if (dados.historico) renderizarGraficoHistorico(dados.historico);

    } catch (error) {
        console.warn("API ainda offline. Tentando novamente em breve...", error);
        statusTag.textContent = 'Aguardando Servidor...';
        statusTag.className = 'px-4 py-2 text-sm font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse';
        
        // Tentativa de reconexão automática após 5 segundos
        setTimeout(carregarDadosIniciais, 5000);
    }
}

function configurarFormulario() {
    const form = document.getElementById('form-simulador');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const mma20 = parseFloat(document.getElementById('mma20').value);
            const mma50 = parseFloat(document.getElementById('mma50').value);
            await realizarPredicao(mma20, mma50);
        });
    }
}

async function realizarPredicao(mma20, mma50) {
    const resultadoContainer = document.getElementById('resultado-predicao');
    resultadoContainer.innerHTML = `<div class="text-sm text-slate-400 animate-pulse mt-10">Consultando IA...</div>`;

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mma_20: mma20, mma_50: mma50 })
        });

        if (!response.ok) throw new Error(`Erro na API`);
        const resultado = await response.json();
        atualizarInterfaceResultado(resultado);

    } catch (error) {
        resultadoContainer.innerHTML = `<div class="text-rose-400 text-sm mt-10">Erro ao conectar com a IA.</div>`;
    }
}

function atualizarInterfaceResultado(resultado) {
    const container = document.getElementById('resultado-predicao');
    const ehAlta = resultado.predicao === 1;
    const corTexto = ehAlta ? 'text-emerald-400' : 'text-rose-400';
    const corBg = ehAlta ? 'bg-emerald-500/10' : 'bg-rose-500/10';
    const corBorda = ehAlta ? 'border-emerald-500/20' : 'border-rose-500/20';

    container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full w-full ${corBg} border ${corBorda} rounded-xl p-6 transition-all">
            <span class="text-5xl mb-4">${ehAlta ? '🚀' : '📉'}</span>
            <h3 class="text-2xl font-bold ${corTexto}">Tendência de ${ehAlta ? 'ALTA' : 'BAIXA'}</h3>
            <div class="mt-6 bg-[#0f172a] px-6 py-3 rounded-lg border border-slate-800 w-full max-w-[200px]">
                <span class="text-xs text-slate-500 block mb-1">CONFIANÇA DO MODELO</span>
                <span class="text-xl font-bold text-white">${(resultado.probabilidade * 100).toFixed(1)}%</span>
            </div>
        </div>
    `;
}

function renderizarGraficoHistorico(historico) {
    const opcoes = {
        series: [
            { name: 'Preço', data: historico.map(h => h.fechamento) },
            { name: 'MMA 20', data: historico.map(h => h.mma_20) },
            { name: 'MMA 50', data: historico.map(h => h.mma_50) }
        ],
        chart: { type: 'line', height: 320, width: '100%', toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent' },
        colors: ['#64748b', '#10b981', '#f43f5e'],
        stroke: { curve: 'smooth', width: [2, 3, 3], dashArray: [4, 0, 0] },
        theme: { mode: 'dark' },
        xaxis: { categories: historico.map(h => h.data), tooltip: { enabled: false } },
        yaxis: { labels: { formatter: (value) => value.toFixed(0) } },
        tooltip: { theme: 'dark' },
        legend: { position: 'top', horizontalAlign: 'right' }
    };
    const container = document.getElementById('container-grafico');
    container.innerHTML = '';
    new ApexCharts(container, opcoes).render();
}

// --- FUNÇÕES DE BACKTESTING ---
async function carregarBacktest() {
    try {
        const response = await fetch(`${API_BASE_URL}/backtest`);
        if (!response.ok) throw new Error("Erro ao carregar backtest");
        
        const dados = await response.json();
        
        // Atualiza os cards removendo a animação de pulse
        const cardAcuracia = document.getElementById('card-acuracia');
        const cardRetornoIa = document.getElementById('card-retorno-ia');
        const cardRetornoMercado = document.getElementById('card-retorno-mercado');

        cardAcuracia.className = "bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl text-center";
        cardAcuracia.innerHTML = `
            <span class="text-slate-400 text-xs font-bold tracking-wider">ACURÁCIA DA IA</span>
            <div class="text-2xl font-bold text-blue-400 mt-1">${(dados.acuracia_backtest * 100).toFixed(1)}%</div>
        `;

        cardRetornoIa.className = "bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl text-center";
        cardRetornoIa.innerHTML = `
            <span class="text-emerald-400/80 text-xs font-bold tracking-wider">RETORNO ESTRATÉGIA IA</span>
            <div class="text-2xl font-bold text-emerald-400 mt-1">${dados.retorno_modelo_pct}%</div>
        `;

        cardRetornoMercado.className = "bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl text-center";
        cardRetornoMercado.innerHTML = `
            <span class="text-slate-400 text-xs font-bold tracking-wider">RETORNO IBOVESPA</span>
            <div class="text-2xl font-bold text-slate-300 mt-1">${dados.retorno_bh_pct}%</div>
        `;

        renderizarGraficoBacktest(dados.evolucao);

    } catch (error) {
        console.error("Erro no Backtest:", error);
        document.getElementById('container-grafico-backtest').innerHTML = 
            `<div class="text-rose-400 text-center py-10 text-sm">Erro ao executar a simulação algorítmica histórica.</div>`;
    }
}

function renderizarGraficoBacktest(evolucao) {
    const opcoes = {
        series: [
            { name: 'Estratégia IA', data: evolucao.map(e => e.estrategia) },
            { name: 'Buy & Hold (Ibovespa)', data: evolucao.map(e => e.buy_and_hold) }
        ],
        chart: { type: 'area', height: 350, width: '100%', toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent' },
        colors: ['#10b981', '#64748b'],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: [3, 2], dashArray: [0, 4] },
        theme: { mode: 'dark' },
        xaxis: { categories: evolucao.map(e => e.data), tickAmount: 6, tooltip: { enabled: false } },
        yaxis: { labels: { formatter: (value) => `R$ ${value.toFixed(0)}` } },
        tooltip: { theme: 'dark', y: { formatter: (value) => `R$ ${value.toFixed(2)}` } },
        legend: { position: 'top', horizontalAlign: 'right' }
    };
    
    const container = document.getElementById('container-grafico-backtest');
    container.innerHTML = ''; 
    new ApexCharts(container, opcoes).render();
}