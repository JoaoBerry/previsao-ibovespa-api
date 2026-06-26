from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configuração essencial para permitir requisições do seu site
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://joaoberry.github.io"], # Adicione o seu domínio específico aqui
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/dados-reais")
def obter_dados():
    # Sua lógica para obter os dados aqui
    return {"status": "sucesso", "dados": []}