# Ibovespa AI Predictor 🚀

Uma aplicação Full-Stack MLOps que realiza a predição de tendências do índice Ibovespa utilizando Machine Learning, integrada a dados financeiros em tempo real e visualização dinâmica.

## 📈 Funcionalidades
- **Predição Inteligente:** Modelo Random Forest treinado para classificar tendências (Alta/Baixa).
- **Dados em Tempo Real:** Integração automática com a API do Yahoo Finance para coleta de indicadores (MMA_20 e MMA_50).
- **Dashboard Interativo:** Visualização de séries temporais históricas utilizando ApexCharts.
- **Análise de Confiança:** Cálculo de probabilidade da predição via `predict_proba`.

## 🛠️ Stack Tecnológica
- **Machine Learning:** Scikit-Learn, Pandas, NumPy.
- **Backend:** FastAPI (Python), CORS, Render (Cloud Deployment).
- **Frontend:** HTML5, Tailwind CSS, JavaScript, ApexCharts.
- **DevOps:** GitHub Pages para hospedagem estática.

## 🚀 Como acessar
Acesse o dashboard em tempo real aqui: [https://joaoberry.github.io/previsao-ibovespa-api/]

## 🛠️ Como rodar localmente (Desenvolvimento)
1. Clone o repositório.
2. **Backend:**
   ```bash
   pip install fastapi uvicorn yfinance scikit-learn joblib
   uvicorn main:app --reload

<img width="1550" height="1261" alt="Captura de tela 2026-06-26 002756" src="https://github.com/user-attachments/assets/17772fb0-e286-4f7b-adba-3c8c4c69b3da" />