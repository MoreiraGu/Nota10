from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_perfil
from app.models.curso import Curso
from app.models.disciplina import Disciplina, SituacaoDisciplina
from app.models.usuario import Perfil, Usuario
from app.schemas.disciplina import DisciplinaCreate, DisciplinaResponse

router = APIRouter(prefix="/disciplinas", tags=["Disciplinas"])

_somente_coordenacao = Depends(require_perfil(Perfil.COORDENACAO))


def _to_response(disciplina: Disciplina) -> DisciplinaResponse:
    return DisciplinaResponse(
        id=disciplina.id,
        nome=disciplina.nome,
        curso_id=disciplina.curso_id,
        curso=disciplina.curso.nome,
        situacao=disciplina.situacao.value,
    )


@router.post(
    "",
    response_model=DisciplinaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastra uma nova disciplina",
    description=(
        "Cadastra uma disciplina vinculada a um curso e com situação ATIVA. "
        "Restrito à Coordenação. Retorna 404 quando o curso não existe."
    ),
)
def criar_disciplina(
    body: DisciplinaCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> DisciplinaResponse:
    curso = db.query(Curso).filter(Curso.id == body.curso_id).first()
    if not curso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Curso {body.curso_id} não encontrado",
        )

    disciplina = Disciplina(
        nome=body.nome,
        curso_id=curso.id,
        situacao=SituacaoDisciplina.ATIVA,
    )
    db.add(disciplina)
    db.commit()
    db.refresh(disciplina)
    return _to_response(disciplina)


@router.get(
    "",
    response_model=list[DisciplinaResponse],
    summary="Lista as disciplinas",
    description="Lista as disciplinas cadastradas em ordem alfabética. Restrito à Coordenação.",
)
def listar_disciplinas(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> list[DisciplinaResponse]:
    disciplinas = db.query(Disciplina).order_by(Disciplina.nome).all()
    return [_to_response(disciplina) for disciplina in disciplinas]
