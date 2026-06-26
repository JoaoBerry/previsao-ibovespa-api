from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        # 3 meses garante histórico suficiente para calcular as médias sem dar NaN
        df = ticker.history(period="3mo")
        if df.empty:
            return {"error": "Dados indisponíveis"}
        
        # Calcula as médias móveis salvando em colunas
        df['MMA_20'] = df['Close'].rolling(20).mean()
        df['MMA_50'] = df['Close'].rolling(50).mean()
        
        # Filtra os últimos 30 dias para o gráfico não ficar gigante, tirando os NaN
        df_recent = df.tail(30).dropna()
        
        historico = [{"data": i.strftime("%Y-%m-%d"), "fechamento": float(r['Close'])} for i, r in df_recent.iterrows()]
        
        return {
            "mma_20": float(df['MMA_20'].iloc[-1]),
            "mma_50": float(df['MMA_50'].iloc[-1]),
            "historico": historico
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/predict")
def predict(dados: DadosPredicao):
    if dados.mma_20 > dados.mma_50:
        return {"direcao": "ALTA", "probabilidade": 0.76}
    return {"direcao": "BAIXA", "probabilidade": 0.68}