from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import yfinance as yf
import traceback

app = FastAPI()

# Configuração de CORS para permitir que seu site acesse a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# URL do arquivo JSON gerado pelo seu GitHub Actions
BACKTEST_URL = "https://raw.githubusercontent.com/JoaoBerry/previsao-ibovespa-api/main/backtest_results.json"

@app.get("/")
def home():
    return {"status": "online"}

@app.get("/dados-reais")
def obter_dados():
    try:
        # Tenta buscar os dados do Ibovespa
        ticker = yf.Ticker("^BVSP")
        df = ticker.history(period="1mo")
        
        if df.empty:
            return {"error": "Dados indisponíveis", "historico": []}
            
        historico = [{"data": i.strftime("%Y-%m-%d"), "fechamento": float(r['Close'])} for i, r in df.iterrows()]
        
        return {
            "mma_20": float(df['Close'].rolling(20).mean().iloc[-1]),
            "mma_50": float(df['Close'].rolling(50).mean().iloc[-1]),
            "historico": historico
        }
    except Exception:
        # Se falhar (ex: limite da API), retorna vazio em vez de erro 500
        return {"error": "Dados indisponíveis", "historico": []}

@app.get("/backtest")
def obter_backtest():
    try:
        # Lê o arquivo pronto do GitHub (instantâneo e sem timeout)
        response = requests.get(BACKTEST_URL, timeout=10)
        return response.json()
    except Exception as e:
        return {"error": "Erro ao buscar backtest", "detalhes": str(e)}

@app.post("/predict")
def prever(dados: dict):
    # Lógica de inferência rápida
    mma_20 = dados.get("mma_20", 0)
    mma_50 = dados.get("mma_50", 0)
    
    tendencia = "ALTA" if mma_20 > mma_50 else "BAIXA"
    return {
        "predicao": 1 if mma_20 > mma_50 else 0,
        "direcao": tendencia,
        "probabilidade": 0.85
    }