// app.js completo com lógica de gráfico Chart.js

let meuGrafico = null; // Variável para controlar o gráfico e evitar erro de 'canvas in use'

document.addEventListener('DOMContentLoaded', () => {
    configurarFormulario();
    carregarDadosIniciais();
});

function configurarFormulario() {
    console.log("Formulário configurado.");
    const btnPredict = document.getElementById('btn-predict');
    if (btnPredict) {
        btnPredict.addEventListener('click', () => {
            console.log("Executando Predição...");
            // ... lógica de predição ...
        });
    }
}

async function carregarDadosIniciais() {
    try {
        // Busca o JSON que o GitHub Actions gerou e o Render está lendo
        const response = await fetch('https://previsao-ibovespa-api.onrender.com/backtest');
        const dados = await response.json();
        renderizarGraficoBacktest(dados);
    } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
    }
}

function renderizarGraficoBacktest(dados) {
    const ctx = document.getElementById('historicoGrafico').getContext('2d');
    
    // Destrói o gráfico anterior se ele existir
    if (meuGrafico) {
        meuGrafico.destroy();
    }

    // Estrutura os dados para o Chart.js
    const labels = dados.evolucao.map(d => d.data);
    const dataEstrategia = dados.evolucao.map(d => d.estrategia);
    const dataBH = dados.evolucao.map(d => d.buy_and_hold);

    // Cria o gráfico
    meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Sinal IBOVESPA MLE',
                    data: dataEstrategia,
                    borderColor: '#10b981', // Verde Esmeralda
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Buy & Hold',
                    data: dataBH,
                    borderColor: '#64748b', // Slate 500
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
            },
            plugins: {
                legend: { labels: { color: '#f1f5f9' } } // Slate 100
            }
        }
    });
}