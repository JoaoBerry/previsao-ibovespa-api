from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf

app = FastAPI()

# CORS 100% liberado para evitar bloqueios no GitHub Pages
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo de dados que a rota /predict espera receber do JavaScript
class DadosPredicao(BaseModel):
    mma_20: float
    mma_50: float

@app.get("/")
def home():
    return {"status": "online"}

@app.get("/dados-reais")
def obter_dados():
    try:
        ticker = yf.Ticker("^BVSP")
        df = ticker.history(period="1mo")
        if df.empty:
            return {"error": "Dados indisponíveis"}
        
        historico = [{"data": i.strftime("%Y-%m-%d"), "fechamento": float(r['Close'])} for i, r in df.iterrows()]
        
        # Valores atuais para preenchimento automático
        return {
            "mma_20": float(df['Close'].rolling(20).mean().iloc[-1]),
            "mma_50": float(df['Close'].rolling(50).mean().iloc[-1]),
            "historico": historico
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/predict")
def predict(dados: DadosPredicao):
    # Se a média curta (20) estiver acima da longa (50), tendência de ALTA
    if dados.mma_20 > dados.mma_50:
        direcao = "ALTA"
        probabilidade = 0.76
    else:
        direcao = "BAIXA"
        probabilidade = 0.68

    return {
        "direcao": direcao,
        "probabilidade": probabilidade
    }