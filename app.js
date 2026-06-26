const API_BASE_URL = "https://previsao-ibovespa-api.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    verificarConexao();
    configurarFormulario();
});

async function verificarConexao() {
    const statusBanner = document.getElementById('api-status'); // ID CORRIGIDO AQUI
    
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
        console.log("Dados recebidos:", dados);
        // Aqui você pode chamar suas funções de gráfico (ApexCharts)
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

function configurarFormulario() {
    const form = document.getElementById('form-simulador');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert("Modelo processando...");
        });
    }
}