import os
import joblib
import numpy as np
import yfinance as yf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Importando o nosso novo módulo de simulação
from backtest import rodar_backtest

# 1. Configuração Inicial do FastAPI e CORS
app = FastAPI(
    title="Ibovespa AI Predictor API",
    description="API para predição de tendência do índice Ibovespa usando Machine Learning",
    version="1.3.0"
)

# Liberação do CORS para o GitHub Pages
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Carregamento do Modelo de Machine Learning
MODEL_PATH = os.path.join("modelos", "modelo_ibov.pkl")

try:
    modelo = joblib.load(MODEL_PATH)
    print("🚀 Central de Inteligência: Modelo carregado com sucesso!")
except Exception as e:
    print(f"⚠️ Erro crítico ao carregar o modelo em '{MODEL_PATH}': {e}")
    modelo = None

# 3. Modelagem dos Dados de Entrada
class PrevisaoInput(BaseModel):
    mma_20: float
    mma_50: float

# 4. Rota Base de Verificação (Health Check otimizada para UptimeRobot)
@app.api_route("/", methods=["GET", "HEAD"], include_in_schema=False)
def home():
    return {"status": "API Operacional", "modelo_carregado": modelo is not None}

# 5. Rota de dados reais
@app.get("/dados-reais")
def obter_dados_reais():
    try:
        ticker = yf.Ticker("^BVSP")
        df = ticker.history(period="120d")

        if df.empty or len(df) < 50:
            raise HTTPException(status_code=500, detail="Histórico insuficiente.")

        df['MMA_20'] = df['Close'].rolling(window=20).mean()
        df['MMA_50'] = df['Close'].rolling(window=50).mean()
        df_limpo = df.dropna()

        ultima_linha = df_limpo.iloc[-1]
        df_historico = df_limpo.tail(30)

        historico_grafico = []
        for index, row in df_historico.iterrows():
            historico_grafico.append({
                "data": index.strftime("%d/%m"),
                "fechamento": round(float(row['Close']), 2),
                "mma_20": round(float(row['MMA_20']), 2),
                "mma_50": round(float(row['MMA_50']), 2)
            })

        return {
            "data": ultima_linha.name.strftime("%Y-%m-%d"),
            "fechamento_atual": float(ultima_linha['Close']),
            "mma_20": float(ultima_linha['MMA_20']),
            "mma_50": float(ultima_linha['MMA_50']),
            "historico": historico_grafico
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no Yahoo Finance: {str(e)}")

# 6. Rota de Predição
@app.post("/predict")
def predict(dados: PrevisaoInput):
    if modelo is None:
        raise HTTPException(status_code=503, detail="Modelo indisponível.")

    try:
        features = np.array([[dados.mma_20, dados.mma_50]])
        predicao = int(modelo.predict(features)[0])
        probabilidades = modelo.predict_proba(features)[0]
        confianca = float(max(probabilidades))

        return {
            "mma_20": dados.mma_20,
            "mma_50": dados.mma_50,
            "predicao": predicao,
            "direcao": "ALTA" if predicao == 1 else "BAIXA",
            "probabilidade": confianca
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")

# 7. Rota de Avaliação Histórica (Backtesting)
@app.get("/backtest")
def obter_backtest():
    resultado = rodar_backtest(periodo_anos=1)
    if "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    return resultado