from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_perfil
from app.core.security import hash_senha
from app.models.professor import Professor, SituacaoProfessor
from app.models.usuario import Perfil, Usuario
from app.schemas.professor import (
    ProfessorCreate,
    ProfessorListItem,
    ProfessorResponse,
    ProfessorUpdate,
)

router = APIRouter(prefix="/professores", tags=["Professores"])

_somente_coordenacao = Depends(require_perfil(Perfil.COORDENACAO))


def _email_conflito() -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado")


def _obter_ou_404(db: Session, professor_id: int) -> Professor:
    professor = db.query(Professor).filter(Professor.id == professor_id).first()
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professor não encontrado")
    return professor


def _to_response(p: Professor) -> ProfessorResponse:
    return ProfessorResponse(
        id=p.id,
        usuario_id=p.usuario_id,
        nome=p.usuario.nome,
        email=p.usuario.email,
        contato=p.contato or "",
        situacao=p.situacao.value,
    )


# ── Criar ────────────────────────────────────────────────────────────────

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
    if db.query(Usuario).filter(Usuario.email == body.email).first():
        raise _email_conflito()

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
        raise _email_conflito()

    db.refresh(novo_professor)
    return _to_response(novo_professor)


# ── Listar ───────────────────────────────────────────────────────────────

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


# ── Obter ────────────────────────────────────────────────────────────────

@router.get(
    "/{professor_id}",
    response_model=ProfessorResponse,
    summary="Obtém professor por ID",
    description="Retorna os detalhes do professor. Restrito à Coordenação. 404 se não existir.",
)
def obter_professor(
    professor_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> ProfessorResponse:
    return _to_response(_obter_ou_404(db, professor_id))


# ── Atualizar ────────────────────────────────────────────────────────────

@router.put(
    "/{professor_id}",
    response_model=ProfessorResponse,
    summary="Atualiza professor por ID",
    description=(
        "Atualiza apenas os campos enviados (nome, e-mail, senha, contato, situação). "
        "Enviar `situacao` = `INATIVO` desativa também o login; `ATIVO` reativa. "
        "Restrito à Coordenação. 404 se não existir, 409 se o e-mail já for de outro usuário, "
        "400 para campos inválidos."
    ),
)
def atualizar_professor(
    professor_id: int,
    body: ProfessorUpdate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> ProfessorResponse:
    professor = _obter_ou_404(db, professor_id)
    usuario = professor.usuario

    if body.email is not None and body.email != usuario.email:
        duplicado = (
            db.query(Usuario)
            .filter(Usuario.email == body.email, Usuario.id != usuario.id)
            .first()
        )
        if duplicado:
            raise _email_conflito()
        usuario.email = body.email

    if body.nome is not None:
        usuario.nome = body.nome

    if body.contato is not None:
        professor.contato = body.contato.strip()

    if body.senha is not None:
        usuario.senha_hash = hash_senha(body.senha)

    if body.situacao is not None:
        professor.situacao = SituacaoProfessor(body.situacao)
        usuario.ativo = body.situacao == "ATIVO"

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _email_conflito()

    db.refresh(professor)
    return _to_response(professor)


# ── Inativar ─────────────────────────────────────────────────────────────

@router.patch(
    "/{professor_id}/inativar",
    response_model=ProfessorResponse,
    summary="Inativa professor",
    description=(
        "Define a situação como INATIVO e desativa o login. Os lançamentos anteriores "
        "permanecem registrados. Restrito à Coordenação."
    ),
)
def inativar_professor(
    professor_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> ProfessorResponse:
    professor = _obter_ou_404(db, professor_id)
    professor.situacao = SituacaoProfessor.INATIVO
    professor.usuario.ativo = False
    db.commit()
    db.refresh(professor)
    return _to_response(professor)