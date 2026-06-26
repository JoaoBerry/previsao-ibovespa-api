const API_BASE_URL = "https://previsao-ibovespa-api.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    verificarConexao();
    configurarFormulario();
});

async function verificarConexao() {
    const statusBanner = document.getElementById('api-status');
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
            statusBanner.innerText = "ONLINE - API Conectada";
            statusBanner.className = "px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
            carregarDadosIniciais();
        }
    } catch (error) {
        console.error("Erro de conexão:", error);
    }
}

async function carregarDadosIniciais() {
    try {
        const response = await fetch(`${API_BASE_URL}/dados-reais`);
        const dados = await response.json();
        
        console.log("Dados recebidos da API:", dados); // Veja no console (F12)

        if (dados && dados.historico) {
            renderizarGrafico(dados.historico);
        }
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

function renderizarGrafico(historico) {
    const container = document.getElementById('container-grafico');
    
    // --- VERIFICAÇÃO DE ID ---
    if (!container) {
        console.error("ERRO: O elemento com id 'container-grafico' NÃO foi encontrado no seu HTML!");
        return;
    }
    
    container.innerHTML = ""; // Limpa o texto "Carregando..."
    
    const options = {
        series: [{ name: 'Fechamento', data: historico.map(d => d.fechamento) }],
        chart: { type: 'line', height: 320, toolbar: { show: false } },
        xaxis: { categories: historico.map(d => d.data) },
        stroke: { curve: 'smooth', colors: ['#10b981'] }
    };
    
    const chart = new ApexCharts(container, options);
    chart.render();
}

function configurarFormulario() {
    const form = document.getElementById('form-simulador');
    if (form) {
        form.addEventListener('submit', (e) => { e.preventDefault(); alert("Processando..."); });
    }
}