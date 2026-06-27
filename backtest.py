import pandas as pd
import yfinance as yf
import numpy as np
from datetime import datetime

def rodar_backtest():
    print("🤖 Iniciando cálculo real do Backtest...")
    
    # 1. Baixa os dados do Ibovespa (2 anos para ter uma boa base histórica)
    ticker = yf.Ticker("^BVSP")
    df = ticker.history(period="2y")
    
    if df.empty:
        return {"error": "Dados indisponíveis"}
    
    # 2. Calcula os indicadores técnicos (idêntico ao main.py)
    df['MMA_20'] = df['Close'].rolling(window=20).mean()
    df['MMA_50'] = df['Close'].rolling(window=50).mean()
    df['Retorno'] = df['Close'].pct_change()
    
    # Cálculo do RSI de 14 dias
    delta = df['Close'].diff()
    ganho = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    perda = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = ganho / (perda + 1e-10)
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # Remove os valores nulos gerados pelas janelas iniciais (rolling)
    df = df.dropna()
    
    # 3. Lógica do Sinal e do Target Real
    # Sinal do cruzamento de médias (1 se MMA_20 > MMA_50, senão 0)
    df['Sinal'] = (df['MMA_20'] > df['MMA_50']).astype(int)
    
    # Target Real: O mercado realmente SUBIU no dia seguinte? (1 se sim, 0 se não)
    df['Target_Real'] = (df['Close'].shift(-1) > df['Close']).astype(int)
    
    # Acurácia: Quantas vezes o nosso Sinal bateu com o movimento real do dia seguinte
    df_valido = df.dropna().copy()
    acertos = (df_valido['Sinal'] == df_valido['Target_Real']).sum()
    total = len(df_valido)
    acuracia_real = float(acertos / total) if total > 0 else 0.50
    
    # 4. Simulação de Performance Financeira (Retorno Acumulado)
    # Retorno da estratégia Buy & Hold (Apenas segurar o ativo)
    df_valido['Retorno_BH_Acumulado'] = (1 + df_valido['Retorno']).cumprod() - 1
    
    # Retorno da Estratégia da IA (Se o sinal de hoje for 1, pegamos o retorno de amanhã. Se for 0, rendimento é 0)
    df_valido['Estrategia_Retorno'] = df_valido['Sinal'].shift(1) * df_valido['Retorno']
    df_valido['Estrategia_Retorno'] = df_valido['Estrategia_Retorno'].fillna(0)
    df_valido['Retorno_IA_Acumulado'] = (1 + df_valido['Estrategia_Retorno']).cumprod() - 1
    
    # Seleciona os últimos 30 dias para exibir no gráfico do Frontend
    df_recente = df_valido.tail(30)
    
    # 5. Formata o resultado final estruturado em JSON
    resultado = {
        "acuracia": round(acuracia_real, 3),
        "retorno_ia": f"+{round(df_valido['Retorno_IA_Acumulado'].iloc[-1] * 100, 1)}%",
        "retorno_ibov": f"+{round(df_valido['Retorno_BH_Acumulado'].iloc[-1] * 100, 1)}%",
        "data_atualizacao": datetime.now().strftime("%d/%m/%Y"),
        "evolucao": [
            {
                "data": idx.strftime("%Y-%m-%d"), 
                "estrategia": round(float(row['Retorno_IA_Acumulado'] * 100), 2), 
                "buy_and_hold": round(float(row['Retorno_BH_Acumulado'] * 100), 2)
            } 
            for idx, row in df_recente.iterrows()
        ]
    }
    
    return resultado