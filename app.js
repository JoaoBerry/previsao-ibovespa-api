const API_BASE_URL = "https://previsao-ibovespa-api.onrender.com";

document.addEventListener('DOMContentLoaded', async () => {
    const statusBanner = document.getElementById('api-status');
    
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
            statusBanner.innerText = "ONLINE - API Conectada";
            statusBanner.className = "px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
            
            // Carrega os dados
            const dadosResponse = await fetch(`${API_BASE_URL}/dados-reais`);
            const dados = await dadosResponse.json();
            
            if (dados.historico) {
                renderizarGrafico(dados.historico);
            }
        }
    } catch (error) {
        console.error("Erro na conexão:", error);
    }
});

function renderizarGrafico(historico) {
    const container = document.getElementById('container-grafico');
    container.innerHTML = ""; // Limpa o carregando
    
    const options = {
        series: [{ name: 'Fechamento', data: historico.map(d => d.fechamento) }],
        chart: { type: 'line', height: 320, toolbar: { show: false } },
        xaxis: { categories: historico.map(d => d.data) },
        stroke: { curve: 'smooth', colors: ['#10b981'] }
    };
    
    new ApexCharts(container, options).render();
}