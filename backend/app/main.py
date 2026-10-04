from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.database import engine
import app.models  # noqa: F401 – garante que todos os models sejam registrados no metadata
from app.core.database import Base
from app.api.v1.api import api_router

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Cria as tabelas no banco de dados (dev/test com SQLite).
    # Em produção com PostgreSQL, usar Alembic para migrations.
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — permite requisições do frontend React em dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Handler global de validação Pydantic → retorna envelope { detail, code, fields }
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    fields = {}
    for error in exc.errors():
        loc = " → ".join(str(l) for l in error["loc"] if l != "body")
        fields[loc] = error["msg"]
    return JSONResponse(
        status_code=400,
        content={
            "detail": "Dados de entrada inválidos",
            "code": "VALIDATION_ERROR",
            "fields": fields,
        },
    )


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}
