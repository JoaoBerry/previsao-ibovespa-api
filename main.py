from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf

app = FastAPI()

# Configuração de CORS totalmente liberada para comunicação com o GitHub Pages
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo de dados que a rota /predict espera receber via POST
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
        # Buscamos 3 meses para garantir dados suficientes para o cálculo das médias
        df = ticker.history(period="3mo")
        if df.empty:
            return {"error": "Dados indisponíveis no Yahoo Finance"}
        
        # Calcula as colunas de médias móveis
        df['MMA_20'] = df['Close'].rolling(20).mean()
        df['MMA_50'] = df['Close'].rolling(50).mean()
        
        # Remove linhas com valores nulos (gerados no início do rolling)
        df_limpo = df.dropna()
        
        # Pega apenas os últimos 30 dias para o gráfico do frontend
        df_recent = df_limpo.tail(30)
        
        historico = [{"data": i.strftime("%Y-%m-%d"), "fechamento": float(r['Close'])} for i, r in df_recent.iterrows()]
        
        # Retorna os valores mais recentes das médias e o histórico do gráfico
        return {
            "mma_20": float(df_limpo['MMA_20'].iloc[-1]),
            "mma_50": float(df_limpo['MMA_50'].iloc[-1]),
            "historico": historico
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/predict")
def predict(dados: DadosPredicao):
    try:
        # Calcula a diferença percentual entre as duas médias informadas
        diferenca = abs(dados.mma_20 - dados.mma_50) / dados.mma_50
        
        # Define uma confiança dinâmica (base de 55% + proporcional ao afastamento, máxima de 94%)
        probabilidade_calculada = 0.55 + min(diferenca * 4, 0.39)
        
        # Lógica de tendência baseada no cruzamento clássico
        if dados.mma_20 > dados.mma_50:
            direcao = "ALTA"
        else:
            direcao = "BAIXA"
            
        return {
            "direcao": direcao,
            "probabilidade": round(probabilidade_calculada, 2)
        }
    except Exception as e:
        return {"error": str(e)}