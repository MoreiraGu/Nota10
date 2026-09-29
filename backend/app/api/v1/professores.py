from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_perfil
from app.core.security import hash_senha
from app.models.professor import Professor, SituacaoProfessor
from app.models.usuario import Perfil, Usuario
from app.schemas.professor import ProfessorCreate, ProfessorListItem, ProfessorResponse

router = APIRouter(prefix="/professores", tags=["Professores"])

_somente_coordenacao = Depends(require_perfil(Perfil.COORDENACAO))


@router.post(
    "",
    response_model=ProfessorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastra um novo professor",
    description=(
        "Cria o registro em `usuarios` (perfil PROFESSOR) + `professores`. "
        "Restrito à Coordenação. "
        "Retorna 409 se o e-mail já estiver cadastrado e "
        "400 para campos inválidos."
    ),
)
def criar_professor(
    body: ProfessorCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> ProfessorResponse:
    email_conflito = HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="E-mail já cadastrado",
    )

    if db.query(Usuario).filter(Usuario.email == body.email).first():
        raise email_conflito

    novo_usuario = Usuario(
        nome=body.nome,
        email=body.email,
        senha_hash=hash_senha(body.senha),
        perfil=Perfil.PROFESSOR,
        ativo=True,
    )
    db.add(novo_usuario)
    db.flush()  # obtém o id sem commitar

    novo_professor = Professor(
        usuario_id=novo_usuario.id,
        contato=body.contato.strip(),
        situacao=SituacaoProfessor.ATIVO,
    )
    db.add(novo_professor)

    try:
        db.commit()
    except IntegrityError:
        # Corrida entre duas requisições com o mesmo e-mail
        db.rollback()
        raise email_conflito

    db.refresh(novo_professor)

    return ProfessorResponse(
        id=novo_professor.id,
        usuario_id=novo_usuario.id,
        nome=novo_usuario.nome,
        email=novo_usuario.email,
        contato=novo_professor.contato or "",
        situacao=novo_professor.situacao.value,
    )


@router.get(
    "",
    response_model=list[ProfessorListItem],
    summary="Lista professores cadastrados",
    description="Retorna todos os professores (ativos e inativos), em ordem alfabética. Restrito à Coordenação.",
)
def listar_professores(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> list[ProfessorListItem]:
    professores = sorted(
        db.query(Professor).all(),
        key=lambda p: p.usuario.nome.lower(),
    )
    return [
        ProfessorListItem(
            id=p.id,
            nome=p.usuario.nome,
            email=p.usuario.email,
            contato=p.contato or "",
            situacao=p.situacao.value,
        )
        for p in professores
    ]