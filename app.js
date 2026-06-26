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
        
        if (dados && !dados.error) {
            if (dados.historico) {
                renderizarGrafico(dados.historico);
            }
            
            // Preenche os inputs e roda a simulação automática
            if (dados.mma_20 && dados.mma_50) {
                document.getElementById('mma20').value = dados.mma_20.toFixed(2);
                document.getElementById('mma50').value = dados.mma_50.toFixed(2);
                
                executarPredicaoReal(dados.mma_20, dados.mma_50);
            }
        }
    } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
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

async function ejecutarPredicaoReal(mma20Val, mma50Val) {
    const resultadoDiv = document.getElementById('resultado-predicao');
    if (!resultadoDiv) return;

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mma_20: mma20Val, mma_50: mma50Val })
        });

        const resultado = await response.json();
        const corTexto = resultado.direcao === "ALTA" ? "text-emerald-400" : "text-rose-400";
        const icone = resultado.direcao === "ALTA" ? "📈" : "📉";

        resultadoDiv.innerHTML = `
            <div class="text-center space-y-3">
                <span class="text-4xl block">${icone}</span>
                <h3 class="text-xl font-black ${corTexto}">Tendência de ${resultado.direcao}</h3>
                <p class="text-sm text-slate-300">Confiança do Modelo: <strong>${(resultado.probabilidade * 100).toFixed(0)}%</strong></p>
                <p class="text-xs text-slate-500 max-w-[250px] mx-auto">
                    Predição automática baseada nos dados atuais do mercado.
                </p>
            </div>
        `;
    } catch (error) {
        console.error("Erro na predição:", error);
        resultadoDiv.innerHTML = `
            <div class="text-center space-y-2">
                <span class="text-3xl block">❌</span>
                <h3 class="text-rose-400 font-bold">Erro ao calcular</h3>
            </div>
        `;
    }
}

function configurarFormulario() {
    const form = document.getElementById('form-simulador');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const mma20Val = parseFloat(document.getElementById('mma20').value);
            const mma50Val = parseFloat(document.getElementById('mma50').value);
            ejecutarPredicaoReal(mma20Val, mma50Val);
        });
    }
}