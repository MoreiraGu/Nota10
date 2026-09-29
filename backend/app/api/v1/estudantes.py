from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_perfil
from app.core.security import hash_senha
from app.models.curso import Curso
from app.models.estudante import Estudante, SituacaoEstudante
from app.models.usuario import Perfil, Usuario
from app.schemas.estudante import EstudanteCreate, EstudanteListItem, EstudanteResponse, EstudanteUpdate

router = APIRouter(prefix="/estudantes", tags=["Estudantes"])

_somente_coordenacao = Depends(require_perfil(Perfil.COORDENACAO))


@router.post(
    "",
    response_model=EstudanteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastra um novo estudante",
    description=(
        "Cria o registro em `usuarios` + `estudantes`. "
        "Restrito à Coordenação. "
        "Retorna 409 se o e-mail já estiver cadastrado, "
        "404 se o curso_id não existir, "
        "400 para campos inválidos."
    ),
)
def criar_estudante(
    body: EstudanteCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> EstudanteResponse:
    # 404 — curso inexistente
    curso = db.query(Curso).filter(Curso.id == body.curso_id).first()
    if not curso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Curso {body.curso_id} não encontrado",
        )

    # 409 — e-mail duplicado
    email_existente = db.query(Usuario).filter(Usuario.email == body.email).first()
    if email_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail já cadastrado",
        )

    # Cria usuario
    novo_usuario = Usuario(
        nome=body.nome,
        email=body.email,
        senha_hash=hash_senha(body.senha),
        perfil=Perfil.ALUNO,
        ativo=True,
    )
    db.add(novo_usuario)
    db.flush()  # obtém o id sem commitar

    # Cria estudante
    novo_estudante = Estudante(
        usuario_id=novo_usuario.id,
        curso_id=body.curso_id,
        contato=body.contato.strip(),
        situacao=SituacaoEstudante.ATIVO,
    )
    db.add(novo_estudante)
    db.commit()
    db.refresh(novo_estudante)

    return EstudanteResponse(
        id=novo_estudante.id,
        usuario_id=novo_usuario.id,
        nome=novo_usuario.nome,
        email=novo_usuario.email,
        contato=novo_estudante.contato or "",
        curso_id=novo_estudante.curso_id,
        situacao=novo_estudante.situacao.value,
    )


@router.get(
    "",
    response_model=list[EstudanteListItem],
    summary="Lista estudantes cadastrados",
    description="Retorna todos os estudantes (ativos e inativos). Restrito à Coordenação.",
)
def listar_estudantes(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> list[EstudanteListItem]:
    estudantes = db.query(Estudante).all()
    return [
        EstudanteListItem(
            id=e.id,
            nome=e.usuario.nome,
            email=e.usuario.email,
            curso_id=e.curso_id,
            curso=e.curso.nome if e.curso else "",
            situacao=e.situacao.value,
        )
        for e in estudantes
    ]


@router.get(
    "/{id}",
    response_model=EstudanteResponse,
    summary="Obtém estudante por ID",
    description="Retorna detalhes completos do estudante.",
)
def obter_estudante(
    id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> EstudanteResponse:
    estudante = db.query(Estudante).filter(Estudante.id == id).first()
    if not estudante:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estudante não encontrado")

    return EstudanteResponse(
        id=estudante.id,
        usuario_id=estudante.usuario_id,
        nome=estudante.usuario.nome,
        email=estudante.usuario.email,
        contato=estudante.contato or "",
        curso_id=estudante.curso_id,
        curso=estudante.curso.nome if estudante.curso else "",
        situacao=estudante.situacao.value,
    )


@router.put(
    "/{id}",
    response_model=EstudanteResponse,
    summary="Atualiza estudante por ID",
    description="Atualiza dados do estudante. Restrito à Coordenação.",
)
def atualizar_estudante(
    id: int,
    body: EstudanteUpdate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> EstudanteResponse:
    estudante = db.query(Estudante).filter(Estudante.id == id).first()
    if not estudante:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estudante não encontrado")

    if body.curso_id is not None:
        curso = db.query(Curso).filter(Curso.id == body.curso_id).first()
        if not curso:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Curso {body.curso_id} não encontrado")
        estudante.curso_id = body.curso_id

    if body.contato is not None:
        estudante.contato = body.contato.strip()

    if body.nome and estudante.usuario:
        estudante.usuario.nome = body.nome.strip()

    if body.email and estudante.usuario:
        duplicado = db.query(Usuario).filter(Usuario.email == body.email, Usuario.id != estudante.usuario_id).first()
        if duplicado:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já utilizado por outro usuário")
        estudante.usuario.email = body.email

    if body.senha and body.senha.strip():
        if len(body.senha.strip()) < 6:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Senha deve ter pelo menos 6 caracteres")
        if estudante.usuario:
            estudante.usuario.senha_hash = hash_senha(body.senha.strip())

    if body.situacao:
        sit_upper = body.situacao.upper()
        if sit_upper in SituacaoEstudante.__members__:
            estudante.situacao = SituacaoEstudante[sit_upper]
            if estudante.usuario:
                estudante.usuario.ativo = (sit_upper == "ATIVO")

    db.commit()
    db.refresh(estudante)

    return EstudanteResponse(
        id=estudante.id,
        usuario_id=estudante.usuario_id,
        nome=estudante.usuario.nome,
        email=estudante.usuario.email,
        contato=estudante.contato or "",
        curso_id=estudante.curso_id,
        curso=estudante.curso.nome if estudante.curso else "",
        situacao=estudante.situacao.value,
    )


@router.patch(
    "/{id}/inativar",
    response_model=EstudanteResponse,
    summary="Inativa estudante",
    description="Define situação como INATIVO e desativa usuário de login. Restrito à Coordenação.",
)
@router.delete(
    "/{id}",
    response_model=EstudanteResponse,
    summary="Inativa estudante (soft delete)",
)
def inativar_estudante(
    id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> EstudanteResponse:
    estudante = db.query(Estudante).filter(Estudante.id == id).first()
    if not estudante:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estudante não encontrado")

    estudante.situacao = SituacaoEstudante.INATIVO
    if estudante.usuario:
        estudante.usuario.ativo = False

    db.commit()
    db.refresh(estudante)

    return EstudanteResponse(
        id=estudante.id,
        usuario_id=estudante.usuario_id,
        nome=estudante.usuario.nome,
        email=estudante.usuario.email,
        contato="",
        curso_id=estudante.curso_id,
        curso=estudante.curso.nome if estudante.curso else "",
        situacao=estudante.situacao.value,
    )

