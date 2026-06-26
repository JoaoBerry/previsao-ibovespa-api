const API_BASE_URL = 'https://previsao-ibovespa-api.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Ações rápidas (Interface principal)
    acordarServidor();
    configurarFormulario();
    
    // 2. Carregamento de dados (Interface de indicadores)
    carregarDadosIniciais();
    
    // 3. Carregamento pesado (Backtest - Processado de forma assíncrona)
    // Não usamos 'await' aqui para não travar a execução do resto do script
    carregarBacktest();
});

// Aquece o servidor
async function acordarServidor() {
    fetch(`${API_BASE_URL}/`).catch(() => console.log("Servidor em repouso..."));
}

// Busca com Timeout para evitar travamentos infinitos
async function fetchWithTimeout(url, options = {}, timeout = 30000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
}

async function carregarDadosIniciais() {
    const statusTag = document.getElementById('api-status');
    try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/dados-reais`);
        const dados = await res.json();
        
        document.getElementById('mma20').value = Math.round(dados.mma_20);
        document.getElementById('mma50').value = Math.round(dados.mma_50);
        
        statusTag.textContent = 'API Conectada';
        statusTag.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';

        if (dados.historico) renderizarGraficoHistorico(dados.historico);
    } catch (e) {
        statusTag.textContent = 'Aguardando servidor...';
    }
}

async function carregarBacktest() {
    const container = document.getElementById('container-grafico-backtest');
    
    try {
        // Tentativa única, mas otimizada
        const res = await fetchWithTimeout(`${API_BASE_URL}/backtest`);
        if (!res.ok) throw new Error();
        const dados = await res.json();
        
        // Remove animação de loading apenas quando chegar os dados
        document.querySelectorAll('[id^="card-"]').forEach(el => el.classList.remove('animate-pulse'));

        // Atualiza Cards
        document.getElementById('card-acuracia').innerHTML = `
            <span class="text-slate-500 text-[10px] font-bold tracking-wider uppercase">Acurácia da IA</span>
            <div class="text-xl font-bold text-blue-400 mt-1">${(dados.acuracia_backtest * 100).toFixed(1)}%</div>`;
        
        document.getElementById('card-retorno-ia').innerHTML = `
            <span class="text-slate-500 text-[10px] font-bold tracking-wider uppercase">Retorno IA</span>
            <div class="text-xl font-bold text-emerald-400 mt-1">${dados.retorno_modelo_pct}%</div>`;
            
        document.getElementById('card-retorno-mercado').innerHTML = `
            <span class="text-slate-500 text-[10px] font-bold tracking-wider uppercase">Retorno Ibov</span>
            <div class="text-xl font-bold text-slate-300 mt-1">${dados.retorno_bh_pct}%</div>`;

        renderizarGraficoBacktest(dados.evolucao);
    } catch (e) {
        container.innerHTML = `<p class="text-rose-500 text-xs p-4">Simulação indisponível no momento.</p>`;
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
        
        document.getElementById('resultado-predicao').innerHTML = `
            <div class="text-center animate-fade-in p-4">
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
    const container = document.getElementById('container-grafico');
    container.innerHTML = '';
    new ApexCharts(container, {
        series: [{ name: 'Preço', data: historico.map(h => h.fechamento) }],
        chart: { type: 'area', height: 320, background: 'transparent', toolbar: { show: false } },
        colors: ['#3b82f6'],
        stroke: { curve: 'smooth', width: 2 },
        theme: { mode: 'dark' },
        xaxis: { categories: historico.map(h => h.data) }
    }).render();
}

function renderizarGraficoBacktest(evolucao) {
    const container = document.getElementById('container-grafico-backtest');
    container.innerHTML = '';
    new ApexCharts(container, {
        series: [
            { name: 'IA', data: evolucao.map(e => e.estrategia) },
            { name: 'Ibovespa', data: evolucao.map(e => e.buy_and_hold) }
        ],
        chart: { type: 'line', height: 320, toolbar: { show: false } },
        colors: ['#10b981', '#64748b'],
        stroke: { curve: 'smooth', width: 3 },
        theme: { mode: 'dark' },
        xaxis: { categories: evolucao.map(e => e.data) }
    }).render();
}