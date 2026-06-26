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
        if (dados && dados.historico) {
            renderizarGrafico(dados.historico);
        }
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

function renderizarGrafico(historico) {
    const container = document.getElementById('container-grafico');
    if (!container) return;
    container.innerHTML = ""; 
    
    const options = {
        series: [{ name: 'Fechamento', data: historico.map(d => d.fechamento) }],
        chart: { type: 'line', height: 320, toolbar: { show: false } },
        xaxis: { categories: historico.map(d => d.data) },
        stroke: { curve: 'smooth', colors: ['#10b981'] },
        grid: { borderColor: '#334155' }
    };
    
    new ApexCharts(container, options).render();
}

// === FUNÇÃO DO SIMULADOR CORRIGIDA ===
function configurarFormulario() {
    const form = document.getElementById('form-simulador');
    const resultadoDiv = document.getElementById('resultado-predicao');

    if (form && resultadoDiv) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede a página de atualizar
            
            // Pega os valores dos inputs (IDs mma20 e mma50 do seu HTML)
            const mma20Val = parseFloat(document.getElementById('mma20').value);
            const mma50Val = parseFloat(document.getElementById('mma50').value);

            // Coloca o card da direita em estado de carregamento
            resultadoDiv.innerHTML = `
                <div class="text-center space-y-2 animate-pulse">
                    <span class="text-3xl block">⚙️</span>
                    <h3 class="text-slate-300 font-bold">Calculando predição...</h3>
                </div>
            `;

            try {
                // Envia os dados via POST para a rota /predict da sua API
                const response = await fetch(`${API_BASE_URL}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mma_20: mma20Val, mma_50: mma50Val })
                });

                const resultado = await response.json();

                // Define a cor com base na tendência (Verde para alta, Vermelho/Laranja para baixa)
                const corTexto = resultado.direcao === "ALTA" ? "text-emerald-400" : "text-rose-400";
                const icone = resultado.direcao === "ALTA" ? "📈" : "📉";

                // Atualiza o card da direita com a resposta real da Inteligência Artificial
                resultadoDiv.innerHTML = `
                    <div class="text-center space-y-3 animate-fade-in">
                        <span class="text-4xl block">${icone}</span>
                        <h3 class="text-xl font-black ${corTexto}">Tendência de ${resultado.direcao}</h3>
                        <p class="text-sm text-slate-300">Confiança do Modelo: <strong>${(resultado.probabilidade * 100).toFixed(0)}%</strong></p>
                        <p class="text-xs text-slate-500 max-w-[250px] mx-auto">
                            Com base nas médias inseridas, a IA indica uma probabilidade matemática de mercado de movimentação para cima ou para baixo.
                        </p>
                    </div>
                `;
            } catch (error) {
                console.error("Erro na predição:", error);
                resultadoDiv.innerHTML = `
                    <div class="text-center space-y-2">
                        <span class="text-3xl block">❌</span>
                        <h3 class="text-rose-400 font-bold">Erro ao calcular</h3>
                        <p class="text-xs text-slate-500">Não foi possível obter resposta da API.</p>
                    </div>
                `;
            }
        });
    }
}