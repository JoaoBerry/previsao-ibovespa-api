const API_BASE_URL = 'https://previsao-ibovespa-api.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    // Tenta acordar o servidor
    fetch(`${API_BASE_URL}/`).catch(() => console.log("Servidor acordando..."));
    
    // Inicia os carregamentos
    carregarDadosIniciais();
    carregarBacktest();
    configurarFormulario();
});

async function carregarDadosIniciais() {
    try {
        const res = await fetch(`${API_BASE_URL}/dados-reais`);
        const dados = await res.json();
        
        document.getElementById('mma20').value = Math.round(dados.mma_20);
        document.getElementById('mma50').value = Math.round(dados.mma_50);
        
        // Se carregou, dispara a predição
        document.getElementById('form-simulador').dispatchEvent(new Event('submit'));
        
        if (dados.historico) renderizarGraficoHistorico(dados.historico);
    } catch (e) {
        console.error("Erro ao carregar dados iniciais");
    }
}

async function carregarBacktest() {
    const container = document.getElementById('container-grafico-backtest');
    try {
        // Timeout de 20s para não ficar travado
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        
        const res = await fetch(`${API_BASE_URL}/backtest`, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!res.ok) throw new Error();
        const dados = await res.json();
        
        // Preenche os dados
        document.getElementById('card-acuracia').innerHTML = `<div class="text-xl font-bold text-blue-400">${(dados.acuracia_backtest * 100).toFixed(1)}%</div>`;
        document.getElementById('card-retorno-ia').innerHTML = `<div class="text-xl font-bold text-emerald-400">${dados.retorno_modelo_pct}%</div>`;
        document.getElementById('card-retorno-mercado').innerHTML = `<div class="text-xl font-bold text-slate-300">${dados.retorno_bh_pct}%</div>`;
        
        renderizarGraficoBacktest(dados.evolucao);
    } catch (e) {
        container.innerHTML = `<p class="text-rose-500 text-xs p-4">Simulação indisponível no momento.</p>`;
    }
}

// ... manter as outras funções (configurarFormulario, renderizarGrafico, etc) exatamente como estão.