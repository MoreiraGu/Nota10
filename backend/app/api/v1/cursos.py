from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_perfil
from app.models.curso import Curso
from app.models.usuario import Perfil, Usuario
from app.schemas.curso import CursoCreate, CursoResponse

router = APIRouter(prefix="/cursos", tags=["Cursos"])

_somente_coordenacao = Depends(require_perfil(Perfil.COORDENACAO))


@router.post(
    "",
    response_model=CursoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastra um novo curso",
    description="Cadastra um curso. Restrito à Coordenação.",
)
def criar_curso(
    body: CursoCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> CursoResponse:
    curso = Curso(nome=body.nome)
    db.add(curso)
    db.commit()
    db.refresh(curso)
    return CursoResponse.model_validate(curso)


@router.get(
    "",
    response_model=list[CursoResponse],
    summary="Lista os cursos",
    description="Lista os cursos cadastrados em ordem alfabética. Restrito à Coordenação.",
)
def listar_cursos(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> list[CursoResponse]:
    cursos = db.query(Curso).order_by(Curso.nome).all()
    return [CursoResponse(id=c.id, nome=c.nome) for c in cursos]
