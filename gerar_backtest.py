import json
from backtest import rodar_backtest

def principal():
    # Executa a função de cálculo
    dados = rodar_backtest()
    
    # Salva no formato JSON que sua API vai ler
    with open('backtest_results.json', 'w') as f:
        json.dump(dados, f, indent=4)
    
    print("Backtest gerado com sucesso em backtest_results.json")

if __name__ == "__main__":
    principal()