const API_BASE_URL = "https://previsao-ibovespa-api.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a verificação de conexão
    verificarConexao();
    configurarBotaoExecutar();
});

async function verificarConexao() {
    const statusBanner = document.getElementById('status-banner');
    
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
            if (statusBanner) {
                statusBanner.innerText = "ONLINE - API Conectada";
                statusBanner.style.color = "#10b981"; // Verde sucesso
            }
            // Conexão confirmada, agora carrega os dados
            carregarDadosIniciais();
        }
    } catch (error) {
        console.error("API offline ou bloqueada pelo CORS:", error);
        if (statusBanner) statusBanner.innerText = "Conectando à API...";
    }
}

async function carregarDadosIniciais() {
    try {
        const response = await fetch(`${API_BASE_URL}/dados-reais`);
        const dados = await response.json();
        
        if (dados && !dados.error) {
            console.log("Dados carregados com sucesso:", dados);
            // Aqui você chamaria sua função de renderização de gráfico, ex:
            // renderizarGrafico(dados);
        }
    } catch (error) {
        console.error("Erro ao buscar dados-reais:", error);
    }
}

function configurarBotaoExecutar() {
    const btn = document.getElementById('btn-predict');
    if (btn) {
        btn.addEventListener('click', () => {
            alert("Modelo executando...");
        });
    }
}