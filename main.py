from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import yfinance as yf

app = FastAPI()

# Configuração de CORS ultra-permissiva para resolver o bloqueio do navegador
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BACKTEST_URL = "https://raw.githubusercontent.com/JoaoBerry/previsao-ibovespa-api/main/backtest_results.json"

@app.get("/")
def home():
    return {"status": "online"}

@app.get("/dados-reais")
def obter_dados():
    try:
        ticker = yf.Ticker("^BVSP")
        # period="1mo" é rápido e não estoura limites de API
        df = ticker.history(period="1mo")
        if df.empty: 
            return {"error": "Dados indisponíveis"}
        
        historico = [{"data": i.strftime("%Y-%m-%d"), "fechamento": float(r['Close'])} for i, r in df.iterrows()]
        return {
            "mma_20": float(df['Close'].rolling(20).mean().iloc[-1]),
            "mma_50": float(df['Close'].rolling(50).mean().iloc[-1]),
            "historico": historico
        }
    except Exception as e:
        return {"error": f"Erro interno: {str(e)}"}

@app.get("/backtest")
def obter_backtest():
    try:
        # Busca direta do arquivo JSON no seu GitHub
        response = requests.get(BACKTEST_URL, timeout=10)
        return response.json()
    except Exception as e:
        return {"error": f"Erro ao buscar backtest: {str(e)}"}