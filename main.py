import os
import joblib
import numpy as np
import yfinance as yf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 1. Configuração Inicial do FastAPI e CORS
app = FastAPI(
    title="Ibovespa AI Predictor API",
    description="API para predição de tendência do índice Ibovespa usando Machine Learning",
    version="1.0.0"
)

# Liberação do CORS para que o GitHub Pages consiga fazer requisições sem bloqueios de segurança
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Carregamento do Modelo de Machine Learning Treinado
MODEL_PATH = os.path.join("modelos", "modelo_ibov.pkl")

try:
    modelo = joblib.load(MODEL_PATH)
    print("🚀 Central de Inteligência: Modelo carregado com sucesso!")
except Exception as e:
    print(f"⚠️ Erro crítico ao carregar o modelo em '{MODEL_PATH}': {e}")
    modelo = None

# 3. Modelagem dos Dados de Entrada (Pydantic)
class PrevisaoInput(BaseModel):
    mma_20: float
    mma_50: float

# 4. Rota Base de Verificação (Health Check)
@app.get("/")
def home():
    return {
        "status": "API Operacional",
        "modelo_carregado": modelo is not None
    }

# 5. Rota Automatizada: Coleta de dados reais da B3 via Yahoo Finance
@app.get("/dados-reais")
def obter_dados_reais():
    try:
        # Busca o histórico recente do mini índice do Ibovespa (^BVSP)
        ticker = yf.Ticker("^BVSP")
        df = ticker.history(period="100d") # Puxa dias suficientes para calcular a média de 50

        if df.empty or len(df) < 50:
            raise HTTPException(status_code=500, detail="Histórico de dados insuficiente no Yahoo Finance.")

        # Calcula os indicadores técnicos com base nos fechamentos diários
        df['MMA_20'] = df['Close'].rolling(window=20).mean()
        df['MMA_50'] = df['Close'].rolling(window=50).mean()

        # Pega os valores válidos mais recentes (última linha)
        ultima_linha = df.dropna().iloc[-1]

        return {
            "data": ultima_linha.name.strftime("%Y-%m-%d"),
            "fechamento_atual": float(ultima_linha['Close']),
            "mma_20": float(ultima_linha['MMA_20']),
            "mma_50": float(ultima_linha['MMA_50'])
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao coletar dados do mercado: {str(e)}")

# 6. Rota do Simulador: Recebe as médias móveis e executa o Random Forest
@app.post("/predict")
def predict(dados: PrevisaoInput):
    if modelo is None:
        raise HTTPException(status_code=503, detail="Modelo preditivo indisponível no servidor.")

    try:
        # Organiza os inputs no formato de matriz bidimensional exigido pelo Scikit-Learn
        features = np.array([[dados.mma_20, dados.mma_50]])

        # Executa a predição da tendência (0 para BAIXA, 1 para ALTA)
        predicao = int(modelo.predict(features)[0])

        # Calcula a probabilidade associada a cada classe ([prob_baixa, prob_alta])
        probabilidades = modelo.predict_proba(features)[0]

        # Extrai a maior probabilidade (a confiança que o modelo tem na direção escolhida)
        confianca = float(max(probabilidades))

        return {
            "mma_20": dados.mma_20,
            "mma_50": dados.mma_50,
            "predicao": predicao,
            "direcao": "ALTA" if predicao == 1 else "BAIXA",
            "probabilidade": confianca
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno no processamento do modelo: {str(e)}")