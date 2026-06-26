import requests
import yfinance as yf

# 1. Configurações da API local do FastAPI
API_URL = "http://127.0.0.1:8000/predict"

def obter_dados_e_prever():
    print("📥 Buscando dados históricos do Ibovespa via Yahoo Finance...")
    
    # Baixa o histórico do Ibovespa (^BVSP). 
    # Precisamos de pelo menos uns 3 meses para calcular a média de 50 dias sem problemas.
    ticker = yf.Ticker("^BVSP")
    dados = ticker.history(period="3mo")
    
    if dados.empty:
        print("❌ Erro ao buscar dados do Yahoo Finance.")
        return

    print("📊 Calculando as Médias Móveis (MMA_20 e MMA_50)...")
    # Calcula as médias móveis com base no preço de fechamento ('Close')
    dados['MMA_20'] = dados['Close'].rolling(window=20).mean()
    dados['MMA_50'] = dados['Close'].rolling(window=50).mean()
    
    # Pega a última linha do DataFrame (os dados mais recentes calculados)
    ultima_linha = dados.iloc[-1]
    
    mma_20_atual = float(ultima_linha['MMA_20'])
    mma_50_atual = float(ultima_linha['MMA_50'])
    data_atual = ultima_linha.name.strftime('%d/%m/%Y')
    
    print(f"\n📈 Dados atuais obtidos ({data_atual}):")
    print(f"   - MMA 20: {mma_20_atual:.2f}")
    print(f"   - MMA 50: {mma_50_atual:.2f}")
    
    # 2. Monta o JSON para enviar para a nossa API FastAPI
    payload = {
        "mma_20": mma_20_atual,
        "mma_50": mma_50_atual
    }
    
    print("\n📡 Enviando dados para a API de Machine Learning...")
    try:
        response = requests.post(API_URL, json=payload)
        
        if response.status_code == 200:
            resultado = response.json()
            print("✅ Resposta recebida da API com sucesso!")
            print(f"🔮 Tendência Prevista pelo Modelo: {resultado['tendencia_prevista']} (Código: {resultado['codigo_predicao']})")
        else:
            print(f"❌ Erro na API: Status {response.status_code} - {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Erro de Conexão: Certifique-se de que o uvicorn está rodando na porta 8000!")

if __name__ == "__main__":
    obter_dados_e_prever()