from fastapi import FastAPI

app = FastAPI(title="Nota 10 - Sistema de Gestao Academica")


@app.get("/")
def read_root():
    return {"message": "API Nota 10 - Base pronta"}
