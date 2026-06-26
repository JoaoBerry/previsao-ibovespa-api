const API_BASE_URL = 'https://previsao-ibovespa-api.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Tenta acordar o servidor antes de carregar os dados
    acordarServidor();
    // 2. Aguarda um curto tempo para o servidor responder e carrega os dados
    setTimeout(carregarDadosIniciais, 2000); 
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
        statusTag.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';

        if (dados.historico) renderizarGraficoHistorico(dados.historico);
        realizarPredicao(dados.mma_20, dados.mma_50);

    } catch (error) {
        console.warn("API ainda offline. Tentando novamente em breve...", error);
        statusTag.textContent = 'Aguardando Servidor...';
        statusTag.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse';
        
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
    resultadoContainer.innerHTML = `<div class="text-sm text-slate-400 animate-pulse">Consultando IA...</div>`;

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
        resultadoContainer.innerHTML = `<div class="text-red-400 text-sm">Erro ao conectar com a IA.</div>`;
    }
}

function atualizarInterfaceResultado(resultado) {
    const container = document.getElementById('resultado-predicao');
    const ehAlta = resultado.predicao === 1;
    const corTexto = ehAlta ? 'text-emerald-400' : 'text-rose-400';
    const corBg = ehAlta ? 'bg-emerald-500/10' : 'bg-rose-500/10';
    const corBorda = ehAlta ? 'border-emerald-500/20' : 'border-rose-500/20';

    container.innerHTML = `
        <div class="text-center p-6 ${corBg} border ${corBorda} rounded-2xl animate-fade-in">
            <span class="text-4xl">${ehAlta ? '🚀' : '📉'}</span>
            <h3 class="text-xl font-bold ${corTexto} mt-2">${ehAlta ? 'Tendência de ALTA' : 'Tendência de BAIXA'}</h3>
            <div class="mt-4 bg-slate-900/60 p-2 rounded-lg">
                <span class="text-xs text-slate-500 block">CONFIAÇA</span>
                <span class="text-lg font-bold">${(resultado.probabilidade * 100).toFixed(1)}%</span>
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
        chart: { type: 'line', height: 320, toolbar: { show: false }, zoom: { enabled: false } },
        colors: ['#475569', '#10b981', '#f43f5e'],
        stroke: { curve: 'smooth', width: [2, 3, 3], dashArray: [4, 0, 0] },
        theme: { mode: 'dark' },
        xaxis: { categories: historico.map(h => h.data) },
        tooltip: { theme: 'dark' }
    };
    const container = document.getElementById('container-grafico');
    container.innerHTML = '';
    new ApexCharts(container, opcoes).render();
}