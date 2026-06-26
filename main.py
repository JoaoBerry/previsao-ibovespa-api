from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import yfinance as yf

# Inicializa o FastAPI
app = FastAPI(
    title="Ibovespa Predictor API 📈",
    description="API para prever a tendência do Ibovespa usando Machine Learning.",
    version="1.1.0"
)

# Configuração do CORS para permitir a comunicação com o Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Carrega o modelo do arquivo .pkl
try:
    modelo = joblib.load('modelos/modelo_ibov.pkl')
    print("🚀 Central de Inteligência: Modelo carregado com sucesso!")
except Exception as e:
    print(f"❌ Erro crítico ao carregar o modelo: {e}")
    modelo = None

# Schema de Entrada para a predição manual
class DadosMercado(BaseModel):
    mma_20: float
    mma_50: float

@app.get("/")
def home():
    return {
        "status": "API Operacional", 
        "modelo_carregado": modelo is not None
    }

# NOVA ROTA: Busca dados reais do Yahoo Finance e calcula as médias móveis atuais
@app.get("/dados-reais")
def obter_dados_reais():
    try:
        ticker = yf.Ticker("^BVSP")
        dados = ticker.history(period="3mo")
        
        if dados.empty:
            raise HTTPException(status_code=502, detail="Não foi possível obter dados do Yahoo Finance.")
        
        # Calcula as médias móveis baseadas no fechamento
        dados['MMA_20'] = dados['Close'].rolling(window=20).mean()
        dados['MMA_50'] = dados['Close'].rolling(window=50).mean()
        
        # Pega o registro mais recente
        ultima_linha = dados.iloc[-1]
        
        return {
            "status": "success",
            "data": ultima_linha.name.strftime('%d/%m/%Y'),
            "mma_20": round(float(ultima_linha['MMA_20']), 2),
            "mma_50": round(float(ultima_linha['MMA_50']), 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao processar dados de mercado: {str(e)}")

# Rota de Predição
@app.post("/predict")
def prever_tendencia(dados: DadosMercado):
    if not modelo:
        raise HTTPException(status_code=500, detail="O modelo de ML não está disponível no servidor.")
    
    try:
        input_data = np.array([[dados.mma_20, dados.mma_50]])
        predicao = modelo.predict(input_data)
        classe_resultado = int(predicao[0])
        tendencia = "Alta" if classe_resultado == 1 else "Baixa"
        
        return {
            "status": "success",
            "codigo_predicao": classe_resultado,
            "tendencia_prevista": tendencia
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar a previsão: {str(e)}")