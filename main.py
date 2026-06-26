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
    version="1.1.0"
)

# Liberação do CORS para o GitHub Pages
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

# 5. Rota Automatizada: Coleta de dados reais e histórico para o Gráfico
@app.get("/dados-reais")
def obter_dados_reais():
    try:
        # Busca o histórico recente do mini índice do Ibovespa (^BVSP)
        ticker = yf.Ticker("^BVSP")
        df = ticker.history(period="120d") # Dias extras para garantir o cálculo das médias estáveis

        if df.empty or len(df) < 50:
            raise HTTPException(status_code=500, detail="Histórico de dados insuficiente no Yahoo Finance.")

        # Calcula os indicadores técnicos
        df['MMA_20'] = df['Close'].rolling(window=20).mean()
        df['MMA_50'] = df['Close'].rolling(window=50).mean()

        # Remove linhas com valores nulos (gerados pelo rolling inicial)
        df_limpo = df.dropna()

        # Pega a linha mais recente do mercado (para os inputs do simulador)
        ultima_linha = df_limpo.iloc[-1]

        # Pega os últimos 30 registros para gerar a linha temporal do gráfico
        df_historico = df_limpo.tail(30)

        # Estrutura a lista histórica de forma simples para o JavaScript ler
        historico_grafico = []
        for index, row in df_historico.iterrows():
            historico_grafico.append({
                "data": index.strftime("%d/%m"), # Formato simplificado (Dia/Mês)
                "fechamento": round(float(row['Close']), 2),
                "mma_20": round(float(row['MMA_20']), 2),
                "mma_50": round(float(row['MMA_50']), 2)
            })

        return {
            "data": ultima_linha.name.strftime("%Y-%m-%d"),
            "fechamento_atual": float(ultima_linha['Close']),
            "mma_20": float(ultima_linha['MMA_20']),
            "mma_50": float(ultima_linha['MMA_50']),
            "historico": historico_grafico # <- Nova lista enviada em lote!
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao coletar dados do mercado: {str(e)}")

# 6. Rota do Simulador: Recebe as médias móveis e executa o Random Forest
@app.post("/predict")
def predict(dados: PrevisaoInput):
    if modelo is None:
        raise HTTPException(status_code=503, detail="Modelo preditivo indisponível no servidor.")

    try:
        features = np.array([[dados.mma_20, dados.mma_50]])

        # Executa a predição da tendência
        predicao = int(modelo.predict(features)[0])

        # Calcula a probabilidade associada a cada classe
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
        raise HTTPException(status_code=500, detail=f"Erro interno no processamento do modelo: {str(e)}")