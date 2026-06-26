// URL base da sua API FastAPI
const API_BASE_URL = 'http://127.0.0.1:8000';

// Elementos do DOM compartilhados
const placeholder = document.getElementById('result-placeholder');
const content = document.getElementById('result-content');
const card = document.getElementById('result-card');
const badge = document.getElementById('result-badge');
const codeSpan = document.getElementById('result-code');

/**
 * Função responsável por enviar as médias para a API e atualizar o layout
 */
async function realizarPredicao(mma20, mma50) {
    const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mma_20: mma20, mma_50: mma50 })
    });

    if (!response.ok) throw new Error('Erro ao calcular a predição.');
    const data = await response.json();

    // Remove o estado de espera e exibe o resultado
    placeholder.classList.add('hidden');
    content.classList.remove('hidden');
    codeSpan.textContent = data.codigo_predicao;

    // Customização dinâmica baseada no retorno da IA (1 = Alta, 0 = Baixa)
    if (data.codigo_predicao === 1) {
        badge.textContent = "ALTA 📈";
        badge.className = "text-5xl font-black my-4 tracking-tight text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.2)]";
        card.className = "bg-emerald-950/10 border border-emerald-500/20 h-full min-h-[300px] rounded-2xl flex flex-col items-center justify-center text-center p-6 transition-all duration-500 shadow-lg shadow-emerald-950/20";
    } else {
        badge.textContent = "BAIXA 📉";
        badge.className = "text-5xl font-black my-4 tracking-tight text-rose-400 drop-shadow-[0_0_15px_rgba(251,113,133,0.2)]";
        card.className = "bg-rose-950/10 border border-rose-500/20 h-full min-h-[300px] rounded-2xl flex flex-col items-center justify-center text-center p-6 transition-all duration-500 shadow-lg shadow-rose-950/20";
    }
}

// 1. EVENTO AUTOMÁTICO: Executado assim que a página abre no navegador
window.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log("📥 Carregando dados de mercado reais...");
        const response = await fetch(`${API_BASE_URL}/dados-reais`);
        if (!response.ok) throw new Error();
        
        const result = await response.json();
        
        // Alimenta os inputs da tela com os dados vindos da API (Bolsa de Valores)
        document.getElementById('mma20').value = result.mma_20;
        document.getElementById('mma50').value = result.mma_50;
        
        // Roda a predição inicial automaticamente
        await realizarPredicao(result.mma_20, result.mma_50);
        console.log(`✅ Painel atualizado automaticamente com dados de ${result.data}!`);
        
    } catch (error) {
        console.log("⚠️ Não foi possível carregar os dados em tempo real automaticamente. O simulador manual continua ativo.");
    }
});

// 2. EVENTO MANUAL: Monitora o clique no botão (Trata pontos e vírgulas da digitação do usuário)
document.getElementById('predict-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Captura os valores transformando qualquer vírgula em ponto antes de converter para número
    const mma20Raw = document.getElementById('mma20').value.toString().replace(',', '.');
    const mma50Raw = document.getElementById('mma50').value.toString().replace(',', '.');
    
    const mma20 = parseFloat(mma20Raw);
    const mma50 = parseFloat(mma50Raw);

    // Valida se a conversão gerou valores numéricos válidos
    if (!isNaN(mma20) && !isNaN(mma50)) {
        try {
            await realizarPredicao(mma20, mma50);
        } catch (error) {
            alert('Erro ao conectar com a API de Machine Learning.');
            console.error(error);
        }
    } else {
        alert('Por favor, insira valores numéricos válidos.');
    }
});