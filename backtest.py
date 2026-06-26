import os
import joblib
import pandas as pd
import numpy as np
import yfinance as yf

def rodar_backtest(periodo_anos=1, capital_inicial=100000.0):
    """
    Simula a execução do modelo Random Forest no passado recente.
    Estratégia: Se o modelo prevê ALTA (1), "compramos" o índice. 
    Se prevê BAIXA (0), ficamos rendendo a 0% (fora do mercado) naquele dia.
    """
    # 1. Carregar o modelo treinado
    model_path = os.path.join("modelos", "modelo_ibov.pkl")
    if not os.path.exists(model_path):
        return {"erro": "Modelo não encontrado para o backtest."}
        
    modelo = joblib.load(model_path)
    
    # 2. Baixar dados históricos para o teste
    # Baixamos um pouco mais de tempo para calcular as médias móveis iniciais corretamente
    dias_historico = int(periodo_anos * 365) + 100
    ticker = yf.Ticker("^BVSP")
    df = ticker.history(period=f"{dias_historico}d")
    
    if df.empty or len(df) < 50:
        return {"erro": "Dados históricos insuficientes para o Yahoo Finance."}
        
    # 3. Engenharia de Features (Idêntica ao treino)
    df['MMA_20'] = df['Close'].rolling(window=20).mean()
    df['MMA_50'] = df['Close'].rolling(window=50).mean()
    
    # Alvo real do dia seguinte (para calcular o acerto da predição)
    # Retorno percentual do dia seguinte
    df['Retorno_Preco'] = df['Close'].pct_change()
    df['Alvo_Real'] = np.where(df['Retorno_Preco'].shift(-1) > 0, 1, 0)
    
    # Limpar valores nulos gerados pelas médias móveis
    df_teste = df.dropna().tail(int(periodo_anos * 252)).copy() # Aprox. 252 dias úteis por ano
    
    if len(df_teste) == 0:
        return {"erro": "Falha ao processar features do histórico."}

    # 4. Loop de Simulação (Algoritmo do Backtest)
    capital_estrategia = capital_inicial
    capital_bh = capital_inicial # Buy & Hold (Apenas comprar e segurar)
    
    preco_inicial_bh = df_teste['Close'].iloc[0]
    
    acertos = 0
    total_predicoes = 0
    historico_performance = []
    
    # Iteração eficiente linha a linha usando os índices do Pandas
    for i in range(len(df_teste) - 1):
        linha_atual = df_teste.iloc[i]
        proxima_linha = df_teste.iloc[i + 1]
        
        # Preparar inputs para o modelo
        features = np.array([[linha_atual['MMA_20'], linha_atual['MMA_50']]])
        
        # Predição da IA para o dia seguinte
        predicao = int(modelo.predict(features)[0])
        alvo_real = int(linha_atual['Alvo_Real'])
        
        # Computar acurácia do modelo
        if predicao == alvo_real:
            acertos += 1
        total_predicoes += 1
        
        # Simulação Financeira
        retorno_dia_seguinte = proxima_linha['Retorno_Preco']
        
        # Se a IA previu ALTA, participamos do retorno do dia seguinte
        if predicao == 1:
            capital_estrategia *= (1 + retorno_dia_seguinte)
        # Se previu BAIXA, o capital da estratégia não muda (0% de retorno no dia)
            
        # Evolução do Buy & Hold clássico (segue o preço bruto do ativo)
        capital_bh = capital_inicial * (proxima_linha['Close'] / preco_inicial_bh)
        
        # Guardar dados para o gráfico do frontend
        historico_performance.append({
            "data": proxima_linha.name.strftime("%d/%m/%Y"),
            "estrategia": round(capital_estrategia, 2),
            "buy_and_hold": round(capital_bh, 2)
        })
        
    acuracia_final = (acertos / total_predicoes) if total_predicoes > 0 else 0
    retorno_estrategia_pct = ((capital_estrategia - capital_inicial) / capital_inicial) * 100
    retorno_bh_pct = ((capital_bh - capital_inicial) / capital_inicial) * 100
    
    return {
        "acuracia_backtest": round(acuracia_final, 4),
        "retorno_modelo_pct": round(retorno_estrategia_pct, 2),
        "retorno_bh_pct": round(retorno_bh_pct, 2),
        "evolucao": historico_performance
    }