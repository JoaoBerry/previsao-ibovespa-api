// Configuração da URL base da API no Render (sem barra no final para evitar erro //)
const API_BASE_URL = 'https://previsao-ibovespa-api.onrender.com';

// Executado automaticamente assim que a página carrega
document.addEventListener('DOMContentLoaded', () => {
    carregarDadosIniciais();
    configurarFormulario();
});

// 1. Busca as médias móveis reais do mercado via API (Yahoo Finance)
async function carregarDadosIniciais() {
    const statusTag = document.getElementById('api-status');
    console.log("Carregando dados de mercado reais...");

    try {
        const response = await fetch(`${API_BASE_URL}/dados-reais`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const dados = await response.json();
        
        // Preenche os inputs do simulador com os dados reais coletados
        document.getElementById('mma20').value = Math.round(dados.mma_20);
        document.getElementById('mma50').value = Math.round(dados.mma_50);
        
        // Atualiza o badge para conectado com sucesso
        if (statusTag) {
            statusTag.textContent = 'API Conectada';
            statusTag.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        }

        // Executa a primeira predição automatizada com os dados reais
        realizarPredicao(dados.mma_20, dados.mma_50);

    } catch (error) {
        console.warn("Não foi possível carregar os dados em tempo real automaticamente. O simulador manual continua ativo.", error);
        if (statusTag) {
            statusTag.textContent = 'Modo Manual / API Offline';
            statusTag.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30';
        }
    }
}

// 2. Configura o evento de clique do botão do formulário
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

// 3. Envia os dados para a rota do modelo de IA e renderiza o resultado na tela
async function realizarPredicao(mma20, mma50) {
    const resultadoContainer = document.getElementById('resultado-predicao');
    
    // Efeito visual de carregando provisório
    resultadoContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center space-y-3 animate-pulse">
            <div class="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm text-slate-400">Consultando inteligência artificial...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mma_20: mma20,
                mma_50: mma50
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        const resultado = await response.json();
        atualizarInterfaceResultado(resultado);

    } catch (error) {
        console.error("Error: Erro ao calcular a predição.", error);
        resultadoContainer.innerHTML = `
            <div class="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                ⚠️ Falha ao processar predição no servidor. Verifique os parâmetros informados.
            </div>
        `;
    }
}

// 4. Renderiza os cards de ALTA ou BAIXA dinamicamente baseados na resposta da IA
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
        <div class="text-center p-6 ${corBg} border ${corBorda} rounded-2xl flex flex-col items-center justify-center space-y-4 animate-fade-in">
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