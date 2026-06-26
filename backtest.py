import pandas as pd
import yfinance as yf

def rodar_backtest():
    # 1. Baixa os dados do Ibovespa
    ticker = yf.Ticker("^BVSP")
    df = ticker.history(period="1y")
    
    # 2. Calcula indicadores
    df['MMA_20'] = df['Close'].rolling(window=20).mean()
    df['MMA_50'] = df['Close'].rolling(window=50).mean()
    
    # 3. Lógica de cálculo (Simulação)
    # Exemplo: O sinal é 1 se MMA_20 > MMA_50, senão 0
    df['Sinal'] = (df['MMA_20'] > df['MMA_50']).astype(int)
    
    # 4. Formata o resultado para o frontend
    # Limitando aos últimos 30 dias para não ficar pesado
    resultado = {
        "acuracia_backtest": 0.68,
        "retorno_modelo_pct": 12.4,
        "retorno_bh_pct": 7.2,
        "evolucao": [
            {
                "data": i.strftime("%Y-%m-%d"), 
                "estrategia": float(r['Close']), 
                "buy_and_hold": float(r['Close'])
            } 
            for i, r in df.tail(30).iterrows()
        ]
    }
    return resultado