const API_BASE_URL = 'https://previsao-ibovespa-api.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosIniciais();
    configurarFormulario();
});

// 1. Busca os dados em tempo real e o lote histórico da API
async function carregarDadosIniciais() {
    const statusTag = document.getElementById('api-status');
    console.log("Carregando dados de mercado reais e histórico...");

    try {
        const response = await fetch(`${API_BASE_URL}/dados-reais`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const dados = await response.json();
        
        // Preenche os inputs com as médias do último dia
        document.getElementById('mma20').value = Math.round(dados.mma_20);
        document.getElementById('mma50').value = Math.round(dados.mma_50);
        
        if (statusTag) {
            statusTag.textContent = 'API Conectada';
            statusTag.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        }

        // Renderiza o gráfico temporal com o histórico enviado
        if (dados.historico && dados.historico.length > 0) {
            renderizarGraficoHistorico(dados.historico);
        }

        // Faz a predição automática inicial
        realizarPredicao(dados.mma_20, dados.mma_50);

    } catch (error) {
        console.warn("Não foi possível carregar os dados automáticos. Modo manual ativo.", error);
        document.getElementById('container-grafico').innerHTML = `
            <p class="text-xs text-amber-500/60 bg-amber-500/5 px-4 py-2 border border-amber-500/10 rounded-xl">
                ⚠️ Gráfico temporariamente indisponível. Conexão offline com o servidor de dados.
            </p>
        `;
        if (statusTag) {
            statusTag.textContent = 'Modo Manual / API Offline';
            statusTag.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30';
        }
    }
}

// 2. Configura a ação de submit do formulário manual
function configurarFormulario() {
    const form = document.getElementById('form-simulador');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const mma20 = parseFloat(document.getElementById('mma20').value);
            const mma50 = parseFloat(document.getElementById('mma50').value);
            await realizarPredicao(mma20, mma50);
        });
    }
}

// 3. Consulta a IA para gerar a predição (Random Forest)
async function realizarPredicao(mma20, mma50) {
    const resultadoContainer = document.getElementById('resultado-predicao');
    
    resultadoContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center space-y-3 animate-pulse">
            <div class="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm text-slate-400">Consultando inteligência artificial...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mma_20: mma20, mma_50: mma50 })
        });

        if (!response.ok) throw new Error(`Erro na API: ${response.status}`);

        const resultado = await response.json();
        atualizarInterfaceResultado(resultado);

    } catch (error) {
        console.error(error);
        resultadoContainer.innerHTML = `
            <div class="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                ⚠️ Falha ao processar predição no servidor.
            </div>
        `;
    }
}

// 4. Desenha o resultado de alta ou baixa na tela
function atualizarInterfaceResultado(resultado) {
    const resultadoContainer = document.getElementById('resultado-predicao');
    const ehAlta = resultado.predicao === 1 || resultado.direcao === 'ALTA';
    
    const corTexto = ehAlta ? 'text-emerald-400' : 'text-rose-400';
    const corBg = ehAlta ? 'bg-emerald-500/10' : 'bg-rose-500/10';
    const corBorda = ehAlta ? 'border-emerald-500/20' : 'border-rose-500/20';
    const icone = ehAlta ? '🚀' : '📉';
    const titulo = ehAlta ? 'Tendência de ALTA' : 'Tendência de BAIXA';
    const probabilidade = resultado.probabilidade ? `${(resultado.probabilidade * 100).toFixed(1)}%` : 'N/A';

    resultadoContainer.innerHTML = `
        <div class="text-center p-6 ${corBg} border ${corBorda} rounded-2xl flex flex-col items-center justify-center space-y-4 animate-fade-in w-full h-full">
            <span class="text-4xl">${icone}</span>
            <div>
                <h3 class="text-xl font-bold ${corTexto}">${titulo}</h3>
                <p class="text-xs text-slate-400 mt-1">Classificação gerada pelo modelo Random Forest</p>
            </div>
            <div class="bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
                <span class="text-xs text-slate-500 block uppercase tracking-wider font-semibold">Confiança do Modelo</span>
                <span class="text-lg font-bold text-slate-200">${probabilidade}</span>
            </div>
        </div>
    `;
}

// 5. Configura e monta o gráfico de linhas da ApexCharts na div
function renderizarGraficoHistorico(historico) {
    // Separa os dados em arrays limpos que o gráfico aceita
    const categoriasDatas = historico.map(h => h.data);
    const fechamentos = historico.map(h => h.fechamento);
    const mma20Dados = historico.map(h => h.mma_20);
    const mma50Dados = historico.map(h => h.mma_50);

    const opcoes = {
        series: [
            { name: 'Fechamento Ibov', data: fechamentos },
            { name: 'Média Móvel Curta (20d)', data: mma20Dados },
            { name: 'Média Móvel Longa (50d)', data: mma50Dados }
        ],
        chart: {
            type: 'line',
            height: 320,
            background: 'transparent',
            toolbar: { show: false },
            zoom: { enabled: false }
        },
        colors: ['#64748b', '#10b981', '#f43f5e'], // Cores: Cinza, Esmeralda, Rosa
        stroke: {
            curve: 'smooth',
            width: [2, 3, 3],
            dashArray: [4, 0, 0] // Deixa a linha do preço pontilhada e as médias contínuas
        },
        theme: { mode: 'dark' },
        grid: { borderColor: '#334155', strokeDashArray: 3 },
        xaxis: {
            categories: listCategories(categoriasDatas),
            labels: { style: { colors: '#94a3b8' } }
        },
        yaxis: {
            labels: {
                formatter: val => Math.round(val).toLocaleString('pt-BR'),
                style: { colors: '#94a3b8' }
            }
        },
        legend: { labels: { colors: '#f1f5f9' } },
        tooltip: { theme: 'dark' }
    };

    const container = document.getElementById('container-grafico');
    container.innerHTML = ''; // Limpa o texto de carregamento
    const chart = new ApexCharts(container, opcoes);
    chart.render();
}

// Filtra as datas para exibir na escala do eixo X sem poluir o visual
function listCategories(datas) {
    return datas.map((d, i) => (i % 5 === 0 || i === datas.length - 1) ? d : '');
}