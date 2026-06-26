document.addEventListener('DOMContentLoaded', () => {
    configurarFormulario();
    carregarDadosIniciais();
});

function configurarFormulario() {
    console.log("Formulário configurado com sucesso.");
    // Adicione aqui a lógica de 'addEventListener' para o botão Executar
}

async function carregarDadosIniciais() {
    try {
        console.log("Carregando backtest...");
        const response = await fetch('https://raw.githubusercontent.com/JoaoBerry/previsao-ibovespa-api/main/backtest_results.json');
        const dados = await response.json();
        renderizarGraficoBacktest(dados);
    } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
    }
}

function renderizarGraficoBacktest(dados) {
    console.log("Renderizando gráfico com:", dados);
    // Aqui entra a sua biblioteca de gráficos (como Chart.js ou ApexCharts)
    // Exemplo: document.getElementById('container-grafico').innerText = JSON.stringify(dados);
}