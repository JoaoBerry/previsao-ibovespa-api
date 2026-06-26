import json
from backtest import rodar_backtest

# Executa o backtest
dados = rodar_backtest(periodo_anos=1)

# Salva em um arquivo JSON
with open('backtest_results.json', 'w') as f:
    json.dump(dados, f)

print("Backtest gerado com sucesso em backtest_results.json")