import requests
import yfinance as yf

# 1. Configurações da API local do FastAPI
API_URL = "http://127.0.0.1:8000/predict"

def obter_dados_e_prever():
    print("📥 Buscando dados históricos do Ibovespa via Yahoo Finance...")
    
    # Baixa o histórico do Ibovespa (^BVSP). 
    ticker = yf.Ticker("^BVSP")
    dados = ticker.history(period="3mo")
    
    if dados.empty:
        print("❌ Erro ao buscar dados do Yahoo Finance.")
        return

    print("📊 Calculando os novos indicadores técnicos (Médias Móveis, Retorno e RSI)...")
    # A) Suas médias móveis atuais
    dados['MMA_20'] = dados['Close'].rolling(window=20).mean()
    dados['MMA_50'] = dados['Close'].rolling(window=50).mean()
    
    # B) Retorno Diário (Entende a volatilidade recente)
    dados['Retorno'] = dados['Close'].pct_change()
    
    # C) Cálculo do RSI (Relative Strength Index) de 14 dias
    delta = dados['Close'].diff()
    ganho = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    perda = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    
    rs = ganho / (perda + 1e-10)  # Evita divisão por zero
    dados['RSI'] = 100 - (100 / (1 + rs))
    
    # Pega a última linha do DataFrame (os dados do dia mais recente calculado)
    ultima_linha = dados.iloc[-1]
    
    mma_20_atual = float(ultima_linha['MMA_20'])
    mma_50_atual = float(ultima_linha['MMA_50'])
    retorno_atual = float(ultima_linha['Retorno'])
    rsi_atual = float(ultima_linha['RSI'])
    data_atual = ultima_linha.name.strftime('%d/%m/%Y')
    
    print(f"\n📈 Dados atuais obtidos ({data_atual}):")
    print(f"   - MMA 20: {mma_20_atual:.2f}")
    print(f"   - MMA 50: {mma_50_atual:.2f}")
    print(f"   - Retorno Diário: {retorno_atual * 100:.2f}%")
    print(f"   - RSI (14): {rsi_atual:.2f}")
    
    # 2. Monta o JSON atualizado com as novas features para a API
    payload = {
        "mma_20": mma_20_atual,
        "mma_50": mma_50_atual,
        "retorno": retorno_atual,
        "rsi": rsi_atual
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