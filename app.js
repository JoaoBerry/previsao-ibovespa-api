// Configuração da URL da sua API no Render
const API_BASE_URL = "https://previsao-ibovespa-api.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    verificarConexao();
    configurarFormulario();
    carregarDadosIniciais();
});

async function verificarConexao() {
    const statusBanner = document.getElementById('status-banner'); // Ajuste o ID conforme seu HTML
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
            statusBanner.innerText = "ONLINE - API Conectada";
            statusBanner.style.color = "#10b981"; // Verde
        }
    } catch (error) {
        statusBanner.innerText = "Conectando à API...";
        statusBanner.style.color = "#f59e0b"; // Amarelo
    }
}

async function carregarDadosIniciais() {
    try {
        const response = await fetch(`${API_BASE_URL}/dados-reais`);
        const dados = await response.json();
        
        if (!dados.error) {
            renderizarGraficoBacktest(dados);
        }
    } catch (error) {
        console.error("Erro ao conectar na API:", error);
    }
}

function configurarFormulario() {
    const btn = document.getElementById('btn-predict');
    if (btn) {
        btn.addEventListener('click', async () => {
            const mma20 = document.getElementById('mma_20').value;
            const mma50 = document.getElementById('mma_50').value;
            
            const response = await fetch(`${API_BASE_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mma_20: parseFloat(mma20), mma_50: parseFloat(mma50) })
            });
            const resultado = await response.json();
            alert("Predição: " + resultado.direcao);
        });
    }
}

function renderizarGraficoBacktest(dados) {
    console.log("Dados carregados para o gráfico:", dados);
    // Aqui sua lógica de biblioteca de gráficos (Chart.js ou similar)
}