from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_perfil
from app.models.curso import Curso
from app.models.usuario import Perfil, Usuario

router = APIRouter(prefix="/cursos", tags=["Cursos"])

_somente_coordenacao = Depends(
    require_perfil(Perfil.COORDENACAO)
)


class CursoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str


@router.get("", response_model=list[CursoResponse], summary="Lista os cursos")
def listar_cursos(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> list[CursoResponse]:
    cursos = db.query(Curso).order_by(Curso.nome).all()
    return [CursoResponse(id=c.id, nome=c.nome) for c in cursos]