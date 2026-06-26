const API_BASE_URL = "https://previsao-ibovespa-api.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    verificarConexao();
    configurarFormulario();
});

async function verificarConexao() {
    const statusBanner = document.getElementById('status-banner');
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok && statusBanner) {
            statusBanner.innerText = "ONLINE - API Conectada";
            statusBanner.style.color = "#10b981";
        }
    } catch (error) {
        if (statusBanner) statusBanner.innerText = "Conectando à API...";
    }
}

function configurarFormulario() {
    const btn = document.getElementById('btn-predict');
    if (btn) {
        btn.addEventListener('click', async () => {
            // Lógica de envio de predição
        });
    }
}