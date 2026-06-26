import pandas as pd
import yfinance as yf
import json
import os

# Função que faz o trabalho "pesado" (o que demora)
def calcular_e_salvar_backtest():
    print("Iniciando cálculo pesado do backtest...")
    
    # 1. Baixa os dados
    df = yf.Ticker("^BVSP").history(period="1y")
    df['MMA_20'] = df['Close'].rolling(window=20).mean()
    df['MMA_50'] = df['Close'].rolling(window=50).mean()
    
    # 2. Simulação simples (Lógica de exemplo)
    df['Sinal'] = (df['MMA_20'] > df['MMA_50']).astype(int)
    
    # 3. Formata os dados para o seu gráfico
    # Aqui você deve extrair os dados necessários para o seu frontend
    resultado = {
        "acuracia_backtest": 0.65, # Exemplo
        "retorno_modelo_pct": 15.2,
        "retorno_bh_pct": 8.5,
        "evolucao": [
            {"data": i.strftime("%Y-%m-%d"), "estrategia": float(r['Close']), "buy_and_hold": float(r['Close'])} 
            for i, r in df.tail(30).iterrows()
        ]
    }
    
    # 4. SALVA EM ARQUIVO (A mágica da velocidade)
    with open('backtest_results.json', 'w') as f:
        json.dump(resultado, f)
    
    print("Arquivo backtest_results.json atualizado com sucesso!")

# Função que a API chamará (esta é instantânea)
def ler_backtest():
    if os.path.exists('backtest_results.json'):
        with open('backtest_results.json', 'r') as f:
            return json.load(f)
    else:
        # Se o arquivo não existir, roda o cálculo uma vez
        calcular_e_salvar_backtest()
        return ler_backtest()