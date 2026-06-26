import os
import json
import joblib
import numpy as np
import yfinance as yf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Importando a função original caso o arquivo de cache falhe
from backtest import rodar_backtest

# 1. Configuração Inicial do FastAPI e CORS
app = FastAPI(
    title="Ibovespa AI Predictor API",
    description="API para predição de tendência do índice Ibovespa com cache de backtesting",
    version="1.4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Carregamento do Modelo
MODEL_PATH = os.path.join("modelos", "modelo_ibov.pkl")
try:
    modelo = joblib.load(MODEL_PATH)
except Exception:
    modelo = None

# 3. Modelagem de Dados
class PrevisaoInput(BaseModel):
    mma_20: float
    mma_50: float

# 4. Rota de Health Check
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

        historico_grafico = [
            {"data": i.strftime("%d/%m"), "fechamento": round(float(r['Close']), 2), 
             "mma_20": round(float(r['MMA_20']), 2), "mma_50": round(float(r['MMA_50']), 2)}
            for i, r in df_historico.iterrows()
        ]

        return {
            "data": ultima_linha.name.strftime("%Y-%m-%d"),
            "fechamento_atual": float(ultima_linha['Close']),
            "mma_20": float(ultima_linha['MMA_20']),
            "mma_50": float(ultima_linha['MMA_50']),
            "historico": historico_grafico
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 6. Rota de Predição
@app.post("/predict")
def predict(dados: PrevisaoInput):
    if modelo is None:
        raise HTTPException(status_code=503, detail="Modelo indisponível.")
    try:
        features = np.array([[dados.mma_20, dados.mma_50]])
        predicao = int(modelo.predict(features)[0])
        confianca = float(max(modelo.predict_proba(features)[0]))
        return {"predicao": predicao, "direcao": "ALTA" if predicao == 1 else "BAIXA", "probabilidade": confianca}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 7. Rota de Backtesting (Otimizada com Cache)
@app.get("/backtest")
def obter_backtest():
    try:
        # Tenta ler o resultado gerado pelo GitHub Actions
        with open('backtest_results.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Caso o arquivo ainda não exista, roda o cálculo em tempo real
        return rodar_backtest(periodo_anos=1)