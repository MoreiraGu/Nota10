from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.curso import Curso
from app.models.usuario import Usuario

router = APIRouter(prefix="/cursos", tags=["Cursos"])


class CursoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str


@router.get("", response_model=list[CursoResponse], summary="Lista os cursos")
def listar_cursos(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, Depends(get_current_user)],
) -> list[CursoResponse]:
    cursos = db.query(Curso).order_by(Curso.nome).all()
    return [CursoResponse(id=c.id, nome=c.nome) for c in cursos]
