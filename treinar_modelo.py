import os
import yfinance as yf
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier

def treinar_e_salvar_modelo():
    print("📥 Baixando histórico longo do Ibovespa para treinamento (5 anos)...")
    ticker = yf.Ticker("^BVSP")
    df = ticker.history(period="5y")
    
    if df.empty:
        print("❌ Erro: Não foi possível obter dados do Yahoo Finance.")
        return

    print("📊 Calculando indicadores técnicos (Features)...")
    # 1. Engenharia de Recursos (Features)
    df['MMA_20'] = df['Close'].rolling(window=20).mean()
    df['MMA_50'] = df['Close'].rolling(window=50).mean()
    df['Retorno'] = df['Close'].pct_change()
    
    # Cálculo do RSI de 14 dias
    delta = df['Close'].diff()
    ganho = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    perda = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = ganho / (perda + 1e-10)
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # 2. Definição do Target (1 se o fechamento de AMANHÃ for maior que o de hoje, senão 0)
    df['Target'] = (df['Close'].shift(-1) > df['Close']).astype(int)
    
    # Limpa linhas com valores nulos causados pelas janelas de cálculo
    df_limpo = df.dropna()
    
    # Separando Features (X) e Alvo (y)
    features = ['MMA_20', 'MMA_50', 'Retorno', 'RSI']
    X = df_limpo[features]
    y = df_limpo['Target']
    
    print(f"🧠 Treinando o modelo Random Forest com {len(df_limpo)} dias de histórico...")
    # Criando e treinando o classificador
    # Usamos max_depth para evitar que o modelo decore os dados (overfitting)
    modelo = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    modelo.fit(X, y)
    
    # 3. Salvando o modelo de forma persistente
    os.makedirs("modelos", exist_ok=True)
    caminho_modelo = "modelos/modelo_ibov.joblib"
    joblib.dump(modelo, caminho_modelo)  # <-- Corrigido aqui com o 'h'
    
    print(f"✅ Modelo treinado com sucesso e saved em: '{caminho_modelo}'!")