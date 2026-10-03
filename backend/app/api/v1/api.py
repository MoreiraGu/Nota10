from fastapi import APIRouter
from app.api.v1 import auth, cursos, disciplinas, estudantes, professores, turmas
 
api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(estudantes.router)
api_router.include_router(professores.router)
api_router.include_router(cursos.router)
api_router.include_router(turmas.router)
api_router.include_router(disciplinas.router)