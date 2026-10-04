from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.security import criar_access_token, verificar_senha
from app.models.usuario import Usuario
from app.schemas.usuario import LoginRequest, TokenResponse, UsuarioLogado

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login com JWT",
    description="Autentica usuário e emite token JWT.",
)
def login(
    dados: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    usuario = db.query(Usuario).filter(Usuario.email == dados.email).first()
    if not usuario or not verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
        )

    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo. Entre em contato com a Coordenação.",
        )

    token = criar_access_token(
        data={"sub": str(usuario.id), "perfil": usuario.perfil.value}
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        usuario_id=usuario.id,
        nome=usuario.nome,
        perfil=usuario.perfil,
    )


@router.get(
    "/me",
    response_model=UsuarioLogado,
    summary="Dados do usuário logado",
    description="Retorna perfil e identificador do usuário a partir do Bearer Token.",
)
def me(
    current_user: Annotated[Usuario, Depends(get_current_user)],
) -> UsuarioLogado:
    return UsuarioLogado(
        usuario_id=current_user.id,
        nome=current_user.nome,
        perfil=current_user.perfil,
    )
