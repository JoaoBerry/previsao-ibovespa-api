# Ibovespa AI Predictor 📈🤖

Uma aplicação fullstack orientada a dados (MLES) que coleta dados em tempo real da Bolsa de Valores (B3), calcula indicadores técnicos e utiliza um modelo de Machine Learning para prever a tendência do índice Ibovespa.

---

## 🏗️ Arquitetura do Sistema

O projeto foi desenhado seguindo as melhores práticas de engenharia de machine learning (MLOps), dividindo-se em três camadas principais:

1. **Pipeline de Dados & IA (Backend):** Uma API desenvolvida em **FastAPI** que encapsula um modelo preditivo **RandomForestClassifier** (treinado previamente via Scikit-Learn). O backend consome a API do Yahoo Finance (`yfinance`) para obter dados históricos reais e calcular as médias móveis dinamicamente.
2. **Interface do Usuário (Frontend):** Um dashboard responsivo construído com **HTML5**, **JavaScript Vanilla (Async/Fetch)** e **Tailwind CSS**, que consome os microsserviços do backend.
3. **Automação:** Carregamento automático dos dados de fechamento do mercado atual ao abrir a tela, permitindo também simulações manuais através do painel.

---

## 🛠️ Tecnologias Utilizadas

* **Python 3**
* **FastAPI** (Construção da API REST)
* **Scikit-Learn & Joblib** (Inteligência Artificial e persistência de modelo)
* **YFinance** (Coleta de dados financeiros em tempo real)
* **Tailwind CSS** (Estilização da interface)
* **Uvicorn** (Servidor ASGI)

---

## 📂 Estrutura do Projeto

previsao-ibovespa-api/
├── frontend/
│   ├── index.html        # Interface visual do Dashboard
│   └── app.js            # Lógica de integração e Fetch com a API
├── modelos/
│   └── modelo_ibov.pkl   # Arquivo físico do modelo RandomForest
├── main.py               # Servidor Backend FastAPI com as rotas
└── README.md             # Documentação do projeto

---

## 🚀 Como Executar o Projeto

### 1. Clonar o Repositório e Instalar Dependências

Para rodar este projeto localmente, clone o repositório e instale as dependências listadas abaixo:

git clone https://github.com/seu-usuario/previsao-ibovespa-api.git
cd previsao-ibovespa-api
pip install fastapi uvicorn joblib numpy scikit-learn yfinance requests

### 2. Iniciar o Servidor da API (Backend)

Inicie o servidor local através do Uvicorn executando o seguinte comando no terminal:

uvicorn main:app --reload

A API estará rodando ativamente no endereço: http://127.0.0.1:8000

### 3. Abrir o Dashboard (Frontend)

Com o backend ligado, abra o arquivo "frontend/index.html" utilizando a extensão Live Server do VS Code ou executando o arquivo diretamente no navegador de sua preferência. A aplicação carregará e consumirá automaticamente os dados atualizados do mercado financeiro.