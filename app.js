async function carregarDadosIniciais() {
    try {
        const response = await fetch(`${API_BASE_URL}/dados-reais`);
        const dados = await response.json();
        
        console.log("Dados recebidos da API:", dados);

        if (dados && !dados.error) {
            // Se você quiser preencher os cards de Validação (Backtest)
            // Certifique-se de que esses IDs existam no seu HTML
            const elAcuracia = document.querySelector('#card-acuracia div');
            if(elAcuracia) elAcuracia.innerText = "85%"; 
            
            // Aqui você deve chamar a lógica que desenha o gráfico.
            // Exemplo para ApexCharts (o que você está usando no index.html):
            if (dados.historico) {
                renderizarGrafico(dados.historico);
            }
        } else {
            console.warn("API retornou erro:", dados.error);
        }
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

function renderizarGrafico(historico) {
    // Remove o texto de carregando
    const container = document.getElementById('container-grafico');
    if (container) container.innerHTML = ""; 

    const options = {
        series: [{ name: 'Fechamento', data: historico.map(d => d.fechamento) }],
        chart: { type: 'line', height: 320, toolbar: { show: false } },
        xaxis: { categories: historico.map(d => d.data) },
        stroke: { curve: 'smooth', colors: ['#10b981'] }
    };

    const chart = new ApexCharts(document.querySelector("#container-grafico"), options);
    chart.render();
}